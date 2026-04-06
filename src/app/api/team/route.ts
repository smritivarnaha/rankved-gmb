import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAllUsers, createUser, deleteUser } from "@/lib/user-store";

// GET /api/team — list all team members
export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session as any)?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const users = getAllUsers();
  return NextResponse.json({ data: users });
}

// POST /api/team — create a new team member
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session as any)?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const user = createUser({
      name,
      email,
      password,
      role: role || "TEAM",
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// DELETE /api/team — delete a team member
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session as any)?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
