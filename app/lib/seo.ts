export const SITE_URL = "https://earthwatch-iihz-azure.vercel.app";
export const SITE_NAME = "Quake Hub";

// Keep this ONE title/description pair and reuse everywhere so Google sees
// consistent keyword targeting across the homepage, layout metadata, and
// structured data instead of three slightly different phrasings.
export const SITE_TITLE = "Quake Hub – Live Earthquake Map & Real-Time Earthquake Tracker";
export const SITE_DESCRIPTION =
  "Track live earthquakes worldwide with Quake Hub's real-time earthquake tracker. View magnitude, epicenter depth, and tsunami advisory status sourced directly from the USGS earthquake feed, updated every 30 seconds.";

export const SITE_KEYWORDS = [
  "live earthquake map",
  "real-time earthquake tracker",
  "earthquake today",
  "USGS earthquake feed",
  "seismic activity map",
  "tsunami advisory tracker",
  "earthquake magnitude tracker",
  "global earthquake monitor",
  "Today's earthquakes",
  "earthquake epicenter coordinates",
  "earthquake depth information",
  "earthquake news coverage",
  "Earthquake near me",
  "Severe earthquake today",
  "Tsunami warning",
  "Today Seismic map",
  "Earthquake magnitude",
  "Earthquake epicenter",
  "Earthquake depth",
  "Earthquake news",
];

export type FaqItem = { q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "How often does Quake Hub update its live earthquake map?",
    a: "Quake Hub polls the USGS real-time earthquake feed every 30 seconds, so newly detected seismic events appear on the live earthquake map within half a minute of being published.",
  },
  {
    q: "What magnitude earthquake is considered dangerous?",
    a: "Earthquakes below magnitude 4.0 are usually minor and rarely felt. Magnitude 5.0+ events can cause moderate structural stress, while magnitude 6.0+ earthquakes are classified as critical and capable of significant damage near the epicenter.",
  },
  {
    q: "Does Quake Hub track tsunami advisories?",
    a: "Yes. Every earthquake record on Quake Hub includes tsunami advisory status sourced directly from USGS alert levels, so you can quickly check whether a coastal seismic event carries an elevated tsunami risk.",
  },
  {
    q: "Can I filter the live earthquake map by country?",
    a: "Yes. Use the country selector in the navigation bar to filter the real-time earthquake tracker by region. The map automatically flies to and highlights recent seismic activity within that country.",
  },
  {
    q: "Where does Quake Hub source its earthquake data from?",
    a: "All earthquake data on Quake Hub is sourced from the United States Geological Survey (USGS) real-time seismic feed, one of the most trusted global sources for earthquake monitoring and reporting.",
  },
];

export function buildFaqSchema(items: FaqItem[] = FAQ_ITEMS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}