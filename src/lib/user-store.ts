import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

export type UserRole = "ADMIN" | "TEAM";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string; // hashed
  role: UserRole;
  createdAt: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function readUsers(): AppUser[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    // Seed with default admin account
    const admin: AppUser = {
      id: crypto.randomUUID(),
      name: "Admin",
      email: "admin@postpulse.io",
      password: hashPassword("admin123"),
      role: "ADMIN",
      createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify([admin], null, 2));
    return [admin];
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
}

function writeUsers(users: AppUser[]) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function findUserByEmail(email: string): AppUser | undefined {
  return readUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): AppUser | undefined {
  return readUsers().find((u) => u.id === id);
}

export function getAllUsers(): Omit<AppUser, "password">[] {
  return readUsers().map(({ password, ...user }) => user);
}

export function createUser(data: { name: string; email: string; password: string; role: UserRole }): Omit<AppUser, "password"> {
  const users = readUsers();
  
  if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error("A user with this email already exists");
  }

  const newUser: AppUser = {
    id: crypto.randomUUID(),
    name: data.name,
    email: data.email,
    password: hashPassword(data.password),
    role: data.role,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeUsers(users);

  const { password, ...safeUser } = newUser;
  return safeUser;
}

export function deleteUser(id: string): boolean {
  const users = readUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) return false;
  
  // Prevent deleting the last admin
  if (!filtered.some((u) => u.role === "ADMIN")) {
    throw new Error("Cannot delete the last admin user");
  }
  
  writeUsers(filtered);
  return true;
}
