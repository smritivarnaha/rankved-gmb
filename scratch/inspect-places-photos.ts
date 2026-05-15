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
        "X-Goog-FieldMask": "photos.widthPx,photos.heightPx,photos.authorAttributions,photos.name,displayName" 
      },
    });
    
    if (res.ok) {
      const data = await res.json() as any;
      const businessName = (data.displayName?.text || "Dr Anurag Lamba Neuro Clinic").toLowerCase();
      const photos = data.photos || [];
      console.log(`Business Name: ${businessName}`);
      console.log(`Found ${photos.length} photos`);
      
      const bizPhotos = photos.filter((p: any) => 
        p.authorAttributions?.some((a: any) => {
          const author = (a.displayName || "").toLowerCase();
          return author.includes(businessName) || businessName.includes(author) || 
                 author.includes("business owner") || author.includes("owner");
        })
      );
      
      console.log(`Business Photos: ${bizPhotos.length}`);

      let bestPhoto = null;
      let minDiff = 1.0;
      const candidates = bizPhotos.length > 0 ? bizPhotos : photos;

      for (const p of candidates) {
        if (p.widthPx && p.heightPx) {
          const ratio = p.widthPx / p.heightPx;
          const diff = Math.abs(ratio - 1.0);
          console.log(`  Photo: ${p.name.split('/').pop()} | Size: ${p.widthPx}x${p.heightPx} | Diff: ${diff.toFixed(3)} | Biz: ${bizPhotos.includes(p)}`);
          if (diff < minDiff) {
            minDiff = diff;
            bestPhoto = p;
          }
        }
      }

      if (bestPhoto) {
        console.log(`\nWINNER: ${bestPhoto.name}`);
        console.log(`Final URL: https://places.googleapis.com/v1/${bestPhoto.name}/media?maxWidthPx=400&key=${mapsKey}`);
      }
    } else {
      console.log(`Error: ${await res.text()}`);
    }
  } catch (e) {
    console.log(`Fetch Error: ${e}`);
  }
}

main().finally(() => prisma.$disconnect());
