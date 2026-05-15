import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const locs = await prisma.location.findMany({
    select: { id: true, name: true, logoUrl: true },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  console.log(`\n=== Logo URL Status (last 10 profiles) ===`);
  locs.forEach((l) => {
    if (!l.logoUrl) {
      console.log(`❌ ${l.name}: NULL`);
    } else if (l.logoUrl.startsWith("data:")) {
      console.log(`✅ ${l.name}: BASE64 (manual upload)`);
    } else {
      console.log(`🔗 ${l.name}: ${l.logoUrl.substring(0, 120)}`);
    }
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
