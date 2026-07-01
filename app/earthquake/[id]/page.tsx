// This file is a SERVER component (no "use client" at the top).
// It fetches earthquake data from USGS just for SEO metadata (title, description,
// social sharing preview), then renders EarthquakeDetailClient for the actual UI.
// Your page will look and behave exactly the same — this only improves Google ranking.

import type { Metadata } from "next";
import EarthquakeDetailClient from "./EarthquakeDetailClient";

const SITE_URL = "https://your-domain.com"; // ← CHANGE THIS to your real deployed URL

type Props = {
  params: { id: string };
};

// Fetch the quake once for SEO metadata — cached for 2 minutes
async function fetchEarthquake(id: string) {
  try {
    const res = await fetch(
      `https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/${id}.geojson`,
      { next: { revalidate: 120 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Next.js calls this automatically per page — generates a unique
// title/description/OG image for every single earthquake detail page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await fetchEarthquake(params.id);
  const props = data?.properties;

  if (!props) {
    return {
      title: "Earthquake Report Not Found",
      description: "This earthquake record could not be located.",
    };
  }

  const place = props.place || "Unknown Location";
  const mag = typeof props.mag === "number" ? props.mag.toFixed(1) : "?";
  const time = props.time ? new Date(props.time).toUTCString() : "an unknown time";

  const title = `M${mag} Earthquake — ${place}`;
  const description = `A magnitude ${mag} earthquake struck ${place} on ${time}. View live coordinates, depth, tsunami risk, USGS significance score, and the latest news coverage.`;
  const pageUrl = `${SITE_URL}/earthquake/${params.id}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "article",
      title,
      description,
      url: pageUrl,
      publishedTime: props.time ? new Date(props.time).toISOString() : undefined,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function EarthquakeDetailPage({ params }: Props) {
  const data = await fetchEarthquake(params.id);
  const props = data?.properties;
  const coords = data?.geometry?.coordinates;

  // Event structured data — helps Google show rich results for this specific quake
  const jsonLd = props
    ? {
        "@context": "https://schema.org",
        "@type": "Event",
        name: `M${props.mag?.toFixed?.(1) ?? "?"} Earthquake — ${props.place}`,
        startDate: props.time ? new Date(props.time).toISOString() : undefined,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
        location: coords
          ? {
              "@type": "Place",
              name: props.place,
              geo: {
                "@type": "GeoCoordinates",
                latitude: coords[1],
                longitude: coords[0],
              },
            }
          : undefined,
        url: `${SITE_URL}/earthquake/${params.id}`,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {/* Renders your full existing UI — nothing changes visually */}
      <EarthquakeDetailClient />
    </>
  );
}