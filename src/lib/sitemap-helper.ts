import prisma from "./prisma";

// Clean website URL to get the base origin (e.g. https://example.com)
export function getDomainOrigin(websiteUrl: string): string | null {
  if (!websiteUrl) return null;
  let clean = websiteUrl.trim();
  if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    clean = "https://" + clean;
  }
  try {
    const url = new URL(clean);
    return url.origin;
  } catch {
    return null;
  }
}

// Fetch and parse URLs from a sitemap XML URL
async function fetchAndParseXml(url: string): Promise<string[]> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) {
      console.warn(`Sitemap fetch failed for ${url} with status ${res.status}`);
      return [];
    }
    const text = await res.text();

    const locRegex = /<loc>(https?:\/\/[^<]+)<\/loc>/gi;
    const urls: string[] = [];
    let match;

    while ((match = locRegex.exec(text)) !== null) {
      urls.push(match[1].trim());
    }

    return urls;
  } catch (err) {
    console.error(`Sitemap helper error fetching ${url}:`, err);
    return [];
  }
}

// Automatically discover, fetch, and update sitemaps for a location
export async function autoFetchLocationSitemap(locationId: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const location = await prisma.location.findUnique({
      where: { id: locationId }
    });

    if (!location) {
      return { success: false, count: 0, error: "Location not found" };
    }

    const websiteUrl = location.website || location.aiWebsite;
    if (!websiteUrl) {
      return { success: false, count: 0, error: "No website configured on this profile" };
    }

    const origin = getDomainOrigin(websiteUrl);
    if (!origin) {
      return { success: false, count: 0, error: "Invalid website URL format" };
    }

    const postSitemapUrl = `${origin}/post-sitemap.xml`;
    const pageSitemapUrl = `${origin}/page-sitemap.xml`;

    console.log(`[Sitemap Auto] Fetching post & page sitemaps for ${location.name} (${origin})`);
    
    // Fetch both in parallel
    const [postUrls, pageUrls] = await Promise.all([
      fetchAndParseXml(postSitemapUrl),
      fetchAndParseXml(pageSitemapUrl)
    ]);

    const combined = [...postUrls, ...pageUrls];
    
    // Remove duplicates, trim, and filter out category, tag, author, or other non-item pages
    const filtered = Array.from(new Set(combined))
      .map(u => u.trim())
      .filter(u => {
        const lower = u.toLowerCase();
        // Ignore files, feeds, category, tag, author URLs
        if (lower.endsWith(".xml") || lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif")) return false;
        if (lower.includes("/category/") || lower.includes("/tag/") || lower.includes("/author/") || lower.includes("/feed/")) return false;
        return true;
      });

    if (filtered.length === 0) {
      // Fallback: try parsing the main sitemap.xml in case they don't have separate post/page sitemaps
      console.log(`[Sitemap Auto] No URLs found in post/page sitemaps. Trying main sitemap.xml for fallback...`);
      const mainSitemapUrl = `${origin}/sitemap.xml`;
      const mainUrls = await fetchAndParseXml(mainSitemapUrl);
      
      const filteredMain = mainUrls
        .map(u => u.trim())
        .filter(u => {
          const lower = u.toLowerCase();
          if (lower.endsWith(".xml")) return false; // Ignore index sitemaps
          if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif")) return false;
          if (lower.includes("/category/") || lower.includes("/tag/") || lower.includes("/author/") || lower.includes("/feed/")) return false;
          return true;
        });

      if (filteredMain.length > 0) {
        filtered.push(...filteredMain);
      }
    }

    // Save/Update in DB
    await prisma.location.update({
      where: { id: locationId },
      data: {
        sitemapUrl: `${origin}/sitemap.xml`,
        sitemapUrls: filtered,
        sitemapUpdatedAt: new Date(),
      }
    });

    return {
      success: true,
      count: filtered.length
    };
  } catch (err: any) {
    console.error(`Sitemap update error for ${locationId}:`, err);
    return { success: false, count: 0, error: err.message };
  }
}

export async function parseCustomSitemap(locationId: string, sitemapUrl: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    let urls: string[] = [];
    
    // If user enters page-sitemap, post-sitemap, or a domain-only URL (no .xml), automatically fetch both page & post sitemaps!
    const isPageSitemap = sitemapUrl.toLowerCase().endsWith("page-sitemap.xml");
    const isPostSitemap = sitemapUrl.toLowerCase().endsWith("post-sitemap.xml");
    const isDomainOnly = !sitemapUrl.toLowerCase().endsWith(".xml");
    
    if (isPageSitemap || isPostSitemap || isDomainOnly) {
      const origin = getDomainOrigin(sitemapUrl);
      if (origin) {
        const postSitemapUrl = `${origin}/post-sitemap.xml`;
        const pageSitemapUrl = `${origin}/page-sitemap.xml`;
        console.log(`[Sitemap Custom] Auto-fetching both post & page sitemaps from origin: ${origin}`);
        
        let [postUrls, pageUrls] = await Promise.all([
          fetchAndParseXml(postSitemapUrl),
          fetchAndParseXml(pageSitemapUrl)
        ]);
        
        // Fallback: if both returned empty and it's domain-only, try sitemap.xml
        if (postUrls.length === 0 && pageUrls.length === 0 && isDomainOnly) {
          console.log(`[Sitemap Custom] No post/page sitemaps found. Trying main sitemap.xml fallback for: ${origin}`);
          const mainSitemapUrl = `${origin}/sitemap.xml`;
          pageUrls = await fetchAndParseXml(mainSitemapUrl);
        }
        
        urls = [...postUrls, ...pageUrls];
      } else {
        urls = await fetchAndParseXml(sitemapUrl);
      }
    } else {
      urls = await fetchAndParseXml(sitemapUrl);
    }

    const filtered = urls
      .map(u => u.trim())
      .filter(u => {
        const lower = u.toLowerCase();
        if (lower.endsWith(".xml")) return false; // Ignore index sitemaps
        if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif")) return false;
        if (lower.includes("/category/") || lower.includes("/tag/") || lower.includes("/author/") || lower.includes("/feed/")) return false;
        return true;
      });

    await prisma.location.update({
      where: { id: locationId },
      data: {
        sitemapUrl,
        sitemapUrls: filtered,
        sitemapUpdatedAt: new Date(),
      }
    });

    return {
      success: true,
      count: filtered.length
    };
  } catch (err: any) {
    console.error(`Sitemap custom parse error for ${locationId}:`, err);
    return { success: false, count: 0, error: err.message };
  }
}
