import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const location = await prisma.location.findFirst({
    where: {
      name: { contains: "Sonam" }
    },
    include: {
      client: true
    }
  });

  if (!location) {
    console.log("Location not found");
    return;
  }

  console.log("LOCATION_DETAILS");
  console.log(JSON.stringify({
    id: location.id,
    name: location.name,
    gbpLocationId: location.gbpLocationId,
    gbpAccountId: location.gbpAccountId,
    googleEmail: location.googleEmail,
    clientId: location.clientId
  }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
