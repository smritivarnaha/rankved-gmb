import { Anthropic } from "@anthropic-ai/sdk";
import OpenAI from "openai";
import prisma from "./prisma";

// Initialize clients (these will throw if keys are missing when called)
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const getOpenAI = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface GeneratedPost {
  content: string;
  imagePrompt: string;
  topicType: string;
  ctaType?: string;
  ctaUrl?: string;
}

/**
 * Generates post content using Claude 3.5 Sonnet.
 * Injects profile-specific instructions, keywords, and competitor data.
 */
export async function generatePostContent(locationId: string): Promise<GeneratedPost> {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { client: true },
  });

  if (!location) throw new Error("Location not found");

  // Handle Keyword Sequencing
  const keyword = await consumeNextKeyword(locationId);

  const anthropic = getAnthropic();

  const systemPrompt = `
    You are an expert Google Business Profile content creator for "${location.name}".
    Category: ${location.client.name}
    Tone: ${location.aiTone || "Professional and helpful"}
    
    Instructions:
    ${location.aiInstructions || "Create engaging posts that drive local engagement."}
    
    Keywords to include: ${location.aiKeywords || ""}
    ${keyword ? `Primary Topic for this post: ${keyword}` : ""}

    Competitor Style Reference (Optional):
    ${location.aiCompetitorData || "None provided."}

    Format your response as a valid JSON object with the following fields:
    {
      "content": "The main post body (max 1500 chars)",
      "imagePrompt": "A detailed, high-quality DALL-E 3 prompt for a professional image matching this post",
      "topicType": "STANDARD",
      "ctaType": "LEARN_MORE",
      "ctaUrl": "${location.client.website || ""}"
    }
  `;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: "user", content: "Generate a new GMB post based on the system instructions." }],
  });

  const text = (response.content[0] as any).text;
  try {
    return JSON.parse(text);
  } catch (e) {
    // Fallback if Claude doesn't return clean JSON
    console.error("Failed to parse Claude response as JSON:", text);
    throw new Error("AI returned invalid format. Please try again.");
  }
}

/**
 * Generates an image using DALL-E 3 based on the prompt provided.
 * Note: In a real app, you'd upload this to Supabase/S3. For now, returns the URL.
 */
export async function generatePostImage(prompt: string): Promise<string> {
  const openai = getOpenAI();

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `${prompt} --no-text`, // Try to prevent DALL-E from adding weird text
    n: 1,
    size: "1024x1024",
    quality: "standard",
  });

  return response.data[0].url || "";
}

/**
 * Logic to pull the next keyword from the sequence and increment the index.
 */
async function consumeNextKeyword(locationId: string): Promise<string | null> {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { aiKeywordSequence: true, aiCurrentSequenceIndex: true },
  });

  if (!location?.aiKeywordSequence) return null;

  const sequence = location.aiKeywordSequence.split(",").map(s => s.trim()).filter(s => s.length > 0);
  if (sequence.length === 0) return null;

  const index = location.aiCurrentSequenceIndex % sequence.length;
  const keyword = sequence[index];

  // Increment index for next time
  await prisma.location.update({
    where: { id: locationId },
    data: { aiCurrentSequenceIndex: location.aiCurrentSequenceIndex + 1 },
  });

  return keyword;
}
