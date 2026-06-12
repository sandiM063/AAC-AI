export function sanitizeTaskDescriptionForGeneration(
  description: string | undefined,
  existingStepTitles: string[] | undefined,
): string {
  const trimmed = description?.trim() ?? "";
  if (!trimmed || !existingStepTitles?.length) return trimmed;

  const descLines = trimmed
    .split(/\n+/)
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line.length >= 2);

  const stepLines = existingStepTitles
    .map((title) => title.trim().toLowerCase())
    .filter((title) => title.length >= 2);

  if (descLines.length === 0 || stepLines.length === 0) return trimmed;

  const matched = descLines.filter((line) =>
    stepLines.some((step) => step === line || step.includes(line) || line.includes(step)),
  ).length;

  if (matched >= Math.min(descLines.length, stepLines.length)) {
    return "";
  }

  return trimmed;
}
