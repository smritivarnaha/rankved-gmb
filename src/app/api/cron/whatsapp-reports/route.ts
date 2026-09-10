import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendScheduledWhatsAppReport } from "@/lib/whatsapp-reporter";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const urlSecret = new URL(req.url).searchParams.get("secret");
    if (urlSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const currentDayOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][now.getDay()];

  const activeLocations = await prisma.location.findMany({
    where: {
      whatsappEnabled: true,
      whatsappRecipientPhone: { not: null },
      whatsappReportingSchedule: { not: "OFF" },
    },
  });

  const dispatched: Array<{ locationId: string; name: string; schedule: string }> = [];

  for (const loc of activeLocations) {
    const lastSent = loc.whatsappLastReportSentAt ? new Date(loc.whatsappLastReportSentAt) : null;
    const hoursSinceLastSent = lastSent ? (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60) : 9999;

    let shouldSend = false;

    switch (loc.whatsappReportingSchedule) {
      case "DAILY":
        if (hoursSinceLastSent >= 20) shouldSend = true;
        break;

      case "ALTERNATE_DAYS":
        if (hoursSinceLastSent >= 44) shouldSend = true;
        break;

      case "WEEKLY":
        if (hoursSinceLastSent >= 156 || (!lastSent && currentDayOfWeek === "MON")) {
          shouldSend = true;
        }
        break;

      case "CUSTOM":
        if (loc.whatsappCustomDays) {
          const days = loc.whatsappCustomDays.toUpperCase().split(",").map(d => d.trim());
          if (days.includes(currentDayOfWeek) && hoursSinceLastSent >= 20) {
            shouldSend = true;
          }
        } else if (hoursSinceLastSent >= 156) {
          shouldSend = true;
        }
        break;
    }

    if (shouldSend) {
      console.log(`[WhatsApp Cron] Dispatching scheduled report for ${loc.name} (${loc.id})`);
      const reportRes = await sendScheduledWhatsAppReport(loc.id);
      if (reportRes.success) {
        dispatched.push({ locationId: loc.id, name: loc.name, schedule: loc.whatsappReportingSchedule });
      }
    }
  }

  return NextResponse.json({
    success: true,
    totalEligible: activeLocations.length,
    dispatchedCount: dispatched.length,
    dispatched,
  });
}
