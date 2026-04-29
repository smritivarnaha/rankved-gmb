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
  imagePrompt?: string;
  topicType: string;
  ctaType?: string;
  ctaUrl?: string;
  keyword?: string;
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
  customKeyword?: string,
  customCtaType?: string
): Promise<GeneratedPost> {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { client: true },
  });

  if (!location) throw new Error("Location not found");

  const keyword = customKeyword || await consumeNextKeyword(locationId);
  const trainingContext = [location.aiInstructions, location.aiCompetitorData].filter(Boolean).join("\n");

  // Determine CTA
  const finalCtaType = customCtaType === "NONE" ? "" : customCtaType;
  const defaultCtaType = (location.aiPhone || location.phone) ? 'CALL' : 'LEARN_MORE';
  const ctaToUse = finalCtaType !== undefined ? finalCtaType : defaultCtaType;

  const systemPrompt = `
    You are an expert Google Business Profile content creator for "${location.name}".
    Business Category: ${location.client.name}
    Tone: ${location.aiTone || "Calm, reassuring, and trust-building"}

    Business Context & Training Data:
    ${trainingContext || "No specific training data provided — use professional general knowledge relevant to the business category."}

    SEO Keywords to weave in naturally: ${location.aiKeywords || ""}

    ${keyword ? `
    *** CENTRAL TOPIC & PRIMARY KEYWORD (MANDATORY) ***
    The ENTIRE post MUST be written about: "${keyword}"
    ` : ""}

    WRITING STYLE GUIDELINES (CRITICAL):
    - VOICE: Write like a doctor speaking directly and warmly to a patient. 
    - STRUCTURE: Use short, simple sentences. Use random line breaks to create a conversational, real-world flow.
    - PHRASING: Avoid robotic or generic filler like "we understand", "in today's world", "at our clinic", or "our team is here".
    - TONE: Calm and reassuring. Build trust, do not sound like a salesman or marketing brochure.
    - EMOTION: Infuse 1-2 places with genuine emotion or empathy.
    - BRAND: Mention "${location.name}" at least 3 times naturally within the content.
    - KEYWORD DENSITY: Use the primary keyword "${keyword || 'the topic'}" at least 5 times organically throughout the post without "stuffing".
    - FLOW: It should read like a real clinic conversation, not marketing copy.
    - CTA: End with a soft, natural call to action.

    IMPORTANT: Respond ONLY with a valid JSON object. No markdown, no code blocks, no extra text.
    The JSON must have exactly these fields:
    {
      "content": "The main post body (max 1500 chars, following the specific doctor-to-patient style and frequency rules above)",
      "topicType": "STANDARD",
      "ctaType": "${ctaToUse}",
      "ctaUrl": "${ctaToUse === 'CALL' || ctaToUse === '' ? '' : (location.aiWebsite || location.client.website || '')}"
    }
    NOTE: If "ctaType" is "CALL", the "ctaUrl" should be an empty string "" as Google uses the profile's phone number automatically.
  `;

  const parsed = await askLLMForJson(systemPrompt, "Generate the GMB post JSON.", settings, provider);
  parsed.keyword = keyword || undefined;
  return parsed;
}

export async function generateImagePrompt(
  postContent: string,
  keyword: string | undefined,
  locationId: string,
  settings: UserAISettings,
  provider: string = "CLAUDE"
): Promise<string> {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { client: true },
  });

  if (!location) throw new Error("Location not found");

  const systemPrompt = `
    You are an expert Google Business Profile image art director for "${location.name}" (Category: ${location.client.name}).
    
    We have just written a post about: ${keyword ? `"${keyword}"` : "general business updates"}.
    Here is the post content:
    """
    ${postContent}
    """

    Based on the post content and keyword, create a highly detailed, descriptive prompt for an AI image generator (like DALL-E 3).
    The image must perfectly match the context, subject, and conclusion of the post.
    
    ${location.aiImageInstructions ? `\nCRITICAL IMAGE INSTRUCTIONS FROM TRAINING DATA:\n${location.aiImageInstructions}\nEnsure these instructions are deeply integrated into the prompt.` : ""}
    
    IMPORTANT RULES FOR THE IMAGE PROMPT:
    - STYLE: Professional, realistic photography. Avoid digital art, 3D renders, or illustrations.
    - COMPOSITION: Simple and focused. One main subject or interaction. Avoid cluttered scenes or "collages".
    - HUMAN PRESENCE: Use realistic humans (e.g., a doctor's hands, a smiling patient, a consultation) to build trust.
    - RELEVANCE: The image must be a literal, realistic scene predicting the post content.
    - VISUAL TONE: Calm, soft, natural lighting (cinematic but realistic).
    - FORBIDDEN: No abstract diagrams, no text, no logos, no multiple floating objects, no surrealism.
    
    Respond ONLY with a valid JSON object. No markdown, no code blocks, no extra text.
    The JSON must have exactly this field:
    {
      "imagePrompt": "A realistic, professional photograph of..."
    }
  `;

  const parsed = await askLLMForJson(systemPrompt, "Generate the image prompt JSON.", settings, provider);
  return parsed.imagePrompt;
}

async function askLLMForJson(systemPrompt: string, userPrompt: string, settings: UserAISettings, provider: string): Promise<any> {
  if (provider === "CLAUDE") {
    if (!settings.anthropicApiKey) throw new Error("Anthropic API key is missing");
    const anthropic = anthropicClient(settings.anthropicApiKey);
    const response = await anthropic.messages.create({
      model: settings.anthropicModel || "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
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
        { role: "user", content: userPrompt }
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
    const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
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
        { role: "user", content: userPrompt }
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
    const safePrompt = `Realistic professional photography, high resolution: ${prompt.replace(/blood|gore|violence|nude|naked|explicit|weapon|death|kill|drug/gi, "").trim()} --no-text`;
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
