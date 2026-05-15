import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) return;
  const account = await prisma.account.findFirst({ where: { userId: user.id } });
  if (!account) return;

  const accessToken = account.access_token;
  const accountName = "accounts/103802222035622991626";
  const locationName = "locations/12205397657247840250";
  
  // Try the new v1 Media URL (speculative)
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/${locationName}/media`;
  console.log(`Trying ${url}...`);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  console.log(`HTTP: ${res.status}`);
  if (res.ok) {
     console.log(JSON.stringify(await res.json(), null, 2));
  } else {
     console.log(`Error: ${await res.text()}`);
  }
}

main().finally(() => prisma.$disconnect());
