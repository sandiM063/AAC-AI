import type { GeminiBoardPayload } from "@/lib/ai/gemini/assistant";

function clampStepCount(count: number | undefined): number {
  if (!count || Number.isNaN(count)) return 5;
  return Math.min(10, Math.max(2, Math.round(count)));
}

function cleanFieldValue(value: string): string {
  return value.replace(/\*\s*$/, "").trim();
}

function parseStepTitlesBlock(block: string): string[] {
  return block
    .split(/\*\s*/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2 && part.length <= 80)
    .filter((part) => !/^(taskTitle|taskDescription|stepCount|stepTitles|create_board)\b/i.test(part))
    .map((part) => part.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
}

/**
 * Recover a board payload when Gemini returns create_board metadata as markdown/text
 * instead of structured JSON (e.g. "**create_board** * taskTitle: Brush Teeth ...").
 */
export function extractBoardPayloadFromText(
  text: string,
  fallbackMessage = "",
): GeminiBoardPayload | null {
  const source = text.trim();
  if (!source) return null;

  const hasBoardMarker =
    /create_board/i.test(source) ||
    (/taskTitle\s*:/i.test(source) && /stepTitles\s*:/i.test(source));

  if (!hasBoardMarker) return null;

  const taskTitleMatch = source.match(
    /taskTitle\s*:\s*(.+?)(?=\*\s*taskDescription|\*\s*stepCount|\*\s*stepTitles|$)/i,
  );
  const taskDescriptionMatch = source.match(
    /taskDescription\s*:\s*(.+?)(?=\*\s*stepCount|\*\s*stepTitles|$)/i,
  );
  const stepCountMatch = source.match(/stepCount\s*:\s*(\d{1,2})/i);
  const stepTitlesMatch = source.match(/stepTitles\s*:\s*([\s\S]+)$/i);

  const stepCount = clampStepCount(stepCountMatch ? Number(stepCountMatch[1]) : undefined);
  let stepTitles = stepTitlesMatch ? parseStepTitlesBlock(stepTitlesMatch[1]) : [];

  if (stepTitles.length > stepCount) {
    stepTitles = stepTitles.slice(0, stepCount);
  }

  if (stepTitles.length < 2) {
    const listItems = source.match(/(?:^|\*)\s*([A-Z][^*]{2,60})/g);
    if (listItems) {
      stepTitles = listItems
        .map((item) => item.replace(/^\*\s*/, "").trim())
        .filter((item) => !/^(taskTitle|taskDescription|stepCount|stepTitles|create_board)/i.test(item))
        .slice(0, stepCount);
    }
  }

  if (stepTitles.length < 2) return null;

  const taskTitle = cleanFieldValue(taskTitleMatch?.[1] ?? "New routine");
  const taskDescription = cleanFieldValue(
    taskDescriptionMatch?.[1] ?? (fallbackMessage.trim() || "Routine board"),
  );

  return {
    taskTitle: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1),
    taskDescription,
    stepCount,
    stepTitles,
  };
}
