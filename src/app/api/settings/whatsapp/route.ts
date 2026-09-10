import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.globalSetting.findUnique({ where: { id: "settings" } });

  return NextResponse.json({
    success: true,
    data: {
      whatsappProvider: settings?.whatsappProvider || "META_CLOUD",
      whatsappPhoneNumberId: settings?.whatsappPhoneNumberId || "",
      whatsappAccessToken: settings?.whatsappAccessToken ? "••••••••" + settings.whatsappAccessToken.slice(-4) : "",
      hasToken: !!settings?.whatsappAccessToken,
      whatsappBusinessAccountId: settings?.whatsappBusinessAccountId || "",
      whatsappWebhookVerifyToken: settings?.whatsappWebhookVerifyToken || "rankved_wa_verify_token",
      whatsappGatewayUrl: settings?.whatsappGatewayUrl || "",
      whatsappAiModel: settings?.whatsappAiModel || "gpt-4o",
    },
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const updateData: any = {
    whatsappProvider: body.whatsappProvider || "META_CLOUD",
    whatsappPhoneNumberId: body.whatsappPhoneNumberId !== undefined ? body.whatsappPhoneNumberId.trim() : undefined,
    whatsappBusinessAccountId: body.whatsappBusinessAccountId !== undefined ? body.whatsappBusinessAccountId.trim() : undefined,
    whatsappWebhookVerifyToken: body.whatsappWebhookVerifyToken !== undefined ? body.whatsappWebhookVerifyToken.trim() : undefined,
    whatsappGatewayUrl: body.whatsappGatewayUrl !== undefined ? body.whatsappGatewayUrl.trim() : undefined,
    whatsappAiModel: body.whatsappAiModel || "gpt-4o",
  };

  if (body.whatsappAccessToken && !body.whatsappAccessToken.includes("••••")) {
    updateData.whatsappAccessToken = body.whatsappAccessToken.trim();
  }

  const updated = await prisma.globalSetting.upsert({
    where: { id: "settings" },
    update: updateData,
    create: {
      id: "settings",
      ...updateData,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
