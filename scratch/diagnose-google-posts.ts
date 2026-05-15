import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Test the exact API call for Sonam Beauty Care
  const location = await prisma.location.findFirst({
    where: { name: { contains: "Sonam" } }
  });

  if (!location) { console.log("Location not found"); return; }

  const resourceName = location.gbpLocationId?.includes("/") 
    ? location.gbpLocationId 
    : `locations/${location.gbpLocationId}`;

  // Find the token
  const accounts = await prisma.account.findMany({ where: { provider: "google" } });
  
  let targetAccount = null;
  for (const acc of accounts) {
    if (acc.id_token) {
      try {
        const payload = JSON.parse(Buffer.from(acc.id_token.split(".")[1], "base64").toString());
        if (payload.email === location.googleEmail) {
          targetAccount = acc;
          break;
        }
      } catch {}
    }
  }
  
  // Fallback: super admin
  if (!targetAccount) {
    const superAdmins = await prisma.user.findMany({ where: { role: "SUPER_ADMIN" } });
    targetAccount = accounts.find(a => superAdmins.map(u => u.id).includes(a.userId)) || null;
  }

  if (!targetAccount) {
    console.log("NO TOKEN FOUND");
    return;
  }

  const tokenExpiry = targetAccount.expires_at ? targetAccount.expires_at * 1000 : 0;
  const isExpired = tokenExpiry > 0 && Date.now() > tokenExpiry - 60_000;

  console.log("DIAGNOSIS:");
  console.log("Location:", location.name);
  console.log("GBP Location ID:", location.gbpLocationId);
  console.log("Resource name for API:", resourceName);
  console.log("Google Email on location:", location.googleEmail);
  console.log("Token account found:", targetAccount.id);
  console.log("Token expires at:", tokenExpiry ? new Date(tokenExpiry).toLocaleString() : "UNKNOWN");
  console.log("Is token expired?", isExpired);
  console.log("Has refresh_token?", !!targetAccount.refresh_token);
  console.log("Access token (first 30 chars):", targetAccount.access_token?.substring(0, 30));

  // Actually call the Google API now
  console.log("\nCalling Google API...");
  try {
    const r = await fetch(`https://mybusiness.googleapis.com/v4/${resourceName}/localPosts?pageSize=5`, {
      headers: { Authorization: `Bearer ${targetAccount.access_token}` }
    });
    const body = await r.json();
    console.log("Status:", r.status);
    console.log("Response:", JSON.stringify(body, null, 2).substring(0, 600));
  } catch (e) {
    console.log("Fetch error:", e);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
