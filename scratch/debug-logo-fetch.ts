/**
 * Self-contained logo fetch diagnostic.
 * Run: npx ts-node --skip-project scratch/debug-logo-fetch.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    orderBy: { expires_at: "desc" },
  });
  if (!account) return null;

  // Refresh if expired
  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    console.log("Token expired, refreshing...");
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: account.refresh_token || "",
      }),
    });
    const refreshed = await res.json() as any;
    if (!res.ok) { console.error("Refresh failed:", refreshed); return null; }
    return refreshed.access_token;
  }
  return account.access_token;
}

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) { console.error("No user found"); return; }
  console.log(`Testing with user: ${user.email} (${user.id})`);

  const accessToken = await getToken(user.id);
  if (!accessToken) { console.error("❌ No valid access token"); return; }
  console.log(`✅ Access token obtained`);

  // Pick the first location from DB
  const gbpAccountId = "accounts/103802222035622991626";
  const gbpLocationId = "locations/12205397657247840250";
  console.log(`\nTesting: "Dr Anurag Lamba Neuro Clinic"`);
  console.log(`  gbpLocationId: ${gbpLocationId}`);
  console.log(`  gbpAccountId:  ${gbpAccountId}`);

  // --- Fetch placeId live ---
  console.log(`\n[STEP 1] Fetching location metadata to get placeId...`);
  const locRes = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${gbpLocationId}?readMask=name,title,metadata`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  console.log(`  HTTP: ${locRes.status}`);

  let placeId: string | undefined;
  if (locRes.ok) {
    const d = await locRes.json() as any;
    placeId = d.metadata?.placeId;
    console.log(`  placeId: ${placeId || "❌ NOT FOUND"}`);
  } else {
    const t = await locRes.text();
    console.log(`  Error: ${t.substring(0, 200)}`);
  }

  // --- Strategy 1: Places API (New) ---
  if (placeId) {
    console.log(`\n[STRATEGY 1] Places API (New) for placeId=${placeId}`);
    const r = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: { Authorization: `Bearer ${accessToken}`, "X-Goog-FieldMask": "photos" },
    });
    console.log(`  HTTP: ${r.status}`);
    if (r.ok) {
      const d = await r.json() as any;
      console.log(`  Photos found: ${d.photos?.length || 0}`);
      if (d.photos?.[0]) console.log(`  ✅ First: ${d.photos[0].name}`);
    } else {
      console.log(`  Error: ${(await r.text()).substring(0, 250)}`);
    }
  }

  // --- Strategy 2: GBP Media API v4 ---
  console.log(`\n[STRATEGY 2] GBP Media API v4`);
  // Try both path patterns
  for (const v4Name of [`${gbpAccountId}/${gbpLocationId}`, gbpLocationId]) {
    const mediaUrl = `https://mybusiness.googleapis.com/v4/${v4Name}/media`;
    console.log(`  Trying: ${mediaUrl}`);
    const r = await fetch(mediaUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    console.log(`  HTTP: ${r.status}`);
    if (r.ok) {
      const d = await r.json() as any;
      const items = d.mediaItems || [];
      console.log(`  Media items: ${items.length}`);
      items.forEach((m: any) => {
        const cat = (m.locationAssociation?.category || m.category || "UNKNOWN").toUpperCase();
        const url = (m.googleUrl || m.thumbnailUrl || "").substring(0, 80);
        console.log(`  ✅  cat=${cat} | url=${url}`);
      });
      break;
    } else {
      const t = await r.text();
      console.log(`  Error: ${t.substring(0, 300)}`);
    }
  }

  // --- Strategy 3: Classic Places API ---
  const mapsKey = (process.env.GOOGLE_MAPS_API_KEY || "").replace(/["\s\\]/g, "");
  if (placeId && mapsKey) {
    console.log(`\n[STRATEGY 3] Classic Places API`);
    const r = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${mapsKey}`);
    console.log(`  HTTP: ${r.status}`);
    const d = await r.json() as any;
    console.log(`  API Status: ${d.status}`);
    const photos = d.result?.photos || [];
    console.log(`  Photos found: ${photos.length}`);
    if (photos[0]) {
      const ref = photos[0].photo_reference;
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${ref}&key=${mapsKey}`;
      console.log(`  ✅ Photo URL: ${photoUrl.substring(0, 120)}`);
    }
  } else {
    console.log(`\n[STRATEGY 3] Skipped — mapsKey=${!!mapsKey}, placeId=${!!placeId}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
