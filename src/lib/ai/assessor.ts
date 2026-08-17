import { buildAssessmentPrompt } from "./prompts";

export interface AiAssessment {
  damageLevel: "none" | "light" | "moderate" | "heavy" | "total_loss";
  drivability: "drivable" | "not_drivable" | "unknown";
  damageDescription: string;
  confidence: number;
  method: "ai" | "rules";
  assessedAt: string;
}

interface AiAssessorConfig {
  apiUrl: string | null;
  apiKey: string | null;
  model: string | null;
  enabled: boolean;
}

function getAiConfig(): AiAssessorConfig {
  return {
    apiUrl: process.env.AI_API_URL || null,
    apiKey: process.env.AI_API_KEY || null,
    model: process.env.AI_MODEL || "gpt-4o-mini",
    enabled: process.env.AI_ASSESSMENT_ENABLED === "true" && !!process.env.AI_API_URL,
  };
}

export async function assessWithAi(params: {
  title: string;
  description: string | null;
  damageStatus: string | null;
}): Promise<AiAssessment | null> {
  const config = getAiConfig();
  if (!config.enabled || !config.apiUrl || !config.apiKey) {
    return null;
  }

  try {
    const messages = buildAssessmentPrompt(params);
    const content = await callAiApi(messages, config);
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (
      typeof parsed.damageLevel !== "string" ||
      !["none", "light", "moderate", "heavy", "total_loss"].includes(parsed.damageLevel)
    ) {
      return null;
    }

    return {
      damageLevel: parsed.damageLevel,
      drivability: parsed.drivability ?? "unknown",
      damageDescription: parsed.damageDescription ?? "",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      method: "ai",
      assessedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn("[ai-assessor] AI assessment failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

async function callAiApi(
  messages: Array<{ role: string; content: string }>,
  config: AiAssessorConfig
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${config.apiUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`[ai-assessor] API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.warn("[ai-assessor] API call failed:", err instanceof Error ? err.message : String(err));
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
