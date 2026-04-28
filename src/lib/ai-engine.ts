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
  openrouterApiKey?: string;
  openrouterModel?: string;
}

/**
 * Generates post content using the selected provider and custom model IDs.
 */
export async function generatePostContent(
  locationId: string, 
  settings: UserAISettings,
  provider: string = "CLAUDE",
  customKeyword?: string
): Promise<GeneratedPost> {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { client: true },
  });

  if (!location) throw new Error("Location not found");

  const keyword = customKeyword || await consumeNextKeyword(locationId);

  const trainingContext = [location.aiInstructions, location.aiCompetitorData].filter(Boolean).join("\n");

  const systemPrompt = `
    You are an expert Google Business Profile content creator for "${location.name}".
    Business Category: ${location.client.name}
    Tone: ${location.aiTone || "Professional and helpful"}

    Business Context & Training Data (always follow this for style, tone, and language):
    ${trainingContext || "No specific training data provided — use professional general knowledge relevant to the business category."}

    SEO Keywords to weave in naturally: ${location.aiKeywords || ""}

    ${keyword ? `
    *** CENTRAL TOPIC FOR THIS POST (MANDATORY) ***
    The ENTIRE post MUST be written about: "${keyword}"
    - The post content must revolve around this topic from start to finish
    - Use "${keyword}" naturally in the post text
    - The imagePrompt must also relate to "${keyword}"
    - Do NOT drift to unrelated topics; stay focused on "${keyword}"
    - Apply the tone, language, and style from the training data above, but always centred on "${keyword}"
    ` : ""}

    IMPORTANT: Respond ONLY with a valid JSON object. No markdown, no code blocks, no extra text.
    The JSON must have exactly these fields:
    {
      "content": "The main post body (max 1500 chars, written entirely around the keyword topic, human-friendly and local)",
      "imagePrompt": "A professional business photography description related to the keyword topic, no people, logos, or text${location.aiImageInstructions ? `. Additional image style requirements: ${location.aiImageInstructions}` : ""}",
      "topicType": "STANDARD",
      "ctaType": "${(location.aiPhone || location.phone) ? 'CALL' : 'LEARN_MORE'}",
      "ctaUrl": "${(location.aiPhone || location.phone) ? '' : (location.aiWebsite || location.client.website || '')}"
    }
    NOTE: If "ctaType" is "CALL", the "ctaUrl" should be an empty string "" as Google uses the profile's phone number automatically.
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

  if (provider === "OPENROUTER") {
    if (!settings.openrouterApiKey) throw new Error("OpenRouter API key is missing");
    const openai = new OpenAI({ 
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: settings.openrouterApiKey 
    });
    const response = await openai.chat.completions.create({
      model: settings.openrouterModel || "openrouter/auto",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the GMB post JSON." }
      ],
      response_format: { type: "json_object" }
    });
    return parseJson(response.choices[0].message.content || "");
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
    // Sanitize prompt: strip any potentially flagged language, keep it professional
    const safePrompt = `Professional business photography, commercial style: ${prompt.replace(/blood|gore|violence|nude|naked|explicit|weapon|death|kill|drug/gi, "").trim()} --no-text --no-people --no-logos`;
    const response = await openai.images.generate({
      model: (settings.openaiImageModel || "dall-e-3") as any,
      prompt: safePrompt,
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
    // Try to extract JSON block if wrapped in markdown code fences
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const cleaned = fenceMatch ? fenceMatch[1].trim() : text.trim();
    
    // Find the first { and last } to isolate the JSON object
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON object found");
    const jsonStr = cleaned.slice(start, end + 1);
    
    return JSON.parse(jsonStr);
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
