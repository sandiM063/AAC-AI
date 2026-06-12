"use client";

import "./phrase-board.css";
import { AacSymbol } from "@/components/boards/aac-symbols";
import type { AacSymbolId } from "@/components/boards/aac-symbols";
import { useTranslation } from "@/components/i18n/language-provider";
import {
  PHRASE_CATEGORIES,
  PHRASE_TILES,
  type PhraseCategoryId,
  type PhraseTileDef,
} from "@/lib/communication/phrases";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CommunityPresetsPanel } from "@/components/presets/community-presets-panel";
import "@/components/presets/community-presets-panel.css";
import {
  InteractiveChoicePanel,
  type InteractiveOutcome,
} from "@/components/communication/interactive-choice-panel";
import { resolveChoiceScenarioFromTiles } from "@/lib/communication/interactive-scenarios";
import "@/components/communication/interactive-choice-panel.css";
import { getPictogramIdForSymbol } from "@/lib/aac/arasaac";
import { matchStepSymbol } from "@/lib/aac/match-step-symbol";
import { getCuratedPictogramOverride, scoreArasaacHit } from "@/lib/aac/pictogram-overrides";
import type { ArasaacSearchHit } from "@/lib/aac/resolve-pictogram";
import { filterLibraryItems, type StepLibraryItem } from "@/lib/aac/step-library";
import type { DetailLevel, TaskStep } from "@/lib/ai/summarize-task-steps";
import { loadBoardTasks, saveBoardTasks } from "@/lib/boards/storage";
import { createTaskId } from "@/lib/boards/types";
import {
  loadSavedPhrases,
  recordActivitySession,
  saveSavedPhrases,
  type SavedPhrase,
} from "@/lib/communication/storage";
import {
  getSavedPhraseCategory,
  savePhraseCategory,
} from "@/lib/presets/profession-presets";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SelectedTile = {
  id: string;
  symbolId: AacSymbolId;
  pictogramId: number;
  label: string;
};

type PhraseBoardProps = {
  userId: string;
};

type AiInterpretResponse = {
  summary?: string;
  intent?: string;
  caregiverNote?: string;
  error?: string;
};

type AiReplyResponse = {
  reply?: string;
  quickOptions?: string[];
  error?: string;
};

type AiStepsResponse = {
  taskTitle?: string;
  steps?: TaskStep[];
  stepCount?: number;
  detailLevel?: DetailLevel;
  useInteractiveChoices?: boolean;
  scenarioId?: string;
  error?: string;
};

function createPhraseId() {
  return `phrase-${Math.random().toString(36).slice(2, 10)}`;
}

function createTileId() {
  return `tile-${Math.random().toString(36).slice(2, 10)}`;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 19 16.5H9l-4 3v-3H5A1.5 1.5 0 0 1 3.5 15V8A1.5 1.5 0 0 1 5 6.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PhraseBoard({ userId }: PhraseBoardProps) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<PhraseCategoryId>("core");
  const [message, setMessage] = useState<SelectedTile[]>([]);
  const [savedPhrases, setSavedPhrases] = useState<SavedPhrase[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [symbolSearch, setSymbolSearch] = useState("");
  const [remoteResults, setRemoteResults] = useState<ArasaacSearchHit[]>([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<AiInterpretResponse | null>(null);
  const [aiReply, setAiReply] = useState<AiReplyResponse | null>(null);
  const [createdBoard, setCreatedBoard] = useState<{ id: string; title: string } | null>(null);
  const [boardView, setBoardView] = useState<"symbols" | "presets" | "interactive">("symbols");
  const [interactiveHint, setInteractiveHint] = useState("");
  const [lastOutcome, setLastOutcome] = useState<InteractiveOutcome | null>(null);

  useEffect(() => {
    setSavedPhrases(loadSavedPhrases(userId));
    const savedCategory = getSavedPhraseCategory(userId);
    if (savedCategory && savedCategory in PHRASE_TILES) {
      setCategory(savedCategory);
    }
    setHydrated(true);
  }, [userId]);

  const messageText = message.map((tile) => tile.label).join(" ");
  const choiceScenario = useMemo(
    () =>
      resolveChoiceScenarioFromTiles(
        message.map((tile) => ({ label: tile.label, symbolId: tile.symbolId })),
      ),
    [message],
  );
  const tiles = PHRASE_TILES[category];
  const trimmedSearch = symbolSearch.trim();
  const isSearchActive = trimmedSearch.length > 0;
  const showSearchResults = trimmedSearch.length >= 2;
  const showRemoteSearch = showSearchResults;

  const curatedMatches = useMemo(() => {
    if (!showSearchResults) return [];
    return filterLibraryItems(trimmedSearch, category);
  }, [trimmedSearch, category, showSearchResults]);

  const safeRemoteResults = useMemo(
    () =>
      remoteResults.filter(
        (hit) => !hit.violence && scoreArasaacHit(trimmedSearch, hit.label, hit.violence) >= 0,
      ),
    [remoteResults, trimmedSearch],
  );

  useEffect(() => {
    if (!showRemoteSearch) {
      setRemoteResults([]);
      setIsSearchingRemote(false);
      return;
    }

    setIsSearchingRemote(true);
    const timer = window.setTimeout(() => {
      void fetch(`/api/aac/pictograms?q=${encodeURIComponent(trimmedSearch)}`)
        .then((response) => response.json())
        .then((data: { results?: ArasaacSearchHit[] }) => {
          setRemoteResults(data.results ?? []);
        })
        .catch(() => setRemoteResults([]))
        .finally(() => setIsSearchingRemote(false));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [trimmedSearch, showRemoteSearch]);

  function addTile(tile: PhraseTileDef) {
    const label = t(tile.labelKey);
    setMessage((prev) => [
      ...prev,
      { id: tile.id, symbolId: tile.symbolId, pictogramId: tile.pictogramId, label },
    ]);
    recordActivitySession(userId);
    setAiSummary(null);
    setAiReply(null);
    setCreatedBoard(null);
    setAiError(null);
  }

  function addTileFromLibrary(selection: {
    title: string;
    symbolId: AacSymbolId;
    pictogramId: number;
  }) {
    setMessage((prev) => [
      ...prev,
      {
        id: createTileId(),
        symbolId: selection.symbolId,
        pictogramId: selection.pictogramId,
        label: selection.title,
      },
    ]);
    recordActivitySession(userId);
    setAiSummary(null);
    setAiReply(null);
    setCreatedBoard(null);
    setAiError(null);
  }

  function addLibraryItem(item: StepLibraryItem) {
    addTileFromLibrary({
      title: t(item.labelKey),
      symbolId: item.symbolId,
      pictogramId: item.pictogramId,
    });
  }

  function addRemoteSymbol(hit: ArasaacSearchHit) {
    if (hit.violence || scoreArasaacHit(hit.label, hit.label, hit.violence) < 0) {
      return;
    }

    const title = hit.label.charAt(0).toUpperCase() + hit.label.slice(1);
    const curated = getCuratedPictogramOverride(hit.label);
    addTileFromLibrary({
      title,
      symbolId: curated?.symbolId ?? matchStepSymbol(hit.label),
      pictogramId: curated?.pictogramId ?? hit.id,
    });
  }

  function speakText(text: string) {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
    const ttsPref = localStorage.getItem(`aac-tts-enabled:${userId}`);
    if (ttsPref === "0") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
    recordActivitySession(userId);
  }

  function speak() {
    speakText(messageText);
  }

  function clearMessage() {
    setMessage([]);
    setAiSummary(null);
    setAiReply(null);
    setCreatedBoard(null);
    setAiError(null);
  }

  function backspace() {
    setMessage((prev) => prev.slice(0, -1));
    setAiSummary(null);
    setAiReply(null);
    setCreatedBoard(null);
  }

  function appendQuickOption(option: string) {
    setMessage((prev) => [
      ...prev,
      {
        id: createTileId(),
        symbolId: "talk",
        pictogramId: getPictogramIdForSymbol("talk"),
        label: option,
      },
    ]);
  }

  function openChoiceQuestionFlow() {
    setInteractiveHint(messageText);
    setBoardView("interactive");
    setCreatedBoard(null);
    setAiError(null);
    setAiSummary(null);
    setAiReply(null);
  }

  async function runAiAction(action: "interpret" | "suggest_reply" | "to_steps") {
    if (message.length === 0) {
      setAiError(t("communication.aiNoMessage"));
      return;
    }

    if (action === "to_steps" && choiceScenario) {
      openChoiceQuestionFlow();
      return;
    }

    setAiLoading(action);
    setAiError(null);

    if (action !== "to_steps") {
      setCreatedBoard(null);
    }
    if (action !== "interpret") {
      setAiSummary(null);
    }
    if (action !== "suggest_reply") {
      setAiReply(null);
    }

    try {
      const response = await fetch("/api/ai/communication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          tiles: message.map((tile) => ({ label: tile.label, symbolId: tile.symbolId })),
        }),
      });

      const data = (await response.json()) as AiInterpretResponse &
        AiReplyResponse &
        AiStepsResponse;

      if (!response.ok) {
        setAiError(data.error ?? t("communication.aiError"));
        return;
      }

      if (action === "interpret") {
        setAiSummary(data);
        return;
      }

      if (action === "suggest_reply") {
        setAiReply(data);
        return;
      }

      if (data.useInteractiveChoices) {
        openChoiceQuestionFlow();
        return;
      }

      if (data.steps && data.taskTitle) {
        const taskId = createTaskId();
        const boardTask = {
          id: taskId,
          title: data.taskTitle,
          description: messageText,
          steps: data.steps,
          stepCount: data.stepCount ?? data.steps.length,
          detailLevel: data.detailLevel ?? "balanced",
          completedStepIds: [] as string[],
          updatedAt: new Date().toISOString(),
        };
        const existing = loadBoardTasks(userId);
        saveBoardTasks(userId, [...existing, boardTask]);
        setCreatedBoard({ id: taskId, title: data.taskTitle });
      }
    } catch {
      setAiError(t("communication.aiError"));
    } finally {
      setAiLoading(null);
    }
  }

  function savePhrase() {
    if (!messageText) return;
    const phrase: SavedPhrase = {
      id: createPhraseId(),
      tiles: message.map((tile) => ({
        symbolId: tile.symbolId,
        pictogramId: tile.pictogramId,
        label: tile.label,
      })),
      createdAt: new Date().toISOString(),
    };
    const next = [phrase, ...savedPhrases].slice(0, 12);
    setSavedPhrases(next);
    saveSavedPhrases(userId, next);
  }

  function loadPhrase(phrase: SavedPhrase) {
    setMessage(
      phrase.tiles.map((tile, index) => ({
        id: `${phrase.id}-${index}`,
        symbolId: (tile.symbolId as AacSymbolId) ?? "star",
        pictogramId:
          tile.pictogramId ?? getPictogramIdForSymbol((tile.symbolId as AacSymbolId) ?? "star"),
        label: tile.label,
      })),
    );
    setAiSummary(null);
    setAiReply(null);
    setCreatedBoard(null);
    setAiError(null);
  }

  const pendingDeletePhrase = savedPhrases.find((item) => item.id === pendingDeleteId) ?? null;

  function confirmDeletePhrase() {
    if (!pendingDeleteId) return;
    const next = savedPhrases.filter((item) => item.id !== pendingDeleteId);
    setSavedPhrases(next);
    saveSavedPhrases(userId, next);
    setPendingDeleteId(null);
  }

  function handleApplyCommunicationPreset(
    tiles: { label: string; symbolId: AacSymbolId; pictogramId: number }[],
  ) {
    setMessage(
      tiles.map((tile) => ({
        id: createTileId(),
        symbolId: tile.symbolId,
        pictogramId: tile.pictogramId,
        label: tile.label,
      })),
    );
    setBoardView("symbols");
    setAiSummary(null);
    setAiReply(null);
    setCreatedBoard(null);
    setAiError(null);
    recordActivitySession(userId);
  }

  function handleInteractiveOutcome(outcome: InteractiveOutcome) {
    setLastOutcome(outcome);
    setMessage(
      outcome.choices.map((tile) => ({
        id: createTileId(),
        symbolId: tile.symbolId,
        pictogramId: tile.pictogramId,
        label: tile.label,
      })),
    );
    setBoardView("symbols");
    setAiSummary(null);
    setAiReply(null);
    setCreatedBoard(null);
    setAiError(null);
    recordActivitySession(userId);
  }

  function openInteractiveFromMessage() {
    openChoiceQuestionFlow();
  }

  if (!hydrated) return null;

  return (
    <div className="phrase-board">
      <div className="phrase-board-layout">
        <section className="phrase-board-main-card">
          <header className="phrase-board-header">
            <div className="phrase-board-header-icon">
              <MessageIcon />
            </div>
            <div>
              <h2 className="phrase-board-header-title">{t("nav.communication")}</h2>
              <p className="phrase-board-header-desc">{t("communication.boardStatus")}</p>
            </div>
          </header>

          <div className="phrase-board-composer" data-tutorial="communication-composer">
            <span className="phrase-board-output-label">{t("communication.outputLabel")}</span>
            <div
              className={`phrase-board-message-area ${!messageText ? "phrase-board-message-area-empty" : ""}`}
            >
              {message.length > 0 ? (
                <div className="phrase-board-message-tiles">
                  {message.map((tile, index) => (
                    <span key={`${tile.id}-${index}`} className="phrase-board-message-tile">
                      <span className="phrase-board-message-tile-symbol">
                        <AacSymbol
                          id={tile.symbolId}
                          pictogramId={tile.pictogramId}
                          alt={tile.label}
                        />
                      </span>
                      <span className="phrase-board-message-tile-label">{tile.label}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="phrase-board-message-empty">{t("communication.outputEmpty")}</p>
              )}
            </div>
            <p className="phrase-board-message-text" aria-live="polite">
              {messageText}
            </p>
            {lastOutcome && (
              <div className="interactive-outcome-banner" role="status">
                <p>
                  <strong>{t("interactive.outcomeLabel")}: </strong>
                  {lastOutcome.summaryText}
                </p>
              </div>
            )}
            {choiceScenario && boardView !== "interactive" && (
              <div className="interactive-choice-hint-banner" role="status">
                <p>{t("communication.choiceDetectedBanner")}</p>
                <button
                  type="button"
                  className="dashboard-btn dashboard-btn-primary"
                  onClick={openChoiceQuestionFlow}
                >
                  {t("communication.openChoices")}
                </button>
              </div>
            )}
            <div className="phrase-board-actions">
              <button
                type="button"
                className="dashboard-btn dashboard-btn-primary phrase-board-speak-btn"
                disabled={!messageText}
                onClick={speak}
              >
                {t("communication.speak")}
              </button>
              <button
                type="button"
                className="dashboard-btn dashboard-btn-outline"
                disabled={!messageText}
                onClick={savePhrase}
              >
                {t("communication.savePhrase")}
              </button>
              <button
                type="button"
                className="dashboard-btn dashboard-btn-outline interactive-ask-choice-btn"
                disabled={!messageText}
                onClick={openInteractiveFromMessage}
              >
                {t("interactive.askFromMessage")}
              </button>
              <button
                type="button"
                className="dashboard-btn dashboard-btn-outline"
                disabled={message.length === 0}
                onClick={backspace}
              >
                {t("communication.backspace")}
              </button>
              <button
                type="button"
                className="dashboard-btn dashboard-btn-outline"
                disabled={message.length === 0}
                onClick={clearMessage}
              >
                {t("communication.clear")}
              </button>
            </div>
          </div>

          <div className="phrase-board-body">
            <div className="board-view-tabs" role="tablist" aria-label={t("communityPresets.viewTabs")}>
              <button
                type="button"
                role="tab"
                aria-selected={boardView === "symbols"}
                className={`board-view-tab ${boardView === "symbols" ? "board-view-tab-active" : ""}`}
                onClick={() => setBoardView("symbols")}
              >
                {t("communityPresets.mySymbols")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={boardView === "presets"}
                className={`board-view-tab ${boardView === "presets" ? "board-view-tab-active" : ""}`}
                onClick={() => setBoardView("presets")}
              >
                {t("communityPresets.tabPresets")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={boardView === "interactive"}
                className={`board-view-tab ${boardView === "interactive" ? "board-view-tab-active" : ""}`}
                onClick={() => {
                  setInteractiveHint("");
                  setBoardView("interactive");
                }}
              >
                {t("interactive.tabLabel")}
              </button>
            </div>

            {boardView === "presets" ? (
              <CommunityPresetsPanel
                type="communication"
                onApplyCommunication={handleApplyCommunicationPreset}
              />
            ) : boardView === "interactive" ? (
              <InteractiveChoicePanel
                userId={userId}
                questionHint={interactiveHint}
                onOutcomeConfirmed={handleInteractiveOutcome}
              />
            ) : (
              <>
            <div className="phrase-board-toolbar" data-tutorial="communication-categories">
              <div className="phrase-board-search-wrap">
                <span className="phrase-board-search-icon" aria-hidden>
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  className="phrase-board-search-input"
                  value={symbolSearch}
                  placeholder={t("stepLibrary.searchPlaceholder")}
                  aria-label={t("communication.symbolSearchLabel")}
                  onChange={(event) => setSymbolSearch(event.target.value)}
                />
                {symbolSearch && (
                  <button
                    type="button"
                    className="phrase-board-search-clear"
                    aria-label={t("communication.clearSearch")}
                    onClick={() => setSymbolSearch("")}
                  >
                    ×
                  </button>
                )}
              </div>
              <div
                className="phrase-board-categories"
                role="tablist"
                aria-label={t("communication.categoriesLabel")}
              >
                {PHRASE_CATEGORIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={category === item.id}
                    className={`phrase-board-category-tab ${category === item.id ? "phrase-board-category-tab-active" : ""}`}
                    onClick={() => {
                      setCategory(item.id);
                      savePhraseCategory(userId, item.id);
                    }}
                  >
                    {t(item.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className="phrase-board-grid" role="list" data-tutorial="communication-grid">
              {isSearchActive ? (
                <>
                  {showRemoteSearch && (
                    <div className="phrase-board-search-section">
                      <p className="phrase-board-search-section-title">
                        {t("stepLibrary.searchResults")}
                      </p>
                      {isSearchingRemote ? (
                        <p className="phrase-board-search-empty">{t("stepLibrary.searching")}</p>
                      ) : safeRemoteResults.length === 0 ? (
                        <p className="phrase-board-search-empty">{t("stepLibrary.noResults")}</p>
                      ) : (
                        <div className="phrase-board-search-grid">
                          {safeRemoteResults.map((hit) => (
                            <button
                              key={hit.id}
                              type="button"
                              role="listitem"
                              className="phrase-board-tile"
                              aria-label={hit.label}
                              onClick={() => addRemoteSymbol(hit)}
                            >
                              <span className="phrase-board-tile-symbol">
                                <AacSymbol
                                  id={matchStepSymbol(hit.label)}
                                  pictogramId={hit.id}
                                  alt=""
                                />
                              </span>
                              <span className="phrase-board-tile-label">{hit.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {curatedMatches.length > 0 && (
                    <div className="phrase-board-search-section">
                      <p className="phrase-board-search-section-title">
                        {t("communication.libraryCurated")}
                      </p>
                      <div className="phrase-board-search-grid">
                        {curatedMatches.map((item) => {
                          const label = t(item.labelKey);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              role="listitem"
                              className="phrase-board-tile"
                              aria-label={label}
                              onClick={() => addLibraryItem(item)}
                            >
                              <span className="phrase-board-tile-symbol">
                                <AacSymbol
                                  id={item.symbolId}
                                  pictogramId={item.pictogramId}
                                  alt=""
                                />
                              </span>
                              <span className="phrase-board-tile-label">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!showSearchResults && (
                      <p className="phrase-board-search-empty">{t("communication.searchHint")}</p>
                    )}

                  {showSearchResults &&
                    !isSearchingRemote &&
                    safeRemoteResults.length === 0 &&
                    curatedMatches.length === 0 && (
                      <p className="phrase-board-search-empty">{t("stepLibrary.noResults")}</p>
                    )}
                </>
              ) : (
                tiles.map((tile) => (
                  <button
                    key={tile.id}
                    type="button"
                    role="listitem"
                    className="phrase-board-tile"
                    onClick={() => addTile(tile)}
                  >
                    <span className="phrase-board-tile-symbol">
                      <AacSymbol
                        id={tile.symbolId}
                        pictogramId={tile.pictogramId}
                        alt={t(tile.labelKey)}
                      />
                    </span>
                    <span className="phrase-board-tile-label">{t(tile.labelKey)}</span>
                  </button>
                ))
              )}
            </div>
              </>
            )}
          </div>
        </section>

        <aside className="phrase-board-sidebar">
          <section className="phrase-board-sidebar-card phrase-board-ai-card" data-tutorial="communication-ai">
            <h2 className="phrase-board-ai-title">{t("communication.aiTitle")}</h2>
            <p className="phrase-board-ai-desc">{t("communication.aiDesc")}</p>

            <div className="phrase-board-ai-actions">
              <button
                type="button"
                className="dashboard-btn dashboard-btn-primary phrase-board-ai-btn"
                disabled={message.length === 0 || aiLoading !== null}
                onClick={() => void runAiAction("interpret")}
              >
                {aiLoading === "interpret" ? t("communication.aiWorking") : t("communication.aiInterpret")}
              </button>
              <button
                type="button"
                className="dashboard-btn dashboard-btn-outline phrase-board-ai-btn"
                disabled={message.length === 0 || aiLoading !== null}
                onClick={() => void runAiAction("suggest_reply")}
              >
                {aiLoading === "suggest_reply" ? t("communication.aiWorking") : t("communication.aiSuggestReply")}
              </button>
              <button
                type="button"
                className="dashboard-btn dashboard-btn-outline phrase-board-ai-btn"
                disabled={message.length === 0 || aiLoading !== null}
                onClick={() => void runAiAction("to_steps")}
              >
                {aiLoading === "to_steps"
                  ? t("communication.aiWorking")
                  : choiceScenario
                    ? t("communication.openChoices")
                    : t("communication.aiToSteps")}
              </button>
            </div>

            {aiError && (
              <div role="alert" className="phrase-board-ai-alert">
                {aiError}
              </div>
            )}

            {aiSummary?.summary && (
              <div className="phrase-board-ai-result">
                <p className="phrase-board-ai-result-label">{t("communication.aiSummaryLabel")}</p>
                <p className="phrase-board-ai-result-text">{aiSummary.summary}</p>
                {aiSummary.intent && (
                  <>
                    <p className="phrase-board-ai-result-label">{t("communication.aiIntentLabel")}</p>
                    <p className="phrase-board-ai-result-text">{aiSummary.intent}</p>
                  </>
                )}
                {aiSummary.caregiverNote && (
                  <>
                    <p className="phrase-board-ai-result-label">{t("communication.aiCaregiverNoteLabel")}</p>
                    <p className="phrase-board-ai-result-text">{aiSummary.caregiverNote}</p>
                  </>
                )}
              </div>
            )}

            {aiReply?.reply && (
              <div className="phrase-board-ai-result">
                <p className="phrase-board-ai-result-label">{t("communication.aiReplyLabel")}</p>
                <p className="phrase-board-ai-result-text phrase-board-ai-reply">{aiReply.reply}</p>
                <button
                  type="button"
                  className="dashboard-btn dashboard-btn-outline phrase-board-ai-speak-reply"
                  onClick={() => speakText(aiReply.reply ?? "")}
                >
                  {t("communication.aiSpeakReply")}
                </button>
                {aiReply.quickOptions && aiReply.quickOptions.length > 0 && (
                  <>
                    <p className="phrase-board-ai-result-label">{t("communication.aiQuickOptionsLabel")}</p>
                    <div className="phrase-board-ai-options">
                      {aiReply.quickOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className="phrase-board-ai-option-btn"
                          onClick={() => appendQuickOption(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {createdBoard && (
              <div className="phrase-board-ai-result phrase-board-ai-board-created">
                <p className="phrase-board-ai-result-text">
                  {t("communication.aiStepsCreated", { title: createdBoard.title })}
                </p>
                <Link
                  href={`/dashboard/boards?task=${createdBoard.id}`}
                  className="phrase-board-ai-open-board"
                >
                  {t("communication.aiOpenBoard", { title: createdBoard.title })}
                </Link>
              </div>
            )}
          </section>

          <section className="phrase-board-sidebar-card">
            <div className="phrase-board-saved-header">
              <h2 className="phrase-board-saved-title">{t("communication.savedPhrases")}</h2>
              {savedPhrases.length > 0 && (
                <span className="phrase-board-saved-count">{savedPhrases.length}</span>
              )}
            </div>
            {savedPhrases.length === 0 ? (
              <p className="phrase-board-saved-empty">{t("communication.savedEmpty")}</p>
            ) : (
              <ul className="phrase-board-saved-list">
                {savedPhrases.map((phrase) => {
                  const text = phrase.tiles.map((tile) => tile.label).join(" ");
                  return (
                    <li key={phrase.id} className="phrase-board-saved-item">
                      <div className="phrase-board-saved-symbols" aria-hidden>
                        {phrase.tiles.slice(0, 4).map((tile, index) => (
                          <span key={index} className="phrase-board-saved-symbol">
                            <AacSymbol
                              id={(tile.symbolId as AacSymbolId) ?? "star"}
                              pictogramId={tile.pictogramId}
                              alt={tile.label}
                            />
                          </span>
                        ))}
                      </div>
                      <p className="phrase-board-saved-text">{text}</p>
                      <div className="phrase-board-saved-actions">
                        <button
                          type="button"
                          className="phrase-board-saved-btn phrase-board-saved-btn-primary"
                          onClick={() => loadPhrase(phrase)}
                        >
                          {t("communication.usePhrase")}
                        </button>
                        <button
                          type="button"
                          className="phrase-board-saved-btn phrase-board-saved-btn-danger"
                          aria-label={t("communication.deletePhraseAria", { phrase: text })}
                          onClick={() => setPendingDeleteId(phrase.id)}
                        >
                          {t("communication.deletePhrase")}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>

      <p className="aac-symbol-credit">{t("common.arasaacCredit")}</p>

      <ConfirmDialog
        open={Boolean(pendingDeletePhrase)}
        title={t("communication.deletePhrase")}
        description={t("communication.deletePhraseConfirm", {
          phrase: pendingDeletePhrase?.tiles.map((tile) => tile.label).join(" ") ?? "",
        })}
        confirmLabel={t("communication.deletePhrase")}
        danger
        onConfirm={confirmDeletePhrase}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
