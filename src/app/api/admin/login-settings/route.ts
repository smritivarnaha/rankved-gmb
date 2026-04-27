import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

const SETTINGS_FILE = path.join(process.cwd(), "data", "app-settings.json");

async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function getSettings() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {
      loginBgUrl: "/login-bg.jpg",
      loginHeading: "Your Google Business, Managed in One Place.",
      loginDescription: "Connect your Google account and manage all your business profiles from a single dashboard."
    };
  }
}

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const heading = formData.get("heading") as string;
    const description = formData.get("description") as string;
    const file = formData.get("image") as File | null;

    const currentSettings = await getSettings();
    const newSettings = { ...currentSettings };

    if (heading) newSettings.loginHeading = heading;
    if (description) newSettings.loginDescription = description;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name);
      const filename = `login-bg-custom-${Date.now()}${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      
      try {
        await fs.access(uploadDir);
      } catch {
        await fs.mkdir(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      await fs.writeFile(filePath, buffer);
      newSettings.loginBgUrl = `/uploads/${filename}`;
    }

    await ensureDataDir();
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(newSettings, null, 2));

    return NextResponse.json({ success: true, settings: newSettings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
