import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generatePostContent, generatePostImage } from "@/lib/ai-engine";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { locationId } = await req.json();
    if (!locationId) return NextResponse.json({ error: "locationId is required" }, { status: 400 });

    // Step 1: Generate Content & Prompt
    const postData = await generatePostContent(locationId);

    // Step 2: Generate Image
    const imageUrl = await generatePostImage(postData.imagePrompt);

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
