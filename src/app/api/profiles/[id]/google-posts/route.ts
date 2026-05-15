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
    // Fetch profile details to get the gbpLocationId and gbpAccountId
    const prisma = (await import("@/lib/prisma")).default;
    const location = await prisma.location.findUnique({ where: { id: locationId } });
    if (!location || !location.gbpLocationId) {
      return NextResponse.json({ error: "Location not found or not synced with Google." }, { status: 404 });
    }

    // Normalise IDs — strip the "locations/" and "accounts/" prefixes if present
    const rawLocationId = location.gbpLocationId.replace("locations/", "");
    const rawAccountId  = (location.gbpAccountId || "").replace("accounts/", "");

    // The CORRECT Google My Business API endpoint requires the full account path:
    // accounts/{accountId}/locations/{locationId}/localPosts
    // Using just locations/{id}/localPosts returns a 404 HTML response.
    let apiUrl: string;
    if (rawAccountId) {
      apiUrl = `https://mybusiness.googleapis.com/v4/accounts/${rawAccountId}/locations/${rawLocationId}/localPosts?pageSize=20`;
    } else {
      // Fallback (less reliable) — try without account prefix
      apiUrl = `https://mybusiness.googleapis.com/v4/locations/${rawLocationId}/localPosts?pageSize=20`;
    }

    console.log(`[Google Posts API] Calling: ${apiUrl}`);

    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Detect HTML error page (API returned wrong content type)
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error(`[Google Posts API] Non-JSON response (${res.status}):`, text.substring(0, 200));
      return NextResponse.json({ 
        error: `Google API returned an unexpected response (HTTP ${res.status}). The account may not have access to this location's posts.`,
        hint: "Ensure the Google account has the Business Profile Manager role for this location."
      }, { status: 502 });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(`[Google Posts API] Fetch failed:`, res.status, err);
      return NextResponse.json({ 
        error: err?.error?.message || "Failed to fetch posts from Google",
        details: err?.error,
        httpStatus: res.status
      }, { status: res.status });
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
