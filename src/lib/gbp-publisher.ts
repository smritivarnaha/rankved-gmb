/**
 * gbp-publisher.ts
 *
 * Handles all actual Google Business Profile API calls to publish local posts.
 * Uses the My Business API v4.
 */

import { PostData } from "./post-store";
import prisma from "@/lib/prisma";

const GBP_BASE = "https://mybusiness.googleapis.com/v4";

const CTA_MAP: Record<string, string> = {
  BOOK: "BOOK",
  ORDER: "ORDER",
  LEARN_MORE: "LEARN_MORE",
  SIGN_UP: "SIGN_UP",
  CALL: "CALL",
  BUY: "BUY",
  GET_OFFER: "GET_OFFER",
};

interface PublishOptions {
  post: PostData;
  accessToken: string;
  imageDataUri?: string | null; // base64 data URI from editor
}

interface PublishResult {
  success: boolean;
  gbpPostName?: string;
  error?: string;
}

/**
 * Uploads a base64 image to GBP Media API and returns the mediaKey/sourceUrl.
 * GBP does NOT accept base64 directly — it needs a publicly reachable URL.
 * 
 * For now: if a public URL is given (starts with http), use it directly.
 * If base64: upload to Supabase storage first (requires SUPABASE_URL + SUPABASE_SERVICE_KEY).
 */
async function resolveImageUrlDetail(
  imageDataUri: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  // If it's already a public URL, use directly
  if (imageDataUri.startsWith("http")) {
    return { success: true, url: imageDataUri };
  }

  // It's a base64 data URI — try to upload to Supabase storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) return { success: false, error: "Missing NEXT_PUBLIC_SUPABASE_URL" };
  if (!supabaseKey) return { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };

  let cleanUrl = supabaseUrl.replace(/\/+$/, "");
  if (cleanUrl.endsWith("/rest/v1")) cleanUrl = cleanUrl.replace("/rest/v1", "");

  try {
    const base64Data = imageDataUri.split(",")[1];
    if (!base64Data) return { success: false, error: "Invalid image format" };
    
    const mimeType = imageDataUri.match(/data:([^;]+)/)?.[1] || "image/jpeg";
    const buffer = Buffer.from(base64Data, "base64");

    const filename = `${Date.now()}.jpg`;
    const uploadUrl = `${cleanUrl}/storage/v1/object/post-images/${filename}`;
    
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": mimeType,
        "x-upsert": "true",
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      return { success: false, error: `Supabase Error (${uploadRes.status}): ${errorText}` };
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/post-images/${filename}`;
    return { success: true, url: publicUrl };
  } catch (err: any) {
    return { success: false, error: `Exception: ${err.message}` };
  }
}

/**
 * Publishes a post to Google Business Profile.
 */
export async function publishToGBP(opts: PublishOptions): Promise<PublishResult> {
  const { post, accessToken, imageDataUri } = opts;

  if (!post.profileId) {
    return { success: false, error: "No profile/location selected for this post." };
  }

  // profileId could be the GBP location resource name e.g. "accounts/123/locations/456"
  // OR it could be the UUID of our local Prisma 'Location' model.
  let locationName: string | null = null;
  
  if (post.profileId.startsWith("accounts/")) {
    locationName = post.profileId;
  } else {
    // Look up the actual location in the DB to get the gbpName
    try {
      const loc = await prisma.location.findUnique({
        where: { id: post.profileId },
        select: { gbpAccountId: true, gbpLocationId: true }
      });
      if (loc && loc.gbpAccountId && loc.gbpLocationId) {
        const accId = loc.gbpAccountId.replace("accounts/", "");
        const locId = loc.gbpLocationId.replace("locations/", "");
        locationName = `accounts/${accId}/locations/${locId}`;
      }
    } catch (err) {
      console.error("[GBP] Failed to resolve location UUID:", err);
    }
  }

  if (!locationName) {
    return {
      success: false,
      error: `Invalid location ID format: "${post.profileId}". Expected "accounts/.../locations/..."`,
    };
  }

  // Build the GBP local post payload
  const payload: Record<string, any> = {
    languageCode: "en",
    summary: post.summary,
    topicType: post.topicType || "STANDARD",
  };

  // CTA
  if (post.ctaType && post.ctaType !== "CALL") {
    const actionType = CTA_MAP[post.ctaType] || post.ctaType;
    payload.callToAction = {
      actionType,
      url: post.ctaUrl || undefined,
    };
  } else if (post.ctaType === "CALL") {
    payload.callToAction = { actionType: "CALL" };
  }

  // Event fields
  if (post.topicType === "EVENT" && post.eventTitle) {
    payload.event = {
      title: post.eventTitle,
      schedule: {
        startDate: toDateObj(post.eventStart),
        endDate: toDateObj(post.eventEnd),
      },
    };
  }

  // Offer type
  if (post.topicType === "OFFER") {
    payload.offer = {};
  }

  // Image
  if (imageDataUri) {
    const uploadResult = await resolveImageUrlDetail(imageDataUri);
    if (!uploadResult.success) {
      return { 
        success: false, 
        error: `Image Upload Failed: ${uploadResult.error}` 
      };
    }
    payload.media = [{ mediaFormat: "PHOTO", sourceUrl: uploadResult.url! }];
  }

  console.log(`[GBP] Publishing to ${locationName}:`, JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(`${GBP_BASE}/${locationName}/localPosts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[GBP] Publish failed:", res.status, JSON.stringify(data));
      const message = data?.error?.message || data?.error || `GBP API error ${res.status}`;
      return { success: false, error: message };
    }

    if (data.state === "REJECTED") {
      console.error("[GBP] Post was created but instantly REJECTED by Google:", JSON.stringify(data));
      return { success: false, error: "Google instantly rejected this post. This usually happens if your image violates policy, or if your Supabase 'post-images' bucket is not set to Public (so Google couldn't download the image)." };
    }

    console.log("[GBP] Published successfully:", data.name, data.state);
    return { success: true, gbpPostName: data.name };
  } catch (err: any) {
    console.error("[GBP] Publish exception:", err);
    return { success: false, error: err.message || "Network error calling GBP API" };
  }
}

function toDateObj(dateStr: string | undefined): object | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}
