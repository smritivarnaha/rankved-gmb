import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getValidGoogleAccounts } from "@/lib/google-accounts";

const INFO_API_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  if (!query) return NextResponse.json({ data: [] });

  try {
    const accounts = await getValidGoogleAccounts((session.user as any).id);
    if (!accounts.length) return NextResponse.json({ error: "No Google account" }, { status: 401 });

    const accessToken = accounts[0].access_token;
    
    // Search categories
    // Filter uses categoryName:"..." for partial matches
    const res = await fetch(`${INFO_API_BASE}/categories?regionCode=US&languageCode=en&view=FULL&filter=categoryName:"${encodeURIComponent(query)}"`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Search failed");

    return NextResponse.json({ data: data.categories || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
