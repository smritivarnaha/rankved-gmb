import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateGridCoordinates, scanPointRank } from "@/lib/serp-rank-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Restrict to ADMIN/AGENCY_OWNER/SUPER_ADMIN
  const role = (session.user as any).role;
  const allowedRoles = ["SUPER_ADMIN", "AGENCY_OWNER"];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const { keyword, gridSize, radiusKm } = await req.json();

    if (!keyword) {
      return NextResponse.json({ error: "Search keyword is required." }, { status: 400 });
    }

    const parsedGridSize = parseInt(gridSize, 10) || 3;
    const parsedRadiusKm = parseFloat(radiusKm) || 2.5;

    // Safety bounds check
    if (parsedGridSize !== 3 && parsedGridSize !== 5 && parsedGridSize !== 7) {
      return NextResponse.json({ error: "Grid size must be 3x3, 5x5, or 7x7." }, { status: 400 });
    }
    if (parsedRadiusKm <= 0 || parsedRadiusKm > 50) {
      return NextResponse.json({ error: "Radius must be between 0.1km and 50km." }, { status: 400 });
    }

    // 1. Fetch location
    const location = await prisma.location.findUnique({
      where: { id }
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // 2. Fetch SERP Configuration settings
    const settings = await prisma.globalSetting.findUnique({
      where: { id: "settings" }
    });

    const apiKey = settings?.serpApiKey;
    const provider = settings?.serpProvider || "serpapi";

    if (!apiKey) {
      return NextResponse.json({
        error: "SERP scan credentials are not configured. Please enter your API key in Admin Settings."
      }, { status: 400 });
    }

    // 3. Resolve Lat/Lng coordinates if missing
    let lat = location.lat;
    let lng = location.lng;

    if (!lat || !lng) {
      try {
        // Run quick fallback geocoding via Nominatim
        const addressQuery = location.address || location.name;
        const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}&format=json&limit=1`;
        const geoRes = await fetch(geoUrl, {
          headers: { "User-Agent": "GBP-Scheduler/1.0" }
        });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lng = parseFloat(geoData[0].lon);

            // Update DB cache
            await prisma.location.update({
              where: { id },
              data: { lat, lng }
            });
          }
        }
      } catch (err) {
        console.error("[ScanAPI] Automatic geocode fallback failed:", err);
      }
    }

    if (!lat || !lng) {
      return NextResponse.json({
        error: "Location coordinates (Lat/Lng) are missing. Please geocode this profile first."
      }, { status: 400 });
    }

    // 4. Generate grid coordinates
    const gridPoints = generateGridCoordinates(lat, lng, parsedGridSize, parsedRadiusKm);

    // 5. Query all coordinates in parallel (with concurrency handling/waiting)
    const scanPromises = gridPoints.map(point =>
      scanPointRank(
        provider,
        apiKey,
        keyword,
        point.lat,
        point.lng,
        location.name,
        undefined, // targetPlaceId match fallback
        {
          dataforseoUsername: settings?.dataforseoUsername || "",
          dataforseoPassword: settings?.dataforseoPassword || ""
        }
      )
    );

    const results = await Promise.all(scanPromises);

    // 6. Save results to Database
    const rankScan = await prisma.rankScan.create({
      data: {
        locationId: id,
        keyword,
        gridSize: parsedGridSize,
        radiusKm: parsedRadiusKm,
        points: {
          create: gridPoints.map((pt, idx) => ({
            lat: pt.lat,
            lng: pt.lng,
            rank: results[idx].rank,
            competitors: results[idx].competitors as any
          }))
        }
      },
      include: {
        points: true
      }
    });

    return NextResponse.json({ success: true, data: rankScan });

  } catch (error: any) {
    console.error("[ScanAPI] Execution Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
