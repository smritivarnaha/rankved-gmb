import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    const whereClause: any = { 
      client: { userId: session.user.id } 
    };
    
    if (clientId) {
      whereClause.clientId = clientId;
    }

    const locations = await prisma.location.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        website: true,
        gbpAccountId: true,
        gbpLocationId: true,
        clientId: true,
        logoUrl: true,
        googleEmail: true,
        isHidden: true,
        createdAt: true,
        client: {
          select: { name: true }
        }
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: locations });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
