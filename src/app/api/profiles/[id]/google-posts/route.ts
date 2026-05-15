import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getGoogleAccessTokenForLocation } from "@/lib/google-token";

// GET /api/profiles/[id]/google-posts — Fetch live posts from Google
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: locationId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accessToken = await getGoogleAccessTokenForLocation(locationId);

  if (!accessToken) {
    return NextResponse.json({ error: "No Google access token found for this profile. Please reconnect in Settings." }, { status: 400 });
  }

  try {
    // Fetch profile details to get the gbpLocationId
    const prisma = (await import("@/lib/prisma")).default;
    const location = await prisma.location.findUnique({ where: { id: locationId } });
    if (!location || !location.gbpLocationId) {
      return NextResponse.json({ error: "Location not found or not synced with Google." }, { status: 404 });
    }

    // Google API requires full resource name or just locations/id? 
    // In this app, gbpLocationId usually stores "locations/ID" or just "ID".
    // If it's just the ID, we prefix with locations/
    const resourceName = location.gbpLocationId.includes("/") ? location.gbpLocationId : `locations/${location.gbpLocationId}`;

    const res = await fetch(`https://mybusiness.googleapis.com/v4/${resourceName}/localPosts?pageSize=20`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err?.error?.message || "Failed to fetch posts from Google" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ data: data.localPosts || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/profiles/[id]/google-posts?postName=xxx — Delete a post from Google
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: locationId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const postName = searchParams.get("postName");

  if (!postName) return NextResponse.json({ error: "Post name required" }, { status: 400 });

  const accessToken = await getGoogleAccessTokenForLocation(locationId);
  if (!accessToken) {
    return NextResponse.json({ error: "No Google access token found." }, { status: 400 });
  }

  try {
    const res = await fetch(`https://mybusiness.googleapis.com/v4/${postName}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err?.error?.message || "Failed to delete post from Google" }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
