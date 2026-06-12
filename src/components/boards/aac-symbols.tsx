"use client";

import {
  getArasaacPictogramUrl,
  resolvePictogramId,
} from "@/lib/aac/arasaac";
import { useEffect, useState } from "react";

export type AacSymbolId =
  | "wake"
  | "bathroom"
  | "brush"
  | "dress"
  | "eat"
  | "pack"
  | "shoes"
  | "walk"
  | "school"
  | "water"
  | "talk"
  | "wait"
  | "thank"
  | "check"
  | "star"
  | "help";

type AacSymbolProps = {
  id: AacSymbolId;
  pictogramId?: number | null;
  className?: string;
  alt?: string;
  size?: number;
};

export function AacSymbol({
  id,
  pictogramId,
  className,
  alt = "",
  size = 300,
}: AacSymbolProps) {
  const resolvedId = resolvePictogramId(id, pictogramId);
  const [src, setSrc] = useState(() => getArasaacPictogramUrl(resolvedId, size));
  const [useFallbackSize, setUseFallbackSize] = useState(false);

  useEffect(() => {
    setSrc(getArasaacPictogramUrl(resolvedId, size));
    setUseFallbackSize(false);
  }, [resolvedId, size]);

  function handleError() {
    if (!useFallbackSize) {
      setUseFallbackSize(true);
      setSrc(getArasaacPictogramUrl(resolvedId, 500));
    }
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      draggable={false}
      referrerPolicy="no-referrer"
      onError={handleError}
    />
  );
}
