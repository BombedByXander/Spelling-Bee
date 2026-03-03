import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { EASTER_BUNNY_BOUNCE_KEY, EASTER_BUNNY_TOGGLE_EVENT, EASTER_THEME_NAME, THEME_PRESET_KEY } from "@/lib/theme";

interface WordModifierDisplayProps {
  renderedWord: string;
  activeModifiers: string[];
  streak?: number;
  children?: ReactNode;
}

const WordModifierDisplay = ({ renderedWord, activeModifiers, streak = 0, children }: WordModifierDisplayProps) => {
  const hasModifier = (modifierId: string) => activeModifiers.includes(modifierId);
  const salviaActive = hasModifier("salvia");
  const [salviaStyle, setSalviaStyle] = useState<CSSProperties | undefined>(undefined);
  const [salviaSplitIndex, setSalviaSplitIndex] = useState(0);
  const [themeBunnyBounceActive, setThemeBunnyBounceActive] = useState(false);

  const getSalviaSplitIndex = (value: string) => {
    if (value.length <= 1) return value.length;

    const letters = value.split("");
    const letterIndexes = letters
      .map((char, index) => ({ char, index }))
      .filter(({ char }) => /[a-z0-9]/i.test(char))
      .map(({ index }) => index);

    if (letterIndexes.length >= 3) {
      const possibleSplitIndexes = letterIndexes.slice(1, -1);
      return possibleSplitIndexes[Math.floor(Math.random() * possibleSplitIndexes.length)]!;
    }

    const fallbackIndexes = Array.from({ length: Math.max(0, value.length - 1) }, (_, index) => index + 1);
    if (fallbackIndexes.length === 0) return value.length;
    return fallbackIndexes[Math.floor(Math.random() * fallbackIndexes.length)]!;
  };

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

  useEffect(() => {
    const syncThemeBunnyBounce = () => {
      const preset = (localStorage.getItem(THEME_PRESET_KEY) || "").trim().toLowerCase().replace(/_/g, " ");
      const easterThemeActive = preset === EASTER_THEME_NAME;
      const bunnyToggleActive = localStorage.getItem(EASTER_BUNNY_BOUNCE_KEY) === "true";
      setThemeBunnyBounceActive(easterThemeActive && bunnyToggleActive);
    };

    syncThemeBunnyBounce();
    window.addEventListener("storage", syncThemeBunnyBounce);
    window.addEventListener(EASTER_BUNNY_TOGGLE_EVENT, syncThemeBunnyBounce as EventListener);

    return () => {
      window.removeEventListener("storage", syncThemeBunnyBounce);
      window.removeEventListener(EASTER_BUNNY_TOGGLE_EVENT, syncThemeBunnyBounce as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!salviaActive) {
      setSalviaStyle(undefined);
      return;
    }

    let cancelled = false;
    let timer: number | undefined;

    const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

    const update = () => {
      if (cancelled) return;

      const duration = randomBetween(120, 330);
      const redX = randomBetween(5.5, 13.5) * (Math.random() < 0.5 ? -1 : 1);
      const redY = randomBetween(-4.2, 4.2);
      const greenX = -redX * randomBetween(0.88, 1.12);
      const greenY = -redY * randomBetween(0.7, 1.25);

      setSalviaStyle({
        ["--salvia-scale-x" as string]: randomBetween(0.58, 1.68).toFixed(3),
        ["--salvia-scale-y" as string]: randomBetween(0.52, 1.74).toFixed(3),
        ["--salvia-skew-x" as string]: `${randomBetween(-14, 14).toFixed(2)}deg`,
        ["--salvia-skew-y" as string]: `${randomBetween(-10, 10).toFixed(2)}deg`,
        ["--salvia-rotate" as string]: `${randomBetween(-10, 10).toFixed(2)}deg`,
        ["--salvia-split-gap" as string]: `${randomBetween(-7, 13).toFixed(2)}px`,
        ["--salvia-left-shift-x" as string]: `${randomBetween(-18, 6).toFixed(2)}px`,
        ["--salvia-left-shift-y" as string]: `${randomBetween(-12, 12).toFixed(2)}px`,
        ["--salvia-right-shift-x" as string]: `${randomBetween(-6, 18).toFixed(2)}px`,
        ["--salvia-right-shift-y" as string]: `${randomBetween(-12, 12).toFixed(2)}px`,
        ["--salvia-left-rotate" as string]: `${randomBetween(-18, 12).toFixed(2)}deg`,
        ["--salvia-right-rotate" as string]: `${randomBetween(-12, 18).toFixed(2)}deg`,
        ["--salvia-red-x" as string]: `${redX.toFixed(2)}px`,
        ["--salvia-red-y" as string]: `${redY.toFixed(2)}px`,
        ["--salvia-green-x" as string]: `${greenX.toFixed(2)}px`,
        ["--salvia-green-y" as string]: `${greenY.toFixed(2)}px`,
        ["--salvia-blue-y" as string]: `${randomBetween(-5.4, 5.4).toFixed(2)}px`,
        ["--salvia-blue-blur" as string]: `${randomBetween(16, 34).toFixed(2)}px`,
        ["--salvia-blur" as string]: `${randomBetween(0.22, 1.2).toFixed(2)}px`,
        ["--salvia-saturate" as string]: randomBetween(1.24, 1.95).toFixed(2),
        ["--salvia-hue" as string]: `${randomBetween(-14, 14).toFixed(2)}deg`,
        ["--salvia-transition" as string]: `${duration.toFixed(0)}ms`,
      } as CSSProperties);

      timer = window.setTimeout(update, duration);
    };

    update();

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [salviaActive]);

  const wordVisualClasses = [
    hasModifier("boomerang") ? "funbox-boomerang" : "",
    hasModifier("blur_breath") ? "funbox-blur-breath" : "",
    hasModifier("ember_burn") ? "funbox-ember-burn" : "",
    hasModifier("round_round_baby") ? "funbox-round-round-baby" : "",
    hasModifier("earthquake") ? "funbox-earthquake" : "",
    hasModifier("flip_jitter") ? "funbox-flip-jitter" : "",
    hasModifier("flipbook") ? "funbox-flipbook" : "",
    hasModifier("ghost_trail") ? "funbox-ghost-trail" : "",
    hasModifier("glitch_pop") ? "funbox-glitch-pop" : "",
    hasModifier("heartbeat") ? "funbox-heartbeat" : "",
    hasModifier("hover_wave") ? "funbox-hover-wave" : "",
    hasModifier("jello") ? "funbox-jello" : "",
    hasModifier("moonwalk") ? "funbox-moonwalk" : "",
    hasModifier("nausea") ? "funbox-nausea" : "",
    hasModifier("neon_pulse") ? "funbox-neon-pulse" : "",
    hasModifier("orbital_drift") ? "funbox-orbital-drift" : "",
    hasModifier("pendulum") ? "funbox-pendulum" : "",
    hasModifier("pogo_bounce") ? "funbox-pogo-bounce" : "",
    hasModifier("rainbow_flux") ? "funbox-rainbow-flux" : "",
    hasModifier("rubber_squish") ? "funbox-rubber-squish" : "",
    hasModifier("scanner") ? "funbox-scanner" : "",
    hasModifier("salvia") ? "funbox-salvia" : "",
    hasModifier("slinky") ? "funbox-slinky" : "",
    hasModifier("tilt_drift") ? "funbox-tilt-drift" : "",
    hasModifier("tornado_twist") ? "funbox-tornado-twist" : "",
    hasModifier("tremor_burst") ? "funbox-tremor-burst" : "",
    hasModifier("typewriter_hop") ? "funbox-typewriter-hop" : "",
    hasModifier("wave_snap") ? "funbox-wave-snap" : "",
    hasModifier("wobble_spin") ? "funbox-wobble-spin" : "",
    hasModifier("crt") ? "funbox-crt" : "",
    hasModifier("mirror") ? "funbox-mirror" : "",
    themeBunnyBounceActive ? "theme-easter-bunny-hop" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const transformParts: string[] = [];
  if (hasModifier("mirror")) transformParts.push("scaleX(-1)");
  if (hasModifier("upside_down")) transformParts.push("rotate(180deg)");
  const wrapperStyle: CSSProperties | undefined = transformParts.length > 0
    ? { transform: transformParts.join(" ") }
    : undefined;

  const visionTesterStyle: CSSProperties | undefined = hasModifier("vision_tester")
    ? { fontSize: `${Math.max(10, 100 - Math.max(0, streak) * 2)}px`, lineHeight: 1 }
    : undefined;

  const wordStyle: CSSProperties | undefined = salviaStyle
    ? { ...visionTesterStyle, ...salviaStyle }
    : visionTesterStyle;

  const displayedWord = hasModifier("guesser") ? getGuesserMaskedWord(renderedWord) : renderedWord;
  const salviaWord = displayedWord;

  useEffect(() => {
    if (!salviaActive) return;
    setSalviaSplitIndex(getSalviaSplitIndex(salviaWord));
  }, [salviaActive, salviaWord]);

  const salviaLeft = salviaWord.slice(0, salviaSplitIndex);
  const salviaRight = salviaWord.slice(salviaSplitIndex);

  return (
    <span style={wrapperStyle}>
      <span className={wordVisualClasses} style={wordStyle}>
        <span aria-hidden="true">"</span>
        {salviaActive ? (
          <span className="funbox-salvia-split" aria-label={salviaWord}>
            <span className="funbox-salvia-half funbox-salvia-half-left">{salviaLeft}</span>
            <span className="funbox-salvia-half funbox-salvia-half-right">{salviaRight}</span>
          </span>
        ) : (
          <span>{children ?? displayedWord}</span>
        )}
        <span aria-hidden="true">"</span>
      </span>
    </span>
  );
};

export default WordModifierDisplay;