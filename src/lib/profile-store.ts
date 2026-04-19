/**
 * profile-store.ts
 *
 * Replaced from file-system JSON to Prisma DB to support
 * read-only serverless environments (Vercel, etc.)
 *
 * We store GBP locations as "Location" rows in the DB.
 * A synthetic Client record ("default") is used as the owner
 * so we don't need full client management for single-tenant use.
 */

import prisma from "./prisma";

export interface ProfileData {
  id: string;
  name: string;         // location name e.g. "Downtown Office"
  accountId: string;    // Google account ID
  accountName: string;  // e.g. "Sunrise Dental"
  address: string;
  phone: string;
  website: string;
  googleName: string;   // full Google resource name e.g. "locations/123"
  fetchedAt: string;
}

// Ensure a default Client row exists (for single-tenant use)
async function ensureDefaultClient(userId: string): Promise<string> {
  let client = await prisma.client.findFirst({ where: { userId } });
  if (!client) {
    client = await prisma.client.create({
      data: { name: "Default", userId },
    });
  }
  return client.id;
}

function locationToProfile(loc: any): ProfileData {
  return {
    id: loc.id,
    name: loc.name,
    accountId: loc.gbpAccountId,
    accountName: loc.gbpAccountId,
    address: loc.address || "",
    phone: loc.phone || "",
    website: "",
    googleName: loc.gbpLocationId,
    fetchedAt: loc.cachedAt?.toISOString() || loc.createdAt.toISOString(),
  };
}

export async function getAllProfiles(): Promise<ProfileData[]> {
  const locations = await prisma.location.findMany({
    orderBy: { createdAt: "desc" },
  });
  return locations.map(locationToProfile);
}

export async function getProfileById(id: string): Promise<ProfileData | undefined> {
  const loc = await prisma.location.findUnique({ where: { id } });
  return loc ? locationToProfile(loc) : undefined;
}

export async function saveProfiles(profiles: ProfileData[], userId: string): Promise<void> {
  const clientId = await ensureDefaultClient(userId);

  // Delete all existing locations for this client and re-insert fresh from Google
  await prisma.location.deleteMany({ where: { clientId } });

  for (const p of profiles) {
    await prisma.location.upsert({
      where: { gbpAccountId_gbpLocationId: { gbpAccountId: p.accountId, gbpLocationId: p.googleName } },
      update: {
        name: p.name,
        address: p.address || null,
        phone: p.phone || null,
        cachedAt: new Date(p.fetchedAt),
      },
      create: {
        id: p.id,
        name: p.name,
        address: p.address || null,
        phone: p.phone || null,
        gbpAccountId: p.accountId,
        gbpLocationId: p.googleName || p.id,
        cachedAt: new Date(p.fetchedAt),
        clientId,
      },
    });
  }
}

export async function deleteProfile(id: string): Promise<boolean> {
  try {
    await prisma.location.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
