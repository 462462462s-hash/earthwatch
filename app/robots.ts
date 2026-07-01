import type { MetadataRoute } from "next";

const SITE_URL = "https://your-domain.com"; // ← replace with your real production domain

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}