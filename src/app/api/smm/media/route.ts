import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { resolveImageUrl } from "@/lib/storage";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const type = searchParams.get("type"); // IMAGE, VIDEO, DOCUMENT
    const query = searchParams.get("query");

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    // Verify access
    const userRole = session.user.role;
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const isAgencyOwner = userRole === "AGENCY_OWNER";

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        OR: isSuperAdmin ? undefined : [
          { userId: session.user.id },
          { smmAssignedUsers: { some: { id: session.user.id } } }
        ]
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found or access denied" }, { status: 404 });
    }

    const where: any = { clientId };
    if (type && type !== "ALL") {
      where.type = type;
    }
    if (query) {
      where.name = { contains: query, mode: "insensitive" };
    }

    const assets = await prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ data: assets });
  } catch (error: any) {
    console.error("GET SMM Media Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { clientId, name, type, fileData } = body; // fileData is base64 string starting with data:

    if (!clientId || !name || !type || !fileData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify client access
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        OR: session.user.role === "SUPER_ADMIN" ? undefined : [
          { userId: session.user.id },
          { smmAssignedUsers: { some: { id: session.user.id } } }
        ]
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found or access denied" }, { status: 404 });
    }

    let publicUrl = "";

    if (type === "IMAGE") {
      // Use existing resolveImageUrl to process and clean images
      const uploadResult = await resolveImageUrl(fileData, name);
      if (!uploadResult.success || !uploadResult.url) {
        return NextResponse.json({ error: uploadResult.error || "Failed to upload image" }, { status: 400 });
      }
      publicUrl = uploadResult.url;
    } else {
      // For videos/documents, upload directly to Supabase storage without Sharp image processing
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: "Supabase storage is not configured" }, { status: 500 });
      }

      let cleanUrl = supabaseUrl.replace(/\/+$/, "");
      if (cleanUrl.endsWith("/rest/v1")) cleanUrl = cleanUrl.replace("/rest/v1", "");

      const parts = fileData.split(",");
      if (parts.length < 2) {
        return NextResponse.json({ error: "Invalid file format" }, { status: 400 });
      }
      const buffer = Buffer.from(parts[1], "base64");
      
      const fileExt = name.split(".").pop() || (type === "VIDEO" ? "mp4" : "pdf");
      const filename = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const uploadUrl = `${cleanUrl}/storage/v1/object/post-images/${filename}`;
      
      let contentType = "application/octet-stream";
      if (type === "VIDEO") contentType = "video/mp4";
      if (type === "DOCUMENT") contentType = "application/pdf";

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": contentType,
          "x-upsert": "true",
        },
        body: buffer as any,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        return NextResponse.json({ error: `Supabase upload failed: ${errorText}` }, { status: 500 });
      }

      publicUrl = `${cleanUrl}/storage/v1/object/public/post-images/${filename}`;
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        clientId,
        name,
        url: publicUrl,
        type,
        sizeBytes: null // Optional metadata
      }
    });

    return NextResponse.json({ data: asset }, { status: 201 });
  } catch (error: any) {
    console.error("POST SMM Media Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
