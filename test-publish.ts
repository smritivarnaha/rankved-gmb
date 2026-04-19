import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  // Get first user account (assumed to be main user)
  const account = await prisma.account.findFirst();
  if (!account || !account.access_token) {
    console.error("No account or access token found!");
    return;
  }

  // Get a location
  const loc = await prisma.location.findFirst();
  if (!loc) {
    console.error("No locations found!");
    return;
  }

  const accId = loc.gbpAccountId.replace("accounts/", "");
  const locId = loc.gbpLocationId.replace("locations/", "");
  const locationName = `accounts/${accId}/locations/${locId}`;

  // Make test request to see EXACT error
  console.log(`Testing publish to: ${locationName}`);
  const payload = {
    languageCode: "en",
    summary: "Test diagnostic post from terminal",
    topicType: "STANDARD"
  };

  try {
    const res = await fetch(`https://mybusiness.googleapis.com/v4/${locationName}/localPosts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("HTTP STATUS:", res.status);
    console.log("RESPONSE:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
