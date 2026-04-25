/**
 * storage.ts
 *
 * Handles uploading images to Supabase Storage.
 */

export async function resolveImageUrl(
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
    const parts = imageDataUri.split(",");
    if (parts.length < 2) return { success: false, error: "Invalid image format" };
    
    const base64Data = parts[1];
    const mimeType = imageDataUri.match(/data:([^;]+)/)?.[1] || "image/jpeg";
    const buffer = Buffer.from(base64Data, "base64");

    const filename = `${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
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

    const publicUrl = `${cleanUrl}/storage/v1/object/public/post-images/${filename}`;
    return { success: true, url: publicUrl };
  } catch (err: any) {
    return { success: false, error: `Exception: ${err.message}` };
  }
}
