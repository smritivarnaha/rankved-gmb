import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getEmailFromIdToken } from "@/lib/google-accounts";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).user.id;

  try {
    const accounts = await prisma.account.findMany({
      where: { userId, provider: "google" },
      select: {
        id: true,
        providerAccountId: true,
        id_token: true,
      }
    });

    // We don't want to send the raw tokens to the frontend
    const sanitizedAccounts = accounts.map(acc => {
      const email = getEmailFromIdToken(acc.id_token);
      return {
        id: acc.id,
        providerAccountId: acc.providerAccountId,
        email: email || "Unknown Google Account",
      };
    });

    return NextResponse.json({ data: sanitizedAccounts });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch connected accounts" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).user.id;

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("id");

  if (!accountId) {
    return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
  }

  try {
    // Delete only the specified Google Account
    await prisma.account.deleteMany({
      where: { 
        id: accountId,
        userId: userId, 
        provider: "google" 
      }
    });

    return NextResponse.json({ success: true, message: "Google account disconnected." });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to disconnect account: " + err.message }, { status: 500 });
  }
}
