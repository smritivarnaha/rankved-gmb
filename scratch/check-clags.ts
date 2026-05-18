const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const locations = await prisma.location.findMany({
    where: { name: { contains: 'clags', mode: 'insensitive' } },
    include: {
      posts: {
        where: { status: 'FAILED' },
        orderBy: { updatedAt: 'desc' },
        take: 5
      }
    }
  });

  console.log("Locations found:", locations.length);
  for (const loc of locations) {
    console.log(`\nLocation: ${loc.name} (ID: ${loc.id})`);
    console.log(`Failed Posts: ${loc.posts.length}`);
    for (const post of loc.posts) {
      console.log(`- Post ID: ${post.id}`);
      console.log(`  Created: ${post.createdAt}`);
      console.log(`  Updated: ${post.updatedAt}`);
      console.log(`  Summary: ${post.summary.substring(0, 50)}...`);
      console.log(`  Error: ${post.errorMessage}`);
      console.log(`  Reason: ${post.failureReason}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
