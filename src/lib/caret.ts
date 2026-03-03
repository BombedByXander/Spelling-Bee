export type CaretStyle = "default" | "bar" | "block" | "outline" | "underline" | "off";

export interface CaretSettings {
  style: CaretStyle;
  blink: boolean;
  smooth: boolean;
}

export const CARET_STYLE_KEY = "spelldown-caret-style";
export const CARET_BLINK_KEY = "spelldown-caret-blink";
export const CARET_SMOOTH_KEY = "spelldown-caret-smooth";

const DEFAULT_CARET_SETTINGS: CaretSettings = {
  style: "default",
  blink: true,
  smooth: true,
};

export const getStoredCaretStyle = (): CaretStyle => {
  const raw = localStorage.getItem(CARET_STYLE_KEY);
  if (!raw) return DEFAULT_CARET_SETTINGS.style;
  if (["default", "bar", "block", "outline", "underline", "off"].includes(raw)) {
    return raw as CaretStyle;
  }
  return DEFAULT_CARET_SETTINGS.style;
};

export const getStoredCaretBlink = (): boolean => {
  const raw = localStorage.getItem(CARET_BLINK_KEY);
  if (raw === null) return DEFAULT_CARET_SETTINGS.blink;
  return raw === "true";
};

export const getStoredCaretSmooth = (): boolean => {
  const raw = localStorage.getItem(CARET_SMOOTH_KEY);
  if (raw === null) return DEFAULT_CARET_SETTINGS.smooth;
  return raw === "true";
};

export const getStoredCaretSettings = (): CaretSettings => ({
  style: getStoredCaretStyle(),
  blink: getStoredCaretBlink(),
  smooth: getStoredCaretSmooth(),
});

export const setStoredCaretStyle = (style: CaretStyle) => {
  localStorage.setItem(CARET_STYLE_KEY, style);
};

export const setStoredCaretBlink = (blink: boolean) => {
  localStorage.setItem(CARET_BLINK_KEY, String(blink));
};

export const setStoredCaretSmooth = (smooth: boolean) => {
  localStorage.setItem(CARET_SMOOTH_KEY, String(smooth));
};
