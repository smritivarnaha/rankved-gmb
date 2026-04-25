
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Manually implementing resolveImageUrl for the script
async function resolveImageUrl(imageDataUri) {
  if (imageDataUri.startsWith("http")) return { success: true, url: imageDataUri };
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) return { success: false, error: "Missing Supabase credentials" };

  let cleanUrl = supabaseUrl.replace(/\/+$/, "");
  try {
    const parts = imageDataUri.split(",");
    const base64Data = parts[1];
    const mimeType = imageDataUri.match(/data:([^;]+)/)?.[1] || "image/jpeg";
    const buffer = Buffer.from(base64Data, "base64");
    const filename = `migrated-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
    const uploadUrl = `${cleanUrl}/storage/v1/object/post-images/${filename}`;
    
    const fetch = (await import('node-fetch')).default;
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${supabaseKey}`, "Content-Type": mimeType, "x-upsert": "true" },
      body: buffer,
    });

    if (!uploadRes.ok) return { success: false, error: await uploadRes.text() };
    return { success: true, url: `${cleanUrl}/storage/v1/object/public/post-images/${filename}` };
  } catch (err) { return { success: false, error: err.message }; }
}

async function main() {
  const posts = await prisma.post.findMany({
    where: { mediaUrl: { startsWith: 'data:image' } }
  });

  console.log(`Found ${posts.length} posts with base64 images. Starting migration...`);

  for (const post of posts) {
    console.log(`Migrating post ${post.id} (${post.mediaUrl.length} chars)...`);
    const upload = await resolveImageUrl(post.mediaUrl);
    if (upload.success) {
      await prisma.post.update({
        where: { id: post.id },
        data: { mediaUrl: upload.url }
      });
      console.log(`  Done: ${upload.url}`);
    } else {
      console.error(`  Failed: ${upload.error}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
