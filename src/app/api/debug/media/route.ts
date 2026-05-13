import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const accountName = searchParams.get("accountName"); // accounts/123
  const locationName = searchParams.get("locationName"); // locations/456
  const accessToken = (session as any).accessToken;

  if (!accountName || !locationName) {
    return NextResponse.json({ error: "Missing accountName or locationName" }, { status: 400 });
  }

  const v4LocationName = locationName.startsWith("accounts/") ? locationName : `${accountName}/${locationName}`;
  const mediaUrl = `https://mybusiness.googleapis.com/v4/${v4LocationName}/media?maxResults=50`;

  try {
    const res = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await res.json();
    return NextResponse.json({
      status: res.status,
      url: mediaUrl,
      data
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
