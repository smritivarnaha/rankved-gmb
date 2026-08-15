import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getValidGoogleAccounts, getEmailFromIdToken } from "@/lib/google-accounts";
import { getTodayReplyCountForProfile, getNextAvailableReplySlot, DAILY_PROFILE_REPLY_LIMIT } from "@/lib/review-scheduler";

/**
 * POST /api/reviews/reply
 * Body: {
 *   profileId: string,
 *   reviewName: string,
 *   comment: string,
 *   override?: boolean,
 *   scheduledFor?: string,
 *   reviewerName?: string,
 *   rating?: number,
 *   reviewComment?: string,
 *   reviewCreateTime?: string,
 * }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).user.id;

  try {
    const {
      profileId,
      reviewName,
      comment,
      override = false,
      scheduledFor,
      reviewerName,
      rating,
      reviewComment,
      reviewCreateTime,
    } = await req.json();

    if (!profileId || !reviewName || !comment?.trim()) {
      return NextResponse.json({ error: "profileId, reviewName, and comment are required" }, { status: 400 });
    }

    const location = await prisma.location.findUnique({ where: { id: profileId } });
    if (!location) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // Case 1: Explicit custom schedule requested
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      const record = await prisma.scheduledReviewReply.create({
        data: {
          locationId: location.id,
          userId,
          reviewName,
          reviewerName: reviewerName || null,
          rating: rating || null,
          reviewComment: reviewComment || null,
          reviewCreateTime: reviewCreateTime ? new Date(reviewCreateTime) : null,
          replyComment: comment.trim(),
          scheduledFor: scheduledDate,
          status: "SCHEDULED",
        },
      });

      return NextResponse.json({
        success: true,
        scheduled: true,
        scheduledFor: scheduledDate.toISOString(),
        message: `Reply scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        data: record,
      });
    }

    // Case 2: Standard Post - check daily quota (3 per day) unless override is set
    const todayCounts = await getTodayReplyCountForProfile(location.id);

    if (!override && todayCounts.totalToday >= DAILY_PROFILE_REPLY_LIMIT) {
      // Auto-schedule for next available slot
      const nextSlot = await getNextAvailableReplySlot(location.id);
      const record = await prisma.scheduledReviewReply.create({
        data: {
          locationId: location.id,
          userId,
          reviewName,
          reviewerName: reviewerName || null,
          rating: rating || null,
          reviewComment: reviewComment || null,
          reviewCreateTime: reviewCreateTime ? new Date(reviewCreateTime) : null,
          replyComment: comment.trim(),
          scheduledFor: nextSlot,
          status: "SCHEDULED",
        },
      });

      return NextResponse.json({
        success: true,
        scheduled: true,
        scheduledFor: nextSlot.toISOString(),
        message: `Daily limit (3 replies/day) reached for ${location.name}. Automatically scheduled for ${nextSlot.toLocaleDateString()} at ${nextSlot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        data: record,
      });
    }

    // Case 3: Publish Immediately to Google
    const accounts = await getValidGoogleAccounts(userId);
    let accessToken: string | null = (session as any)?.accessToken || null;

    if (accounts.length > 0) {
      if (location.googleEmail) {
        const match = accounts.find(a => getEmailFromIdToken(a.id_token) === location.googleEmail);
        if (match?.access_token) accessToken = match.access_token;
      }
      if (!accessToken) accessToken = accounts[0].access_token;
    }

    if (!accessToken) {
      return NextResponse.json({ error: "No valid Google access token found. Please reconnect in Settings." }, { status: 400 });
    }

    // GBP v4: PUT https://mybusiness.googleapis.com/v4/{reviewName}/reply
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
      console.error("[Reviews Reply] Google API Error:", replyRes.status, err.substring(0, 200));
      return NextResponse.json({ error: `Google API error: ${replyRes.status}` }, { status: 502 });
    }

    const data = await replyRes.json();

    // Record published reply in DB
    await prisma.scheduledReviewReply.create({
      data: {
        locationId: location.id,
        userId,
        reviewName,
        reviewerName: reviewerName || null,
        rating: rating || null,
        reviewComment: reviewComment || null,
        reviewCreateTime: reviewCreateTime ? new Date(reviewCreateTime) : null,
        replyComment: comment.trim(),
        scheduledFor: new Date(),
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      scheduled: false,
      reply: data,
      message: "Reply posted successfully to Google!",
    });
  } catch (err: any) {
    console.error("[Reviews Reply] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to process reply" }, { status: 500 });
  }
}
