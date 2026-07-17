import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Restrict to ADMIN/AGENCY_OWNER/SUPER_ADMIN for safety
  const role = (session.user as any).role;
  const allowedRoles = ["SUPER_ADMIN", "AGENCY_OWNER"];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const location = await prisma.location.findUnique({
      where: { id }
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // If coordinates are already cached, return them!
    if (location.lat && location.lng) {
      return NextResponse.json({
        lat: location.lat,
        lng: location.lng,
        cached: true
      });
    }

    // Retrieve global settings for API key
    const settings = await prisma.globalSetting.findUnique({
      where: { id: "settings" }
    });

    const apiKey = settings?.serpApiKey;
    const provider = settings?.serpProvider || "serpapi";

    let lat: number | null = null;
    let lng: number | null = null;
    let placeId: string | null = null;

    if (apiKey) {
      try {
        if (provider === "serpapi") {
          const query = `${location.name} ${location.address || ""}`;
          const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const placeResults = data.place_results;
            if (placeResults && placeResults.gps_coordinates) {
              lat = placeResults.gps_coordinates.latitude;
              lng = placeResults.gps_coordinates.longitude;
              placeId = placeResults.place_id || null;
            } else if (data.local_results && data.local_results.length > 0) {
              const matched = data.local_results[0];
              if (matched.gps_coordinates) {
                lat = matched.gps_coordinates.latitude;
                lng = matched.gps_coordinates.longitude;
              }
              placeId = matched.place_id || null;
            }
          }
        } else if (provider === "valueserp") {
          const query = `${location.name} ${location.address || ""}`;
          const url = `https://api.valueserp.com/search?engine=google_maps&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const placeResults = data.place_results;
            if (placeResults && placeResults.gps_coordinates) {
              lat = placeResults.gps_coordinates.latitude;
              lng = placeResults.gps_coordinates.longitude;
              placeId = placeResults.place_id || null;
            } else if (data.local_results && data.local_results.length > 0) {
              const matched = data.local_results[0];
              if (matched.gps_coordinates) {
                lat = matched.gps_coordinates.latitude;
                lng = matched.gps_coordinates.longitude;
              }
              placeId = matched.place_id || null;
            }
          }
        } else if (provider === "dataforseo" && settings?.dataforseoUsername) {
          const authString = Buffer.from(`${settings.dataforseoUsername}:${settings.dataforseoPassword || apiKey}`).toString("base64");
          const query = `${location.name} ${location.address || ""}`;
          const res = await fetch("https://api.dataforseo.com/v3/serp/google/maps/live/advanced", {
            method: "POST",
            headers: {
              "Authorization": `Basic ${authString}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify([
              {
                keyword: query,
                limit: 1
              }
            ])
          });

          if (res.ok) {
            const data = await res.json();
            const matched = data.tasks?.[0]?.result?.[0]?.items?.[0];
            if (matched && matched.type === "maps_search") {
              // Geocode by matching first local result coordinates if any
              // DataForSEO doesn't return coordinates directly in maps_search live item,
              // so let's fall back to nominatim
            }
          }
        }
      } catch (err) {
        console.error("[GeocodeAPI] SERP geocode failed:", err);
      }
    }

    // Fall back to public Nominatim Geocoding if SERP geocoding failed or returned nothing
    if (!lat || !lng) {
      try {
        const addressQuery = location.address || location.name;
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}&format=json&limit=1`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "GBP-Scheduler/1.0 (smritivarnaha/rankved-gmb)"
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
          }
        }
      } catch (err) {
        console.error("[GeocodeAPI] Nominatim geocode failed:", err);
      }
    }

    // If still not found, return error
    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Could not geocode address. Please set coordinates manually or update the address." },
        { status: 400 }
      );
    }

    // Cache the coordinates in the Location model
    await prisma.location.update({
      where: { id },
      data: { lat, lng }
    });

    return NextResponse.json({
      lat,
      lng,
      cached: false
    });
  } catch (error: any) {
    console.error("[GeocodeAPI] Main Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
