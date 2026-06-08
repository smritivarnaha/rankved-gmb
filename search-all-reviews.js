const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const locations = await prisma.location.findMany({
    include: { client: true }
  });

  console.log(`Searching reviews across ${locations.length} locations...`);

  for (const location of locations) {
    const clientUser = await prisma.user.findUnique({
      where: { id: location.client.userId },
      include: { accounts: true }
    });

    if (!clientUser) continue;
    const account = clientUser.accounts.find(a => a.provider === "google");
    if (!account || !account.access_token) continue;

    const accountName = `${location.gbpAccountId}/${location.gbpLocationId}`;
    
    try {
      const res = await fetch(`https://mybusiness.googleapis.com/v4/${accountName}/reviews`, {
        headers: { Authorization: `Bearer ${account.access_token}` }
      });
      if (!res.ok) continue;

      const data = await res.json();
      const reviews = data.reviews || [];

      const found = reviews.filter(r => {
        const name = (r.reviewer?.displayName || "").toLowerCase();
        return name.includes("ajit") || name.includes("alka") || name.includes("dinesh");
      });

      if (found.length > 0) {
        console.log(`\n✅ Found matches in location: "${location.name}" (ID: ${location.id})`);
        found.forEach(r => {
          console.log(`- Reviewer: ${r.reviewer?.displayName}, Date: ${r.createTime}, Stars: ${r.starRating}, Comment: "${r.comment || 'No comment'}"`);
        });
      }
    } catch (e) {
      // ignore
    }
  }
  console.log("\nSearch complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
