import { describe, it, expect } from "vitest";
import {
  parsePrice,
  parseSeparatedNumber,
  parseMileage,
  parseYear,
  parseDamageStatus,
} from "@/lib/scraper/attribute-parser";

describe("parsePrice", () => {
  it("parses a euro amount with dot thousands separator", () => {
    expect(parsePrice("€12.500")).toBe(12500);
  });

  it("parses a euro amount with comma thousands separator", () => {
    expect(parsePrice("12,500 €")).toBe(12500);
  });

  it("parses a dot thousands separator", () => {
    expect(parsePrice("3.999")).toBe(3999);
  });

  it("parses a mixed separator decimal amount", () => {
    expect(parsePrice("9.999,99")).toBe(9999.99);
  });

  it("parses a plain integer", () => {
    expect(parsePrice("3500")).toBe(3500);
  });

  it("returns null for empty input", () => {
    expect(parsePrice("")).toBeNull();
  });

  it("returns null when there are no numbers", () => {
    expect(parsePrice("no numbers here")).toBeNull();
  });
});

describe("parseSeparatedNumber", () => {
  it("treats dot with 3 trailing digits as thousands", () => {
    expect(parseSeparatedNumber("1.234")).toBe(1234);
  });

  it("treats comma with 1 trailing digit as decimal", () => {
    expect(parseSeparatedNumber("1,5")).toBe(1.5);
  });

  it("treats comma with 3 trailing digits as thousands", () => {
    expect(parseSeparatedNumber("1,234")).toBe(1234);
  });

  it("treats dot with 3 trailing digits as thousands", () => {
    expect(parseSeparatedNumber("3.999")).toBe(3999);
  });

  it("uses the last separator as decimal when both are present", () => {
    expect(parseSeparatedNumber("1.234,56")).toBe(1234.56);
    expect(parseSeparatedNumber("1,234.56")).toBe(1234.56);
  });

  it("strips spaces used as thousands separators", () => {
    expect(parseSeparatedNumber("87 471")).toBe(87471);
  });
});

describe("parseMileage", () => {
  it("parses km mileage", () => {
    expect(parseMileage("87.471 km")).toBe(87471);
  });

  it("parses miles mileage", () => {
    expect(parseMileage("125,000 miles")).toBe(125000);
  });

  it("parses German Tellerstand", () => {
    expect(parseMileage("Tellerstand: 45.678")).toBe(45678);
  });

  it("returns null for empty input", () => {
    expect(parseMileage("")).toBeNull();
  });
});

describe("parseYear", () => {
  it("parses German Erstzulassung", () => {
    expect(parseYear("Erstzulassung: 2018")).toBe(2018);
  });

  it("parses Dutch Bouwjaar", () => {
    expect(parseYear("Bouwjaar: 2015")).toBe(2015);
  });

  it("parses month/year format", () => {
    expect(parseYear("01/2019")).toBe(2019);
  });

  it("parses a bare year in free text", () => {
    expect(parseYear("something 2021 model")).toBe(2021);
  });

  it("returns null when no year is present", () => {
    expect(parseYear("no year")).toBeNull();
  });
});

describe("parseDamageStatus", () => {
  it("parses German Unfallfrei as no damage", () => {
    expect(parseDamageStatus("Unfallfrei")).toBe("No Damage");
  });

  it("parses English Total Loss", () => {
    expect(parseDamageStatus("Total Loss")).toBe("Total Loss");
  });

  it("parses English damage", () => {
    expect(parseDamageStatus("with damage")).toBe("Damage");
  });

  it("returns null when no damage status is present", () => {
    expect(parseDamageStatus("nothing here")).toBeNull();
  });
});
