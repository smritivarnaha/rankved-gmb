import prisma from "./prisma";
import { formatPhoneNumber, sendWhatsAppMessage } from "./whatsapp-service";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function findLocationBySenderPhone(senderPhone: string) {
  const cleanPhone = formatPhoneNumber(senderPhone);
  if (!cleanPhone) return null;

  const locations = await prisma.location.findMany({
    where: {
      whatsappEnabled: true,
      whatsappRecipientPhone: { not: null },
    },
    include: {
      client: true,
    },
  });

  for (const loc of locations) {
    if (loc.whatsappRecipientPhone) {
      const formattedLocPhone = formatPhoneNumber(loc.whatsappRecipientPhone);
      if (
        formattedLocPhone === cleanPhone ||
        cleanPhone.endsWith(formattedLocPhone) ||
        formattedLocPhone.endsWith(cleanPhone)
      ) {
        return loc;
      }
    }
  }

  return null;
}

export interface ProfileRAGContext {
  profileName: string;
  contactName: string;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  cachedViews: number;
  cachedInteractions: number;
  cachedEngagements: number;
  recentPosts: Array<{
    summary: string;
    publishedAt: string | null;
    hasImage: boolean;
    cta: string | null;
  }>;
  recentReviews: Array<{
    reviewer: string;
    rating: number;
    comment: string | null;
    reply: string | null;
    date: string | null;
  }>;
  aiKeywords: string[];
  customInstructions?: string | null;
  language: string;
}

export async function buildProfileRAGContext(locationId: string): Promise<ProfileRAGContext | null> {
  const loc = await prisma.location.findUnique({
    where: { id: locationId },
    include: {
      client: true,
      posts: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 10,
      },
      backedUpReviews: {
        where: { status: "ACTIVE" },
        orderBy: { reviewCreateTime: "desc" },
        take: 12,
      },
    },
  });

  if (!loc) return null;

  let keywords: string[] = [];
  if (loc.aiKeywords) {
    try {
      keywords = loc.aiKeywords.split(/[,\n]/).map(k => k.trim()).filter(Boolean);
    } catch {}
  }

  return {
    profileName: loc.name,
    contactName: loc.whatsappRecipientName || loc.client?.contactPerson || loc.name,
    address: loc.address,
    phone: loc.phone || loc.aiPhone,
    website: loc.website || loc.aiWebsite,
    cachedViews: loc.cachedSearchViews || 0,
    cachedInteractions: loc.cachedInteractions || 0,
    cachedEngagements: loc.cachedEngagements || 0,
    recentPosts: loc.posts.map(p => ({
      summary: p.summary,
      publishedAt: p.publishedAt ? p.publishedAt.toLocaleDateString("en-IN") : null,
      hasImage: !!p.mediaUrl,
      cta: p.ctaType || null,
    })),
    recentReviews: loc.backedUpReviews.map(r => ({
      reviewer: r.reviewerName || "Customer",
      rating: r.rating || 5,
      comment: r.comment,
      reply: r.ownerReply,
      date: r.reviewCreateTime ? r.reviewCreateTime.toLocaleDateString("en-IN") : null,
    })),
    aiKeywords: keywords,
    customInstructions: loc.whatsappCustomInstructions || loc.aiInstructions,
    language: loc.whatsappLanguage || "en",
  };
}

export async function handleInboundWhatsAppMessage(params: {
  senderPhone: string;
  messageText: string;
  locationId?: string;
}): Promise<{ success: boolean; replyText: string }> {
  const { senderPhone, messageText } = params;

  try {
    await prisma.whatsAppMessageLog.create({
      data: {
        locationId: params.locationId || null,
        direction: "INBOUND",
        senderPhone,
        recipientPhone: "SYSTEM",
        messageType: "CHAT_QUERY",
        content: messageText,
        status: "RECEIVED",
      },
    });
  } catch (e) {
    console.error("[WhatsApp Agent] Failed to log inbound query:", e);
  }

  let loc = null;
  if (params.locationId) {
    loc = await prisma.location.findUnique({ where: { id: params.locationId }, include: { client: true } });
  } else {
    loc = await findLocationBySenderPhone(senderPhone);
  }

  if (!loc) {
    const unknownReply = [
      "👋 *Hello! Welcome to RankVed GMB AI Assistant.*",
      "",
      `We could not find a Google Business Profile linked to your phone number (*${senderPhone}*).`,
      "",
      "Please ensure this WhatsApp number is configured in your *GMB Manager Profile Settings*, or contact your RankVed account manager for setup.",
    ].join("\n");

    await sendWhatsAppMessage({
      to: senderPhone,
      text: unknownReply,
      messageType: "CHAT_RESPONSE",
    });

    return { success: true, replyText: unknownReply };
  }

  const ragContext = await buildProfileRAGContext(loc.id);
  if (!ragContext) {
    const errorReply = "Sorry, I am having trouble fetching your profile details right now. Please try again in a moment.";
    await sendWhatsAppMessage({ to: senderPhone, text: errorReply, locationId: loc.id, messageType: "CHAT_RESPONSE" });
    return { success: false, replyText: errorReply };
  }

  const recentLogs = await prisma.whatsAppMessageLog.findMany({
    where: {
      locationId: loc.id,
      messageType: { in: ["CHAT_QUERY", "CHAT_RESPONSE", "SCHEDULED_REPORT", "POST_ALERT", "REVIEW_ALERT"] },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const chatHistory = recentLogs.reverse().map(log => ({
    role: log.direction === "INBOUND" ? "user" : "assistant",
    content: log.content,
  }));

  const systemPrompt = `
You are the dedicated Google Business Profile (GMB) AI Account Manager for "${ragContext.profileName}".
Client/Doctor/Owner Name: "${ragContext.contactName}".
Business Location: "${loc.address || ""} | Phone: ${loc.phone || ""}".

=== YOUR ROLE & PERSONALITY ===
- You are a knowledgeable, respectful, proactive GMB account manager communicating over WhatsApp.
- Address the client respectfully as "${ragContext.contactName}".
- Language Style: Respond in ${ragContext.language === "hi" ? "Hindi" : ragContext.language === "hinglish" ? "Hinglish (Hindi + English blend)" : "Clear, professional English"}. Match the user's inquiry language naturally.
- WhatsApp Formatting Rules:
  * Use bold (*text*) for key metrics, headings, and important words.
  * Use emojis (📈, ⭐, 🚀, 📞, 📍) to make messages engaging and easy to read.
  * Keep paragraphs short and concise (2-4 bullet points or short paragraphs). Never output huge walls of text.
  * If asked about performance, summarize views, calls, directions, and recent reviews clearly.
  * If asked about posts, explain the recent topics published, why they target local SEO, and their status.
  * If asked about reviews, summarize recent ratings, customer feedback, and how our auto-replier handles them.

=== REAL-TIME ACCOUNT CONTEXT (RAG DATA) ===
1. Performance Metrics:
   - Search Views: ${ragContext.cachedViews}
   - Customer Interactions (Calls/Directions/Clicks): ${ragContext.cachedInteractions}
   - Customer Engagements: ${ragContext.cachedEngagements}

2. Recent Published Posts:
${ragContext.recentPosts.slice(0, 5).map((p, i) => `   [${i + 1}] Date: ${p.publishedAt || "Recent"} | CTA: ${p.cta || "CALL"}\n   Summary: "${p.summary.slice(0, 140)}..."`).join("\n\n")}

3. Recent Customer Reviews:
${ragContext.recentReviews.slice(0, 5).map((r, i) => `   [${i + 1}] ${r.reviewer} (${r.rating}/5 Stars) on ${r.date || "Recent"}: "${r.comment || "Rating only"}"\n   Reply: "${r.reply ? r.reply.slice(0, 100) + "..." : "No reply yet"}"`).join("\n\n")}

4. Target SEO Keywords:
   ${ragContext.aiKeywords.length > 0 ? ragContext.aiKeywords.slice(0, 8).join(", ") : "Local healthcare and clinic specialty keywords"}

5. Custom Instructions for this Account:
   ${ragContext.customInstructions || "Maintain high medical professionalism, highlight patient trust and local visibility."}
`.trim();

  let replyText = "";

  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "AGENCY_OWNER"] } },
    select: { openaiApiKey: true, anthropicApiKey: true, geminiApiKey: true, openrouterApiKey: true },
  });

  const openaiKey = process.env.OPENAI_API_KEY || adminUser?.openaiApiKey;
  const anthropicKey = process.env.ANTHROPIC_API_KEY || adminUser?.anthropicApiKey;
  const geminiKey = process.env.GEMINI_API_KEY || adminUser?.geminiApiKey;

  try {
    if (openaiKey) {
      const openai = new OpenAI({ apiKey: openaiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...chatHistory.map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
          { role: "user", content: messageText },
        ],
        temperature: 0.7,
        max_tokens: 600,
      });
      replyText = completion.choices[0]?.message?.content?.trim() || "";
    } else if (anthropicKey) {
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        system: systemPrompt,
        messages: [
          ...chatHistory.map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
          { role: "user", content: messageText },
        ],
        max_tokens: 600,
      });
      replyText = (response.content[0] as any)?.text || "";
    } else if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `${systemPrompt}\n\nClient asked: ${messageText}`;
      const result = await model.generateContent(prompt);
      replyText = result.response.text().trim();
    } else {
      replyText = [
        `Hello *${ragContext.contactName}*! 👋`,
        ``,
        `Here is a quick snapshot for *${ragContext.profileName}*:`,
        `• 📈 Total Profile Views: *${ragContext.cachedViews}*`,
        `• 📞 Total Customer Interactions: *${ragContext.cachedInteractions}*`,
        `• 🚀 Recent Posts: *${ragContext.recentPosts.length} published*`,
        `• ⭐ Recent Reviews: *${ragContext.recentReviews.length} monitored*`,
        ``,
        `_Our team is managing your profile to ensure top local Google ranking!_`,
      ].join("\n");
    }
  } catch (aiErr) {
    console.error("[WhatsApp Agent] AI Generation Error:", aiErr);
    replyText = [
      `Hello *${ragContext.contactName}*! 👋`,
      ``,
      `Here is your current profile snapshot for *${ragContext.profileName}*:`,
      `• 📈 Search Views: *${ragContext.cachedViews}*`,
      `• 📞 Interactions & Calls: *${ragContext.cachedInteractions}*`,
      `• 📝 Latest Post: "${ragContext.recentPosts[0]?.summary.slice(0, 80) || "Active"}"`,
      ``,
      `Feel free to ask me anything about your GMB marketing!`,
    ].join("\n");
  }

  await sendWhatsAppMessage({
    to: senderPhone,
    text: replyText,
    locationId: loc.id,
    messageType: "CHAT_RESPONSE",
  });

  return { success: true, replyText };
}
