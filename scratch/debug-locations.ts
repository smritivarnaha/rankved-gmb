
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const locations = await prisma.location.findMany({
    select: {
      id: true,
      name: true,
      logoUrl: true,
      gbpAccountId: true,
      gbpLocationId: true,
    }
  });
  console.log(JSON.stringify(locations, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
