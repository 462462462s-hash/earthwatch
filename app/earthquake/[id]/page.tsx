import type { Metadata } from "next";
import EarthquakeDetailClient from "./EarthquakeDetailClient";

const SITE_URL = "https://www.quakehub.com";

type Props = { params: { id: string } };

// Server-side metadata generation: fetches the same lightweight USGS record
// so each earthquake page gets its own unique, keyword-rich <title> and meta
// description instead of every detail page sharing one static tag.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const res = await fetch(
      `https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/${params.id}.geojson`,
      { next: { revalidate: 60 } }
    );
    const data = await res.json();
    const props = data?.properties || {};
    const place: string = props.place || "Unknown Location";
    const mag: number = props.mag ?? 0;

    const title = `M${mag.toFixed(1)} Earthquake — ${place} | Quake Hub`;
    const description = `Live details for the M${mag.toFixed(1)} earthquake near ${place}: magnitude, depth, epicenter coordinates, tsunami advisory status, and real-time news coverage.`;

    return {
      title,
      description,
      alternates: { canonical: `/earthquake/${params.id}` },
      openGraph: {
        type: "article",
        url: `${SITE_URL}/earthquake/${params.id}`,
        title,
        description,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Earthquake Report | Quake Hub",
      description: "Live earthquake report with magnitude, depth, epicenter, and tsunami advisory data, sourced from USGS.",
    };
  }
}

export default function Page() {
  return <EarthquakeDetailClient />;
}