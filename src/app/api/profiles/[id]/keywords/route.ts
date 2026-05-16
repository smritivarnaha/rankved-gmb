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

  // The Business Profile Performance API strictly requires "locations/{location_id}"
  const resourceName = profile.googleName;

  // Support dynamic date ranges
  const { searchParams } = new URL(req.url);
  const months = parseInt(searchParams.get("months") || "1");

  const now = new Date();

  // Use calendar month boundaries to match Google's period (start on 1st of month X months ago)
  const startMonthDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
  const endMonthDate   = new Date(now.getFullYear(), now.getMonth(), 1); // current month

  const url = `https://businessprofileperformance.googleapis.com/v1/${resourceName}/searchkeywords/impressions/monthly?monthlyRange.startMonth.year=${startMonthDate.getFullYear()}&monthlyRange.startMonth.month=${startMonthDate.getMonth() + 1}&monthlyRange.endMonth.year=${endMonthDate.getFullYear()}&monthlyRange.endMonth.month=${endMonthDate.getMonth() + 1}&pageSize=50`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      // It's possible for this to return a 404 HTML string if resource name is invalid, just like the other endpoint
      const responseText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(responseText.slice(0, 100) + "..."); // Catch HTML errors
      }
      
      console.error("Google Keywords API Error:", errorData);
      return NextResponse.json({ error: errorData.error?.message || "Google API Error" }, { status: response.status });
    }

    const data = await response.json();
    
    // The API returns searchKeywordsCounts which has { searchKeyword: string, insightsValue: { threshold: string, value: string } }
    const keywords = (data.searchKeywordsCounts || []).map((k: any) => ({
      keyword: k.searchKeyword,
      count: parseInt(k.insightsValue?.value || "0")
    })).sort((a: any, b: any) => b.count - a.count);

    return NextResponse.json({ data: keywords });
  } catch (err: any) {
    console.error("Keywords API Catch:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
