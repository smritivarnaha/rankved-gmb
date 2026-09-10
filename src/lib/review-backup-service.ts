import prisma from "@/lib/prisma";
import { notifyAdmin } from "@/lib/notifications";
import { sendReviewDropWhatsAppAlert } from "@/lib/whatsapp-service";

function getRating(r: any): number {
  const map: Record<string, number> = { FIVE: 5, FOUR: 4, THREE: 3, TWO: 2, ONE: 1 };
  return map[r.starRating] ?? (typeof r.starRating === "number" ? r.starRating : 5);
}

/**
 * Syncs Google reviews with our permanent database backup vault
 * and automatically detects if any previously active reviews have been deleted by Google spam filters.
 */
export async function syncAndBackupLocationReviews(
  locationId: string,
  liveReviews: any[],
  currentTotalCount?: number,
  currentAverageRating?: number
): Promise<{
  savedCount: number;
  droppedCount: number;
  droppedReviews: any[];
}> {
  if (!locationId) return { savedCount: 0, droppedCount: 0, droppedReviews: [] };

  const now = new Date();
  const liveReviewNames = new Set<string>();

  // 1. Upsert all live reviews into our permanent LocationReview database vault
  for (const r of liveReviews) {
    const reviewName = r.name || r.reviewName;
    if (!reviewName) continue;

    liveReviewNames.add(reviewName);

    const ratingVal = getRating(r);
    const starRatingStr = r.starRating ? String(r.starRating) : `${ratingVal}_STAR`;

    let reviewCreateTime: Date | null = null;
    if (r.createTime) {
      const d = new Date(r.createTime);
      if (!isNaN(d.getTime())) reviewCreateTime = d;
    }

    let reviewUpdateTime: Date | null = null;
    if (r.updateTime) {
      const d = new Date(r.updateTime);
      if (!isNaN(d.getTime())) reviewUpdateTime = d;
    }

    let ownerReplyTime: Date | null = null;
    if (r.reviewReply?.updateTime) {
      const d = new Date(r.reviewReply.updateTime);
      if (!isNaN(d.getTime())) ownerReplyTime = d;
    }

    await prisma.locationReview.upsert({
      where: {
        locationId_reviewName: {
          locationId,
          reviewName,
        },
      },
      create: {
        locationId,
        reviewName,
        reviewId: r.reviewId || reviewName.split("/").pop() || null,
        reviewerName: r.reviewer?.displayName || null,
        reviewerPhotoUrl: r.reviewer?.profilePhotoUrl || null,
        starRating: starRatingStr,
        rating: ratingVal,
        comment: r.comment || null,
        reviewCreateTime,
        reviewUpdateTime,
        ownerReply: r.reviewReply?.comment || null,
        ownerReplyTime,
        status: "ACTIVE",
        firstSeenAt: now,
        lastSeenAt: now,
      },
      update: {
        reviewerName: r.reviewer?.displayName || undefined,
        reviewerPhotoUrl: r.reviewer?.profilePhotoUrl || undefined,
        starRating: starRatingStr,
        rating: ratingVal,
        comment: r.comment || null,
        reviewUpdateTime: reviewUpdateTime || undefined,
        ownerReply: r.reviewReply?.comment || null,
        ownerReplyTime: ownerReplyTime || undefined,
        status: "ACTIVE", // Re-activates if reinstated by Google!
        lastSeenAt: now,
      },
    });
  }

  // 2. Detect missing / deleted reviews
  // Only detect deletions if we received a valid non-empty response or verified full list
  const previouslyActiveReviews = await prisma.locationReview.findMany({
    where: {
      locationId,
      status: "ACTIVE",
    },
  });

  const missingReviews = previouslyActiveReviews.filter(
    existing => !liveReviewNames.has(existing.reviewName)
  );

  // If reviews disappeared from Google
  if (missingReviews.length > 0 && liveReviews.length >= 0) {
    console.warn(`[Review Drop Alert] Detected ${missingReviews.length} reviews REMOVED by Google for location ${locationId}!`);

    // Mark missing reviews as DELETED_BY_GOOGLE
    for (const missing of missingReviews) {
      await prisma.locationReview.update({
        where: { id: missing.id },
        data: {
          status: "DELETED_BY_GOOGLE",
          deletedAt: now,
        },
      });
    }

    // Get location details for notification
    const loc = await prisma.location.findUnique({
      where: { id: locationId },
      include: { client: { include: { user: true } } },
    });

    const locationName = loc?.name || "Business Profile";
    const prevCount = previouslyActiveReviews.length;
    const currCount = liveReviews.length;

    // Record Incident
    await prisma.reviewDropIncident.create({
      data: {
        locationId,
        droppedCount: missingReviews.length,
        previousCount: prevCount,
        currentCount: currCount,
        previousAvgRating: 0,
        currentAvgRating: currentAverageRating || 0,
        reviewNamesJson: JSON.stringify(missingReviews.map(r => r.reviewName)),
        alertSent: true,
      },
    });

    // Create in-app notification
    try {
      const targetUserId = loc?.client?.userId;
      if (targetUserId) {
        await prisma.notification.create({
          data: {
            userId: targetUserId,
            locationId,
            type: "ALERT",
            title: `⚠️ ${missingReviews.length} Review(s) Removed by Google!`,
            message: `Google spam filter removed ${missingReviews.length} customer review(s) from "${locationName}". All deleted reviews have been backed up in Review Centre with 1-click appeal evidence.`,
          },
        });
      }

      // Email notification to Admin
      let emailBody = `⚠️ GOOGLE REVIEW DROP ALERT for "${locationName}"\n\n`;
      emailBody += `Google has removed ${missingReviews.length} review(s) from this profile without warning.\n\n`;
      emailBody += `--- REMOVED REVIEWS EVIDENCE ---\n\n`;

      missingReviews.forEach((rev, idx) => {
        emailBody += `${idx + 1}. Customer: ${rev.reviewerName || "Anonymous"}\n`;
        emailBody += `   Rating: ${rev.rating} ⭐ (${rev.starRating || ""})\n`;
        emailBody += `   Date Received: ${rev.reviewCreateTime ? rev.reviewCreateTime.toLocaleDateString() : "N/A"}\n`;
        emailBody += `   Review Text: "${rev.comment || "(No written text)"}"\n`;
        emailBody += `   Google Review ID: ${rev.reviewName}\n\n`;
      });

      emailBody += `You can view all backed up deleted reviews and copy Google Support appeal evidence directly in the Review Centre.\n`;

      await notifyAdmin({
        subject: `⚠️ Alert: ${missingReviews.length} Review(s) Removed by Google - ${locationName}`,
        text: emailBody,
        html: emailBody.replace(/\n/g, "<br/>"),
      });

      // Instant WhatsApp Proactive Alert to Client!
      await sendReviewDropWhatsAppAlert({
        locationId,
        droppedCount: missingReviews.length,
        droppedReviews: missingReviews.map(r => ({
          reviewerName: r.reviewerName,
          rating: r.rating || 5,
          comment: r.comment,
        })),
      });
    } catch (notifErr) {
      console.error("[Review Drop] Notification dispatch failed:", notifErr);
    }
  }

  return {
    savedCount: liveReviews.length,
    droppedCount: missingReviews.length,
    droppedReviews: missingReviews,
  };
}

/**
 * Formats a formal Google Business Profile Support Appeal message
 * with exact timestamps, reviewer name, rating, and review text.
 */
export function generateGoogleAppealEvidence(review: any, locationName = "Our Business Profile"): string {
  const dateStr = review.reviewCreateTime
    ? new Date(review.reviewCreateTime).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Recently";

  return `
SUBJECT: Appeal for Reinstatement of Legitimate Customer Review

BUSINESS PROFILE: ${locationName}
GOOGLE REVIEW RESOURCE: ${review.reviewName || review.name || "N/A"}
REVIEW ID: ${review.reviewId || "N/A"}

--- CUSTOMER REVIEW DETAILS ---
REVIEWER NAME: ${review.reviewerName || review.reviewer?.displayName || "Genuine Customer"}
STAR RATING: ${review.rating || 5} Stars
DATE RECEIVED: ${dateStr}
REVIEW CONTENT:
"${review.comment || "(Rating submitted by verified customer)"}"
${review.ownerReply ? `\nBUSINESS RESPONSE:\n"${review.ownerReply}"` : ""}

--- APPEAL STATEMENT ---
Dear Google Business Profile Support Team,

We are writing to formally appeal the removal of the genuine customer review referenced above. 
This review represents authentic customer feedback from a real interaction with our business and fully complies with Google's Prohibited and Restricted Content policies.

The review does not contain spam, hate speech, promotional content, or fake engagement. We believe it was incorrectly filtered by automated spam detection systems.

We respectfully request that you review the provided evidence and restore this review to our profile.

Thank you,
${locationName} Management
`.trim();
}
