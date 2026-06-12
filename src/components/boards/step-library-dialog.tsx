"use client";

import "./step-library-dialog.css";
import { AacSymbol } from "@/components/boards/aac-symbols";
import type { AacSymbolId } from "@/components/boards/aac-symbols";
import { useTranslation } from "@/components/i18n/language-provider";
import type { ArasaacSearchHit } from "@/lib/aac/resolve-pictogram";
import { matchStepSymbol } from "@/lib/aac/match-step-symbol";
import { getCuratedPictogramOverride, scoreArasaacHit } from "@/lib/aac/pictogram-overrides";
import {
  STEP_LIBRARY_CATEGORIES,
  filterLibraryItems,
  type StepLibraryCategoryId,
  type StepLibraryItem,
} from "@/lib/aac/step-library";
import { useEffect, useState } from "react";

export type StepLibrarySelection = {
  title: string;
  symbolId: AacSymbolId;
  pictogramId: number;
};

type StepLibraryDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (step: StepLibrarySelection) => void;
  titleKey?: string;
  descKey?: string;
  curatedTitleKey?: string;
};

type LibraryCategoryFilter = StepLibraryCategoryId | "all";

export function StepLibraryDialog({
  open,
  onClose,
  onSelect,
  titleKey = "stepLibrary.title",
  descKey = "stepLibrary.desc",
  curatedTitleKey = "stepLibrary.curatedTitle",
}: StepLibraryDialogProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<LibraryCategoryFilter>("all");
  const [remoteResults, setRemoteResults] = useState<ArasaacSearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setCategory("all");
      setRemoteResults([]);
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setRemoteResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = window.setTimeout(() => {
      void fetch(`/api/aac/pictograms?q=${encodeURIComponent(trimmed)}`)
        .then((response) => response.json())
        .then((data: { results?: ArasaacSearchHit[] }) => {
          setRemoteResults(data.results ?? []);
        })
        .catch(() => setRemoteResults([]))
        .finally(() => setIsSearching(false));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [open, query]);

  if (!open) return null;

  const curated = filterLibraryItems(query, category);

  function pickCurated(item: StepLibraryItem) {
    onSelect({
      title: t(item.labelKey),
      symbolId: item.symbolId,
      pictogramId: item.pictogramId,
    });
    onClose();
  }

  function pickRemote(hit: ArasaacSearchHit) {
    if (hit.violence || scoreArasaacHit(hit.label, hit.label, hit.violence) < 0) {
      return;
    }

    const title = hit.label.charAt(0).toUpperCase() + hit.label.slice(1);
    const curated = getCuratedPictogramOverride(hit.label);
    const symbolId = curated?.symbolId ?? matchStepSymbol(hit.label);
    onSelect({
      title,
      symbolId,
      pictogramId: curated?.pictogramId ?? hit.id,
    });
    onClose();
  }

  const showRemote = query.trim().length >= 2;

  const safeRemoteResults = remoteResults.filter(
    (hit) => !hit.violence && scoreArasaacHit(query, hit.label, hit.violence) >= 0,
  );

  return (
    <div className="step-library-overlay" role="presentation">
      <button
        type="button"
        className="step-library-backdrop"
        aria-label={t("common.cancel")}
        onClick={onClose}
      />

      <div
        className="step-library-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="step-library-title"
      >
        <header className="step-library-header">
          <div>
            <h2 id="step-library-title" className="step-library-title">
              {t(titleKey)}
            </h2>
            <p className="step-library-desc">{t(descKey)}</p>
          </div>
          <button type="button" className="dashboard-btn dashboard-btn-outline" onClick={onClose}>
            {t("common.cancel")}
          </button>
        </header>

        <div className="step-library-search-wrap">
          <input
            type="search"
            className="step-library-search"
            value={query}
            placeholder={t("stepLibrary.searchPlaceholder")}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="step-library-categories" role="tablist" aria-label={t("stepLibrary.categoriesLabel")}>
          <button
            type="button"
            role="tab"
            aria-selected={category === "all"}
            className={`step-library-category ${category === "all" ? "step-library-category-active" : ""}`}
            onClick={() => setCategory("all")}
          >
            {t("stepLibrary.categories.all")}
          </button>
          {STEP_LIBRARY_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={category === item.id}
              className={`step-library-category ${category === item.id ? "step-library-category-active" : ""}`}
              onClick={() => setCategory(item.id)}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>

        <div className="step-library-body">
          {showRemote && (
            <section className="step-library-section">
              <h3 className="step-library-section-title">{t("stepLibrary.searchResults")}</h3>
              {isSearching ? (
                <p className="step-library-empty">{t("stepLibrary.searching")}</p>
              ) : safeRemoteResults.length === 0 ? (
                <p className="step-library-empty">{t("stepLibrary.noResults")}</p>
              ) : (
                <div className="step-library-grid step-library-grid-search">
                  {safeRemoteResults.map((hit) => (
                    <button
                      key={hit.id}
                      type="button"
                      className="step-library-tile"
                      aria-label={hit.label}
                      onClick={() => pickRemote(hit)}
                    >
                      <span className="step-library-tile-symbol">
                        <AacSymbol
                          id={matchStepSymbol(hit.label)}
                          pictogramId={hit.id}
                          alt=""
                        />
                      </span>
                      <span className="step-library-tile-label">{hit.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className={`step-library-section ${showRemote && remoteResults.length > 0 ? "step-library-section-compact" : ""}`}>
            <h3 className="step-library-section-title">{t(curatedTitleKey)}</h3>
            {curated.length === 0 ? (
              <p className="step-library-empty">{t("stepLibrary.noResults")}</p>
            ) : (
              <div className="step-library-grid">
                {curated.map((item) => {
                  const label = t(item.labelKey);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="step-library-tile"
                      aria-label={label}
                      onClick={() => pickCurated(item)}
                    >
                      <span className="step-library-tile-symbol">
                        <AacSymbol
                          id={item.symbolId}
                          pictogramId={item.pictogramId}
                          alt=""
                        />
                      </span>
                      <span className="step-library-tile-label">{label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
