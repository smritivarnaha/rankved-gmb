import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { addDays } from "date-fns";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postIds, startDateISO, frequencyInterval } = await req.json();

    if (!Array.isArray(postIds) || postIds.length === 0 || !startDateISO || typeof frequencyInterval !== 'number') {
      return NextResponse.json({ error: "Invalid data provided" }, { status: 400 });
    }

    // Verify user has access to these posts
    const posts = await prisma.post.findMany({
      where: {
        id: { in: postIds },
        location: {
          client: {
            user: {
              OR: [
                { id: session.user.id },
                { ownerId: session.user.id },
              ]
            }
          }
        }
      }
    });

    if (posts.length === 0 && (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No accessible posts found" }, { status: 404 });
    }

    // Determine the exact posts we have access to
    const accessiblePostIds = (session.user as any).role === "SUPER_ADMIN" ? postIds : posts.map(p => p.id);

    // Maintain the order provided by the client
    const orderedPostIds = postIds.filter((id: string) => accessiblePostIds.includes(id));

    // startDateISO is already a proper UTC ISO string sent from the browser
    const baseDate = new Date(startDateISO);

    const updatePromises = orderedPostIds.map((id: string, index: number) => {
      const scheduledDate = addDays(baseDate, index * frequencyInterval);
      return prisma.post.update({
        where: { id },
        data: {
          status: "SCHEDULED",
          scheduledAt: scheduledDate,
        }
      });
    });

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ success: true, count: updatePromises.length });
  } catch (error: any) {
    console.error("Bulk schedule error:", error);
    return NextResponse.json({ error: "Failed to schedule posts" }, { status: 500 });
  }
}
