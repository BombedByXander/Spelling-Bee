import type { CSSProperties } from "react";

export interface StreakVisual {
  className: string;
  style?: CSSProperties;
}

const COLOR_CYCLE_START_STREAK = 50;
const MAX_COLOR_STREAK = 5000;
const COLOR_STEP = 5;
const RARE_HUES = [
  12,
  28,
  44,
  66,
  82,
  109,
  137,
  166,
  186,
  204,
  223,
  241,
  258,
  276,
  294,
  312,
  328,
  344,
] as const;

export function getStreakVisual(streak: number): StreakVisual {
  if (streak >= COLOR_CYCLE_START_STREAK) {
    const cappedStreak = Math.min(streak, MAX_COLOR_STREAK);
    const tier = Math.floor((cappedStreak - COLOR_CYCLE_START_STREAK) / COLOR_STEP);
    const hue = RARE_HUES[tier % RARE_HUES.length];
    const saturation = 94 + (tier % 3) * 2;
    const lightness = 54 + (tier % 4) * 6;
    const glowStrength = 0.56 + (tier % 3) * 0.08;
    const color = `hsl(${hue} ${saturation}% ${lightness}%)`;

    return {
      className: "text-glow",
      style: {
        color,
        textShadow: `0 0 18px hsl(${hue} ${saturation}% ${lightness}% / ${glowStrength}), 0 0 40px hsl(${hue} ${saturation}% ${Math.max(42, lightness - 8)}% / ${Math.max(0.34, glowStrength - 0.12)}), 0 0 78px hsl(${hue} ${saturation}% ${Math.max(36, lightness - 16)}% / ${Math.max(0.2, glowStrength - 0.24)})`,
      },
    };
  }

  if (streak >= 40) return { className: "text-[hsl(var(--streak-light-blue))] text-glow-light-blue" };
  if (streak >= 30) return { className: "text-[hsl(var(--streak-purple))] text-glow-purple" };
  if (streak >= 20) return { className: "text-[hsl(var(--streak-deep-red))] text-glow-deep-red" };
  if (streak >= 10) return { className: "text-[hsl(var(--streak-red))] text-glow-red" };
  if (streak >= 5) return { className: "text-[hsl(var(--streak-yellow))] text-glow-yellow" };
  return { className: "text-primary text-glow" };
}
