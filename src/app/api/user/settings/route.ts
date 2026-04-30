import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function resolveUserWhere(sessionUser: any) {
  // Always prefer userId (set for credential logins including Agency Owner).
  // Fall back to email only for pure Google-first logins.
  if (sessionUser?.id) return { id: sessionUser.id };
  if (sessionUser?.email) return { email: sessionUser.email };
  return null;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = resolveUserWhere((session as any).user);
  if (!where) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findFirst({
    where,
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
      openrouterApiKey: true,
      openrouterModel: true,
    }
  });

  return NextResponse.json(user);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = resolveUserWhere((session as any).user);
  if (!where) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  await prisma.user.updateMany({
    where,
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
      openrouterApiKey:   body.openrouterApiKey,
      openrouterModel:    body.openrouterModel,
    }
  });

  return NextResponse.json({ success: true });
}
