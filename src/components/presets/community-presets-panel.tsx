"use client";

import "./community-presets-panel.css";
import { AacSymbol } from "@/components/boards/aac-symbols";
import type { AacSymbolId } from "@/components/boards/aac-symbols";
import { useTranslation } from "@/components/i18n/language-provider";
import type { CommunityPresetSummary, CommunityPresetType } from "@/lib/presets/community-preset-types";
import { useCallback, useEffect, useState } from "react";

type CommunityPresetsPanelProps = {
  type: CommunityPresetType;
  onApplyTask?: (task: {
    id: string;
    title: string;
    description: string;
    steps: import("@/lib/ai/summarize-task-steps").TaskStep[];
    stepCount: number;
    detailLevel: import("@/lib/ai/summarize-task-steps").DetailLevel;
    completedStepIds: string[];
  }) => void;
  onApplyCommunication?: (
    tiles: { label: string; symbolId: AacSymbolId; pictogramId: number }[],
  ) => void;
};

function formatCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(value);
}

export function CommunityPresetsPanel({
  type,
  onApplyTask,
  onApplyCommunication,
}: CommunityPresetsPanelProps) {
  const { t } = useTranslation();
  const [presets, setPresets] = useState<CommunityPresetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadPresets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/presets?type=${type}`);
      const data = (await response.json()) as { presets?: CommunityPresetSummary[]; error?: string };

      if (!response.ok) {
        setError(data.error ?? t("communityPresets.loadError"));
        setPresets([]);
        return;
      }

      setPresets(data.presets ?? []);
    } catch {
      setError(t("communityPresets.loadError"));
      setPresets([]);
    } finally {
      setLoading(false);
    }
  }, [type, t]);

  useEffect(() => {
    void loadPresets();
  }, [loadPresets]);

  async function interact(presetId: string, action: "like" | "favorite" | "apply") {
    setBusyId(presetId);
    setError(null);

    try {
      const response = await fetch(`/api/presets/${presetId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? t("communityPresets.actionError"));
        return;
      }

      if (action === "like") {
        setPresets((prev) =>
          prev.map((preset) =>
            preset.id === presetId
              ? { ...preset, liked: data.liked, likeCount: data.likeCount }
              : preset,
          ),
        );
        return;
      }

      if (action === "favorite") {
        setPresets((prev) =>
          prev.map((preset) =>
            preset.id === presetId
              ? { ...preset, favorited: data.favorited, favoriteCount: data.favoriteCount }
              : preset,
          ),
        );
        return;
      }

      if (action === "apply") {
        if (data.type === "task" && data.task && onApplyTask) {
          onApplyTask(data.task);
        }
        if (data.type === "communication" && data.tiles && onApplyCommunication) {
          onApplyCommunication(data.tiles);
        }

        setPresets((prev) =>
          prev.map((preset) =>
            preset.id === presetId
              ? {
                  ...preset,
                  useCount: preset.useCount + 1,
                  dailyUserCount: preset.dailyUserCount + 1,
                }
              : preset,
          ),
        );
      }
    } catch {
      setError(t("communityPresets.actionError"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="community-presets-panel" aria-labelledby="community-presets-title">
      <header className="community-presets-header">
        <div>
          <h2 id="community-presets-title" className="community-presets-title">
            {t("communityPresets.title")}
          </h2>
          <p className="community-presets-desc">{t("communityPresets.desc")}</p>
        </div>
      </header>

      {error && (
        <div role="alert" className="community-presets-error">
          {error}
        </div>
      )}

      {loading ? (
        <p className="community-presets-loading">{t("communityPresets.loading")}</p>
      ) : presets.length === 0 ? (
        <p className="community-presets-empty">{t("communityPresets.empty")}</p>
      ) : (
        <div className="community-presets-grid" role="list">
          {presets.map((preset) => {
            const unitCount = type === "task" ? preset.stepCount : preset.tileCount;
            const unitLabel =
              type === "task"
                ? t("communityPresets.steps", { count: String(unitCount) })
                : t("communityPresets.symbols", { count: String(unitCount) });

            return (
              <article key={preset.id} className="community-preset-card" role="listitem">
                <div className="community-preset-card-cover">
                  <AacSymbol
                    id={preset.coverSymbolId as AacSymbolId}
                    pictogramId={preset.coverPictogramId}
                    alt=""
                    className="community-preset-cover-symbol"
                  />
                </div>

                <div className="community-preset-card-body">
                  <h3 className="community-preset-name">{preset.name}</h3>
                  {preset.description && (
                    <p className="community-preset-description">{preset.description}</p>
                  )}

                  <p className="community-preset-unit">{unitLabel}</p>

                  <dl className="community-preset-stats">
                    <div>
                      <dt>{t("communityPresets.dailyUsers")}</dt>
                      <dd>{formatCount(preset.dailyUserCount)}</dd>
                    </div>
                    <div>
                      <dt>{t("communityPresets.favorites")}</dt>
                      <dd>{formatCount(preset.favoriteCount)}</dd>
                    </div>
                    <div>
                      <dt>{t("communityPresets.likes")}</dt>
                      <dd>{formatCount(preset.likeCount)}</dd>
                    </div>
                    <div>
                      <dt>{t("communityPresets.uses")}</dt>
                      <dd>{formatCount(preset.useCount)}</dd>
                    </div>
                  </dl>

                  <div className="community-preset-actions">
                    <button
                      type="button"
                      className={`community-preset-icon-btn ${preset.liked ? "community-preset-icon-btn-active" : ""}`}
                      aria-pressed={preset.liked}
                      disabled={busyId === preset.id}
                      onClick={() => void interact(preset.id, "like")}
                    >
                      {preset.liked ? "♥" : "♡"} {formatCount(preset.likeCount)}
                    </button>
                    <button
                      type="button"
                      className={`community-preset-icon-btn ${preset.favorited ? "community-preset-icon-btn-active" : ""}`}
                      aria-pressed={preset.favorited}
                      disabled={busyId === preset.id}
                      onClick={() => void interact(preset.id, "favorite")}
                    >
                      {preset.favorited ? "★" : "☆"} {formatCount(preset.favoriteCount)}
                    </button>
                    <button
                      type="button"
                      className="dashboard-btn dashboard-btn-primary community-preset-use-btn"
                      disabled={busyId === preset.id}
                      onClick={() => void interact(preset.id, "apply")}
                    >
                      {busyId === preset.id
                        ? t("communityPresets.applying")
                        : t("communityPresets.usePreset")}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
