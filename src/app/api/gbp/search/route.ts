import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  // Use the User's provided Google API Key
  const API_KEY = "AIzaSyBtbsS35qhHRLn_63YHVV66e6OK3IGUa8M";

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places:searchText`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.id,places.rating,places.userRatingCount,places.primaryType,places.websiteUri",
        },
        body: JSON.stringify({
          textQuery: query,
        }),
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
