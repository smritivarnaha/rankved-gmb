import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { REVIEW_TEMPLATES, renderReviewTemplate } from "@/lib/review-templates";
import { fetchLocationPerformanceKeywords } from "@/lib/ai-review-reply";

/**
 * GET /api/reviews/templates?locationId=xxx&reviewerName=yyy
 * Returns all 15 categorized templates rendered dynamically with location context
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");
  const reviewerName = searchParams.get("reviewerName") || "Patient";

  let location: any = null;
  let targetKeyword = "specialist healthcare";
  let contactPhone = "+91 98765 43210";
  let contactEmail = "";
  let businessName = "our clinic";
  let cityOrArea = "";

  if (locationId) {
    location = await prisma.location.findUnique({
      where: { id: locationId },
      include: { client: true }
    });

    if (location) {
      businessName = location.autoReplyBrandName?.trim() || location.name;
      contactPhone = location.aiPhone || location.phone || "+91 98765 43210";
      contactEmail = location.googleEmail || "";
      
      const parts = (location.address || "").split(",").map((p: string) => p.trim()).filter(Boolean);
      cityOrArea = parts.length >= 2 ? (parts[parts.length - 2] || parts[parts.length - 1]) : parts[0] || "";

      try {
        const userId = (session as any).user?.id;
        const kws = await fetchLocationPerformanceKeywords(location, userId);
        if (kws && kws.length > 0) {
          targetKeyword = kws[0];
        }
      } catch {}
    }
  }

  const renderedTemplates = REVIEW_TEMPLATES.map(t => {
    const rendered = renderReviewTemplate({
      template: t.template,
      reviewerName,
      businessName,
      cityOrArea,
      targetKeyword,
      contactPhone,
      contactEmail
    });

    return {
      ...t,
      rendered,
    };
  });

  return NextResponse.json({
    success: true,
    total: REVIEW_TEMPLATES.length,
    templates: renderedTemplates,
    context: {
      businessName,
      cityOrArea,
      targetKeyword,
      contactPhone,
      contactEmail
    }
  });
}
