import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * GET /api/reviews/deleted/export
 * Query params: profileId ("all" | locationId)
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId") || "all";

  try {
    const whereClause: any = {
      status: "DELETED_BY_GOOGLE",
    };

    if (profileId !== "all") {
      whereClause.locationId = profileId;
    }

    const deletedReviews = await prisma.locationReview.findMany({
      where: whereClause,
      include: {
        location: {
          select: { name: true },
        },
      },
      orderBy: { deletedAt: "desc" },
    });

    const headers = [
      "Profile_Name",
      "Reviewer_Name",
      "Rating",
      "Review_Received_Date",
      "Removed_By_Google_Date",
      "Customer_Review",
      "Owner_Reply",
      "Google_Review_Resource_ID",
      "Google_Review_ID",
    ];

    const rows: string[] = [];
    rows.push(headers.join(","));

    for (const r of deletedReviews) {
      const receivedDateStr = r.reviewCreateTime
        ? new Date(r.reviewCreateTime).toISOString().replace("T", " ").substring(0, 16)
        : "";
      const deletedDateStr = r.deletedAt
        ? new Date(r.deletedAt).toISOString().replace("T", " ").substring(0, 16)
        : "";

      const row = [
        escapeCsvCell(r.location?.name || ""),
        escapeCsvCell(r.reviewerName || "Anonymous"),
        escapeCsvCell(r.rating || 5),
        escapeCsvCell(receivedDateStr),
        escapeCsvCell(deletedDateStr),
        escapeCsvCell(r.comment || ""),
        escapeCsvCell(r.ownerReply || ""),
        escapeCsvCell(r.reviewName || ""),
        escapeCsvCell(r.reviewId || ""),
      ];
      rows.push(row.join(","));
    }

    const csvContent = "\uFEFF" + rows.join("\r\n");
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `deleted-reviews-evidence-report-${dateStamp}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[Export Deleted Reviews] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate CSV export." }, { status: 500 });
  }
}
