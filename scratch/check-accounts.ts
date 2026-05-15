import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.account.findMany({
    where: { provider: "google" }
  });

  console.log(`Found ${accounts.length} Google accounts.`);
  
  for (const acc of accounts) {
    if (acc.id_token) {
      try {
        const payload = JSON.parse(Buffer.from(acc.id_token.split(".")[1], "base64").toString());
        console.log(`- Account ID: ${acc.id}, Email: ${payload.email}, Expired: ${acc.expires_at ? new Date(acc.expires_at * 1000).toLocaleString() : 'Unknown'}`);
      } catch {
        console.log(`- Account ID: ${acc.id}, Email: (parsing failed)`);
      }
    } else {
      console.log(`- Account ID: ${acc.id}, Email: (no id_token)`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
