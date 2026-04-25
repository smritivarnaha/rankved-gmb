import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email || "" },
    select: { 
      anthropicApiKey: true, 
      openaiApiKey: true, 
      geminiApiKey: true,
      defaultAiContentProvider: true,
      defaultAiImageProvider: true,
      anthropicModel: true,
      openaiContentModel: true,
      openaiImageModel: true,
      geminiContentModel: true,
      geminiImageModel: true,
    }
  });

  return NextResponse.json(user);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  await prisma.user.update({
    where: { email: session.user?.email || "" },
    data: {
      anthropicApiKey: body.anthropicApiKey,
      openaiApiKey:    body.openaiApiKey,
      geminiApiKey:    body.geminiApiKey,
      defaultAiContentProvider: body.defaultAiContentProvider,
      defaultAiImageProvider:   body.defaultAiImageProvider,
      anthropicModel:     body.anthropicModel,
      openaiContentModel: body.openaiContentModel,
      openaiImageModel:   body.openaiImageModel,
      geminiContentModel: body.geminiContentModel,
      geminiImageModel:   body.geminiImageModel,
    }
  });

  return NextResponse.json({ success: true });
}
