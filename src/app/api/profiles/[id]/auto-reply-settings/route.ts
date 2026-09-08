import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/profiles/[id]/auto-reply-settings
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const location = await prisma.location.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        autoReplyEnabled: true,
        autoReplyMinDelayMinutes: true,
        autoReplyMaxDelayMinutes: true,
        autoReplyInstructions: true,
        autoReplyIncludeKeywords: true,
        autoReplyHoldNegative: true,
        aiKeywords: true,
        aiTone: true,
        aiPhone: true,
      },
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    return NextResponse.json(location);
  } catch (err: any) {
    console.error("[Auto-Reply Settings API] GET Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/profiles/[id]/auto-reply-settings
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();

    const updated = await prisma.location.update({
      where: { id },
      data: {
        autoReplyEnabled: body.autoReplyEnabled !== undefined ? Boolean(body.autoReplyEnabled) : undefined,
        autoReplyMinDelayMinutes: body.autoReplyMinDelayMinutes ? parseInt(body.autoReplyMinDelayMinutes, 10) : undefined,
        autoReplyMaxDelayMinutes: body.autoReplyMaxDelayMinutes ? parseInt(body.autoReplyMaxDelayMinutes, 10) : undefined,
        autoReplyInstructions: body.autoReplyInstructions !== undefined ? body.autoReplyInstructions : undefined,
        autoReplyIncludeKeywords: body.autoReplyIncludeKeywords !== undefined ? Boolean(body.autoReplyIncludeKeywords) : undefined,
        autoReplyHoldNegative: body.autoReplyHoldNegative !== undefined ? Boolean(body.autoReplyHoldNegative) : undefined,
      },
      select: {
        id: true,
        name: true,
        autoReplyEnabled: true,
        autoReplyMinDelayMinutes: true,
        autoReplyMaxDelayMinutes: true,
        autoReplyInstructions: true,
        autoReplyIncludeKeywords: true,
        autoReplyHoldNegative: true,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error("[Auto-Reply Settings API] POST Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
