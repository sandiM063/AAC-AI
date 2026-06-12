import type { AacSymbolId } from "@/components/boards/aac-symbols";

export type CommunityPresetType = "task" | "communication";

export type CommunityPresetTile = {
  label: string;
  symbolId: AacSymbolId;
  pictogramId: number;
};

export type TaskPresetPayload = {
  taskTitle: string;
  taskDescription: string;
  stepTitles: string[];
  detailLevel?: "compact" | "balanced" | "detailed";
};

export type CommunicationPresetPayload = {
  tiles: CommunityPresetTile[];
};

export type CommunityPresetCatalogEntry = {
  slug: string;
  type: CommunityPresetType;
  name: string;
  description: string;
  coverSymbolId: AacSymbolId;
  coverPictogramId: number;
  profession?: "physician" | "caregiver" | "teacher" | "physician_caregiver";
  stepCount?: number;
  tileCount?: number;
  likeCount: number;
  favoriteCount: number;
  dailyUserCount: number;
  useCount: number;
  payload: TaskPresetPayload | CommunicationPresetPayload;
};

export type CommunityPresetSummary = {
  id: string;
  slug: string;
  type: CommunityPresetType;
  name: string;
  description: string | null;
  coverSymbolId: string;
  coverPictogramId: number;
  profession: string | null;
  stepCount: number;
  tileCount: number;
  likeCount: number;
  favoriteCount: number;
  dailyUserCount: number;
  useCount: number;
  liked: boolean;
  favorited: boolean;
};
