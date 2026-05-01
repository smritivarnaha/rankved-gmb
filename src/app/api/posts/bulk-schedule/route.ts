import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { addDays, setHours, setMinutes, parseISO } from "date-fns";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postIds, startDate, timeOfDay, frequencyInterval } = await req.json();

    if (!Array.isArray(postIds) || postIds.length === 0 || !startDate || !timeOfDay || typeof frequencyInterval !== 'number') {
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

    if (posts.length === 0 && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No accessible posts found" }, { status: 404 });
    }

    // Determine the exact posts we have access to
    const accessiblePostIds = session.user.role === "SUPER_ADMIN" ? postIds : posts.map(p => p.id);
    
    // Maintain the order provided by the client
    const orderedPostIds = postIds.filter(id => accessiblePostIds.includes(id));

    const [hours, minutes] = timeOfDay.split(':').map(Number);
    let currentDate = parseISO(startDate);
    currentDate = setHours(setMinutes(currentDate, minutes), hours);

    // Process updates sequentially to calculate dates
    const updatePromises = orderedPostIds.map((id, index) => {
      const scheduledDate = addDays(currentDate, index * frequencyInterval);
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
