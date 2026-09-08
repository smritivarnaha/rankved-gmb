import prisma from "./prisma";
import { UserAISettings } from "./ai-engine";
import { Anthropic } from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ReviewReplyResult {
  reply: string;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  keywordUsed?: string;
  tone: string;
  options?: {
    warm: string;
    short: string;
    seoFocused: string;
  };
}

export interface GenerateReviewReplyParams {
  locationId: string;
  reviewText?: string | null;
  reviewerName?: string | null;
  rating?: number | null;
  preferredTone?: "WARM" | "SHORT" | "SEO_FOCUSED";
  userId?: string;
}

/**
 * Resolves user's AI API keys from the DB or environment
 */
export async function resolveUserAiSettings(userId?: string): Promise<UserAISettings> {
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        anthropicApiKey: true,
        openaiApiKey: true,
        geminiApiKey: true,
        openrouterApiKey: true,
        anthropicModel: true,
        openaiContentModel: true,
        geminiContentModel: true,
        openrouterModel: true,
        ownerId: true,
      },
    });

    if (user?.anthropicApiKey || user?.openaiApiKey || user?.geminiApiKey || user?.openrouterApiKey) {
      return {
        anthropicApiKey: user.anthropicApiKey || undefined,
        openaiApiKey: user.openaiApiKey || undefined,
        geminiApiKey: user.geminiApiKey || undefined,
        openrouterApiKey: user.openrouterApiKey || undefined,
        anthropicModel: user.anthropicModel || undefined,
        openaiContentModel: user.openaiContentModel || undefined,
        geminiContentModel: user.geminiContentModel || undefined,
        openrouterModel: user.openrouterModel || undefined,
      };
    }

    // Fallback to Agency Owner keys
    if (user?.ownerId) {
      const owner = await prisma.user.findUnique({
        where: { id: user.ownerId },
        select: {
          anthropicApiKey: true,
          openaiApiKey: true,
          geminiApiKey: true,
          openrouterApiKey: true,
          anthropicModel: true,
          openaiContentModel: true,
          geminiContentModel: true,
          openrouterModel: true,
        },
      });
      if (owner?.anthropicApiKey || owner?.openaiApiKey || owner?.geminiApiKey || owner?.openrouterApiKey) {
        return {
          anthropicApiKey: owner.anthropicApiKey || undefined,
          openaiApiKey: owner.openaiApiKey || undefined,
          geminiApiKey: owner.geminiApiKey || undefined,
          openrouterApiKey: owner.openrouterApiKey || undefined,
          anthropicModel: owner.anthropicModel || undefined,
          openaiContentModel: owner.openaiContentModel || undefined,
          geminiContentModel: owner.geminiContentModel || undefined,
          openrouterModel: owner.openrouterModel || undefined,
        };
      }
    }
  }

  // Fallback to any Super Admin configured key in the system
  const admin = await prisma.user.findFirst({
    where: {
      role: "SUPER_ADMIN",
      OR: [
        { anthropicApiKey: { not: null } },
        { openaiApiKey: { not: null } },
        { geminiApiKey: { not: null } },
        { openrouterApiKey: { not: null } },
      ],
    },
    select: {
      anthropicApiKey: true,
      openaiApiKey: true,
      geminiApiKey: true,
      openrouterApiKey: true,
      anthropicModel: true,
      openaiContentModel: true,
      geminiContentModel: true,
      openrouterModel: true,
    },
  });

  return {
    anthropicApiKey: admin?.anthropicApiKey || process.env.ANTHROPIC_API_KEY || undefined,
    openaiApiKey: admin?.openaiApiKey || process.env.OPENAI_API_KEY || undefined,
    geminiApiKey: admin?.geminiApiKey || process.env.GEMINI_API_KEY || undefined,
    openrouterApiKey: admin?.openrouterApiKey || process.env.OPENROUTER_API_KEY || undefined,
    anthropicModel: admin?.anthropicModel || undefined,
    openaiContentModel: admin?.openaiContentModel || undefined,
    geminiContentModel: admin?.geminiContentModel || undefined,
    openrouterModel: admin?.openrouterModel || undefined,
  };
}

/**
 * Executes prompt across the available AI provider
 */
async function callLLM(prompt: string, settings: UserAISettings): Promise<string> {
  // 1. Anthropic Claude (Preferred for humanized nuance)
  if (settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY) {
    const key = settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY!;
    const anthropic = new Anthropic({ apiKey: key });
    const model = settings.anthropicModel || "claude-3-5-sonnet-20241022";
    const resp = await anthropic.messages.create({
      model,
      max_tokens: 600,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    });
    const block = resp.content[0];
    if (block.type === "text") return block.text;
  }

  // 2. OpenAI GPT
  if (settings.openaiApiKey || process.env.OPENAI_API_KEY) {
    const key = settings.openaiApiKey || process.env.OPENAI_API_KEY!;
    const openai = new OpenAI({ apiKey: key });
    const model = settings.openaiContentModel || "gpt-4o";
    const resp = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 600,
    });
    return resp.choices[0]?.message?.content || "";
  }

  // 3. Google Gemini
  if (settings.geminiApiKey || process.env.GEMINI_API_KEY) {
    const key = settings.geminiApiKey || process.env.GEMINI_API_KEY!;
    const genAI = new GoogleGenerativeAI(key);
    const modelName = settings.geminiContentModel || "gemini-1.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });
    const resp = await model.generateContent(prompt);
    return resp.response.text();
  }

  // 4. OpenRouter
  if (settings.openrouterApiKey || process.env.OPENROUTER_API_KEY) {
    const key = settings.openrouterApiKey || process.env.OPENROUTER_API_KEY!;
    const model = settings.openrouterModel || "anthropic/claude-3.5-sonnet";
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  throw new Error("No AI API keys configured. Please add an Anthropic, OpenAI, or Gemini key in Settings.");
}

/**
 * Sanitizes and cleans the generated reply against bot patterns and em dashes
 */
function cleanReplyText(text: string): string {
  return text
    .replace(/["“”]/g, "")           // strip surrounding quotes
    .replace(/[—–]/g, ", ")          // STRICT RULE: No em dashes or en dashes
    .replace(/\s{2,}/g, " ")         // normalize spaces
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/**
 * Generates a high-precision, sentiment-aware, humanized Google Review Reply
 */
export async function generateSmartReviewReply(params: GenerateReviewReplyParams): Promise<ReviewReplyResult> {
  const { locationId, reviewText, reviewerName, rating = 5, preferredTone = "WARM", userId } = params;

  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { client: true },
  });

  if (!location) throw new Error("Location not found");

  const settings = await resolveUserAiSettings(userId || location.client?.userId);

  // Parse keywords
  const keywordsList = (location.aiKeywords || "")
    .split(/[,;\n]/)
    .map(k => k.trim())
    .filter(Boolean);

  // Pick 1 relevant keyword
  const targetKeyword = keywordsList.length > 0
    ? keywordsList[Math.floor(Math.random() * keywordsList.length)]
    : undefined;

  const isNegative = rating !== null && rating !== undefined ? rating <= 2 : false;
  const isNeutral = rating === 3;
  const isPositive = rating !== null && rating !== undefined ? rating >= 4 : true;

  const sentiment = isNegative ? "NEGATIVE" : isNeutral ? "NEUTRAL" : "POSITIVE";

  // Business Context
  const businessName = location.name;
  const customerName = reviewerName?.trim() || "Customer";
  const contactPhone = location.aiPhone || location.phone || "";
  const contactEmail = location.googleEmail || "";
  const knowledgeBase = [location.autoReplyInstructions, location.aiInstructions].filter(Boolean).join("\n");

  const prompt = `
You are the business manager/owner of "${businessName}" responding personally to a customer Google review.

CUSTOMER REVIEW DETAILS:
- Reviewer Name: ${customerName}
- Star Rating: ${rating || 5} out of 5 Stars
- Customer Review Comment: "${reviewText || "(No written text, only star rating provided)"}"

BUSINESS INFORMATION & KNOWLEDGE BASE:
- Business Name: ${businessName}
- Category: ${location.client.name}
- Contact Phone: ${contactPhone || "our clinic/office"}
- Contact Email: ${contactEmail || "our support team"}
- Knowledge Base & Specific Handling Rules:
${knowledgeBase || "Provide friendly, attentive service."}

TARGET SEO KEYWORD TO WEAVE IN NATURALLY (IF REVIEW IS POSITIVE):
"${targetKeyword || ""}"

============================================================
CRITICAL WRITING INSTRUCTIONS (STRICT COMPLIANCE REQUIRED):
============================================================
1. NO EM DASHES OR EN DASHES (— or –): Absolutely NEVER use em-dashes. Use regular commas, periods, or simple hyphens.
2. NO CLICHES OR ROBOTIC FILLER: Never say "We strive for excellence", "Your feedback is valuable to us", "In today's fast-paced world", "At our establishment", or "Thank you for taking the time".
3. HUMAN LENGTH: Keep it short, crisp, and conversational (1 to 3 sentences maximum, between 30 and 60 words).
4. SENTIMENT HANDLING:
   ${isNegative ? `
   - THIS IS A NEGATIVE / DISSATISFIED REVIEW (${rating}★):
   - Acknowledge the customer's frustration with genuine empathy and humility.
   - Apologize sincerely that their experience fell short of expectations.
   - Do NOT be defensive or argue.
   - Invite them to reach out directly to ${contactPhone ? `our phone (${contactPhone})` : contactEmail ? `our email (${contactEmail})` : "our team"} so you can resolve this privately.
   ` : isNeutral ? `
   - THIS IS A NEUTRAL REVIEW (${rating}★):
   - Thank them for their balanced feedback.
   - Acknowledge their specific point and reaffirm your commitment to continuous care.
   ` : `
   - THIS IS A POSITIVE REVIEW (${rating}★):
   - Thank ${customerName} warmly and personally.
   - If they mentioned specific details, reference it naturally.
   - Naturally mention the SEO keyword "${targetKeyword || ''}" once organically without keyword stuffing.
   `}
5. DYNAMIC GREETINGS & VARIETY:
   - Vary greeting naturally: ("Hi ${customerName},", "Hello ${customerName},", "Dear ${customerName},", or direct opening).

Respond in EXACTLY this JSON format (no markdown code blocks, just raw JSON):
{
  "warm": "Warm, personalized 2-3 sentence response",
  "short": "Short, direct 1-2 sentence response",
  "seoFocused": "Response naturally incorporating the SEO keyword",
  "keywordUsed": "${targetKeyword || ''}",
  "sentiment": "${sentiment}"
}
`.trim();

  const rawJson = await callLLM(prompt, settings);

  let parsed: any = {};
  try {
    const cleaned = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = {
      warm: cleanReplyText(rawJson),
      short: cleanReplyText(rawJson),
      seoFocused: cleanReplyText(rawJson),
      sentiment,
    };
  }

  const warm = cleanReplyText(parsed.warm || rawJson);
  const short = cleanReplyText(parsed.short || warm);
  const seoFocused = cleanReplyText(parsed.seoFocused || warm);

  let selectedReply = warm;
  if (preferredTone === "SHORT") selectedReply = short;
  if (preferredTone === "SEO_FOCUSED") selectedReply = seoFocused;

  return {
    reply: selectedReply,
    sentiment,
    keywordUsed: parsed.keywordUsed || targetKeyword,
    tone: preferredTone,
    options: {
      warm,
      short,
      seoFocused,
    },
  };
}
