import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { autoFetchLocationSitemap, parseCustomSitemap } from "@/lib/sitemap-helper";
import { getValidGoogleAccounts, getEmailFromIdToken } from "@/lib/google-accounts";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Read optional custom sitemapUrl from body
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const { sitemapUrl } = body;

    let result;
    if (sitemapUrl) {
      // Manual parse custom URL
      result = await parseCustomSitemap(id, sitemapUrl);
    } else {
      // 1. Fetch location from database
      const loc = await prisma.location.findUnique({ where: { id } });
      if (!loc) return NextResponse.json({ error: "Location not found" }, { status: 404 });

      // 2. If website is missing, try to fetch it from Google API
      if (!loc.website) {
        const accounts = await getValidGoogleAccounts((session.user as any).id);
        if (accounts.length > 0) {
          let accessToken: string | null = null;
          if (loc.googleEmail) {
            const matchedAccount = accounts.find(acc => getEmailFromIdToken(acc.id_token) === loc.googleEmail);
            if (matchedAccount) accessToken = matchedAccount.access_token;
          }
          if (!accessToken) accessToken = accounts[0].access_token;
          
          const INFO_API_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";
          
          console.log(`[Sitemap Sync] Auto-fetching websiteUri from Google API for: ${loc.gbpLocationId}`);
          const res = await fetch(`${INFO_API_BASE}/${loc.gbpLocationId}?readMask=websiteUri`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.websiteUri) {
              await prisma.location.update({
                where: { id },
                data: { website: data.websiteUri }
              });
              console.log(`[Sitemap Sync] Saved fetched website Uri: ${data.websiteUri}`);
            }
          }
        }
      }

      // 3. Auto-crawl sitemap URLs
      result = await autoFetchLocationSitemap(id);
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to parse sitemap" }, { status: 422 });
    }

    // Return the updated profile location details
    const updated = await prisma.location.findUnique({ where: { id } });

    return NextResponse.json({
      success: true,
      count: result.count,
      website: updated?.website || "",
      urls: updated?.sitemapUrls || [],
    });
  } catch (err: any) {
    console.error("Sitemap API Error:", err);
    return NextResponse.json({ error: err.message || "Failed to process sitemap" }, { status: 500 });
  }
}
