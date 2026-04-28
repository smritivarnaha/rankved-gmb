import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/prompts — list all prompts (all approved users)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(session as any).user.isApproved) {
    return NextResponse.json({ error: "Your account is pending approval." }, { status: 403 });
  }

  try {
    const prompts = await prisma.promptTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true }
        }
      }
    });
    return NextResponse.json({ data: prompts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/prompts — create a new prompt (Admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const role = (session as any).user.role;
  const userId = (session as any).user.id;

  if (!["SUPER_ADMIN", "AGENCY_OWNER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
  }

  try {
    const { title, content } = await req.json();
    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const prompt = await prisma.promptTemplate.create({
      data: {
        title,
        content,
        userId
      }
    });

    return NextResponse.json({ data: prompt }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// PUT /api/prompts — update an existing prompt (Admin only)
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const role = (session as any).user.role;
  if (!["SUPER_ADMIN", "AGENCY_OWNER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
  }

  try {
    const { id, title, content } = await req.json();
    if (!id || !title || !content) {
      return NextResponse.json({ error: "ID, title, and content are required" }, { status: 400 });
    }

    const prompt = await prisma.promptTemplate.update({
      where: { id },
      data: { title, content }
    });

    return NextResponse.json({ data: prompt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// DELETE /api/prompts?id=xxx — delete a prompt (Admin only)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const role = (session as any).user.role;
  if (!["SUPER_ADMIN", "AGENCY_OWNER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    await prisma.promptTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
