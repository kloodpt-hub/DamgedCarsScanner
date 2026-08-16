import { describe, it, expect } from "vitest";
import { isHeavyDamage } from "@/lib/damage-detector";

describe("isHeavyDamage", () => {
  it("returns true when damageStatus is Total Loss", () => {
    expect(isHeavyDamage("Some car", null, "Total Loss")).toBe(true);
  });

  it("returns false when damageStatus is not Total Loss and no keywords", () => {
    expect(isHeavyDamage("BMW 320d", null, "Damage")).toBe(false);
  });

  it("returns true for 'total loss' keyword in title", () => {
    expect(isHeavyDamage("Audi A4 total loss", null, null)).toBe(true);
  });

  it("returns true for 'wreck' keyword in title", () => {
    expect(isHeavyDamage("Mercedes wreck", null, null)).toBe(true);
  });

  it("returns true for 'fire damage' keyword in description", () => {
    expect(isHeavyDamage("Some car", "has fire damage inside", null)).toBe(true);
  });

  it("returns true for 'burned' keyword in title", () => {
    expect(isHeavyDamage("VW Golf burned", null, null)).toBe(true);
  });

  it("returns true for 'waterschade' keyword in title", () => {
    expect(isHeavyDamage("BMW 5 series waterschade", null, null)).toBe(true);
  });

  it("returns true for 'wrack' keyword in title (German)", () => {
    expect(isHeavyDamage("Audi A6 wrack", null, null)).toBe(true);
  });

  it("returns true for 'épave' keyword in title (French)", () => {
    expect(isHeavyDamage("Peugeot 308 épave", null, null)).toBe(true);
  });

  it("returns true for 'incendie' keyword in description", () => {
    expect(isHeavyDamage("Some car", "véhicule incendie", null)).toBe(true);
  });

  it("returns false for clean listing", () => {
    expect(isHeavyDamage("BMW 320d 2018", "Minor scratches", "Damage")).toBe(false);
  });

  it("returns false for empty title and description", () => {
    expect(isHeavyDamage("", null, null)).toBe(false);
  });

  it("matches case-insensitively", () => {
    expect(isHeavyDamage("BMW WRECK", null, null)).toBe(true);
  });

  it("matches 'brand' as standalone word in title", () => {
    expect(isHeavyDamage("brand new car", null, null)).toBe(true);
  });

  it("does not match 'brand' as a substring of another word", () => {
    expect(isHeavyDamage("branding rights", null, null)).toBe(false);
  });

  it("returns true for 'structural' keyword", () => {
    expect(isHeavyDamage("Car with structural issues", null, null)).toBe(true);
  });

  it("returns true for 'frame damage' keyword", () => {
    expect(isHeavyDamage("Audi frame damage", null, null)).toBe(true);
  });

  it("returns true for 'chassis' keyword", () => {
    expect(isHeavyDamage("BMW chassis problem", null, null)).toBe(true);
  });

  it("returns true for 'totale losschade' keyword (Dutch)", () => {
    expect(isHeavyDamage("Audi totale losschade", null, null)).toBe(true);
  });

  it("returns true for 'abverkauft als schrott' keyword", () => {
    expect(isHeavyDamage("BMW abverkauft als schrott", null, null)).toBe(true);
  });

  it("returns true for 'onderwater' keyword", () => {
    expect(isHeavyDamage("Auto onderwater geweest", null, null)).toBe(true);
  });

  it("returns true for 'overstroomd' keyword", () => {
    expect(isHeavyDamage("Auto overstroomd", null, null)).toBe(true);
  });

  it("returns true for 'inondé' keyword (French)", () => {
    expect(isHeavyDamage("Véhicule inondé", null, null)).toBe(true);
  });

  it("returns true for 'allongé' keyword (French)", () => {
    expect(isHeavyDamage("Voiture allongé", null, null)).toBe(true);
  });
});
