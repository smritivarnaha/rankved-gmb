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
  autoReplyEnabled?: boolean;
  autoReplyMode?: string;
  pendingReviewCount?: number;
  sitemapUrl?: string;
  sitemapUrls?: string[];
  sitemapUpdatedAt?: string;
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
    website: loc.website || "",
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
    autoReplyEnabled: Boolean(loc.autoReplyEnabled),
    autoReplyMode: loc.autoReplyMode || "TEMPLATES",
    pendingReviewCount: loc.pendingReviewCount || 0,
    sitemapUrl: loc.sitemapUrl || undefined,
    sitemapUrls: loc.sitemapUrls ? (loc.sitemapUrls as string[]) : undefined,
    sitemapUpdatedAt: loc.sitemapUpdatedAt ? loc.sitemapUpdatedAt.toISOString() : undefined,
  };
}

export async function getAllProfiles(userId: string, role: string, ownerId?: string): Promise<ProfileData[]> {
  // Use the ownerId if available to find the correct client context
  const targetUserId = ownerId || userId;
  
  const whereClause =
    role === "SUPER_ADMIN" && !ownerId
      ? { client: { userId: targetUserId } }
      : { client: { userId: targetUserId } };

  const locations = await prisma.location.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      gbpAccountId: true,
      gbpLocationId: true,
      address: true,
      phone: true,
      website: true,
      logoUrl: true,
      googleEmail: true,
      createdAt: true,
      cachedSearchViews: true,
      cachedInteractions: true,
      cachedEngagements: true,
      statsUpdatedAt: true,
      isHidden: true,
      autoReplyEnabled: true,
      autoReplyMode: true,
      sitemapUrl: true,
      sitemapUpdatedAt: true,
    },
  });

  if (locations.length === 0) return [];

  // Fetch post counts and pending review counts across all these locations in parallel
  const locationIds = locations.map(l => l.id);
  const now = new Date();
  
  const [statusCounts, thisMonthCounts, pendingReviewsByLoc] = await Promise.all([
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
    }),
    prisma.locationReview.groupBy({
      by: ['locationId'],
      where: {
        locationId: { in: locationIds },
        status: "ACTIVE",
        OR: [{ ownerReply: null }, { ownerReply: "" }],
      },
      _count: true,
    }).catch(() => [] as any[]),
  ]);

  const countsByLocation: Record<string, { published: number; scheduled: number; drafts: number; pending: number; thisMonthPublished: number }> = {};
  const pendingReviewMap: Record<string, number> = {};
  
  for (const id of locationIds) {
    countsByLocation[id] = { published: 0, scheduled: 0, drafts: 0, pending: 0, thisMonthPublished: 0 };
    pendingReviewMap[id] = 0;
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

  for (const row of pendingReviewsByLoc) {
    pendingReviewMap[row.locationId] = row._count;
  }

  return locations.map(loc => locationToProfile({
    ...loc,
    postCounts: countsByLocation[loc.id],
    pendingReviewCount: pendingReviewMap[loc.id] || 0,
  }));
}

export async function getProfileById(id: string, userId: string, role: string, ownerId?: string): Promise<ProfileData | undefined> {
  const now = new Date();
  const [loc, statusCounts, thisMonthCount] = await Promise.all([
    prisma.location.findUnique({ 
      where: { id },
      include: {
        client: { select: { userId: true } },
        assignedUsers: { select: { id: true } },
      }
    }),
    prisma.post.groupBy({
      by: ['status'],
      where: { locationId: id },
      _count: true,
    }),
    prisma.post.count({
      where: {
        locationId: id,
        status: "PUBLISHED",
        publishedAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
          lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        }
      }
    }),
  ]);
  if (!loc) return undefined;

  const targetUserId = ownerId || userId;
  const hasAccess =
    role === "SUPER_ADMIN" ||
    loc.client.userId === userId ||
    loc.client.userId === targetUserId ||
    loc.assignedUsers.some(u => u.id === userId);

  if (!hasAccess) return undefined;

  const postCounts = { published: 0, scheduled: 0, drafts: 0, pending: 0, thisMonthPublished: thisMonthCount };
  for (const row of statusCounts) {
    if (row.status === 'PUBLISHED') postCounts.published = row._count;
    else if (row.status === 'SCHEDULED') postCounts.scheduled = row._count;
    else if (row.status === 'DRAFT') postCounts.drafts = row._count;
    else if (row.status === 'PENDING_APPROVAL') postCounts.pending = row._count;
  }

  return locationToProfile({ ...loc, postCounts });
}

export async function saveProfiles(profiles: ProfileData[], userId: string, ownerId?: string): Promise<void> {
  if (profiles.length === 0) return;
  const targetUserId = ownerId || userId;
  const clientId = await ensureDefaultClient(targetUserId);

  // Pre-fetch existing locations in 1 query instead of N sequential findUnique queries
  const existingLocations = await prisma.location.findMany({
    where: {
      gbpLocationId: { in: profiles.map(p => p.googleName || p.id) },
    },
    select: {
      gbpAccountId: true,
      gbpLocationId: true,
      logoUrl: true,
    },
  });

  const existingLogoMap = new Map<string, string | null>();
  for (const ex of existingLocations) {
    existingLogoMap.set(`${ex.gbpAccountId}:${ex.gbpLocationId}`, ex.logoUrl);
  }

  // Execute upserts in parallel chunks of 10 to prevent PgBouncer pool saturation while running 10x faster
  const chunkSize = 10;
  for (let i = 0; i < profiles.length; i += chunkSize) {
    const chunk = profiles.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map((p) => {
        const gbpLocId = p.googleName || p.id;
        const existingLogo = existingLogoMap.get(`${p.accountId}:${gbpLocId}`);
        const isManualLogo = existingLogo?.startsWith("data:image/");

        return prisma.location.upsert({
          where: { gbpAccountId_gbpLocationId: { gbpAccountId: p.accountId, gbpLocationId: gbpLocId } },
          update: {
            name: p.name,
            address: p.address || null,
            phone: p.phone || null,
            website: p.website || null,
            logoUrl: isManualLogo ? existingLogo : (p.logoUrl || existingLogo || null),
            googleEmail: p.googleEmail || null,
            clientId: clientId,
          },
          create: {
            id: p.id,
            name: p.name,
            address: p.address || null,
            phone: p.phone || null,
            website: p.website || null,
            logoUrl: p.logoUrl || null,
            googleEmail: p.googleEmail || null,
            gbpAccountId: p.accountId,
            gbpLocationId: gbpLocId,
            clientId,
          },
        });
      })
    );
  }
}

export async function deleteProfile(id: string): Promise<boolean> {
  try {
    // 1. Clean up non-foreign-key snapshot and notification data
    await prisma.reviewSnapshot.deleteMany({ where: { locationId: id } }).catch(() => {});
    await prisma.notification.deleteMany({ where: { locationId: id } }).catch(() => {});
    
    // 2. Delete location (cascades to posts, reviews, replies, incidents, whatsapp logs, rank scans)
    await prisma.location.delete({ where: { id } });
    return true;
  } catch (err: any) {
    console.error(`[deleteProfile] Failed to delete profile ${id}:`, err);
    return false;
  }
}
