/**
 * clean-db.ts
 *
 * Wipes all manual / stale data from Supabase:
 *  - All Location rows (will be re-synced from Google)
 *  - All Post rows
 *  - All Client rows (they are recreated automatically on next sync)
 *  - All credential-based (pwd:) users EXCEPT the main admin
 *
 * Run with:  npx ts-node --project tsconfig.json -e "require('./scripts/clean-db.ts')"
 * OR:        npx tsx scripts/clean-db.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning Supabase DB...\n");

  // 1. Delete all posts
  const deletedPosts = await prisma.post.deleteMany({});
  console.log(`✅ Deleted ${deletedPosts.count} posts`);

  // 2. Delete all locations
  const deletedLocations = await prisma.location.deleteMany({});
  console.log(`✅ Deleted ${deletedLocations.count} locations`);

  // 3. Delete all client rows (auto-recreated on next Google sync)
  const deletedClients = await prisma.client.deleteMany({});
  console.log(`✅ Deleted ${deletedClients.count} clients`);

  // 4. Delete all credential-based users EXCEPT the main admin
  const KEEP_EMAIL = "rankved.business@gmail.com";
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      image: { startsWith: "pwd:" },
      NOT: { email: KEEP_EMAIL },
    },
  });
  console.log(`✅ Deleted ${deletedUsers.count} stale credential users (kept ${KEEP_EMAIL})`);

  // 5. Delete all sessions / accounts for non-kept OAuth users (cleanup)
  // Sessions are auto-managed by NextAuth; we just log a reminder.
  console.log("\n✅ Done. All stale data removed.");
  console.log("   → Go to Settings and click 'Fetch profiles' to re-sync from Google.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
