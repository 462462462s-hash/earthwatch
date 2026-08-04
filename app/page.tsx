// app/page.tsx
import type { Metadata } from "next";
import HomeClient from "./components/Homeclient";
import {
  SITE_URL,
  FAQ_ITEMS,
  buildFaqSchema,
} from "./lib/seo";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Live Earthquake Map & Real-Time Tracker | USGS Data",
  description:
    "Track earthquakes happening right now worldwide. Real-time magnitude, depth, and location data sourced directly from USGS. Updated every minute.",
  keywords: [
    "live earthquake map",
    "real-time earthquake tracker",
    "USGS earthquake data",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Live Earthquake Map & Real-Time Tracker",
    description: "Track earthquakes worldwide in real time with live USGS data.",
    siteName: "Quake Hub",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Quake Hub live earthquake map showing real-time global seismic activity",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Earthquake Map & Real-Time Tracker",
    description: "Track earthquakes worldwide in real time with live USGS data.",
    images: ["/og-image.png"],
  },
};

// Dataset JSON-LD Schema
const datasetSchema = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "Real-Time Global Earthquake Data",
  description: "Live earthquake events sourced from USGS Earthquake Hazards Program.",
  url: SITE_URL,
  license: "https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits",
  creator: {
    "@type": "Organization",
    name: "USGS",
    url: "https://earthquake.usgs.gov/",
  },
  temporalCoverage: "2024-01-01/..",
  distribution: {
    "@type": "DataDownload",
    encodingFormat: "application/json",
    contentUrl: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
  },
};

export default function Page() {
  return (
    <>
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(FAQ_ITEMS)) }}
      />
      
      {/* Dataset Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />

      {/* Main UI */}

      <HomeClient/>
    </>
  );
}