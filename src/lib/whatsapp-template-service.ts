import prisma from "./prisma";
import { getGlobalWhatsAppConfig, formatPhoneNumber } from "./whatsapp-service";

export interface TemplateButton {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
  text: string;
  url?: string;
  phoneNumber?: string;
  payload?: string;
}

export interface WhatsAppTemplateData {
  id?: string;
  name: string;
  title: string;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  language: string;
  headerType: "NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  headerContent?: string | null;
  bodyText: string;
  footerText?: string | null;
  buttons: TemplateButton[];
  sampleParams?: string[];
  status?: "APPROVED" | "PENDING" | "REJECTED" | "PAUSED" | "DRAFT";
  metaTemplateId?: string | null;
  rejectionReason?: string | null;
  isSystemDefault?: boolean;
  chainOrder?: number;
  nextTemplateName?: string | null;
}

export const PREBUILT_TEMPLATES: WhatsAppTemplateData[] = [
  {
    name: "gbp_post_published_alert",
    title: "Post Published Notification",
    category: "UTILITY",
    language: "en_US",
    headerType: "IMAGE",
    headerContent: null,
    bodyText: "Hello {{1}}, your scheduled post is now LIVE on Google Business Profile for {{2}}.\n\n📝 *Post Summary:*\n{{3}}\n\n📌 *Action Button:* {{4}}\n⏱️ *Published:* {{5}}\n\n_Managed by RankVed GMB Manager_",
    footerText: "RankVed GMB AI",
    buttons: [
      { type: "QUICK_REPLY", text: "📊 Performance", payload: "MENU_PERF" },
      { type: "QUICK_REPLY", text: "📸 View All Posts", payload: "MENU_POSTS" },
      { type: "QUICK_REPLY", text: "📋 Main Menu", payload: "MENU_MAIN" },
    ],
    sampleParams: ["Dr. Nitika", "Apex Neurology Clinic", "Experiencing morning headaches? Learn key triggers...", "CALL (Book Appointment)", "10:30 AM"],
    status: "APPROVED",
    isSystemDefault: true,
    chainOrder: 1,
    nextTemplateName: "gbp_interactive_main_menu",
  },
  {
    name: "gbp_new_review_alert",
    title: "New Google Review Alert",
    category: "UTILITY",
    language: "en_US",
    headerType: "TEXT",
    headerContent: "⭐ New Google Review Received!",
    bodyText: "Hello {{1}}, a new {{2}}-star customer review was received for {{3}}:\\n\\n👤 *Reviewer:* {{4}}\\n⭐ *Rating:* {{5}}/5 Stars\\n💬 *Feedback:* \\\"{{6}}\\\"\\n\\n✨ _Our AI auto-replier is preparing an official keyword-rich response._",
    footerText: "RankVed Review Centre",
    buttons: [
      { type: "QUICK_REPLY", text: "⭐ All Reviews", payload: "MENU_REVIEWS" },
      { type: "QUICK_REPLY", text: "📊 Performance", payload: "MENU_PERF" },
      { type: "QUICK_REPLY", text: "📋 Main Menu", payload: "MENU_MAIN" },
    ],
    sampleParams: ["Dr. Nitika", "5", "Apex Neurology Clinic", "Ramesh Kumar", "5", "Excellent consultation and genuine diagnosis."],
    status: "APPROVED",
    isSystemDefault: true,
    chainOrder: 2,
    nextTemplateName: "gbp_review_reply_alert",
  },
  {
    name: "gbp_review_drop_alert",
    title: "Review Drop Protection Warning",
    category: "UTILITY",
    language: "en_US",
    headerType: "TEXT",
    headerContent: "🛡️ Google Review Protection Alert",
    bodyText: "Hello {{1}}, Google's spam filter sweep temporarily filtered {{2}} customer review(s) for {{3}}.\\n\\n📋 *Filtered Review:*\\n• {{4}} ({{5}}⭐): \\\"{{6}}\\\"\\n\\n✅ *Protected by RankVed:*\\nWe have preserved the full review text with 1-click appeal evidence in your Review Centre.",
    footerText: "RankVed Review Vault",
    buttons: [
      { type: "QUICK_REPLY", text: "⭐ Active Reviews", payload: "MENU_REVIEWS" },
      { type: "QUICK_REPLY", text: "📋 Main Menu", payload: "MENU_MAIN" },
    ],
    sampleParams: ["Dr. Nitika", "1", "Apex Neurology Clinic", "Pooja Sharma", "5", "Very helpful doctor and staff."],
    status: "APPROVED",
    isSystemDefault: true,
    chainOrder: 3,
  },
  {
    name: "gbp_weekly_performance_digest",
    title: "Weekly Performance Digest",
    category: "UTILITY",
    language: "en_US",
    headerType: "TEXT",
    headerContent: "📊 Weekly Google Business Report",
    bodyText: "Hello {{1}}, here is your weekly Google Business visibility digest for {{2}}:\\n\\n• 🔍 *Search & Maps Views:* {{3}}\\n• 📞 *Direct Phone Calls:* {{4}}\\n• 🗺️ *Direction Requests:* {{5}}\\n• 🌐 *Website Clicks:* {{6}}\\n\\n✨ *Status:* Ranked in Top 3 Local Pack for Target Keywords.",
    footerText: "RankVed GMB Analytics",
    buttons: [
      { type: "QUICK_REPLY", text: "📅 30 Days Report", payload: "SUB_PERF_30D" },
      { type: "QUICK_REPLY", text: "📸 View Posts", payload: "MENU_POSTS" },
      { type: "QUICK_REPLY", text: "📋 Main Menu", payload: "MENU_MAIN" },
    ],
    sampleParams: ["Dr. Nitika", "Apex Neurology Clinic", "2,840", "18 calls", "14 requests", "8 clicks"],
    status: "APPROVED",
    isSystemDefault: true,
    chainOrder: 4,
  },
  {
    name: "gbp_review_reply_alert",
    title: "Official Review Reply Published",
    category: "UTILITY",
    language: "en_US",
    headerType: "TEXT",
    headerContent: "💬 Google Review Reply Live",
    bodyText: "Hello {{1}}, we have published an official response to {{2}}'s {{3}}-star review for {{4}}:\\n\\n📩 *Our Response:*\\n\\\"{{5}}\\\"\\n\\n✅ *Status:* Live on Google Business Profile.",
    footerText: "RankVed Auto-Replier",
    buttons: [
      { type: "QUICK_REPLY", text: "⭐ All Reviews", payload: "MENU_REVIEWS" },
      { type: "QUICK_REPLY", text: "📋 Main Menu", payload: "MENU_MAIN" },
    ],
    sampleParams: ["Dr. Nitika", "Ramesh Kumar", "5", "Apex Neurology Clinic", "Thank you Ramesh ji for trusting Apex Neurology for your treatment!"],
    status: "APPROVED",
    isSystemDefault: true,
    chainOrder: 5,
  },
  {
    name: "gbp_interactive_main_menu",
    title: "Interactive Main Menu Chain",
    category: "UTILITY",
    language: "en_US",
    headerType: "TEXT",
    headerContent: "📋 Google Business AI Menu",
    bodyText: "Namaste {{1}}! 🙏 Welcome to your *RankVed GMB AI Account Manager* for {{2}}.\\n\\nSelect an option below or reply 1-6 for instant live updates:\\n1️⃣ *Performance Report* 📊\\n2️⃣ *Latest Google Posts* 📸\\n3️⃣ *Recent Reviews & Replies* ⭐\\n4️⃣ *Target Keywords & SEO* 🎯\\n5️⃣ *Clinic FAQs & Doctor Info* 🏥\\n6️⃣ *Ask AI Assistant* 🤖",
    footerText: "Reply 1-6 or tap a button",
    buttons: [
      { type: "QUICK_REPLY", text: "1. Performance", payload: "MENU_PERF" },
      { type: "QUICK_REPLY", text: "2. Latest Posts", payload: "MENU_POSTS" },
      { type: "QUICK_REPLY", text: "3. Reviews", payload: "MENU_REVIEWS" },
    ],
    sampleParams: ["Dr. Nitika", "Apex Neurology Clinic"],
    status: "APPROVED",
    isSystemDefault: true,
    chainOrder: 6,
  },
  {
    name: "gbp_monthly_growth_report",
    title: "Monthly ROI & Growth Report",
    category: "MARKETING",
    language: "en_US",
    headerType: "TEXT",
    headerContent: "🚀 Monthly GMB Growth Report",
    bodyText: "Hello {{1}}, your Monthly Google Business Growth Summary for {{2}} is ready!\\n\\n📈 *Overall Visibility Growth:* +{{3}}%\\n📞 *Total Patient Calls:* {{4}}\\n⭐ *New 5-Star Reviews:* +{{5}}\\n🔍 *Top Keyword:* \\\"{{6}}\\\"\\n\\n_Managed by RankVed GMB Agency_",
    footerText: "RankVed Growth Vault",
    buttons: [
      { type: "QUICK_REPLY", text: "📊 Full Analytics", payload: "MENU_PERF" },
      { type: "QUICK_REPLY", text: "📋 Main Menu", payload: "MENU_MAIN" },
    ],
    sampleParams: ["Dr. Nitika", "Apex Neurology Clinic", "34", "78 patient calls", "12 reviews", "best neurologist in Model Town"],
    status: "APPROVED",
    isSystemDefault: true,
    chainOrder: 7,
  },
];

/**
 * Seeds pre-built AiSensy/Wati-grade templates into the database
 */
export async function seedSystemDefaultTemplates(): Promise<void> {
  for (const tpl of PREBUILT_TEMPLATES) {
    await prisma.whatsAppTemplate.upsert({
      where: { name: tpl.name },
      create: {
        name: tpl.name,
        title: tpl.title,
        category: tpl.category,
        language: tpl.language,
        headerType: tpl.headerType,
        headerContent: tpl.headerContent || null,
        bodyText: tpl.bodyText,
        footerText: tpl.footerText || null,
        buttonsJson: JSON.stringify(tpl.buttons),
        sampleParams: tpl.sampleParams ? JSON.stringify(tpl.sampleParams) : null,
        status: tpl.status || "APPROVED",
        isSystemDefault: true,
        chainOrder: tpl.chainOrder || 0,
        nextTemplateName: tpl.nextTemplateName || null,
      },
      update: {
        title: tpl.title,
        category: tpl.category,
        headerType: tpl.headerType,
        headerContent: tpl.headerContent || null,
        bodyText: tpl.bodyText,
        footerText: tpl.footerText || null,
        buttonsJson: JSON.stringify(tpl.buttons),
        sampleParams: tpl.sampleParams ? JSON.stringify(tpl.sampleParams) : null,
        isSystemDefault: true,
        chainOrder: tpl.chainOrder || 0,
        nextTemplateName: tpl.nextTemplateName || null,
      },
    });
  }
}

/**
 * Syncs template approval statuses directly from Meta Graph API
 */
export async function syncTemplatesFromMeta(): Promise<{ success: boolean; syncedCount: number; metaTemplates?: any[]; error?: string }> {
  const config = await getGlobalWhatsAppConfig();

  if (!config.businessAccountId || !config.accessToken) {
    return { success: false, syncedCount: 0, error: "Meta WABA ID or Access Token is missing in WhatsApp Settings." };
  }

  try {
    const url = `https://graph.facebook.com/v20.0/${config.businessAccountId}/message_templates?limit=100`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${config.accessToken}` },
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { success: false, syncedCount: 0, error: data.error?.message || `HTTP ${res.status}` };
    }

    const metaList = data.data || [];
    let updatedCount = 0;

    for (const mt of metaList) {
      const dbTpl = await prisma.whatsAppTemplate.findUnique({ where: { name: mt.name } });
      if (dbTpl) {
        await prisma.whatsAppTemplate.update({
          where: { name: mt.name },
          data: {
            status: mt.status || "APPROVED",
            metaTemplateId: mt.id || undefined,
            rejectionReason: mt.rejected_reason || null,
          },
        });
        updatedCount++;
      } else {
        // Import template from Meta if not in DB
        const bodyComp = mt.components?.find((c: any) => c.type === "BODY");
        const headerComp = mt.components?.find((c: any) => c.type === "HEADER");
        const footerComp = mt.components?.find((c: any) => c.type === "FOOTER");
        const buttonsComp = mt.components?.find((c: any) => c.type === "BUTTONS");

        const buttons: TemplateButton[] = (buttonsComp?.buttons || []).map((b: any) => ({
          type: b.type === "URL" ? "URL" : b.type === "PHONE_NUMBER" ? "PHONE_NUMBER" : "QUICK_REPLY",
          text: b.text || "Option",
          url: b.url,
          phoneNumber: b.phone_number,
          payload: b.payload,
        }));

        await prisma.whatsAppTemplate.create({
          data: {
            name: mt.name,
            title: mt.name.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
            category: mt.category || "UTILITY",
            language: mt.language || "en_US",
            headerType: headerComp?.format || (headerComp?.text ? "TEXT" : "NONE"),
            headerContent: headerComp?.text || null,
            bodyText: bodyComp?.text || "",
            footerText: footerComp?.text || null,
            buttonsJson: JSON.stringify(buttons),
            status: mt.status || "APPROVED",
            metaTemplateId: mt.id,
            rejectionReason: mt.rejected_reason || null,
          },
        });
        updatedCount++;
      }
    }

    return { success: true, syncedCount: updatedCount, metaTemplates: metaList };
  } catch (err: any) {
    return { success: false, syncedCount: 0, error: err.message };
  }
}

/**
 * Submits a new custom template to Meta Graph API for official approval
 */
export async function submitTemplateToMeta(templateData: WhatsAppTemplateData): Promise<{ success: boolean; templateId?: string; error?: string }> {
  const config = await getGlobalWhatsAppConfig();

  if (!config.businessAccountId || !config.accessToken) {
    return { success: false, error: "Meta WABA ID or Access Token is missing. Save your credentials in Settings > WhatsApp API." };
  }

  const components: any[] = [];

  // Header Component
  if (templateData.headerType === "TEXT" && templateData.headerContent) {
    components.push({
      type: "HEADER",
      format: "TEXT",
      text: templateData.headerContent,
    });
  } else if (["IMAGE", "VIDEO", "DOCUMENT"].includes(templateData.headerType)) {
    components.push({
      type: "HEADER",
      format: templateData.headerType,
      example: {
        header_handle: ["https://gmb.rankved.com/logo.png"],
      },
    });
  }

  // Body Component (with parameter examples)
  const bodyComponent: any = {
    type: "BODY",
    text: templateData.bodyText,
  };

  if (templateData.sampleParams && templateData.sampleParams.length > 0) {
    bodyComponent.example = {
      body_text: [templateData.sampleParams],
    };
  }
  components.push(bodyComponent);

  // Footer Component
  if (templateData.footerText) {
    components.push({
      type: "FOOTER",
      text: templateData.footerText,
    });
  }

  // Buttons Component
  if (templateData.buttons && templateData.buttons.length > 0) {
    components.push({
      type: "BUTTONS",
      buttons: templateData.buttons.map(b => {
        if (b.type === "URL") {
          return { type: "URL", text: b.text.slice(0, 25), url: b.url || "https://gmb.rankved.com" };
        }
        if (b.type === "PHONE_NUMBER") {
          return { type: "PHONE_NUMBER", text: b.text.slice(0, 25), phone_number: b.phoneNumber || "+919876543210" };
        }
        return { type: "QUICK_REPLY", text: b.text.slice(0, 25) };
      }),
    });
  }

  const payload = {
    name: templateData.name.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
    category: templateData.category || "UTILITY",
    language: templateData.language || "en_US",
    components,
  };

  try {
    const url = `https://graph.facebook.com/v20.0/${config.businessAccountId}/message_templates`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { success: false, error: data.error?.message || `Meta API Error ${res.status}` };
    }

    return { success: true, templateId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Sends an official WhatsApp Template Message
 */
export async function sendOfficialWhatsAppTemplate(opts: {
  to: string;
  templateName: string;
  languageCode?: string;
  parameters: string[];
  mediaUrl?: string | null;
  locationId?: string | null;
  messageType?: any;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, templateName, languageCode = "en_US", parameters, mediaUrl, locationId } = opts;
  const cleanRecipient = formatPhoneNumber(to);
  const config = await getGlobalWhatsAppConfig();

  if (!cleanRecipient) return { success: false, error: "Invalid recipient phone" };
  if (!config.phoneNumberId || !config.accessToken) {
    return { success: false, error: "Meta WhatsApp credentials missing." };
  }

  const templateComponents: any[] = [];

  // Media Header if required
  if (mediaUrl) {
    templateComponents.push({
      type: "header",
      parameters: [
        {
          type: "image",
          image: { link: mediaUrl },
        },
      ],
    });
  }

  // Body text parameters
  if (parameters && parameters.length > 0) {
    templateComponents.push({
      type: "body",
      parameters: parameters.map(val => ({
        type: "text",
        text: val,
      })),
    });
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanRecipient,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: templateComponents,
    },
  };

  try {
    const url = `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    const success = res.ok && !!data.messages?.[0]?.id;

    await prisma.whatsAppMessageLog.create({
      data: {
        locationId: locationId || null,
        direction: "OUTBOUND",
        senderPhone: config.phoneNumberId,
        recipientPhone: cleanRecipient,
        messageType: opts.messageType || "SCHEDULED_REPORT",
        content: `[Template: ${templateName}] ${parameters.join(" | ")}`,
        mediaUrl: mediaUrl || null,
        status: success ? "SENT" : "FAILED",
        errorMessage: !success ? (data.error?.message || "Failed to send template") : null,
        rawPayload: data,
      },
    });

    return { success, messageId: data.messages?.[0]?.id, error: data.error?.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
