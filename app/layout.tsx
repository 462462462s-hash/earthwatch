import type { Metadata, Viewport } from "next";
import Analytics from "./components/Analytics";
import { 
  SITE_URL, 
  SITE_NAME, 
  SITE_TITLE, 
  SITE_DESCRIPTION, 
  SITE_KEYWORDS,
  buildWebsiteSchema,
  buildOrganizationSchema
} from "./lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: "Quake Hub Live" }],
  creator: "Quake Hub Live",
  publisher: "Quake Hub Live",
  verification: { google: "googlee957368efd2b5a38" }, // Replace with your new DNS verification code once added to Search Console
  formatDetection: { telephone: false },
  alternates: { canonical: "/" },
  other: {
    "geo.placename": "Worldwide",
    "geo.region": "00",
    ICBM: "0, 0",
    coverage: "Worldwide",
    distribution: "Global",
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
        alt: "Quake Hub Live — Global Earthquake Map and Real-Time Seismic Tracker",
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
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico", apple: "/apple-touch-icon.png" },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#060610",
};

function StructuredData() {
  const websiteSchema = buildWebsiteSchema();
  const organizationSchema = buildOrganizationSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />

        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://earthquake.usgs.gov" />
        <link rel="dns-prefetch" href="https://earthquake.usgs.gov" />
        <link rel="preconnect" href="https://basemaps.cartocdn.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://basemaps.cartocdn.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />

        <StructuredData />
      </head>
      <body style={{ background: "#060610", color: "white", margin: 0 }}>
        <Analytics />
        {children}
      </body>
    </html>
  );
}