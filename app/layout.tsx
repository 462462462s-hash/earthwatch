import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://your-domain.com"; // ← replace with your real production domain
const SITE_NAME = "Quake Hub — Live Earthquake Monitor";
const SITE_DESCRIPTION =
  "Real-time global earthquake monitoring powered by official USGS data. Track live seismic activity, magnitude, depth, tsunami risk, and breaking news for earthquakes happening right now anywhere in the world.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: "%s | Quake Hub",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "earthquake tracker",
    "live earthquake map",
    "USGS earthquake data",
    "real-time seismic activity",
    "earthquake news today",
    "magnitude earthquake",
    "tsunami alert",
    "recent earthquakes near me",
  ],
  authors: [{ name: "Quake Hub" }],
  creator: "Quake Hub",
  publisher: "Quake Hub",
  formatDetection: { telephone: false },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    images: [
      {
        url: "/og-image.png", // 1200x630 social preview image — add this file to /public
        width: 1200,
        height: 630,
        alt: "Quake Hub — Live Global Earthquake Monitor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
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

// Organization / WebSite structured data — helps Google understand the site
// as a whole and enables sitelinks search box eligibility.
function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?country={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
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
        {/* Crucial Leaflet asset required to calculate map tiles and marker layout vectors on mobile devices */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <StructuredData />
      </head>
      <body style={{ background: "#060610", color: "white", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}