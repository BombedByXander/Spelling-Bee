import { monkeytypeThemes } from "@/data/monkeytypeThemes";
import { animatedThemes } from "@/data/animatedThemes";

export const THEME_PRESET_KEY = "spelldown-theme-preset";
export const DEFAULT_THEME_PRESET = "default";
export const CUSTOM_THEME_PRESET = "custom";
export const CUSTOM_THEME_KEY = "spelldown-custom-theme";
export const RUNTIME_THEME_PRESET_KEY = "spelldown-runtime-theme-preset";
export const THEME_ENGINE_V2_KEY = "spelldown-theme-engine-v2";
export const HOLOGRAPHIC_UI_LAYER_KEY = "spelldown-holographic-ui-layer";
export const LEGACY_RGB_EFFECTS_KEY = "spelldown-rgb-effects";
export const DYNAMIC_ENVIRONMENT_KEY = "spelldown-dynamic-environment";
export const EASTER_THEME_NAME = "easter garden";
export const EASTER_BUNNY_BOUNCE_KEY = "spelldown-easter-bunny-bounce";
export const EASTER_BUNNY_TOGGLE_EVENT = "spelldown-easter-bunny-toggle";
export const THEME_CHANGED_EVENT = "spelldown-theme-changed";
const VISUAL_ENVIRONMENT_CLASSES = ["env-morning", "env-day", "env-evening", "env-night"];
const ANIMATED_THEME_CLASS = "theme-animated-collection";
const ALL_THEME_PRESETS = [...monkeytypeThemes, ...animatedThemes];
const LEGACY_THEME_PRESET_ALIASES: Record<string, string> = {
  "rgb effects": "holo grid",
  "rgb_effects": "holo grid",
  "rgb-effects": "holo grid",
};

export type CustomTheme = {
  bg: string;
  main: string;
  caret: string;
  glow: string;
  sub: string;
  subAlt: string;
  text: string;
  error: string;
  errorExtra: string;
  colorfulError: string;
  colorfulErrorExtra: string;
};

const DEFAULT_CUSTOM_THEME: CustomTheme = {
  bg: "#323437",
  main: "#e2b714",
  caret: "#e2b714",
  glow: "#ffffff",
  sub: "#646669",
  subAlt: "#2c2e31",
  text: "#d1d0c5",
  error: "#ca4754",
  errorExtra: "#7e2a33",
  colorfulError: "#ca4754",
  colorfulErrorExtra: "#7e2a33",
};

const VARIABLE_KEYS = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--destructive-foreground",
  "--border",
  "--input",
  "--ring",
  "--sidebar-background",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
  "--ui-glow-rgb",
] as const;

const DECORATIVE_THEME_CLASS_BY_NAME: Record<string, string> = {
  "ultra black": "theme-ultra-black",
  "aurora vault": "theme-aurora-vault",
  "holo grid": "theme-holo-grid",
  "ember cathedral": "theme-ember-cathedral",
  "ocean sigil": "theme-ocean-sigil",
  "midnight circuitry": "theme-midnight-circuitry",
  "prism dunes": "theme-prism-dunes",
  "lotus eclipse": "theme-lotus-eclipse",
  "solar runes": "theme-solar-runes",
  "void geometry": "theme-void-geometry",
  "frost shrine": "theme-frost-shrine",
  "easter garden": "theme-easter-garden",
};

const DECORATIVE_THEME_CLASSES = Object.values(DECORATIVE_THEME_CLASS_BY_NAME);
const ANIMATED_THEME_PRESET_NAMES = animatedThemes.map((theme) => theme.name);
const ANIMATED_THEME_PRESET_SET = new Set(ANIMATED_THEME_PRESET_NAMES);

export const animatedThemePresetNames = ANIMATED_THEME_PRESET_NAMES;

export const isAnimatedThemePreset = (presetName: string) => {
  return ANIMATED_THEME_PRESET_SET.has(presetName);
};

const normalizeHex = (hex: string) => {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    return clean
      .split("")
      .map((char) => char + char)
      .join("");
  }
  return clean;
};

const hexToRgb = (hex: string) => {
  const normalized = normalizeHex(hex);
  const value = Number.parseInt(normalized, 16);
  return {
    red: (value >> 16) & 255,
    green: (value >> 8) & 255,
    blue: value & 255,
  };
};

const hexToRgbTokens = (hex: string) => {
  const { red, green, blue } = hexToRgb(hex);
  return `${red} ${green} ${blue}`;
};

const hexToHslTokens = (hex: string) => {
  const { red, green, blue } = hexToRgb(hex);
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) {
    return `0 0% ${Math.round(lightness * 100)}%`;
  }

  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;
  if (max === r) {
    hue = (g - b) / delta + (g < b ? 6 : 0);
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }

  hue /= 6;
  return `${Math.round(hue * 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
};

const isDarkHex = (hex: string) => {
  const { red, green, blue } = hexToRgb(hex);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance < 0.5;
};

const clearThemeOverrides = (root: HTMLElement) => {
  VARIABLE_KEYS.forEach((key) => root.style.removeProperty(key));
};

export const getStoredThemePreset = () => {
  const storedPreset = localStorage.getItem(THEME_PRESET_KEY) || DEFAULT_THEME_PRESET;
  return LEGACY_THEME_PRESET_ALIASES[storedPreset] || storedPreset;
};

export const getEffectiveThemePreset = () => {
  if (typeof sessionStorage !== "undefined") {
    const runtimePreset = sessionStorage.getItem(RUNTIME_THEME_PRESET_KEY);
    if (runtimePreset) return runtimePreset;
  }
  return getStoredThemePreset();
};

export const isDefaultThemePreset = (preset: string) => {
  return preset === DEFAULT_THEME_PRESET;
};

export const getStoredCustomTheme = (): CustomTheme => {
  const raw = localStorage.getItem(CUSTOM_THEME_KEY);
  if (!raw) return DEFAULT_CUSTOM_THEME;
  try {
    const parsed = JSON.parse(raw) as Partial<CustomTheme>;
    return {
      ...DEFAULT_CUSTOM_THEME,
      ...parsed,
    };
  } catch {
    return DEFAULT_CUSTOM_THEME;
  }
};

export const setStoredCustomTheme = (theme: CustomTheme) => {
  localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(theme));
};

const getStoredVisualFlag = (key: string) => {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(key) === "true";
};

export const getStoredThemeEngineV2Enabled = () => getStoredVisualFlag(THEME_ENGINE_V2_KEY);

export const getStoredHolographicUiLayerEnabled = () => {
  return getStoredVisualFlag(HOLOGRAPHIC_UI_LAYER_KEY) || getStoredVisualFlag(LEGACY_RGB_EFFECTS_KEY);
};

export const getStoredDynamicEnvironmentEnabled = () => getStoredVisualFlag(DYNAMIC_ENVIRONMENT_KEY);

export const applyVisualEnhancements = () => {
  if (typeof document === "undefined") return;

  const body = document.body;
  const themeEngineV2Enabled = getStoredThemeEngineV2Enabled();
  const holographicUiLayerEnabled = getStoredHolographicUiLayerEnabled();
  const dynamicEnvironmentEnabled = getStoredDynamicEnvironmentEnabled();

  body.classList.toggle("fx-theme-engine-2", themeEngineV2Enabled);
  body.classList.toggle("fx-holographic-ui", holographicUiLayerEnabled);
  body.classList.toggle("fx-rgb-effects", holographicUiLayerEnabled);
  body.classList.toggle("fx-dynamic-environment", dynamicEnvironmentEnabled);
  body.classList.remove(...VISUAL_ENVIRONMENT_CLASSES);

  if (dynamicEnvironmentEnabled) {
    const currentHour = new Date().getHours();
    const environmentClass =
      currentHour < 6 ? "env-night" :
      currentHour < 11 ? "env-morning" :
      currentHour < 18 ? "env-day" :
      currentHour < 21 ? "env-evening" :
      "env-night";
    body.classList.add(environmentClass);
  }
};

export const applyThemePreset = (presetName: string) => {
  const resolvedPresetName = LEGACY_THEME_PRESET_ALIASES[presetName] || presetName;
  const root = document.documentElement;
  document.body.classList.remove(...DECORATIVE_THEME_CLASSES, ANIMATED_THEME_CLASS);
  const normalizedPresetName = resolvedPresetName.trim().toLowerCase().replace(/_/g, " ");

  if (isDefaultThemePreset(resolvedPresetName)) {
    clearThemeOverrides(root);
    root.style.setProperty("--ui-glow-rgb", "255 255 255");
    root.classList.remove("light");
    root.classList.add("dark");
    applyVisualEnhancements();
    return;
  }

  const selectedTheme =
    resolvedPresetName === CUSTOM_THEME_PRESET
      ? getStoredCustomTheme()
      : ALL_THEME_PRESETS.find((theme) => theme.name === resolvedPresetName);
  if (!selectedTheme) {
    clearThemeOverrides(root);
    root.style.setProperty("--ui-glow-rgb", "255 255 255");
    root.classList.remove("light");
    root.classList.add("dark");
    applyVisualEnhancements();
    return;
  }

  const primaryForeground = isDarkHex(selectedTheme.main) ? "0 0% 100%" : "0 0% 0%";
  const accentForeground = isDarkHex(selectedTheme.caret) ? "0 0% 100%" : "0 0% 0%";
  const destructiveForeground = isDarkHex(selectedTheme.error) ? "0 0% 100%" : "0 0% 0%";

  root.classList.remove("light");
  root.classList.add("dark");

  const decorativeThemeClass = DECORATIVE_THEME_CLASS_BY_NAME[normalizedPresetName];
  if (decorativeThemeClass) {
    document.body.classList.add(decorativeThemeClass);
  }

  const glowHex = resolvedPresetName === CUSTOM_THEME_PRESET ? selectedTheme.glow : "#ffffff";
  root.style.setProperty("--ui-glow-rgb", hexToRgbTokens(glowHex));
  root.style.setProperty("--theme-animated-main-rgb", hexToRgbTokens(selectedTheme.main));
  root.style.setProperty("--theme-animated-caret-rgb", hexToRgbTokens(selectedTheme.caret));
  root.style.setProperty("--theme-animated-text-rgb", hexToRgbTokens(selectedTheme.text));
  root.style.setProperty("--theme-animated-sub-rgb", hexToRgbTokens(selectedTheme.sub));

  root.style.setProperty("--background", hexToHslTokens(selectedTheme.bg));
  root.style.setProperty("--foreground", hexToHslTokens(selectedTheme.text));
  root.style.setProperty("--card", hexToHslTokens(selectedTheme.subAlt));
  root.style.setProperty("--card-foreground", hexToHslTokens(selectedTheme.text));
  root.style.setProperty("--popover", hexToHslTokens(selectedTheme.subAlt));
  root.style.setProperty("--popover-foreground", hexToHslTokens(selectedTheme.text));
  root.style.setProperty("--primary", hexToHslTokens(selectedTheme.main));
  root.style.setProperty("--primary-foreground", primaryForeground);
  root.style.setProperty("--secondary", hexToHslTokens(selectedTheme.subAlt));
  root.style.setProperty("--secondary-foreground", hexToHslTokens(selectedTheme.text));
  root.style.setProperty("--muted", hexToHslTokens(selectedTheme.subAlt));
  root.style.setProperty("--muted-foreground", hexToHslTokens(selectedTheme.sub));
  root.style.setProperty("--accent", hexToHslTokens(selectedTheme.caret));
  root.style.setProperty("--accent-foreground", accentForeground);
  root.style.setProperty("--destructive", hexToHslTokens(selectedTheme.error));
  root.style.setProperty("--destructive-foreground", destructiveForeground);
  root.style.setProperty("--border", hexToHslTokens(selectedTheme.sub));
  root.style.setProperty("--input", hexToHslTokens(selectedTheme.subAlt));
  root.style.setProperty("--ring", hexToHslTokens(selectedTheme.caret));

  root.style.setProperty("--sidebar-background", hexToHslTokens(selectedTheme.bg));
  root.style.setProperty("--sidebar-foreground", hexToHslTokens(selectedTheme.text));
  root.style.setProperty("--sidebar-primary", hexToHslTokens(selectedTheme.main));
  root.style.setProperty("--sidebar-primary-foreground", primaryForeground);
  root.style.setProperty("--sidebar-accent", hexToHslTokens(selectedTheme.subAlt));
  root.style.setProperty("--sidebar-accent-foreground", hexToHslTokens(selectedTheme.text));
  root.style.setProperty("--sidebar-border", hexToHslTokens(selectedTheme.sub));
  root.style.setProperty("--sidebar-ring", hexToHslTokens(selectedTheme.caret));

  if (resolvedPresetName !== CUSTOM_THEME_PRESET && isAnimatedThemePreset(resolvedPresetName)) {
    document.body.classList.add(ANIMATED_THEME_CLASS);
  }

  applyVisualEnhancements();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT, { detail: { presetName: resolvedPresetName } }));
  }
};