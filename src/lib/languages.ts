export const LANGUAGE_IDS = ["en", "es", "fr", "ne"] as const;

export type LanguageId = (typeof LANGUAGE_IDS)[number];

export type LanguageOption = {
  id: LanguageId;
  label: string;
  nativeLabel: string;
};

export const LANGUAGES: LanguageOption[] = [
  { id: "en", label: "English", nativeLabel: "English" },
  { id: "es", label: "Spanish", nativeLabel: "Español" },
  { id: "fr", label: "French", nativeLabel: "Français" },
  { id: "ne", label: "Nepali", nativeLabel: "नेपाली" },
];

export function isValidLanguageId(value: string): value is LanguageId {
  return LANGUAGE_IDS.includes(value as LanguageId);
}

export function getLanguageOption(id: string | null | undefined): LanguageOption {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
}
