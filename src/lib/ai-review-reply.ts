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
  // 1. Anthropic Claude (Preferred for grounded professional nuance)
  if (settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY) {
    const key = settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY!;
    const anthropic = new Anthropic({ apiKey: key });
    const model = settings.anthropicModel || "claude-3-5-sonnet-20241022";
    const resp = await anthropic.messages.create({
      model,
      max_tokens: 700,
      temperature: 0.65,
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
      temperature: 0.65,
      max_tokens: 700,
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
        temperature: 0.65,
        max_tokens: 700,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  throw new Error("No AI API keys configured. Please add an Anthropic, OpenAI, or Gemini key in Settings.");
}

/**
 * Sanitizes and cleans the generated reply against bot patterns, first-person singular, and em dashes
 */
function cleanReplyText(text: string): string {
  let cleaned = text
    .replace(/["“”]/g, "")           // strip surrounding quotes
    .replace(/[—–]/g, ", ")          // STRICT RULE: No em dashes or en dashes
    .replace(/\b(I am|I'm)\b/gi, "We are")
    .replace(/\bI have\b/gi, "We have")
    .replace(/\bI look forward\b/gi, "We look forward")
    .replace(/\bI appreciate\b/gi, "We appreciate")
    .replace(/\bmy team\b/gi, "our team")
    .replace(/\bmy clinic\b/gi, "our clinic")
    .replace(/\bmy practice\b/gi, "our practice")
    .replace(/\bthrilled\b/gi, "very pleased")
    .replace(/\bsuper excited\b/gi, "glad")
    .replace(/\becstatic\b/gi, "happy")
    .replace(/\s{2,}/g, " ")         // normalize spaces
    .replace(/\n{2,}/g, "\n")
    .trim();

  return cleaned;
}

/**
 * Extracts a concise city or locality from an address string
 */
function extractCityOrArea(address?: string | null): string {
  if (!address) return "";
  const parts = address.split(",").map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    // Return second to last or last part (usually City or Area)
    return parts[parts.length - 2] || parts[parts.length - 1];
  }
  return parts[0] || "";
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

  // Parse keywords and local context
  const rawKeywords = (location.aiKeywords || "")
    .split(/[,;\n]/)
    .map(k => k.trim())
    .filter(Boolean);

  const cityOrArea = extractCityOrArea(location.address);
  const categoryName = location.client?.name || "Professional Healthcare & Services";

  // Build target keywords pool
  const candidateKeywords: string[] = [];
  if (rawKeywords.length > 0) candidateKeywords.push(...rawKeywords);
  if (cityOrArea) {
    candidateKeywords.push(`${categoryName} in ${cityOrArea}`);
    if (location.name) candidateKeywords.push(`${location.name} in ${cityOrArea}`);
  }

  // Pick 1 relevant keyword
  const targetKeyword = candidateKeywords.length > 0
    ? candidateKeywords[Math.floor(Math.random() * candidateKeywords.length)]
    : `${categoryName}${cityOrArea ? ` in ${cityOrArea}` : ""}`;

  const isNegative = rating !== null && rating !== undefined ? rating <= 2 : false;
  const isNeutral = rating === 3;
  const isPositive = rating !== null && rating !== undefined ? rating >= 4 : true;

  const sentiment = isNegative ? "NEGATIVE" : isNeutral ? "NEUTRAL" : "POSITIVE";

  // Business Context
  const businessName = location.name;
  const customerName = reviewerName?.trim() || "Customer";
  const contactPhone = location.aiPhone || location.phone || "";
  const contactEmail = location.googleEmail || "";
  const knowledgeBase = [location.autoReplyInstructions, location.aiInstructions, location.aiCompetitorData].filter(Boolean).join("\n");

  const prompt = `
You are the management and clinical team of "${businessName}" (${categoryName}) writing an official Google Review reply.

CUSTOMER REVIEW DETAILS:
- Reviewer Name: ${customerName}
- Star Rating: ${rating || 5} out of 5 Stars
- Customer Review Comment: "${reviewText || "(Customer left a 5-star rating without written comment)"}"

BUSINESS & LOCATION CONTEXT:
- Business Profile Name: ${businessName}
- Category: ${categoryName}
- Location / City: ${cityOrArea || "our center"}
- Address: ${location.address || ""}
- Contact Phone: ${contactPhone || ""}
- Contact Email: ${contactEmail || ""}
- Knowledge Base / Special Rules:
${knowledgeBase || "Provide attentive, respectful, and high-quality patient care."}

MANDATORY LOCAL SEO KEYWORD TO WEAVE IN NATURALLY:
"${targetKeyword}"

============================================================
CRITICAL WRITING INSTRUCTIONS (STRICT COMPLIANCE REQUIRED):
============================================================
1. MANDATORY PRONOUN: Always write as a cohesive team using "WE", "OUR TEAM", "OUR CLINIC", or "OUR PRACTICE". NEVER write in the singular first person ("I", "my", "I am", "I'm").
2. HIGH PROFESSIONALISM & CALM DIGNITY:
   - Speak with calm, grounded, clinical/professional authority and warmth.
   - ABSOLUTELY NEVER use over-excited marketing words like "thrilled", "super excited", "overjoyed", "ecstatic", or spammy exclamation marks.
3. EXPAND NATURALLY ON THE REVIEW'S BASIS:
   - Do NOT give a 1-sentence robotic generic reply.
   - Expand meaningfully (2 to 3 well-written sentences, around 45 to 75 words).
   - Thoughtfully reference what the customer specifically noted (e.g. if they mentioned consultation, guidance, diagnosis, treatment, doctor's explanation, staff care, or prompt service, elaborate on our commitment to clear guidance and thorough care).
4. MANDATORY KEYWORD INCLUSION:
   - For positive/neutral reviews, organically integrate the local SEO keyword ("${targetKeyword}") or service reference into the body sentence so it reads completely natural to a human.
5. NO EM DASHES OR EN DASHES (— or –): Absolutely NEVER use em dashes. Use standard commas or periods.
6. NO ROBOTIC CLICHES: Never say "We strive for excellence", "Your feedback is valuable to us", "In today's fast-paced world", or "At our establishment".
7. SENTIMENT HANDLING:
   ${isNegative ? `
   - NEGATIVE / DISSATISFIED REVIEW (${rating}★):
   - Acknowledge their concern with genuine empathy, calm responsibility, and humility.
   - Apologize sincerely that their experience fell short of our standards.
   - Do NOT argue, make excuses, or sound defensive.
   - Invite them to reach out directly to our team ${contactPhone ? `at ${contactPhone}` : contactEmail ? `at ${contactEmail}` : ""} so we can review their case and assist them personally.
   ` : isNeutral ? `
   - NEUTRAL REVIEW (${rating}★):
   - Thank ${customerName} for their constructive feedback.
   - Reaffirm our dedication to continuous improvement and attentive care.
   - Naturally weave in our service and "${targetKeyword}".
   ` : `
   - POSITIVE REVIEW (${rating}★):
   - Thank ${customerName} warmly and respectfully for sharing their experience with ${businessName}.
   - Expand on the consultation/treatment they received, emphasizing our team's focus on clear guidance, patient comfort, and dedicated ${targetKeyword}.
   - Wish them continued good health and well-being.
   `}

Respond in EXACTLY this JSON format (no markdown code blocks, just raw JSON):
{
  "warm": "Warm, professional, expanded 2-3 sentence response with keyword",
  "short": "Slightly more concise 2-sentence response with keyword",
  "seoFocused": "Expanded response placing prominent emphasis on the local SEO keyword and service quality",
  "keywordUsed": "${targetKeyword}",
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
