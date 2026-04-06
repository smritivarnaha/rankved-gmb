import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const PROFILES_FILE = path.join(DATA_DIR, "profiles.json");

export interface ProfileData {
  id: string;
  name: string;         // location name e.g. "Downtown Office"
  accountId: string;    // Google account ID
  accountName: string;  // e.g. "Sunrise Dental"
  address: string;
  phone: string;
  website: string;
  googleName: string;   // full Google resource name e.g. "locations/123"
  fetchedAt: string;
  manual?: boolean;     // true if manually added
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readProfiles(): ProfileData[] {
  ensureDataDir();
  if (!fs.existsSync(PROFILES_FILE)) {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify([], null, 2));
    return [];
  }
  return JSON.parse(fs.readFileSync(PROFILES_FILE, "utf-8"));
}

function writeProfiles(profiles: ProfileData[]) {
  ensureDataDir();
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2));
}

export function getAllProfiles(): ProfileData[] {
  return readProfiles();
}

export function getProfileById(id: string): ProfileData | undefined {
  return readProfiles().find((p) => p.id === id);
}

export function saveProfiles(profiles: ProfileData[]) {
  writeProfiles(profiles);
}

export function addProfile(profile: ProfileData) {
  const profiles = readProfiles();
  profiles.push(profile);
  writeProfiles(profiles);
}

export function updateProfile(id: string, updates: Partial<ProfileData>) {
  const profiles = readProfiles();
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  profiles[idx] = { ...profiles[idx], ...updates };
  writeProfiles(profiles);
  return profiles[idx];
}

export function deleteProfile(id: string): boolean {
  const profiles = readProfiles();
  const filtered = profiles.filter((p) => p.id !== id);
  if (filtered.length === profiles.length) return false;
  writeProfiles(filtered);
  return true;
}

export function clearProfiles() {
  writeProfiles([]);
}
