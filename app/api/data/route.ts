import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  // Let Vercel's edge cache serve this for 25s and keep serving a slightly
  // stale copy for another 55s while it refreshes in the background. Since
  // you already poll every 30s, this means most users share one cached
  // response instead of each device round-tripping to USGS individually —
  // a big win for mobile latency and for not hammering the USGS feed.
  "Cache-Control": "public, s-maxage=25, stale-while-revalidate=55",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const USGS_ALL_DAY_FEED = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
    const response = await fetch(USGS_ALL_DAY_FEED, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json", "User-Agent": "EarthquakeHubApp/1.0 (Seismic Analytics Application Platform)" },
    });
    if (!response.ok) throw new Error(`USGS Main Feed returned status code ${response.status}`);

    const data = await response.json();
    const featureList = data?.features || [];
    const earthquakes = featureList.map((item: any) => {
      const coordinates = item?.geometry?.coordinates || [];
      return {
        id: item?.id,
        place: item?.properties?.place ?? "Unknown Location",
        magnitude: item?.properties?.mag ?? 0,
        time: item?.properties?.time,
        updated: item?.properties?.updated,
        depth: coordinates[2] ?? 0,
        lon: coordinates[0] ?? 0,
        lat: coordinates[1] ?? 0,
        tsunami: item?.properties?.tsunami === 1,
        alert: item?.properties?.alert ?? null,
        status: item?.properties?.status,
        significance: item?.properties?.sig,
        felt: item?.properties?.felt ?? 0,
        magType: item?.properties?.magType,
        sourceUrl: item?.properties?.url,
      };
    });

    return NextResponse.json(
      { success: true, count: earthquakes.length, earthquakes, lastUpdated: new Date().toISOString() },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Primary Earthquake API Error, switching to fallback:", error.message || error);
    try {
      const fallback = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson", { cache: "no-store" });
      const fallbackData = await fallback.json();
      const featureList = fallbackData?.features || [];
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

      const earthquakes = featureList
        .filter((item: any) => (item?.properties?.time ?? 0) >= oneDayAgo)
        .map((item: any) => {
          const coordinates = item?.geometry?.coordinates || [];
          return {
            id: item?.id,
            place: item?.properties?.place ?? "Unknown Location",
            magnitude: item?.properties?.mag ?? 0,
            time: item?.properties?.time,
            updated: item?.properties?.updated,
            depth: coordinates[2] ?? 0,
            lon: coordinates[0] ?? 0,
            lat: coordinates[1] ?? 0,
            tsunami: item?.properties?.tsunami === 1,
            alert: item?.properties?.alert ?? null,
            status: item?.properties?.status,
            significance: item?.properties?.sig,
            felt: item?.properties?.felt ?? 0,
            magType: item?.properties?.magType,
            sourceUrl: item?.properties?.url,
          };
        });

      return NextResponse.json(
        { success: true, count: earthquakes.length, earthquakes, lastUpdated: new Date().toISOString() },
        { status: 200, headers: corsHeaders }
      );
    } catch (fallbackError: any) {
      return NextResponse.json(
        { success: false, earthquakes: [], message: `Unable to fetch live earthquake data. Details: ${error.message || "Unknown Network Exception"}` },
        { status: 500, headers: corsHeaders }
      );
    }
  }
}