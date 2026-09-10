import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendTestWhatsAppAlert } from "@/lib/whatsapp-service";
import { sendScheduledWhatsAppReport } from "@/lib/whatsapp-reporter";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: locationId } = await params;
  const loc = await prisma.location.findUnique({
    where: { id: locationId },
    select: {
      id: true,
      name: true,
      whatsappEnabled: true,
      whatsappRecipientPhone: true,
      whatsappRecipientName: true,
      whatsappReportingSchedule: true,
      whatsappCustomDays: true,
      whatsappReportTime: true,
      whatsappLastReportSentAt: true,
      whatsappNotifyPost: true,
      whatsappNotifyReview: true,
      whatsappNotifyReply: true,
      whatsappNotifyPerformance: true,
      whatsappLanguage: true,
      whatsappCustomInstructions: true,
      whatsappLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!loc) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: loc });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: locationId } = await params;
  const body = await req.json();

  const updated = await prisma.location.update({
    where: { id: locationId },
    data: {
      whatsappEnabled: body.whatsappEnabled !== undefined ? Boolean(body.whatsappEnabled) : undefined,
      whatsappRecipientPhone: body.whatsappRecipientPhone !== undefined ? body.whatsappRecipientPhone : undefined,
      whatsappRecipientName: body.whatsappRecipientName !== undefined ? body.whatsappRecipientName : undefined,
      whatsappReportingSchedule: body.whatsappReportingSchedule || undefined,
      whatsappCustomDays: body.whatsappCustomDays !== undefined ? body.whatsappCustomDays : undefined,
      whatsappReportTime: body.whatsappReportTime !== undefined ? body.whatsappReportTime : undefined,
      whatsappNotifyPost: body.whatsappNotifyPost !== undefined ? Boolean(body.whatsappNotifyPost) : undefined,
      whatsappNotifyReview: body.whatsappNotifyReview !== undefined ? Boolean(body.whatsappNotifyReview) : undefined,
      whatsappNotifyReply: body.whatsappNotifyReply !== undefined ? Boolean(body.whatsappNotifyReply) : undefined,
      whatsappNotifyPerformance: body.whatsappNotifyPerformance !== undefined ? Boolean(body.whatsappNotifyPerformance) : undefined,
      whatsappLanguage: body.whatsappLanguage || undefined,
      whatsappCustomInstructions: body.whatsappCustomInstructions !== undefined ? body.whatsappCustomInstructions : undefined,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: locationId } = await params;
  const body = await req.json();
  const action = body.action;

  const loc = await prisma.location.findUnique({ where: { id: locationId } });
  if (!loc) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const phone = body.phone || loc.whatsappRecipientPhone;
  if (!phone) {
    return NextResponse.json({ error: "No recipient phone number specified." }, { status: 400 });
  }

  if (action === "test_alert") {
    const result = await sendTestWhatsAppAlert(locationId, phone);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "Failed to send test alert" }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: "Test alert dispatched successfully!" });
  }

  if (action === "send_report_now") {
    const result = await sendScheduledWhatsAppReport(locationId);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "Failed to send performance report" }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: "Live performance report dispatched to WhatsApp successfully!" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
