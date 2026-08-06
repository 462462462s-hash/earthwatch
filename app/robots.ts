import type { MetadataRoute } from "next";

// Ensure this matches your final custom domain if you move off Vercel's default preview subdomain
const SITE_URL = "https://quakehublive.com"; 

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"], // Prevents search engines from indexing backend endpoints
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}