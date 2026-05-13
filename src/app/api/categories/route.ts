import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getValidGoogleAccounts } from "@/lib/google-accounts";

const API_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1/categories";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const searchTerm = searchParams.get("searchTerm") || "";
  const regionCode = searchParams.get("regionCode") || "IN";
  const languageCode = searchParams.get("languageCode") || "en-US";

  try {
    const accounts = await getValidGoogleAccounts((session.user as any).id);
    if (!accounts.length) return NextResponse.json({ error: "No valid Google connection" }, { status: 401 });

    const accessToken = accounts[0].access_token;

    const url = new URL(API_BASE);
    url.searchParams.set("regionCode", regionCode);
    url.searchParams.set("languageCode", languageCode);
    if (searchTerm) url.searchParams.set("searchTerm", searchTerm);
    url.searchParams.set("pageSize", "20");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Failed to fetch categories");

    return NextResponse.json({ data: data.categories || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
