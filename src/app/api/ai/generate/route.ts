import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generatePostContent, generateImagePrompt, generatePostImage, UserAISettings } from "@/lib/ai-engine";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch the user to get their stored API keys and defaults
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email || "" },
    select: { 
      anthropicApiKey: true, openaiApiKey: true, geminiApiKey: true, openrouterApiKey: true,
      defaultAiContentProvider: true, defaultAiImageProvider: true,
      anthropicModel: true, openaiContentModel: true, openaiImageModel: true,
      geminiContentModel: true, geminiImageModel: true, openrouterModel: true
    }
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    const { locationId, mode, customKeyword, ctaType, action, generatedContent, generatedKeyword, generatedImagePrompt } = await req.json(); // action: "CONTENT", "PROMPT", "IMAGE"
    if (!locationId) return NextResponse.json({ error: "locationId is required" }, { status: 400 });

    const location = await prisma.location.findUnique({ where: { id: locationId } });
    if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });

    // Map nulls from Prisma to undefined for the engine
    const aiSettings: UserAISettings = {
      anthropicApiKey: user.anthropicApiKey || undefined,
      openaiApiKey:    user.openaiApiKey    || undefined,
      geminiApiKey:    user.geminiApiKey    || undefined,
      anthropicModel:     user.anthropicModel,
      openaiContentModel: user.openaiContentModel,
      openaiImageModel:   user.openaiImageModel,
      geminiContentModel: user.geminiContentModel,
      geminiImageModel:   user.geminiImageModel,
      openrouterApiKey:   user.openrouterApiKey || undefined,
      openrouterModel:    user.openrouterModel,
    };

    // Resolve Providers
    const contentProvider = location.aiContentProvider === "DEFAULT" || !location.aiContentProvider
      ? (user.defaultAiContentProvider || "CLAUDE")
      : location.aiContentProvider;
    
    const imageProvider = location.aiImageProvider === "DEFAULT" || !location.aiImageProvider
      ? (user.defaultAiImageProvider || "DALL-E-3")
      : location.aiImageProvider;

    // --- Granular Steps for Progressive UI ---
    if (action === "CONTENT") {
      const postData = await generatePostContent(locationId, aiSettings, contentProvider, customKeyword, ctaType);
      return NextResponse.json({ ...postData, status: "DRAFT" });
    }

    if (action === "PROMPT") {
      if (!generatedContent) return NextResponse.json({ error: "generatedContent required for PROMPT" }, { status: 400 });
      const imagePrompt = await generateImagePrompt(generatedContent, generatedKeyword || "", locationId, aiSettings, contentProvider);
      return NextResponse.json({ imagePrompt });
    }

    if (action === "IMAGE") {
      if (!generatedImagePrompt) return NextResponse.json({ error: "generatedImagePrompt required for IMAGE" }, { status: 400 });
      const imageUrl = await generatePostImage(generatedImagePrompt, aiSettings, imageProvider);
      return NextResponse.json({ imageUrl });
    }

    // --- Legacy / Complete Flow (if action is omitted) ---
    const postData = await generatePostContent(locationId, aiSettings, contentProvider, customKeyword, ctaType);
    let imageUrl = null;
    const shouldGenImage = mode ? (mode === "BOTH" || mode === "IMAGE") : location.aiImageEnabled;

    if (shouldGenImage) {
      const imagePrompt = await generateImagePrompt(postData.content, postData.keyword, locationId, aiSettings, contentProvider);
      postData.imagePrompt = imagePrompt;
      imageUrl = await generatePostImage(imagePrompt, aiSettings, imageProvider);
    }

    return NextResponse.json({
      ...postData,
      imageUrl,
      status: "DRAFT"
    });
  } catch (err: any) {
    console.error("[AI Generate Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
