import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) return;
  const account = await prisma.account.findFirst({ where: { userId: user.id } });
  if (!account) return;

  const accessToken = account.access_token;
  
  console.log("Listing Accounts via GBP v4...");
  const res = await fetch("https://mybusiness.googleapis.com/v4/accounts", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  console.log(`HTTP: ${res.status}`);
  if (res.ok) {
    const data = await res.json() as any;
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(`Error: ${await res.text()}`);
  }
}

main().finally(() => prisma.$disconnect());
