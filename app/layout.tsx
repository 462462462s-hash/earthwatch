import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://earthwatch-iihz-azure.vercel.app";
const SITE_NAME = "Quake Hub";

// SEO: expanded description with primary + secondary keywords, kept just under ~160 chars
const SITE_DESCRIPTION =
  "Quake Hub tracks live earthquakes worldwide with real-time USGS data.";

// SEO: lengthened, keyword-rich title (primary keyword "live earthquake map" + secondary "real-time tracker" + "seismic alerts")
const SITE_TITLE =
  "Quake Hub – Live Earthquake Map";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Quake Hub – Live Earthquake Tracker",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "live earthquake map",
    "real-time earthquake tracker",
    "earthquake today",
    "USGS earthquake feed",
    "seismic activity map",
    "tsunami alert tracker",
    "magnitude earthquake tracker",
    "global earthquake monitor",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: "Quake Hub" }],
  creator: "Quake Hub",
  publisher: "Quake Hub",
  formatDetection: { telephone: false },
  alternates: {
    canonical: "./",
  },
  // SEO: geo tags. Note — geo.* meta tags are most meaningful on location-specific
  // pages (see app/earthquake/[id]/page.tsx, which sets real lat/lon per event).
  // On the global homepage we declare worldwide coverage instead of a single region.
  other: {
    "geo.placename": "Worldwide",
    "geo.region": "00",
    "ICBM": "0, 0",
    "coverage": "Worldwide",
    "distribution": "Global",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Quake Hub — Live Global Earthquake Map and Real-Time Seismic Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#060610",
};

function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    areaServed: "Worldwide",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?country={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // SEO: secondary Organization schema — helps establish entity/brand signals
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Quake Hub is a live earthquake tracking platform providing real-time global seismic data sourced from the USGS.",
    areaServed: "Worldwide",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        {/* SEO: geo meta tags duplicated in <head> for crawlers that read raw meta tags directly */}
        <meta name="geo.placename" content="Worldwide" />
        <meta name="geo.region" content="00" />
        <meta name="ICBM" content="0, 0" />
        <StructuredData />
      </head>
      <body style={{ background: "#060610", color: "white", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}