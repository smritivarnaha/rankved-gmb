import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createUser } from "@/lib/user-store";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session as any).user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isApproved: true,
      createdAt: true,
    },
  });

  const totalUsers = users.length;
  const totalProfiles = await prisma.location.count();
  const totalPosts = await prisma.post.count();

  return NextResponse.json({ 
    data: users,
    stats: { totalUsers, totalProfiles, totalPosts }
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session as any).user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const newUser = await createUser({
      name: body.name,
      username: body.username,
      email: body.email || undefined,
      password: body.password,
      role: "AGENCY_OWNER",
      canPublishNow: true,
      minScheduleDays: 0,
    });
    return NextResponse.json({ data: newUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
