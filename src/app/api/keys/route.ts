/**
 * /api/keys — API key management (CRUD for the logged-in user)
 *
 * GET    /api/keys        → list keys (hashes hidden, prefix shown)
 * POST   /api/keys        → create new key (raw key returned ONCE)
 * DELETE /api/keys?id=X   → revoke a key
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateApiKey, sha256 } from "@/lib/api-auth";

async function getUser(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = (session as any)?.user;
  if (!user?.id && !user?.email) return null;
  const dbUser = await prisma.user.findFirst({
    where: user.id ? { id: user.id } : { email: user.email },
    select: { id: true },
  });
  return dbUser;
}

/* ── GET — list all keys for the current user ── */
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId: user.id },
    select: {
      id: true, label: true, keyPrefix: true, scopes: true,
      isActive: true, lastUsedAt: true, usageCount: true,
      expiresAt: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: keys });
}

/* ── POST — create a new API key ── */
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { body = {}; }

  const label  = (body.label  || "Untitled Key").slice(0, 64);
  const scopes = (body.scopes || "posts:write,profiles:read").slice(0, 256);

  const { raw, hash, prefix } = generateApiKey();

  const record = await prisma.apiKey.create({
    data: {
      label,
      keyHash:  hash,
      keyPrefix: prefix,
      scopes,
      userId: user.id,
    },
    select: {
      id: true, label: true, keyPrefix: true,
      scopes: true, isActive: true, createdAt: true,
    },
  });

  // Return raw key ONCE — never stored, never returned again
  return NextResponse.json({
    ...record,
    key: raw,   // ← caller must store this immediately
    warning: "Store this key securely. It will NOT be shown again.",
  }, { status: 201 });
}

/* ── DELETE — revoke a key ── */
export async function DELETE(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Key id is required." }, { status: 400 });

  // Ensure the key belongs to this user
  const key = await prisma.apiKey.findFirst({ where: { id, userId: user.id } });
  if (!key) return NextResponse.json({ error: "Key not found." }, { status: 404 });

  await prisma.apiKey.update({ where: { id }, data: { isActive: false } });

  return NextResponse.json({ success: true, message: "API key revoked." });
}
