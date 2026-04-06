import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAllPosts, createPost, deletePost } from "@/lib/post-store";

// GET /api/posts — list all posts
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");

  let posts = getAllPosts();
  if (profileId) {
    posts = posts.filter(p => p.profileId === profileId);
  }

  return NextResponse.json({ data: posts });
}

// POST /api/posts — create a new post
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const post = createPost({
      profileId: body.profileId,
      profileName: body.profileName || "",
      clientName: body.clientName || "",
      summary: body.summary,
      topicType: body.topicType || "STANDARD",
      ctaType: body.ctaType || "",
      ctaUrl: body.ctaUrl || "",
      finalUrl: body.finalUrl || "",
      imageUrl: body.imageUrl || null,
      geoLat: body.geoLat || "",
      geoLng: body.geoLng || "",
      eventTitle: body.eventTitle || "",
      eventStart: body.eventStart || "",
      eventEnd: body.eventEnd || "",
      status: body.status || "DRAFT",
      scheduledAt: body.scheduledAt || null,
      createdBy: session.user?.email || "unknown",
    });
    return NextResponse.json({ data: post }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// DELETE /api/posts?id=xxx — delete a post
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.user?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can delete posts" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Post ID required" }, { status: 400 });

  const success = deletePost(id);
  return NextResponse.json({ success });
}
