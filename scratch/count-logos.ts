
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const locations = await prisma.location.findMany({ select: { logoUrl: true } });
  const withLogo = locations.filter(l => l.logoUrl).length;
  console.log('Profiles with logo:', withLogo);
  console.log('Total profiles:', locations.length);
}
main().finally(() => prisma.$disconnect());
