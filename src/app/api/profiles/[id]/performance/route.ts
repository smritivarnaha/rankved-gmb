import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getProfileById } from "@/lib/profile-store";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).user.id;
  const role = (session as any).user.role;
  const accessToken = (session as any).accessToken;

  if (!accessToken) return NextResponse.json({ error: "Google account not connected" }, { status: 400 });

  const profile = await getProfileById(id, userId, role);
  if (!profile) return NextResponse.json({ error: "Profile not found or access denied" }, { status: 404 });

  // googleName is in format "locations/123"
  // Support dynamic date ranges
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30");

  // Google data has a ~3 day delay. End the range 3 days ago to ensure data presence.
  const now = new Date();
  const endDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const startDate = new Date(now.getTime() - (days + 3) * 24 * 60 * 60 * 1000);

  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const startDay = startDate.getDate();

  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;
  const endDay = endDate.getDate();

  const metrics = [
    "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
    "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
    "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
    "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
    "BUSINESS_DIRECTION_REQUESTS",
    "CALL_CLICKS",
    "WEBSITE_CLICKS"
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
    console.log(`Fetched performance for ${profile.name}:`, JSON.stringify(data).substring(0, 500));
    
    const totals: Record<string, number> = {};
    
    // Google returns an array of MultiDailyMetricTimeSeries
    (data.multiDailyMetricTimeSeries || []).forEach((item: any) => {
      // Each item has a dailyMetricTimeSeries array
      (item.dailyMetricTimeSeries || []).forEach((series: any) => {
        const metric = series.dailyMetric;
        if (!metric) return;
        
        // Sum all values in the timeSeries
        const sum = (series.timeSeries?.values || []).reduce((acc: number, point: any) => {
          return acc + (parseInt(point.value) || 0);
        }, 0);
        
        totals[metric] = (totals[metric] || 0) + sum;
      });
    });

    return NextResponse.json({ data: totals });
  } catch (err: any) {
    console.error("Performance API Catch:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
