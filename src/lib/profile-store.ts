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
  name: string;
  accountId: string;
  accountName: string;
  address: string;
  phone: string;
  website: string;
  googleName: string;
  logoUrl?: string;
  googleEmail?: string;
  fetchedAt: string;
  cachedSearchViews?: number;
  cachedInteractions?: number;
  cachedEngagements?: number;
  statsUpdatedAt?: string;
  postCounts?: {
    published: number;
    scheduled: number;
    drafts: number;
    pending: number;
    thisMonthPublished: number;
  };
  isHidden?: boolean;
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
    logoUrl: loc.logoUrl || undefined,
    googleEmail: loc.googleEmail || undefined,
    fetchedAt: loc.createdAt.toISOString(),
    cachedSearchViews: loc.cachedSearchViews || 0,
    cachedInteractions: loc.cachedInteractions || 0,
    cachedEngagements: loc.cachedEngagements || 0,
    statsUpdatedAt: loc.statsUpdatedAt ? loc.statsUpdatedAt.toISOString() : undefined,
    postCounts: loc.postCounts,
    isHidden: loc.isHidden || false,
  };
}

export async function getAllProfiles(userId: string, role: string, ownerId?: string): Promise<ProfileData[]> {
  // Use the ownerId if available to find the correct client context
  const targetUserId = ownerId || userId;
  
  const client = await prisma.client.findFirst({ where: { userId: targetUserId } });
  if (!client) return [];
  
  const locations = await prisma.location.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
  });

  if (locations.length === 0) return [];

  // Fetch post counts across all these locations in one query
  const locationIds = locations.map(l => l.id);
  const now = new Date();
  
  const [statusCounts, thisMonthCounts] = await Promise.all([
    prisma.post.groupBy({
      by: ['locationId', 'status'],
      where: { locationId: { in: locationIds } },
      _count: true,
    }),
    prisma.post.groupBy({
      by: ['locationId'],
      where: { 
        locationId: { in: locationIds }, 
        status: "PUBLISHED",
        publishedAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1), // start of current month
          lt: new Date(now.getFullYear(), now.getMonth() + 1, 1), // start of next month
        }
      },
      _count: true,
    })
  ]);

  const countsByLocation: Record<string, { published: number; scheduled: number; drafts: number; pending: number; thisMonthPublished: number }> = {};
  
  for (const id of locationIds) {
    countsByLocation[id] = { published: 0, scheduled: 0, drafts: 0, pending: 0, thisMonthPublished: 0 };
  }

  for (const row of statusCounts) {
    if (row.status === 'PUBLISHED') countsByLocation[row.locationId].published = row._count;
    else if (row.status === 'SCHEDULED') countsByLocation[row.locationId].scheduled = row._count;
    else if (row.status === 'DRAFT') countsByLocation[row.locationId].drafts = row._count;
    else if (row.status === 'PENDING_APPROVAL') countsByLocation[row.locationId].pending = row._count;
  }

  for (const row of thisMonthCounts) {
    countsByLocation[row.locationId].thisMonthPublished = row._count;
  }

  return locations.map(loc => locationToProfile({ ...loc, postCounts: countsByLocation[loc.id] }));
}

export async function getProfileById(id: string, userId: string, role: string): Promise<ProfileData | undefined> {
  const loc = await prisma.location.findUnique({ 
    where: { id },
    include: { client: true, assignedUsers: true }
  });
  if (!loc) return undefined;

  // Strict check: User must own the client or be assigned
  if (loc.client.userId === userId) return locationToProfile(loc);
  if (loc.assignedUsers.some(u => u.id === userId)) return locationToProfile(loc);

  return undefined;
}

export async function saveProfiles(profiles: ProfileData[], userId: string, ownerId?: string): Promise<void> {
  const targetUserId = ownerId || userId;
  const clientId = await ensureDefaultClient(targetUserId);

  for (const p of profiles) {
    // We update the clientId on EVERY sync to ensure the current user 
    // actually "owns" the view of this profile in their dashboard.
    await prisma.location.upsert({
      where: { gbpAccountId_gbpLocationId: { gbpAccountId: p.accountId, gbpLocationId: p.googleName } },
      update: {
        name: p.name,
        address: p.address || null,
        phone: p.phone || null,
        logoUrl: p.logoUrl || null,
        googleEmail: p.googleEmail || null,
        clientId: clientId,
      },
      create: {
        id: p.id,
        name: p.name,
        address: p.address || null,
        phone: p.phone || null,
        logoUrl: p.logoUrl || null,
        googleEmail: p.googleEmail || null,
        gbpAccountId: p.accountId,
        gbpLocationId: p.googleName || p.id,
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
