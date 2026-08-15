import { describe, it, expect } from "vitest";
import { isListingSold } from "@/lib/scraper/sold-detector";

describe("isListingSold", () => {
  it("detects English 'sold'", () => {
    expect(isListingSold("BMW 320d SOLD")).toBe(true);
  });

  it("detects French 'vendu'", () => {
    expect(isListingSold("VW Golf - Vendu")).toBe(true);
  });

  it("detects German 'verkauft'", () => {
    expect(isListingSold("Opel Astra Verkauft")).toBe(true);
  });

  it("detects Dutch 'verkocht'", () => {
    expect(isListingSold("Renault Twingo Verkocht")).toBe(true);
  });

  it("detects Italian 'venduto'", () => {
    expect(isListingSold("Fiat Panda - Venduto")).toBe(true);
  });

  it("returns false for a normal title", () => {
    expect(isListingSold("Tesla Model 3")).toBe(false);
  });

  it("does not match inside 'reserved'", () => {
    expect(isListingSold("Mercedes - reserved price")).toBe(false);
  });

  it("does not match inside 'soldier'", () => {
    expect(isListingSold("Toyota - soldier edition")).toBe(false);
  });

  it("still checks the description", () => {
    expect(isListingSold("Audi", "car is sold today")).toBe(true);
  });
});
