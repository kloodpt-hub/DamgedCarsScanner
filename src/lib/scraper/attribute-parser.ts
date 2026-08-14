/**
 * Multi-language attribute parser for vehicle listings.
 * Normalizes price, mileage, year, and damage status from various languages.
 */

// --- PRICE PARSER ---
const CURRENCY_SYMBOLS: Record<string, string> = {
  "€": "EUR", "$": "USD", "£": "GBP", "CHF": "CHF", "zł": "PLN",
  "kr": "SEK", "DKK": "DKK", "R$": "BRL", "¥": "JPY",
};

export function parsePrice(text: string): number | null {
  if (!text) return null;
  
  // Remove currency words
  let cleaned = text
    .replace(/euro?s?|dollar|pound|franc|zloty|krona|real|yen/gi, "")
    .trim();
  
  // Handle European format: 3.430,00 → 3430.00
  // If text has pattern like 3.430,00 or 3.430
  const euroPattern = /(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)/;
  const euroMatch = cleaned.match(euroPattern);
  if (euroMatch) {
    let numStr = euroMatch[1];
    // If comma is present, it's decimal separator (European format)
    if (numStr.includes(",")) {
      numStr = numStr.replace(/\./g, "").replace(",", ".");
    } else {
      // No comma - dots are thousand separators
      numStr = numStr.replace(/\./g, "");
    }
    const num = parseFloat(numStr);
    if (!isNaN(num) && num > 0) return num;
  }
  
  // Fallback: extract any number
  const fallback = cleaned.replace(/[^\d.,]/g, "");
  if (fallback) {
    // Smart comma/dot handling
    if (fallback.includes(",") && fallback.includes(".")) {
      // Both present: last one is decimal
      const lastComma = fallback.lastIndexOf(",");
      const lastDot = fallback.lastIndexOf(".");
      if (lastComma > lastDot) {
        // Comma is decimal: 1.234,56
        const num = parseFloat(fallback.replace(/\./g, "").replace(",", "."));
        if (!isNaN(num)) return num;
      } else {
        // Dot is decimal: 1,234.56
        const num = parseFloat(fallback.replace(/,/g, ""));
        if (!isNaN(num)) return num;
      }
    } else if (fallback.includes(",")) {
      const parts = fallback.split(",");
      const lastPart = parts[parts.length - 1];
      if (lastPart.length <= 2) {
        // Comma is decimal: 3430,00
        const num = parseFloat(fallback.replace(",", "."));
        if (!isNaN(num)) return num;
      } else {
        // Comma is thousand separator: 1,234
        const num = parseFloat(fallback.replace(/,/g, ""));
        if (!isNaN(num)) return num;
      }
    } else {
      const num = parseFloat(fallback.replace(/\./g, ""));
      if (!isNaN(num)) return num;
    }
  }
  
  return null;
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
      const cleaned = match[1].replace(/[\s]/g, "").replace(",", ".");
      // Handle European thousand separators (e.g., 87.471 → 87471)
      const parts = cleaned.split(".");
      if (parts.length > 1 && parts.every(p => p.length === 3)) {
        // All parts are 3 digits → dots are thousand separators
        const num = parseInt(parts.join(""), 10);
        if (!isNaN(num) && num > 0) return num;
      }
      const num = parseFloat(cleaned);
      if (!isNaN(num) && num > 0) return num;
    }
  }
  
  return null;
}

// --- YEAR PARSER ---
const YEAR_PATTERNS = [
  /(?:19|20)\d{2}/,
  /(?:EZ|ez|HO|ho)[:\s]*(\d{4})/i,
  /(?:1ste\s*toelating|erstzulassung)[:\s]*(?:\d{1,2}[\/.-])?(\d{4})/i,
  /(?:bouwjaar|année|ano)[:\s]*(\d{4})/i,
  /(?:first\s*reg(?:istration)?)[:\s]*(?:\d{1,2}[\/.-])?(\d{4})/i,
  /(\d{1,2})[\/.-](\d{4})/,
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
