import { describe, it, expect, vi, beforeEach } from "vitest";
import { assessWithAi } from "@/lib/ai/assessor";

describe("assessWithAi", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.AI_ASSESSMENT_ENABLED;
    delete process.env.AI_API_URL;
    delete process.env.AI_API_KEY;
    delete process.env.AI_MODEL;
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
    process.env.AI_ASSESSMENT_ENABLED = "false";
    process.env.AI_API_URL = "https://api.example.com";
    process.env.AI_API_KEY = "test-key";

    const result = await assessWithAi({
      title: "BMW 320d",
      description: null,
      damageStatus: null,
    });
    expect(result).toBeNull();
  });

  it("returns null when AI_API_URL is not set", async () => {
    process.env.AI_ASSESSMENT_ENABLED = "true";
    process.env.AI_API_KEY = "test-key";

    const result = await assessWithAi({
      title: "BMW 320d",
      description: null,
      damageStatus: null,
    });
    expect(result).toBeNull();
  });

  it("returns null on API error", async () => {
    process.env.AI_ASSESSMENT_ENABLED = "true";
    process.env.AI_API_URL = "https://api.example.com";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "test-model";

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
    process.env.AI_ASSESSMENT_ENABLED = "true";
    process.env.AI_API_URL = "https://api.example.com";
    process.env.AI_API_KEY = "test-key";

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
    process.env.AI_ASSESSMENT_ENABLED = "true";
    process.env.AI_API_URL = "https://api.example.com";
    process.env.AI_API_KEY = "test-key";

    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const result = await assessWithAi({
      title: "BMW 320d",
      description: null,
      damageStatus: null,
    });
    expect(result).toBeNull();
  });

  it("returns parsed assessment on valid AI response", async () => {
    process.env.AI_ASSESSMENT_ENABLED = "true";
    process.env.AI_API_URL = "https://api.example.com";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "gpt-4o-mini";

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
    process.env.AI_ASSESSMENT_ENABLED = "true";
    process.env.AI_API_URL = "https://api.example.com";
    process.env.AI_API_KEY = "test-key";

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
