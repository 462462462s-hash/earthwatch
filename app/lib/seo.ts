// app/lib/seo.ts
// Central place for all SEO constants so title/description/schema stay
// consistent across layout.tsx, page.tsx, sitemap.ts, and robots.ts.
// ⚠️ Update SITE_URL to your real production domain before deploying.

export const SITE_URL = "https://www.quakehub.com"; // <-- replace with your real domain (no trailing slash)
export const SITE_NAME = "Quake Hub";

export const SITE_TITLE =
  "Quake Hub – Live Earthquake Map & Real-Time Seismic Tracker";

export const SITE_DESCRIPTION =
  "Track live earthquakes worldwide with Quake Hub's real-time seismic map. See magnitude, depth, epicenter coordinates, tsunami alerts, and USGS data updated every 30 seconds.";

export const SITE_KEYWORDS = [
  "live earthquake map",
  "real-time earthquake tracker",
  "USGS earthquake data",
  "earthquake today",
  "seismic activity map",
  "earthquake alerts",
  "tsunami warning tracker",
  "recent earthquakes near me",
];

export type FaqItem = { q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "How often does Quake Hub update earthquake data?",
    a: "Quake Hub pulls live data directly from the USGS earthquake feed and refreshes automatically every 30 seconds, so new tremors appear on the map almost as soon as they're detected.",
  },
  {
    q: "What magnitude of earthquake is considered dangerous?",
    a: "Earthquakes below magnitude 4.0 are usually minor and rarely cause damage. Magnitude 5.0 and above can cause moderate to severe structural damage depending on depth and location, and magnitude 6.0+ events are flagged as critical alerts on Quake Hub.",
  },
  {
    q: "Does Quake Hub show tsunami warnings?",
    a: "Yes. Each earthquake record includes the official USGS tsunami advisory status, so you can quickly see whether a coastal event carries an active tsunami risk.",
  },
  {
    q: "Can I filter earthquakes by country?",
    a: "Yes. Use the country selector in the navigation bar to filter the live map and recent earthquake list down to a specific country or region.",
  },
  {
    q: "Where does Quake Hub get its earthquake data from?",
    a: "All seismic data is sourced from the United States Geological Survey (USGS), the official U.S. government agency responsible for monitoring earthquakes worldwide.",
  },
];

export function buildFaqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: SITE_DESCRIPTION,
  };
}

export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?country={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}