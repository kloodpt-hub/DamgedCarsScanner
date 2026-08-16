import type { PrismaClient, Listing } from "@prisma/client";

const FILLER_WORDS = new Set([
  "km", "miles", "mi", "jaar", "année", "an", "ans",
  "cc", "kw", "pk", "cv", "hp", "ps", "bhp",
  "diesel", "benzine", "essence", "petrol", "electric", "hybrid",
  "l", "lt", "ltr", "kg", "nm", "t", "tdi", "tfsi", "tsi", "cdi",
  "the", "a", "an", "and", "or", "of", "for", "in", "on", "at", "to",
  "de", "du", "des", "le", "la", "les", "un", "une", "et", "en",
  "het", "een", "van", "de", "het", "en", "op", "voor", "met",
]);

function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0 && !FILLER_WORDS.has(w))
    .sort()
    .join(" ");
}

export function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(" "));
  const wordsB = new Set(b.split(" "));
  if (wordsA.size === 0 && wordsB.size === 0) return 1;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection++;
  }
  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function isDuplicate(a: Listing, b: Listing): boolean {
  if (a.year !== b.year || a.year == null) return false;

  if (a.price != null && b.price != null) {
    const maxPrice = Math.max(a.price, b.price);
    const minPrice = Math.min(a.price, b.price);
    if (minPrice < maxPrice * 0.8) return false;
  }

  if (a.mileage != null && b.mileage != null) {
    const maxMileage = Math.max(a.mileage, b.mileage);
    const minMileage = Math.min(a.mileage, b.mileage);
    if (minMileage < maxMileage * 0.9) return false;
  }

  const sim = titleSimilarity(normalizeTitle(a.title), normalizeTitle(b.title));
  if (sim < 0.8) return false;

  return true;
}

export async function findDuplicates(
  prisma: PrismaClient,
  listing: Listing
): Promise<Listing[]> {
  const candidates = await prisma.listing.findMany({
    where: {
      sourceId: listing.sourceId ? { not: listing.sourceId } : undefined,
      id: { not: listing.id },
      year: listing.year ?? undefined,
      isSold: false,
    },
  });

  return candidates.filter((c) => isDuplicate(listing, c));
}
