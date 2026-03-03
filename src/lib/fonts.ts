export interface FontPack {
  id: string;
  name: string;
  description: string;
  cost: number;
  fontFamily: string;
  fontWeight: string;
  fontSize: string;
  letterSpacing: string;
  lineHeight: string;
}

export const ALL_FONTS: FontPack[] = [
  {
    id: "default",
    name: "Nunito",
    description: "Clean, friendly sans-serif — the default choice",
    cost: 0,
    fontFamily: "'Nunito', sans-serif",
    fontWeight: "700",
    fontSize: "2.25rem",
    letterSpacing: "0.05em",
    lineHeight: "1.5",
  },
  {
    id: "jetbrains-mono",
    name: "JetBrains Mono",
    description: "Monospace perfection — code goes here",
    cost: 50,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: "600",
    fontSize: "2.5rem",
    letterSpacing: "0.02em",
    lineHeight: "1.2",
  },
  {
    id: "courier",
    name: "Courier New",
    description: "Classic monospace — retro typewriter vibes",
    cost: 75,
    fontFamily: "'Courier New', monospace",
    fontWeight: "700",
    fontSize: "2rem",
    letterSpacing: "0.08em",
    lineHeight: "1.6",
  },
  {
    id: "georgia",
    name: "Georgia Serif",
    description: "Elegant serif — sophisticated typography",
    cost: 100,
    fontFamily: "'Georgia', serif",
    fontWeight: "700",
    fontSize: "2.2rem",
    letterSpacing: "0.02em",
    lineHeight: "1.4",
  },
  {
    id: "trebuchet",
    name: "Trebuchet MS",
    description: "Modern sans-serif — clean and readable",
    cost: 80,
    fontFamily: "'Trebuchet MS', sans-serif",
    fontWeight: "700",
    fontSize: "2.3rem",
    letterSpacing: "0.04em",
    lineHeight: "1.5",
  },
  {
    id: "verdana",
    name: "Verdana",
    description: "Web-safe serif — timeless and bold",
    cost: 60,
    fontFamily: "'Verdana', Geneva, sans-serif",
    fontWeight: "700",
    fontSize: "2.4rem",
    letterSpacing: "0.03em",
    lineHeight: "1.3",
  },
  {
    id: "times",
    name: "Times New Roman",
    description: "Classic serif — newspaper style",
    cost: 90,
    fontFamily: "'Times New Roman', serif",
    fontWeight: "700",
    fontSize: "2.1rem",
    letterSpacing: "0.01em",
    lineHeight: "1.6",
  },
  {
    id: "tech",
    name: "Impact",
    description: "Bold and intense — make a statement",
    cost: 120,
    fontFamily: "'Impact', sans-serif",
    fontWeight: "700",
    fontSize: "2.5rem",
    letterSpacing: "0.08em",
    lineHeight: "1.1",
  },
  {
    id: "palatino",
    name: "Palatino Linotype",
    description: "Refined serif — book typography",
    cost: 150,
    fontFamily: "'Palatino Linotype', 'Book Antiqua', serif",
    fontWeight: "600",
    fontSize: "2rem",
    letterSpacing: "0.02em",
    lineHeight: "1.7",
  },
  {
    id: "consolas",
    name: "Consolas",
    description: "Developer's choice — syntax highlighting ready",
    cost: 200,
    fontFamily: "'Consolas', 'Monaco', monospace",
    fontWeight: "600",
    fontSize: "2.3rem",
    letterSpacing: "0.05em",
    lineHeight: "1.4",
  },
  {
    id: "comic-sans",
    name: "Comic Sans MS",
    description: "Playful and casual — loves rounded edges",
    cost: 40,
    fontFamily: "'Comic Sans MS', cursive",
    fontWeight: "700",
    fontSize: "2.2rem",
    letterSpacing: "0.02em",
    lineHeight: "1.5",
  },
  {
    id: "lucida",
    name: "Lucida Console",
    description: "Bright monospace — clean and crisp",
    cost: 65,
    fontFamily: "'Lucida Console', monospace",
    fontWeight: "600",
    fontSize: "2.3rem",
    letterSpacing: "0.04em",
    lineHeight: "1.4",
  },
  {
    id: "garamond",
    name: "Garamond",
    description: "Classic old-style serif — timeless elegance",
    cost: 180,
    fontFamily: "'Garamond', serif",
    fontWeight: "600",
    fontSize: "2.1rem",
    letterSpacing: "0.03em",
    lineHeight: "1.6",
  },
  {
    id: "century",
    name: "Century Gothic",
    description: "Futuristic sans-serif — geometric precision",
    cost: 110,
    fontFamily: "'Century Gothic', sans-serif",
    fontWeight: "700",
    fontSize: "2.3rem",
    letterSpacing: "0.05em",
    lineHeight: "1.4",
  },
  {
    id: "tahoma",
    name: "Tahoma",
    description: "Compact sans-serif — Windows system classic",
    cost: 55,
    fontFamily: "'Tahoma', sans-serif",
    fontWeight: "700",
    fontSize: "2.2rem",
    letterSpacing: "0.02em",
    lineHeight: "1.5",
  },
  {
    id: "georgia-italic",
    name: "Georgia Italic",
    description: "Elegant italic serif — dramatic presence",
    cost: 130,
    fontFamily: "'Georgia', serif",
    fontWeight: "700",
    fontSize: "2.2rem",
    letterSpacing: "0.02em",
    lineHeight: "1.4",
  },
  {
    id: "monaco",
    name: "Monaco",
    description: "Mac classic monospace — minimal and focused",
    cost: 95,
    fontFamily: "'Monaco', monospace",
    fontWeight: "700",
    fontSize: "2.3rem",
    letterSpacing: "0.06em",
    lineHeight: "1.3",
  },
  {
    id: "apple-system",
    name: "System UI",
    description: "Modern system font — native platform feel",
    cost: 70,
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    fontWeight: "700",
    fontSize: "2.2rem",
    letterSpacing: "0.04em",
    lineHeight: "1.4",
  },
  {
    id: "segoe",
    name: "Segoe UI",
    description: "Windows modern ui — clean and universal",
    cost: 85,
    fontFamily: "'Segoe UI', sans-serif",
    fontWeight: "700",
    fontSize: "2.25rem",
    letterSpacing: "0.03em",
    lineHeight: "1.4",
  },
  {
    id: "lucida-grand",
    name: "Lucida Grande",
    description: "Elegant humanist sans — balanced proportions",
    cost: 125,
    fontFamily: "'Lucida Grande', tahoma, sans-serif",
    fontWeight: "700",
    fontSize: "2.2rem",
    letterSpacing: "0.02em",
    lineHeight: "1.5",
  },
  {
    id: "optima",
    name: "Optima",
    description: "Distinctive serif/sans hybrid — futuristic classic",
    cost: 160,
    fontFamily: "'Optima', sans-serif",
    fontWeight: "600",
    fontSize: "2.2rem",
    letterSpacing: "0.03em",
    lineHeight: "1.5",
  },
  {
    id: "hoefler",
    name: "Hoefler Text",
    description: "Premium serif — fine typography master",
    cost: 220,
    fontFamily: "'Hoefler Text', serif",
    fontWeight: "700",
    fontSize: "2rem",
    letterSpacing: "0.02em",
    lineHeight: "1.7",
  },
  {
    id: "menlo",
    name: "Menlo",
    description: "Apple monospace — xcode perfection",
    cost: 140,
    fontFamily: "'Menlo', monospace",
    fontWeight: "600",
    fontSize: "2.3rem",
    letterSpacing: "0.05em",
    lineHeight: "1.3",
  },
  {
    id: "rock-salt",
    name: "Rock Salt",
    description: "Handwriting style — organic and personal",
    cost: 35,
    fontFamily: "'Rock Salt', cursive",
    fontWeight: "700",
    fontSize: "2.1rem",
    letterSpacing: "0.03em",
    lineHeight: "1.6",
  },
  {
    id: "courier-prime",
    name: "Courier Prime",
    description: "Typewriter monospace — screenplay standard",
    cost: 105,
    fontFamily: "'Courier Prime', monospace",
    fontWeight: "700",
    fontSize: "2.1rem",
    letterSpacing: "0.06em",
    lineHeight: "1.5",
  },
];

export function getFontPack(id: string): FontPack {
  return ALL_FONTS.find(f => f.id === id) ?? ALL_FONTS[0];
}

export function applyFont(fontPack: FontPack) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--font-family", fontPack.fontFamily);
  root.style.setProperty("--font-weight", fontPack.fontWeight);
  root.style.setProperty("--font-size", fontPack.fontSize);
  root.style.setProperty("--letter-spacing", fontPack.letterSpacing);
  root.style.setProperty("--line-height", fontPack.lineHeight);
}

export function bumpFontSizeByPx(fontSize: string, bumpPx: number) {
  const trimmed = fontSize.trim();

  if (trimmed.endsWith("px")) {
    const numeric = Number.parseFloat(trimmed.slice(0, -2));
    if (Number.isFinite(numeric)) {
      return `${numeric + bumpPx}px`;
    }
  }

  if (trimmed.endsWith("rem")) {
    const numeric = Number.parseFloat(trimmed.slice(0, -3));
    if (Number.isFinite(numeric)) {
      return `${numeric + bumpPx / 16}rem`;
    }
  }

  return `calc(${trimmed} + ${bumpPx}px)`;
}
