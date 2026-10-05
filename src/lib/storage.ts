/**
 * storage.ts
 *
 * Handles uploading images to Supabase Storage and scrubs metadata.
 */
import sharp from "sharp";

export async function resolveImageUrl(
  imageDataUri: string,
  desiredFilename?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) return { success: false, error: "Missing NEXT_PUBLIC_SUPABASE_URL" };
  if (!supabaseKey) return { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };

  let cleanUrl = supabaseUrl.replace(/\/+$/, "");
  if (cleanUrl.endsWith("/rest/v1")) cleanUrl = cleanUrl.replace("/rest/v1", "");

  try {
    let buffer: Buffer;
    let isPng = false;

    // 1. Get raw buffer from either HTTP URL or Data URI
    if (imageDataUri.startsWith("http")) {
      // If it's already an image from our own storage, just return it.
      if (imageDataUri.includes("supabase.co") || imageDataUri.includes("supabase.in")) {
        return { success: true, url: imageDataUri };
      }
      
      // External URL (e.g. DALL-E 3, Google). Download to scrub metadata.
      const res = await fetch(imageDataUri);
      if (!res.ok) {
        return { success: false, error: "Failed to download external image for processing" };
      }
      const contentType = res.headers.get("content-type") || "";
      if (contentType.toLowerCase().includes("png")) {
        isPng = true;
      }
      const arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // Data URI
      const parts = imageDataUri.split(",");
      if (parts.length < 2) return { success: false, error: "Invalid image format" };
      if (parts[0].toLowerCase().includes("image/png")) {
        isPng = true;
      }
      buffer = Buffer.from(parts[1], "base64");
    }

    // 2. Scrub Metadata, Auto-Orient, Resize & Optimize via Sharp
    // Limits max dimension to 1800px to prevent server memory exhaustion while preserving crisp quality
    let cleanBuffer: Buffer;
    try {
      const sharpInstance = sharp(buffer).rotate().resize({
        width: 1800,
        height: 1800,
        fit: "inside",
        withoutEnlargement: true,
      });

      if (isPng) {
        cleanBuffer = await sharpInstance
          .png({ compressionLevel: 6, adaptiveFiltering: true })
          .toBuffer();
      } else {
        cleanBuffer = await sharpInstance
          .jpeg({ quality: 90, mozjpeg: true })
          .toBuffer();
      }
    } catch (err: any) {
      console.error("[Storage] Sharp processing failed:", err);
      // Fallback to original buffer if processing fails
      cleanBuffer = buffer;
    }

    // 3. Upload cleaned image to Supabase with guaranteed UNIQUE filename
    // Including a unique timestamp + random token prevents posts with identical focus keywords
    // from overwriting each other's graphics or duplicating across drafts.
    const extension = isPng ? "png" : "jpg";
    const uniqueToken = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let filename = `${uniqueToken}.${extension}`;
    if (desiredFilename) {
      const slug = desiredFilename
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      if (slug) filename = `${slug}-${uniqueToken}.${extension}`;
    }
    const uploadUrl = `${cleanUrl}/storage/v1/object/post-images/${filename}`;
    
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": isPng ? "image/png" : "image/jpeg",
        "x-upsert": "true",
      },
      body: cleanBuffer as any,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      return { success: false, error: `Supabase Error (${uploadRes.status}): ${errorText}` };
    }

    const publicUrl = `${cleanUrl}/storage/v1/object/public/post-images/${filename}`;
    return { success: true, url: publicUrl };
  } catch (err: any) {
    return { success: false, error: `Exception: ${err.message}` };
  }
}
