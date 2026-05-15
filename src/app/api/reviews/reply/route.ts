import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getValidGoogleAccounts } from "@/lib/google-accounts";

/**
 * POST /api/reviews/reply
 * Posts or updates a reply to a Google Business Profile review.
 * Body: { profileId, reviewName, comment }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).user.id;

  try {
    const { profileId, reviewName, comment } = await req.json();
    if (!profileId || !reviewName || !comment?.trim()) {
      return NextResponse.json({ error: "profileId, reviewName, and comment are required" }, { status: 400 });
    }

    // Get the location from DB
    const prisma = (await import("@/lib/prisma")).default;
    const location = await prisma.location.findUnique({ where: { id: profileId } });
    if (!location) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // Get access token
    const accounts = await getValidGoogleAccounts(userId);
    const accessToken = accounts[0]?.access_token;
    if (!accessToken) return NextResponse.json({ error: "No valid Google account" }, { status: 400 });

    // GBP v4: PUT accounts/{id}/locations/{id}/reviews/{reviewId}/reply
    const replyRes = await fetch(`https://mybusiness.googleapis.com/v4/${reviewName}/reply`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment: comment.trim() }),
    });

    if (!replyRes.ok) {
      const err = await replyRes.text();
      console.error("[Reviews Reply] Failed:", replyRes.status, err.substring(0, 200));
      return NextResponse.json({ error: `Google API error: ${replyRes.status}` }, { status: 502 });
    }

    const data = await replyRes.json();
    return NextResponse.json({ success: true, reply: data });
  } catch (err: any) {
    console.error("[Reviews Reply] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to post reply" }, { status: 500 });
  }
}
