"use client";

import { createTranslator, type Translator } from "@/lib/i18n";
import type { LanguageId } from "@/lib/languages";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type LanguageContextValue = {
  language: LanguageId;
  t: Translator;
  setLanguage: (language: LanguageId) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
  language: LanguageId;
  children: ReactNode;
};

export function LanguageProvider({ language, children }: LanguageProviderProps) {
  const [activeLanguage, setActiveLanguage] = useState(language);

  useEffect(() => {
    setActiveLanguage(language);
  }, [language]);

  const value = useMemo(() => {
    const t = createTranslator(activeLanguage);
    return { language: activeLanguage, t, setLanguage: setActiveLanguage };
  }, [activeLanguage]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useTranslation must be used within LanguageProvider");
  }

  return context;
}
