/**
 * user-store.ts
 * Handled via Prisma with the updated RBAC schema.
 */

import crypto from "crypto";
import prisma from "./prisma";

export type UserRole = "SUPER_ADMIN" | "AGENCY_OWNER" | "TEAM_MEMBER";

export interface AppUser {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  isApproved: boolean;
  canPublishNow: boolean;
  minScheduleDays: number;
  ownerId: string | null;
  createdAt: string;
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function mapToAppUser(user: any): AppUser {
  return {
    id: user.id,
    name: user.name || "User",
    username: user.username || "",
    email: user.email || "",
    password: user.password || undefined,
    role: (user.role as UserRole) || "TEAM_MEMBER",
    isApproved: user.isApproved,
    canPublishNow: user.canPublishNow,
    minScheduleDays: user.minScheduleDays,
    ownerId: user.ownerId,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function findUserByCredentials(identifier: string): Promise<AppUser | undefined> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ]
    },
  });
  if (!user || !user.password) return undefined;
  return mapToAppUser(user);
}

export async function findUserById(id: string): Promise<AppUser | undefined> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return undefined;
  return mapToAppUser(user);
}

export async function getAllUsers(): Promise<Omit<AppUser, "password">[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
  return users.map(u => {
    const appUser = mapToAppUser(u);
    delete appUser.password;
    return appUser;
  });
}

export interface CreateUserData {
  name: string;
  username: string;
  email?: string;
  password?: string;
  role: UserRole;
  ownerId?: string;
  canPublishNow?: boolean;
  canSchedule?: boolean;
  minScheduleDays?: number;
}

export async function createUser(data: CreateUserData): Promise<Omit<AppUser, "password">> {
  // Check if username exists
  const existingUsername = await prisma.user.findUnique({ where: { username: data.username } });
  if (existingUsername) throw new Error("A user with this username already exists");

  if (data.email) {
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existingEmail) throw new Error("A user with this email already exists");
  }

  const hashed = data.password ? hashPassword(data.password) : null;
  const user = await prisma.user.create({
    data: {
      name: data.name,
      username: data.username,
      email: data.email ? data.email.toLowerCase() : null,
      password: hashed,
      role: data.role,
      ownerId: data.ownerId,
      canPublishNow: data.canPublishNow ?? true,
      canSchedule: data.canSchedule ?? true,
      minScheduleDays: data.minScheduleDays ?? 0,
      isApproved: true,
    },
  });

  const appUser = mapToAppUser(user);
  delete appUser.password;
  return appUser;
}

export async function seedAdminUser() {
  await prisma.user.upsert({
    where: { email: "rankved.business@gmail.com" },
    update: {
      username: "admin",
      password: hashPassword("Sona@15jan2026##"),
      role: "SUPER_ADMIN",
      isApproved: true,
      canPublishNow: true,
      minScheduleDays: 0,
    },
    create: {
      name: "Super Admin",
      username: "admin",
      email: "rankved.business@gmail.com",
      password: hashPassword("Sona@15jan2026##"),
      role: "SUPER_ADMIN",
      isApproved: true,
      canPublishNow: true,
      minScheduleDays: 0,
    }
  });
  console.log("Admin user seeded/updated.");
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    await prisma.user.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
