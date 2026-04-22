import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 2,
  });
  console.log(JSON.stringify(posts.map(p => ({ id: p.id, status: p.status, failureReason: p.failureReason })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
