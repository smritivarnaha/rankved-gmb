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
      reviewerName = "Rahul Sharma",
      rating = 5,
      preferredTone = "WARM",
      engineMode = "TEMPLATES", // "TEMPLATES" | "AI"
      customBusinessName,
      customCityOrArea,
      customTargetKeyword,
      customPhone,
      customEmail,
    } = body;

    const numericRating = typeof rating === "number" ? rating : parseInt(rating, 10) || 5;
    const isNegative = numericRating <= 2;
    const isNeutral = numericRating === 3;
    const sentiment: "NEGATIVE" | "NEUTRAL" | "POSITIVE" = isNegative ? "NEGATIVE" : isNeutral ? "NEUTRAL" : "POSITIVE";

    // 1. Resolve Profile Context (Real DB location or Simulated)
    let location: any = null;
    if (profileId && profileId !== "mock-custom") {
      location = await prisma.location.findUnique({
        where: { id: profileId },
        include: { client: true },
      });
    }

    const businessName = location?.autoReplyBrandName?.trim() || location?.name || customBusinessName?.trim() || "LifeCare Neurology & Spine Clinic";
    const cityOrArea = location?.address ? location.address.split(",")[0].trim() : customCityOrArea?.trim() || "Mohali";
    
    // Extract target keyword
    let targetKeyword = customTargetKeyword?.trim();
    if (!targetKeyword && location?.autoReplyKeywords) {
      targetKeyword = location.autoReplyKeywords.split(/[,;\n]/)[0]?.trim();
    }
    if (!targetKeyword && location?.aiKeywords) {
      targetKeyword = location.aiKeywords.split(/[,;\n]/)[0]?.trim();
    }
    if (!targetKeyword) {
      targetKeyword = `${businessName.includes("Clinic") || businessName.includes("Doctor") ? "doctor" : "specialist"} in ${cityOrArea}`;
    }

    const contactPhone = location?.aiPhone || location?.phone || customPhone?.trim() || "+91 98765 43210";
    const contactEmail = location?.googleEmail || customEmail?.trim() || "care@lifecareclinic.com";

    // 2. Select Smart Matched Template from the 15 Templates Library
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

    // 3. Determine Execution Path based on engineMode
    const effectiveEngineMode = engineMode === "AI" ? "AI" : "TEMPLATES";

    if (effectiveEngineMode === "AI") {
      try {
        if (location?.id) {
          const aiResult = await generateSmartReviewReply({
            locationId: location.id,
            reviewText,
            reviewerName,
            rating: numericRating,
            preferredTone,
            userId,
          });

          if (aiResult?.reply) {
            return NextResponse.json({
              success: true,
              ...aiResult,
              source: "AI_ENGINE",
              smartTemplate,
              allWordCounts: {
                warm: getWordCount(aiResult.options?.warm || aiResult.reply),
                short: getWordCount(aiResult.options?.short || aiResult.reply),
                seoFocused: getWordCount(aiResult.options?.seoFocused || aiResult.reply),
              },
              clinicMeta: {
                businessName,
                phone: contactPhone,
                email: contactEmail,
                city: cityOrArea,
                targetKeyword: aiResult.keywordUsed || targetKeyword,
              },
            });
          }
        }
      } catch (aiErr) {
        console.warn("[Test Reply] AI generation threw error, falling back to 15 templates:", (aiErr as any)?.message);
      }
    }

    // Default & 15 Templates Execution (Instant, Deterministic, 100% Reliable)
    let selectedReply = dynamicWarm;
    if (preferredTone === "SHORT") selectedReply = dynamicShort;
    if (preferredTone === "SEO_FOCUSED") selectedReply = dynamicSeoFocused;

    return NextResponse.json({
      success: true,
      reply: selectedReply,
      sentiment,
      keywordUsed: targetKeyword,
      source: effectiveEngineMode === "AI" ? "DYNAMIC_TEMPLATES (AI Fallback)" : "DYNAMIC_TEMPLATES",
      smartTemplate,
      wordCount: getWordCount(selectedReply),
      tone: preferredTone,
      options: {
        warm: dynamicWarm,
        short: dynamicShort,
        seoFocused: dynamicSeoFocused,
      },
      allWordCounts: {
        warm: getWordCount(dynamicWarm),
        short: getWordCount(dynamicShort),
        seoFocused: getWordCount(dynamicSeoFocused),
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
