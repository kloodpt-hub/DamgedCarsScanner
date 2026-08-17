interface AssessmentPromptParams {
  title: string;
  description: string | null;
  damageStatus: string | null;
}

export function buildAssessmentPrompt(params: AssessmentPromptParams): Array<{ role: string; content: string }> {
  const systemMessage = `You are a vehicle damage assessment expert. Analyze the car listing and determine damage severity and drivability.

IMPORTANT: The listing may be in Dutch, German, French, English, or Arabic. Understand the full context before assessing.

Damage levels:
- "none": No visible damage, car is in good condition
- "light": Minor cosmetic damage (scratches, small dents), car is fully drivable
- "moderate": Significant body/mechanical damage, but car may still be drivable
- "heavy": Severe structural/mechanical damage, car likely not drivable
- "total_loss": Car is a total loss, wreck, or beyond economical repair

Drivability:
- "drivable": Car can be driven (even with damage)
- "not_drivable": Car cannot be safely driven
- "unknown": Not enough information to determine

Key context clues:
- "schade auto die rijdt" = damaged car that drives → drivable
- "kan naar de APK" = can pass inspection → likely drivable
- "total loss" / "totale losschade" / "wrack" / "épave" = total loss
- "niet rijdbaar" / "nicht fahrbar" = not drivable
- "lichte schade" = light damage
- "zware schade" / "schwere Beschädigung" = heavy damage
- "rijdt en remt goed" = drives and brakes well → drivable

Return JSON only:
{
  "damageLevel": "none" | "light" | "moderate" | "heavy" | "total_loss",
  "drivability": "drivable" | "not_drivable" | "unknown",
  "damageDescription": "Brief 1-sentence summary of damage assessment",
  "confidence": 0.0-1.0
}`;

  const userMessage = `Assess this car listing:

Title: ${params.title}
Description: ${params.description || "Not provided"}
Damage status: ${params.damageStatus || "Not specified"}`;

  return [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ];
}
