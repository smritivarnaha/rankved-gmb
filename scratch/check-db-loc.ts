import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const loc = await prisma.location.findFirst({
    where: { name: { contains: "Anurag Lamba" } }
  });
  console.log(JSON.stringify(loc, null, 2));
}

main().finally(() => prisma.$disconnect());
