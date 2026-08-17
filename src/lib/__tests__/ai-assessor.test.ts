import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { assessWithAi, resetAiConfigCache } from "@/lib/ai/assessor";

vi.mock("@/lib/settings", () => ({
  getSetting: vi.fn().mockResolvedValue(null),
}));

import { getSetting } from "@/lib/settings";

const mockedGetSetting = vi.mocked(getSetting);

describe("assessWithAi", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetAiConfigCache();
    process.env = { ...originalEnv };
    delete process.env.AI_ASSESSMENT_ENABLED;
    delete process.env.AI_API_URL;
    delete process.env.AI_API_KEY;
    delete process.env.AI_MODEL;
    mockedGetSetting.mockReset();
    mockedGetSetting.mockResolvedValue(null);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns null when AI is disabled (default)", async () => {
    const result = await assessWithAi({
      title: "BMW 320d",
      description: null,
      damageStatus: null,
    });
    expect(result).toBeNull();
  });

  it("returns null when AI_ASSESSMENT_ENABLED is false", async () => {
    mockedGetSetting.mockImplementation(async (key: string) => {
      if (key === "AI_ASSESSMENT_ENABLED") return "false";
      if (key === "AI_API_URL") return "https://api.example.com";
      if (key === "AI_API_KEY") return "test-key";
      return null;
    });

    const result = await assessWithAi({
      title: "BMW 320d",
      description: null,
      damageStatus: null,
    });
    expect(result).toBeNull();
  });

  it("returns null when AI_API_URL is not set", async () => {
    mockedGetSetting.mockImplementation(async (key: string) => {
      if (key === "AI_ASSESSMENT_ENABLED") return "true";
      if (key === "AI_API_KEY") return "test-key";
      return null;
    });

    const result = await assessWithAi({
      title: "BMW 320d",
      description: null,
      damageStatus: null,
    });
    expect(result).toBeNull();
  });

  it("returns null on API error", async () => {
    mockedGetSetting.mockImplementation(async (key: string) => {
      if (key === "AI_ASSESSMENT_ENABLED") return "true";
      if (key === "AI_API_URL") return "https://api.example.com";
      if (key === "AI_API_KEY") return "test-key";
      if (key === "AI_MODEL") return "test-model";
      return null;
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500, statusText: "Internal Server Error" })
    );

    const result = await assessWithAi({
      title: "BMW 320d",
      description: null,
      damageStatus: null,
    });
    expect(result).toBeNull();
  });

  it("returns null on invalid JSON response", async () => {
    mockedGetSetting.mockImplementation(async (key: string) => {
      if (key === "AI_ASSESSMENT_ENABLED") return "true";
      if (key === "AI_API_URL") return "https://api.example.com";
      if (key === "AI_API_KEY") return "test-key";
      return null;
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [{ message: { content: "not json" } }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await assessWithAi({
      title: "BMW 320d",
      description: null,
      damageStatus: null,
    });
    expect(result).toBeNull();
  });

  it("returns null on network failure", async () => {
    mockedGetSetting.mockImplementation(async (key: string) => {
      if (key === "AI_ASSESSMENT_ENABLED") return "true";
      if (key === "AI_API_URL") return "https://api.example.com";
      if (key === "AI_API_KEY") return "test-key";
      return null;
    });

    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const result = await assessWithAi({
      title: "BMW 320d",
      description: null,
      damageStatus: null,
    });
    expect(result).toBeNull();
  });

  it("returns parsed assessment on valid AI response", async () => {
    mockedGetSetting.mockImplementation(async (key: string) => {
      if (key === "AI_ASSESSMENT_ENABLED") return "true";
      if (key === "AI_API_URL") return "https://api.example.com";
      if (key === "AI_API_KEY") return "test-key";
      if (key === "AI_MODEL") return "gpt-4o-mini";
      return null;
    });

    const aiResponse = {
      damageLevel: "moderate",
      drivability: "drivable",
      damageDescription: "Minor body damage on front bumper",
      confidence: 0.85,
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ choices: [{ message: { content: JSON.stringify(aiResponse) } }] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await assessWithAi({
      title: "BMW 320d with damage",
      description: "Front bumper scratched",
      damageStatus: "Damage",
    });

    expect(result).not.toBeNull();
    expect(result?.damageLevel).toBe("moderate");
    expect(result?.drivability).toBe("drivable");
    expect(result?.method).toBe("ai");
    expect(result?.confidence).toBe(0.85);
  });

  it("returns null when AI response has invalid damageLevel", async () => {
    mockedGetSetting.mockImplementation(async (key: string) => {
      if (key === "AI_ASSESSMENT_ENABLED") return "true";
      if (key === "AI_API_URL") return "https://api.example.com";
      if (key === "AI_API_KEY") return "test-key";
      return null;
    });

    const aiResponse = {
      damageLevel: "invalid_level",
      drivability: "drivable",
      damageDescription: "test",
      confidence: 0.8,
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ choices: [{ message: { content: JSON.stringify(aiResponse) } }] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await assessWithAi({
      title: "BMW 320d",
      description: null,
      damageStatus: null,
    });
    expect(result).toBeNull();
  });
});
