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

    // If user requested PUBLISH NOW — start background process
    if (requestedStatus === "PUBLISHED") {
      const accessToken = (session as any)?.accessToken;
      if (!accessToken) {
        await updatePost(id, { status: "FAILED", failureReason: "No Google access token. Please reconnect in Settings.", publishedAt: null });
      } else {
        // Background publish
        (async () => {
          try {
            const result = await publishToGBP({
              post,
              accessToken,
              imageDataUri: body.imageUrl || null,
            });

            if (result.success) {
              await updatePost(id, {
                status: "PUBLISHED",
                publishedAt: new Date().toISOString(),
                gbpPostName: result.gbpPostName || undefined,
              });
            } else {
              await updatePost(id, { status: "FAILED", failureReason: result.error || "GBP publish failed", publishedAt: null });
            }
          } catch (bgErr) {
            console.error("[BG Update Publish] Failed:", bgErr);
          }
        })();
      }
      
      return NextResponse.json({ data: post, message: "Publishing in progress..." });
    }

    return NextResponse.json({ data: post });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
