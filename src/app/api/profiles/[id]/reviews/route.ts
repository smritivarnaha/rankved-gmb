import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    // 1. Get the profile directly from the database using Prisma
    const profile = await prisma.location.findUnique({
      where: { id }
    });

    if (!profile || !profile.gbpAccountId || !profile.gbpLocationId) {
      return NextResponse.json({ error: "Profile not found or not connected to GMB" }, { status: 404 });
    }

    // 2. Fetch reviews from Google
    // Note: accountName must be in the format "accounts/ACC_ID/locations/LOC_ID"
    const accountName = `${profile.gbpAccountId}/${profile.gbpLocationId}`;
    const googleRes = await fetch(
      `https://mybusiness.googleapis.com/v4/${accountName}/reviews`,
      {
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        cache: "no-store"
      }
    );

    const data = await googleRes.json();
    if (!googleRes.ok) {
      console.error("Google Reviews API Error:", data);
      return NextResponse.json({ error: data.error?.message || "Failed to fetch reviews from Google" }, { status: googleRes.status });
    }

    return NextResponse.json({ data: data.reviews || [] });
  } catch (error) {
    console.error("Reviews API Error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
