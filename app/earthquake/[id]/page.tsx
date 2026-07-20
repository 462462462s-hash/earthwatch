// This file remains a SERVER component.
import type { Metadata } from "next";
import EarthquakeDetailClient from "./EarthquakeDetailClient";

const SITE_URL = "https://earthwatch-iihz-azure.vercel.app";

// Modern Next.js routing parameters are processed as Promises
type Props = {
  params: Promise<{ id: string }>;
};

async function fetchEarthquake(id: string) {
  try {
    const res = await fetch(
      `https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/${id}.geojson`,
      { next: { revalidate: 120 } } // Cache metadata data endpoints for 2 minutes
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchEarthquake(id);
  const props = data?.properties;
  const coords = data?.geometry?.coordinates;

  if (!props) {
    return {
      title: "Earthquake Report Not Found | Quake Hub",
      description:
        "This earthquake record could not be located or has expired. Return to the live earthquake map to view current global seismic activity.",
    };
  }

  const place = props.place || "Unknown Location";
  const mag = typeof props.mag === "number" ? props.mag.toFixed(1) : "?";
  const time = props.time ? new Date(props.time).toUTCString() : "an unknown time";
  const lat = coords?.[1];
  const lon = coords?.[0];

  // SEO: longer, keyword-rich title including magnitude, place, and brand
  const title = `M${mag} Earthquake in ${place} — Live Report, Map & Real-Time Seismic Data | Quake Hub`;
  const description = `A magnitude ${mag} earthquake struck ${place} on ${time}. View live map coordinates, hypocenter depth, tsunami alert status, felt reports, and real-time seismic updates for this earthquake.`;
  const pageUrl = `${SITE_URL}/earthquake/${id}`;

  return {
    title,
    description,
    keywords: [
      `earthquake ${place}`,
      `magnitude ${mag} earthquake`,
      "earthquake report",
      "live earthquake map",
      "tsunami alert",
      "seismic activity",
    ],
    alternates: { canonical: pageUrl },
    // SEO: dynamic geo meta tags using this earthquake's real epicenter coordinates
    other:
      lat != null && lon != null
        ? {
            "geo.placename": place,
            "geo.position": `${lat};${lon}`,
            ICBM: `${lat}, ${lon}`,
          }
        : undefined,
    openGraph: {
      type: "article",
      title,
      description,
      url: pageUrl,
      publishedTime: props.time ? new Date(props.time).toISOString() : undefined,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `Map and live data for the M${mag} earthquake near ${place}` }],
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
  const { id } = await params;
  const data = await fetchEarthquake(id);
  const props = data?.properties;
  const coords = data?.geometry?.coordinates;

  const jsonLd = props
    ? {
        "@context": "https://schema.org",
        "@type": "Report",
        "name": `M${props.mag?.toFixed?.(1) ?? "?"} Earthquake Report — ${props.place}`,
        "description": `Seismic analysis details regarding the magnitude ${props.mag?.toFixed?.(1) ?? "?"} earthquake recorded near ${props.place}.`,
        "datePublished": props.time ? new Date(props.time).toISOString() : undefined,
        "about": coords
          ? {
              "@type": "Place",
              "name": props.place,
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": coords[1],
                "longitude": coords[0],
                "elevation": coords[2] ? `${coords[2]} km` : undefined,
              },
            }
          : undefined,
        "url": `${SITE_URL}/earthquake/${id}`,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          {/* SEO: raw geo meta tags in <head> for crawlers that don't parse Metadata API `other` field */}
          {coords && (
            <>
              <meta name="geo.placename" content={props.place} />
              <meta name="geo.position" content={`${coords[1]};${coords[0]}`} />
              <meta name="ICBM" content={`${coords[1]}, ${coords[0]}`} />
            </>
          )}
        </>
      )}
      <EarthquakeDetailClient />
    </>
  );
}