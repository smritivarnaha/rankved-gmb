import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "praveen261119@gmail.com";
  console.log(`Manually creating Super Admin user: ${email}`);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { 
      isApproved: true,
      role: "SUPER_ADMIN",
      username: "praveen"
    },
    create: { 
      name: "Praveen",
      username: "praveen",
      email: email,
      role: "SUPER_ADMIN",
      isApproved: true
    }
  });
  
  console.log("Success! User created/updated:", user.email, user.role, user.isApproved);
}

main()
  .catch((e) => {
    console.error("Error updating user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
