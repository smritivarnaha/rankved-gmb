import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notifyAdmin } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session as any)?.user?.role;
  if (role !== "SUPER_ADMIN" && role !== "AGENCY_OWNER") {
    return NextResponse.json({ error: "Only admins can send test emails." }, { status: 403 });
  }

  try {
    const adminEmail = process.env.ADMIN_EMAIL || "rankved.business@gmail.com";
    
    await notifyAdmin({
      subject: "🧪 GMB Manager: Test Email",
      text: `This is a test email from your GMB Manager dashboard to verify that SMTP settings are working correctly.\n\nSent at: ${new Date().toLocaleString()}\nAdmin Email: ${adminEmail}`,
    });

    return NextResponse.json({ message: `Test email sent to ${adminEmail}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send test email" }, { status: 500 });
  }
}
