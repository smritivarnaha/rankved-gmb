/**
 * GET /api/v1/profiles
 * Returns the list of GBP locations the API key owner manages.
 * n8n uses this to pick a profileId when creating posts.
 *
 * Auth: Bearer <rvk_...> API key
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, hasScope } from "@/lib/api-auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const ctx = await validateApiKey(req);
  if (!ctx) {
    return NextResponse.json({ error: "Invalid or missing API key." }, { status: 401 });
  }
  if (!hasScope(ctx, "profiles:read")) {
    return NextResponse.json({ error: "This key does not have profiles:read scope." }, { status: 403 });
  }

  const locations = await prisma.location.findMany({
    where: {
      client: { userId: ctx.userId },
    },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      gbpAccountId: true,
      gbpLocationId: true,
      client: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    data: locations.map(l => ({
      id:          l.id,
      name:        l.name,
      address:     l.address,
      phone:       l.phone,
      client:      l.client.name,
      gbpAccountId:  l.gbpAccountId,
      gbpLocationId: l.gbpLocationId,
    })),
    total: locations.length,
  });
}
