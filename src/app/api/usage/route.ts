import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session as any).user.role;
  if (role !== "SUPER_ADMIN" && role !== "AGENCY_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Database Usage
    const dbSizeRaw = await prisma.$queryRaw`SELECT pg_database_size(current_database()) as size`;
    const dbSizeBytes = Number((dbSizeRaw as any)[0].size);
    const dbSizeMB = dbSizeBytes / (1024 * 1024);

    // 2. Post Count
    const postCount = await prisma.post.count();

    // 3. Estimated Image Storage
    // We don't have direct access to Supabase Storage API here without a management token,
    // so we'll estimate based on post count (avg 1.5MB per post with image)
    const postsWithImages = await prisma.post.count({
      where: { imageUrl: { not: null, startsWith: "http" } }
    });
    
    // Estimate: avg 1.5MB per image
    const estimatedImageStorageMB = postsWithImages * 1.5;

    return NextResponse.json({
      database: {
        usedMB: dbSizeMB.toFixed(2),
        totalMB: 500,
        percent: ((dbSizeMB / 500) * 100).toFixed(1)
      },
      images: {
        usedMB: estimatedImageStorageMB.toFixed(2),
        totalMB: 1000,
        count: postsWithImages,
        percent: ((estimatedImageStorageMB / 1000) * 100).toFixed(1)
      },
      posts: {
        total: postCount
      }
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json({ error: "Failed to fetch usage data" }, { status: 500 });
  }
}
