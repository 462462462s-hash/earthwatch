import type { Metadata } from "next";
import { redirect } from "next/navigation";
import EarthquakeDetailClient from "./EarthquakeDetailClient";
import { SITE_URL } from "@/app/lib/seo";

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

function extractUsgsId(slug: string): string {
  if (!slug) return "";
  const parts = slug.split("-");
  return parts[parts.length - 1];
}

function buildCanonicalSlug(id: string, place: string, mag: number): string {
  const magStr = `m${mag.toFixed(1).replace(".", "-")}`;
  const cleanPlace = place
    .toLowerCase()
    .replace(/^\d+\s*km\s+[a-z]+\s+of\s+/i, "")
    .replace(/^off the coast of\s+/i, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return `${magStr}-${cleanPlace}-${id}`;
}

async function fetchEarthquakeData(slug: string) {
  const id = extractUsgsId(slug);
  if (!id) return null;

  try {
    const res = await fetch(
      `https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/${id}.geojson`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchEarthquakeData(id);
  const props = data?.properties || {};
  const place: string = props.place || "Unknown Location";
  const mag: number = typeof props.mag === "number" ? props.mag : 0;

  const formattedMag = mag.toFixed(1);
  const title = `M${formattedMag} Earthquake — ${place} | Quake Hub`;

  return {
    title,
    description: `Magnitude ${formattedMag} earthquake recorded near ${place}. View real-time seismic details, hypocenter metrics, and live updates.`,
    alternates: {
      canonical: `${SITE_URL}/earthquake/${id}`,
    },
  };
}

export default async function EarthquakeDetailPage({ params }: Props) {
  const { id: rawSlug } = await params;
  const data = await fetchEarthquakeData(rawSlug);

  // If user accesses /earthquake/us6000thvq directly, redirect to full slug
  if (data) {
    const usgsId = data.id;
    const mag = data.properties?.mag || 0;
    const place = data.properties?.place || "";
    const canonicalSlug = buildCanonicalSlug(usgsId, place, mag);

    if (rawSlug !== canonicalSlug) {
      redirect(`/earthquake/${canonicalSlug}`);
    }
  }

  return <EarthquakeDetailClient />;
}