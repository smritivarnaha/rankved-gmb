import prisma from "./prisma";
import { UserAISettings } from "./ai-engine";
import { Anthropic } from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getValidGoogleAccounts, getEmailFromIdToken } from "./google-accounts";
import { selectSmartReviewTemplate, renderReviewTemplate, REVIEW_TEMPLATES, normalizeBusinessName, isIndividualDoctorProfile } from "./review-templates";

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
export async function callLLM(prompt: string, settings: UserAISettings): Promise<string> {
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
    return parts[parts.length - 2] || parts[parts.length - 1];
  }
  return parts[0] || "";
}

/**
 * Fetches real search query keywords from Google Business Profile Performance API
 * for the location, supplemented by stored RankScan and Location AI keywords.
 * Also builds high-volume Specialty + Location combinations.
 */
export async function fetchLocationPerformanceKeywords(
  location: any,
  userId?: string
): Promise<string[]> {
  const keywords: string[] = [];
  const cityOrArea = extractCityOrArea(location.address);

  // 0. Check for custom configured Auto-Reply Keywords list
  const customConfiguredKeywords = (location.autoReplyKeywords || "")
    .split(/[,;\n]/)
    .map((k: string) => k.trim())
    .filter((k: string) => k.length > 1);

  // If strict keywords mode is ON and keywords are provided, return ONLY these keywords
  if (location.autoReplyStrictKeywords && customConfiguredKeywords.length > 0) {
    return customConfiguredKeywords;
  }

  // Prepend custom configured keywords at top priority if available
  for (const kw of customConfiguredKeywords) {
    if (!keywords.includes(kw)) keywords.push(kw);
  }

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
              const kw = item.keyword;
              if (kw && !keywords.includes(kw)) {
                keywords.push(kw);
              }
              // If query does not contain city yet, create a natural specialty + location variant
              if (cityOrArea && kw && !kw.toLowerCase().includes(cityOrArea.toLowerCase())) {
                const geoVariant = `${kw} in ${cityOrArea}`;
                if (!keywords.includes(geoVariant)) {
                  keywords.push(geoVariant);
                }
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
      if (cityOrArea && kw && !kw.toLowerCase().includes(cityOrArea.toLowerCase())) {
        const geoVariant = `${kw} in ${cityOrArea}`;
        if (!keywords.includes(geoVariant)) keywords.push(geoVariant);
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
    return `${categoryName || "Professional Healthcare & Services"}${cityPart}`;
  }

  // If reviewer mentioned specific services or symptoms, match against keyword tokens
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
export function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Sanitizes and enforces strict rules:
 * - Short & crisp (15 to 40 words max)
 * - Zero em-dashes / en-dashes
 * - Zero over-excited hype words ("thrilled", "super excited")
 * - For individual doctors (like Dr. Sheerin Shah), never uses the word "clinic"
 */
export function sanitizeAndEnforceWordCount(
  text: string,
  isNegative = false,
  isIndividualDoctor = false,
  businessName = ""
): string {
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
    .replace(/\bmy clinic\b/gi, isIndividualDoctor ? (businessName || "our practice") : "our practice")
    .replace(/\bmy practice\b/gi, "our practice")
    .replace(/\bmy\b/gi, "our")
    .replace(/\bthrilled\b/gi, "very pleased")
    .replace(/\bsuper excited\b/gi, "glad")
    .replace(/\boverjoyed\b/gi, "delighted")
    .replace(/\becstatic\b/gi, "honored")
    .replace(/\s{2,}/g, " ")         // normalize spaces
    .replace(/\n{2,}/g, "\n")
    .trim();

  if (isIndividualDoctor) {
    cleaned = cleaned
      .replace(/\bour clinic\b/gi, businessName || "our practice")
      .replace(/\bthe clinic\b/gi, businessName || "our practice")
      .replace(/\bclinic\b/gi, "")
      .replace(/\bat Dr\./gi, "with Dr.")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([.,!?])/g, "$1")
      .trim();
  }

  const words = cleaned.split(/\s+/).filter(Boolean);

  // Keep replies short and crisp (cap at 42 words max)
  if (words.length > 42) {
    const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
    let accumulated = "";
    for (const sentence of sentences) {
      const prospective = (accumulated ? accumulated + " " : "") + sentence.trim();
      const count = prospective.split(/\s+/).filter(Boolean).length;
      if (count <= 42) {
        accumulated = prospective;
      } else if (!accumulated) {
        accumulated = sentence.trim();
        break;
      } else {
        break;
      }
    }

    if (accumulated && accumulated.split(/\s+/).filter(Boolean).length <= 42) {
      cleaned = accumulated;
    } else {
      cleaned = words.slice(0, 36).join(" ") + ".";
    }
  }

  return cleaned.trim();
}

/**
 * Generates a short, crisp, sentiment-aware Google Review Reply
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
  const categoryName = location.client?.name || "Healthcare & Medical Consultation";

  // Business Brand Name Override (normalized for individual doctors like Dr. Sheerin Shah)
  const rawBrandOrName = location.autoReplyBrandName?.trim() || location.name;
  const isDoctor = isIndividualDoctorProfile(rawBrandOrName) || isIndividualDoctorProfile(location.name);
  const businessName = normalizeBusinessName(rawBrandOrName);

  // 2. Select prime keyword (strip "clinic" if individual doctor)
  let targetKeyword = pickBestPerformanceKeyword(performanceKeywords, reviewText, categoryName, cityOrArea);
  if (isDoctor) {
    targetKeyword = targetKeyword.replace(/\bclinic\b/gi, "").replace(/\s{2,}/g, " ").trim();
    if (!targetKeyword || targetKeyword.length < 3) {
      targetKeyword = /sheerin/i.test(businessName)
        ? `plastic surgeon${cityOrArea ? ` in ${cityOrArea}` : ""}`
        : `specialist doctor${cityOrArea ? ` in ${cityOrArea}` : ""}`;
    }
  }
  const topKeywordsList = performanceKeywords
    .map(k => (isDoctor ? k.replace(/\bclinic\b/gi, "").trim() : k))
    .filter(Boolean)
    .slice(0, 5)
    .join(", ");

  const isNegative = rating !== null && rating !== undefined ? rating <= 2 : false;
  const isNeutral = rating === 3;

  const sentiment = isNegative ? "NEGATIVE" : isNeutral ? "NEUTRAL" : "POSITIVE";

  // Customer Name Variations
  const fullName = reviewerName?.trim() || "";
  const firstName = fullName ? fullName.split(/\s+/)[0] : "";
  const hasValidName = fullName.length > 1 && !fullName.toLowerCase().includes("google user") && !fullName.toLowerCase().includes("anonymous");

  const contactPhone = location.aiPhone || location.phone || "";
  const contactEmail = location.googleEmail || "";
  const knowledgeBase = [location.autoReplyInstructions, location.aiInstructions, location.aiCompetitorData].filter(Boolean).join("\n");

  const prompt = `
You are writing an official, short, crisp Google Business Profile Review reply for "${businessName}" (${categoryName}).

CUSTOMER REVIEW DETAILS:
- Full Name: ${hasValidName ? fullName : "No name provided"}
- First Name: ${hasValidName ? firstName : ""}
- Star Rating: ${rating || 5} out of 5 Stars
- Customer Review Text: "${reviewText || "(The customer left a rating without written comment)"}"

BUSINESS CONTEXT & BRAND IDENTITY:
- Exact Name to Use: "${businessName}"
- Profile Type: ${isDoctor ? `INDIVIDUAL DOCTOR (${businessName}) — NEVER use the word "clinic". Refer only to ${businessName} as an individual doctor.` : "Healthcare / Business Profile"}
- Specialty / Category: ${categoryName}
- City / Area: ${cityOrArea || ""}
- Primary Search Keyword to naturally blend in: "${targetKeyword}"
${location.autoReplyStrictKeywords ? "- STRICT RULE: You MUST ONLY use one of the approved keywords above and NO other keywords." : ""}
- Special Instructions:
${knowledgeBase || "Keep the reply short, crisp, warm, and natural."}

============================================================
CRITICAL REQUIREMENTS (STRICT COMPLIANCE MANDATORY):
============================================================
1. SHORT & CRISP LENGTH (CRITICAL):
   - EVERY reply variant MUST be SHORT and CRISP: strictly 15 to 32 words (1 to 2 concise sentences).
   - Get straight to the point—warm, natural, and polite without long paragraphs.

2. ${isDoctor ? `INDIVIDUAL DOCTOR RULE FOR ${businessName} (CRITICAL):
   - ABSOLUTELY NEVER use the word "clinic" anywhere in the reply.
   - Refer ONLY to "${businessName}" as an individual doctor (e.g., "${businessName} is glad you had a smooth consultation", "Thank you for your trust in ${businessName}", "your consultation with ${businessName}").
   - Never say "at ${businessName}"—use "with ${businessName}" or "${businessName} appreciates...".` : `BRAND & PRONOUN RULE:
   - Use "We" or "${businessName}" naturally.`}

3. GREETING & SALUTATION (NEVER USE "PATIENT" OR "VALUED PATIENT"):
   - If a real customer name is provided, use it naturally (e.g. "Hello ${firstName},", "Dear ${firstName},", "Thank you, ${fullName}!").
   - If no name is provided (or "Google User"), start cleanly ("Hello, thank you for your review!").

4. CONTACT INSTRUCTIONS FOR LOW REVIEWS:
   - NEVER print raw phone numbers or raw email addresses.
   - For 1-2 star reviews, briefly apologize and ask them to reach out via the contact number on the profile.

5. PUNCTUATION:
   - Zero em dashes (—) or en dashes (–).

Produce valid JSON with EXACTLY this structure (no surrounding markdown backticks):
{
  "warm": "Short, warm 18 to 28 word reply (1-2 crisp sentences)${isDoctor ? ` using only ${businessName} as an individual doctor (NO word 'clinic')` : ""}",
  "short": "Ultra-crisp 14 to 22 word reply (1-2 short sentences)${isDoctor ? ` using only ${businessName} (NO word 'clinic')` : ""}",
  "seoFocused": "Short 20 to 32 word reply naturally mentioning '${targetKeyword}'${isDoctor ? ` and ${businessName} without the word 'clinic'` : ""}",
  "keywordUsed": "${targetKeyword}",
  "sentiment": "${sentiment}"
}
`.trim();

  // 3. Smart Dynamic Template Selection & Fallback Preparation
  const smartTemplate = selectSmartReviewTemplate(rating || 5, reviewText);
  const fallbackParams = {
    template: smartTemplate,
    reviewerName,
    businessName,
    cityOrArea,
    targetKeyword,
    contactPhone,
    contactEmail,
  };

  const dynamicWarm = renderReviewTemplate({
    ...fallbackParams,
    template: smartTemplate,
  });

  const numericRating = rating ?? 5;
  const shortTemplateMatch = numericRating <= 2 
    ? REVIEW_TEMPLATES.find(t => t.id === "low_admin_service") || smartTemplate
    : numericRating === 3 
    ? REVIEW_TEMPLATES.find(t => t.id === "neutral_concise_thanks") || smartTemplate
    : REVIEW_TEMPLATES.find(t => t.id === "high_short_direct") || smartTemplate;

  const dynamicShort = renderReviewTemplate({
    ...fallbackParams,
    template: shortTemplateMatch,
  });

  const seoTemplateMatch = numericRating <= 2
    ? REVIEW_TEMPLATES.find(t => t.id === "low_resolution_direct") || smartTemplate
    : numericRating === 3
    ? REVIEW_TEMPLATES.find(t => t.id === "neutral_balanced_care") || smartTemplate
    : REVIEW_TEMPLATES.find(t => t.id === "high_seo_authority") || smartTemplate;

  const dynamicSeoFocused = renderReviewTemplate({
    ...fallbackParams,
    template: seoTemplateMatch,
  });

  let rawJson = "";
  try {
    rawJson = await callLLM(prompt, settings);
  } catch (llmErr) {
    console.warn("[Review Replier] LLM call failed or no API keys, seamlessly using dynamic templates:", (llmErr as any)?.message);
    let selectedFallback = dynamicWarm;
    if (preferredTone === "SHORT") selectedFallback = dynamicShort;
    if (preferredTone === "SEO_FOCUSED") selectedFallback = dynamicSeoFocused;

    return {
      reply: selectedFallback,
      sentiment,
      keywordUsed: targetKeyword,
      performanceKeywordsFound: performanceKeywords.slice(0, 10),
      wordCount: getWordCount(selectedFallback),
      tone: preferredTone,
      options: {
        warm: dynamicWarm,
        short: dynamicShort,
        seoFocused: dynamicSeoFocused,
      },
    };
  }

  let parsed: any = {};
  try {
    const cleaned = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = {
      warm: dynamicWarm,
      short: dynamicShort,
      seoFocused: dynamicSeoFocused,
      sentiment,
    };
  }

  const warm = sanitizeAndEnforceWordCount(parsed.warm || dynamicWarm, isNegative, isDoctor, businessName);
  const short = sanitizeAndEnforceWordCount(parsed.short || dynamicShort, isNegative, isDoctor, businessName);
  const seoFocused = sanitizeAndEnforceWordCount(parsed.seoFocused || dynamicSeoFocused, isNegative, isDoctor, businessName);

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


