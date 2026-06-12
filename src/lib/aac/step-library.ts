import type { AacSymbolId } from "@/components/boards/aac-symbols";

export type StepLibraryCategoryId =
  | "morning"
  | "selfcare"
  | "school"
  | "meals"
  | "health"
  | "social"
  | "actions"
  | "core";

export type StepLibraryItem = {
  id: string;
  category: StepLibraryCategoryId;
  labelKey: string;
  symbolId: AacSymbolId;
  pictogramId: number;
  keywords: string[];
};

export const STEP_LIBRARY_CATEGORIES: { id: StepLibraryCategoryId; labelKey: string }[] = [
  { id: "morning", labelKey: "stepLibrary.categories.morning" },
  { id: "selfcare", labelKey: "stepLibrary.categories.selfcare" },
  { id: "school", labelKey: "stepLibrary.categories.school" },
  { id: "meals", labelKey: "stepLibrary.categories.meals" },
  { id: "health", labelKey: "stepLibrary.categories.health" },
  { id: "social", labelKey: "stepLibrary.categories.social" },
  { id: "actions", labelKey: "stepLibrary.categories.actions" },
  { id: "core", labelKey: "stepLibrary.categories.core" },
];

export const STEP_LIBRARY: StepLibraryItem[] = [
  { id: "wake", category: "morning", labelKey: "stepLibrary.steps.wake", symbolId: "wake", pictogramId: 8988, keywords: ["wake", "alarm", "get up"] },
  { id: "bathroom", category: "morning", labelKey: "stepLibrary.steps.bathroom", symbolId: "bathroom", pictogramId: 5921, keywords: ["bathroom", "toilet", "washroom"] },
  { id: "brush-teeth", category: "selfcare", labelKey: "stepLibrary.steps.brushTeeth", symbolId: "brush", pictogramId: 2326, keywords: ["brush teeth", "teeth", "dental"] },
  { id: "get-toothbrush", category: "selfcare", labelKey: "stepLibrary.steps.getToothbrush", symbolId: "brush", pictogramId: 2694, keywords: ["get toothbrush", "toothbrush"] },
  { id: "get-toothpaste", category: "selfcare", labelKey: "stepLibrary.steps.getToothpaste", symbolId: "brush", pictogramId: 2858, keywords: ["get toothpaste", "toothpaste"] },
  { id: "put-toothpaste", category: "selfcare", labelKey: "stepLibrary.steps.putToothpaste", symbolId: "brush", pictogramId: 11961, keywords: ["put toothpaste on brush", "put toothpaste"] },
  { id: "rinse-mouth", category: "selfcare", labelKey: "stepLibrary.steps.rinseMouth", symbolId: "water", pictogramId: 30032, keywords: ["rinse mouth", "rinse"] },
  { id: "spit-sink", category: "selfcare", labelKey: "stepLibrary.steps.spitSink", symbolId: "bathroom", pictogramId: 11748, keywords: ["spit in sink", "spit"] },
  { id: "brush-tongue", category: "selfcare", labelKey: "stepLibrary.steps.brushTongue", symbolId: "brush", pictogramId: 39427, keywords: ["brush tongue", "tongue"] },
  { id: "wash-face", category: "selfcare", labelKey: "stepLibrary.steps.washFace", symbolId: "brush", pictogramId: 2912, keywords: ["wash face", "face", "wash hands"] },
  { id: "get-dressed", category: "morning", labelKey: "stepLibrary.steps.getDressed", symbolId: "dress", pictogramId: 2781, keywords: ["get dressed", "dress", "clothes"] },
  { id: "breakfast", category: "meals", labelKey: "stepLibrary.steps.breakfast", symbolId: "eat", pictogramId: 4625, keywords: ["breakfast", "eat breakfast"] },
  { id: "pack-bag", category: "school", labelKey: "stepLibrary.steps.packBag", symbolId: "pack", pictogramId: 2475, keywords: ["pack", "backpack", "bag"] },
  { id: "shoes", category: "morning", labelKey: "stepLibrary.steps.shoes", symbolId: "shoes", pictogramId: 2622, keywords: ["shoes", "socks", "coat"] },
  { id: "leave", category: "morning", labelKey: "stepLibrary.steps.leave", symbolId: "walk", pictogramId: 3251, keywords: ["leave", "go", "depart", "bus"] },
  { id: "school", category: "school", labelKey: "stepLibrary.steps.school", symbolId: "school", pictogramId: 3082, keywords: ["school", "classroom", "class"] },
  { id: "greet", category: "school", labelKey: "stepLibrary.steps.greet", symbolId: "talk", pictogramId: 6009, keywords: ["greet", "hello", "classmates"] },
  { id: "listen", category: "school", labelKey: "stepLibrary.steps.listen", symbolId: "talk", pictogramId: 3345, keywords: ["listen", "lesson", "teacher"] },
  { id: "homework", category: "school", labelKey: "stepLibrary.steps.homework", symbolId: "school", pictogramId: 11228, keywords: ["homework", "practice", "work"] },
  { id: "wash-hands-meal", category: "meals", labelKey: "stepLibrary.steps.washHands", symbolId: "brush", pictogramId: 2912, keywords: ["wash hands before"] },
  { id: "eat", category: "meals", labelKey: "stepLibrary.steps.eat", symbolId: "eat", pictogramId: 2349, keywords: ["eat", "meal", "lunch", "dinner"] },
  { id: "drink", category: "meals", labelKey: "stepLibrary.steps.drink", symbolId: "water", pictogramId: 2248, keywords: ["drink", "water", "thirst"] },
  { id: "clear-plate", category: "meals", labelKey: "stepLibrary.steps.clearPlate", symbolId: "eat", pictogramId: 4610, keywords: ["clear plate", "clean up table"] },
  { id: "check-in", category: "health", labelKey: "stepLibrary.steps.checkIn", symbolId: "wait", pictogramId: 8109, keywords: ["check in", "reception"] },
  { id: "wait-room", category: "health", labelKey: "stepLibrary.steps.waitRoom", symbolId: "wait", pictogramId: 8109, keywords: ["waiting", "wait room"] },
  { id: "see-doctor", category: "health", labelKey: "stepLibrary.steps.seeDoctor", symbolId: "talk", pictogramId: 3345, keywords: ["doctor", "clinician", "nurse"] },
  { id: "hurt", category: "health", labelKey: "communication.tiles.hurt", symbolId: "help", pictogramId: 5484, keywords: ["hurt", "pain", "sick", "ache"] },
  { id: "bedtime", category: "selfcare", labelKey: "stepLibrary.steps.bedtime", symbolId: "wake", pictogramId: 2280, keywords: ["bedtime", "pajamas", "sleep"] },
  { id: "story", category: "selfcare", labelKey: "stepLibrary.steps.story", symbolId: "talk", pictogramId: 8115, keywords: ["story", "read", "book"] },
  { id: "yes", category: "core", labelKey: "communication.tiles.yes", symbolId: "check", pictogramId: 5583, keywords: ["yes"] },
  { id: "no", category: "core", labelKey: "communication.tiles.no", symbolId: "star", pictogramId: 5525, keywords: ["no"] },
  { id: "help", category: "core", labelKey: "communication.tiles.help", symbolId: "help", pictogramId: 4570, keywords: ["help"] },
  { id: "wait", category: "core", labelKey: "communication.tiles.wait", symbolId: "wait", pictogramId: 8109, keywords: ["wait"] },
  { id: "thanks", category: "social", labelKey: "communication.tiles.thanks", symbolId: "thank", pictogramId: 8129, keywords: ["thank", "thanks"] },
  { id: "please", category: "social", labelKey: "communication.tiles.please", symbolId: "star", pictogramId: 8194, keywords: ["please"] },
  { id: "hello", category: "social", labelKey: "communication.tiles.hello", symbolId: "talk", pictogramId: 6009, keywords: ["hello", "hi"] },
  { id: "goodbye", category: "social", labelKey: "communication.tiles.goodbye", symbolId: "walk", pictogramId: 5896, keywords: ["goodbye", "bye"] },
  { id: "go", category: "actions", labelKey: "communication.tiles.go", symbolId: "walk", pictogramId: 3251, keywords: ["go", "walk"] },
  { id: "stop", category: "actions", labelKey: "communication.tiles.stop", symbolId: "wait", pictogramId: 2499, keywords: ["stop"] },
  { id: "more", category: "actions", labelKey: "communication.tiles.more", symbolId: "eat", pictogramId: 5508, keywords: ["more"] },
  { id: "done", category: "actions", labelKey: "communication.tiles.done", symbolId: "check", pictogramId: 28429, keywords: ["done", "finished", "complete"] },
];

export function getLibraryItemsByCategory(category: StepLibraryCategoryId): StepLibraryItem[] {
  return STEP_LIBRARY.filter((item) => item.category === category);
}

export function filterLibraryItems(query: string, category: StepLibraryCategoryId | "all"): StepLibraryItem[] {
  const normalized = query.trim().toLowerCase();
  const pool =
    category === "all" ? STEP_LIBRARY : STEP_LIBRARY.filter((item) => item.category === category);

  if (!normalized) return pool;

  return pool.filter((item) =>
    item.keywords.some((keyword) => keyword.includes(normalized) || normalized.includes(keyword)),
  );
}

export function matchLibraryItem(stepText: string): StepLibraryItem | null {
  const haystack = stepText.toLowerCase();
  let best: StepLibraryItem | null = null;
  let bestScore = 0;

  for (const item of STEP_LIBRARY) {
    for (const keyword of item.keywords) {
      if (haystack.includes(keyword.toLowerCase()) && keyword.length > bestScore) {
        best = item;
        bestScore = keyword.length;
      }
    }
  }

  return best;
}
