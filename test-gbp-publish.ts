import { publishToGBP } from "./src/lib/gbp-publisher";
import prisma from "./src/lib/prisma";

async function main() {
  console.log("Starting GBP Publish Test...");

  // 1. Find the user account we just got API whitelisted
  console.log("Looking up user access token...");
  const user = await prisma.user.findFirst({
    where: {
      accounts: {
        some: {
          provider: "google",
          access_token: { not: null },
        },
      },
    },
  });

  if (!user) {
    console.error("❌ No user found in the DB with a valid Google access token.");
    process.exit(1);
  }

  // 2. Fetch Google Account token
  const account = await prisma.account.findFirst({
    where: {
      userId: user.id,
      provider: "google",
    },
  });

  if (!account || !account.access_token) {
    console.error("❌ No Google access token found for the user. Do they need to log in again?");
    process.exit(1);
  }

  // 3. Find a location to publish to
  const location = await prisma.location.findFirst({
    where: { client: { userId: user.id } },
  });

  if (!location) {
    console.error("❌ No location found for this user. Please sync locations first in the dashboard.");
    process.exit(1);
  }

  console.log(`✅ Using Access Token. Publishing to Location: ${location.name} (GBP ID: ${location.gbpLocationId})`);

  // 4. Construct a test post
  const mockPost: any = {
    profileId: location.id, // using Prisma Location UUID as expected by publishToGBP
    summary: "🚀 This is an automated test post to verify Google Business Profile API connectivity!",
    topicType: "STANDARD",
  };

  // 5. Send it
  console.log("📤 Sending publish request to GBP...");
  const result = await publishToGBP({
    post: mockPost,
    accessToken: account.access_token,
  });

  if (result.success) {
    console.log("🎉 SUCCESS! Post Published successfully!");
    console.log("Here is the GBP Post Name reference: ", result.gbpPostName);
  } else {
    console.error("❌ FAILED to publish post:", result.error);
  }
}

main()
  .catch((e) => {
    console.error("Fatal Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
