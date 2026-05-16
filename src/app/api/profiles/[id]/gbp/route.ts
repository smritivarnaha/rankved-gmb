import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getValidGoogleAccounts } from "@/lib/google-accounts";

const INFO_API_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const loc = await prisma.location.findUnique({ where: { id } });
    if (!loc) return NextResponse.json({ error: "Location not found" }, { status: 404 });

    const accounts = await getValidGoogleAccounts((session.user as any).id);
    if (!accounts.length) return NextResponse.json({ error: "No valid Google connection" }, { status: 401 });

    const accessToken = accounts[0].access_token;
    const locationName = loc.gbpLocationId;

    const res = await fetch(`${INFO_API_BASE}/${locationName}?readMask=title,profile,phoneNumbers,websiteUri,categories,regularHours,specialHours,serviceArea,attributes,metadata,storefrontAddress,labels`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Failed to fetch from Google API");

    // Fetch live logo as well
    let liveLogo = loc.logoUrl;
    try {
      // v4 media API needs full path: accounts/{acct}/locations/{loc}
      const mediaPath = `${loc.gbpAccountId}/${loc.gbpLocationId}`;
      const mediaRes = await fetch(
        `https://mybusiness.googleapis.com/v4/${mediaPath}/media?maxResults=10`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        const items = mediaData.mediaItems || [];
        const logo = items.find((m: any) => ["LOGO","PROFILE","COVER"].includes(m.locationAssociation?.category?.toUpperCase()))
                  || items.find((m: any) => ["LOGO","PROFILE","COVER"].includes(m.category?.toUpperCase()))
                  || items[0];
        if (logo?.googleUrl) {
          liveLogo = logo.googleUrl.split("=")[0] + "=s400";
        }
      }
    } catch (e) {
      console.warn("[GBP] Failed to fetch live logo:", e);
    }

    return NextResponse.json({ data: { ...data, logoUrl: liveLogo } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { 
      title, description, phone, website, categories, 
      regularHours, specialHours, serviceArea, attributes,
      morePhones, storefrontAddress, labels 
    } = body;

    const loc = await prisma.location.findUnique({ where: { id } });
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
    if (categories !== undefined) {
      payload.categories = categories;
      updateMask.push("categories");
    }
    if (regularHours !== undefined) {
      payload.regularHours = regularHours;
      updateMask.push("regularHours");
    }
    if (specialHours !== undefined) {
      payload.specialHours = specialHours;
      updateMask.push("specialHours");
    }
    if (serviceArea !== undefined) {
      payload.serviceArea = serviceArea;
      updateMask.push("serviceArea");
    }
    if (attributes !== undefined) {
      payload.attributes = attributes;
      updateMask.push("attributes");
    }
    if (morePhones !== undefined) {
      payload.phoneNumbers = { ...payload.phoneNumbers, additionalPhones: morePhones };
      updateMask.push("phoneNumbers.additionalPhones");
    }
    if (storefrontAddress !== undefined) {
      payload.storefrontAddress = storefrontAddress;
      updateMask.push("storefrontAddress");
    }
    if (labels !== undefined) {
      payload.labels = labels;
      updateMask.push("labels");
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
      where: { id },
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
