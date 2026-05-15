import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const locations = await prisma.location.findMany({
    take: 5
  });

  locations.forEach(loc => {
    console.log(`Name in DB: ${loc.name}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
