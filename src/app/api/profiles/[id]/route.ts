import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAllProfiles } from "@/lib/profile-store";

// GET /api/profiles/[id] — fetch a single profile by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId  = (session as any).user.id;
  const role    = (session as any).user.role;
  const ownerId = (session as any).user.ownerId;

  // Reuse the existing store — filter for this specific profile
  const all     = await getAllProfiles(userId, role, ownerId);
  const profile = all.find((p: any) => p.id === id);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ data: profile });
}
