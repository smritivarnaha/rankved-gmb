import { NextRequest, NextResponse } from "next/server";
import { getGlobalWhatsAppConfig } from "@/lib/whatsapp-service";
import { handleInboundWhatsAppMessage } from "@/lib/whatsapp-rag-agent";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const config = await getGlobalWhatsAppConfig();
  const expectedToken = config.webhookVerifyToken || "rankved_wa_verify_token";

  if (mode === "subscribe" && token === expectedToken) {
    console.log("[WhatsApp Webhook] Verification successful!");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[WhatsApp Webhook] Verification token mismatch:", { token, expectedToken });
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[WhatsApp Webhook] Incoming payload:", JSON.stringify(body, null, 2));

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const message = changes?.messages?.[0];

    if (message) {
      const senderPhone = message.from;
      let messageText = "";

      if (message.type === "text") {
        messageText = message.text?.body || "";
      } else if (message.type === "interactive") {
        messageText =
          message.interactive?.button_reply?.id ||
          message.interactive?.button_reply?.title ||
          message.interactive?.list_reply?.id ||
          message.interactive?.list_reply?.title ||
          "";
      } else if (message.type === "button") {
        messageText = message.button?.payload || message.button?.text || "";
      }

      if (senderPhone && messageText) {
        console.log(`[WhatsApp Webhook] Processing message from ${senderPhone}: "${messageText}"`);
        await handleInboundWhatsAppMessage({
          senderPhone,
          messageText,
        });
      }
    }

    if (body.from && body.body) {
      await handleInboundWhatsAppMessage({
        senderPhone: body.from,
        messageText: body.body,
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[WhatsApp Webhook] Error processing webhook:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
