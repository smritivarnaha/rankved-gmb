const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Updating all locations to use 'DEFAULT' providers...");
  const result = await prisma.location.updateMany({
    data: {
      aiContentProvider: "DEFAULT",
      aiImageProvider: "DEFAULT"
    }
  });
  console.log(`Updated ${result.count} locations.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
