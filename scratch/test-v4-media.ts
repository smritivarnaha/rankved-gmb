import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) return;
  const account = await prisma.account.findFirst({ where: { userId: user.id } });
  if (!account) return;

  const accessToken = account.access_token;
  const accountName = "accounts/103802222035622991626";
  
  console.log(`Listing locations via GBP v4 for ${accountName}...`);
  const res = await fetch(`https://mybusiness.googleapis.com/v4/${accountName}/locations`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  console.log(`HTTP: ${res.status}`);
  if (res.ok) {
    const data = await res.json() as any;
    const locations = data.locations || [];
    console.log(`Found ${locations.length} locations`);
    for (const loc of locations) {
      console.log(`\nLocation: ${loc.locationName} (${loc.name})`);
      // loc.name is "accounts/XXX/locations/YYY"
      
      // Try to fetch media for this location
      const mediaRes = await fetch(`https://mybusiness.googleapis.com/v4/${loc.name}/media`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json() as any;
        const items = mediaData.mediaItems || [];
        console.log(`  Media items: ${items.length}`);
        for (const item of items) {
          const cat = (item.locationAssociation?.category || item.category || "UNKNOWN").toUpperCase();
          console.log(`    [${cat}] ${item.googleUrl || item.thumbnailUrl}`);
        }
      } else {
        console.log(`  Media Error: ${mediaRes.status}`);
      }
    }
  } else {
    console.log(`Error: ${await res.text()}`);
  }
}

main().finally(() => prisma.$disconnect());
