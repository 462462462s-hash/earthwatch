import type { Metadata } from "next";
import EarthquakeDetailClient from "./EarthquakeDetailClient";

const SITE_URL = "https://earthwatch-iihz-azure.vercel.app";

type Props = {
  params: Promise<{ id: string }>;
};

// Helper function to fetch USGS earthquake data safely on the server
async function fetchEarthquakeData(id: string) {
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

// Server-side dynamic metadata generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchEarthquakeData(id);
  
  const props = data?.properties || {};
  const place: string = props.place || "Unknown Location";
  const mag: number = typeof props.mag === "number" ? props.mag : 0;

  const title = `M${mag.toFixed(1)} Earthquake — ${place} | Quake Hub`;
  const description = `Live details for the M${mag.toFixed(1)} earthquake near ${place}: magnitude, depth, epicenter coordinates, tsunami advisory status, and real-time news coverage.`;

  return {
    title,
    description,
    alternates: { 
      canonical: `${SITE_URL}/earthquake/${id}` 
    },
    openGraph: {
      type: "article",
      url: `${SITE_URL}/earthquake/${id}`,
      title,
      description,
      siteName: "Quake Hub",
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `Seismic details for M${mag.toFixed(1)} earthquake near ${place}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const data = await fetchEarthquakeData(id);

  const props = data?.properties || {};
  const geometry = data?.geometry || {};
  const coords = geometry.coordinates || [0, 0, 0];

  // Schema.org Event structured data for Search Engines
  const eventLd = data ? {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": `M${(props.mag ?? 0).toFixed(1)} Earthquake near ${props.place || "Unknown Location"}`,
    "description": `Seismic event with a magnitude of ${(props.mag ?? 0).toFixed(1)} recorded at ${props.place || "Unknown Location"}.`,
    "startDate": props.time ? new Date(props.time).toISOString() : undefined,
    "location": {
      "@type": "Place",
      "name": props.place || "Unknown Location",
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": coords[1],
        "longitude": coords[0],
        "elevation": coords[2] ? `${-coords[2]} km` : undefined,
      },
    },
    "organizer": {
      "@type": "Organization",
      "name": "United States Geological Survey (USGS)",
      "url": "https://earthquake.usgs.gov",
    },
  } : null;

  return (
    <>
      {eventLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }}
        />
      )}
      <EarthquakeDetailClient />
    </>
  );
}