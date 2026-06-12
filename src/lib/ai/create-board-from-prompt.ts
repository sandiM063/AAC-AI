export type ParsedBoardPrompt = {
  taskTitle: string;
  taskDescription: string;
  stepCount: number;
};

export function shouldCreateBoard(message: string): boolean {
  const text = message.toLowerCase().trim();

  if (/^(how|what|why|when|where|tell me|explain|describe)\b/.test(text)) {
    return false;
  }

  if (/\b(create|make|build|generate|set up|add)\b/.test(text)) {
    return /\b(board|task|routine|schedule|steps)\b/.test(text) || /\bfor\b/.test(text);
  }

  if (/\bhelp me (plan|create|build|make)\b/.test(text)) {
    return /\b(routine|board|task|schedule|morning|evening|visit|class)\b/.test(text);
  }

  if (/\bplan a\b/.test(text)) {
    return true;
  }

  return false;
}

function stripCommandPrefix(message: string): string {
  return message
    .trim()
    .replace(/^(please\s+)?/i, "")
    .replace(/^help\s+me\s+for\s+(a\s+)?/i, "")
    .replace(/^help\s+me\s+(to\s+)?/i, "")
    .replace(
      /^(create|make|build|generate|set up|add|plan)\s+(a\s+)?/i,
      "",
    )
    .replace(/^(task\s+)?board\s+(for|about|called)?\s*/i, "")
    .replace(/\s+with\s+\d+\s*steps?\.?$/i, "")
    .replace(/\s+board$/i, "")
    .replace(/\s+for\s+me(?:\s+for)?\s*$/i, "")
    .replace(/[.?!]+$/g, "")
    .trim();
}

function isValidTaskTitle(title: string): boolean {
  const normalized = title.trim();
  if (!normalized || normalized.length < 3) return false;
  if (/^(for|me|a|an|the|you)$/i.test(normalized)) return false;
  if (/^me\s+for\b/i.test(normalized)) return false;
  if (/^help\s+me\b/i.test(normalized)) return false;
  if (/^for\s+me\b/i.test(normalized)) return false;
  return true;
}

function normalizeTaskTitle(title: string): string {
  return title
    .replace(/^(for|about|called|a|an|the)\s+/i, "")
    .replace(/\s+for\s+me\b/i, "")
    .replace(/\s+board$/i, "")
    .trim();
}

function extractRoutineTopic(message: string): string | null {
  const patterns = [
    /\b(morning\s+(?:school\s+)?routine(?:\s+before\s+school)?)/i,
    /\b(evening\s+(?:wind[- ]?down\s+)?routine)/i,
    /\b(bedtime\s+routine)/i,
    /\b(patient\s+visit(?:\s+board)?)/i,
    /\b(classroom\s+\w+(?:\s+\w+)?\s+routine)/i,
    /\b(classroom\s+arrival\s+routine)/i,
    /\b(clinical\s+\w+(?:\s+\w+)?)/i,
    /\b(\w+(?:\s+\w+){0,3}\s+routine)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1] && !/^help\s+me\b/i.test(match[1])) {
      return match[1].replace(/\s+board$/i, "").trim();
    }
  }

  return null;
}

export function parseBoardFromPrompt(message: string): ParsedBoardPrompt {
  const stepMatch = message.match(/\b(\d{1,2})\s*steps?\b/i);
  const stepCount = stepMatch
    ? Math.min(10, Math.max(2, Number(stepMatch[1])))
    : 5;

  const routineTopic = extractRoutineTopic(message);
  const quoted = message.match(/[""](.+?)["”]/);
  let title = normalizeTaskTitle(quoted?.[1]?.trim() ?? stripCommandPrefix(message));

  if (!isValidTaskTitle(title)) {
    title = routineTopic ? normalizeTaskTitle(routineTopic) : "New routine";
  }

  if (!isValidTaskTitle(title)) {
    title = "New routine";
  }

  title = title.charAt(0).toUpperCase() + title.slice(1);

  return {
    taskTitle: title,
    taskDescription: message.trim(),
    stepCount,
  };
}

export function repairTaskTitle(title: string, description: string): string {
  if (isValidTaskTitle(title)) return title;
  if (description.trim()) {
    const repaired = parseBoardFromPrompt(description).taskTitle;
    if (isValidTaskTitle(repaired)) return repaired;
  }
  return "New routine";
}
