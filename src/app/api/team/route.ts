import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createUser, deleteUser } from "@/lib/user-store";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["SUPER_ADMIN", "AGENCY_OWNER"].includes((session as any).user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const role = (session as any).user.role;
  const userId = (session as any).user.id;

  const users = await prisma.user.findMany({
    where: role === "AGENCY_OWNER" ? { ownerId: userId } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      canPublishNow: true,
      canSchedule: true,
      minScheduleDays: true,
      createdAt: true,
      assignedLocations: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: users });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["SUPER_ADMIN", "AGENCY_OWNER"].includes((session as any).user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, username, email, password, role, canPublishNow, canSchedule, minScheduleDays, assignedLocations } = body;

    if (!name || !username || !password) {
      return NextResponse.json({ error: "Name, username, and password are required" }, { status: 400 });
    }

    const userId = (session as any).user.id;

    const user = await createUser({
      name,
      username,
      email: email || undefined,
      password,
      role: "TEAM_MEMBER",
      ownerId: userId,
      canPublishNow: canPublishNow ?? true,
      canSchedule: canSchedule ?? true,
      minScheduleDays: minScheduleDays ?? 0,
    });

    if (assignedLocations && assignedLocations.length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          assignedLocations: {
            connect: assignedLocations.map((locId: string) => ({ id: locId })),
          },
        },
      });
    }

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["SUPER_ADMIN", "AGENCY_OWNER"].includes((session as any).user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    const role = (session as any).user.role;
    const userId = (session as any).user.id;

    if (role === "AGENCY_OWNER") {
      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (!targetUser || targetUser.ownerId !== userId) {
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
