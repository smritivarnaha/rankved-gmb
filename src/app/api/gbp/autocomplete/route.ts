import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get("input");

  if (!input) {
    return NextResponse.json({ suggestions: [] });
  }

  const API_KEY = process.env.GOOGLE_PLACES_API_KEY || "AIzaSyBtbsS35qhHRLn_63YHVV66e6OK3IGUa8M";

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places:autocomplete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
        },
        body: JSON.stringify({ input }),
      }
    );

    const data = await response.json();

    // Log any errors from Google API
    if (data.error) {
      console.error("Google Autocomplete error:", JSON.stringify(data.error));
      return NextResponse.json({ suggestions: [], googleError: data.error?.message });
    }

    const suggestions = (data.suggestions || []).map((s: any) => ({
      id: s.placePrediction?.placeId,
      text: s.placePrediction?.text?.text,
      mainText: s.placePrediction?.structuredFormat?.mainText?.text,
      secondaryText: s.placePrediction?.structuredFormat?.secondaryText?.text,
    })).filter((s: any) => s.id && s.text);

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error("Autocomplete API Error:", error);
    return NextResponse.json({ error: error.message, suggestions: [] }, { status: 500 });
  }
}
