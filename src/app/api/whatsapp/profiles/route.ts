import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const locations = await prisma.location.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        website: true,
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
        cachedSearchViews: true,
        cachedInteractions: true,
        cachedEngagements: true,
        _count: {
          select: {
            posts: { where: { status: "PUBLISHED" } },
            backedUpReviews: { where: { status: "ACTIVE" } },
            whatsappLogs: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: locations });
  } catch (error: any) {
    console.error("GET /api/whatsapp/profiles error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch profiles" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { locationId, ...data } = body;

    if (!locationId) {
      return NextResponse.json({ error: "locationId is required" }, { status: 400 });
    }

    const updated = await prisma.location.update({
      where: { id: locationId },
      data: {
        whatsappEnabled: data.whatsappEnabled !== undefined ? Boolean(data.whatsappEnabled) : undefined,
        whatsappRecipientPhone: data.whatsappRecipientPhone !== undefined ? data.whatsappRecipientPhone : undefined,
        whatsappRecipientName: data.whatsappRecipientName !== undefined ? data.whatsappRecipientName : undefined,
        whatsappReportingSchedule: data.whatsappReportingSchedule || undefined,
        whatsappCustomDays: data.whatsappCustomDays !== undefined ? data.whatsappCustomDays : undefined,
        whatsappReportTime: data.whatsappReportTime !== undefined ? data.whatsappReportTime : undefined,
        whatsappNotifyPost: data.whatsappNotifyPost !== undefined ? Boolean(data.whatsappNotifyPost) : undefined,
        whatsappNotifyReview: data.whatsappNotifyReview !== undefined ? Boolean(data.whatsappNotifyReview) : undefined,
        whatsappNotifyReply: data.whatsappNotifyReply !== undefined ? Boolean(data.whatsappNotifyReply) : undefined,
        whatsappNotifyPerformance: data.whatsappNotifyPerformance !== undefined ? Boolean(data.whatsappNotifyPerformance) : undefined,
        whatsappLanguage: data.whatsappLanguage || undefined,
        whatsappCustomInstructions: data.whatsappCustomInstructions !== undefined ? data.whatsappCustomInstructions : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/whatsapp/profiles error:", error);
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
