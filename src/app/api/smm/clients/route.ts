import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;
    const isSuperAdmin = role === "SUPER_ADMIN";
    const isAgencyOwner = role === "AGENCY_OWNER";

    let clients;

    if (isSuperAdmin) {
      clients = await prisma.client.findMany({
        include: {
          smmAssignedUsers: {
            select: { id: true, name: true, email: true, role: true }
          },
          _count: {
            select: { socialAccounts: true, smmPosts: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
    } else if (isAgencyOwner) {
      clients = await prisma.client.findMany({
        where: {
          userId: userId
        },
        include: {
          smmAssignedUsers: {
            select: { id: true, name: true, email: true, role: true }
          },
          _count: {
            select: { socialAccounts: true, smmPosts: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
    } else {
      // Team members can only see clients they are assigned to
      clients = await prisma.client.findMany({
        where: {
          smmAssignedUsers: {
            some: { id: userId }
          }
        },
        include: {
          smmAssignedUsers: {
            select: { id: true, name: true, email: true, role: true }
          },
          _count: {
            select: { socialAccounts: true, smmPosts: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
    }

    return NextResponse.json({ data: clients });
  } catch (error: any) {
    console.error("GET SMM Clients Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "SUPER_ADMIN" && role !== "AGENCY_OWNER" && role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions to create clients" }, { status: 403 });
    }

    const body = await req.json();
    const { name, businessClinicName, contactPerson, email, phone, status, description, website, logo, assignedUserIds } = body;

    if (!name) {
      return NextResponse.json({ error: "Client Name is required" }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        name,
        businessClinicName,
        contactPerson,
        email,
        phone,
        status: status || "ACTIVE",
        description,
        website,
        logo,
        userId: session.user.id,
        smmAssignedUsers: assignedUserIds && assignedUserIds.length > 0 ? {
          connect: assignedUserIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        smmAssignedUsers: true
      }
    });

    return NextResponse.json({ data: client }, { status: 201 });
  } catch (error: any) {
    console.error("POST SMM Clients Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
