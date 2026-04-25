import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const location = await prisma.location.findUnique({
    where: { id },
    select: {
      aiInstructions: true,
      aiKeywords: true,
      aiTone: true,
      aiCompetitorData: true,
      aiKeywordSequence: true,
      aiCurrentSequenceIndex: true,
    },
  });

  if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });

  return NextResponse.json(location);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const location = await prisma.location.update({
    where: { id },
    data: {
      aiInstructions: body.aiInstructions,
      aiKeywords: body.aiKeywords,
      aiTone: body.aiTone,
      aiCompetitorData: body.aiCompetitorData,
      aiKeywordSequence: body.aiKeywordSequence,
      aiCurrentSequenceIndex: body.aiCurrentSequenceIndex ?? 0,
    },
  });

  return NextResponse.json(location);
}
