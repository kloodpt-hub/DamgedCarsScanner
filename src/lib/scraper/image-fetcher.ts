import * as cheerio from "cheerio";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const SKIP_KEYWORDS = [
  "logo",
  "icon",
  "badge",
  "avatar",
  "pixel",
  "tracking",
  "1x1",
  "spacer",
  "sprite",
  "favicon",
  "thumb",
  "ad-",
  "adsense",
  "doubleclick",
  "googlesyndication",
];

export async function fetchAllImages(url: string): Promise<string[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) return [];

  const html = await res.text();
  const $ = cheerio.load(html);
  const pageUrl = new URL(url);
  const imageUrls = new Set<string>();

  // Extract from <img src>
  $("img").each((_i, el) => {
    const src = $(el).attr("src");
    if (src) addImageUrl(src, pageUrl, imageUrls);
  });

  // Extract from <source srcset> — pick the largest variant
  $("source").each((_i, el) => {
    const srcset = $(el).attr("srcset");
    if (!srcset) return;
    const variants = srcset
      .split(",")
      .map((v) => v.trim().split(/\s+/))
      .filter((parts) => parts.length >= 1);
    if (variants.length === 0) return;

    // Sort by descriptor (width/height/pixel-density) descending, pick first
    variants.sort((a, b) => {
      const aVal = parseInt(a[1] || "1", 10);
      const bVal = parseInt(b[1] || "1", 10);
      return bVal - aVal;
    });
    addImageUrl(variants[0][0], pageUrl, imageUrls);
  });

  // Also check background-image in style attributes
  $('[style*="background-image"]').each((_i, el) => {
    const style = $(el).attr("style") || "";
    const match = style.match(/url\(["']?([^"')]+)["']?\)/);
    if (match) addImageUrl(match[1], pageUrl, imageUrls);
  });

  return [...imageUrls];
}

function addImageUrl(
  src: string,
  pageUrl: URL,
  imageUrls: Set<string>
): void {
  if (src.startsWith("data:")) return;

  const lower = src.toLowerCase();
  if (SKIP_KEYWORDS.some((kw) => lower.includes(kw))) return;

  try {
    const absolute = new URL(src, pageUrl.origin).href;
    imageUrls.add(absolute);
  } catch {
    // invalid URL, skip
  }
}
