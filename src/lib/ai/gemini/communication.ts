import { Type } from "@google/genai";
import {
  interpretCommunicationSymbols,
  isVagueInterpretText,
  mergeInterpretResult,
  mergeSuggestReplyResult,
  mentionsSelectedSymbols,
  suggestReplyForSymbols,
  type CommunicationTileInput,
  type InterpretResult,
  type SuggestReplyResult,
} from "@/lib/ai/interpret-communication-symbols";
import {
  getScenarioOptionLabels,
  getScenarioQuestionLabel,
  resolveChoiceScenarioFromTiles,
} from "@/lib/communication/interactive-scenarios";
import { generateGeminiJson, generateGeminiText } from "@/lib/ai/gemini/client";
import { AAC_SYSTEM_PREAMBLE } from "@/lib/ai/gemini/prompts";
import { isGeminiConfigured } from "@/lib/ai/gemini/config";

export type { CommunicationTileInput, InterpretResult };

export type { SuggestReplyResult };

export type ToStepsResult = {
  taskTitle: string;
  steps: string[];
  useInteractiveChoices?: boolean;
  scenarioId?: string;
};

function formatTiles(tiles: CommunicationTileInput[]): string {
  return tiles.map((tile, index) => `${index + 1}. ${tile.label}`).join("\n");
}

function fallbackInterpret(tiles: CommunicationTileInput[]): InterpretResult {
  return interpretCommunicationSymbols(tiles);
}

function fallbackSuggestReply(tiles: CommunicationTileInput[]): SuggestReplyResult {
  const choiceScenario = resolveChoiceScenarioFromTiles(tiles);

  if (choiceScenario) {
    const options = getScenarioOptionLabels(choiceScenario).slice(0, 4);
    return {
      reply: `${getScenarioQuestionLabel(choiceScenario)} Let's pick together.`,
      quickOptions: options,
    };
  }

  return suggestReplyForSymbols(tiles);
}

function fallbackToSteps(tiles: CommunicationTileInput[]): ToStepsResult {
  const steps = tiles.map((tile) => tile.label.trim()).filter(Boolean);
  return {
    taskTitle: steps[0] ? `${steps[0]} routine` : "New routine",
    steps: steps.length >= 2 ? steps : [...steps, "Finish"],
  };
}

const INTERPRET_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    intent: { type: Type.STRING },
    caregiverNote: { type: Type.STRING },
  },
  required: ["summary", "intent", "caregiverNote"],
};

const REPLY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    reply: { type: Type.STRING },
    quickOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["reply", "quickOptions"],
};

const STEPS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    taskTitle: { type: Type.STRING },
    steps: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["taskTitle", "steps"],
};

export async function interpretCommunicationMessage(
  tiles: CommunicationTileInput[],
): Promise<InterpretResult> {
  if (!isGeminiConfigured()) {
    return fallbackInterpret(tiles);
  }

  const labels = tiles.map((tile) => tile.label.trim()).filter(Boolean);
  const symbolList = labels.map((label) => `"${label}"`).join(", ");

  const system = `${AAC_SYSTEM_PREAMBLE}

You help caregivers understand AAC symbol messages from people who may have limited speech.

Rules:
- Symbols tapped (in order): ${symbolList || "none"}.
- Synthesize ONE plain-language meaning. Do NOT list each symbol separately or say "communicating X, then communicating Y".
- Repeated symbols (e.g. Urgent × 3) mean stronger emphasis, not three separate ideas.
- Pronouns like "I" are grammar — fold them into the meaning (e.g. "I" + "Pee" + "Urgent" = "I urgently need to pee").
- summary: ONE short sentence (max ~20 words) stating what they mean.
- intent: ONE short sentence (max ~12 words) — the core need or feeling.
- caregiverNote: ONE actionable sentence for what to do right now.
- Never use filler like "expressing a need" or "using AAC symbols".`;

  const result = await generateGeminiJson<InterpretResult>({
    system,
    user: `Symbols selected (in order):\n${formatTiles(tiles)}\n\nInterpret this exact sequence.`,
    schema: INTERPRET_SCHEMA,
    temperature: 0.35,
  });

  if (result?.summary?.trim()) {
    return mergeInterpretResult(result, tiles);
  }

  const text = await generateGeminiText({
    system,
    user: `Symbols (in order):\n${formatTiles(tiles)}\n\nWhat is this message trying to say? One short synthesized sentence.`,
    temperature: 0.4,
  });

  if (text && !isVagueInterpretText(text) && mentionsSelectedSymbols(text, labels)) {
    const local = interpretCommunicationSymbols(tiles);
    return {
      summary: text.trim(),
      intent: local.intent,
      caregiverNote: local.caregiverNote,
    };
  }

  return fallbackInterpret(tiles);
}

export async function suggestCommunicationReply(
  tiles: CommunicationTileInput[],
): Promise<SuggestReplyResult> {
  const choiceScenario = resolveChoiceScenarioFromTiles(tiles);
  if (choiceScenario) {
    const options = getScenarioOptionLabels(choiceScenario).slice(0, 4);
    return {
      reply: `${getScenarioQuestionLabel(choiceScenario)} Let's pick together.`,
      quickOptions: options,
    };
  }

  const rulesReply = suggestReplyForSymbols(tiles);
  const labels = tiles.map((tile) => tile.label.trim()).filter(Boolean);
  const joined = labels.join(" ").toLowerCase();
  const hasKnownNeed =
    /\b(toilet|bathroom|potty|pee|hurt|pain|water|drink|hungry|eat|food|help|urgent)\b/i.test(joined);

  if (hasKnownNeed || !isGeminiConfigured()) {
    return rulesReply;
  }

  const system = `${AAC_SYSTEM_PREAMBLE}

Suggest a short spoken reply a caregiver can say back to someone using AAC symbols.

Rules:
- ONE or TWO short sentences the caregiver says aloud — direct and caring.
- Match the actual need (bathroom, pain, food, drink, yes/no, etc.).
- quickOptions: 2–3 brief phrases the caregiver could say next — specific to THIS message.
- NEVER use generic filler like "I hear you", "can you show me more", or "let's do that together" unless the message is truly unclear.
- Toilet + Pee + Urgent → "I understand — you need to pee right now. Let's go to the bathroom."`;

  const result = await generateGeminiJson<SuggestReplyResult>({
    system,
    user: `The person communicated:\n${formatTiles(tiles)}\n\nSuggest a caring reply.`,
    schema: REPLY_SCHEMA,
    temperature: 0.5,
  });

  if (result?.reply?.trim()) {
    return mergeSuggestReplyResult(result, tiles);
  }

  return rulesReply;
}

function choiceStepsResult(tiles: CommunicationTileInput[]): ToStepsResult | null {
  const scenario = resolveChoiceScenarioFromTiles(tiles);
  if (!scenario) return null;

  return {
    taskTitle: getScenarioQuestionLabel(scenario),
    steps: getScenarioOptionLabels(scenario),
    useInteractiveChoices: true,
    scenarioId: scenario.id,
  };
}

export async function communicationMessageToSteps(
  tiles: CommunicationTileInput[],
): Promise<ToStepsResult> {
  const choiceResult = choiceStepsResult(tiles);
  if (choiceResult) {
    return choiceResult;
  }

  if (!isGeminiConfigured()) {
    return fallbackToSteps(tiles);
  }

  const system = `${AAC_SYSTEM_PREAMBLE}

Turn an AAC symbol message into a clear task-board routine with ordered steps.
Use the symbols as hints — expand into practical action steps suitable for AAC tiles.

IMPORTANT:
- If the person is asking WHAT they want (food, place to go, activity, clothes, feelings), list the choice options they can pick — NOT a hygiene or etiquette routine.
- Example: "breakfast" or "hungry" → options like Eggs, Bacon, Cereal — NOT "wash hands", "drink water", "say thank you".
- Only create sequential routine steps when the message describes doing a multi-step activity in order.

Minimum 2 steps, maximum 10.`;

  const result = await generateGeminiJson<ToStepsResult>({
    system,
    user: `Symbol message:\n${formatTiles(tiles)}\n\nCreate a routine title and ordered steps.`,
    schema: STEPS_SCHEMA,
    temperature: 0.4,
  });

  const steps = (result?.steps ?? [])
    .map((step) => step.trim())
    .filter((step) => step.length >= 2)
    .slice(0, 10);

  if (steps.length >= 2 && result?.taskTitle?.trim()) {
    const generated = { taskTitle: result.taskTitle.trim(), steps };
    if (looksLikeMealEtiquetteRoutine(steps) && hasMealSymbols(tiles)) {
      const retry = choiceStepsResult(tiles);
      if (retry) return retry;
    }
    return generated;
  }

  return fallbackToSteps(tiles);
}

function hasMealSymbols(tiles: CommunicationTileInput[]): boolean {
  const text = tiles.map((tile) => tile.label).join(" ").toLowerCase();
  return /\b(breakfast|lunch|dinner|hungry|eat|food|meal)\b/.test(text);
}

function looksLikeMealEtiquetteRoutine(steps: string[]): boolean {
  const joined = steps.join(" ").toLowerCase();
  const etiquetteHits = ["wash hands", "drink water", "say thank", "clear plate", "sit at"].filter(
    (phrase) => joined.includes(phrase),
  ).length;
  const foodHits = ["egg", "bacon", "cereal", "pancake", "toast", "sandwich", "pizza"].filter(
    (phrase) => joined.includes(phrase),
  ).length;
  return etiquetteHits >= 2 && foodHits === 0;
}
