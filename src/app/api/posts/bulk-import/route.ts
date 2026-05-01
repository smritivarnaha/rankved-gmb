import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { locationId, posts } = await req.json();

    if (!locationId || !Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: "Invalid data provided" }, { status: 400 });
    }

    // Verify user has access to this location
    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        client: {
          user: {
            OR: [
              { id: session.user.id },
              { ownerId: session.user.id },
            ]
          }
        }
      }
    });

    if (!location && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Location not found or access denied" }, { status: 404 });
    }

    // Prepare data
    const dataToInsert = posts.map((post: any) => ({
      locationId: locationId,
      userId: session.user.id,
      summary: (post.summary || "").substring(0, 1500),
      ctaType: post.ctaType || null,
      ctaUrl: post.ctaUrl || null,
      status: "DRAFT",
    }));

    await prisma.post.createMany({
      data: dataToInsert,
    });

    return NextResponse.json({ success: true, count: dataToInsert.length });
  } catch (error: any) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: "Failed to import posts" }, { status: 500 });
  }
}
