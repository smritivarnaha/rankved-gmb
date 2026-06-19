import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "SUPER_ADMIN" && role !== "AGENCY_OWNER" && role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, businessClinicName, contactPerson, email, phone, status, description, website, logo, assignedUserIds } = body;

    // First disconnect all currently assigned team members, then connect new ones if provided
    const updateData: any = {
      name,
      businessClinicName,
      contactPerson,
      email,
      phone,
      status,
      description,
      website,
      logo
    };

    if (assignedUserIds) {
      updateData.smmAssignedUsers = {
        set: assignedUserIds.map((userId: string) => ({ id: userId }))
      };
    }

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
      include: {
        smmAssignedUsers: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    return NextResponse.json({ data: client });
  } catch (error: any) {
    console.error("PUT SMM Client Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "SUPER_ADMIN" && role !== "AGENCY_OWNER") {
      return NextResponse.json({ error: "Forbidden: Only Agency Owners or Super Admins can delete clients" }, { status: 403 });
    }

    await prisma.client.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Client deleted successfully" });
  } catch (error: any) {
    console.error("DELETE SMM Client Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
