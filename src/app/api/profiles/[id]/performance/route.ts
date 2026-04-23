import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getProfileById } from "@/lib/profile-store";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).user.id;
  const role = (session as any).user.role;
  const accessToken = (session as any).accessToken;

  if (!accessToken) return NextResponse.json({ error: "Google account not connected" }, { status: 400 });

  const profile = await getProfileById(params.id, userId, role);
  if (!profile) return NextResponse.json({ error: "Profile not found or access denied" }, { status: 404 });

  // googleName is in format "locations/123"
  // We need the full resource name for the performance API
  const resourceName = profile.googleName; 

  // Calculate last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const startYear = thirtyDaysAgo.getFullYear();
  const startMonth = thirtyDaysAgo.getMonth() + 1;
  const startDay = thirtyDaysAgo.getDate();

  const endYear = now.getFullYear();
  const endMonth = now.getMonth() + 1;
  const endDay = now.getDate();

  const metrics = [
    "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
    "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
    "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
    "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
    "BUSINESS_DIRECTION_REQUESTS",
    "BUSINESS_PHONE_CALLS",
    "BUSINESS_WEBSITE_CLICKS"
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
      return NextResponse.json({ error: errorData.error?.message || "Google API Error" }, { status: response.status });
    }

    const data = await response.json();
    
    // Process data to sum up totals for the 30 day period
    const totals: Record<string, number> = {};
    
    (data.multiDailyMetricTimeSeries || []).forEach((series: any) => {
      const metric = series.dailyMetricTimeSeries?.[0]?.dailyMetric;
      if (!metric) return;
      
      const sum = (series.dailyMetricTimeSeries?.[0]?.timeSeries?.values || []).reduce((acc: number, val: any) => {
        return acc + (parseInt(val.value) || 0);
      }, 0);
      
      totals[metric] = sum;
    });

    return NextResponse.json({ data: totals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
