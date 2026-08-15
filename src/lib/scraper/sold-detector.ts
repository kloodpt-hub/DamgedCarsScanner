const SOLD_INDICATORS = [
  // English
  "sold",
  // French
  "vendu",
  "vendue",
  // German
  "verkauft",
  "abverkauft",
  // Dutch
  "verkocht",
  // Italian
  "venduto",
  "venduta",
  // Spanish
  "vendido",
  "vendida",
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isListingSold(
  title: string,
  description?: string | null
): boolean {
  // Match indicators against title + damageStatus only (free-text description
  // produces too many false positives like "reserved price", "soldier").
  const text = `${title} ${description ?? ""}`;
  for (const indicator of SOLD_INDICATORS) {
    const re = new RegExp(`\\b${escapeRegex(indicator)}\\b`, "i");
    if (re.test(text)) return true;
  }
  return false;
}
