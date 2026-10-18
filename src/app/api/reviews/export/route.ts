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
 * - profileId: "all" | locationId (or comma-separated list of IDs: "id1,id2,id3")
 * - profileIds: comma-separated list of locationIds
 * - dateRange: "all" | "30d" | "60d" | "90d" | "custom"
 * - startDate: ISO string or YYYY-MM-DD
 * - endDate: ISO string or YYYY-MM-DD
 * - status: "pending" | "replied" | "all"
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileIdParam = searchParams.get("profileId") || "";
  const profileIdsParam = searchParams.get("profileIds") || "";
  const dateRange = searchParams.get("dateRange") || "all";
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const statusParam = (searchParams.get("status") || "all").toLowerCase();

  const userId = (session as any).user?.id;
  const role = (session as any).user?.role;
  const ownerId = (session as any).user?.ownerId;

  try {
    const prisma = (await import("@/lib/prisma")).default;
    const { getAllProfiles } = await import("@/lib/profile-store");

    const allProfiles = (await getAllProfiles(userId, role, ownerId)).filter(p => !p.isHidden);
    const profileMap = new Map(allProfiles.map(p => [p.id, p]));
    let allowedProfileIds = allProfiles.map(p => p.id);

    // 1. Filter by Profile(s)
    const combinedProfileFilter = profileIdsParam || profileIdParam;
    if (combinedProfileFilter && combinedProfileFilter !== "all") {
      const selectedIdList = combinedProfileFilter.split(",").map(id => id.trim()).filter(Boolean);
      if (selectedIdList.length > 0) {
        allowedProfileIds = allowedProfileIds.filter(id => selectedIdList.includes(id));
      }
    }

    // 2. Date range filter
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

    const whereClause: any = {
      locationId: { in: allowedProfileIds },
      status: "ACTIVE",
    };

    if (minDate || maxDate) {
      whereClause.reviewCreateTime = {};
      if (minDate) whereClause.reviewCreateTime.gte = minDate;
      if (maxDate) whereClause.reviewCreateTime.lte = maxDate;
    }

    const dbReviews = await prisma.locationReview.findMany({
      where: whereClause,
      orderBy: { reviewCreateTime: "desc" },
    });

    // 3. Filter by Status (Pending Only vs Replied vs All Reviews)
    const filteredReviews = dbReviews.filter(r => {
      const isReplied = !!(r.ownerReply && r.ownerReply.trim());
      if (statusParam === "pending") return !isReplied;
      if (statusParam === "replied") return isReplied;
      return true;
    });

    // 4. Build CSV string
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
      "Status",
    ];

    const rows: string[] = [];
    rows.push(headers.join(","));

    for (const r of filteredReviews) {
      const receivedDateStr = r.reviewCreateTime
        ? new Date(r.reviewCreateTime).toISOString().replace("T", " ").substring(0, 16)
        : "";
      const isReplied = !!(r.ownerReply && r.ownerReply.trim());
      const profileName = profileMap.get(r.locationId)?.name || "";

      const row = [
        escapeCsvCell(r.locationId || ""),
        escapeCsvCell(profileName),
        escapeCsvCell(r.reviewName || ""),
        escapeCsvCell(r.reviewId || ""),
        escapeCsvCell(r.reviewerName || "Anonymous"),
        escapeCsvCell(r.rating || getRating(r)),
        escapeCsvCell(receivedDateStr),
        escapeCsvCell(r.comment || ""),
        escapeCsvCell(r.ownerReply || ""),
        escapeCsvCell(isReplied ? "Replied" : "Pending"),
      ];
      rows.push(row.join(","));
    }

    // Add UTF-8 BOM for Excel unicode support
    const csvContent = "\uFEFF" + rows.join("\r\n");

    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `gbp-reviews-export-${statusParam === "pending" ? "pending" : "all"}-${dateStamp}.csv`;

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
