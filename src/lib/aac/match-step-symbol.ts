import type { AacSymbolId } from "@/components/boards/aac-symbols";

const SYMBOL_RULES: { keywords: string[]; symbol: AacSymbolId }[] = [
  { keywords: ["wake", "stretch", "alarm"], symbol: "wake" },
  { keywords: ["bathroom", "toilet", "washroom", "restroom", "sink"], symbol: "bathroom" },
  { keywords: ["brush", "teeth", "toothbrush", "toothpaste", "dental"], symbol: "brush" },
  { keywords: ["shower", "bathe", "bath"], symbol: "bathroom" },
  { keywords: ["dress", "clothes", "shirt", "coat"], symbol: "dress" },
  { keywords: ["breakfast", "meal", "lunch", "dinner", "food", "snack"], symbol: "eat" },
  { keywords: ["pack", "backpack", "bag", "gather"], symbol: "pack" },
  { keywords: ["shoe", "socks", "boot"], symbol: "shoes" },
  { keywords: ["leave", "depart", "bus", "travel"], symbol: "walk" },
  { keywords: ["school", "class", "classroom", "lesson", "learn", "student"], symbol: "school" },
  { keywords: ["water", "drink", "thirst", "rinse"], symbol: "water" },
  { keywords: ["talk", "meet", "discuss", "explain", "greet", "hello", "symptom", "consent"], symbol: "talk" },
  { keywords: ["wait", "reception", "check in", "waiting"], symbol: "wait" },
  { keywords: ["thank", "celebrate", "done", "finish", "complete"], symbol: "thank" },
  { keywords: ["review", "check progress", "confirm", "double"], symbol: "check" },
  { keywords: ["problem", "help", "support", "care", "hurt", "pain"], symbol: "help" },
  { keywords: ["doctor", "clinic", "nurse", "patient", "exam", "clinical"], symbol: "talk" },
  { keywords: ["prescription", "medicine", "follow"], symbol: "pack" },
  { keywords: ["clean", "wipe", "clear"], symbol: "brush" },
  { keywords: ["schedule", "plan", "next"], symbol: "star" },
];

function containsKeyword(haystack: string, keyword: string): boolean {
  if (keyword.includes(" ")) {
    return haystack.includes(keyword);
  }
  const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return pattern.test(haystack);
}

export function matchStepSymbol(stepText: string): AacSymbolId {
  const haystack = stepText.toLowerCase();

  for (const rule of SYMBOL_RULES) {
    if (rule.keywords.some((word) => containsKeyword(haystack, word))) {
      return rule.symbol;
    }
  }

  return "star";
}
