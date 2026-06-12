import { Type } from "@google/genai";
import { shouldCreateBoard } from "@/lib/ai/create-board-from-prompt";
import { generateGeminiJson, generateGeminiText } from "@/lib/ai/gemini/client";
import { toGeminiContents } from "@/lib/ai/gemini/chat-turns";
import { extractBoardPayloadFromText } from "@/lib/ai/gemini/parse-board-payload";
import { AAC_SYSTEM_PREAMBLE, professionSystemContext } from "@/lib/ai/gemini/prompts";
import { isGeminiConfigured } from "@/lib/ai/gemini/config";
import type { AssistantChatTurn } from "@/lib/ai/assistant-memory/types";
import type { StoredProfessionId } from "@/lib/professions";

export type GeminiBoardPayload = {
  taskTitle: string;
  taskDescription: string;
  stepCount: number;
  stepTitles: string[];
};

export type GeminiAssistantResult =
  | { kind: "chat"; reply: string }
  | { kind: "board"; board: GeminiBoardPayload };

type GeminiAssistantAnalysis = {
  action: "create_board" | "chat";
  reply?: string;
  board?: {
    taskTitle?: string;
    taskDescription?: string;
    stepCount?: number;
    stepTitles?: string[];
  };
};

const ASSISTANT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    action: {
      type: Type.STRING,
      description: "create_board when the user wants a new task board; otherwise chat",
    },
    reply: {
      type: Type.STRING,
      description: "Assistant reply when action is chat",
    },
    board: {
      type: Type.OBJECT,
      properties: {
        taskTitle: { type: Type.STRING },
        taskDescription: { type: Type.STRING },
        stepCount: { type: Type.INTEGER },
        stepTitles: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    },
  },
  required: ["action"],
};

function clampStepCount(count: number | undefined): number {
  if (!count || Number.isNaN(count)) return 5;
  return Math.min(10, Math.max(2, Math.round(count)));
}

function normalizeStepTitles(titles: string[] | undefined, stepCount: number): string[] {
  const cleaned = (titles ?? [])
    .map((title) => title.trim())
    .filter((title) => title.length >= 2 && title.length <= 80);

  if (cleaned.length === 0) return [];

  if (cleaned.length >= stepCount) {
    return cleaned.slice(0, stepCount);
  }

  return cleaned;
}

function normalizeBoardPayload(
  board: GeminiAssistantAnalysis["board"],
  fallbackMessage: string,
): GeminiBoardPayload | null {
  if (!board) return null;

  const stepCount = clampStepCount(board.stepCount);
  const stepTitles = normalizeStepTitles(board.stepTitles, stepCount);
  const taskTitle = board.taskTitle?.trim() || "New routine";

  if (stepTitles.length < 2) return null;

  return {
    taskTitle: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1),
    taskDescription: board.taskDescription?.trim() || fallbackMessage.trim(),
    stepCount,
    stepTitles,
  };
}

function buildSystemPrompt(
  profession: StoredProfessionId | null,
  ragContext: string,
): string {
  return `${AAC_SYSTEM_PREAMBLE}

${professionSystemContext(profession)}

Relevant memories from this user's past assistant conversations:
${ragContext}

Use conversation history and retrieved memories to stay consistent. Reference earlier boards, routines, or preferences when helpful.

Decide whether the user wants you to CREATE a task board or have a conversational reply.

Use action "create_board" when they ask to create, make, build, generate, or plan a board, routine, schedule, or step sequence — including follow-ups like "make that 6 steps" when prior context describes a routine.
Use action "chat" for questions, explanations, phrase help, or general guidance.

For create_board:
- Return ONLY valid JSON matching the schema. Do not format the board as markdown, bullet lists, or prose in the reply field.
- Put taskTitle, taskDescription, stepCount, and stepTitles in the board object — never in reply.
- taskTitle: short board name derived from the request and context
- taskDescription: the user's intent in plain language
- stepCount: number of steps (2–10; default 5 if not specified)
- stepTitles: short action labels suitable for AAC symbol tiles (imperative phrases, 2–6 words each). Only include real steps for this task — never pad with greetings or unrelated fillers. If the task cannot support stepCount steps, return fewer titles (the app will ask the user to adjust).

For chat:
- reply: helpful answer about AAC Communicate features, phrases, or routines. Never include create_board markers or raw board field lists in reply.`;
}

function resolveBoardPayload(
  analysis: GeminiAssistantAnalysis | null,
  message: string,
): GeminiBoardPayload | null {
  const fromBoard = normalizeBoardPayload(analysis?.board, message);
  if (fromBoard) return fromBoard;

  if (analysis?.reply) {
    const fromReply = extractBoardPayloadFromText(analysis.reply, message);
    if (fromReply) return fromReply;
  }

  return extractBoardPayloadFromText(message, message);
}

export async function processAssistantMessage(
  message: string,
  profession: StoredProfessionId | null,
  context?: {
    history?: AssistantChatTurn[];
    ragContext?: string;
  },
): Promise<GeminiAssistantResult | null> {
  if (!isGeminiConfigured()) {
    return null;
  }

  const history = context?.history ?? [];
  const ragContext = context?.ragContext ?? "No relevant past interactions retrieved yet.";
  const system = buildSystemPrompt(profession, ragContext);
  const contents = toGeminiContents(history, message);

  const analysis = await generateGeminiJson<GeminiAssistantAnalysis>({
    system,
    user: message,
    contents,
    schema: ASSISTANT_SCHEMA,
    temperature: 0.5,
  });

  const wantsBoard =
    analysis?.action === "create_board" || shouldCreateBoard(message);

  if (wantsBoard) {
    const board = resolveBoardPayload(analysis, message);
    if (board) {
      return { kind: "board", board };
    }
  }

  if (analysis?.action === "chat" && analysis.reply?.trim()) {
    const embeddedBoard = extractBoardPayloadFromText(analysis.reply, message);
    if (embeddedBoard) {
      return { kind: "board", board: embeddedBoard };
    }

    return { kind: "chat", reply: analysis.reply.trim() };
  }

  if (shouldCreateBoard(message)) {
    return null;
  }

  const fallbackReply = await generateGeminiText({
    system,
    user: message,
    contents,
    temperature: 0.7,
  });

  if (fallbackReply) {
    const boardFromFallback = extractBoardPayloadFromText(fallbackReply, message);
    if (boardFromFallback) {
      return { kind: "board", board: boardFromFallback };
    }

    return { kind: "chat", reply: fallbackReply };
  }

  return null;
}
