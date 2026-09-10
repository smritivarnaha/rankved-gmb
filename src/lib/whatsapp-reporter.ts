import prisma from "./prisma";
import { sendWhatsAppMessage } from "./whatsapp-service";

export async function sendScheduledWhatsAppReport(locationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const loc = await prisma.location.findUnique({
      where: { id: locationId },
      include: {
        client: true,
        posts: {
          where: { status: "PUBLISHED" },
          orderBy: { publishedAt: "desc" },
          take: 5,
        },
        backedUpReviews: {
          where: { status: "ACTIVE" },
          orderBy: { reviewCreateTime: "desc" },
          take: 5,
        },
      },
    });

    if (!loc || !loc.whatsappEnabled || !loc.whatsappRecipientPhone) {
      return { success: false, error: "WhatsApp not enabled or recipient phone missing for this location." };
    }

    const recipientName = loc.whatsappRecipientName || loc.client?.contactPerson || loc.name;
    const views = loc.cachedSearchViews || 0;
    const interactions = loc.cachedInteractions || 0;
    const engagements = loc.cachedEngagements || 0;
    const recentPostsCount = loc.posts.length;
    const avgRating = loc.backedUpReviews.length > 0
      ? (loc.backedUpReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / loc.backedUpReviews.length).toFixed(1)
      : "5.0";

    const dateRangeStr = new Date().toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const reportMessage = [
      "📊 *Google Business Profile Performance Digest* 📊",
      `🏢 *${loc.name}*`,
      `📅 *Period Ending:* ${dateRangeStr}`,
      "",
      `Hello *${recipientName}*, here is your latest Google Business Profile performance summary:`,
      "",
      "🚀 *Key Performance Highlights:*",
      `• 👁️ *Total Search & Map Views:* ${views.toLocaleString()}`,
      `• 📞 *Customer Actions & Inquiries:* ${interactions.toLocaleString()}`,
      `• 📍 *Direction & Profile Engagements:* ${engagements.toLocaleString()}`,
      "",
      "📝 *Content & Publishing Activity:*",
      `• Published Posts Active: *${recentPostsCount} Posts*`,
      loc.posts[0] ? `• Latest Topic: "${loc.posts[0].summary.slice(0, 75)}..."` : "• Posts updated regularly by our agency team.",
      "",
      "⭐ *Reputation & Reviews:*",
      `• Overall Rating: *⭐ ${avgRating} / 5.0*`,
      `• Monitored Reviews: *${loc.backedUpReviews.length} Reviews Analyzed*`,
      "• Automated AI Replies: *Active & Safeguarded*",
      "",
      "💡 *SEO Growth Insight:*",
      "Our local optimization strategy continues to target high-intent patient & customer searches in your area to maximize calls and footfall.",
      "",
      "💬 _Have questions about this report? Simply reply to this WhatsApp message to ask your AI Account Manager!_",
      "",
      "_Powered by RankVed GMB Intelligence_",
    ].join("\n");

    const result = await sendWhatsAppMessage({
      to: loc.whatsappRecipientPhone,
      text: reportMessage,
      locationId: loc.id,
      messageType: "SCHEDULED_REPORT",
    });

    if (result.success) {
      await prisma.location.update({
        where: { id: locationId },
        data: { whatsappLastReportSentAt: new Date() },
      });
    }

    return { success: result.success, error: result.error };
  } catch (err: any) {
    console.error("[WhatsApp Reporter] Exception generating report:", err);
    return { success: false, error: err.message || "Failed to generate report" };
  }
}
