"use client";

import { useEffect } from "react";
import type { LanguageId } from "@/lib/languages";
import type { ThemeId } from "@/lib/themes";

type ThemeApplierProps = {
  theme: ThemeId;
  language: LanguageId;
};

export function ThemeApplier({ theme, language }: ThemeApplierProps) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language;
  }, [theme, language]);

  return null;
}
