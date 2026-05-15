import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) return;
  const account = await prisma.account.findFirst({ where: { userId: user.id } });
  if (!account) return;

  const mapsKey = (process.env.GOOGLE_MAPS_API_KEY || "").replace(/["\s\\]/g, "");
  const placeId = "ChIJm6qqqoWUDzkR2-niHsAQLeI"; // Anurag Lamba clinic
  
  console.log(`Fetching ALL photos from Places API (New) for ${placeId}...`);
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?key=${mapsKey}`, {
      headers: { 
        "X-Goog-FieldMask": "photos,displayName" 
      },
    });
    
    if (res.ok) {
      const data = await res.json() as any;
      const photos = data.photos || [];
      console.log(`Business Name: ${data.displayName?.text}`);
      console.log(`Found ${photos.length} photos`);
      
      for (const p of photos) {
        console.log(`\nPhoto: ${p.name}`);
        console.log(`  Size: ${p.widthPx}x${p.heightPx}`);
        console.log(`  Authors: ${p.authorAttributions?.map((a: any) => a.displayName).join(", ")}`);
      }
    } else {
      console.log(`Error: ${await res.text()}`);
    }
  } catch (e) {
    console.log(`Fetch Error: ${e}`);
  }
}

main().finally(() => prisma.$disconnect());
