import prisma from "@/lib/prisma";

export interface Competitor {
  name: string;
  rank: number;
  placeId?: string;
  rating?: number;
  reviews?: number;
  address?: string;
}

export interface GridPoint {
  lat: number;
  lng: number;
  rank: number | null; // null if > 20
  competitors: Competitor[];
}

/**
 * Maps scan radius to optimal Google Maps zoom level
 */
function getGoogleMapsZoom(radiusKm: number): number {
  if (radiusKm <= 1.0) return 16;
  if (radiusKm <= 2.5) return 15;
  if (radiusKm <= 5.0) return 14;
  if (radiusKm <= 10.0) return 13;
  return 12;
}

/**
 * Strips punctuation and normalizes spaces for string comparison
 */
function cleanString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // strip punctuation
    .replace(/\s{2,}/g, " ")                     // normalize spaces
    .trim();
}

/**
 * Dynamic country code selection based on coordinates bounding box
 */
export function getCountryCodeByCoords(lat: number, lng: number): string {
  // India bounds: lat [8.0, 37.0], lng [68.0, 97.0]
  if (lat >= 8.0 && lat <= 37.0 && lng >= 68.0 && lng <= 97.0) {
    return "in";
  }
  // Australia bounds: lat [-44.0, -10.0], lng [112.0, 154.0]
  if (lat >= -44.0 && lat <= -10.0 && lng >= 112.0 && lng <= 154.0) {
    return "au";
  }
  // United Kingdom bounds: lat [49.0, 61.0], lng [-9.0, 2.0]
  if (lat >= 49.0 && lat <= 61.0 && lng >= -9.0 && lng <= 2.0) {
    return "uk";
  }
  // Canada bounds: lat [41.0, 83.0], lng [-141.0, -52.0]
  if (lat >= 41.0 && lat <= 83.0 && lng >= -141.0 && lng <= -52.0) {
    return "ca";
  }
  // US bounds fallback check: lat [24.0, 49.0], lng [-125.0, -66.0]
  if (lat >= 24.0 && lat <= 49.0 && lng >= -125.0 && lng <= -66.0) {
    return "us";
  }
  return "us"; // default fallback
}

/**
 * Generates grid points around a center coordinate.
 */
export function generateGridCoordinates(
  centerLat: number,
  centerLng: number,
  gridSize: number,
  sideLengthKm: number
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  
  if (gridSize < 1) return points;
  if (gridSize === 1) {
    return [{ lat: centerLat, lng: centerLng }];
  }

  const stepKm = sideLengthKm / (gridSize - 1);
  const halfSideKm = sideLengthKm / 2;
  const latDegreePerKm = 1.0 / 111.32;

  for (let i = 0; i < gridSize; i++) {
    const dy = halfSideKm - i * stepKm;
    const deltaLat = dy * latDegreePerKm;
    const pointLat = centerLat + deltaLat;
    const lngDegreePerKm = 1.0 / (111.32 * Math.cos((pointLat * Math.PI) / 180.0));

    for (let j = 0; j < gridSize; j++) {
      const dx = -halfSideKm + j * stepKm;
      const deltaLng = dx * lngDegreePerKm;
      const pointLng = centerLng + deltaLng;

      points.push({
        lat: parseFloat(pointLat.toFixed(6)),
        lng: parseFloat(pointLng.toFixed(6))
      });
    }
  }

  return points;
}

/**
 * Executes a single rank query at a coordinate point using the configured provider.
 */
export async function scanPointRank(
  provider: string,
  apiKey: string,
  keyword: string,
  lat: number,
  lng: number,
  targetPlaceName: string,
  targetPlaceId?: string,
  extraConfig?: { dataforseoUsername?: string; dataforseoPassword?: string; radiusKm?: number; address?: string }
): Promise<{ rank: number | null; competitors: Competitor[] }> {
  try {
    const radiusKm = extraConfig?.radiusKm || 2.5;

    if (provider === "serpapi") {
      return await scanViaSerpApi(apiKey, keyword, lat, lng, targetPlaceName, targetPlaceId, radiusKm);
    } else if (provider === "valueserp") {
      return await scanViaValueSerp(apiKey, keyword, lat, lng, targetPlaceName, targetPlaceId, radiusKm);
    } else if (provider === "dataforseo") {
      return await scanViaDataForSeo(
        apiKey,
        extraConfig?.dataforseoUsername || "",
        extraConfig?.dataforseoPassword || "",
        keyword,
        lat,
        lng,
        targetPlaceName,
        targetPlaceId
      );
    } else {
      throw new Error(`Unsupported SERP provider: ${provider}`);
    }
  } catch (error: any) {
    console.error(`[ScanPoint] Error at ${lat},${lng} using ${provider}:`, error.message);
    return { rank: null, competitors: [] };
  }
}

/**
 * SerpApi Google Maps Search Implementation
 */
async function scanViaSerpApi(
  apiKey: string,
  keyword: string,
  lat: number,
  lng: number,
  targetName: string,
  targetPlaceId?: string,
  radiusKm = 2.5
): Promise<{ rank: number | null; competitors: Competitor[] }> {
  const zoom = getGoogleMapsZoom(radiusKm);
  const gl = getCountryCodeByCoords(lat, lng);
  const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(keyword)}&ll=@${lat},${lng},${zoom}z&type=search&hl=en&gl=${gl}&api_key=${apiKey}`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`SerpApi responded with HTTP ${res.status}`);
  }

  const data = await res.json();
  const rawResults = data.local_results || [];

  return parseLocalResults(rawResults, targetName, targetPlaceId);
}

/**
 * Value SERP Google Maps Search Implementation
 */
async function scanViaValueSerp(
  apiKey: string,
  keyword: string,
  lat: number,
  lng: number,
  targetName: string,
  targetPlaceId?: string,
  radiusKm = 2.5
): Promise<{ rank: number | null; competitors: Competitor[] }> {
  const zoom = getGoogleMapsZoom(radiusKm);
  const gl = getCountryCodeByCoords(lat, lng);
  const url = `https://api.valueserp.com/search?engine=google_maps&q=${encodeURIComponent(keyword)}&ll=@${lat},${lng},${zoom}z&hl=en&gl=${gl}&api_key=${apiKey}`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Value SERP responded with HTTP ${res.status}`);
  }

  const data = await res.json();
  const rawResults = data.local_results || [];

  return parseLocalResults(rawResults, targetName, targetPlaceId);
}

/**
 * DataForSEO Live Google Maps Search Implementation
 */
async function scanViaDataForSeo(
  apiKey: string,
  username: string,
  password: string,
  keyword: string,
  lat: number,
  lng: number,
  targetName: string,
  targetPlaceId?: string
): Promise<{ rank: number | null; competitors: Competitor[] }> {
  const authString = Buffer.from(`${username}:${password || apiKey}`).toString("base64");
  
  const res = await fetch("https://api.dataforseo.com/v3/serp/google/maps/live/advanced", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${authString}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([
      {
        keyword: keyword,
        location_coordinate: `${lat},${lng}`,
        limit: 20
      }
    ])
  });

  if (!res.ok) {
    throw new Error(`DataForSEO responded with HTTP ${res.status}`);
  }

  const data = await res.json();
  const taskResult = data.tasks?.[0]?.result?.[0];
  const rawResults = taskResult?.items || [];

  const competitors: Competitor[] = [];
  let rank: number | null = null;

  const cleanTarget = cleanString(targetName);

  rawResults.forEach((item: any) => {
    if (item.type !== "maps_search") return;
    
    const itemRank = item.rank_group || item.rank_absolute;
    if (!itemRank) return;

    const comp: Competitor = {
      name: item.title || "",
      rank: itemRank,
      placeId: item.place_id,
      rating: item.rating?.value,
      reviews: item.rating?.votes_count,
      address: item.address
    };

    competitors.push(comp);

    // Dynamic clean matching
    const cleanComp = cleanString(item.title || "");
    const matchId = targetPlaceId && item.place_id === targetPlaceId;
    const matchName = cleanComp && (
      cleanComp === cleanTarget ||
      cleanComp.includes(cleanTarget) ||
      (cleanTarget.includes(cleanComp) && cleanComp.length > 8)
    );

    if ((matchId || matchName) && rank === null) {
      rank = itemRank;
    }
  });

  return {
    rank,
    competitors: competitors.slice(0, 10)
  };
}

/**
 * Common parsing logic for SerpApi and ValueSERP
 */
function parseLocalResults(
  rawResults: any[],
  targetName: string,
  targetPlaceId?: string
): { rank: number | null; competitors: Competitor[] } {
  const competitors: Competitor[] = [];
  let rank: number | null = null;

  const cleanTarget = cleanString(targetName);

  rawResults.forEach((item: any, idx: number) => {
    const itemRank = item.position || (idx + 1);
    
    const comp: Competitor = {
      name: item.title || "",
      rank: itemRank,
      placeId: item.place_id || item.data_id,
      rating: item.rating,
      reviews: item.reviews,
      address: item.address || item.address_info || item.vicinity
    };

    competitors.push(comp);

    // Dynamic clean matching
    const cleanComp = cleanString(item.title || "");
    const matchId = targetPlaceId && item.place_id === targetPlaceId;
    const matchName = cleanComp && (
      cleanComp === cleanTarget ||
      cleanComp.includes(cleanTarget) ||
      (cleanTarget.includes(cleanComp) && cleanComp.length > 8)
    );

    if ((matchId || matchName) && rank === null) {
      rank = itemRank;
    }
  });

  return {
    rank,
    competitors: competitors.slice(0, 10)
  };
}
