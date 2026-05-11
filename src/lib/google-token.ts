import prisma from "./prisma";

/**
 * Retrieves the most appropriate Google access token to use for a given location.
 * This ensures that when an Agency User or Team Member publishes a post,
 * it uses the global Google account linked by the Agency Owner or Super Admin,
 * rather than failing because the logged-in user hasn't linked their personal Google account.
 */
export async function getGoogleAccessTokenForLocation(locationId: string): Promise<string | null> {
  // 1. Find the location to see its client and googleEmail
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { client: true }
  });
  
  if (!location) return null;

  // 2. Fetch all Google accounts to find the correct one
  const allGoogleAccounts = await prisma.account.findMany({
    where: { provider: "google" }
  });

  if (allGoogleAccounts.length === 0) {
    console.warn(`[Google Auth] No Google accounts found in database for location ${locationId}`);
    return null;
  }

  let targetAccount = null;

  // Strategy A: Match the location's `googleEmail` exactly
  if (location.googleEmail) {
    console.log(`[Google Auth] Strategy A: Checking for googleEmail ${location.googleEmail}`);
    for (const acc of allGoogleAccounts) {
      if (acc.id_token) {
        try {
          const payload = JSON.parse(Buffer.from(acc.id_token.split(".")[1], "base64").toString());
          if (payload.email === location.googleEmail) {
            console.log(`[Google Auth] Strategy A SUCCESS: Matched account ${acc.id}`);
            targetAccount = acc;
            break;
          }
        } catch {}
      }
    }
  }

  // Strategy B: Match based on gbpAccountId
  if (!targetAccount && location.gbpAccountId) {
    const accId = location.gbpAccountId.replace("accounts/", "");
    console.log(`[Google Auth] Strategy B: Checking for gbpAccountId ${accId}`);
    targetAccount = allGoogleAccounts.find(a => a.providerAccountId === accId) || null;
    if (targetAccount) console.log(`[Google Auth] Strategy B SUCCESS: Matched account ${targetAccount.id}`);
  }

  // Strategy C: Fallback to the client owner's (Agency Owner's) Google account
  if (!targetAccount && location.client?.userId) {
    console.log(`[Google Auth] Strategy C: Checking for client owner userId ${location.client.userId}`);
    targetAccount = allGoogleAccounts.find(a => a.userId === location.client.userId) || null;
    if (targetAccount) console.log(`[Google Auth] Strategy C SUCCESS: Matched account ${targetAccount.id}`);
  }

  // Strategy D: Fallback to any Super Admin's Google account
  if (!targetAccount) {
    console.log(`[Google Auth] Strategy D: Checking for Super Admins`);
    const superAdmins = await prisma.user.findMany({ where: { role: "SUPER_ADMIN" } });
    const superAdminIds = superAdmins.map(u => u.id);
    targetAccount = allGoogleAccounts.find(a => superAdminIds.includes(a.userId)) || null;
    if (targetAccount) console.log(`[Google Auth] Strategy D SUCCESS: Matched account ${targetAccount.id}`);
  }

  if (!targetAccount || !targetAccount.access_token) {
    console.warn(`[Google Auth] ALL STRATEGIES FAILED for location ${location.name} (${locationId}). Stats: Found ${allGoogleAccounts.length} total google accounts. Client UserID: ${location.client?.userId}`);
    return null;
  }

  // 3. Check if token is expired (or about to expire) and refresh if needed
  const tokenExpiry = targetAccount.expires_at ? targetAccount.expires_at * 1000 : 0;
  const isExpired = tokenExpiry > 0 && Date.now() > tokenExpiry - 60_000; // 1 min buffer

  if (isExpired && targetAccount.refresh_token) {
    try {
      const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          grant_type: "refresh_token",
          refresh_token: targetAccount.refresh_token,
        }),
      });
      const refreshData = await refreshRes.json();
      
      if (refreshRes.ok && refreshData.access_token) {
        const newExpiresAt = Math.floor((Date.now() + refreshData.expires_in * 1000) / 1000);
        // Persist refreshed token back to DB
        await prisma.account.update({
          where: { id: targetAccount.id },
          data: {
            access_token: refreshData.access_token,
            expires_at: newExpiresAt,
            ...(refreshData.refresh_token ? { refresh_token: refreshData.refresh_token } : {}),
          },
        });
        return refreshData.access_token;
      } else {
        console.error("Token refresh failed during background publish:", refreshData);
      }
    } catch (err) {
      console.error("Network error while refreshing token:", err);
    }
  }

  return targetAccount.access_token;
}
