import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { seedSystemDefaultTemplates, PREBUILT_TEMPLATES, submitTemplateToMeta } from "@/lib/whatsapp-template-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const submitToMeta = Boolean(body.submitToMeta);

    await seedSystemDefaultTemplates();

    let metaSubmittedCount = 0;
    if (submitToMeta) {
      for (const tpl of PREBUILT_TEMPLATES) {
        try {
          const res = await submitTemplateToMeta(tpl);
          if (res.success) metaSubmittedCount++;
        } catch (e) {
          console.error("Meta submission error for " + tpl.name, e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Installed ${PREBUILT_TEMPLATES.length} pre-built AiSensy-grade templates! (${metaSubmittedCount} submitted to Meta WABA)`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
