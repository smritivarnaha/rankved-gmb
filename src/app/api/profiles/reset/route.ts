import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).user.id;

  try {
    // Delete all Clients (this will cascade delete all Locations/Profiles)
    await prisma.client.deleteMany({
      where: { userId }
    });

    return NextResponse.json({ success: true, message: "Profile list reset. You can now fetch again." });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to reset: " + err.message }, { status: 500 });
  }
}
