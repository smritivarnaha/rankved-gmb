import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    where: {
      location: {
        name: { contains: "Ishant" }
      },
    },
    include: {
      location: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 20
  });

  console.log("ISHANT_POST_HISTORY");
  console.log(JSON.stringify(posts.map(p => ({
    id: p.id,
    summary: p.summary.substring(0, 50),
    status: p.status,
    scheduledAt: p.scheduledAt,
    publishedAt: p.publishedAt,
    updatedAt: p.updatedAt,
    gbpPostName: p.gbpPostName,
    failureReason: p.failureReason
  })), null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
