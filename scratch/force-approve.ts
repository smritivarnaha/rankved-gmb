import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "praveen261119@gmail.com";
  console.log(`Force-approving user: ${email}`);
  
  const user = await prisma.user.update({
    where: { email },
    data: { 
      isApproved: true,
      role: "SUPER_ADMIN" 
    }
  });
  
  console.log("Success! User updated:", user.email, user.role, user.isApproved);
}

main()
  .catch((e) => {
    console.error("Error updating user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
