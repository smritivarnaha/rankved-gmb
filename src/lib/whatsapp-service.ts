import prisma from "./prisma";

export interface WhatsAppConfig {
  provider: string; // "META_CLOUD" | "GENERIC_WEBHOOK" | "TWILIO"
  phoneNumberId?: string | null;
  accessToken?: string | null;
  businessAccountId?: string | null;
  webhookVerifyToken?: string | null;
  gatewayUrl?: string | null;
  aiModel?: string | null;
}

export async function getGlobalWhatsAppConfig(): Promise<WhatsAppConfig> {
  const settings = await prisma.globalSetting.findUnique({
    where: { id: "settings" },
  });

  return {
    provider: settings?.whatsappProvider || process.env.WHATSAPP_PROVIDER || "META_CLOUD",
    phoneNumberId: settings?.whatsappPhoneNumberId || process.env.META_WHATSAPP_PHONE_ID || null,
    accessToken: settings?.whatsappAccessToken || process.env.META_WHATSAPP_TOKEN || null,
    businessAccountId: settings?.whatsappBusinessAccountId || process.env.META_WHATSAPP_WABA_ID || null,
    webhookVerifyToken: settings?.whatsappWebhookVerifyToken || process.env.WHATSAPP_VERIFY_TOKEN || "rankved_wa_verify_token",
    gatewayUrl: settings?.whatsappGatewayUrl || process.env.WHATSAPP_GATEWAY_URL || null,
    aiModel: settings?.whatsappAiModel || "gpt-4o",
  };
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    cleaned = "91" + cleaned;
  }
  return cleaned;
}

export interface SendWhatsAppOptions {
  to: string;
  text: string;
  mediaUrl?: string | null;
  locationId?: string | null;
  messageType: "POST_ALERT" | "REVIEW_ALERT" | "REPLY_ALERT" | "SCHEDULED_REPORT" | "CHAT_QUERY" | "CHAT_RESPONSE" | "TEST_ALERT";
}

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendWhatsAppMessage(opts: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
  const { to, text, mediaUrl, locationId, messageType } = opts;
  const cleanRecipient = formatPhoneNumber(to);

  if (!cleanRecipient) {
    return { success: false, error: "Invalid recipient phone number" };
  }

  const config = await getGlobalWhatsAppConfig();
  let success = false;
  let errorMsg: string | null = null;
  let rawResponse: any = null;

  try {
    if (config.provider === "GENERIC_WEBHOOK" && config.gatewayUrl) {
      const res = await fetch(config.gatewayUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: cleanRecipient,
          body: text,
          caption: text,
          mediaUrl: mediaUrl || undefined,
          type: mediaUrl ? "image" : "text",
        }),
      });
      rawResponse = await res.json().catch(() => ({ status: res.status }));
      success = res.ok;
      if (!res.ok) {
        errorMsg = rawResponse?.message || rawResponse?.error || `HTTP ${res.status}`;
      }
    } else {
      if (!config.phoneNumberId || !config.accessToken) {
        const missing = [
          !config.phoneNumberId ? "Phone Number ID" : "",
          !config.accessToken ? "Access Token" : "",
        ].filter(Boolean).join(", ");
        errorMsg = `Meta WhatsApp credentials missing: ${missing}. Configure them in Settings > WhatsApp API.`;
        console.warn(`[WhatsApp Service] ${errorMsg}`);
      } else {
        const url = `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`;
        
        let payload: any = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanRecipient,
        };

        if (mediaUrl && (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://"))) {
          payload.type = "image";
          payload.image = {
            link: mediaUrl,
            caption: text,
          };
        } else {
          payload.type = "text";
          payload.text = {
            preview_url: true,
            body: text,
          };
        }

        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        rawResponse = await res.json();
        if (res.ok && rawResponse.messages?.[0]?.id) {
          success = true;
        } else {
          errorMsg = rawResponse?.error?.message || `Meta WhatsApp API error ${res.status}`;
          console.error("[WhatsApp Service] Meta API Error:", JSON.stringify(rawResponse));
        }
      }
    }
  } catch (err: any) {
    errorMsg = err.message || "Network error while sending WhatsApp message";
    console.error("[WhatsApp Service] Exception:", err);
  }

  try {
    await prisma.whatsAppMessageLog.create({
      data: {
        locationId: locationId || null,
        direction: "OUTBOUND",
        senderPhone: config.phoneNumberId || "SYSTEM",
        recipientPhone: cleanRecipient,
        messageType,
        content: text,
        mediaUrl: mediaUrl || null,
        status: success ? "SENT" : "FAILED",
        errorMessage: errorMsg,
        rawPayload: rawResponse ? JSON.parse(JSON.stringify(rawResponse)) : undefined,
      },
    });
  } catch (logErr) {
    console.error("[WhatsApp Service] Failed to log message to DB:", logErr);
  }

  return {
    success,
    messageId: rawResponse?.messages?.[0]?.id,
    error: errorMsg || undefined,
  };
}

export async function sendPostPublishedAlert(params: {
  locationId: string;
  summary: string;
  mediaUrl?: string | null;
  ctaType?: string | null;
  ctaUrl?: string | null;
  gbpPostName?: string | null;
}): Promise<void> {
  try {
    const loc = await prisma.location.findUnique({
      where: { id: params.locationId },
      include: { client: true },
    });

    if (!loc || !loc.whatsappEnabled || !loc.whatsappNotifyPost || !loc.whatsappRecipientPhone) {
      return;
    }

    const recipientName = loc.whatsappRecipientName || loc.client?.contactPerson || loc.name;
    const ctaLabel = params.ctaType && params.ctaType !== "NONE" ? `📌 *Action Button:* ${params.ctaType}${params.ctaUrl ? ` (${params.ctaUrl})` : ""}` : "";

    const message = [
      `🚀 *New Post Published on Google Business Profile!*`,
      ``,
      `Hello *${recipientName}*, your scheduled post is now *LIVE* on Google for *${loc.name}*.`,
      ``,
      `📝 *Post Content:*`,
      `"${params.summary}"`,
      ctaLabel ? `\n${ctaLabel}` : ``,
      `✅ *Status:* Published & Live on Google Maps & Search`,
      `⏱️ *Time:* ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}`,
      ``,
      `_Managed by RankVed GMB Manager_`,
    ].filter(Boolean).join("\n");

    await sendWhatsAppMessage({
      to: loc.whatsappRecipientPhone,
      text: message,
      mediaUrl: params.mediaUrl,
      locationId: loc.id,
      messageType: "POST_ALERT",
    });
  } catch (err) {
    console.error("[WhatsApp Alert] Failed to send post alert:", err);
  }
}

export async function sendNewReviewAlert(params: {
  locationId: string;
  reviewerName: string;
  rating: number;
  comment?: string | null;
  reviewTime?: string | null;
}): Promise<void> {
  try {
    const loc = await prisma.location.findUnique({
      where: { id: params.locationId },
      include: { client: true },
    });

    if (!loc || !loc.whatsappEnabled || !loc.whatsappNotifyReview || !loc.whatsappRecipientPhone) {
      return;
    }

    const recipientName = loc.whatsappRecipientName || loc.client?.contactPerson || loc.name;
    const stars = "⭐".repeat(Math.min(Math.max(params.rating || 5, 1), 5));
    const isNegative = (params.rating || 5) <= 2;

    const message = [
      isNegative ? `⚠️ *New Low Rating Review Received!*` : `🌟 *New Google Review Received!*`,
      ``,
      `Hello *${recipientName}*, a new customer review was just posted on Google for *${loc.name}*:`,
      ``,
      `👤 *Reviewer:* ${params.reviewerName || "Google User"}`,
      `⭐ *Rating:* ${stars} (${params.rating}/5 Stars)`,
      params.comment ? `💬 *Feedback:* "${params.comment}"` : `💬 *Feedback:* (Star rating only)`,
      ``,
      isNegative
        ? `🛡️ _Our team & AI assistant will monitor and handle this review carefully._`
        : `✨ _We are preparing an automated personalized response for this client._`,
      ``,
      `_Managed by RankVed GMB Manager_`,
    ].join("\n");

    await sendWhatsAppMessage({
      to: loc.whatsappRecipientPhone,
      text: message,
      locationId: loc.id,
      messageType: "REVIEW_ALERT",
    });
  } catch (err) {
    console.error("[WhatsApp Alert] Failed to send review alert:", err);
  }
}

export async function sendReviewReplyAlert(params: {
  locationId: string;
  reviewerName: string;
  rating: number;
  replyText: string;
}): Promise<void> {
  try {
    const loc = await prisma.location.findUnique({
      where: { id: params.locationId },
      include: { client: true },
    });

    if (!loc || !loc.whatsappEnabled || !loc.whatsappNotifyReply || !loc.whatsappRecipientPhone) {
      return;
    }

    const recipientName = loc.whatsappRecipientName || loc.client?.contactPerson || loc.name;
    const stars = "⭐".repeat(Math.min(Math.max(params.rating || 5, 1), 5));

    const message = [
      `💬 *Google Review Reply Published!*`,
      ``,
      `Hello *${recipientName}*, we have officially posted a response to *${params.reviewerName}*'s ${stars} review for *${loc.name}*.`,
      ``,
      `📩 *Our Official Response:*`,
      `"${params.replyText}"`,
      ``,
      `✅ *Status:* Live on Google Business Profile`,
      `_Managed by RankVed GMB Manager_`,
    ].join("\n");

    await sendWhatsAppMessage({
      to: loc.whatsappRecipientPhone,
      text: message,
      locationId: loc.id,
      messageType: "REPLY_ALERT",
    });
  } catch (err) {
    console.error("[WhatsApp Alert] Failed to send reply alert:", err);
  }
}

export async function sendTestWhatsAppAlert(locationId: string, recipientPhone: string): Promise<SendWhatsAppResult> {
  const loc = await prisma.location.findUnique({
    where: { id: locationId },
  });

  const profileName = loc?.name || "Your Google Business Profile";
  const testMessage = [
    `✅ *WhatsApp AI Agent Connected Successfully!*`,
    ``,
    `Hello! This is a test alert from your *RankVed GMB AI Account Manager*.`,
    ``,
    `🏢 *Connected Profile:* ${profileName}`,
    `📊 *Features Active:*`,
    `• Instant Post Publication Updates (with images & links)`,
    `• Real-time Review Alerts & Ratings Summaries`,
    `• Automated Review Reply Notifications`,
    `• Scheduled GMB Performance & Call Reports`,
    `• 24/7 Interactive AI Q&A for your Profile`,
    ``,
    `💬 *Try asking:* "How is my profile performing this week?" or "What was our last post about?"`,
  ].join("\n");

  return await sendWhatsAppMessage({
    to: recipientPhone,
    text: testMessage,
    locationId,
    messageType: "TEST_ALERT",
  });
}
