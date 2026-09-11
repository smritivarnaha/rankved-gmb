import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { seedSystemDefaultTemplates, submitTemplateToMeta } from "@/lib/whatsapp-template-service";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let templates = await prisma.whatsAppTemplate.findMany({
      orderBy: [{ chainOrder: "asc" }, { createdAt: "desc" }],
    });

    if (templates.length === 0) {
      await seedSystemDefaultTemplates();
      templates = await prisma.whatsAppTemplate.findMany({
        orderBy: [{ chainOrder: "asc" }, { createdAt: "desc" }],
      });
    }

    return NextResponse.json({ success: true, data: templates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, title, category, language, headerType, headerContent, bodyText, footerText, buttons, sampleParams, submitToMeta } = body;

    if (!name || !bodyText) {
      return NextResponse.json({ error: "Template name and body text are required." }, { status: 400 });
    }

    const cleanName = name.toLowerCase().replace(/[^a-z0-9_]/g, "_");

    let metaTemplateId = null;
    let metaStatus = "APPROVED";
    let metaError = null;

    if (submitToMeta) {
      const metaRes = await submitTemplateToMeta({
        name: cleanName,
        title: title || cleanName,
        category: category || "UTILITY",
        language: language || "en_US",
        headerType: headerType || "NONE",
        headerContent,
        bodyText,
        footerText,
        buttons: buttons || [],
        sampleParams: sampleParams || [],
      });

      if (metaRes.success) {
        metaTemplateId = metaRes.templateId;
        metaStatus = "PENDING";
      } else {
        metaError = metaRes.error;
      }
    }

    const saved = await prisma.whatsAppTemplate.upsert({
      where: { name: cleanName },
      create: {
        name: cleanName,
        title: title || cleanName,
        category: category || "UTILITY",
        language: language || "en_US",
        headerType: headerType || "NONE",
        headerContent,
        bodyText,
        footerText,
        buttonsJson: buttons ? JSON.stringify(buttons) : null,
        sampleParams: sampleParams ? JSON.stringify(sampleParams) : null,
        status: metaStatus,
        metaTemplateId,
        rejectionReason: metaError,
      },
      update: {
        title: title || cleanName,
        category: category || "UTILITY",
        language: language || "en_US",
        headerType: headerType || "NONE",
        headerContent,
        bodyText,
        footerText,
        buttonsJson: buttons ? JSON.stringify(buttons) : null,
        sampleParams: sampleParams ? JSON.stringify(sampleParams) : null,
        status: metaStatus,
        metaTemplateId: metaTemplateId || undefined,
        rejectionReason: metaError,
      },
    });

    return NextResponse.json({ success: true, data: saved, metaError });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await prisma.whatsAppTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
