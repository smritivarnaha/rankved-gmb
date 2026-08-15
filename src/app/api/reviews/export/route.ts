import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

function getRating(r: any): number {
  const map: Record<string, number> = { FIVE: 5, FOUR: 4, THREE: 3, TWO: 2, ONE: 1 };
  return map[r.starRating] ?? (typeof r.starRating === "number" ? r.starRating : 1);
}

/**
 * GET /api/reviews/export
 * Query parameters:
 * - profileId: "all" | locationId
 * - dateRange: "all" | "30d" | "60d" | "90d" | "custom"
 * - startDate: ISO string or YYYY-MM-DD
 * - endDate: ISO string or YYYY-MM-DD
 * - status: "pending" | "all"
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId") || "all";
  const dateRange = searchParams.get("dateRange") || "all";
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const statusParam = searchParams.get("status") || "all";

  try {
    // 1. Fetch reviews from our internal reviews API handler
    const origin = req.nextUrl.origin;
    const cookie = req.headers.get("cookie") || "";

    const reviewsRes = await fetch(`${origin}/api/reviews?profileId=${profileId}&pendingOnly=${statusParam === "pending"}`, {
      headers: { cookie },
    });

    if (!reviewsRes.ok) {
      return NextResponse.json({ error: "Failed to fetch reviews for export." }, { status: reviewsRes.status });
    }

    const reviewsData = await reviewsRes.json();
    let reviews: any[] = reviewsData.allReviews || reviewsData.data || [];

    // 2. Filter by Date Range
    const now = new Date();
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    if (dateRange === "30d") {
      minDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "60d") {
      minDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "90d") {
      minDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "custom" && (startDateParam || endDateParam)) {
      if (startDateParam) minDate = new Date(startDateParam);
      if (endDateParam) {
        maxDate = new Date(endDateParam);
        maxDate.setHours(23, 59, 59, 999);
      }
    }

    if (minDate || maxDate) {
      reviews = reviews.filter(r => {
        if (!r.createTime) return true;
        const reviewDate = new Date(r.createTime);
        if (minDate && reviewDate < minDate) return false;
        if (maxDate && reviewDate > maxDate) return false;
        return true;
      });
    }

    // 3. Build CSV string
    const headers = [
      "Profile_ID",
      "Profile_Name",
      "Review_Resource_Name",
      "Review_ID",
      "Reviewer_Name",
      "Rating",
      "Review_Received_Date",
      "Customer_Review",
      "Owner_Reply",
    ];

    const rows: string[] = [];
    rows.push(headers.join(","));

    for (const r of reviews) {
      const receivedDateStr = r.createTime
        ? new Date(r.createTime).toISOString().replace("T", " ").substring(0, 16)
        : "";

      const row = [
        escapeCsvCell(r.profileId || ""),
        escapeCsvCell(r.profileName || ""),
        escapeCsvCell(r.name || ""),
        escapeCsvCell(r.reviewId || ""),
        escapeCsvCell(r.reviewer?.displayName || "Anonymous"),
        escapeCsvCell(getRating(r)),
        escapeCsvCell(receivedDateStr),
        escapeCsvCell(r.comment || ""),
        escapeCsvCell(r.reviewReply?.comment || ""),
      ];
      rows.push(row.join(","));
    }

    // Add UTF-8 BOM for Excel unicode support
    const csvContent = "\uFEFF" + rows.join("\r\n");

    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `gbp-reviews-${profileId === "all" ? "all-profiles" : "profile"}-${dateStamp}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[Export Reviews] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate CSV export." }, { status: 500 });
  }
}
