import type { MonkeytypeTheme } from "@/data/monkeytypeThemes";

const ANIMATED_THEME_COUNT = 260;
const GOLDEN_ANGLE = 137.508;

const ANIMATED_CODENAMES = [
  "Aether",
  "Blitz",
  "Cipher",
  "Drift",
  "Ember",
  "Flux",
  "Glint",
  "Helix",
  "Ion",
  "Jolt",
  "Karma",
  "Lumen",
  "Myth",
  "Nova",
  "Orbit",
  "Pulse",
  "Quartz",
  "Rune",
  "Strata",
  "Tundra",
  "Umbra",
  "Vector",
  "Warden",
  "Xylo",
  "Yonder",
  "Zen",
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const hslToHex = (hue: number, saturation: number, lightness: number) => {
  const h = ((hue % 360) + 360) % 360;
  const s = clamp(saturation, 0, 100) / 100;
  const l = clamp(lightness, 0, 100) / 100;

  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const huePrime = h / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));

  let r = 0;
  let g = 0;
  let b = 0;

  if (huePrime >= 0 && huePrime < 1) {
    r = chroma;
    g = x;
  } else if (huePrime >= 1 && huePrime < 2) {
    r = x;
    g = chroma;
  } else if (huePrime >= 2 && huePrime < 3) {
    g = chroma;
    b = x;
  } else if (huePrime >= 3 && huePrime < 4) {
    g = x;
    b = chroma;
  } else if (huePrime >= 4 && huePrime < 5) {
    r = x;
    b = chroma;
  } else {
    r = chroma;
    b = x;
  }

  const match = l - chroma / 2;
  const toHex = (channel: number) =>
    Math.round((channel + match) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const getAnimatedThemeName = (index: number) => {
  const codename = ANIMATED_CODENAMES[(index * 11 + 7) % ANIMATED_CODENAMES.length];
  return `${codename}-${String(index + 1).padStart(3, "0")}`;
};

const createAnimatedTheme = (index: number): MonkeytypeTheme => {
  const baseHue = (index * GOLDEN_ANGLE + (index % 11) * 9) % 360;
  const family = index % 10;
  const contrastMode = Math.floor(index / 10) % 4;

  const bgLightness = contrastMode === 0 ? 7 : contrastMode === 1 ? 11 : contrastMode === 2 ? 15 : 19;
  const bgSaturation = 22 + family * 4;

  const mainHue = (baseHue + family * 13) % 360;
  const caretHue = (mainHue + 36 + contrastMode * 8) % 360;
  const accentHue = (mainHue + 158 + family * 5) % 360;
  const errorHue = (mainHue + 192 + family * 7) % 360;

  const mainSaturation = 74 + (family % 3) * 8;
  const caretSaturation = 68 + (family % 5) * 6;
  const accentSaturation = 70 + (family % 4) * 7;

  return {
    name: getAnimatedThemeName(index),
    bg: hslToHex(baseHue, bgSaturation, bgLightness),
    main: hslToHex(mainHue, mainSaturation, 62),
    caret: hslToHex(caretHue, caretSaturation, 70),
    sub: hslToHex((baseHue + 22) % 360, 26 + family * 2, 48),
    subAlt: hslToHex((baseHue + 12) % 360, 24 + family * 2, bgLightness + 7),
    text: hslToHex((mainHue + 8) % 360, 40, 90 - contrastMode * 4),
    error: hslToHex(errorHue, 82, 64),
    errorExtra: hslToHex(errorHue, 55, 36),
    colorfulError: hslToHex(accentHue, accentSaturation, 66),
    colorfulErrorExtra: hslToHex(accentHue, 54, 34),
    hasCss: true,
  };
};

const getThemePaletteSignature = (theme: MonkeytypeTheme) =>
  [
    theme.bg,
    theme.main,
    theme.caret,
    theme.sub,
    theme.subAlt,
    theme.text,
    theme.error,
    theme.errorExtra,
    theme.colorfulError,
    theme.colorfulErrorExtra,
  ].join("|");

const buildUniqueAnimatedThemes = (count: number): MonkeytypeTheme[] => {
  const themes: MonkeytypeTheme[] = [];
  const usedNames = new Set<string>();
  const usedPalettes = new Set<string>();

  let candidateIndex = 0;
  while (themes.length < count) {
    const candidate = createAnimatedTheme(candidateIndex);
    const paletteSignature = getThemePaletteSignature(candidate);

    if (!usedNames.has(candidate.name) && !usedPalettes.has(paletteSignature)) {
      themes.push(candidate);
      usedNames.add(candidate.name);
      usedPalettes.add(paletteSignature);
    }

    candidateIndex += 1;
  }

  return themes;
};

export const animatedThemes: MonkeytypeTheme[] = buildUniqueAnimatedThemes(ANIMATED_THEME_COUNT);
