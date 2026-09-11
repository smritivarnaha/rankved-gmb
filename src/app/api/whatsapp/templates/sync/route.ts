import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncTemplatesFromMeta } from "@/lib/whatsapp-template-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncTemplatesFromMeta();
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to sync with Meta" }, { status: 400 });
    }

    return NextResponse.json({ success: true, syncedCount: result.syncedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
