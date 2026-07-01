import type { MetadataRoute } from "next";

const SITE_URL = "https://your-domain.com"; // ← replace with your real production domain

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 1,
    },
  ];

  try {
    const res = await fetch(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
      { next: { revalidate: 300 } } // refresh sitemap data every 5 minutes
    );
    const data = await res.json();
    const features = data?.features || [];

    for (const item of features) {
      if (!item?.id) continue;
      entries.push({
        url: `${SITE_URL}/earthquake/${item.id}`,
        lastModified: item.properties?.updated
          ? new Date(item.properties.updated)
          : new Date(),
        changeFrequency: "hourly",
        priority: 0.7,
      });
    }
  } catch (e) {
    console.error("Sitemap generation: failed to fetch USGS feed", e);
  }

  return entries;
}