/**
 * API Key authentication helper for /api/v1/* routes.
 * Keys are stored as SHA-256 hashes. Format: rvk_<random32hex>
 */

import { createHash, randomBytes } from "crypto";
import prisma from "@/lib/prisma";

/** Generate a new raw API key + its hash + display prefix */
export function generateApiKey() {
  const raw = `rvk_${randomBytes(24).toString("hex")}`;   // rvk_ + 48 hex chars
  const hash = sha256(raw);
  const prefix = raw.slice(0, 12);                         // "rvk_abc12345"
  return { raw, hash, prefix };
}

export function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export interface ApiKeyContext {
  userId: string;
  keyId:  string;
  scopes: string[];
}

/**
 * Validate an incoming API key from the Authorization header.
 * Returns the key context or null if invalid.
 */
export async function validateApiKey(request: Request): Promise<ApiKeyContext | null> {
  const auth = request.headers.get("authorization") || "";
  const raw  = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!raw || !raw.startsWith("rvk_")) return null;

  const hash = sha256(raw);

  const record = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    select: { id: true, userId: true, isActive: true, scopes: true, expiresAt: true },
  });

  if (!record || !record.isActive) return null;
  if (record.expiresAt && record.expiresAt < new Date()) return null;

  // Update usage asynchronously (fire-and-forget)
  prisma.apiKey.update({
    where: { id: record.id },
    data:  { lastUsedAt: new Date(), usageCount: { increment: 1 } },
  }).catch(() => {});

  return {
    userId: record.userId,
    keyId:  record.id,
    scopes: record.scopes.split(",").map(s => s.trim()),
  };
}

/** Check if a key has a required scope */
export function hasScope(ctx: ApiKeyContext, scope: string) {
  return ctx.scopes.includes(scope) || ctx.scopes.includes("*");
}
