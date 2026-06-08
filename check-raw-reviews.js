const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const profileId = "19e5b219-c14e-4f28-bb62-0e8fa315120e";
  
  const location = await prisma.location.findUnique({
    where: { id: profileId },
    include: { client: true }
  });

  if (!location) {
    console.error("Location not found.");
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

  let allReviews = [];
  let nextPageToken = undefined;
  
  do {
    const url = new URL(`https://mybusiness.googleapis.com/v4/${accountName}/reviews`);
    if (nextPageToken) url.searchParams.set("pageToken", nextPageToken);
    
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${account.access_token}` }
    });

    const data = await res.json();
    const reviews = data.reviews || [];
    allReviews.push(...reviews);
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  console.log(`Fetched all reviews. Total: ${allReviews.length}`);
  
  // Search for reviews matching Ajit, Alka, or Dinesh
  const found = allReviews.filter(r => {
    const name = (r.reviewer?.displayName || "").toLowerCase();
    return name.includes("ajit") || name.includes("alka") || name.includes("dinesh");
  });
  
  console.log("Target Reviews JSON:");
  console.log(JSON.stringify(found, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
