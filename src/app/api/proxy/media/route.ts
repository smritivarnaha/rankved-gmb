import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/proxy/media?url=...
 * Proxies protected Google Business Profile media (logos, photos)
 * by attaching the current user's OAuth token to the request.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("Missing URL parameter", { status: 400 });
  }

  // Security: Only allow proxying Google-hosted media
  if (!targetUrl.includes("google") && !targetUrl.includes("googleapis.com")) {
    return new NextResponse("Invalid target domain", { status: 403 });
  }

  try {
    const userId = (session as any).user.id;
    const { getValidGoogleAccounts } = await import("@/lib/google-accounts");
    const accounts = await getValidGoogleAccounts(userId);
    
    // We try to find the account that matches the email if possible, 
    // but for now we just use the first valid one or the one linked to the session.
    const accessToken = (session as any).accessToken || accounts[0]?.access_token;

    if (!accessToken) {
      return new NextResponse("No access token found for proxying", { status: 401 });
    }

    const res = await fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      return new NextResponse(`Upstream error: ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get("Content-Type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err: any) {
    console.error("[Proxy] Error:", err.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
