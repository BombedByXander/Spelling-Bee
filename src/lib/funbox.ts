export const FUNBOX_MODIFIERS_KEY = "spelldown-funbox-modifiers";
export const FUNBOX_MODIFIERS_UPDATED_EVENT = "spelldown-funbox-updated";

export function getActiveFunboxModifiers(): string[] {
  try {
    const raw = localStorage.getItem(FUNBOX_MODIFIERS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function isFunboxModifierActive(modifierId: string): boolean {
  return getActiveFunboxModifiers().includes(modifierId);
}

export function emitFunboxModifiersUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FUNBOX_MODIFIERS_UPDATED_EVENT));
}
