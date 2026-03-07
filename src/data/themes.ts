import type { MonkeytypeTheme } from "@/data/monkeytypeThemes";

const THEMES_COUNT = 100;
const GOLDEN_ANGLE = 137.508;

const CODENAMES = [
  "Astra","Beryl","Cinder","Dawn","Echo","Fable","Gleam","Haven","Iris","Juniper",
  "Kite","Lark","Mist","Noble","Olive","Pique","Quartz","Ridge","Sable","Thyme",
  "Umbel","Vale","Wisp","Xanadu","Yield","Zephyr","Amble","Brio","Cove","Dawnfall",
  "Elm","Fjord","Grove","Hearth","Isle","Jade","Knoll","Lumen","Meadow","Nova",
  "Orchid","Praxis","Quill","Rune","Sprig","Tide","Umber","Vireo","Wren","Xylo",
  "Yarrow","Zenith","Argyle","Blossom","Clove","Drizzle","Ember","Frost","Gossamer","Hollow",
  "Indigo","Jasper","Kestrel","Lattice","Marigold","Nimbus","Opal","Palisade","Quarry","Ravine",
  "Sirocco","Tarn","Upland","Vesper","Willow","Xander","Yara","Zinnia","Alder","Bramble",
  "Cobalt","Delta","Elder","Fen","Glade","Harbor","Ivory","Junia","Kora","Lyric",
  "Mica","North","Orion","Pollen","Questa","Rowan","Sylvan","Tropic","Ulric","Vela",
  "Wilder","Xebec","Yonder","Zephyrus","Aurora","Brisk","Crescent","Dune","Evoke","Fawn",
  "Gale","Hush","Islewood","Juno","Kirin","Lumenia","Mistral","Nyx","Oriel","Pavo"
];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const hslToHex = (hue: number, saturation: number, lightness: number) => {
  const h = ((hue % 360) + 360) % 360;
  const s = clamp(saturation, 0, 100) / 100;
  const l = clamp(lightness, 0, 100) / 100;

  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const huePrime = h / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));

  let r = 0, g = 0, b = 0;
  if (huePrime >= 0 && huePrime < 1) { r = chroma; g = x; }
  else if (huePrime >= 1 && huePrime < 2) { r = x; g = chroma; }
  else if (huePrime >= 2 && huePrime < 3) { g = chroma; b = x; }
  else if (huePrime >= 3 && huePrime < 4) { g = x; b = chroma; }
  else if (huePrime >= 4 && huePrime < 5) { r = x; b = chroma; }
  else { r = chroma; b = x; }

  const m = l - chroma / 2;
  const toHex = (c: number) => Math.round((c + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const getName = (index: number) => `${CODENAMES[index % CODENAMES.length]}-${String(index + 1).padStart(3, "0")}`;

const createTheme = (index: number): MonkeytypeTheme => {
  const baseHue = (index * GOLDEN_ANGLE) % 360;
  const family = index % 8;
  const contrast = (index % 4);

  const bgL = contrast === 0 ? 6 : contrast === 1 ? 10 : contrast === 2 ? 14 : 18;
  const bgS = 18 + family * 3;

  const mainHue = (baseHue + family * 14) % 360;
  const caretHue = (mainHue + 24 + contrast * 6) % 360;
  const accentHue = (mainHue + 140 + family * 5) % 360;

  return {
    name: getName(index),
    bg: hslToHex(baseHue, bgS, bgL),
    main: hslToHex(mainHue, 74, 60),
    caret: hslToHex(caretHue, 68, 68),
    sub: hslToHex((baseHue + 22) % 360, 26 + family * 2, 48),
    subAlt: hslToHex((baseHue + 12) % 360, 24 + family * 2, bgL + 6),
    text: hslToHex((mainHue + 8) % 360, 40, 88 - contrast * 4),
    error: hslToHex((mainHue + 190) % 360, 82, 64),
    errorExtra: hslToHex((mainHue + 190) % 360, 55, 36),
    colorfulError: hslToHex(accentHue, 66, 66),
    colorfulErrorExtra: hslToHex(accentHue, 54, 34),
    hasCss: false,
  };
};

const buildUniqueThemes = (count: number) => {
  const themes: MonkeytypeTheme[] = [];
  const usedNames = new Set<string>();
  const usedPalettes = new Set<string>();
  let i = 0;
  while (themes.length < count) {
    const t = createTheme(i);
    const sig = [t.bg, t.main, t.caret, t.sub, t.subAlt, t.text, t.error].join("|");
    if (!usedNames.has(t.name) && !usedPalettes.has(sig)) {
      themes.push(t);
      usedNames.add(t.name);
      usedPalettes.add(sig);
    }
    i += 1;
  }
  return themes;
};

export const themes: MonkeytypeTheme[] = buildUniqueThemes(THEMES_COUNT).sort((a, b) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
);
