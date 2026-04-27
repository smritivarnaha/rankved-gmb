import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function getSettings() {
  try {
    const settings = await prisma.globalSetting.findUnique({
      where: { id: "settings" }
    });
    
    if (settings) return settings;

    // Create default if not exists
    return await prisma.globalSetting.create({
      data: {
        id: "settings",
        loginBgUrl: "/login-bg.jpg",
        loginHeading: "Your Google Business, Managed in One Place.",
        loginDescription: "Connect your Google account and manage all your business profiles from a single dashboard."
      }
    });
  } catch (error) {
    console.error("Database error fetching settings:", error);
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
    const opacity = formData.get("opacity") as string;
    const file = formData.get("image") as File | null;

    const updateData: any = {};
    if (heading) updateData.loginHeading = heading;
    if (description) updateData.loginDescription = description;
    if (opacity) updateData.loginBgOpacity = parseFloat(opacity);

    if (file && file.size > 0) {
      // Store image as Base64 for persistence on Vercel
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;
      updateData.loginBgUrl = base64Image;
    }

    const settings = await prisma.globalSetting.upsert({
      where: { id: "settings" },
      update: updateData,
      create: {
        id: "settings",
        ...updateData
      }
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
