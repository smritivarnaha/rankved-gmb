const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const profileId = "0238840f-b7c9-4500-b5fe-6e775e743859"; // Dr. Akanksha Gautam
  
  const location = await prisma.location.findUnique({
    where: { id: profileId },
    include: { client: true }
  });

  const clientUser = await prisma.user.findUnique({
    where: { id: location.client.userId },
    include: { accounts: true }
  });

  const account = clientUser.accounts.find(a => a.provider === "google");
  const accountName = `${location.gbpAccountId}/${location.gbpLocationId}`;
  
  const res = await fetch(`https://mybusiness.googleapis.com/v4/${accountName}/reviews`, {
    headers: { Authorization: `Bearer ${account.access_token}` }
  });

  const data = await res.json();
  const reviews = data.reviews || [];
  
  const found = reviews.filter(r => {
    const name = (r.reviewer?.displayName || "").toLowerCase();
    return name.includes("ajit") || name.includes("alka") || name.includes("dinesh");
  });
  
  console.log("Raw reviews matching Ajit, Alka, Dinesh from Google My Business API:");
  console.log(JSON.stringify(found, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
