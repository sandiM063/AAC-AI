import type { AacSymbolId } from "@/components/boards/aac-symbols";

/**
 * Curated ARASAAC pictogram IDs for interactive choice options.
 * Verified via api.arasaac.org search — avoids bogus numeric IDs (e.g. 4620 = "weak").
 */
export type InteractivePictogram = {
  pictogramId: number;
  symbolId: AacSymbolId;
};

export const INTERACTIVE_PICTOGRAMS: Record<string, InteractivePictogram> = {
  eggs: { pictogramId: 2427, symbolId: "eat" },
  bacon: { pictogramId: 38951, symbolId: "eat" },
  cereal: { pictogramId: 4626, symbolId: "eat" },
  pancakes: { pictogramId: 37849, symbolId: "eat" },
  fruit: { pictogramId: 28339, symbolId: "eat" },
  toast: { pictogramId: 2787, symbolId: "eat" },
  yogurt: { pictogramId: 2618, symbolId: "eat" },
  water: { pictogramId: 2248, symbolId: "water" },
  juice: { pictogramId: 11461, symbolId: "water" },
  milk: { pictogramId: 2445, symbolId: "water" },
  park: { pictogramId: 2859, symbolId: "walk" },
  waterpark: { pictogramId: 30979, symbolId: "water" },
  mall: { pictogramId: 15551, symbolId: "walk" },
  library: { pictogramId: 6063, symbolId: "school" },
  school: { pictogramId: 3082, symbolId: "school" },
  home: { pictogramId: 6964, symbolId: "wake" },
  beach: { pictogramId: 30518, symbolId: "walk" },
  walkThere: { pictogramId: 3251, symbolId: "walk" },
  walk: { pictogramId: 3251, symbolId: "walk" },
  car: { pictogramId: 2339, symbolId: "walk" },
  bus: { pictogramId: 2262, symbolId: "walk" },
  sandwich: { pictogramId: 2281, symbolId: "eat" },
  soup: { pictogramId: 2573, symbolId: "eat" },
  salad: { pictogramId: 2377, symbolId: "eat" },
  pizza: { pictogramId: 2527, symbolId: "eat" },
  chicken: { pictogramId: 4952, symbolId: "eat" },
  watchTv: { pictogramId: 25498, symbolId: "star" },
  tv: { pictogramId: 25498, symbolId: "star" },
  read: { pictogramId: 7141, symbolId: "school" },
  play: { pictogramId: 2859, symbolId: "walk" },
  music: { pictogramId: 2746, symbolId: "talk" },
  rest: { pictogramId: 16643, symbolId: "wake" },
  happy: { pictogramId: 35533, symbolId: "thank" },
  sad: { pictogramId: 35545, symbolId: "help" },
  tired: { pictogramId: 35537, symbolId: "wake" },
  hurt: { pictogramId: 5484, symbolId: "help" },
  angry: { pictogramId: 35539, symbolId: "wait" },
  okay: { pictogramId: 5397, symbolId: "check" },
  shirt: { pictogramId: 2309, symbolId: "dress" },
  pants: { pictogramId: 2565, symbolId: "dress" },
  jacket: { pictogramId: 4872, symbolId: "dress" },
  shoes: { pictogramId: 2622, symbolId: "shoes" },
  hat: { pictogramId: 2412, symbolId: "dress" },
};

export function getInteractivePictogram(optionId: string): InteractivePictogram {
  return (
    INTERACTIVE_PICTOGRAMS[optionId] ?? {
      pictogramId: 2349,
      symbolId: "eat",
    }
  );
}

const INTERACTIVE_LABEL_TO_ID: Record<string, string> = {
  eggs: "eggs",
  bacon: "bacon",
  cereal: "cereal",
  pancakes: "pancakes",
  fruit: "fruit",
  toast: "toast",
  yogurt: "yogurt",
  water: "water",
  juice: "juice",
  milk: "milk",
  park: "park",
  "water park": "waterpark",
  mall: "mall",
  library: "library",
  school: "school",
  home: "home",
  beach: "beach",
  walk: "walk",
  car: "car",
  bus: "bus",
  sandwich: "sandwich",
  soup: "soup",
  salad: "salad",
  pizza: "pizza",
  chicken: "chicken",
  "watch tv": "tv",
  read: "read",
  "play outside": "play",
  "listen to music": "music",
  rest: "rest",
  happy: "happy",
  sad: "sad",
  tired: "tired",
  hurt: "hurt",
  angry: "angry",
  okay: "okay",
  shirt: "shirt",
  pants: "pants",
  jacket: "jacket",
  shoes: "shoes",
  hat: "hat",
};

/** Match English choice labels when they appear on boards or in messages. */
export function lookupInteractivePictogramByLabel(label: string): InteractivePictogram | null {
  const normalized = label.trim().toLowerCase();
  const optionId = INTERACTIVE_LABEL_TO_ID[normalized];
  if (!optionId) return null;
  return getInteractivePictogram(optionId);
}
