import prisma from "@/lib/prisma";
import { selectSmartReviewTemplate, renderReviewTemplate } from "@/lib/review-templates";

export interface QueueAutoRepliesResult {
  queuedCount: number;
  skippedCount: number;
  errors: string[];
  queuedReplies: Array<{
    id: string;
    reviewerName: string;
    rating: number;
    scheduledFor: string;
    replyPreview: string;
  }>;
}

/**
 * Evaluates pending reviews for a location and automatically queues replies
 * according to the location's configured autoReplyMode and delay timing.
 */
export async function queueAutoRepliesForLocation(
  locationId: string,
  rawReviews?: any[]
): Promise<QueueAutoRepliesResult> {
  const result: QueueAutoRepliesResult = {
    queuedCount: 0,
    skippedCount: 0,
    errors: [],
    queuedReplies: [],
  };

  if (!locationId) return result;

  try {
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: { client: { include: { user: true } } },
    });

    if (!location) {
      result.errors.push(`Location ${locationId} not found`);
      return result;
    }

    // Only process if auto-reply is enabled for this location
    if (!location.autoReplyEnabled) {
      return result;
    }

    // Determine unreplied reviews to process (newest first)
    let unrepliedReviews: Array<{
      reviewName: string;
      reviewId?: string;
      reviewerName?: string;
      rating: number;
      comment?: string | null;
      createTime?: Date | string | null;
    }> = [];

    if (rawReviews && rawReviews.length > 0) {
      unrepliedReviews = rawReviews
        .filter((r: any) => {
          const hasReply = !!(r.reviewReply && r.reviewReply.comment && r.reviewReply.comment.trim());
          return !hasReply && (r.name || r.reviewName);
        })
        .map((r: any) => {
          const starRating = r.starRating || "FIVE";
          const ratingNum = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }[starRating as string] ?? 
            (typeof r.starRating === "number" ? r.starRating : (r.rating || 5));
          return {
            reviewName: r.name || r.reviewName,
            reviewId: r.reviewId || (r.name || r.reviewName).split("/").pop(),
            reviewerName: r.reviewer?.displayName || r.reviewerName || "Customer",
            rating: ratingNum,
            comment: r.comment || null,
            createTime: r.createTime || r.reviewCreateTime,
          };
        });
    } else {
      // Fetch from permanent database backup vault (ordered newest first)
      const backedUpReviews = await prisma.locationReview.findMany({
        where: {
          locationId,
          status: "ACTIVE",
          ownerReply: null,
        },
        orderBy: {
          reviewCreateTime: "desc",
        },
      });

      unrepliedReviews = backedUpReviews.map(r => ({
        reviewName: r.reviewName,
        reviewId: r.reviewId || r.reviewName.split("/").pop(),
        reviewerName: r.reviewerName || "Customer",
        rating: r.rating || 5,
        comment: r.comment || null,
        createTime: r.reviewCreateTime,
      }));
    }

    if (unrepliedReviews.length === 0) {
      return result;
    }

    for (const rev of unrepliedReviews) {
      try {
        const starNumber = rev.rating;

        // 1. Check hold negative reviews condition
        if (location.autoReplyHoldNegative && starNumber <= 2) {
          console.log(`[Auto-Reply] Holding negative review (${starNumber}★) by ${rev.reviewerName} for human review.`);
          result.skippedCount++;
          continue;
        }

        const reviewName = rev.reviewName;
        if (!reviewName) continue;

        // 2. Check if already in queue or already published
        const existing = await prisma.scheduledReviewReply.findFirst({
          where: { reviewName },
        });
        if (existing) {
          result.skippedCount++;
          continue;
        }

        // 3. Generate Reply
        let replyComment = "";
        const autoReplyMode = location.autoReplyMode || "TEMPLATES";

        if (autoReplyMode === "AI") {
          try {
            const { generateSmartReviewReply } = await import("@/lib/ai-review-reply");
            const aiResult = await generateSmartReviewReply({
              locationId: location.id,
              reviewText: rev.comment || "",
              reviewerName: rev.reviewerName,
              rating: starNumber,
              userId: location.client?.userId,
            });
            replyComment = aiResult?.reply || "";
          } catch (aiErr: any) {
            console.warn(`[Auto-Reply] AI generation failed, falling back to 15 templates: ${aiErr.message}`);
          }
        }

        // If AI mode returned empty or mode is TEMPLATES (default)
        if (!replyComment) {
          const smartTemplate = selectSmartReviewTemplate(starNumber, rev.comment || "");
          const businessName = location.autoReplyBrandName?.trim() || location.name;
          const cityOrArea = location.address ? location.address.split(",")[0].trim() : "";

          // Resolve target keyword if available
          let targetKeyword = location.autoReplyKeywords?.split(/[,;\n]/)[0]?.trim();
          if (!targetKeyword && location.aiKeywords) {
            targetKeyword = location.aiKeywords.split(/[,;\n]/)[0]?.trim();
          }

          replyComment = renderReviewTemplate({
            template: smartTemplate.template,
            reviewerName: rev.reviewerName,
            businessName,
            cityOrArea,
            targetKeyword,
            contactPhone: location.aiPhone || location.phone || undefined,
            contactEmail: location.googleEmail || undefined,
          });
        }

        if (replyComment) {
          // Calculate randomized human delay (between min and max minutes)
          const rawMin = location.autoReplyMinDelayMinutes !== null && location.autoReplyMinDelayMinutes !== undefined 
            ? location.autoReplyMinDelayMinutes 
            : 2;
          const rawMax = location.autoReplyMaxDelayMinutes !== null && location.autoReplyMaxDelayMinutes !== undefined 
            ? location.autoReplyMaxDelayMinutes 
            : 5;
          const minDelay = Math.max(1, Math.min(rawMin, rawMax));
          const maxDelay = Math.max(minDelay, rawMax);
          const randomMinutes = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
          const scheduledFor = new Date(Date.now() + randomMinutes * 60 * 1000);

          const scheduledRecord = await prisma.scheduledReviewReply.create({
            data: {
              id: `auto-${location.id}-${reviewName.replace(/[^a-zA-Z0-9]/g, "_")}-${Date.now()}`,
              locationId: location.id,
              userId: location.client?.userId || "system",
              reviewName,
              reviewId: rev.reviewId || reviewName.split("/").pop(),
              reviewerName: rev.reviewerName || "Customer",
              rating: starNumber,
              reviewComment: rev.comment || null,
              reviewCreateTime: rev.createTime ? new Date(rev.createTime) : null,
              replyComment,
              scheduledFor,
              status: "SCHEDULED",
            },
          });

          result.queuedCount++;
          result.queuedReplies.push({
            id: scheduledRecord.id,
            reviewerName: rev.reviewerName || "Customer",
            rating: starNumber,
            scheduledFor: scheduledFor.toISOString(),
            replyPreview: replyComment.substring(0, 100) + "...",
          });

          console.log(`[Auto-Reply Service] ✅ Queued (${autoReplyMode}) reply for ${location.name} (Reviewer: ${rev.reviewerName}, Posting at ${scheduledFor.toLocaleTimeString()})`);
        }
      } catch (revErr: any) {
        console.error(`[Auto-Reply Service] Error processing review ${rev.reviewName}:`, revErr);
        result.errors.push(revErr.message || String(revErr));
      }
    }
  } catch (err: any) {
    console.error(`[Auto-Reply Service] Fatal error for location ${locationId}:`, err);
    result.errors.push(err.message || String(err));
  }

  return result;
}
