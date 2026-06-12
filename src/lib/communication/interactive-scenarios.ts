import type { AacSymbolId } from "@/components/boards/aac-symbols";
import { getInteractivePictogram } from "@/lib/communication/interactive-pictograms";
import { enMessages } from "@/lib/i18n/messages/en";

export type ChoiceTileInput = {
  label: string;
  symbolId?: string;
};

export type InteractiveChoiceOption = {
  id: string;
  labelKey: string;
  symbolId: AacSymbolId;
  pictogramId: number;
};

export type InteractiveScenario = {
  id: string;
  titleKey: string;
  questionKey: string;
  outcomePrefixKey: string;
  categoryKey: string;
  allowMultiple?: boolean;
  options: InteractiveChoiceOption[];
  followUp?: {
    questionKey: string;
    outcomePrefixKey: string;
    options: InteractiveChoiceOption[];
    triggerOptionIds?: string[];
  };
};

function choiceOption(id: string, labelKey: string): InteractiveChoiceOption {
  const { symbolId, pictogramId } = getInteractivePictogram(id);
  return { id, labelKey, symbolId, pictogramId };
}

export const INTERACTIVE_SCENARIOS: InteractiveScenario[] = [
  {
    id: "breakfast",
    titleKey: "interactive.scenarios.breakfast.title",
    questionKey: "interactive.scenarios.breakfast.question",
    outcomePrefixKey: "interactive.scenarios.breakfast.outcome",
    categoryKey: "interactive.categories.meals",
    allowMultiple: true,
    options: [
      choiceOption("eggs", "interactive.options.eggs"),
      choiceOption("bacon", "interactive.options.bacon"),
      choiceOption("cereal", "interactive.options.cereal"),
      choiceOption("pancakes", "interactive.options.pancakes"),
      choiceOption("fruit", "interactive.options.fruit"),
      choiceOption("toast", "interactive.options.toast"),
      choiceOption("yogurt", "interactive.options.yogurt"),
    ],
    followUp: {
      questionKey: "interactive.scenarios.breakfast.drinkQuestion",
      outcomePrefixKey: "interactive.scenarios.breakfast.drinkOutcome",
      options: [
        choiceOption("water", "interactive.options.water"),
        choiceOption("juice", "interactive.options.juice"),
        choiceOption("milk", "interactive.options.milk"),
      ],
    },
  },
  {
    id: "where-to-go",
    titleKey: "interactive.scenarios.whereToGo.title",
    questionKey: "interactive.scenarios.whereToGo.question",
    outcomePrefixKey: "interactive.scenarios.whereToGo.outcome",
    categoryKey: "interactive.categories.outings",
    options: [
      choiceOption("park", "interactive.options.park"),
      choiceOption("waterpark", "interactive.options.waterpark"),
      choiceOption("mall", "interactive.options.mall"),
      choiceOption("library", "interactive.options.library"),
      choiceOption("school", "interactive.options.school"),
      choiceOption("home", "interactive.options.home"),
      choiceOption("beach", "interactive.options.beach"),
    ],
    followUp: {
      questionKey: "interactive.scenarios.whereToGo.transportQuestion",
      outcomePrefixKey: "interactive.scenarios.whereToGo.transportOutcome",
      options: [
        choiceOption("walk", "interactive.options.walkThere"),
        choiceOption("car", "interactive.options.car"),
        choiceOption("bus", "interactive.options.bus"),
      ],
    },
  },
  {
    id: "lunch",
    titleKey: "interactive.scenarios.lunch.title",
    questionKey: "interactive.scenarios.lunch.question",
    outcomePrefixKey: "interactive.scenarios.lunch.outcome",
    categoryKey: "interactive.categories.meals",
    options: [
      choiceOption("sandwich", "interactive.options.sandwich"),
      choiceOption("soup", "interactive.options.soup"),
      choiceOption("salad", "interactive.options.salad"),
      choiceOption("pizza", "interactive.options.pizza"),
      choiceOption("chicken", "interactive.options.chicken"),
    ],
  },
  {
    id: "activity",
    titleKey: "interactive.scenarios.activity.title",
    questionKey: "interactive.scenarios.activity.question",
    outcomePrefixKey: "interactive.scenarios.activity.outcome",
    categoryKey: "interactive.categories.activities",
    options: [
      choiceOption("tv", "interactive.options.watchTv"),
      choiceOption("read", "interactive.options.read"),
      choiceOption("play", "interactive.options.play"),
      choiceOption("music", "interactive.options.music"),
      choiceOption("rest", "interactive.options.rest"),
    ],
  },
  {
    id: "feelings",
    titleKey: "interactive.scenarios.feelings.title",
    questionKey: "interactive.scenarios.feelings.question",
    outcomePrefixKey: "interactive.scenarios.feelings.outcome",
    categoryKey: "interactive.categories.feelings",
    options: [
      choiceOption("happy", "interactive.options.happy"),
      choiceOption("sad", "interactive.options.sad"),
      choiceOption("tired", "interactive.options.tired"),
      choiceOption("hurt", "interactive.options.hurt"),
      choiceOption("angry", "interactive.options.angry"),
      choiceOption("okay", "interactive.options.okay"),
    ],
  },
  {
    id: "clothing",
    titleKey: "interactive.scenarios.clothing.title",
    questionKey: "interactive.scenarios.clothing.question",
    outcomePrefixKey: "interactive.scenarios.clothing.outcome",
    categoryKey: "interactive.categories.daily",
    options: [
      choiceOption("shirt", "interactive.options.shirt"),
      choiceOption("pants", "interactive.options.pants"),
      choiceOption("jacket", "interactive.options.jacket"),
      choiceOption("shoes", "interactive.options.shoes"),
      choiceOption("hat", "interactive.options.hat"),
    ],
  },
];

const SCENARIO_KEYWORDS: Record<string, string[]> = {
  breakfast: ["eat breakfast", "for breakfast", "breakfast", "hungry", "morning meal"],
  lunch: ["for lunch", "eat lunch", "lunch", "noon", "midday eat"],
  "where-to-go": ["where to go", "water park", "waterpark", "visit", "outing", "travel", "park"],
  activity: ["what to do", "activity", "want to play", "play outside"],
  feelings: ["how feel", "feeling", "how are you", "sad", "happy"],
  clothing: ["what to wear", "get dressed", "outfit", "clothes"],
};

const MEAL_ETIQUETTE_STEP =
  /\b(wash\s*hands|drink\s*water|clear\s*plate|sit\s*at|say\s*thank|thank\s*you)\b/i;

export function matchScenarioFromText(text: string): InteractiveScenario | null {
  const lower = text.toLowerCase();
  let bestId: string | null = null;
  let bestScore = 0;

  for (const [scenarioId, keywords] of Object.entries(SCENARIO_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword) && keyword.length > bestScore) {
        bestId = scenarioId;
        bestScore = keyword.length;
      }
    }
  }

  if (!bestId) return null;
  return INTERACTIVE_SCENARIOS.find((scenario) => scenario.id === bestId) ?? null;
}

export function getScenarioById(id: string): InteractiveScenario | undefined {
  return INTERACTIVE_SCENARIOS.find((scenario) => scenario.id === id);
}

export function resolveInteractiveLabel(labelKey: string): string {
  const parts = labelKey.split(".");
  let node: unknown = enMessages;
  for (const part of parts) {
    if (!node || typeof node !== "object" || !(part in node)) {
      return labelKey;
    }
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : labelKey;
}

export function getScenarioQuestionLabel(scenario: InteractiveScenario): string {
  return resolveInteractiveLabel(scenario.questionKey);
}

export function getScenarioOptionLabels(scenario: InteractiveScenario): string[] {
  return scenario.options.map((option) => resolveInteractiveLabel(option.labelKey));
}

function isMealEtiquetteRoutine(labels: string[]): boolean {
  if (labels.length < 2) return false;
  return labels.every((label) => MEAL_ETIQUETTE_STEP.test(label));
}

function hasMealChoiceIntent(lower: string): boolean {
  return /\b(breakfast|lunch|dinner|hungry|eat|food|meal|snack)\b/.test(lower);
}

/** Detect when a symbol message is asking for a preference, not a hygiene routine. */
export function resolveChoiceScenarioFromTiles(tiles: ChoiceTileInput[]): InteractiveScenario | null {
  const labels = tiles.map((tile) => tile.label.trim()).filter(Boolean);
  if (labels.length === 0) return null;

  const text = labels.join(" ");
  const lower = text.toLowerCase();

  const fromText = matchScenarioFromText(text);
  if (fromText) return fromText;

  if (/\b(breakfast|eat breakfast|hungry|morning meal)\b/.test(lower)) {
    return getScenarioById("breakfast") ?? null;
  }
  if (/\b(lunch|eat lunch)\b/.test(lower)) {
    return getScenarioById("lunch") ?? null;
  }

  if (
    isMealEtiquetteRoutine(labels) &&
    hasMealChoiceIntent(lower) &&
    !/\b(after|before)\s+(eating|meal)\b/.test(lower)
  ) {
    if (/breakfast|morning/.test(lower)) return getScenarioById("breakfast") ?? null;
    if (/lunch/.test(lower)) return getScenarioById("lunch") ?? null;
    return getScenarioById("breakfast") ?? null;
  }

  if (labels.length <= 4 && hasMealChoiceIntent(lower) && !isMealEtiquetteRoutine(labels)) {
    if (/lunch/.test(lower)) return getScenarioById("lunch") ?? null;
    return getScenarioById("breakfast") ?? null;
  }

  return null;
}
