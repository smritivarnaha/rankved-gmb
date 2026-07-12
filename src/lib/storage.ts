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

    // 2. Scrub Metadata & Convert/Optimize via Sharp
    // Sharp automatically removes all EXIF/metadata unless told otherwise.
    let cleanBuffer: Buffer;
    try {
      if (isPng) {
        cleanBuffer = await sharp(buffer)
          .png({ compressionLevel: 9 }) // lossless, crisp text/graphics
          .toBuffer();
      } else {
        cleanBuffer = await sharp(buffer)
          .jpeg({ quality: 100, chromaSubsampling: '4:4:4' }) // crisp jpegs
          .toBuffer();
      }
    } catch (err: any) {
      console.error("[Storage] Sharp processing failed:", err);
      // Fallback to original buffer if processing fails
      cleanBuffer = buffer;
    }

    // 3. Upload cleaned image to Supabase
    const extension = isPng ? "png" : "jpg";
    let filename = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;
    if (desiredFilename) {
      const slug = desiredFilename
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      if (slug) filename = `${slug}.${extension}`;
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
