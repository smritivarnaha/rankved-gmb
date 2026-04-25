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

export interface UserAISettings {
  anthropicApiKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  anthropicModel?: string;
  openaiContentModel?: string;
  openaiImageModel?: string;
  geminiContentModel?: string;
  geminiImageModel?: string;
}

/**
 * Generates post content using the selected provider and custom model IDs.
 */
export async function generatePostContent(
  locationId: string, 
  settings: UserAISettings,
  provider: string = "CLAUDE"
): Promise<GeneratedPost> {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { client: true },
  });

  if (!location) throw new Error("Location not found");

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
      "imagePrompt": "A detailed, high-quality professional image prompt matching this post",
      "topicType": "STANDARD",
      "ctaType": "LEARN_MORE",
      "ctaUrl": "${location.client.website || ""}"
    }
  `;

  if (provider === "CLAUDE") {
    if (!settings.anthropicApiKey) throw new Error("Anthropic API key is missing");
    const anthropic = anthropicClient(settings.anthropicApiKey);
    const response = await anthropic.messages.create({
      model: settings.anthropicModel || "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: "Generate the GMB post JSON." }],
    });
    return parseJson((response.content[0] as any).text);
  } 
  
  if (provider === "GPT") {
    if (!settings.openaiApiKey) throw new Error("OpenAI API key is missing");
    const openai = openaiClient(settings.openaiApiKey);
    const response = await openai.chat.completions.create({
      model: settings.openaiContentModel || "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the GMB post JSON." }
      ],
      response_format: { type: "json_object" }
    });
    return parseJson(response.choices[0].message.content || "");
  }

  if (provider === "GEMINI") {
    if (!settings.geminiApiKey) throw new Error("Google API key is missing");
    const genAI = geminiClient(settings.geminiApiKey);
    const model = genAI.getGenerativeModel({ 
      model: settings.geminiContentModel || "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    const result = await model.generateContent(`${systemPrompt}\n\nGenerate the GMB post JSON.`);
    const response = await result.response;
    return parseJson(response.text());
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

/**
 * Generates an image using the selected provider and custom model IDs.
 */
export async function generatePostImage(
  prompt: string, 
  settings: UserAISettings,
  provider: string = "DALL-E-3"
): Promise<string> {
  
  if (provider === "DALL-E-3") {
    if (!settings.openaiApiKey) throw new Error("OpenAI API key is missing");
    const openai = openaiClient(settings.openaiApiKey);
    const response = await openai.images.generate({
      model: (settings.openaiImageModel || "dall-e-3") as any,
      prompt: `${prompt} --no-text`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });
    return response.data?.[0]?.url || "";
  }

  if (provider === "GEMINI") {
    if (!settings.geminiApiKey) throw new Error("Google API key is missing");
    
    const modelId = settings.geminiImageModel || "imagen-3.0-generate-001";
    
    // Attempt Imagen 3 via Direct REST API call
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predict?key=${settings.geminiApiKey}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1 }
        })
      });

      const data = await resp.json();
      
      if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
        return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
      }

      // If Imagen failed, only fallback to DALL-E if user has it, otherwise throw the error
      if (settings.openaiApiKey) {
        console.log("Imagen 3 prediction failed or returned no data. Falling back to DALL-E.");
        const openai = openaiClient(settings.openaiApiKey);
        const oresp = await openai.images.generate({ model: "dall-e-3", prompt, n: 1 });
        return oresp.data?.[0]?.url || "";
      }

      const errorMsg = data.error?.message || "Imagen 3 generation failed or is not available on this API key.";
      throw new Error(errorMsg);
    } catch (e: any) {
      // Final attempt: if it's an OpenAI key error and we have no OpenAI key
      if (!settings.openaiApiKey) {
        throw new Error(`Google Image Gen Error: ${e.message}. Note: Google requires specific access for Imagen 3.`);
      }
      // If we have an OpenAI key, we already tried fallback above or will catch here
      throw e;
    }
  }

  throw new Error(`Unsupported image provider: ${provider}`);
}

function parseJson(text: string): GeneratedPost {
  try {
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
