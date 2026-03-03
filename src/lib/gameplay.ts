export const ROUND_DELAY_KEY = "spelldown-round-delay-ms";
export const AUTO_ENTER_ON_EXACT_LENGTH_KEY = "spelldown-auto-enter-on-exact-length";

export const DEFAULT_ROUND_DELAY_MS = 2000;
export const MIN_ROUND_DELAY_MS = 0;
export const MAX_ROUND_DELAY_MS = 3000;

export const clampRoundDelayMs = (value: number) => {
  if (!Number.isFinite(value)) return DEFAULT_ROUND_DELAY_MS;
  return Math.min(MAX_ROUND_DELAY_MS, Math.max(MIN_ROUND_DELAY_MS, Math.round(value)));
};

export const getStoredRoundDelayMs = () => {
  const raw = Number(localStorage.getItem(ROUND_DELAY_KEY));
  return clampRoundDelayMs(raw);
};

export const getStoredAutoEnterOnExactLengthEnabled = () => {
  return localStorage.getItem(AUTO_ENTER_ON_EXACT_LENGTH_KEY) === "true";
};
