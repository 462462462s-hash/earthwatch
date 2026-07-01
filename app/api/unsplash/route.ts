import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { error: "Missing query parameter" },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    if (!ACCESS_KEY) {
      return NextResponse.json(
        { error: "UNSPLASH_ACCESS_KEY is missing in .env.local" },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query
      )}&per_page=10&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${ACCESS_KEY}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const error = await response.text();

      return NextResponse.json(
        {
          error: "Unsplash API request failed",
          details: error,
        },
        {
          status: response.status,
          headers: corsHeaders,
        }
      );
    }

    const data = await response.json();

    const images = data.results.map((photo: any) => ({
      id: photo.id,
      description:
        photo.alt_description ||
        photo.description ||
        "Unsplash Image",
      image: photo.urls.regular,
      thumb: photo.urls.small,
      full: photo.urls.full,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      unsplashUrl: photo.links.html,
    }));

    return NextResponse.json(images, {
      headers: corsHeaders,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}