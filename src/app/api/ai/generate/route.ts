import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generatePostContent, generatePostImage } from "@/lib/ai-engine";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch the user to get their stored API keys
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email || "" },
    select: { anthropicApiKey: true, openaiApiKey: true, geminiApiKey: true }
  });

  const apiKeys = {
    anthropic: user?.anthropicApiKey || process.env.ANTHROPIC_API_KEY,
    openai:    user?.openaiApiKey    || process.env.OPENAI_API_KEY,
    gemini:    user?.geminiApiKey    || process.env.GEMINI_API_KEY,
  };

  if (!apiKeys.openai) {
    return NextResponse.json({ error: "OpenAI API Key is missing. Required for images." }, { status: 400 });
  }

  try {
    const { locationId } = await req.json();
    if (!locationId) return NextResponse.json({ error: "locationId is required" }, { status: 400 });

    // Step 1: Generate Content & Prompt
    const postData = await generatePostContent(locationId, apiKeys);

    // Step 2: Generate Image
    const imageUrl = await generatePostImage(postData.imagePrompt, apiKeys.openai);

    return NextResponse.json({
      ...postData,
      imageUrl,
    });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to generate AI content." 
    }, { status: 500 });
  }
}
