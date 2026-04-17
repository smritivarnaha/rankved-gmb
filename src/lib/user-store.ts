/**
 * user-store.ts
 *
 * Replaced from file-system JSON to Prisma DB to support
 * read-only serverless environments (Vercel, etc.)
 *
 * NOTE: Google OAuth users are managed automatically by NextAuth via
 * the Prisma adapter. This store only handles credential-based users.
 */

import crypto from "crypto";
import prisma from "./prisma";

export type UserRole = "ADMIN" | "TEAM";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string; // hashed — stored in a separate field
  role: UserRole;
  isApproved: boolean;
  createdAt: string;
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Finds a user by email for credential login.
 * Checks the `emailVerified` field as a proxy for password storage.
 * Passwords are stored as a SHA256 hash in the `image` field (temporary hack
 * until a proper CredentialsUser table is added).
 *
 * NOTE: For Google OAuth users, NextAuth handles auth automatically.
 * This is only for email+password login.
 */
export async function findUserByEmail(email: string): Promise<AppUser | undefined> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user || !user.image?.startsWith("pwd:")) return undefined;
  return {
    id: user.id,
    name: user.name || "User",
    email: user.email || "",
    password: user.image.replace("pwd:", ""),
    role: (user.role as UserRole) || "TEAM",
    isApproved: user.isApproved,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function findUserById(id: string): Promise<AppUser | undefined> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || !user.image?.startsWith("pwd:")) return undefined;
  return {
    id: user.id,
    name: user.name || "User",
    email: user.email || "",
    password: user.image.replace("pwd:", ""),
    role: (user.role as UserRole) || "TEAM",
    isApproved: user.isApproved,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getAllUsers(): Promise<Omit<AppUser, "password">[]> {
  const users = await prisma.user.findMany({
    where: { image: { startsWith: "pwd:" } },
    orderBy: { createdAt: "desc" },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name || "User",
    email: u.email || "",
    role: (u.role as UserRole) || "TEAM",
    isApproved: u.isApproved,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<Omit<AppUser, "password">> {
  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) throw new Error("A user with this email already exists");

  const hashed = hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      role: data.role,
      image: `pwd:${hashed}`, // store password hash
    },
  });

  return {
    id: user.id,
    name: user.name || data.name,
    email: user.email || data.email,
    role: user.role as UserRole,
    isApproved: user.isApproved,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function deleteUser(id: string): Promise<boolean> {
  // Prevent deleting the last admin
  const allAdmins = await prisma.user.findMany({
    where: { role: "ADMIN", image: { startsWith: "pwd:" } },
  });
  const target = allAdmins.find((u) => u.id === id);
  if (target && allAdmins.length === 1) {
    throw new Error("Cannot delete the last admin user");
  }

  try {
    await prisma.user.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
