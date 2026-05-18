import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Start of today (May 17)
  const startOfDay = new Date('2026-05-17T00:00:00.000Z');
  // End of today
  const endOfDay = new Date('2026-05-17T23:59:59.999Z');

  const posts = await prisma.post.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      }
    },
    select: {
      id: true,
      status: true,
      scheduledAt: true,
      createdAt: true,
    }
  });

  console.log("Posts scheduled for May 17, 2026:");
  if (posts.length === 0) {
    console.log("None.");
  } else {
    console.log(JSON.stringify(posts, null, 2));
  }

  // Also let's check ALL scheduled posts just to see what the closest ones are
  const allScheduled = await prisma.post.findMany({
    where: { status: "SCHEDULED" },
    orderBy: { scheduledAt: 'asc' },
    take: 5,
    select: { id: true, scheduledAt: true }
  });
  console.log("\nThe next 5 scheduled posts in the database overall are:");
  console.log(JSON.stringify(allScheduled, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
