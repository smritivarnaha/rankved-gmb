import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log("USERS IN DB:");
  console.table(users.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role, isApproved: u.isApproved })));
  process.exit(0);
}

check();
