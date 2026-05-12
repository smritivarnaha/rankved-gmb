import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get("input");

  if (!input) {
    return NextResponse.json({ suggestions: [] });
  }

  const API_KEY = "AIzaSyBtbsS35qhHRLn_63YHVV66e6OK3IGUa8M";

  try {
    // New Google Places Autocomplete API (V1)
    const response = await fetch(
      `https://places.googleapis.com/v1/places:autocomplete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
        },
        body: JSON.stringify({
          input: input,
          // You can restrict to business types if needed
          includedPrimaryTypes: ["establishment"]
        }),
      }
    );

    const data = await response.json();
    
    // The V1 API returns "suggestions" which contain "placePrediction"
    const suggestions = (data.suggestions || []).map((s: any) => ({
      id: s.placePrediction?.placeId,
      text: s.placePrediction?.text?.text,
      mainText: s.placePrediction?.structuredFormat?.mainText?.text,
      secondaryText: s.placePrediction?.structuredFormat?.secondaryText?.text,
    }));

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error("Autocomplete API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
