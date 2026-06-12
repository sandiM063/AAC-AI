import type { AacSymbolId } from "@/components/boards/aac-symbols";
import { lookupInteractivePictogramByLabel } from "@/lib/communication/interactive-pictograms";

export type PictogramOverride = {
  symbolId: AacSymbolId;
  pictogramId: number;
};

/** Curated ARASAAC IDs — avoids ambiguous search hits (e.g. spitting at a person). */
const EXACT_OVERRIDES: Record<string, PictogramOverride> = {
  "get toothbrush": { symbolId: "brush", pictogramId: 2694 },
  "get toothpaste": { symbolId: "brush", pictogramId: 2858 },
  "wet toothbrush": { symbolId: "brush", pictogramId: 2694 },
  "put toothpaste on brush": { symbolId: "brush", pictogramId: 11961 },
  "brush top teeth": { symbolId: "brush", pictogramId: 2326 },
  "brush bottom teeth": { symbolId: "brush", pictogramId: 2326 },
  "brush teeth": { symbolId: "brush", pictogramId: 2326 },
  "brush tongue": { symbolId: "brush", pictogramId: 39427 },
  "spit in sink": { symbolId: "bathroom", pictogramId: 11748 },
  "rinse mouth": { symbolId: "water", pictogramId: 30032 },
  "rinse toothbrush": { symbolId: "brush", pictogramId: 11963 },
  "put toothbrush away": { symbolId: "brush", pictogramId: 11963 },
};

const PATTERN_OVERRIDES: { pattern: RegExp; override: PictogramOverride }[] = [
  { pattern: /spit.*sink|sink.*spit/i, override: { symbolId: "bathroom", pictogramId: 11748 } },
  { pattern: /rinse.*mouth|mouth.*rinse/i, override: { symbolId: "water", pictogramId: 30032 } },
  { pattern: /toothpaste/i, override: { symbolId: "brush", pictogramId: 2858 } },
  { pattern: /toothbrush/i, override: { symbolId: "brush", pictogramId: 2694 } },
  { pattern: /brush.*teeth|teeth.*brush/i, override: { symbolId: "brush", pictogramId: 2326 } },
  { pattern: /brush.*tongue|tongue.*brush/i, override: { symbolId: "brush", pictogramId: 39427 } },
];

const BLOCKED_KEYWORDS = [
  "disruptive",
  "violence",
  "fight",
  "hit",
  "kick",
  "another person",
  "at someone",
];

export function getCuratedPictogramOverride(stepText: string): PictogramOverride | null {
  const normalized = stepText.trim().toLowerCase();
  if (!normalized) return null;

  const interactive = lookupInteractivePictogramByLabel(stepText);
  if (interactive) return interactive;

  const exact = EXACT_OVERRIDES[normalized];
  if (exact) return exact;

  for (const { pattern, override } of PATTERN_OVERRIDES) {
    if (pattern.test(stepText)) return override;
  }

  return null;
}

export function scoreArasaacHit(
  stepText: string,
  hitLabel: string,
  hitViolence?: boolean,
): number {
  if (hitViolence) return -100;

  const stepWords = stepText
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);
  const label = hitLabel.toLowerCase();

  if (BLOCKED_KEYWORDS.some((blocked) => label.includes(blocked))) {
    return -50;
  }

  let score = 0;
  for (const word of stepWords) {
    if (label.includes(word)) score += word.length;
  }

  if (label.includes("hygiene") || label.includes("routine")) score += 2;
  if (stepText.toLowerCase().includes("spit") && label.includes("spit") && label.includes("sink")) {
    score += 20;
  }
  if (stepText.toLowerCase().includes("spit") && !label.includes("sink") && label.includes("spit")) {
    score -= 15;
  }

  return score;
}
