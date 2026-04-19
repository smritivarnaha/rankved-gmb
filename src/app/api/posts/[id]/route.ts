import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPostById, updatePost } from "@/lib/post-store";
import { publishToGBP } from "@/lib/gbp-publisher";

// GET /api/posts/[id] — get a single post
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await getPostById(id);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  return NextResponse.json({ data: post });
}

// PUT /api/posts/[id] — update a post
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    const requestedStatus = body.status;
    const initialStatus = requestedStatus === "PUBLISHED" ? "DRAFT" : requestedStatus;

    const post = await updatePost(id, {
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
      status: initialStatus,
      scheduledAt: body.scheduledAt,
    });

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    // If user requested PUBLISH NOW — call GBP API immediately
    if (requestedStatus === "PUBLISHED") {
      const accessToken = (session as any)?.accessToken;
      if (!accessToken) {
        await updatePost(id, { status: "FAILED", failureReason: "No Google access token. Please reconnect in Settings.", publishedAt: null });
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
        const publishedPost = await updatePost(id, {
          status: "PUBLISHED",
          publishedAt: new Date(),
          gbpPostName: result.gbpPostName || undefined,
        });
        return NextResponse.json({ data: publishedPost });
      } else {
        await updatePost(id, { status: "FAILED", failureReason: result.error || "GBP publish failed", publishedAt: null });
        return NextResponse.json({
          data: { ...post, status: "FAILED" },
          error: result.error || "Failed to publish to Google Business Profile.",
        }, { status: 207 });
      }
    }

    return NextResponse.json({ data: post });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
