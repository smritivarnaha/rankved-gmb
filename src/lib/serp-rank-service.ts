import prisma from "@/lib/prisma";

export interface Competitor {
  name: string;
  rank: number;
  placeId?: string;
  rating?: number;
  reviews?: number;
}

export interface GridPoint {
  lat: number;
  lng: number;
  rank: number | null; // null if > 20
  competitors: Competitor[];
}

/**
 * Generates grid points around a center coordinate.
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param gridSize Grid size (3 for 3x3, 5 for 5x5, 7 for 7x7)
 * @param sideLengthKm The total width/height side length of the grid in kilometers
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

  // Delta step size in kilometers
  const stepKm = sideLengthKm / (gridSize - 1);
  const halfSideKm = sideLengthKm / 2;

  // Degrees per kilometer
  const latDegreePerKm = 1.0 / 111.32;

  for (let i = 0; i < gridSize; i++) {
    // dy goes from north to south (+halfSideKm to -halfSideKm)
    const dy = halfSideKm - i * stepKm;
    const deltaLat = dy * latDegreePerKm;
    const pointLat = centerLat + deltaLat;

    // Approximate longitude scale factor based on point's latitude
    const lngDegreePerKm = 1.0 / (111.32 * Math.cos((pointLat * Math.PI) / 180.0));

    for (let j = 0; j < gridSize; j++) {
      // dx goes from west to east (-halfSideKm to +halfSideKm)
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
  extraConfig?: { dataforseoUsername?: string; dataforseoPassword?: string }
): Promise<{ rank: number | null; competitors: Competitor[] }> {
  try {
    if (provider === "serpapi") {
      return await scanViaSerpApi(apiKey, keyword, lat, lng, targetPlaceName, targetPlaceId);
    } else if (provider === "valueserp") {
      return await scanViaValueSerp(apiKey, keyword, lat, lng, targetPlaceName, targetPlaceId);
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
  targetPlaceId?: string
): Promise<{ rank: number | null; competitors: Competitor[] }> {
  const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(keyword)}&ll=@${lat},${lng},14z&type=search&api_key=${apiKey}`;
  
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
  targetPlaceId?: string
): Promise<{ rank: number | null; competitors: Competitor[] }> {
  const url = `https://api.valueserp.com/search?engine=google_maps&q=${encodeURIComponent(keyword)}&ll=@${lat},${lng},14z&api_key=${apiKey}`;
  
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
  // Use either base64 basic auth or credentials
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

  const cleanTargetName = targetName.toLowerCase().trim();

  rawResults.forEach((item: any) => {
    if (item.type !== "maps_search") return;
    
    const itemRank = item.rank_group || item.rank_absolute;
    if (!itemRank) return;

    const comp: Competitor = {
      name: item.title || "",
      rank: itemRank,
      placeId: item.place_id,
      rating: item.rating?.value,
      reviews: item.rating?.votes_count
    };

    competitors.push(comp);

    // Match place ID or name
    const matchId = targetPlaceId && item.place_id === targetPlaceId;
    const matchName = item.title && item.title.toLowerCase().trim() === cleanTargetName;

    if ((matchId || matchName) && rank === null) {
      rank = itemRank;
    }
  });

  return {
    rank,
    competitors: competitors.slice(0, 10) // Cache top 10 competitors
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

  const cleanTargetName = targetName.toLowerCase().trim();

  rawResults.forEach((item: any, idx: number) => {
    const itemRank = item.position || (idx + 1);
    
    const comp: Competitor = {
      name: item.title || "",
      rank: itemRank,
      placeId: item.place_id || item.data_id,
      rating: item.rating,
      reviews: item.reviews
    };

    competitors.push(comp);

    // Match place ID or title
    const matchId = targetPlaceId && item.place_id === targetPlaceId;
    const matchName = item.title && item.title.toLowerCase().trim() === cleanTargetName;

    if ((matchId || matchName) && rank === null) {
      rank = itemRank;
    }
  });

  return {
    rank,
    competitors: competitors.slice(0, 10)
  };
}
