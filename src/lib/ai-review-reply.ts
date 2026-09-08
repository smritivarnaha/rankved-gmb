import prisma from "./prisma";
import { UserAISettings } from "./ai-engine";
import { Anthropic } from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getValidGoogleAccounts, getEmailFromIdToken } from "./google-accounts";

export interface ReviewReplyResult {
  reply: string;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  keywordUsed?: string;
  performanceKeywordsFound?: string[];
  wordCount: number;
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
      max_tokens: 900,
      temperature: 0.6,
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
      temperature: 0.6,
      max_tokens: 900,
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
        temperature: 0.6,
        max_tokens: 900,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  throw new Error("No AI API keys configured. Please add an Anthropic, OpenAI, or Gemini key in Settings.");
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
 * Fetches real search query keywords from Google Business Profile Performance API
 * for the location, supplemented by stored RankScan and Location AI keywords.
 */
export async function fetchLocationPerformanceKeywords(
  location: any,
  userId?: string
): Promise<string[]> {
  const keywords: string[] = [];

  // 1. Fetch live Google Business Profile Performance search keywords
  try {
    const targetUserId = userId || location.client?.userId;
    if (targetUserId && location.gbpLocationId) {
      const validAccounts = await getValidGoogleAccounts(targetUserId);
      if (validAccounts && validAccounts.length > 0) {
        let accessToken: string | null = null;
        if (location.googleEmail) {
          const matched = validAccounts.find(
            (acc) => getEmailFromIdToken(acc.id_token) === location.googleEmail
          );
          if (matched) accessToken = matched.access_token;
        }
        if (!accessToken) accessToken = validAccounts[0]?.access_token;

        if (accessToken) {
          const now = new Date();
          const startMonthDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          const endMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);

          // Resource name must be "locations/{id}"
          const resourceName = location.gbpLocationId;
          const url =
            `https://businessprofileperformance.googleapis.com/v1/${resourceName}/searchkeywords/impressions/monthly` +
            `?monthlyRange.startMonth.year=${startMonthDate.getFullYear()}` +
            `&monthlyRange.startMonth.month=${startMonthDate.getMonth() + 1}` +
            `&monthlyRange.endMonth.year=${endMonthDate.getFullYear()}` +
            `&monthlyRange.endMonth.month=${endMonthDate.getMonth() + 1}` +
            `&pageSize=100`;

          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (res.ok) {
            const data = await res.json();
            const rawCounts = data.searchKeywordsCounts || [];
            const sortedCounts = rawCounts
              .map((k: any) => {
                const rawVal = parseInt(k.insightsValue?.value || "0", 10);
                const rawThresh = parseInt(k.insightsValue?.threshold || "0", 10);
                return {
                  keyword: (k.searchKeyword || "").trim(),
                  count: rawVal > 0 ? rawVal : rawThresh,
                };
              })
              .filter((k: any) => k.keyword && k.keyword.length > 2)
              .sort((a: any, b: any) => b.count - a.count);

            for (const item of sortedCounts) {
              if (item.keyword && !keywords.includes(item.keyword)) {
                keywords.push(item.keyword);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("[Review Replier] Could not fetch Google Search Performance keywords:", err);
  }

  // 2. Supplement with RankScan keywords from DB
  try {
    const rankScans = await prisma.rankScan.findMany({
      where: { locationId: location.id },
      select: { keyword: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    });
    for (const rs of rankScans) {
      const kw = rs.keyword?.trim();
      if (kw && kw.length > 2 && !keywords.includes(kw)) {
        keywords.push(kw);
      }
    }
  } catch (err) {
    console.warn("[Review Replier] Could not query rank scans:", err);
  }

  // 3. Supplement with Location AI Keywords
  if (location.aiKeywords) {
    const parsed = location.aiKeywords
      .split(/[,;\n]/)
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 2);
    for (const kw of parsed) {
      if (!keywords.includes(kw)) keywords.push(kw);
    }
  }

  // 4. Supplement with Location AI Keyword Sequence
  if (location.aiKeywordSequence) {
    try {
      const seq = JSON.parse(location.aiKeywordSequence);
      if (Array.isArray(seq)) {
        for (const kw of seq) {
          if (typeof kw === "string" && kw.trim().length > 2 && !keywords.includes(kw.trim())) {
            keywords.push(kw.trim());
          }
        }
      }
    } catch {
      const seq = location.aiKeywordSequence.split(/[,;\n]/).map((k: string) => k.trim()).filter(Boolean);
      for (const kw of seq) {
        if (!keywords.includes(kw)) keywords.push(kw);
      }
    }
  }

  return keywords;
}

/**
 * Selects the most contextually relevant search keyword based on reviewer comment
 */
function pickBestPerformanceKeyword(
  keywords: string[],
  reviewText?: string | null,
  categoryName?: string,
  cityOrArea?: string
): string {
  if (!keywords || keywords.length === 0) {
    const cityPart = cityOrArea ? ` in ${cityOrArea}` : "";
    return `${categoryName || "Professional Services"}${cityPart}`;
  }

  // If reviewer mentioned specific services or conditions, match against keyword tokens
  if (reviewText && reviewText.trim().length > 0) {
    const reviewWords = reviewText.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    let bestMatch = "";
    let maxOverlap = 0;

    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      let overlap = 0;
      for (const w of reviewWords) {
        if (kwLower.includes(w)) overlap++;
      }
      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        bestMatch = kw;
      }
    }

    if (bestMatch && maxOverlap > 0) {
      return bestMatch;
    }
  }

  // Otherwise pick from top 3 search queries
  const topPool = keywords.slice(0, Math.min(3, keywords.length));
  return topPool[Math.floor(Math.random() * topPool.length)];
}

/**
 * Word count counter
 */
function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Sanitizes and enforces strict rules:
 * - Minimum 30 words, maximum 80 words
 * - Strictly team pronouns ("We", "our team")
 * - Zero em-dashes / en-dashes
 * - Zero over-excited hype words ("thrilled", "super excited")
 * - Dignified professional clinical tone
 */
function sanitizeAndEnforceWordCount(text: string, isNegative = false): string {
  let cleaned = text
    .replace(/["“”]/g, "")           // strip surrounding quotes
    .replace(/[—–]/g, ", ")          // STRICT RULE: No em dashes or en dashes
    .replace(/!{2,}/g, ".")          // No excessive exclamation marks
    .replace(/\b(I am|I'm)\b/gi, "We are")
    .replace(/\bI have\b/gi, "We have")
    .replace(/\bI look forward\b/gi, "We look forward")
    .replace(/\bI appreciate\b/gi, "We appreciate")
    .replace(/\bI hope\b/gi, "We hope")
    .replace(/\bI wish\b/gi, "We wish")
    .replace(/\bI want to\b/gi, "We want to")
    .replace(/\bmy team\b/gi, "our team")
    .replace(/\bmy clinic\b/gi, "our clinic")
    .replace(/\bmy practice\b/gi, "our practice")
    .replace(/\bmy\b/gi, "our")
    .replace(/\bthrilled\b/gi, "very pleased")
    .replace(/\bsuper excited\b/gi, "glad")
    .replace(/\boverjoyed\b/gi, "delighted")
    .replace(/\becstatic\b/gi, "honored")
    .replace(/\s{2,}/g, " ")         // normalize spaces
    .replace(/\n{2,}/g, "\n")
    .trim();

  let words = cleaned.split(/\s+/).filter(Boolean);

  // ── 1. Enforce Minimum 30 Words ─────────────────────────────
  if (words.length < 30) {
    if (isNegative) {
      cleaned += " Our team is committed to listening closely to all feedback and taking every step necessary to resolve your concerns with the highest standard of care.";
    } else {
      cleaned += " Our entire team remains dedicated to providing attentive, patient-focused care and clear guidance for all your health and wellness needs.";
    }
    words = cleaned.split(/\s+/).filter(Boolean);
  }

  // ── 2. Enforce Maximum 80 Words ─────────────────────────────
  if (words.length > 80) {
    // Split into sentences and keep as many complete sentences as possible under 80 words
    const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
    let accumulated = "";
    for (const sentence of sentences) {
      const prospective = (accumulated ? accumulated + " " : "") + sentence.trim();
      const count = prospective.split(/\s+/).filter(Boolean).length;
      if (count <= 80 && count >= 25) {
        accumulated = prospective;
      } else if (!accumulated) {
        accumulated = sentence.trim();
      }
    }

    if (accumulated && accumulated.split(/\s+/).filter(Boolean).length <= 80) {
      cleaned = accumulated;
    } else {
      // Hard cap to 75 words with period
      cleaned = words.slice(0, 75).join(" ") + ".";
    }
  }

  return cleaned.trim();
}

/**
 * Generates a high-precision, sentiment-aware, humanized Google Review Reply
 * integrating performance search keywords and strictly 30 to 80 words.
 */
export async function generateSmartReviewReply(params: GenerateReviewReplyParams): Promise<ReviewReplyResult> {
  const { locationId, reviewText, reviewerName, rating = 5, preferredTone = "WARM", userId } = params;

  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { client: true },
  });

  if (!location) throw new Error("Location not found");

  const settings = await resolveUserAiSettings(userId || location.client?.userId);

  // 1. Fetch real Google Business Profile search query keywords & performance data
  const performanceKeywords = await fetchLocationPerformanceKeywords(location, userId);
  const cityOrArea = extractCityOrArea(location.address);
  const categoryName = location.client?.name || "Healthcare & Clinical Care";

  // 2. Select prime keyword
  const targetKeyword = pickBestPerformanceKeyword(performanceKeywords, reviewText, categoryName, cityOrArea);
  const topKeywordsList = performanceKeywords.slice(0, 5).join(", ");

  const isNegative = rating !== null && rating !== undefined ? rating <= 2 : false;
  const isNeutral = rating === 3;
  const isPositive = rating !== null && rating !== undefined ? rating >= 4 : true;

  const sentiment = isNegative ? "NEGATIVE" : isNeutral ? "NEUTRAL" : "POSITIVE";

  // Business Context
  const businessName = location.name;
  const customerName = reviewerName?.trim() || "Valued Client";
  const contactPhone = location.aiPhone || location.phone || "";
  const contactEmail = location.googleEmail || "";
  const knowledgeBase = [location.autoReplyInstructions, location.aiInstructions, location.aiCompetitorData].filter(Boolean).join("\n");

  const prompt = `
You are the management and clinical team of "${businessName}" (${categoryName}) writing an official, professional Google Business Profile Review reply.

CUSTOMER REVIEW DETAILS:
- Reviewer Name: ${customerName}
- Rating: ${rating || 5} out of 5 Stars
- Customer Review Text: "${reviewText || "(The customer left a 5-star rating without written comment)"}"

BUSINESS CONTEXT & LOCAL METRICS:
- Business Profile Name: ${businessName}
- Category / Specialization: ${categoryName}
- City / Area: ${cityOrArea || "our center"}
- Address: ${location.address || ""}
- Phone: ${contactPhone || ""}
- Email: ${contactEmail || ""}
- Top Google Performance Search Queries for this profile: ${topKeywordsList || targetKeyword}
- Primary Search Keyword to seamlessly weave in: "${targetKeyword}"
- Knowledge Base / Special Instructions:
${knowledgeBase || "Maintain dignified, patient-first care, clear explanations, and respectful communication."}

============================================================
CRITICAL REQUIREMENTS (STRICT COMPLIANCE MANDATORY):
============================================================
1. WORD COUNT CONSTRAINT (CRITICAL):
   - EVERY reply variant MUST be strictly between 30 words and 80 words (2 to 3 substantive sentences).
   - NEVER output short 10-20 word generic replies.
   - NEVER exceed 80 words.
2. EXPAND NATURALLY ON THE BASIS OF THE REVIEW:
   - Carefully read the customer's comment. If they mention consultation, guidance, doctor's explanation, friendly staff, treatment, or recovery, expand meaningfully on that exact aspect.
   - Articulate our team's commitment to thorough patient consultations, attentive care, and clear explanations.
3. TEAM PRONOUNS ONLY:
   - Always write as a team using "WE", "OUR TEAM", "OUR CLINIC", or "OUR PRACTICE".
   - ABSOLUTELY NEVER write in first-person singular ("I", "my", "I am", "I'm", "I appreciate").
4. DIGNIFIED, PROFESSIONAL CLINICAL TONE:
   - Use calm, grounded, clinical/professional authority and warmth.
   - ABSOLUTELY NEVER use over-excited marketing hype words like "thrilled", "super excited", "overjoyed", "ecstatic", or exclamation mark spam.
5. LOCAL SEARCH KEYWORD INTEGRATION:
   - Seamlessly and naturally integrate the local search keyword ("${targetKeyword}") or relevant performance search term into the flow of a sentence so it reads completely natural to a human reader.
6. PUNCTUATION & CLICHES:
   - ABSOLUTELY ZERO em dashes (—) or en dashes (–). Use standard commas or periods.
   - Never use canned robotic lines like "We strive for excellence", "Your feedback is valuable to us", "In today's fast-paced world", or "At our establishment".
7. SENTIMENT HANDLING:
   ${isNegative ? `
   - NEGATIVE REVIEW (${rating}★):
   - Acknowledge their concern with genuine empathy, calm responsibility, and humility.
   - Apologize sincerely that their experience fell short of our high standards.
   - Do not make excuses or sound defensive.
   - Invite them to reach out directly to our team ${contactPhone ? `at ${contactPhone}` : contactEmail ? `at ${contactEmail}` : ""} so we can review their case and assist them personally.
   ` : isNeutral ? `
   - NEUTRAL REVIEW (${rating}★):
   - Thank ${customerName} for sharing their constructive thoughts.
   - Reaffirm our dedication to continuous improvement and attentive care.
   - Naturally reference our service and "${targetKeyword}".
   ` : `
   - POSITIVE REVIEW (${rating}★):
   - Thank ${customerName} warmly and respectfully for reviewing ${businessName}.
   - Expand on the consultation/treatment they received, emphasizing our focus on clear guidance, patient comfort, and dedicated ${targetKeyword}.
   - Wish them continued good health and well-being.
   `}

Produce valid JSON with EXACTLY this structure (no surrounding markdown backticks):
{
  "warm": "Warm, professional, expanded response of 40 to 65 words naturally integrating '${targetKeyword}'",
  "short": "Concise yet substantive professional response of 30 to 45 words naturally integrating '${targetKeyword}'",
  "seoFocused": "Expanded response of 50 to 75 words highlighting our clinical service and '${targetKeyword}'",
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
      warm: rawJson,
      short: rawJson,
      seoFocused: rawJson,
      sentiment,
    };
  }

  const warm = sanitizeAndEnforceWordCount(parsed.warm || rawJson, isNegative);
  const short = sanitizeAndEnforceWordCount(parsed.short || warm, isNegative);
  const seoFocused = sanitizeAndEnforceWordCount(parsed.seoFocused || warm, isNegative);

  let selectedReply = warm;
  if (preferredTone === "SHORT") selectedReply = short;
  if (preferredTone === "SEO_FOCUSED") selectedReply = seoFocused;

  const finalWordCount = getWordCount(selectedReply);

  return {
    reply: selectedReply,
    sentiment,
    keywordUsed: parsed.keywordUsed || targetKeyword,
    performanceKeywordsFound: performanceKeywords.slice(0, 10),
    wordCount: finalWordCount,
    tone: preferredTone,
    options: {
      warm,
      short,
      seoFocused,
    },
  };
}

