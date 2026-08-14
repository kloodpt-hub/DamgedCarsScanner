const SOLD_INDICATORS = [
  // English
  "sold", "reserved", "no longer available", "unavailable", "expired",
  // French
  "vendu", "vendue", "réservé", "réservée", "indisponible", "non disponible",
  // German
  "verkauft", "reserviert", "nicht verfügbar", "abverkauft",
  // Dutch
  "verkocht", "gereserveerd", "niet beschikbaar", "niet meer beschikbaar",
  // Italian
  "venduto", "venduta", "riservato", "riservata", "non disponibile",
  // Spanish
  "vendido", "vendida", "reservado", "reservada", "no disponible",
  // General
  "pending sale", "under offer", "sous offre", "unter vertrag",
];

export function isListingSold(title: string, description?: string | null): boolean {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  return SOLD_INDICATORS.some((indicator) => text.includes(indicator));
}
