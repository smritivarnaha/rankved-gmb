import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const locations = await prisma.location.findMany({
    select: {
      id: true,
      name: true,
      logoUrl: true
    }
  });

  console.log("Total locations:", locations.length);
  locations.forEach(loc => {
    console.log(`- ${loc.name}: ${loc.logoUrl ? "HAS LOGO" : "MISSING LOGO"}`);
    if (loc.logoUrl) {
        console.log(`  URL: ${loc.logoUrl.substring(0, 50)}...`);
    }
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
