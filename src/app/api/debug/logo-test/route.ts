import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getValidGoogleAccounts } from "@/lib/google-accounts";

// GET /api/debug/logo-test
// Tests all logo fetching strategies for the FIRST profile and returns raw results
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).user.id;
  const validAccounts = await getValidGoogleAccounts(userId);

  if (validAccounts.length === 0) {
    return NextResponse.json({ error: "No connected Google accounts" }, { status: 400 });
  }

  const accessToken = validAccounts[0].access_token;
  const mapsKey = (process.env.GOOGLE_MAPS_API_KEY || "").replace(/["'\s\\]/g, "");

  const results: any = {
    mapsKeyPresent: !!mapsKey,
    mapsKeyLength: mapsKey.length,
    strategies: {}
  };

  // Step 1: Get first account + location with metadata
  const accountsRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const accountsData = await accountsRes.json();
  const account = accountsData.accounts?.[0];
  if (!account) return NextResponse.json({ error: "No GBP accounts found", accountsData });

  const accountName = account.name;
  results.accountName = accountName;

  const locUrl = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`);
  locUrl.searchParams.set("readMask", "name,title,metadata");
  locUrl.searchParams.set("pageSize", "1");

  const locRes = await fetch(locUrl.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  const locData = await locRes.json();
  const loc = locData.locations?.[0];
  if (!loc) return NextResponse.json({ error: "No locations found", locData });

  results.locationName = loc.name;
  results.locationTitle = loc.title;
  results.metadata = loc.metadata;
  const placeId = loc.metadata?.placeId;

  // Strategy 1: GBP Media API v4
  const v4Name = `${accountName}/${loc.name}`;
  const mediaRes = await fetch(
    `https://mybusiness.googleapis.com/v4/${v4Name}/media?maxResults=10`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  results.strategies.gbpMediaV4 = {
    url: `https://mybusiness.googleapis.com/v4/${v4Name}/media`,
    status: mediaRes.status,
    ok: mediaRes.ok,
    body: await mediaRes.json().catch(() => mediaRes.text())
  };

  // Strategy 2: Places API (New) with OAuth token
  if (placeId) {
    const placesNewRes = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Goog-FieldMask": "photos,displayName",
        }
      }
    );
    results.strategies.placesApiNew = {
      url: `https://places.googleapis.com/v1/places/${placeId}`,
      status: placesNewRes.status,
      ok: placesNewRes.ok,
      body: await placesNewRes.json().catch(() => placesNewRes.text())
    };
  } else {
    results.strategies.placesApiNew = { error: "No placeId in metadata" };
  }

  // Strategy 3: Classic Places API with Maps key
  if (placeId && mapsKey) {
    const classicRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos,name&key=${mapsKey}`
    );
    results.strategies.classicPlacesApi = {
      url: `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos,name`,
      status: classicRes.status,
      ok: classicRes.ok,
      body: await classicRes.json().catch(() => classicRes.text())
    };
  } else {
    results.strategies.classicPlacesApi = {
      error: !mapsKey ? "GOOGLE_MAPS_API_KEY not set in environment" : "No placeId"
    };
  }

  return NextResponse.json(results, { status: 200 });
}
