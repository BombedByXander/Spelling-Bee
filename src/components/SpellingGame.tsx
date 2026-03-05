import { useState, useRef, useEffect, useCallback } from "react";
import { getRandomWord, isCorrectSpelling, WordEntry, CHARG_WORD, liveFeedbackCharMatches, liveFeedbackContainsChar, resolveWordForActiveModifiers } from "@/data/words";
import { getSoundPack } from "@/lib/sounds";
import { bumpFontSizeByPx, getFontPack } from "@/lib/fonts";
import { getStoredCaretSettings } from "@/lib/caret";
import { THEME_PRESET_KEY } from "@/lib/theme";
import { getStoredAutoEnterOnExactLengthEnabled, getStoredRoundDelayMs } from "@/lib/gameplay";
import { getStreakVisual } from "@/lib/streak";
import { applyRoundRandomizedTheme } from "@/lib/themeRandomizer";
import { recordReplayEvent } from "@/lib/replay";
import { sanitizeInputForActiveModifiers } from "@/lib/funboxWord";
import { getActiveFunboxModifiers } from "@/lib/funbox";
import { getMuted } from "@/components/MuteButton";
import { supabase } from "@/integrations/supabase/client";
import KeyboardMap, { KeyboardLayout } from "@/components/KeyboardMap";
import WordMeaningHint from "@/components/WordMeaningHint";
import BlackoutWord from "@/components/BlackoutWord";
import StreakDisplay from "@/components/StreakDisplay";
import { Check, Flame, X } from "lucide-react";

interface Stats {
  streak: number;
  wpms: number[];
}

function getPromptLabel(word: string) {
  const labels = [
    "Spell this word:",
    "Please spell:",
    "The word is:",
    "Type this word:",
    "Can you spell:",
  ];
  const normalized = word.toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return labels[hash % labels.length];
}

function calcWpm(charCount: number, errors: number, startMs: number, endMs: number): number {
  const elapsedMin = (endMs - startMs) / 60000;
  if (elapsedMin <= 0) return 0;
  const grossWpm = (charCount / 5) / elapsedMin;
  const safeErrors = Math.max(0, Math.min(errors, charCount));
  const accuracyFactor = charCount > 0 ? Math.max(0, (charCount - safeErrors) / charCount) : 1;
  const netWpm = grossWpm * accuracyFactor;
  return Math.round(netWpm * 100) / 100;
}

function countLiveErrors(typedInput: string, word: WordEntry): number {
  return typedInput.split("").reduce((count, typedChar, index) => {
    return count + (liveFeedbackCharMatches(typedChar, index, word) ? 0 : 1);
  }, 0);
}

interface Props {
  chargMode: boolean;
  userId?: string;
  activeSound: string;
  activeFont: string;
  keyboardLayout: KeyboardLayout;
  keySize?: number;
  restartKeybind: string;
}

const SpellingGame = ({ chargMode, userId, activeSound, activeFont, keyboardLayout, keySize = 15, restartKeybind }: Props) => {
  const [currentWord, setCurrentWord] = useState<WordEntry>(() => getRandomWord(undefined, chargMode));
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"idle" | "correct" | "incorrect">("idle");
  const [stats, setStats] = useState<Stats>({ streak: 0, wpms: [] });
  const [rawWpm, setRawWpm] = useState<number | null>(null);
  const [rawCharCount, setRawCharCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [lastKeyTs, setLastKeyTs] = useState(0);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [isSelectingText, setIsSelectingText] = useState(false);
  const [caretPosition, setCaretPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wpmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live WPM update
  useEffect(() => {
    if (startTime && result === "idle" && rawCharCount > 0) {
      const update = () => {
        const now = performance.now();
        setRawWpm(calcWpm(rawCharCount, countLiveErrors(input, currentWord), startTime, now));
      };
      update();
      wpmIntervalRef.current = setInterval(update, 200);
      return () => { if (wpmIntervalRef.current) clearInterval(wpmIntervalRef.current); };
    } else if (!startTime || rawCharCount === 0) {
      setRawWpm(null);
    }
  }, [startTime, result, rawCharCount, input, currentWord]);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [currentWord]);

  const nextWord = useCallback(() => {
    const next = getRandomWord(currentWord.primary, chargMode);
    setCurrentWord(next);
    setInput("");
    setResult("idle");
    setStartTime(null);
    setShaking(false);
    setRawWpm(null);
    setRawCharCount(0);
    setLastKey(null);
    setCaretPosition(0);
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  }, [currentWord.primary, chargMode]);

  // Quick restart keybind
  useEffect(() => {
    if (!restartKeybind) return;
    const handler = (e: KeyboardEvent) => {
      const key = [];
      if (e.ctrlKey) key.push("Ctrl");
      if (e.altKey) key.push("Alt");
      if (e.shiftKey) key.push("Shift");
      if (e.key.length === 1) key.push(e.key.toUpperCase());
      else key.push(e.key);
      const combo = key.join("+");
      if (combo === restartKeybind) {
        e.preventDefault();
        nextWord();
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [restartKeybind, nextWord]);

  useEffect(() => {
    const updateCapsLock = (e: KeyboardEvent) => {
      setCapsLockOn(e.getModifierState("CapsLock"));
    };
    window.addEventListener("keydown", updateCapsLock);
    window.addEventListener("keyup", updateCapsLock);
    return () => {
      window.removeEventListener("keydown", updateCapsLock);
      window.removeEventListener("keyup", updateCapsLock);
    };
  }, []);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    const now = performance.now();
    const elapsedMs = startTime ? Math.max(0, now - startTime) : 0;
    const correct = isCorrectSpelling(input, currentWord);
    recordReplayEvent({
      mode: "master",
      prompt: currentWord.primary,
      typed: input.trim(),
      correct,
      elapsedMs: startTime ? Math.round(now - startTime) : 0,
    });
    setResult(correct ? "correct" : "incorrect");
    applyRoundRandomizedTheme();

    if (startTime) {
      setRawWpm(calcWpm(rawCharCount, countLiveErrors(input, currentWord), startTime, now));
    }

    if (correct) {
      const newStreak = stats.streak + 1;
      const newWpms = startTime
        ? [...stats.wpms, calcWpm(rawCharCount, countLiveErrors(input, currentWord), startTime, now)]
        : stats.wpms;
      setStats({ streak: newStreak, wpms: newWpms });
      let earned = 5;
      if (newStreak > 0 && newStreak % 10 === 0) earned += 15;
      if (userId) {
        supabase.rpc("add_stars", { p_amount: earned }).then(() => {});
      }
    } else {
      if (userId && stats.streak > 0) {
        supabase.rpc("submit_streak", { p_streak_count: stats.streak }).then(() => {});
      }
      setStats({ streak: 0, wpms: [] });
      setShaking(true);
    }
    timeoutRef.current = setTimeout(nextWord, getStoredRoundDelayMs());
  }, [input, currentWord, startTime, nextWord, stats, userId, rawCharCount]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    setCapsLockOn(e.getModifierState("CapsLock"));
    if (e.key === "Enter" && result === "idle") handleSubmit();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (result !== "idle") return;
    const rawValue = e.target.value;
    const val = sanitizeInputForActiveModifiers(rawValue, getActiveFunboxModifiers());
    if (!startTime && val.length === 1) setStartTime(performance.now());
    if (val.length > input.length) {
      setRawCharCount((prev) => prev + (val.length - input.length));
      if (!getMuted()) getSoundPack(activeSound).play();
      setLastKey(val[val.length - 1]);
      setLastKeyTs(Date.now());
    }
    setInput(val);
    setCaretPosition(Math.min(e.target.selectionStart ?? val.length, val.length));
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (result !== "idle") return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("button, a, input, select, textarea, [role='menu'], [role='dialog']")) return;
      inputRef.current?.focus();
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [result]);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const activeThemePreset = (localStorage.getItem(THEME_PRESET_KEY) || "").trim().toLowerCase().replace(/_/g, " ");
  const isRgbTheme = activeThemePreset === "rgb";
  const isWordleTheme = activeThemePreset === "wordle";
  const isUltraBlackTheme = (localStorage.getItem(THEME_PRESET_KEY) || "").toLowerCase().replace(/_/g, " ") === "ultra black";
  const hideLiveFeedback = localStorage.getItem("spelldown-hide-live-feedback") === "true";
  const showWordMeaning = localStorage.getItem("spelldown-show-word-meaning") !== "false";
  const rgbOverlayActive = isRgbTheme && !isSelectingText;
  const caretSettings = getStoredCaretSettings();
  const showCustomCaret =
    result === "idle" &&
    (["bar", "block", "outline", "underline"].includes(caretSettings.style) ||
      (rgbOverlayActive && caretSettings.style === "default")) &&
    !isSelectingText;
  const hideNativeCaret = !isSelectingText && (isRgbTheme || caretSettings.style !== "default");
  const resolvedWord = resolveWordForActiveModifiers(currentWord);
  const autoEnterOnExactLength = getStoredAutoEnterOnExactLengthEnabled();
  const streakVisual = getStreakVisual(stats.streak);

  useEffect(() => {
    if (!autoEnterOnExactLength) return;
    if (result !== "idle") return;
    if (!input.trim()) return;
    if (input.length !== resolvedWord.primary.length) return;
    handleSubmit();
  }, [autoEnterOnExactLength, handleSubmit, input, resolvedWord.primary.length, result]);

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-3 sm:px-4 gap-3 sm:gap-5 select-none">
      {/* Word Display */}
      <div className={`text-center space-y-2 ${shaking ? "animate-shake" : ""}`}>
        <p className="text-sm text-muted-foreground tracking-wide">{getPromptLabel(currentWord.primary)}</p>
        <h2
          className={`font-mono text-base sm:text-xl md:text-3xl font-bold tracking-wide break-all leading-relaxed transition-colors duration-300 ${
            result === "correct"
              ? "text-primary text-glow"
              : result === "incorrect"
              ? "text-destructive text-glow-error"
              : "text-foreground"
          }`}
          style={{
            fontFamily: getFontPack(activeFont).fontFamily,
            fontWeight: getFontPack(activeFont).fontWeight,
            fontSize: bumpFontSizeByPx(getFontPack(activeFont).fontSize, 1),
            letterSpacing: getFontPack(activeFont).letterSpacing,
            lineHeight: getFontPack(activeFont).lineHeight,
          }}
        >
          <BlackoutWord word={currentWord.primary} streak={stats.streak} isActive={result === "idle"} />
        </h2>
        {resolvedWord.alternates.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Also accepted: {resolvedWord.alternates.join(", ")}
          </p>
        )}
      </div>

      {/* WPM - live under word */}
      <div className="h-6 flex items-center gap-3">
        {rawWpm !== null && (
          <span className="text-sm font-mono text-muted-foreground">
            <span className="text-foreground font-bold">{rawWpm}</span> WPM
          </span>
        )}
        {stats.streak > 0 && (
          <span className={`text-sm font-mono font-bold ${streakVisual.className}`} style={streakVisual.style}>
            <Flame size={14} className="inline-block mr-1 align-[-1px]" />
            <StreakDisplay streak={stats.streak} />
          </span>
        )}
      </div>

      {/* Letter Indicator */}
      <div className="w-full max-w-2xl px-1">
        {!hideLiveFeedback && (
          <div className="flex flex-wrap justify-center gap-[2px] sm:gap-1 mb-2">
            {resolvedWord.primary.split("").map((char, i) => {
              const typed = input[i];
              let colorClass = "text-muted-foreground/30 border-border/40";
              let tileStyle: React.CSSProperties | undefined;
              if (typed) {
                const isCorrectChar = liveFeedbackCharMatches(typed, i, currentWord);
                if (isWordleTheme) {
                  const isPresentChar = liveFeedbackContainsChar(typed, currentWord);
                  colorClass = isCorrectChar
                    ? "text-primary border-primary/60 bg-primary/15"
                    : isPresentChar
                    ? "text-[hsl(var(--streak-yellow))] border-[hsl(var(--streak-yellow))]/60 bg-[hsl(var(--streak-yellow))]/12"
                    : "text-white border-white/70 bg-white/10";
                } else if (isRgbTheme) {
                  const hue = (i * 42) % 360;
                  colorClass = "border-primary/50";
                  tileStyle = {
                    color: `hsl(${hue} 95% 65%)`,
                    borderColor: isCorrectChar
                      ? `hsl(${hue} 90% 55% / 0.6)`
                      : "hsl(var(--destructive) / 0.72)",
                    backgroundColor: isCorrectChar
                      ? `hsl(${hue} 90% 55% / 0.12)`
                      : "hsl(var(--destructive) / 0.14)",
                  };
                } else {
                  colorClass = isCorrectChar
                    ? "text-primary border-primary/50 bg-primary/10"
                    : "text-destructive border-destructive/50 bg-destructive/10";
                }
              }
              return (
                <span
                  key={i}
                  className={`inline-flex items-center justify-center w-6 h-7 sm:w-7 sm:h-8 text-[11px] sm:text-sm font-mono font-bold border rounded transition-all duration-150 ${colorClass}`}
                  style={tileStyle}
                >
                  {typed || "·"}
                </span>
              );
            })}
          </div>
        )}
        {!hideLiveFeedback && (
          <p className="text-center text-xs text-muted-foreground font-mono">
            {input.length}/{resolvedWord.primary.length}
          </p>
        )}
      </div>

      {/* Input - frosted */}
      <div className={`relative w-full max-w-2xl px-1 ${shaking ? "animate-shake" : ""}`}>
        {rgbOverlayActive && input.length > 0 && (
          <div className="absolute inset-0 pointer-events-none px-4 sm:px-6 py-3 sm:py-4 font-mono text-base sm:text-lg md:text-xl leading-[1.35] whitespace-nowrap overflow-hidden">
            {input.split("").map((typedChar, i) => {
              const isCorrectChar = liveFeedbackCharMatches(typedChar, i, currentWord);
              const color = `hsl(${(i * 42) % 360} 95% 65%)`;
              return (
                <span key={`input-char-${i}`} style={{ color }}>
                  {typedChar}
                </span>
              );
            })}
          </div>
        )}
        {showCustomCaret && (
          <div className="absolute top-1/2 -translate-y-1/2 left-4 sm:left-6 pointer-events-none overflow-hidden">
            <span
              className={`block ${caretSettings.blink ? "typing-caret-blink" : ""} ${caretSettings.smooth ? "transition-transform duration-100" : ""} ${
                caretSettings.style === "bar" || (caretSettings.style === "default" && rgbOverlayActive)
                  ? "w-[2px] h-[1.35em] rounded-full"
                  : caretSettings.style === "block"
                  ? "w-[0.72ch] h-[1.35em] rounded-sm opacity-60"
                  : caretSettings.style === "outline"
                  ? "w-[0.72ch] h-[1.35em] rounded-sm border bg-transparent"
                  : "w-[0.72ch] h-[2px] rounded-full"
              }`}
              style={{
                transform:
                  caretSettings.style === "underline"
                    ? `translateX(calc(${caretPosition}ch + 0.06ch)) translateY(0.62em)`
                    : `translateX(calc(${caretPosition}ch + 0.06ch))`,
                backgroundColor: caretSettings.style === "outline" ? "transparent" : "hsl(var(--ring))",
                borderColor: "hsl(var(--ring))",
              }}
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
            ref={inputRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onKeyUp={(e) => {
              setCapsLockOn(e.getModifierState("CapsLock"));
              const start = e.currentTarget.selectionStart ?? 0;
              const end = e.currentTarget.selectionEnd ?? 0;
              setCaretPosition(start);
              setIsSelectingText(start !== end);
            }}
            onSelect={(e) => {
              const start = e.currentTarget.selectionStart ?? 0;
              const end = e.currentTarget.selectionEnd ?? 0;
              setCaretPosition(start);
              setIsSelectingText(start !== end);
            }}
            onClick={(e) => setCaretPosition(e.currentTarget.selectionStart ?? 0)}
            onFocus={(e) => setCaretPosition(e.currentTarget.selectionStart ?? input.length)}
            onBlur={() => setIsSelectingText(false)}
            disabled={result !== "idle"}
            placeholder="Start typing..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            autoFocus
            className={`w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-mono text-base sm:text-lg md:text-xl leading-[1.35] bg-card/60 frost-input border-2 input-basic-white-glow ${isUltraBlackTheme ? "ultra-black-input-glow" : ""} ${rgbOverlayActive ? "text-transparent [-webkit-text-fill-color:transparent]" : "text-foreground"} ${hideNativeCaret ? "caret-transparent" : "caret-[hsl(var(--ring))]"} placeholder:text-muted-foreground outline-none transition-colors duration-300 ${
              result === "correct"
                ? "border-primary box-glow-success"
                : result === "incorrect"
                ? "border-destructive box-glow-error"
                : isUltraBlackTheme
                ? "border-[hsl(var(--streak-deep-red))]/65 focus:border-[hsl(var(--streak-deep-red))]/65"
                : "border-border/60 focus:border-primary/70 focus:box-glow"
            }`}
          />
          </div>
          {result !== "idle" && (
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${result === "correct" ? "border-primary/70 text-primary bg-primary/10" : "border-destructive/70 text-destructive bg-destructive/10"}`}>
              {result === "correct" ? <Check size={14} /> : <X size={14} />}
            </span>
          )}
        </div>
        {capsLockOn && result === "idle" && (
          <p className="text-center mt-2 text-xs text-destructive font-mono">Caps Lock is ON</p>
        )}
      </div>

      {/* Keyboard Map - centered */}
      <div className="w-full max-w-2xl px-1">
        <WordMeaningHint
          word={currentWord.primary}
          enabled={showWordMeaning}
          className="mx-0 max-w-none text-left"
        />
      </div>

      <div className="w-full max-w-lg px-1 mt-2">
        <KeyboardMap lastKey={lastKeyTs > 0 ? lastKey : null} layout={keyboardLayout} size={keySize} />
      </div>
    </div>
  );
};

export default SpellingGame;
