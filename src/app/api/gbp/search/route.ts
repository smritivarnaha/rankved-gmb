import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const input = searchParams.get("q");
  const placeId = searchParams.get("placeId");

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Maps API key not configured" }, { status: 500 });

  try {
    // If we have a placeId, get full details
    if (placeId) {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,user_ratings_total,photos,geometry,types&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      return NextResponse.json({ data: data.result });
    }

    // Otherwise, perform autocomplete search
    if (!input) return NextResponse.json({ data: [] });
    
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=establishment&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    const predictions = (data.predictions || []).map((p: any) => ({
      description: p.description,
      placeId: p.place_id,
      mainText: p.structured_formatting?.main_text,
      secondaryText: p.structured_formatting?.secondary_text,
    }));

    return NextResponse.json({ data: predictions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
