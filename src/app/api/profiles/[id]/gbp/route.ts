import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getValidGoogleAccounts } from "@/lib/google-accounts";

const INFO_API_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const loc = await prisma.location.findUnique({ where: { id: params.id } });
    if (!loc) return NextResponse.json({ error: "Location not found" }, { status: 404 });

    const accounts = await getValidGoogleAccounts((session.user as any).id);
    if (!accounts.length) return NextResponse.json({ error: "No valid Google connection" }, { status: 401 });

    const accessToken = accounts[0].access_token;
    const locationName = loc.gbpLocationId;

    const res = await fetch(`${INFO_API_BASE}/${locationName}?readMask=title,profile,phoneNumbers,websiteUri,categories,regularHours,specialHours`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Failed to fetch from Google API");

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, description, phone, website } = body;

    const loc = await prisma.location.findUnique({ where: { id: params.id } });
    if (!loc) return NextResponse.json({ error: "Location not found" }, { status: 404 });

    const accounts = await getValidGoogleAccounts((session.user as any).id);
    if (!accounts.length) return NextResponse.json({ error: "No valid Google connection" }, { status: 401 });

    const accessToken = accounts[0].access_token;
    const locationName = loc.gbpLocationId;

    // Construct the payload and updateMask for Google API
    const payload: any = {};
    const updateMask: string[] = [];

    if (title !== undefined) {
      payload.title = title;
      updateMask.push("title");
    }
    if (description !== undefined) {
      payload.profile = { description };
      updateMask.push("profile.description");
    }
    if (phone !== undefined) {
      payload.phoneNumbers = { primaryPhone: phone };
      updateMask.push("phoneNumbers.primaryPhone");
    }
    if (website !== undefined) {
      payload.websiteUri = website;
      updateMask.push("websiteUri");
    }

    if (updateMask.length === 0) return NextResponse.json({ success: true });

    const res = await fetch(`${INFO_API_BASE}/${locationName}?updateMask=${updateMask.join(",")}`, {
      method: "PATCH",
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Failed to update Google API");

    // Also update our local DB mirror
    await prisma.location.update({
      where: { id: params.id },
      data: {
        name: title !== undefined ? title : undefined,
        phone: phone !== undefined ? phone : undefined,
      }
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
