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
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // Get correct Google account token for this profile
  const validAccounts = await getValidGoogleAccounts(userId);
  if (validAccounts.length === 0) {
    return NextResponse.json({ error: "No valid Google accounts connected. Please reconnect in Settings." }, { status: 400 });
  }

  let accessToken: string | null = null;
  if (profile.googleEmail) {
    const matchedAccount = validAccounts.find(acc => getEmailFromIdToken(acc.id_token) === profile.googleEmail);
    if (matchedAccount) accessToken = matchedAccount.access_token;
  }
  if (!accessToken) accessToken = validAccounts[0].access_token;
  if (!accessToken) return NextResponse.json({ error: "No valid access token available." }, { status: 400 });

  // Build full resource name: accounts/{accountId}/locations/{locationId}
  const resourceName = profile.accountId && profile.googleName
    ? `${profile.accountId}/${profile.googleName}`
    : profile.googleName;

  // Support dynamic date ranges
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30");

  // Calculate range with 3-day buffer
  const now = new Date();
  const endDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const startDate = new Date(now.getTime() - (days + 3) * 24 * 60 * 60 * 1000);

  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const startDay = startDate.getDate();

  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;
  const endDay = endDate.getDate();

  const url = `https://businessprofileperformance.googleapis.com/v1/${resourceName}/searchKeywords:list?` + 
    `dailyRange.startDate.year=${startYear}&dailyRange.startDate.month=${startMonth}&dailyRange.startDate.day=${startDay}` +
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
    
    // The API returns a list of SearchKeywordCount objects
    // Each has a 'searchKeyword' and 'insightValue' (which has a 'value')
    const keywords = (data.searchKeywords || []).map((k: any) => ({
      keyword: k.searchKeyword,
      count: parseInt(k.insightValue?.value || "0")
    })).sort((a: any, b: any) => b.count - a.count);

    return NextResponse.json({ data: keywords });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
