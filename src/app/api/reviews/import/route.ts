import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getNextAvailableReplySlot } from "@/lib/review-scheduler";

// Parse standard CSV with quotes and commas
function parseCSV(text: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, ""); // Remove BOM
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if (char === "\r") {
        // ignore CR
      } else if (char === "\n") {
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * POST /api/reviews/import
 * Body: FormData with `file` (CSV) or JSON with `csvText`
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).user.id;

  try {
    let csvText = "";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) return NextResponse.json({ error: "No CSV file uploaded." }, { status: 400 });
      csvText = await file.text();
    } else {
      const json = await req.json();
      csvText = json.csvText || "";
    }

    if (!csvText.trim()) {
      return NextResponse.json({ error: "CSV content is empty." }, { status: 400 });
    }

    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      return NextResponse.json({ error: "CSV must contain headers and at least one review row." }, { status: 400 });
    }

    const headers = rows[0].map(h => h.toLowerCase().replace(/[\s_-]+/g, ""));

    // Find column indexes
    const profileIdIdx = headers.findIndex(h => h.includes("profileid"));
    const profileNameIdx = headers.findIndex(h => h.includes("profilename"));
    const resourceNameIdx = headers.findIndex(h => h.includes("resource") || h.includes("reviewname") || h.includes("resourcename"));
    const reviewIdIdx = headers.findIndex(h => h.includes("reviewid"));
    const reviewerNameIdx = headers.findIndex(h => h.includes("reviewer"));
    const ratingIdx = headers.findIndex(h => h.includes("rating"));
    const reviewDateIdx = headers.findIndex(h => h.includes("date") || h.includes("received"));
    const reviewCommentIdx = headers.findIndex(h => h.includes("customer") || h.includes("comment") || h.includes("reviewtext"));
    const ownerReplyIdx = headers.findIndex(h => h.includes("ownerreply") || h.includes("reply"));

    if (resourceNameIdx === -1 || ownerReplyIdx === -1) {
      return NextResponse.json({
        error: "Missing required columns in CSV: 'Review_Resource_Name' and 'Owner_Reply' are mandatory.",
      }, { status: 400 });
    }

    const dataRows = rows.slice(1);
    let scheduledCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Process each row
    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
      const row = dataRows[rowIndex];
      const lineNum = rowIndex + 2;

      const reviewResourceName = row[resourceNameIdx]?.trim();
      const ownerReply = row[ownerReplyIdx]?.trim();
      const profileId = profileIdIdx !== -1 ? row[profileIdIdx]?.trim() : "";
      const reviewerName = reviewerNameIdx !== -1 ? row[reviewerNameIdx]?.trim() : "";
      const reviewId = reviewIdIdx !== -1 ? row[reviewIdIdx]?.trim() : "";
      const ratingStr = ratingIdx !== -1 ? row[ratingIdx]?.trim() : "";
      const customerReview = reviewCommentIdx !== -1 ? row[reviewCommentIdx]?.trim() : "";
      const reviewDateStr = reviewDateIdx !== -1 ? row[reviewDateIdx]?.trim() : "";

      if (!reviewResourceName) {
        skippedCount++;
        continue;
      }

      // If owner reply is empty, skip
      if (!ownerReply) {
        skippedCount++;
        continue;
      }

      // Find location in DB
      let location = null;
      if (profileId) {
        location = await prisma.location.findUnique({ where: { id: profileId } });
      }

      // Fallback: search by account/location in review resource name
      if (!location && reviewResourceName.includes("locations/")) {
        const parts = reviewResourceName.split("/reviews/")[0]; // accounts/xxx/locations/yyy
        location = await prisma.location.findFirst({
          where: {
            OR: [
              { gbpLocationId: { contains: parts } },
              { name: row[profileNameIdx]?.trim() || undefined },
            ],
          },
        });
      }

      if (!location) {
        errors.push(`Row ${lineNum}: Profile could not be verified in database.`);
        continue;
      }

      // Calculate next available slot at 3-per-day limit
      const scheduledFor = await getNextAvailableReplySlot(location.id);

      // Sanitize rating and date against NaN / Invalid Date
      let parsedRating: number | null = null;
      if (ratingStr) {
        const r = parseInt(ratingStr, 10);
        if (!isNaN(r) && r >= 1 && r <= 5) parsedRating = r;
      }

      let parsedCreateTime: Date | null = null;
      if (reviewDateStr) {
        const d = new Date(reviewDateStr);
        if (!isNaN(d.getTime())) parsedCreateTime = d;
      }

      // Upsert into ScheduledReviewReply
      await prisma.scheduledReviewReply.upsert({
        where: {
          id: `scheduled-${location.id}-${reviewResourceName.replace(/[^a-zA-Z0-9]/g, "_")}`,
        },
        create: {
          id: `scheduled-${location.id}-${reviewResourceName.replace(/[^a-zA-Z0-9]/g, "_")}`,
          locationId: location.id,
          userId,
          reviewName: reviewResourceName,
          reviewId: reviewId || null,
          reviewerName: reviewerName || null,
          rating: parsedRating,
          reviewComment: customerReview || null,
          reviewCreateTime: parsedCreateTime,
          replyComment: ownerReply,
          scheduledFor,
          status: "SCHEDULED",
        },
        update: {
          replyComment: ownerReply,
          scheduledFor,
          status: "SCHEDULED",
          errorMessage: null,
        },
      });

      scheduledCount++;
    }

    return NextResponse.json({
      success: true,
      totalRows: dataRows.length,
      scheduledCount,
      skippedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error("[Import Reviews] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to process CSV import." }, { status: 500 });
  }
}
