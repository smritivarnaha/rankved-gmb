const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const profileId = "19e5b219-c14e-4f28-bb62-0e8fa315120e"; // Dr Nitika Mahajan
  
  const location = await prisma.location.findUnique({
    where: { id: profileId },
    include: { client: true }
  });

  if (!location) {
    console.log("Location not found");
    return;
  }

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
  
  console.log("Reviews for Dr Nitika Mahajan:");
  console.log(JSON.stringify(reviews, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
