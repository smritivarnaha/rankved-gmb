import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getProfileById } from "@/lib/profile-store";
import { getValidGoogleAccounts, getEmailFromIdToken } from "@/lib/google-accounts";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).user.id;
  const role = (session as any).user.role;
  const ownerId = (session as any).user.ownerId;

  const profile = await getProfileById(id, userId, role, ownerId);
  if (!profile) return NextResponse.json({ error: "Profile not found or access denied" }, { status: 404 });

  const { getGoogleAccessTokenForLocation } = await import("@/lib/google-token");
  let accessToken: string | null = await getGoogleAccessTokenForLocation(id);

  if (!accessToken) {
    const validAccounts = await getValidGoogleAccounts(ownerId || userId);
    if (validAccounts.length === 0) {
      return NextResponse.json({ error: "No valid Google accounts connected. Please reconnect in Settings." }, { status: 400 });
    }
    if (profile.googleEmail) {
      const matchedAccount = validAccounts.find(acc => getEmailFromIdToken(acc.id_token) === profile.googleEmail);
      if (matchedAccount) accessToken = matchedAccount.access_token;
    }
    if (!accessToken) accessToken = validAccounts[0].access_token;
  }
  if (!accessToken) return NextResponse.json({ error: "No valid access token available." }, { status: 400 });

  // The Business Profile Performance API strictly requires "locations/{location_id}"
  // It does NOT support the "accounts/{account_id}/locations/{location_id}" format.
  const cleanLocId = String(profile.googleName || "").replace(/^accounts\/[^/]+\/locations\//, "").replace(/^locations\//, "");
  const resourceName = `locations/${cleanLocId}`;
    
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  let startDate: Date;
  let endDate: Date;

  if (startParam && endParam) {
    startDate = new Date(startParam);
    endDate = new Date(endParam);
  } else if (monthParam !== null && yearParam !== null) {
    const m = parseInt(monthParam);
    const y = parseInt(yearParam);
    startDate = new Date(y, m, 1);
    
    const lastDayOfMonth = new Date(y, m + 1, 0);
    const now = new Date();
    const lagDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    if (y === now.getFullYear() && m === now.getMonth()) {
      endDate = lagDate < startDate ? startDate : lagDate;
    } else {
      endDate = lastDayOfMonth;
    }
  } else {
    const months = parseInt(searchParams.get("months") || "1");
    const now = new Date();
    startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
    endDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  }

  const startYear  = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const startDay   = startDate.getDate();

  const endYear  = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;
  const endDay   = endDate.getDate();

  const metrics = [
    "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
    "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
    "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
    "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
    "BUSINESS_DIRECTION_REQUESTS",
    "CALL_CLICKS",
    "WEBSITE_CLICKS",
    "BUSINESS_CONVERSATIONS",
    "BUSINESS_BOOKINGS"
  ];

  const url = `https://businessprofileperformance.googleapis.com/v1/${resourceName}:fetchMultiDailyMetricsTimeSeries?` + 
    metrics.map(m => `dailyMetrics=${m}`).join("&") + 
    `&dailyRange.startDate.year=${startYear}&dailyRange.startDate.month=${startMonth}&dailyRange.startDate.day=${startDay}` +
    `&dailyRange.endDate.year=${endYear}&dailyRange.endDate.month=${endMonth}&dailyRange.endDate.day=${endDay}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google Performance API Error:", errorData);
      return NextResponse.json({ error: errorData.error?.message || "Google API Error" }, { status: response.status });
    }

    const data = await response.json();
    const seriesList = data.multiDailyMetricTimeSeries || [];

    // Update cached stats on Location in background so /performance overview cards load instantaneously
    try {
      let views = 0;
      let interactions = 0;
      for (const group of seriesList) {
        for (const sub of group.dailyMetricTimeSeries || []) {
          const metric = sub.dailyMetric;
          const vals = sub.timeSeries?.datedValues || [];
          const sum = vals.reduce((acc: number, v: any) => acc + (parseInt(v.value || "0", 10) || 0), 0);
          if (metric?.includes("IMPRESSIONS")) views += sum;
          else interactions += sum;
        }
      }
      const prisma = (await import("@/lib/prisma")).default;
      prisma.location
        .update({
          where: { id },
          data: {
            cachedSearchViews: views,
            cachedInteractions: interactions,
            statsUpdatedAt: new Date(),
          },
        })
        .catch(() => {});
    } catch {}
    
    // Return the raw timeseries data so the frontend can build charts AND calculate totals
    return NextResponse.json({ data: seriesList });
  } catch (err: any) {
    console.error("Performance API Catch:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

