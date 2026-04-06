import { PrismaClient } from "@prisma/client";
import { GBPApiService } from "./gbp-api";

const prisma = new PrismaClient();

export class LocationService {
  /**
   * Syncs Google Business Profile locations for a given client and authenticated user.
   */
  static async syncLocations(userId: string, clientId: string) {
    // 1. Fetch user to verify ownership and get account token
    const client = await prisma.client.findUnique({
      where: { id: clientId, userId },
    });

    if (!client) throw new Error("Client not found or unauthorized");

    // 2. Fetch the Google OAuth tokens from the user's connected account
    const account = await prisma.account.findFirst({
      where: { userId, provider: "google" },
    });

    if (!account || !account.access_token) {
      throw new Error("No Google account linked or missing authorization token");
    }

    // At this stage, token would be decrypted in a real app, since we store them encrypted.
    // For this example, we'll assume we have a decrypt utility to use.
    const { decryptToken } = await import("@/lib/encryption");
    const accessToken = decryptToken(account.access_token);

    if (!accessToken) throw new Error("Failed to decrypt access token");

    // 3. Init GBP API Service
    const gbpService = new GBPApiService(accessToken);

    const syncedLocations = [];

    // 4. Fetch the primary accounts associated with the user
    // A single Google user might manage multiple "Accounts" (Personal/Location Groups/Agency)
    const gbpAccounts = await gbpService.listAccounts();
    
    for (const gbpAccount of gbpAccounts) {
      const accountId = gbpAccount.name; // e.g. 'accounts/12345'
      
      // 5. Fetch locations inside each account
      const locationsData = await gbpService.listLocations(accountId);
      
      for (const loc of locationsData) {
        const locationId = loc.name.split("/").pop(); // loc.name looks like: accounts/123/locations/456
        
        let addressStr = "";
        if (loc.storefrontAddress) {
          const { addressLines, locality, administrativeArea, postalCode } = loc.storefrontAddress;
          addressStr = `${addressLines?.[0] || ""} ${locality || ""} ${administrativeArea || ""} ${postalCode || ""}`.trim();
        }

        let phoneStr = "";
        if (loc.phoneNumbers && loc.phoneNumbers.primaryPhone) {
          phoneStr = loc.phoneNumbers.primaryPhone;
        }
        
        // 6. Upsert the location into our DB mapped to the client
        const savedLocation = await prisma.location.upsert({
          where: {
            gbpAccountId_gbpLocationId: {
              gbpAccountId: accountId,
              gbpLocationId: locationId || "",
            },
          },
          update: {
            name: loc.title,
            address: addressStr || null,
            phone: phoneStr || null,
            cachedAt: new Date(),
          },
          create: {
            clientId: client.id,
            gbpAccountId: accountId,
            gbpLocationId: locationId || "",
            name: loc.title || "Unknown Location",
            address: addressStr || null,
            phone: phoneStr || null,
            cachedAt: new Date(),
          },
        });
        
        syncedLocations.push(savedLocation);
      }
    }

    return syncedLocations;
  }
}
