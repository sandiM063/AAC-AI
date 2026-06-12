"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type CardPlacement = "above" | "below" | "left" | "right";

export type CardPosition = {
  top: number;
  left: number;
  placement: CardPlacement;
  arrowOffset: number;
};

const SPOTLIGHT_PAD = 8;
const CARD_GAP = 10;
const ARROW_SIZE = 10;
const VIEWPORT_PAD = 16;
const TARGET_RETRY_MS = 200;
const TARGET_MAX_RETRIES = 15;

type Rect = { top: number; left: number; width: number; height: number };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function rectsOverlap(a: Rect, b: Rect, gap: number) {
  return !(
    a.left + a.width + gap <= b.left ||
    b.left + b.width + gap <= a.left ||
    a.top + a.height + gap <= b.top ||
    b.top + b.height + gap <= a.top
  );
}

function preferredPlacements(target: DOMRect, viewportWidth: number): CardPlacement[] {
  const onRight = target.left > viewportWidth * 0.52;
  const onLeft = target.right < viewportWidth * 0.48;
  const isTall = target.height > 220;

  if (onRight && isTall) return ["left", "below", "above", "right"];
  if (onLeft && isTall) return ["right", "below", "above", "left"];
  if (onRight) return ["left", "below", "above", "right"];
  if (onLeft) return ["right", "below", "above", "left"];
  return ["below", "above", "left", "right"];
}

function computeCardPosition(
  placement: CardPlacement,
  target: DOMRect,
  cardWidth: number,
  cardHeight: number,
): { top: number; left: number; arrowOffset: number } {
  const gap = SPOTLIGHT_PAD + ARROW_SIZE + CARD_GAP;
  const maxTop = window.innerHeight - VIEWPORT_PAD - cardHeight;
  const maxLeft = window.innerWidth - VIEWPORT_PAD - cardWidth;
  const vCenter = target.top + target.height / 2 - cardHeight / 2;
  const hCenter = target.left + target.width / 2 - cardWidth / 2;

  switch (placement) {
    case "below": {
      const top = clamp(target.bottom + gap, VIEWPORT_PAD, maxTop);
      const left = clamp(hCenter, VIEWPORT_PAD, maxLeft);
      return { top, left, arrowOffset: target.left + target.width / 2 - left };
    }
    case "above": {
      const top = clamp(target.top - gap - cardHeight, VIEWPORT_PAD, maxTop);
      const left = clamp(hCenter, VIEWPORT_PAD, maxLeft);
      return { top, left, arrowOffset: target.left + target.width / 2 - left };
    }
    case "left": {
      const top = clamp(vCenter, VIEWPORT_PAD, maxTop);
      const left = clamp(target.left - gap - cardWidth, VIEWPORT_PAD, maxLeft);
      return { top, left, arrowOffset: target.top + target.height / 2 - top };
    }
    case "right": {
      const top = clamp(vCenter, VIEWPORT_PAD, maxTop);
      const left = clamp(target.right + gap, VIEWPORT_PAD, maxLeft);
      return { top, left, arrowOffset: target.top + target.height / 2 - top };
    }
  }
}

function pickCardPosition(
  target: DOMRect,
  spotlight: Rect,
  cardWidth: number,
  cardHeight: number,
): CardPosition {
  const placements = preferredPlacements(target, window.innerWidth);
  const gap = SPOTLIGHT_PAD + ARROW_SIZE;

  for (const placement of placements) {
    const candidate = computeCardPosition(placement, target, cardWidth, cardHeight);
    const cardRect: Rect = {
      top: candidate.top,
      left: candidate.left,
      width: cardWidth,
      height: cardHeight,
    };

    const inViewport =
      candidate.top >= VIEWPORT_PAD &&
      candidate.left >= VIEWPORT_PAD &&
      candidate.top + cardHeight <= window.innerHeight - VIEWPORT_PAD &&
      candidate.left + cardWidth <= window.innerWidth - VIEWPORT_PAD;

    if (inViewport && !rectsOverlap(cardRect, spotlight, gap)) {
      return {
        top: candidate.top,
        left: candidate.left,
        placement,
        arrowOffset: clamp(candidate.arrowOffset, 20, cardHeight - 20),
      };
    }
  }

  const fallback = computeCardPosition("below", target, cardWidth, cardHeight);
  return {
    top: clamp(fallback.top, VIEWPORT_PAD, window.innerHeight - VIEWPORT_PAD - cardHeight),
    left: clamp(fallback.left, VIEWPORT_PAD, window.innerWidth - VIEWPORT_PAD - cardWidth),
    placement: "below",
    arrowOffset: clamp(fallback.arrowOffset, 20, cardHeight - 20),
  };
}

export function useTutorialSpotlight(targetKey: string | null) {
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [cardPosition, setCardPosition] = useState<CardPosition | null>(null);
  const [targetFound, setTargetFound] = useState(false);
  const retryTimerRef = useRef<number | null>(null);

  const measure = useCallback((cardHeight = 280, cardWidth = 320): boolean => {
    if (!targetKey) {
      setSpotlight(null);
      setCardPosition(null);
      setTargetFound(false);
      return false;
    }

    const element = document.querySelector(`[data-tutorial="${targetKey}"]`);
    if (!element) {
      setSpotlight(null);
      setCardPosition(null);
      setTargetFound(false);
      return false;
    }

    const rect = element.getBoundingClientRect();
    const spotlightRect: SpotlightRect = {
      top: rect.top - SPOTLIGHT_PAD,
      left: rect.left - SPOTLIGHT_PAD,
      width: rect.width + SPOTLIGHT_PAD * 2,
      height: rect.height + SPOTLIGHT_PAD * 2,
    };

    setSpotlight(spotlightRect);
    setCardPosition(pickCardPosition(rect, spotlightRect, cardWidth, cardHeight));
    setTargetFound(true);

    document.querySelectorAll("[data-tutorial-active]").forEach((node) => {
      node.removeAttribute("data-tutorial-active");
    });
    element.setAttribute("data-tutorial-active", "true");
    return true;
  }, [targetKey]);

  useEffect(() => {
    if (!targetKey) return;

    if (targetKey.startsWith("nav-") && window.matchMedia("(max-width: 899px)").matches) {
      window.dispatchEvent(new CustomEvent("tutorial-highlight-nav"));
    }

    let retryCount = 0;

    const runMeasure = () => {
      const card = document.getElementById("tutorial-float-card");
      const cardHeight = card?.offsetHeight ?? 280;
      const cardWidth = card?.offsetWidth ?? 320;
      const found = measure(cardHeight, cardWidth);

      if (!found && retryCount < TARGET_MAX_RETRIES) {
        retryCount += 1;
        retryTimerRef.current = window.setTimeout(runMeasure, TARGET_RETRY_MS);
      }
    };

    const element = document.querySelector(`[data-tutorial="${targetKey}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }

    const measureDelay = targetKey.startsWith("nav-") ? 320 : 120;
    const frame = window.requestAnimationFrame(() => {
      window.setTimeout(runMeasure, measureDelay);
    });

    window.addEventListener("resize", runMeasure);
    window.addEventListener("scroll", runMeasure, true);

    const observed = element ?? undefined;
    const observer =
      observed && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(runMeasure)
        : null;
    if (observed && observer) observer.observe(observed);

    return () => {
      window.cancelAnimationFrame(frame);
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
      }
      window.removeEventListener("resize", runMeasure);
      window.removeEventListener("scroll", runMeasure, true);
      observer?.disconnect();
      document.querySelectorAll("[data-tutorial-active]").forEach((node) => {
        node.removeAttribute("data-tutorial-active");
      });
    };
  }, [targetKey, measure]);

  return { spotlight, cardPosition, remeasure: measure, targetFound };
}
