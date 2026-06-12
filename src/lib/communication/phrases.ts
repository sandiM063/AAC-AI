import type { AacSymbolId } from "@/components/boards/aac-symbols";
import {
  STEP_LIBRARY,
  STEP_LIBRARY_CATEGORIES,
  type StepLibraryCategoryId,
} from "@/lib/aac/step-library";

export type PhraseCategoryId = StepLibraryCategoryId;

export type PhraseTileDef = {
  id: string;
  symbolId: AacSymbolId;
  pictogramId: number;
  labelKey: string;
};

export const PHRASE_CATEGORIES = STEP_LIBRARY_CATEGORIES;

function tilesForCategory(category: StepLibraryCategoryId): PhraseTileDef[] {
  return STEP_LIBRARY.filter((item) => item.category === category).map((item) => ({
    id: item.id,
    symbolId: item.symbolId,
    pictogramId: item.pictogramId,
    labelKey: item.labelKey,
  }));
}

export const PHRASE_TILES: Record<PhraseCategoryId, PhraseTileDef[]> = {
  morning: tilesForCategory("morning"),
  selfcare: tilesForCategory("selfcare"),
  school: tilesForCategory("school"),
  meals: tilesForCategory("meals"),
  health: tilesForCategory("health"),
  social: tilesForCategory("social"),
  actions: tilesForCategory("actions"),
  core: tilesForCategory("core"),
};

export const ALL_PHRASE_TILES: PhraseTileDef[] = STEP_LIBRARY.map((item) => ({
  id: item.id,
  symbolId: item.symbolId,
  pictogramId: item.pictogramId,
  labelKey: item.labelKey,
}));
