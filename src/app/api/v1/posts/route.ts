/**
 * POST /api/v1/posts
 * Create a post (DRAFT or SCHEDULED) from n8n or any external tool.
 *
 * Auth: Bearer <rvk_...> API key (scope: posts:write)
 *
 * Request body (JSON):
 * {
 *   profileId:   string,          // required — Location ID from /api/v1/profiles
 *   content:     string,          // required — post body text
 *   topicType?:  string,          // "STANDARD" | "EVENT" | "OFFER" (default: STANDARD)
 *   status?:     string,          // "DRAFT" | "SCHEDULED" (default: DRAFT)
 *   scheduledAt?: string,         // ISO datetime, required when status=SCHEDULED
 *   ctaType?:    string,          // "LEARN_MORE" | "CALL" | "BOOK" | "ORDER" | "SIGN_UP"
 *   ctaUrl?:     string,
 *   imageUrl?:   string,          // public URL to an image
 * }
 *
 * Response:
 * { id, status, profileId, content, scheduledAt, createdAt }
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, hasScope } from "@/lib/api-auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const ctx = await validateApiKey(req);
  if (!ctx) {
    return NextResponse.json({ error: "Invalid or missing API key." }, { status: 401 });
  }
  if (!hasScope(ctx, "posts:write")) {
    return NextResponse.json({ error: "This key does not have posts:write scope." }, { status: 403 });
  }

  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const { profileId, content, topicType = "STANDARD", status = "DRAFT", scheduledAt, ctaType, ctaUrl, imageUrl } = body;

  if (!profileId || typeof profileId !== "string") {
    return NextResponse.json({ error: "profileId is required." }, { status: 422 });
  }
  if (!content || typeof content !== "string" || content.trim().length < 1) {
    return NextResponse.json({ error: "content is required and cannot be empty." }, { status: 422 });
  }
  if (content.length > 1500) {
    return NextResponse.json({ error: "content must be 1500 characters or fewer (GBP limit)." }, { status: 422 });
  }
  if (status === "SCHEDULED" && !scheduledAt) {
    return NextResponse.json({ error: "scheduledAt is required when status is SCHEDULED." }, { status: 422 });
  }

  // Validate that the location belongs to the key owner
  const location = await prisma.location.findFirst({
    where: { id: profileId, client: { userId: ctx.userId } },
  });
  if (!location) {
    return NextResponse.json({ error: "Profile not found or not accessible with this API key." }, { status: 404 });
  }

  const post = await prisma.post.create({
    data: {
      summary:    content.trim(),
      topicType:  topicType.toUpperCase(),
      status:     ["DRAFT", "SCHEDULED"].includes(status.toUpperCase()) ? status.toUpperCase() : "DRAFT",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      ctaType:    ctaType  || null,
      ctaUrl:     ctaUrl   || null,
      mediaUrl:   imageUrl || null,
      locationId: location.id,
      userId:     ctx.userId,
    },
    select: {
      id: true, summary: true, status: true,
      topicType: true, scheduledAt: true, createdAt: true,
      location: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    id:          post.id,
    status:      post.status,
    content:     post.summary,
    topicType:   post.topicType,
    scheduledAt: post.scheduledAt,
    createdAt:   post.createdAt,
    profile: {
      id:   post.location.id,
      name: post.location.name,
    },
  }, { status: 201 });
}

/**
 * GET /api/v1/posts
 * List posts for the API key owner (optional ?profileId= filter)
 */
export async function GET(req: NextRequest) {
  const ctx = await validateApiKey(req);
  if (!ctx) return NextResponse.json({ error: "Invalid or missing API key." }, { status: 401 });
  if (!hasScope(ctx, "posts:read") && !hasScope(ctx, "posts:write")) {
    return NextResponse.json({ error: "Insufficient scope." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");
  const status    = searchParams.get("status");
  const limit     = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const posts = await prisma.post.findMany({
    where: {
      userId: ctx.userId,
      ...(profileId ? { locationId: profileId } : {}),
      ...(status    ? { status: status.toUpperCase() } : {}),
    },
    select: {
      id: true, summary: true, status: true, topicType: true,
      scheduledAt: true, publishedAt: true, createdAt: true,
      location: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ data: posts, total: posts.length });
}
