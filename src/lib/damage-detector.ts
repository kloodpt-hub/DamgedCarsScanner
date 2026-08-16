const HEAVY_DAMAGE_KEYWORDS = [
  "total loss",
  "totale losschade",
  "abverkauft als schrott",
  "verkauft als schrott",
  "abbrand",
  "brandschade",
  "brand",
  "burned",
  "burnt",
  "fire damage",
  "water damage",
  "waterschade",
  "wreck",
  "wrack",
  "structural",
  "frame damage",
  "chassis",
  "rolled",
  "overturned",
  "onderwater",
  "overstroomd",
  "inondé",
  "incendie",
  "allongé",
  "épave",
];

function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isHeavyDamage(
  title: string,
  description: string | null | undefined,
  damageStatus: string | null | undefined
): boolean {
  if (damageStatus === "Total Loss") return true;

  const text = `${title} ${description ?? ""}`;
  const textLower = text.toLowerCase();
  const textNoAccents = stripAccents(textLower);

  for (const keyword of HEAVY_DAMAGE_KEYWORDS) {
    const kwLower = keyword.toLowerCase();
    const kwNoAccents = stripAccents(kwLower);
    const escaped = escapeRegex(kwNoAccents);
    const re = new RegExp(`(^|[\\s,;.!?\\-()\\[\\]])${escaped}([\\s,;.!?\\-()\\[\\]]|$)`, "i");
    if (re.test(textNoAccents)) return true;
  }
  return false;
}
