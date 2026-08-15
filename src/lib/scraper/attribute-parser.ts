/**
 * Multi-language attribute parser for vehicle listings.
 * Normalizes price, mileage, year, and damage status from various languages.
 */

// --- PRICE PARSER ---

export function parsePrice(text: string): number | null {
  if (!text) return null;

  // Remove currency words
  const cleaned = text
    .replace(/euro?s?|dollar|pound|franc|zloty|krona|real|yen/gi, "")
    .trim();

  // Extract the first numeric token (with optional separators)
  const match = cleaned.match(/\d[\d.,]*/);
  if (!match) return null;

  const num = parseSeparatedNumber(match[0]);
  if (num !== null && !isNaN(num)) return num;

  return null;
}

/**
 * Parse a numeric string that may use "." or "," as either a thousands
 * separator or a decimal separator, using a length heuristic:
 *  - If a separator is followed by exactly 3 digits AND there is no other
 *    separator later that is followed by 1-2 digits, treat it as thousands.
 *  - If a separator is followed by 1-2 digits, treat it as a decimal.
 *  - If both separators are present, the last one is the decimal separator.
 */
export function parseSeparatedNumber(raw: string): number | null {
  let token = raw.trim();
  if (!token) return null;

  // Strip spaces used as thousands separators (e.g. "87 471")
  token = token.replace(/\s/g, "");

  if (token.includes(",") && token.includes(".")) {
    // Both present: the last one is the decimal separator.
    const lastComma = token.lastIndexOf(",");
    const lastDot = token.lastIndexOf(".");
    if (lastComma > lastDot) {
      // Comma is decimal: 1.234,56
      return parseFloat(token.replace(/\./g, "").replace(",", "."));
    } else {
      // Dot is decimal: 1,234.56
      return parseFloat(token.replace(/,/g, ""));
    }
  }

  if (token.includes(",")) {
    const parts = token.split(",");
    const lastPart = parts[parts.length - 1];
    if (lastPart.length === 3 && parts.length === 2) {
      // "1,234" → comma is thousands separator
      return parseFloat(parts.join(""));
    }
    if (lastPart.length === 1 || lastPart.length === 2) {
      // "3430,00" → comma is decimal separator
      return parseFloat(token.replace(",", "."));
    }
    // Otherwise treat comma as thousands separator
    return parseFloat(token.replace(/,/g, ""));
  }

  if (token.includes(".")) {
    const parts = token.split(".");
    const lastPart = parts[parts.length - 1];
    if (parts.length > 1 && lastPart.length === 3) {
      // "87.471" or "1.234.567" → dots are thousands separators
      return parseFloat(parts.join(""));
    }
    if (lastPart.length === 1 || lastPart.length === 2) {
      // "1.5" → dot is decimal separator
      return parseFloat(token);
    }
    // Fallback: strip dots as thousands separators
    return parseFloat(token.replace(/\./g, ""));
  }

  const parsed = parseFloat(token);
  return isNaN(parsed) ? null : parsed;
}

// --- MILEAGE PARSER ---
const MILEAGE_PATTERNS = [
  /(\d[\d\s.,]*)\s*km/i,
  /(\d[\d\s.,]*)\s*kilom/i,
  /(\d[\d\s.,]*)\s*miles?/i,
  /(\d[\d\s.,]*)\s*mi/i,
  /tellerstand[:\s]*(\d[\d\s.,]*)/i,
  /kilometra[:\s]*(\d[\d\s.,]*)/i,
];

export function parseMileage(text: string): number | null {
  if (!text) return null;

  for (const pattern of MILEAGE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const token = match[1].replace(/\s/g, "");
      const num = parseSeparatedNumber(token);
      if (num !== null && num > 0) return Math.round(num);
    }
  }

  // Fallback: whole text may just be a number with separators
  const fallback = text.match(/\d[\d\s.,]*/);
  if (fallback) {
    const num = parseSeparatedNumber(fallback[0].replace(/\s/g, ""));
    if (num !== null && num > 0) return Math.round(num);
  }

  return null;
}

// --- YEAR PARSER ---
const YEAR_PATTERNS = [
  /(?:EZ|ez|HO|ho)[:\s]*(\d{4})/i,
  /(?:1ste\s*toelating|erstzulassung)[:\s]*(?:\d{1,2}[\/.-])?(\d{4})/i,
  /(?:bouwjaar|année|ano)[:\s]*(\d{4})/i,
  /(?:first\s*reg(?:istration)?)[:\s]*(?:\d{1,2}[\/.-])?(\d{4})/i,
  /(\d{1,2})[\/.-](\d{4})/,
  /\b(?:19|20)\d{2}\b/,
];

export function parseYear(text: string): number | null {
  if (!text) return null;

  for (const pattern of YEAR_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      // Group 1 might be the year, or group 0
      const yearStr = match[1] || match[0];
      const year = parseInt(yearStr, 10);
      if (year >= 1950 && year <= new Date().getFullYear() + 1) {
        return year;
      }
    }
  }

  return null;
}

// --- DAMAGE STATUS PARSER ---
const DAMAGE_KEYWORDS: [RegExp, string][] = [
  // No damage
  [/non[\s-]accident[eé]|sans[\s-]accident|unfallfrei|no[\s-]accident|niet[\s-]beschadigd/i, "No Damage"],
  // Has damage
  [/accident[eé]?|beschadigd|schad[eo]|verkocht|botschade|brandschade|waterschade|unfall|crash|damage/i, "Damage"],
  // Total loss
  [/total[\s-]loss|totaalverlies|write[\s-]off|totalschaden/i, "Total Loss"],
];

export function parseDamageStatus(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  for (const [pattern, status] of DAMAGE_KEYWORDS) {
    if (pattern.test(lower)) {
      return status;
    }
  }

  return null;
}
