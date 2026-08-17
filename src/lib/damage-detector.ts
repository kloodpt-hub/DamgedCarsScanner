import type { AiAssessment } from "@/lib/ai/assessor";
import type { JsonValue } from "@prisma/client/runtime/library";

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

const MODERATE_DAMAGE_KEYWORDS = [
  "damage",
  "damaged",
  "schade",
  "beschädigung",
  "accident",
  "ongeval",
  "collision",
  "crash",
  "bent",
  "deuken",
  "kras",
  "krassen",
  "baring",
  "scratch",
  "scratches",
  "dent",
  "dents",
  "broken",
  "gebroken",
  "kapot",
  "defect",
  "defekt",
  "mechanical",
  "motorisch",
  "engine problem",
  "remprobleem",
  "brake problem",
  "transmission",
  "versnellingsbak",
];

function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesKeyword(textNoAccents: string, keyword: string): boolean {
  const kwLower = keyword.toLowerCase();
  const kwNoAccents = stripAccents(kwLower);
  const escaped = escapeRegex(kwNoAccents);
  const re = new RegExp(`(^|[\\s,;.!?\\-()\\[\\]])${escaped}([\\s,;.!?\\-()\\[\\]]|$)`, "i");
  return re.test(textNoAccents);
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
    if (matchesKeyword(textNoAccents, keyword)) return true;
  }
  return false;
}

export type DamageLevel = "none" | "light" | "moderate" | "heavy" | "total_loss";

export interface RuleAssessment {
  damageLevel: DamageLevel;
  confidence: number;
  isDefinite: boolean;
}

export function assessByRules(
  title: string,
  description: string | null | undefined,
  damageStatus: string | null | undefined
): RuleAssessment {
  if (damageStatus === "Total Loss") {
    return { damageLevel: "total_loss", confidence: 1.0, isDefinite: true };
  }

  const text = `${title} ${description ?? ""}`;
  const textLower = text.toLowerCase();
  const textNoAccents = stripAccents(textLower);

  for (const keyword of HEAVY_DAMAGE_KEYWORDS) {
    if (matchesKeyword(textNoAccents, keyword)) {
      return { damageLevel: "total_loss", confidence: 0.9, isDefinite: true };
    }
  }

  for (const keyword of MODERATE_DAMAGE_KEYWORDS) {
    if (matchesKeyword(textNoAccents, keyword)) {
      return { damageLevel: "moderate", confidence: 0.6, isDefinite: false };
    }
  }

  if (damageStatus === "Damage") {
    return { damageLevel: "moderate", confidence: 0.6, isDefinite: false };
  }

  if (damageStatus === "No Damage") {
    return { damageLevel: "none", confidence: 0.8, isDefinite: true };
  }

  return { damageLevel: "none", confidence: 0.5, isDefinite: false };
}

const DAMAGE_LEVEL_ORDER: Record<string, number> = {
  none: 0,
  light: 1,
  moderate: 2,
  heavy: 3,
  total_loss: 4,
};

function isDamageAcceptable(listingDamageLevel: string, maxAllowed: string): boolean {
  const listingLevel = DAMAGE_LEVEL_ORDER[listingDamageLevel] ?? 2;
  const maxLevel = DAMAGE_LEVEL_ORDER[maxAllowed] ?? 4;
  return listingLevel <= maxLevel;
}

function getEffectiveAssessment(listing: {
  aiAssessment?: AiAssessment | JsonValue | null;
  damageStatus?: string | null;
  title: string;
  description?: string | null;
}): { damageLevel: string } | null {
  const aiAssessment = listing.aiAssessment as AiAssessment | null | undefined;
  if (aiAssessment?.damageLevel) {
    return { damageLevel: aiAssessment.damageLevel };
  }
  if (listing.damageStatus === "Total Loss") return { damageLevel: "total_loss" };
  if (isHeavyDamage(listing.title, listing.description, listing.damageStatus)) {
    return { damageLevel: "total_loss" };
  }
  if (listing.damageStatus === "Damage") return { damageLevel: "moderate" };
  if (listing.damageStatus === "No Damage") return { damageLevel: "none" };
  return null;
}

export { DAMAGE_LEVEL_ORDER, isDamageAcceptable, getEffectiveAssessment };

export async function assessDamage(params: {
  title: string;
  description: string | null;
  damageStatus: string | null;
  existingAssessment?: AiAssessment | null;
}): Promise<AiAssessment> {
  const ruleAssessment = assessByRules(params.title, params.description, params.damageStatus);

  if (ruleAssessment.isDefinite) {
    return {
      damageLevel: ruleAssessment.damageLevel,
      drivability: ruleAssessment.damageLevel === "total_loss" ? "not_drivable" : "unknown",
      damageDescription: `Rule-based assessment: ${ruleAssessment.damageLevel}`,
      confidence: ruleAssessment.confidence,
      method: "rules",
      assessedAt: new Date().toISOString(),
    };
  }

  const { assessWithAi } = await import("@/lib/ai/assessor");
  const aiResult = await assessWithAi(params);

  if (aiResult) {
    return aiResult;
  }

  return {
    damageLevel: ruleAssessment.damageLevel,
    drivability: "unknown",
    damageDescription: `Rule-based assessment: ${ruleAssessment.damageLevel}`,
    confidence: ruleAssessment.confidence,
    method: "rules",
    assessedAt: new Date().toISOString(),
  };
}
