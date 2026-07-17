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
        loginDescription: "Connect your Google account and manage all your business profiles from a single dashboard.",
        aiFeaturesEnabled: false,
        sidebarText: "RankVed",
        sidebarLogoUrl: "https://rankved.com/wp-content/uploads/2025/04/Rankved-Logo-Official-Black.avif"
      }
    });
  } catch (error) {
    console.error("Database error fetching settings:", error);
    return {
      loginBgUrl: "/login-bg.jpg",
      loginHeading: "Your Google Business, Managed in One Place.",
      loginDescription: "Connect your Google account and manage all your business profiles from a single dashboard.",
      aiFeaturesEnabled: false,
      sidebarText: "RankVed",
      sidebarLogoUrl: "https://rankved.com/wp-content/uploads/2025/04/Rankved-Logo-Official-Black.avif"
    };
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const settings = await getSettings() as any;
  
  const isSuperAdmin = session && (session.user as any).role === "SUPER_ADMIN";
  
  if (!isSuperAdmin) {
    // Hide completely for non-admins
    return NextResponse.json({
      id: settings.id,
      loginBgUrl: settings.loginBgUrl,
      loginHeading: settings.loginHeading,
      loginDescription: settings.loginDescription,
      loginBgOpacity: settings.loginBgOpacity,
      aiFeaturesEnabled: settings.aiFeaturesEnabled,
      sidebarLogoUrl: settings.sidebarLogoUrl,
      sidebarText: settings.sidebarText,
      sidebarLogoShape: settings.sidebarLogoShape,
      sidebarLogoSize: settings.sidebarLogoSize,
      sidebarTextSize: settings.sidebarTextSize,
    });
  }

  // For Super Admin, return masked key placeholders so they know they are set
  return NextResponse.json({
    ...settings,
    serpApiKey: settings.serpApiKey ? "••••••••••••••••" : null,
    dataforseoPassword: settings.dataforseoPassword ? "••••••••••••••••" : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const allowedRoles = ["SUPER_ADMIN", "AGENCY_OWNER"];
  if (!session || !allowedRoles.includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const heading = formData.get("heading") as string;
    const description = formData.get("description") as string;
    const opacity = formData.get("opacity") as string;
    const aiFeaturesEnabledStr = formData.get("aiFeaturesEnabled") as string;
    const file = formData.get("image") as File | null;
    const sidebarText = formData.get("sidebarText") as string;
    const sidebarLogoShape = formData.get("sidebarLogoShape") as string;
    const sidebarLogoSize = formData.get("sidebarLogoSize") as string;
    const sidebarTextSize = formData.get("sidebarTextSize") as string;
    const sidebarLogo = formData.get("sidebarLogo") as File | null;

    // Notification fields
    const notificationEmails = formData.get("notificationEmails") as string;
    const notificationCcEmails = formData.get("notificationCcEmails") as string;
    const successTemplateSubject = formData.get("successTemplateSubject") as string;
    const successTemplateBody = formData.get("successTemplateBody") as string;
    const failureTemplateSubject = formData.get("failureTemplateSubject") as string;
    const failureTemplateBody = formData.get("failureTemplateBody") as string;
    const scheduledTemplateSubject = formData.get("scheduledTemplateSubject") as string;
    const scheduledTemplateBody = formData.get("scheduledTemplateBody") as string;

    // Admin SERP Settings
    const serpProvider = formData.get("serpProvider") as string;
    const serpApiKey = formData.get("serpApiKey") as string;
    const dataforseoUsername = formData.get("dataforseoUsername") as string;
    const dataforseoPassword = formData.get("dataforseoPassword") as string;

    const updateData: any = {};
    if (heading) updateData.loginHeading = heading;
    if (description) updateData.loginDescription = description;
    if (opacity) updateData.loginBgOpacity = parseFloat(opacity);
    if (aiFeaturesEnabledStr !== null) {
      updateData.aiFeaturesEnabled = aiFeaturesEnabledStr === "true";
    }
    if (sidebarText !== null) updateData.sidebarText = sidebarText;
    if (sidebarLogoShape !== null) updateData.sidebarLogoShape = sidebarLogoShape;
    if (sidebarLogoSize !== null) updateData.sidebarLogoSize = parseInt(sidebarLogoSize, 10);
    if (sidebarTextSize !== null) updateData.sidebarTextSize = parseInt(sidebarTextSize, 10);

    if (notificationEmails !== null) updateData.notificationEmails = notificationEmails;
    if (notificationCcEmails !== null) updateData.notificationCcEmails = notificationCcEmails;
    if (successTemplateSubject !== null) updateData.successTemplateSubject = successTemplateSubject;
    if (successTemplateBody !== null) updateData.successTemplateBody = successTemplateBody;
    if (failureTemplateSubject !== null) updateData.failureTemplateSubject = failureTemplateSubject;
    if (failureTemplateBody !== null) updateData.failureTemplateBody = failureTemplateBody;
    if (scheduledTemplateSubject !== null) updateData.scheduledTemplateSubject = scheduledTemplateSubject;
    if (scheduledTemplateBody !== null) updateData.scheduledTemplateBody = scheduledTemplateBody;

    if (serpProvider !== null) updateData.serpProvider = serpProvider;
    if (serpApiKey !== null && serpApiKey !== "" && serpApiKey !== "••••••••••••••••") {
      updateData.serpApiKey = serpApiKey;
    }
    if (dataforseoUsername !== null) updateData.dataforseoUsername = dataforseoUsername;
    if (dataforseoPassword !== null && dataforseoPassword !== "" && dataforseoPassword !== "••••••••••••••••") {
      updateData.dataforseoPassword = dataforseoPassword;
    }

    // GBP Intelligence Monitoring
    const monitoringEnabled = formData.get("monitoringEnabled") as string;
    const reviewAlertsEnabled = formData.get("reviewAlertsEnabled") as string;
    const performanceAlertsEnabled = formData.get("performanceAlertsEnabled") as string;
    const callsSpikeThreshold = formData.get("callsSpikeThreshold") as string;
    const directionsSpikeThreshold = formData.get("directionsSpikeThreshold") as string;
    const clicksSpikeThreshold = formData.get("clicksSpikeThreshold") as string;

    if (monitoringEnabled !== null) updateData.monitoringEnabled = monitoringEnabled === "true";
    if (reviewAlertsEnabled !== null) updateData.reviewAlertsEnabled = reviewAlertsEnabled === "true";
    if (performanceAlertsEnabled !== null) updateData.performanceAlertsEnabled = performanceAlertsEnabled === "true";
    if (callsSpikeThreshold !== null) updateData.callsSpikeThreshold = parseInt(callsSpikeThreshold, 10);
    if (directionsSpikeThreshold !== null) updateData.directionsSpikeThreshold = parseInt(directionsSpikeThreshold, 10);
    if (clicksSpikeThreshold !== null) updateData.clicksSpikeThreshold = parseInt(clicksSpikeThreshold, 10);

    if (file && file.size > 0) {
      // Store image as Base64 for persistence on Vercel
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;
      updateData.loginBgUrl = base64Image;
    }
    
    if (sidebarLogo && sidebarLogo.size > 0) {
      const bytes = await sidebarLogo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = `data:${sidebarLogo.type};base64,${buffer.toString("base64")}`;
      updateData.sidebarLogoUrl = base64Image;
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
