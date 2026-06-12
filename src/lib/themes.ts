export const THEME_IDS = ["green", "blue", "violet", "teal"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export type ThemeOption = {
  id: ThemeId;
  label: string;
  description: string;
  swatch: [string, string];
};

export const THEMES: ThemeOption[] = [
  {
    id: "green",
    label: "Forest green",
    description: "Default AAC Communicate palette",
    swatch: ["#16a34a", "#dcfce7"],
  },
  {
    id: "blue",
    label: "Ocean blue",
    description: "Calm blues for clinical and classroom settings",
    swatch: ["#2563eb", "#dbeafe"],
  },
  {
    id: "violet",
    label: "Soft violet",
    description: "Warm purple accents with a modern feel",
    swatch: ["#7c3aed", "#ede9fe"],
  },
  {
    id: "teal",
    label: "Teal mint",
    description: "Fresh teal tones with soft contrast",
    swatch: ["#0d9488", "#ccfbf1"],
  },
];

export function isValidThemeId(value: string): value is ThemeId {
  return THEME_IDS.includes(value as ThemeId);
}

export function getThemeOption(id: string | null | undefined): ThemeOption {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
