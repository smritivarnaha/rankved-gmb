import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).user.id;

  try {
    // 1. Delete Google Account Tokens
    await prisma.account.deleteMany({
      where: { userId, provider: "google" }
    });

    // 2. Delete all Clients (this will cascade delete all Locations/Profiles)
    await prisma.client.deleteMany({
      where: { userId }
    });

    return NextResponse.json({ success: true, message: "Google account disconnected and all profile data wiped." });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to disconnect: " + err.message }, { status: 500 });
  }
}
