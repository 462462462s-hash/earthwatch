import type { Metadata } from "next";
import HomeClient from "./components/Homeclient";
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION, SITE_KEYWORDS, FAQ_ITEMS, buildFaqSchema } from "./lib/seo";

export const revalidate = 30;

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "Quake Hub",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Quake Hub live earthquake map showing real-time global seismic activity",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      {/* FAQ schema rendered server-side — no client JS needed to build this,
          and Google can read it even before hydration finishes. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(FAQ_ITEMS)) }}
      />
      <HomeClient />
    </>
  );
}