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

  const profile = await getProfileById(id, userId, role);
  if (!profile) return NextResponse.json({ error: "Profile not found or access denied" }, { status: 404 });

  // Get all valid Google accounts and find the one that matches this profile's connected email
  const validAccounts = await getValidGoogleAccounts(userId);
  if (validAccounts.length === 0) {
    return NextResponse.json({ error: "No valid Google accounts connected. Please reconnect in Settings." }, { status: 400 });
  }

  // Try to match the profile's googleEmail to the correct account token
  let accessToken: string | null = null;
  if (profile.googleEmail) {
    const matchedAccount = validAccounts.find(acc => getEmailFromIdToken(acc.id_token) === profile.googleEmail);
    if (matchedAccount) accessToken = matchedAccount.access_token;
  }
  // Fallback: use the first available valid account token
  if (!accessToken) accessToken = validAccounts[0].access_token;
  if (!accessToken) return NextResponse.json({ error: "No valid access token available." }, { status: 400 });

  // Build the correct full resource name: accounts/{accountId}/locations/{locationId}
  // profile.accountId = "accounts/123456789", profile.googleName = "locations/987654321"
  const resourceName = profile.accountId && profile.googleName
    ? `${profile.accountId}/${profile.googleName}`
    : profile.googleName;
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
