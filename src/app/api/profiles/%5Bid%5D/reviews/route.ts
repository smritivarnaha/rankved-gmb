import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Corrected path

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  try {
    // 1. Get the profile to find the accountName (locations/id)
    const profileRes = await fetch(`${process.env.NEXTAUTH_URL}/api/profiles`);
    const profiles = await profileRes.json();
    const profile = (profiles.data || []).find((p: any) => p.id === id);

    if (!profile || !profile.accountName) {
      return NextResponse.json({ error: "Profile not found or not connected" }, { status: 404 });
    }

    // 2. Fetch reviews from Google
    // Note: accountName is in the format "accounts/ACC_ID/locations/LOC_ID"
    const googleRes = await fetch(
      `https://mybusiness.googleapis.com/v4/${profile.accountName}/reviews`,
      {
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      }
    );

    const data = await googleRes.json();
    return NextResponse.json({ data: data.reviews || [] });
  } catch (error) {
    console.error("Reviews API Error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
