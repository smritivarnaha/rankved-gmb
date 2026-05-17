import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAllPosts, getPostsByProfile, createPost, deletePost } from "@/lib/post-store";
import { publishToGBP } from "@/lib/gbp-publisher";
import prisma from "@/lib/prisma";
import { getGoogleAccessTokenForLocation } from "@/lib/google-token";
import { notifyAdmin, getTemplate } from "@/lib/notifications";

// GET /api/posts — list all posts
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).user.id;
  const role = (session as any).user.role;
  const ownerId = (session as any).user.ownerId;

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");

  let posts = [];
  if (profileId) {
    posts = await getPostsByProfile(profileId, userId, role, ownerId);
  } else {
    posts = await getAllPosts(userId, role, ownerId);
  }

  return NextResponse.json({ data: posts });
}

// POST /api/posts — create and optionally publish a post
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any)?.user?.id;
  if (!userId) return NextResponse.json({ error: "Could not determine user ID." }, { status: 401 });

  try {
    const body = await req.json();
    const profileId = body.profileId || body.locationId;
    const imageUrl = body.imageUrl || body.mediaUrl;

    if (!profileId) return NextResponse.json({ error: "Profile/Location ID is required" }, { status: 400 });

    // Always save to DB first (as DRAFT or SCHEDULED)
    const initialStatus = body.status === "PUBLISHED" ? "DRAFT" : (body.status || "DRAFT");

    const post = await createPost(
      {
        profileId,
        profileName: body.profileName || "",
        clientName: body.clientName || "",
        summary: body.summary,
        focusKeyword: body.focusKeyword || null,
        topicType: body.topicType || "STANDARD",
        ctaType: body.ctaType || "",
        ctaUrl: body.ctaUrl || "",
        imageUrl: imageUrl || null,
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

    // If user requested PUBLISH NOW — start background process
    if (body.status === "PUBLISHED") {
      const accessToken = await getGoogleAccessTokenForLocation(profileId);
      
      if (!accessToken) {
        const updatedPost = await prisma.post.update({
          where: { id: post.id },
          data: { status: "FAILED", failureReason: "No Google access token. Please reconnect in Settings." },
        });
        return NextResponse.json({ data: updatedPost, message: "Publish failed: No Google access token" }, { status: 400 });
      } else {
        try {
          const result = await publishToGBP({
            post,
            accessToken,
            imageDataUri: body.imageUrl || null,
          });

          if (result.success) {
            const updatedPost = await prisma.post.update({
              where: { id: post.id },
              data: {
                status: "PUBLISHED",
                publishedAt: new Date(),
                gbpPostName: result.gbpPostName || null,
              },
            });
            const template = await getTemplate("SUCCESS", updatedPost);
            await notifyAdmin(template);
            return NextResponse.json({ data: updatedPost, message: "Published successfully" }, { status: 201 });
          } else {
            const updatedPost = await prisma.post.update({
              where: { id: post.id },
              data: { status: "FAILED", failureReason: result.error || "GBP publish failed" },
            });
            const template = await getTemplate("FAILURE", { ...updatedPost, error: result.error });
            await notifyAdmin(template);
            return NextResponse.json({ data: updatedPost, message: "Publish failed: " + (result.error || "Unknown error") }, { status: 400 });
          }
        } catch (bgErr) {
          console.error("[Publish] Failed:", bgErr);
          const updatedPost = await prisma.post.update({
            where: { id: post.id },
            data: { status: "FAILED", failureReason: "Unexpected server error during publish." },
          });
          return NextResponse.json({ data: updatedPost, message: "Publish failed: Unexpected server error" }, { status: 500 });
        }
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

  const role = (session as any)?.user?.role;
  // Allow any approved/signed-in user to delete posts (owners, team members, super admins)
  const allowedRoles = ["SUPER_ADMIN", "AGENCY_OWNER", "TEAM_MEMBER"];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "You do not have permission to delete posts." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Post ID required" }, { status: 400 });

  const success = await deletePost(id);
  if (!success) return NextResponse.json({ error: "Post not found or already deleted." }, { status: 404 });
  return NextResponse.json({ success: true });
}
