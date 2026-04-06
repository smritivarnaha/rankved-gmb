import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPostById, updatePost } from "@/lib/post-store";

// GET /api/posts/[id] — get a single post
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = getPostById(params.id);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  return NextResponse.json({ data: post });
}

// PUT /api/posts/[id] — update a post
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const updated = updatePost(params.id, {
      profileId: body.profileId,
      profileName: body.profileName,
      clientName: body.clientName,
      summary: body.summary,
      topicType: body.topicType,
      ctaType: body.ctaType,
      ctaUrl: body.ctaUrl,
      finalUrl: body.finalUrl,
      imageUrl: body.imageUrl,
      geoLat: body.geoLat,
      geoLng: body.geoLng,
      eventTitle: body.eventTitle,
      eventStart: body.eventStart,
      eventEnd: body.eventEnd,
      status: body.status,
      scheduledAt: body.scheduledAt,
    });

    if (!updated) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
