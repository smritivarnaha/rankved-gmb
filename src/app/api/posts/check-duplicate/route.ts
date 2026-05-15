import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkDuplicateContent } from "@/lib/post-store";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { locationId, summary } = await req.json();
    if (!locationId || !summary) {
      return NextResponse.json({ error: "Missing locationId or summary" }, { status: 400 });
    }

    const duplicate = await checkDuplicateContent(locationId, summary);

    return NextResponse.json({ 
      isDuplicate: !!duplicate,
      duplicateId: duplicate?.id || null,
      publishedAt: duplicate?.publishedAt || null
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
