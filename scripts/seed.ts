import { seedAdminUser } from "../src/lib/user-store";

async function run() {
  await seedAdminUser();
  console.log("Done");
  process.exit(0);
}

run();
