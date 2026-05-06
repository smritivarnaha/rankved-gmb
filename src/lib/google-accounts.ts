import prisma from "./prisma";

export function getEmailFromIdToken(idToken: string | null): string | null {
  if (!idToken) return null;
  try {
    const payload = idToken.split(".")[1];
    const decoded = Buffer.from(payload, "base64").toString("utf-8");
    return JSON.parse(decoded).email || null;
  } catch (e) {
    return null;
  }
}

export async function getValidGoogleAccounts(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId, provider: "google" }
  });

  const validAccounts = [];

  for (const account of accounts) {
    // Check if token is expired (expires_at is in seconds)
    // Add a 5-minute buffer to be safe
    if (account.expires_at && (account.expires_at * 1000) < Date.now() + 5 * 60 * 1000) {
      if (!account.refresh_token) {
        console.warn(`[Google Auth] No refresh token for account ${account.providerAccountId}. Requires re-authentication.`);
        continue;
      }

      console.log(`[Google Auth] Refreshing token for account ${account.providerAccountId}...`);
      try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID || "",
            client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
            grant_type: "refresh_token",
            refresh_token: account.refresh_token,
          }),
        });

        const refreshed = await response.json();

        if (!response.ok) {
          console.error(`[Google Auth] Token refresh failed for ${account.providerAccountId}:`, refreshed);
          continue; // Skip this account if refresh fails
        }

        const updatedAccount = await prisma.account.update({
          where: { id: account.id },
          data: {
            access_token: refreshed.access_token,
            expires_at: Math.floor(Date.now() / 1000) + refreshed.expires_in,
            refresh_token: refreshed.refresh_token ?? account.refresh_token,
            id_token: refreshed.id_token ?? account.id_token, // Update id_token if provided
          }
        });
        
        validAccounts.push(updatedAccount);
      } catch (error) {
        console.error(`[Google Auth] Exception refreshing token for ${account.providerAccountId}:`, error);
      }
    } else {
      // Token is still valid
      validAccounts.push(account);
    }
  }

  return validAccounts;
}
