import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const location = await prisma.location.findFirst({ where: { name: { contains: "Sonam" } } });
  if (!location) { console.log("Location not found"); return; }

  const accounts = await prisma.account.findMany({ where: { provider: "google" } });
  const superAdmins = await prisma.user.findMany({ where: { role: "SUPER_ADMIN" } });
  
  let token = accounts.find(a => superAdmins.map(u => u.id).includes(a.userId))?.access_token;
  
  // Also try sarthak account directly
  for (const acc of accounts) {
    if (acc.id_token) {
      try {
        const payload = JSON.parse(Buffer.from(acc.id_token.split(".")[1], "base64").toString());
        if (payload.email === location.googleEmail) { token = acc.access_token || token; break; }
      } catch {}
    }
  }

  if (!token) { console.log("No token"); return; }

  const locationId = location.gbpLocationId?.replace("locations/", "");
  const accountId = location.gbpAccountId?.replace("accounts/", "");

  console.log("Testing multiple API endpoints...\n");

  const endpoints = [
    // v4 - mybusiness (deprecated, what we currently use)
    { name: "v4 mybusiness (current)", url: `https://mybusiness.googleapis.com/v4/locations/${locationId}/localPosts?pageSize=5` },
    // v1 - mybusinesspostings (new correct API)
    { name: "v1 mybusinesspostings", url: `https://mybusinesspostings.googleapis.com/v1/locations/${locationId}/localPosts?pageSize=5` },
    // businessprofileperformance
    { name: "v1 with account", url: `https://mybusinesspostings.googleapis.com/v1/accounts/${accountId}/locations/${locationId}/localPosts?pageSize=5` },
    // Content API via mybusiness v4 with account path
    { name: "v4 with account path", url: `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/localPosts?pageSize=5` },
  ];

  for (const ep of endpoints) {
    try {
      const r = await fetch(ep.url, { headers: { Authorization: `Bearer ${token}` } });
      const text = await r.text();
      const isHtml = text.trim().startsWith("<");
      console.log(`[${ep.name}]`);
      console.log(`  Status: ${r.status}`);
      console.log(`  HTML response: ${isHtml}`);
      if (!isHtml) console.log(`  Body: ${text.substring(0, 300)}`);
      console.log();
    } catch (e: any) {
      console.log(`[${ep.name}] Error: ${e.message}\n`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
