import { PrismaClient } from '@prisma/client';
import { publishToGBP } from '../src/lib/gbp-publisher';
import { getGoogleAccessTokenForLocation } from '../src/lib/google-token';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  // Find all posts that are scheduled and due
  const duePosts = await prisma.post.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
    },
    include: {
      location: { include: { client: true } },
      user: true,
    },
  });

  if (duePosts.length === 0) {
    console.log("No due posts found.");
    return;
  }

  console.log(`Found ${duePosts.length} due posts to publish manually.`);

  for (const dbPost of duePosts) {
    try {
      await prisma.post.update({
        where: { id: dbPost.id, status: "SCHEDULED" },
        data: { status: "PUBLISHING" },
      });
    } catch (e) {
      console.log(`Skipping post ${dbPost.id} - already being processed.`);
      continue;
    }

    const accessToken = await getGoogleAccessTokenForLocation(dbPost.locationId);

    if (!accessToken) {
      console.log(`No access token for location ${dbPost.locationId}. Marking as FAILED.`);
      await prisma.post.update({
        where: { id: dbPost.id },
        data: {
          status: "FAILED",
          failureReason: "User's Google access token not found or expired.",
        },
      });
      continue;
    }

    const post = {
      id: dbPost.id,
      profileId: dbPost.locationId,
      profileName: dbPost.location?.name || "",
      clientName: dbPost.location?.client?.name || "",
      summary: dbPost.summary,
      topicType: dbPost.topicType || "STANDARD",
      ctaType: dbPost.ctaType || "",
      ctaUrl: dbPost.ctaUrl || "",
      finalUrl: dbPost.ctaUrl || "",
      imageUrl: dbPost.mediaUrl || null,
      geoLat: "",
      geoLng: "",
      eventTitle: dbPost.eventTitle || "",
      eventStart: dbPost.eventStartDate?.toISOString() || "",
      eventEnd: dbPost.eventEndDate?.toISOString() || "",
      status: "SCHEDULED" as const,
      scheduledAt: dbPost.scheduledAt?.toISOString() || null,
      publishedAt: null,
      createdBy: dbPost.user?.email || "",
      createdAt: dbPost.createdAt.toISOString(),
      updatedAt: dbPost.updatedAt.toISOString(),
    };

    console.log(`Publishing post ${dbPost.id}...`);
    const result = await publishToGBP({
      post,
      accessToken: accessToken,
      imageDataUri: dbPost.mediaUrl || null,
    });

    if (result.success) {
      console.log(`Success: ${dbPost.id}`);
      await prisma.post.update({
        where: { id: dbPost.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          gbpPostName: result.gbpPostName || null,
        },
      });
    } else {
      console.log(`Failed: ${dbPost.id}. Error: ${result.error}`);
      await prisma.post.update({
        where: { id: dbPost.id },
        data: {
          status: "FAILED",
          failureReason: result.error || "GBP publish failed",
        },
      });
    }

    await new Promise(r => setTimeout(r, 500));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
