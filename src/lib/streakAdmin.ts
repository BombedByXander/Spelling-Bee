export const CLIENT_STREAK_OVERRIDE_KEY = "spelldown-client-streak-override";
export const CLIENT_STREAK_OVERRIDE_EVENT = "spelldown-client-streak-override";

export const getStoredClientStreakOverride = (): number | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CLIENT_STREAK_OVERRIDE_KEY);
  if (raw === null) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.floor(parsed));
};

export const setStoredClientStreakOverride = (value: number | null) => {
  if (typeof window === "undefined") return;

  if (value === null) {
    localStorage.removeItem(CLIENT_STREAK_OVERRIDE_KEY);
  } else {
    const normalized = Math.max(0, Math.floor(value));
    localStorage.setItem(CLIENT_STREAK_OVERRIDE_KEY, String(normalized));
  }

  window.dispatchEvent(
    new CustomEvent(CLIENT_STREAK_OVERRIDE_EVENT, {
      detail: { streak: value === null ? null : Math.max(0, Math.floor(value)) },
    })
  );
};
