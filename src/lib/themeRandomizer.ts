import { animatedThemes } from "@/data/animatedThemes";
import { monkeytypeThemes } from "@/data/monkeytypeThemes";
import { applyThemePreset, CUSTOM_THEME_PRESET, DEFAULT_THEME_PRESET, getEffectiveThemePreset, RUNTIME_THEME_PRESET_KEY } from "@/lib/theme";

export const RANDOMIZE_THEME_MODE_KEY = "spelldown-randomize-theme-mode";
export const RANDOMIZE_THEME_FAVORITES_KEY = "spelldown-theme-favorites";

export type RandomizeThemeMode = "off" | "favorite" | "light" | "dark" | "auto" | "custom";

const ALL_PRESET_NAMES = [
  DEFAULT_THEME_PRESET,
  ...monkeytypeThemes.map((theme) => theme.name),
  ...animatedThemes.map((theme) => theme.name),
];

const ALL_THEME_BG = new Map<string, string>([
  [DEFAULT_THEME_PRESET, "#000000"],
  ...monkeytypeThemes.map((theme) => [theme.name, theme.bg] as const),
  ...animatedThemes.map((theme) => [theme.name, theme.bg] as const),
]);

const unique = <T,>(items: T[]) => Array.from(new Set(items));

const clampByte = (value: number) => Math.max(0, Math.min(255, value));

const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "").trim();
  const normalized = clean.length === 3
    ? clean.split("").map((char) => `${char}${char}`).join("")
    : clean;

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return {
    red: clampByte(Number.isFinite(red) ? red : 0),
    green: clampByte(Number.isFinite(green) ? green : 0),
    blue: clampByte(Number.isFinite(blue) ? blue : 0),
  };
};

const isDarkBackground = (hex: string) => {
  const { red, green, blue } = hexToRgb(hex);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance < 0.5;
};

export const getStoredRandomizeThemeMode = (): RandomizeThemeMode => {
  const raw = (localStorage.getItem(RANDOMIZE_THEME_MODE_KEY) || "off").trim().toLowerCase();
  if (["off", "favorite", "light", "dark", "auto", "custom"].includes(raw)) {
    return raw as RandomizeThemeMode;
  }
  return "off";
};

export const getStoredFavoriteThemeNames = () => {
  try {
    const raw = localStorage.getItem(RANDOMIZE_THEME_FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const validNames = new Set(ALL_PRESET_NAMES);
    return unique(parsed.filter((value): value is string => typeof value === "string" && validNames.has(value)));
  } catch {
    return [];
  }
};

export const setStoredFavoriteThemeNames = (themeNames: string[]) => {
  localStorage.setItem(RANDOMIZE_THEME_FAVORITES_KEY, JSON.stringify(unique(themeNames)));
};

const getPoolByMode = (mode: RandomizeThemeMode) => {
  if (mode === "custom") {
    return [CUSTOM_THEME_PRESET];
  }

  if (mode === "favorite") {
    return getStoredFavoriteThemeNames();
  }

  const darkPool = ALL_PRESET_NAMES.filter((name) => isDarkBackground(ALL_THEME_BG.get(name) || "#000000"));
  const lightPool = ALL_PRESET_NAMES.filter((name) => !isDarkBackground(ALL_THEME_BG.get(name) || "#000000"));

  if (mode === "dark") return darkPool;
  if (mode === "light") return lightPool;
  if (mode === "auto") {
    const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return prefersDark ? darkPool : lightPool;
  }

  return [];
};

export const applyRoundRandomizedTheme = (currentPresetName?: string) => {
  const mode = getStoredRandomizeThemeMode();
  if (mode === "off") return;

  const pool = getPoolByMode(mode);
  if (pool.length === 0) return;

  const uniquePool = unique(pool);
  const currentTheme = currentPresetName || getEffectiveThemePreset();
  const candidates = uniquePool.filter((name) => name !== currentTheme);
  const finalPool = candidates.length > 0 ? candidates : uniquePool;
  if (finalPool.length === 0) return;

  const randomIndex = Math.floor(Math.random() * finalPool.length);
  const nextPreset = finalPool[randomIndex];

  applyThemePreset(nextPreset);
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(RUNTIME_THEME_PRESET_KEY, nextPreset);
  }
};
