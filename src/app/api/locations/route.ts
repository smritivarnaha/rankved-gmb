import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

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
      include: {
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
