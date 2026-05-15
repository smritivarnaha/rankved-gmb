import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) return;
  const account = await prisma.account.findFirst({ where: { userId: user.id } });
  if (!account) return;

  const accessToken = account.access_token;
  
  console.log("Fetching Accounts...");
  const accRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const { accounts = [] } = await accRes.json() as any;
  
  for (const acc of accounts) {
    console.log(`\nAccount: ${acc.accountName} (${acc.name})`);
    
    // List locations via v1
    const locRes = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${acc.name}/locations?readMask=name,title,metadata,profile`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const { locations = [] } = await locRes.json() as any;
    
    for (const loc of locations) {
      console.log(`  Location: ${loc.title} (${loc.name})`);
      console.log(`    placeId: ${loc.metadata?.placeId}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
