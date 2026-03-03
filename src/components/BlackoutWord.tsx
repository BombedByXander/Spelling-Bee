import { useEffect, useState } from "react";
import { FUNBOX_MODIFIERS_UPDATED_EVENT, getActiveFunboxModifiers } from "@/lib/funbox";
import { applySpellingFunboxModifiers } from "@/lib/funboxWord";
import WordModifierDisplay from "@/components/WordModifierDisplay";

interface BlackoutWordProps {
  word: string;
  streak?: number;
  isActive?: boolean;
}

const BLACKOUT_HIDDEN_CHANCE = 0.45;

const getRandomOpacity = () => (Math.random() < BLACKOUT_HIDDEN_CHANCE ? 0 : 1);

const getGuesserMaskedWord = (value: string) => {
  const gameMode = localStorage.getItem("spelldown-game-mode");
  const isSingleMaskMode = gameMode === "beginner" || gameMode === "novice" || gameMode === "moderate";
  const isAlternatingDotMode = gameMode === "genius" || gameMode === "master";

  const letters = value.split("");
  const letterIndexes = letters
    .map((char, index) => ({ char, index }))
    .filter(({ char }) => /[a-z0-9]/i.test(char))
    .map(({ index }) => index);

  if (isSingleMaskMode && letterIndexes.length > 0) {
    const singleMaskIndex = letterIndexes[Math.floor(letterIndexes.length / 2)];
    return letters
      .map((char, index) => (index === singleMaskIndex ? "." : char))
      .join("");
  }

  if (isAlternatingDotMode && letterIndexes.length > 0) {
    let letterCounter = 0;
    return letters
      .map((char) => {
        if (!/[a-z0-9]/i.test(char)) return char;
        const shouldMask = letterCounter % 2 === 1;
        letterCounter += 1;
        return shouldMask ? "." : char;
      })
      .join("");
  }

  let visibleCounter = 0;
  return letters
    .map((char) => {
      if (!/[a-z0-9]/i.test(char)) return char;
      const shouldReveal = visibleCounter % 4 === 3;
      visibleCounter += 1;
      return shouldReveal ? char : ".";
    })
    .join("");
};

const BlackoutWord = ({ word, streak = 0, isActive = true }: BlackoutWordProps) => {
  const [activeModifiers, setActiveModifiers] = useState<string[]>(() => getActiveFunboxModifiers());
  const [opacities, setOpacities] = useState<number[]>(() => word.split("").map(() => 1));
  const [blackoutPrimed, setBlackoutPrimed] = useState(false);

  const hasModifier = (modifierId: string) => activeModifiers.includes(modifierId);
  const renderedWord = applySpellingFunboxModifiers(word, activeModifiers);
  const displayWord = hasModifier("guesser") ? getGuesserMaskedWord(renderedWord) : renderedWord;

  useEffect(() => {
    const refresh = () => {
      setActiveModifiers(getActiveFunboxModifiers());
    };

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(FUNBOX_MODIFIERS_UPDATED_EVENT, refresh as EventListener);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(FUNBOX_MODIFIERS_UPDATED_EVENT, refresh as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!hasModifier("blackout") || !isActive || !blackoutPrimed) {
      setOpacities(displayWord.split("").map(() => 1));
      return;
    }

    const update = () => {
      setOpacities(
        displayWord.split("").map((character) => {
          if (character.trim().length === 0) return 1;
          return getRandomOpacity();
        })
      );
    };

    update();
    const timer = window.setInterval(update, 460);

    return () => window.clearInterval(timer);
  }, [displayWord, activeModifiers, isActive, blackoutPrimed]);

  useEffect(() => {
    if (!hasModifier("blackout") || !isActive) {
      setBlackoutPrimed(false);
      return;
    }

    setBlackoutPrimed(false);
    const timer = window.setTimeout(() => setBlackoutPrimed(true), 2000);
    return () => window.clearTimeout(timer);
  }, [displayWord, activeModifiers, isActive]);

  if (!hasModifier("blackout") || !isActive || !blackoutPrimed) {
    return (
      <WordModifierDisplay renderedWord={displayWord} activeModifiers={activeModifiers} streak={streak} />
    );
  }

  return (
    <WordModifierDisplay renderedWord={displayWord} activeModifiers={activeModifiers} streak={streak}>
      {displayWord.split("").map((character, index) => (
        <span
          key={`${character}-${index}`}
          style={{
            opacity: opacities[index] ?? 1,
            transition: "opacity 340ms linear",
            display: "inline-block",
          }}
        >
          {character}
        </span>
      ))}
    </WordModifierDisplay>
  );
};

export default BlackoutWord;
