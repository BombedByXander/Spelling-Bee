export const xpForNextLevel = (level: number): number => {
  const safeLevel = Math.max(1, Math.floor(level));
  return Math.floor(120 * Math.pow(safeLevel, 1.55));
};

export const totalXpForLevel = (level: number): number => {
  const safeLevel = Math.max(1, Math.floor(level));
  let total = 0;
  for (let current = 1; current < safeLevel; current++) {
    total += xpForNextLevel(current);
  }
  return total;
};

export const getLevelFromXp = (xp: number) => {
  const safeXp = Math.max(0, Math.floor(xp || 0));
  let level = 1;
  let spent = 0;

  while (true) {
    const needed = xpForNextLevel(level);
    if (safeXp < spent + needed) {
      const xpInLevel = safeXp - spent;
      return {
        level,
        currentXp: safeXp,
        xpInLevel,
        xpForNext: needed,
        progress: needed > 0 ? Math.min(1, xpInLevel / needed) : 0,
      };
    }
    spent += needed;
    level += 1;

    if (level > 10000) {
      return {
        level,
        currentXp: safeXp,
        xpInLevel: 0,
        xpForNext: xpForNextLevel(level),
        progress: 0,
      };
    }
  }
};
