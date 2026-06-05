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
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  let startMonthDate: Date;
  let endMonthDate: Date;

  if (monthParam !== null && yearParam !== null) {
    const m = parseInt(monthParam);
    const y = parseInt(yearParam);
    startMonthDate = new Date(y, m, 1);
    endMonthDate   = new Date(y, m, 1);
  } else {
    const months = parseInt(searchParams.get("months") || "1");
    const now = new Date();
    startMonthDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
    endMonthDate   = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const baseUrl =
    `https://businessprofileperformance.googleapis.com/v1/${resourceName}/searchkeywords/impressions/monthly` +
    `?monthlyRange.startMonth.year=${startMonthDate.getFullYear()}` +
    `&monthlyRange.startMonth.month=${startMonthDate.getMonth() + 1}` +
    `&monthlyRange.endMonth.year=${endMonthDate.getFullYear()}` +
    `&monthlyRange.endMonth.month=${endMonthDate.getMonth() + 1}` +
    `&pageSize=100`; // max per page

  try {
    // ── Paginate until all keywords are fetched ──────────────────────
    let allRaw: any[] = [];
    let pageToken: string | undefined;
    let pageCount = 0;

    do {
      const pageUrl = pageToken ? `${baseUrl}&pageToken=${pageToken}` : baseUrl;
      const response = await fetch(pageUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorData;
        try { errorData = JSON.parse(responseText); }
        catch { throw new Error(responseText.slice(0, 100) + "..."); }
        console.error("Google Keywords API Error:", errorData);
        return NextResponse.json(
          { error: errorData.error?.message || "Google API Error" },
          { status: response.status }
        );
      }

      const data = await response.json();
      allRaw = [...allRaw, ...(data.searchKeywordsCounts || [])];
      pageToken = data.nextPageToken;
      pageCount++;

      // Safety cap: max 20 pages (2000 keywords)
      if (pageCount >= 20) break;
    } while (pageToken);

    // ── Map + handle privacy threshold ───────────────────────────────
    // insightsValue.value = actual count (may be "0" if below privacy threshold)
    // insightsValue.threshold = the threshold bucket (e.g. "15")
    // When value === "0" or missing, Google shows it as "<{threshold}" in dashboard
    const keywords = allRaw.map((k: any) => {
      const rawValue     = parseInt(k.insightsValue?.value     || "0");
      const rawThreshold = parseInt(k.insightsValue?.threshold || "0");
      const isBelowThreshold = rawValue === 0 && rawThreshold > 0;
      return {
        keyword:          k.searchKeyword,
        count:            isBelowThreshold ? rawThreshold : rawValue,
        belowThreshold:   isBelowThreshold,  // true = display as "<N"
      };
    }).sort((a: any, b: any) => b.count - a.count);

    return NextResponse.json({ data: keywords, total: keywords.length });
  } catch (err: any) {
    console.error("Keywords API Catch:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
