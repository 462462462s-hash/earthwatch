import type { MetadataRoute } from "next";

// 1. Point this to your actual production URL
const SITE_URL = "https://earthwatch-iihz-azure.vercel.app"; 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      // 'always' can annoy search bots if the page hasn't actually changed layout. 'hourly' or 'daily' is better.
      changeFrequency: "hourly", 
      priority: 1,
    },
  ];

  try {
    const res = await fetch(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
      { next: { revalidate: 300 } }
    );
    
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    
    const data = await res.json();
    const features = data?.features || [];

    // 2. Limit the number of URLs to protect crawl budget and memory limits
    const topFeatures = features.slice(0, 1000); 

    for (const item of topFeatures) {
      if (!item?.id) continue;
      
      entries.push({
        url: `${SITE_URL}/earthquake/${encodeURIComponent(item.id)}`,
        lastModified: item.properties?.updated
          ? new Date(item.properties.updated)
          : new Date(),
        changeFrequency: "daily", // Individual old earthquakes rarely change; 'daily' or 'weekly' saves crawler resources
        priority: 0.7,
      });
    }
  } catch (e) {
    console.error("Sitemap generation: failed to fetch USGS feed", e);
  }

  return entries;
}