import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) return;
  const account = await prisma.account.findFirst({ where: { userId: user.id } });
  if (!account) return;

  const accessToken = account.access_token;
  
  // Try to find the account ID by calling the v4 list accounts
  const urls = [
    "https://mybusiness.googleapis.com/v4/accounts",
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts"
  ];
  
  for (const url of urls) {
    console.log(`Trying ${url}...`);
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      console.log(`  HTTP: ${res.status}`);
      if (res.ok) {
        const data = await res.json() as any;
        const accounts = data.accounts || [];
        for (const acc of accounts) {
          console.log(`  Account: ${acc.name} (${acc.accountName})`);
          
          // Try to list locations for this account via v4
          const locUrl = `https://mybusiness.googleapis.com/v4/${acc.name}/locations`;
          console.log(`    Trying ${locUrl}...`);
          const locRes = await fetch(locUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
          console.log(`    HTTP: ${locRes.status}`);
          if (locRes.ok) {
             const locData = await locRes.json() as any;
             const locations = locData.locations || [];
             console.log(`    Found ${locations.length} locations`);
             for (const l of locations) {
               console.log(`      Location: ${l.locationName} (${l.name})`);
             }
          }
        }
      }
    } catch (e) {
      console.log(`  Error: ${e}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
