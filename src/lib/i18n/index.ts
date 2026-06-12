import type { LanguageId } from "@/lib/languages";
import { enMessages, type Messages } from "./messages/en";
import { esMessages } from "./messages/es";
import { frMessages } from "./messages/fr";
import { neMessages } from "./messages/ne";

const MESSAGE_CATALOG: Record<LanguageId, Messages> = {
  en: enMessages,
  es: esMessages,
  fr: frMessages,
  ne: neMessages,
};

export type TranslationParams = Record<string, string | number>;

export type Translator = (key: string, params?: TranslationParams) => string;

function resolvePath(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (current === null || typeof current !== "object" || !(part in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

export function createTranslator(language: LanguageId): Translator {
  const messages = MESSAGE_CATALOG[language] ?? enMessages;

  return (key, params) => {
    const value = resolvePath(messages, key) ?? resolvePath(enMessages, key);
    if (!value) return key;
    return interpolate(value, params);
  };
}

export { enMessages, type Messages };
