import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location") || "";
  const magnitude = searchParams.get("magnitude") || "";

  // 1. Validate incoming query parameters
  if (!location) {
    return NextResponse.json(
      { success: false, articles: [], message: "Location parameter is required." },
      { status: 400, headers: corsHeaders }
    );
  }

  // 2. Fetch Key securely from environment variables
  const API_KEY = process.env.NEWS_API_KEY;

  if (!API_KEY) {
    console.error("Missing configuration: NEWS_API_KEY is not defined in environment variables.");
    return NextResponse.json(
      { 
        success: false, 
        articles: [], 
        message: "Server Configuration Error: API key missing. Ensure NEWS_API_KEY is defined in your .env.local file." 
      },
      { status: 500, headers: corsHeaders }
    );
  }

  // 3. Parse location string into specific city vs broader country
  const locationParts = location.split(",");
  const specificCity = locationParts[0].trim(); // e.g., "Jurm"
  const countryFallback = locationParts[locationParts.length - 1].trim(); // e.g., "Afghanistan"
  
  // Set up dates
  const todayDate = new Date().toISOString().split('T')[0];

  // Tier 1 Query: Try the specific town/epicenter directly
  let query = `earthquake AND "${specificCity}"`;
  let targetUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${todayDate}&sortBy=publishedAt&language=en&pageSize=15&apiKey=${API_KEY}`;

  try {
    let response = await fetch(targetUrl, { cache: "no-store" });

    // Handle explicit remote server authentication rejections
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.message || `NewsAPI server responded with status: ${response.status}`);
    }

    let data = await response.json();

    if (data.status !== "ok") {
      throw new Error(data.message || "NewsAPI returned an unsuccessful status status.");
    }

    // 4. FALLBACK ESCALATION: If city returns empty, query the country name over the last 3 days
    if (!data.articles || data.articles.length === 0) {
      console.log(`[News API Route] No direct articles found for '${specificCity}'. Escalating to country tier: '${countryFallback}'`);
      
      query = `earthquake AND "${countryFallback}"`;
      const historicDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const fallbackUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${historicDate}&sortBy=publishedAt&language=en&pageSize=15&apiKey=${API_KEY}`;
      
      response = await fetch(fallbackUrl, { cache: "no-store" });
      if (response.ok) {
        data = await response.json();
      }
    }

    // 5. Filter, sanitize and clean structural payload properties
    const structuredArticles = (data.articles || [])
      .filter((article: any) => article.title && article.title !== "[Removed]")
      .map((article: any) => ({
        title: article.title,
        description: article.description || "",
        url: article.url,
        imageUrl: article.urlToImage || null, // Contains the actual image links
        source: article.source?.name || "Verified Source",
        publishedAt: article.publishedAt,
      }));

    return NextResponse.json(
      { success: true, count: structuredArticles.length, articles: structuredArticles },
      { status: 200, headers: corsHeaders }
    );

  } catch (error: any) {
    console.error("Internal processing error inside News API route:", error.message);
    return NextResponse.json(
      { success: false, articles: [], message: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}