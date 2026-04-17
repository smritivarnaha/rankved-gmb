import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@rankved.com";
  const password = "Admin@123";
  const hash = crypto.createHash("sha256").update(password).digest("hex");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin user already exists:", email);
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: "Admin",
      email,
      role: "ADMIN",
      image: `pwd:${hash}`,
    },
  });

  console.log("✅ Admin user created:", user.email);
  console.log("   Email:    ", email);
  console.log("   Password: ", password);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
