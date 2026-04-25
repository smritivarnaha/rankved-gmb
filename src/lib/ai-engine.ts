import { Anthropic } from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "./prisma";

// Helper to initialize clients with provided keys
const anthropicClient = (key: string) => new Anthropic({ apiKey: key });
const openaiClient = (key: string) => new OpenAI({ apiKey: key });
const geminiClient = (key: string) => new GoogleGenerativeAI(key);

export interface GeneratedPost {
  content: string;
  imagePrompt: string;
  topicType: string;
  ctaType?: string;
  ctaUrl?: string;
}

/**
 * Generates post content using the selected provider (Claude, GPT, or Gemini).
 */
export async function generatePostContent(
  locationId: string, 
  apiKeys: { anthropic?: string; openai?: string; gemini?: string }
): Promise<GeneratedPost> {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { client: true },
  });

  if (!location) throw new Error("Location not found");

  const provider = location.aiContentProvider || "CLAUDE";
  const keyword = await consumeNextKeyword(locationId);

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

    Format your response STRICTLY as a valid JSON object with the following fields:
    {
      "content": "The main post body (max 1500 chars)",
      "imagePrompt": "A detailed, high-quality DALL-E 3 prompt for a professional image matching this post",
      "topicType": "STANDARD",
      "ctaType": "LEARN_MORE",
      "ctaUrl": "${location.client.website || ""}"
    }
  `;

  if (provider === "CLAUDE") {
    if (!apiKeys.anthropic) throw new Error("Anthropic API key is missing");
    const anthropic = anthropicClient(apiKeys.anthropic);
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: "Generate the GMB post JSON." }],
    });
    return parseJson((response.content[0] as any).text);
  } 
  
  if (provider === "GPT") {
    if (!apiKeys.openai) throw new Error("OpenAI API key is missing");
    const openai = openaiClient(apiKeys.openai);
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the GMB post JSON." }
      ],
      response_format: { type: "json_object" }
    });
    return parseJson(response.choices[0].message.content || "");
  }

  if (provider === "GEMINI") {
    if (!apiKeys.gemini) throw new Error("Gemini API key is missing");
    const genAI = geminiClient(apiKeys.gemini);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent(`${systemPrompt}\n\nGenerate the GMB post JSON.`);
    const response = await result.response;
    return parseJson(response.text());
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

/**
 * Generates an image using the selected provider (currently only DALL-E 3).
 */
export async function generatePostImage(prompt: string, openaiKey: string): Promise<string> {
  const openai = openaiClient(openaiKey);
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `${prompt} --no-text`,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  });
  return response.data?.[0]?.url || "";
}

function parseJson(text: string): GeneratedPost {
  try {
    // Strip markdown code blocks if present
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("Failed to parse AI response:", text);
    throw new Error("AI returned invalid JSON. Please try again.");
  }
}

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
  await prisma.location.update({
    where: { id: locationId },
    data: { aiCurrentSequenceIndex: location.aiCurrentSequenceIndex + 1 },
  });
  return keyword;
}
