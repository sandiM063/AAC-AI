import type { AacSymbolId } from "@/components/boards/aac-symbols";

/** Default ARASAAC pictogram when no better match is found (activity). */
export const DEFAULT_ARASAAC_PICTOGRAM_ID = 8008;

/** Curated ARASAAC pictogram IDs (api.arasaac.org, CC BY-NC-SA). */
export const SYMBOL_PICTOGRAM_IDS: Record<AacSymbolId, number> = {
  wake: 8988,
  bathroom: 5921,
  brush: 2326,
  dress: 2781,
  eat: 2349,
  pack: 2475,
  shoes: 2622,
  walk: 3251,
  school: 3082,
  water: 2248,
  talk: 3345,
  wait: 8109,
  thank: 8129,
  check: 5583,
  star: DEFAULT_ARASAAC_PICTOGRAM_ID,
  help: 4570,
};

/** ARASAAC static CDN only serves 300px and 500px variants. */
export function getArasaacPictogramSize(requested = 300): 300 | 500 {
  return requested >= 400 ? 500 : 300;
}

export function getArasaacPictogramUrl(pictogramId: number, size = 300): string {
  const resolved = getArasaacPictogramSize(size);
  return `https://static.arasaac.org/pictograms/${pictogramId}/${pictogramId}_${resolved}.png`;
}

export function getPictogramIdForSymbol(symbolId: AacSymbolId): number {
  return SYMBOL_PICTOGRAM_IDS[symbolId] ?? DEFAULT_ARASAAC_PICTOGRAM_ID;
}

export function resolvePictogramId(
  symbolId: AacSymbolId,
  pictogramId?: number | null,
): number {
  if (pictogramId && pictogramId > 0) return pictogramId;
  return getPictogramIdForSymbol(symbolId);
}
