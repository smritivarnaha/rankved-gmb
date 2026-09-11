import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendWhatsAppMessage, formatPhoneNumber, getGlobalWhatsAppConfig } from "@/lib/whatsapp-service";
import { sendOfficialWhatsAppTemplate } from "@/lib/whatsapp-template-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { phone, type, messageText, templateName, templateParams, locationId } = body;

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Please enter a valid recipient WhatsApp phone number." }, { status: 400 });
    }

    const cleanPhone = formatPhoneNumber(phone);
    const config = await getGlobalWhatsAppConfig();

    if (!config.phoneNumberId || !config.accessToken) {
      return NextResponse.json({
        success: false,
        error: "Meta WhatsApp credentials missing. Please set Phone Number ID and Access Token in the 'Cloud API & Meta Setup' tab first.",
        details: { phoneNumberId: Boolean(config.phoneNumberId), accessToken: Boolean(config.accessToken) }
      }, { status: 400 });
    }

    if (type === "OFFICIAL_TEMPLATE" && templateName) {
      const res = await sendOfficialWhatsAppTemplate({
        to: cleanPhone,
        templateName,
        languageCode: "en_US",
        parameters: Array.isArray(templateParams) && templateParams.length > 0 ? templateParams : ["Doctor / Client", "RankVed GMB Demo"],
        locationId: locationId || undefined,
      });

      if (!res.success) {
        return NextResponse.json({
          success: false,
          error: res.error || "Meta rejected template dispatch.",
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        messageId: res.messageId,
        message: `Template "${templateName}" dispatched successfully to ${cleanPhone}!`,
      });
    }

    // Default: Custom Text Message with Interactive Buttons
    const textToSend = messageText && messageText.trim()
      ? messageText.trim()
      : "👋 *Namaste from RankVed GMB AI!*\n\nThis is a live test notification from your GMB WhatsApp Manager.\n\n✨ *Live Status:* Active & Ready\n📊 *Features:* Automated Post Alerts, Review Replies, and Local SEO Intelligence.";

    const result = await sendWhatsAppMessage({
      to: cleanPhone,
      text: textToSend,
      locationId: locationId || undefined,
      messageType: "TEST_ALERT",
      buttons: [
        { id: "BTN_STATS", title: "📊 View Stats" },
        { id: "BTN_MENU", title: "📋 Main Menu" },
      ],
      footerText: "RankVed GMB Manager",
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || "Failed to send WhatsApp message via Meta Cloud API.",
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `Test message dispatched successfully to ${cleanPhone}!`,
    });
  } catch (err: any) {
    console.error("[WhatsApp Send Test Error]:", err);
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}
