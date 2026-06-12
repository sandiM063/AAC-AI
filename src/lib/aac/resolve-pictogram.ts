import type { AacSymbolId } from "@/components/boards/aac-symbols";
import {
  DEFAULT_ARASAAC_PICTOGRAM_ID,
  getPictogramIdForSymbol,
} from "@/lib/aac/arasaac";
import { matchStepSymbol } from "@/lib/aac/match-step-symbol";
import {
  getCuratedPictogramOverride,
  scoreArasaacHit,
} from "@/lib/aac/pictogram-overrides";
import { matchLibraryItem } from "@/lib/aac/step-library";

type ArasaacKeyword = { keyword?: string; type?: number };
type ArasaacSearchResult = {
  _id?: number;
  keywords?: ArasaacKeyword[];
  violence?: boolean;
};

export type ArasaacSearchHit = {
  id: number;
  label: string;
  violence?: boolean;
};

function pickLabel(result: ArasaacSearchResult): string {
  const keywords = result.keywords ?? [];
  const english = keywords.find((item) => item.keyword)?.keyword;
  return english ?? `Symbol ${result._id ?? ""}`.trim();
}

export async function searchArasaacPictograms(
  query: string,
  lang = "en",
  limit = 20,
): Promise<ArasaacSearchHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const searchRes = await fetch(
      `https://api.arasaac.org/api/pictograms/${lang}/search/${encodeURIComponent(trimmed)}`,
      { next: { revalidate: 86400 } },
    );
    if (!searchRes.ok) return [];

    const results = (await searchRes.json()) as ArasaacSearchResult[];
    return results.slice(0, limit).flatMap((result) => {
      if (!result._id) return [];
      return [
        {
          id: result._id,
          label: pickLabel(result),
          violence: result.violence,
        },
      ];
    });
  } catch {
    return [];
  }
}

function searchQueryForStep(stepText: string): string {
  const library = matchLibraryItem(stepText);
  if (library) return library.keywords[0] ?? stepText;

  const curated = getCuratedPictogramOverride(stepText);
  if (curated) return stepText;

  const lower = stepText.toLowerCase();
  if (lower.includes("spit") && lower.includes("sink")) return "spit in sink";
  if (lower.includes("rinse") && lower.includes("mouth")) return "rinse mouth";

  const cleaned = stepText
    .replace(/^(prepare for|gather what you need|start the first part of|finish|complete|celebrate)\s*/i, "")
    .trim();

  return cleaned || stepText;
}

async function pickBestArasaacPictogram(
  stepText: string,
  lang = "en",
): Promise<number | null> {
  const queries = [searchQueryForStep(stepText), stepText.trim()].filter(
    (query, index, list) => query && list.indexOf(query) === index,
  );

  let best: { id: number; score: number } | null = null;

  for (const query of queries) {
    const hits = await searchArasaacPictograms(query, lang, 8);
    for (const hit of hits) {
      const score = scoreArasaacHit(stepText, hit.label, hit.violence);
      if (!best || score > best.score) {
        best = { id: hit.id, score };
      }
    }
  }

  if (!best || best.score < 1) return null;
  return best.id;
}

export async function resolvePictogramForStepText(stepText: string): Promise<{
  symbolId: AacSymbolId;
  pictogramId: number;
}> {
  const curated = getCuratedPictogramOverride(stepText);
  if (curated) return curated;

  const library = matchLibraryItem(stepText);
  if (library) {
    return { symbolId: library.symbolId, pictogramId: library.pictogramId };
  }

  const symbolId = matchStepSymbol(stepText);
  const fallback = getPictogramIdForSymbol(symbolId);
  const found = await pickBestArasaacPictogram(stepText);
  return {
    symbolId,
    pictogramId: found ?? fallback,
  };
}

export async function resolvePictogramIdsForSteps(
  stepTexts: string[],
): Promise<{ symbolId: AacSymbolId; pictogramId: number }[]> {
  return Promise.all(stepTexts.map((text) => resolvePictogramForStepText(text)));
}

export function fallbackPictogramForSymbol(symbolId: AacSymbolId): number {
  return getPictogramIdForSymbol(symbolId) || DEFAULT_ARASAAC_PICTOGRAM_ID;
}
