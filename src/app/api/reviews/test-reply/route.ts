import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { 
  generateSmartReviewReply, 
  fetchLocationPerformanceKeywords, 
  resolveUserAiSettings,
  callLLM,
  sanitizeAndEnforceWordCount,
  getWordCount
} from "@/lib/ai-review-reply";
import { 
  REVIEW_TEMPLATES, 
  selectSmartReviewTemplate, 
  renderReviewTemplate,
  extractFirstName
} from "@/lib/review-templates";

/**
 * POST /api/reviews/test-reply
 * Test simulator endpoint for live review replies
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id;

  try {
    const body = await req.json();
    const {
      profileId,
      reviewText = "",
      reviewerName = "Patient",
      rating = 5,
      preferredTone = "WARM",
      customBusinessName,
      customCityOrArea,
      customTargetKeyword,
      customPhone,
      customEmail,
    } = body;

    const numericRating = typeof rating === "number" ? rating : parseInt(rating, 10) || 5;

    // 1. If real profileId is provided, run full smart generator
    if (profileId && profileId !== "mock-custom") {
      const location = await prisma.location.findUnique({
        where: { id: profileId },
        include: { client: true },
      });

      if (location) {
        const smartTemplate = selectSmartReviewTemplate(numericRating, reviewText);
        const result = await generateSmartReviewReply({
          locationId: profileId,
          reviewText,
          reviewerName,
          rating: numericRating,
          preferredTone,
          userId,
        });

        return NextResponse.json({
          success: true,
          ...result,
          smartTemplate,
          allWordCounts: {
            warm: getWordCount(result.options?.warm || result.reply),
            short: getWordCount(result.options?.short || result.reply),
            seoFocused: getWordCount(result.options?.seoFocused || result.reply),
          },
          clinicMeta: {
            businessName: location.autoReplyBrandName?.trim() || location.name,
            phone: location.aiPhone || location.phone || "",
            email: location.googleEmail || "",
            address: location.address || "",
          },
        });
      }
    }

    // 2. Custom or Simulated Profile Flow
    const businessName = customBusinessName?.trim() || "LifeCare Neurology & Multispecialty Clinic";
    const cityOrArea = customCityOrArea?.trim() || "Mohali";
    const targetKeyword = customTargetKeyword?.trim() || "neurologist in Mohali";
    const contactPhone = customPhone?.trim() || "+91 98765 43210";
    const contactEmail = customEmail?.trim() || "care@lifecareclinic.com";

    const isNegative = numericRating <= 2;
    const isNeutral = numericRating === 3;
    const sentiment = isNegative ? "NEGATIVE" : isNeutral ? "NEUTRAL" : "POSITIVE";

    const smartTemplate = selectSmartReviewTemplate(numericRating, reviewText);
    const fallbackParams = {
      reviewerName,
      businessName,
      cityOrArea,
      targetKeyword,
      contactPhone,
      contactEmail,
    };

    const dynamicWarm = renderReviewTemplate({
      ...fallbackParams,
      template: smartTemplate.template,
    });

    const shortTemplateMatch = numericRating <= 2
      ? REVIEW_TEMPLATES.find(t => t.id === "low_admin_service") || smartTemplate
      : numericRating === 3
      ? REVIEW_TEMPLATES.find(t => t.id === "neutral_concise_thanks") || smartTemplate
      : REVIEW_TEMPLATES.find(t => t.id === "high_short_direct") || smartTemplate;

    const dynamicShort = renderReviewTemplate({
      ...fallbackParams,
      template: shortTemplateMatch.template,
    });

    const seoTemplateMatch = numericRating <= 2
      ? REVIEW_TEMPLATES.find(t => t.id === "low_resolution_direct") || smartTemplate
      : numericRating === 3
      ? REVIEW_TEMPLATES.find(t => t.id === "neutral_balanced_care") || smartTemplate
      : REVIEW_TEMPLATES.find(t => t.id === "high_seo_authority") || smartTemplate;

    const dynamicSeoFocused = renderReviewTemplate({
      ...fallbackParams,
      template: seoTemplateMatch.template,
    });

    let warmReply = dynamicWarm;
    let shortReply = dynamicShort;
    let seoReply = dynamicSeoFocused;
    let source = "DYNAMIC_TEMPLATE";

    // Attempt AI Generation if user has AI settings configured
    if (userId) {
      try {
        const settings = await resolveUserAiSettings(userId);
        const hasKey = !!(
          settings.anthropicApiKey || 
          settings.openaiApiKey || 
          settings.geminiApiKey || 
          settings.openrouterApiKey || 
          process.env.GEMINI_API_KEY || 
          process.env.OPENAI_API_KEY || 
          process.env.ANTHROPIC_API_KEY
        );

        if (hasKey) {
          const prompt = `
You are the management and clinical team of "${businessName}" writing an official Google Business Profile Review reply.

CUSTOMER REVIEW:
- Name: ${reviewerName}
- Star Rating: ${numericRating} Stars
- Review: "${reviewText || "(No written text provided)"}"

BUSINESS:
- Name: ${businessName}
- City: ${cityOrArea}
- Phone: ${contactPhone}
- Email: ${contactEmail}
- Target Keyword: "${targetKeyword}"

Tone instructions:
- Use team pronouns ("we", "our team").
- Keep strictly between 30 and 70 words.
- Do not use em dashes or double quotes.
- Never output raw phone numbers or raw emails; direct to the contact number on our business profile.
- Never use 'Patient' as a fallback name.
${isNegative ? "- Apologize with empathy, take responsibility, do not argue, invite them to reach out using the contact number listed on our business profile" : ""}
${isNeutral ? "- Thank them for constructive feedback, emphasize continuous clinical standard and " + targetKeyword : ""}
${!isNegative && !isNeutral ? "- Warmly thank them, reference their consultation/treatment, and highlight our dedicated " + targetKeyword : ""}

Return valid JSON with:
{
  "warm": "Warm, professional response (40-60 words)",
  "short": "Short direct response (30-45 words)",
  "seoFocused": "SEO focused response integrating '${targetKeyword}' (45-70 words)"
}
`.trim();

          const raw = await callLLM(prompt, settings);
          const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.warm) {
            warmReply = sanitizeAndEnforceWordCount(parsed.warm, isNegative);
            shortReply = sanitizeAndEnforceWordCount(parsed.short || dynamicShort, isNegative);
            seoReply = sanitizeAndEnforceWordCount(parsed.seoFocused || dynamicSeoFocused, isNegative);
            source = "AI_ENGINE";
          }
        }
      } catch (aiErr) {
        // Safe fallback to dynamic templates
        console.log("[Test Reply API] AI generation skipped/fallback used:", (aiErr as any)?.message);
      }
    }

    let selectedReply = warmReply;
    if (preferredTone === "SHORT") selectedReply = shortReply;
    if (preferredTone === "SEO_FOCUSED") selectedReply = seoReply;

    return NextResponse.json({
      success: true,
      reply: selectedReply,
      sentiment,
      keywordUsed: targetKeyword,
      source,
      smartTemplate,
      wordCount: getWordCount(selectedReply),
      options: {
        warm: warmReply,
        short: shortReply,
        seoFocused: seoReply,
      },
      allWordCounts: {
        warm: getWordCount(warmReply),
        short: getWordCount(shortReply),
        seoFocused: getWordCount(seoReply),
      },
      clinicMeta: {
        businessName,
        phone: contactPhone,
        email: contactEmail,
        city: cityOrArea,
        targetKeyword,
      },
    });
  } catch (err: any) {
    console.error("[Test Reply API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to test review reply" },
      { status: 500 }
    );
  }
}
