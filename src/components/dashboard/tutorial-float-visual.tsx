"use client";

import { AacSymbol, type AacSymbolId } from "@/components/boards/aac-symbols";
import type { SectionTutorialId } from "@/lib/tutorials/registry";

type TutorialFloatVisualProps = {
  tutorialId: SectionTutorialId;
  step: number;
};

const OVERVIEW_SYMBOLS: AacSymbolId[][] = [
  ["talk", "check", "help", "thank"],
  ["wake", "dress", "eat", "pack", "shoes", "walk", "school"],
  ["wake", "brush", "eat", "pack", "walk"],
  ["wake", "dress", "eat"],
  ["check", "star", "thank"],
];

const BOARDS_SYMBOLS: AacSymbolId[][] = [
  ["star"],
  ["wake", "eat", "walk"],
  ["wake", "dress", "eat", "pack", "walk"],
];

export function TutorialFloatVisual({ tutorialId, step }: TutorialFloatVisualProps) {
  if (tutorialId === "settings" || tutorialId === "profile") {
    return (
      <div className="tutorial-float-visual tutorial-float-visual-pills" aria-hidden>
        <span className="tutorial-float-pill" />
        <span className="tutorial-float-pill tutorial-float-pill-accent" />
        <span className="tutorial-float-pill" />
      </div>
    );
  }

  const symbols =
    tutorialId === "overview"
      ? (OVERVIEW_SYMBOLS[step - 1] ?? OVERVIEW_SYMBOLS[0])
      : (BOARDS_SYMBOLS[step - 1] ?? BOARDS_SYMBOLS[0]);

  return (
    <div className="tutorial-float-visual" aria-hidden>
      {symbols.map((symbolId) => (
        <span key={symbolId} className="tutorial-float-symbol-tile">
          <AacSymbol id={symbolId} className="tutorial-float-symbol" />
        </span>
      ))}
    </div>
  );
}
