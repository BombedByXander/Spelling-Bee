import { describe, it, expect } from "vitest";
import { FUNBOX_MODIFIERS } from "@/data/funboxModifiers";
import {
  applySpellingFunboxModifiers,
  sanitizeInputForActiveModifiers,
  SYMBOL_ENABLING_FUNBOX_MODIFIERS,
  TRANSFORMING_FUNBOX_MODIFIERS,
} from "@/lib/funboxWord";

describe("funbox modifier coverage", () => {
  it("applies every transforming modifier without crashing", () => {
    const sample = "Typing Test";

    for (const modifierId of TRANSFORMING_FUNBOX_MODIFIERS) {
      const output = applySpellingFunboxModifiers(sample, [modifierId]);
      expect(typeof output).toBe("string");
      expect(output.length).toBeGreaterThan(0);
    }
  });

  it("covers all modifier ids as transforming or visual", () => {
    const visualOnlyModifiers = new Set([
      "blackout",
      "blur_breath",
      "boomerang",
      "crt",
      "earthquake",
      "ember_burn",
      "flipbook",
      "ghost_trail",
      "glitch_pop",
      "guesser",
      "heartbeat",
      "hover_wave",
      "jello",
      "mirror",
      "moonwalk",
      "nausea",
      "neon_pulse",
      "pendulum",
      "rainbow_flux",
      "round_round_baby",
      "salvia",
      "scanner",
      "slinky",
      "tilt_drift",
      "tornado_twist",
      "tremor_burst",
      "typewriter_hop",
      "upside_down",
      "pogo_bounce",
      "flip_jitter",
      "rubber_squish",
      "orbital_drift",
      "wave_snap",
      "vision_tester",
      "wobble_spin",
    ]);

    const missing = FUNBOX_MODIFIERS
      .map((modifier) => modifier.id)
      .filter((modifierId) => !TRANSFORMING_FUNBOX_MODIFIERS.has(modifierId) && !visualOnlyModifiers.has(modifierId));

    expect(missing).toEqual([]);
  });

  it("only allows symbol input for the modifier that enables it", () => {
    const symbolChecks: Array<{ modifierId: string; symbol: string }> = Object.entries(SYMBOL_ENABLING_FUNBOX_MODIFIERS)
      .flatMap(([modifierId, symbols]) => symbols.map((symbol) => ({ modifierId, symbol })));

    for (const { modifierId, symbol } of symbolChecks) {
      const blocked = sanitizeInputForActiveModifiers(`a${symbol}b`, []);
      const allowed = sanitizeInputForActiveModifiers(`a${symbol}b`, [modifierId]);
      expect(blocked).toBe("ab");
      expect(allowed).toBe(`a${symbol}b`);
    }
  });
});
