import { LoginForm } from "@/components/auth/LoginForm";
import prisma from "@/lib/prisma";

async function getSettings() {
  try {
    const settings = await prisma.globalSetting.findUnique({
      where: { id: "settings" }
    });
    
    if (settings) return settings;

    return {
      loginBgUrl: "/login-bg.jpg",
      loginHeading: "Your Google Business, Managed in One Place.",
      loginDescription: "Connect your Google account and manage all your business profiles from a single dashboard.",
      loginBgOpacity: 0.5
    };
  } catch (error) {
    return {
      loginBgUrl: "/login-bg.jpg",
      loginHeading: "Your Google Business, Managed in One Place.",
      loginDescription: "Connect your Google account and manage all your business profiles from a single dashboard.",
      loginBgOpacity: 0.5
    };
  }
}

export default async function LoginPage() {
  const settings = await getSettings();

  return <LoginForm settings={settings} />;
}
