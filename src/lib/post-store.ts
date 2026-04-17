/**
 * post-store.ts
 *
 * Replaced from file-system JSON to Prisma DB to support
 * read-only serverless environments (Vercel, etc.)
 */

import prisma from "./prisma";

export interface PostData {
  id: string;
  profileId: string;      // maps to locationId in Prisma
  profileName: string;
  clientName: string;
  summary: string;
  topicType: string;
  ctaType: string;
  ctaUrl: string;
  finalUrl: string;
  imageUrl: string | null;
  geoLat: string;
  geoLng: string;
  eventTitle: string;
  eventStart: string;
  eventEnd: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED";
  scheduledAt: string | null;
  publishedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

function mapPost(p: any): PostData {
  return {
    id: p.id,
    profileId: p.locationId,
    profileName: p.location?.name || "",
    clientName: p.location?.client?.name || "",
    summary: p.summary,
    topicType: p.topicType || "STANDARD",
    ctaType: p.ctaType || "",
    ctaUrl: p.ctaUrl || "",
    finalUrl: p.ctaUrl || "",
    imageUrl: p.mediaUrl || null,
    geoLat: "",
    geoLng: "",
    eventTitle: p.eventTitle || "",
    eventStart: p.eventStartDate?.toISOString() || "",
    eventEnd: p.eventEndDate?.toISOString() || "",
    status: p.status as PostData["status"],
    scheduledAt: p.scheduledAt?.toISOString() || null,
    publishedAt: p.publishedAt?.toISOString() || null,
    createdBy: p.user?.email || "",
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function getAllPosts(): Promise<PostData[]> {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { location: { include: { client: true } }, user: true },
  });
  return posts.map(mapPost);
}

export async function getPostById(id: string): Promise<PostData | undefined> {
  const post = await prisma.post.findUnique({
    where: { id },
    include: { location: { include: { client: true } }, user: true },
  });
  return post ? mapPost(post) : undefined;
}

export async function getPostsByProfile(profileId: string): Promise<PostData[]> {
  const posts = await prisma.post.findMany({
    where: { locationId: profileId },
    orderBy: { createdAt: "desc" },
    include: { location: { include: { client: true } }, user: true },
  });
  return posts.map(mapPost);
}

export async function createPost(
  data: Omit<PostData, "id" | "createdAt" | "updatedAt" | "publishedAt">,
  userId: string
): Promise<PostData> {
  const post = await prisma.post.create({
    data: {
      summary: data.summary,
      topicType: data.topicType || "STANDARD",
      ctaType: data.ctaType || null,
      ctaUrl: data.ctaUrl || null,
      mediaUrl: data.imageUrl || null,
      status: data.status || "DRAFT",
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      eventTitle: data.eventTitle || null,
      eventStartDate: data.eventStart ? new Date(data.eventStart) : null,
      eventEndDate: data.eventEnd ? new Date(data.eventEnd) : null,
      locationId: data.profileId,
      userId,
    },
    include: { location: { include: { client: true } }, user: true },
  });
  return mapPost(post);
}

export async function updatePost(id: string, data: Partial<PostData>): Promise<PostData | null> {
  try {
    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.topicType !== undefined && { topicType: data.topicType }),
        ...(data.ctaType !== undefined && { ctaType: data.ctaType || null }),
        ...(data.ctaUrl !== undefined && { ctaUrl: data.ctaUrl || null }),
        ...(data.imageUrl !== undefined && { mediaUrl: data.imageUrl || null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.scheduledAt !== undefined && { scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null }),
        ...(data.publishedAt !== undefined && { publishedAt: data.publishedAt ? new Date(data.publishedAt) : null }),
        ...(data.eventTitle !== undefined && { eventTitle: data.eventTitle || null }),
        ...(data.eventStart !== undefined && { eventStartDate: data.eventStart ? new Date(data.eventStart) : null }),
        ...(data.eventEnd !== undefined && { eventEndDate: data.eventEnd ? new Date(data.eventEnd) : null }),
      },
      include: { location: { include: { client: true } }, user: true },
    });
    return mapPost(post);
  } catch {
    return null;
  }
}

export async function deletePost(id: string): Promise<boolean> {
  try {
    await prisma.post.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
