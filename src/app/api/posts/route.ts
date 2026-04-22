import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAllPosts, getPostsByProfile, createPost, deletePost } from "@/lib/post-store";
import { publishToGBP } from "@/lib/gbp-publisher";
import prisma from "@/lib/prisma";

// GET /api/posts — list all posts
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(session as any).user.isApproved) {
    return NextResponse.json({ error: "Your account is pending approval by rankved.business@gmail.com." }, { status: 403 });
  }

  const userId = (session as any).user.id;
  const role = (session as any).user.role;

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");

  let posts = [];
  if (profileId) {
    posts = await getPostsByProfile(profileId, userId, role);
  } else {
    posts = await getAllPosts(userId, role);
  }

  return NextResponse.json({ data: posts });
}

// POST /api/posts — create and optionally publish a post
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(session as any).user.isApproved) {
    return NextResponse.json({ error: "Your account is pending approval by rankved.business@gmail.com." }, { status: 403 });
  }

  const userId = (session as any)?.user?.id;
  if (!userId) return NextResponse.json({ error: "Could not determine user ID." }, { status: 401 });

  const accessToken = (session as any)?.accessToken;

  try {
    const body = await req.json();

    // Always save to DB first (as DRAFT or SCHEDULED)
    const initialStatus = body.status === "PUBLISHED" ? "DRAFT" : (body.status || "DRAFT");

    const post = await createPost(
      {
        profileId: body.profileId,
        profileName: body.profileName || "",
        clientName: body.clientName || "",
        summary: body.summary,
        topicType: body.topicType || "STANDARD",
        ctaType: body.ctaType || "",
        ctaUrl: body.ctaUrl || "",
        finalUrl: body.finalUrl || body.ctaUrl || "",
        imageUrl: body.imageUrl || null,
        geoLat: body.geoLat || "",
        geoLng: body.geoLng || "",
        eventTitle: body.eventTitle || "",
        eventStart: body.eventStart || "",
        eventEnd: body.eventEnd || "",
        status: initialStatus as any,
        scheduledAt: body.scheduledAt || null,
        createdBy: session.user?.email || "unknown",
      },
      userId
    );

    // If user requested PUBLISH NOW — call GBP API immediately
    if (body.status === "PUBLISHED") {
      if (!accessToken) {
        // Mark as failed — no token
        await prisma.post.update({
          where: { id: post.id },
          data: { status: "FAILED", failureReason: "No Google access token. Please reconnect in Settings." },
        });
        return NextResponse.json({
          data: { ...post, status: "FAILED" },
          error: "No Google access token. Please reconnect your Google account in Settings.",
        }, { status: 207 });
      }

      const result = await publishToGBP({
        post,
        accessToken,
        imageDataUri: body.imageUrl || null,
      });

      if (result.success) {
        const updated = await prisma.post.update({
          where: { id: post.id },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
            gbpPostName: result.gbpPostName || null,
          },
          include: { location: { include: { client: true } }, user: true },
        });
        return NextResponse.json({ data: updated }, { status: 201 });
      } else {
        await prisma.post.update({
          where: { id: post.id },
          data: { status: "FAILED", failureReason: result.error || "GBP publish failed" },
        });
        return NextResponse.json({
          data: { ...post, status: "FAILED" },
          error: result.error || "Failed to publish to Google Business Profile.",
        }, { status: 207 });
      }
    }

    return NextResponse.json({ data: post }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// DELETE /api/posts?id=xxx — delete a post
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(session as any).user.isApproved) {
    return NextResponse.json({ error: "Your account is pending approval by rankved.business@gmail.com." }, { status: 403 });
  }
  
  const role = (session as any)?.user?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can delete posts" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Post ID required" }, { status: 400 });

  const success = await deletePost(id);
  return NextResponse.json({ success });
}
