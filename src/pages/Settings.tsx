import { useEffect, useState } from "react";
import { ArrowLeft, Gamepad2, Gift, Keyboard, Palette, RotateCcw, TextCursorInput, Volume2, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { KeyboardLayout } from "@/components/KeyboardMap";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { monkeytypeThemes } from "@/data/monkeytypeThemes";
import { animatedThemes } from "@/data/animatedThemes";
import { ALL_SOUNDS, getSoundPack } from "@/lib/sounds";
import { ALL_FONTS, applyFont, getFontPack } from "@/lib/fonts";
import { getLevelFromXp } from "@/lib/level";
import {
  AUTO_ENTER_ON_EXACT_LENGTH_KEY,
  clampRoundDelayMs,
  DEFAULT_ROUND_DELAY_MS,
  getStoredAutoEnterOnExactLengthEnabled,
  MAX_ROUND_DELAY_MS,
  MIN_ROUND_DELAY_MS,
  ROUND_DELAY_KEY,
} from "@/lib/gameplay";
import {
  DYNAMIC_ENVIRONMENT_KEY,
  getStoredDynamicEnvironmentEnabled,
  getStoredHolographicUiLayerEnabled,
  getStoredThemeEngineV2Enabled,
  HOLOGRAPHIC_UI_LAYER_KEY,
  animatedThemePresetNames,
  applyThemePreset,
  CUSTOM_THEME_PRESET,
  CUSTOM_THEME_KEY,
  DEFAULT_THEME_PRESET,
  getStoredCustomTheme,
  getStoredThemePreset,
  RUNTIME_THEME_PRESET_KEY,
  setStoredCustomTheme,
  THEME_ENGINE_V2_KEY,
  THEME_PRESET_KEY,
  type CustomTheme,
} from "@/lib/theme";
import {
  getStoredFavoriteThemeNames,
  getStoredRandomizeThemeMode,
  RANDOMIZE_THEME_MODE_KEY,
  setStoredFavoriteThemeNames,
  type RandomizeThemeMode,
} from "@/lib/themeRandomizer";
import {
  getStoredCaretSettings,
  setStoredCaretBlink,
  setStoredCaretSmooth,
  setStoredCaretStyle,
  type CaretStyle,
} from "@/lib/caret";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FUNBOX_MODIFIERS } from "@/data/funboxModifiers";
import { emitFunboxModifiersUpdated, FUNBOX_MODIFIERS_KEY, getActiveFunboxModifiers } from "@/lib/funbox";

const CHARG_KEY = "spelldown-charg-mode";
const KEYBIND_KEY = "spelldown-restart-keybind";
const LAYOUT_KEY = "spelldown-keyboard-layout";
const KEYMAP_SIZE_KEY = "spelldown-keymap-size";
const HIDE_LIVE_FEEDBACK_KEY = "spelldown-hide-live-feedback";
const SHOW_WORD_MEANING_KEY = "spelldown-show-word-meaning";
const ALLOW_HOMOPHONES_KEY = "spelldown-allow-homophones";
const GAME_MODE_KEY = "spelldown-game-mode";
const GAME_MODE_CHANGED_EVENT = "spelldown-game-mode-changed";
const ACTIVE_SOUND_KEY = "spelldown-active-sound";
const ACTIVE_FONT_KEY = "spelldown-active-font";
const RESET_STATS_PHRASE = "I want to reset my statistics";

type GameMode = "master" | "custom" | "beginner" | "novice" | "moderate" | "genius";
type SettingsSectionId =
  | "section-gameplay"
  | "section-modifiers"
  | "section-keyboard"
  | "section-audio"
  | "section-themes"
  | "section-monetization"
  | "section-caret"
  | "section-data";

const TYPING_DIFFICULTIES: { label: string; value: GameMode }[] = [
  { label: "Beginner", value: "beginner" },
  { label: "Novice", value: "novice" },
  { label: "Moderate", value: "moderate" },
  { label: "Genius", value: "genius" },
  { label: "Master", value: "master" },
  { label: "Custom", value: "custom" },
];

const KEYBOARD_LAYOUTS: { label: string; value: KeyboardLayout }[] = [
  { label: "QWERTY", value: "qwerty" },
  { label: "AZERTY", value: "azerty" },
  { label: "Dvorak", value: "dvorak" },
  { label: "Colemak", value: "colemak" },
];

const VALID_FUNBOX_MODIFIER_IDS = new Set(FUNBOX_MODIFIERS.map((modifier) => modifier.id));
const BONUS_PACK_FUNBOX_MODIFIER_IDS = new Set([
  "half_swap",
  "mirror_chunks",
  "vowel_caps",
  "consonant_caps",
  "triplet_case",
  "remove_first_vowel",
  "remove_last_consonant",
  "word_flip_flop",
  "rotor_11",
  "rotor_19",
  "pogo_bounce",
  "flip_jitter",
  "rubber_squish",
  "orbital_drift",
  "wave_snap",
]);
const SYMBOLIZED_FUNBOX_MODIFIER_IDS = new Set([
  "dot_chain",
  "kebab_chain",
  "snake_chain",
  "slash_chain",
  "plus_chain",
  "pipe_chain",
  "tilde_chain",
  "wrap_parens",
  "wrap_brackets",
  "wrap_braces",
  "stutter",
]);
const VISUAL_FUNBOX_MODIFIER_IDS = new Set([
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
  "vision_tester",
  "wobble_spin",
]);
const SETTINGS_SECTIONS: { id: SettingsSectionId; label: string; danger?: boolean }[] = [
  { id: "section-gameplay", label: "Gameplay" },
  { id: "section-modifiers", label: "Modifiers" },
  { id: "section-keyboard", label: "Keyboard" },
  { id: "section-audio", label: "Audio" },
  { id: "section-themes", label: "Themes" },
  { id: "section-monetization", label: "Referrals" },
  { id: "section-caret", label: "Caret" },
  { id: "section-data", label: "Danger Zone", danger: true },
];

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recording, setRecording] = useState(false);
  const initialKeySize = Number(localStorage.getItem(KEYMAP_SIZE_KEY));
  const [chargMode, setChargMode] = useState(localStorage.getItem(CHARG_KEY) === "true");
  const [keyboardLayout, setKeyboardLayout] = useState<KeyboardLayout>((localStorage.getItem(LAYOUT_KEY) as KeyboardLayout) || "qwerty");
  const [restartKeybind, setRestartKeybind] = useState(localStorage.getItem(KEYBIND_KEY) || "");
  const [keySize, setKeySize] = useState(isNaN(initialKeySize) ? 15 : initialKeySize);
  const [hideLiveFeedback, setHideLiveFeedback] = useState(localStorage.getItem(HIDE_LIVE_FEEDBACK_KEY) === "true");
  const initialShowWordMeaning = localStorage.getItem(SHOW_WORD_MEANING_KEY);
  const [showWordMeaning, setShowWordMeaning] = useState(initialShowWordMeaning === null ? true : initialShowWordMeaning === "true");
  const [allowHomophones, setAllowHomophones] = useState(localStorage.getItem(ALLOW_HOMOPHONES_KEY) === "true");
  const [autoEnterOnExactLength, setAutoEnterOnExactLength] = useState(() => getStoredAutoEnterOnExactLengthEnabled());
  const [roundDelayMs, setRoundDelayMs] = useState(() => clampRoundDelayMs(Number(localStorage.getItem(ROUND_DELAY_KEY))));
  const [activeSound, setActiveSound] = useState(localStorage.getItem(ACTIVE_SOUND_KEY) || "default");
  const [activeFont, setActiveFont] = useState(localStorage.getItem(ACTIVE_FONT_KEY) || "default");
  const [referralCode, setReferralCode] = useState("");
  const [customReferralCode, setCustomReferralCode] = useState("");
  const [myLevel, setMyLevel] = useState(1);
  const [referralInput, setReferralInput] = useState("");
  const [referralCodeLoading, setReferralCodeLoading] = useState(false);
  const [referralLoading, setReferralLoading] = useState(false);
  const [customReferralLoading, setCustomReferralLoading] = useState(false);
  const [referralMessage, setReferralMessage] = useState<string | null>(null);
  const [themePreset, setThemePreset] = useState(getStoredThemePreset());
  const [themeSearch, setThemeSearch] = useState("");
  const [randomizeThemeMode, setRandomizeThemeMode] = useState<RandomizeThemeMode>(() => getStoredRandomizeThemeMode());
  const [favoriteThemeNames, setFavoriteThemeNames] = useState<string[]>(() => getStoredFavoriteThemeNames());
  const [themeEngineV2Enabled, setThemeEngineV2Enabled] = useState(() => getStoredThemeEngineV2Enabled());
  const [holographicUiLayerEnabled, setHolographicUiLayerEnabled] = useState(() => getStoredHolographicUiLayerEnabled());
  const [dynamicEnvironmentEnabled, setDynamicEnvironmentEnabled] = useState(() => getStoredDynamicEnvironmentEnabled());
  const [customTheme, setCustomTheme] = useState<CustomTheme>(getStoredCustomTheme());
  const initialCaretSettings = getStoredCaretSettings();
  const [caretStyle, setCaretStyle] = useState<CaretStyle>(initialCaretSettings.style);
  const [caretBlink, setCaretBlink] = useState(initialCaretSettings.blink);
  const [caretSmooth, setCaretSmooth] = useState(initialCaretSettings.smooth);
  const [showResetConfirmDialog, setShowResetConfirmDialog] = useState(false);
  const [showResetPhraseDialog, setShowResetPhraseDialog] = useState(false);
  const [showResetFinalDialog, setShowResetFinalDialog] = useState(false);
  const [resetPhraseInput, setResetPhraseInput] = useState("");
  const [resetIrreversibleAck, setResetIrreversibleAck] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>(() => {
    const storedMode = localStorage.getItem(GAME_MODE_KEY);
    return (storedMode as GameMode) || "master";
  });
  const [activeThemeTab, setActiveThemeTab] = useState<"preset" | "custom">(
    getStoredThemePreset() === CUSTOM_THEME_PRESET ? "custom" : "preset"
  );
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSectionId>("section-gameplay");
  const [activePresetThemeTab, setActivePresetThemeTab] = useState<"all" | "animated">("all");
  const [activeThemePresetSection, setActiveThemePresetSection] = useState<"library" | "randomize" | "visual">("library");
  const [activeFunboxModifiers, setActiveFunboxModifiers] = useState<string[]>(() =>
    getActiveFunboxModifiers().filter((modifier) => VALID_FUNBOX_MODIFIER_IDS.has(modifier))
  );

  const presetThemesForActiveTab = activePresetThemeTab === "animated" ? animatedThemes : monkeytypeThemes;

  const filteredThemes = presetThemesForActiveTab.filter((theme) =>
    theme.name.replace(/_/g, " ").toLowerCase().includes(themeSearch.toLowerCase().trim())
  );

  const bonusPackModifiers = FUNBOX_MODIFIERS.filter((modifier) => BONUS_PACK_FUNBOX_MODIFIER_IDS.has(modifier.id));
  const symbolizedModifiers = FUNBOX_MODIFIERS.filter(
    (modifier) => SYMBOLIZED_FUNBOX_MODIFIER_IDS.has(modifier.id) && !BONUS_PACK_FUNBOX_MODIFIER_IDS.has(modifier.id)
  );
  const visualModifiers = FUNBOX_MODIFIERS.filter(
    (modifier) => VISUAL_FUNBOX_MODIFIER_IDS.has(modifier.id) && !BONUS_PACK_FUNBOX_MODIFIER_IDS.has(modifier.id)
  );
  const textTransformModifiers = FUNBOX_MODIFIERS.filter(
    (modifier) =>
      !BONUS_PACK_FUNBOX_MODIFIER_IDS.has(modifier.id) &&
      !SYMBOLIZED_FUNBOX_MODIFIER_IDS.has(modifier.id) &&
      !VISUAL_FUNBOX_MODIFIER_IDS.has(modifier.id)
  );

  const modifierSections = [
    { id: "bonus", title: "Chaos Pack", subtitle: "New standalone category (15 modifiers)", modifiers: bonusPackModifiers },
    { id: "symbolized", title: "Symbolized", subtitle: "Includes punctuation/symbol typing", modifiers: symbolizedModifiers },
    { id: "text", title: "Text Transform", subtitle: "Alters the spelling string itself", modifiers: textTransformModifiers },
    { id: "visual", title: "Visual & Motion", subtitle: "Changes how the word animates/looks", modifiers: visualModifiers },
  ].filter((section) => section.modifiers.length > 0);

  const toggleFavoriteTheme = (themeName: string) => {
    setFavoriteThemeNames((previous) => {
      const next = previous.includes(themeName)
        ? previous.filter((name) => name !== themeName)
        : [...previous, themeName];
      setStoredFavoriteThemeNames(next);
      return next;
    });
  };

  useEffect(() => {
    sessionStorage.removeItem(RUNTIME_THEME_PRESET_KEY);
    applyThemePreset(themePreset);
    localStorage.setItem(THEME_PRESET_KEY, themePreset);
  }, [themePreset]);

  useEffect(() => {
    localStorage.setItem(RANDOMIZE_THEME_MODE_KEY, randomizeThemeMode);
  }, [randomizeThemeMode]);

  useEffect(() => {
    localStorage.setItem(THEME_ENGINE_V2_KEY, String(themeEngineV2Enabled));
    applyThemePreset(themePreset);
  }, [themeEngineV2Enabled]);

  useEffect(() => {
    localStorage.setItem(HOLOGRAPHIC_UI_LAYER_KEY, String(holographicUiLayerEnabled));
    applyThemePreset(themePreset);
  }, [holographicUiLayerEnabled]);

  useEffect(() => {
    localStorage.setItem(DYNAMIC_ENVIRONMENT_KEY, String(dynamicEnvironmentEnabled));
    applyThemePreset(themePreset);
  }, [dynamicEnvironmentEnabled]);

  useEffect(() => {
    setStoredCustomTheme(customTheme);
    if (themePreset === CUSTOM_THEME_PRESET) {
      applyThemePreset(CUSTOM_THEME_PRESET);
    }
  }, [customTheme, themePreset]);

  useEffect(() => {
    if (initialShowWordMeaning === null) {
      localStorage.setItem(SHOW_WORD_MEANING_KEY, "true");
    }
  }, [initialShowWordMeaning]);

  useEffect(() => {
    localStorage.setItem(FUNBOX_MODIFIERS_KEY, JSON.stringify(activeFunboxModifiers));
    emitFunboxModifiersUpdated();
  }, [activeFunboxModifiers]);

  useEffect(() => {
    setActiveFunboxModifiers((previous) => {
      const cleaned = previous.filter((modifier) => VALID_FUNBOX_MODIFIER_IDS.has(modifier));
      return cleaned.length === previous.length ? previous : cleaned;
    });
  }, []);

  useEffect(() => {
    if (!recording) return;

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      const keys: string[] = [];
      if (e.ctrlKey) keys.push("Ctrl");
      if (e.altKey) keys.push("Alt");
      if (e.shiftKey) keys.push("Shift");
      if (e.key.length === 1) keys.push(e.key.toUpperCase());
      else if (!["Control", "Alt", "Shift"].includes(e.key)) keys.push(e.key);

      if (keys.length > 0) {
        const combo = keys.join("+");
        setRestartKeybind(combo);
        localStorage.setItem(KEYBIND_KEY, combo);
        setRecording(false);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [recording]);

  useEffect(() => {
    applyFont(getFontPack(activeFont));
  }, [activeFont]);

  useEffect(() => {
    if (!user) return;
    const loadActiveCosmetics = async () => {
      setReferralCodeLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("active_sound, active_font, stars")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        setReferralCodeLoading(false);
        return;
      }

      const row: any = data;
      const loadedSound = row.active_sound || "default";
      const loadedFont = row.active_font || "default";
      setActiveSound(loadedSound);
      setActiveFont(loadedFont);
      localStorage.setItem(ACTIVE_SOUND_KEY, loadedSound);
      localStorage.setItem(ACTIVE_FONT_KEY, loadedFont);
      const loadedStars = Number(row.stars ?? 0);
      setMyLevel(getLevelFromXp(loadedStars).level);

      const { data: generatedCode, error: codeError } = await (supabase as any).rpc("get_or_create_my_referral_code");
      if (!codeError && typeof generatedCode === "string" && generatedCode.length > 0) {
        setReferralCode(generatedCode);
      } else {
        const { data: fallbackProfile } = await supabase
          .from("profiles")
          .select("referral_code")
          .eq("id", user.id)
          .maybeSingle();

        const existingCode = ((fallbackProfile as any)?.referral_code as string | null)?.trim() || "";
        if (existingCode) {
          setReferralCode(existingCode.toUpperCase());
        } else {
          setReferralMessage("Could not generate your referral code. Please refresh.");
        }
      }

      setReferralCodeLoading(false);
    };

    loadActiveCosmetics();
  }, [user]);

  const handleSoundChange = async (soundId: string) => {
    setActiveSound(soundId);
    localStorage.setItem(ACTIVE_SOUND_KEY, soundId);
    getSoundPack(soundId).play();

    if (user) {
      await supabase.from("profiles").update({ active_sound: soundId }).eq("id", user.id);
    }
  };

  const handleFontChange = async (fontId: string) => {
    setActiveFont(fontId);
    localStorage.setItem(ACTIVE_FONT_KEY, fontId);

    if (user) {
            await supabase.from("profiles").update({ active_font: fontId } as any).eq("id", user.id);
    }
  };

  const handleCopyReferralCode = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setReferralMessage("Referral code copied.");
    } catch {
      setReferralMessage("Could not copy referral code.");
    }
  };

  const handleRedeemReferral = async () => {
    const code = referralInput.trim();
    if (!code || !user) return;

    setReferralLoading(true);
    setReferralMessage(null);

    const { data, error } = await (supabase as any).rpc("redeem_referral_code", { p_code: code });

    if (error) {
      setReferralMessage(error.message || "Could not redeem referral code.");
      setReferralLoading(false);
      return;
    }

    const ok = Boolean(data?.ok);
    if (!ok) {
      setReferralMessage(String(data?.error || "Could not redeem referral code."));
      setReferralLoading(false);
      return;
    }

    const reward = Number(data?.reward || 0);
    setReferralInput("");
    setReferralMessage(reward > 0 ? `Referral redeemed. You and your friend each earned ${reward.toLocaleString()} XP.` : "Referral redeemed successfully.");
    setReferralLoading(false);
  };

  const handleSetCustomReferralCode = async () => {
    const code = customReferralCode.trim();
    if (!user || code.length === 0) return;

    setCustomReferralLoading(true);
    setReferralMessage(null);

    const { data, error } = await (supabase as any).rpc("set_my_custom_referral_code", { p_code: code });
    if (error) {
      setReferralMessage(error.message || "Could not set custom referral code.");
      setCustomReferralLoading(false);
      return;
    }

    const ok = Boolean(data?.ok);
    if (!ok) {
      setReferralMessage(String(data?.error || "Could not set custom referral code."));
      setCustomReferralLoading(false);
      return;
    }

    const newCode = String(data?.code || "");
    if (newCode) {
      setReferralCode(newCode);
      setCustomReferralCode("");
    }
    setReferralMessage("Custom referral code saved.");
    setCustomReferralLoading(false);
  };

  const closeResetDialogs = () => {
    setShowResetConfirmDialog(false);
    setShowResetPhraseDialog(false);
    setShowResetFinalDialog(false);
    setResetPhraseInput("");
    setResetIrreversibleAck(false);
  };

  const handleResetGameplayDefaults = () => {
    const confirmed = window.confirm("Reset gameplay settings to defaults?");
    if (!confirmed) return;

    setGameMode("master");
    localStorage.setItem(GAME_MODE_KEY, "master");
    window.dispatchEvent(new Event(GAME_MODE_CHANGED_EVENT));

    setAllowHomophones(false);
    localStorage.setItem(ALLOW_HOMOPHONES_KEY, "false");

    setAutoEnterOnExactLength(false);
    localStorage.setItem(AUTO_ENTER_ON_EXACT_LENGTH_KEY, "false");

    setChargMode(false);
    localStorage.setItem(CHARG_KEY, "false");

    setShowWordMeaning(true);
    localStorage.setItem(SHOW_WORD_MEANING_KEY, "true");

    setHideLiveFeedback(false);
    localStorage.setItem(HIDE_LIVE_FEEDBACK_KEY, "false");

    setRoundDelayMs(DEFAULT_ROUND_DELAY_MS);
    localStorage.setItem(ROUND_DELAY_KEY, String(DEFAULT_ROUND_DELAY_MS));

    setReferralMessage("Gameplay settings reset to defaults.");
  };

  const handleResetAllSettings = () => {
    const confirmed = window.confirm("Reset all local settings to defaults? This keeps account data and statistics.");
    if (!confirmed) return;

    localStorage.removeItem(CHARG_KEY);
    localStorage.removeItem(KEYBIND_KEY);
    localStorage.removeItem(LAYOUT_KEY);
    localStorage.removeItem(KEYMAP_SIZE_KEY);
    localStorage.removeItem(HIDE_LIVE_FEEDBACK_KEY);
    localStorage.removeItem(SHOW_WORD_MEANING_KEY);
    localStorage.removeItem(ALLOW_HOMOPHONES_KEY);
    localStorage.removeItem(AUTO_ENTER_ON_EXACT_LENGTH_KEY);
    localStorage.removeItem(GAME_MODE_KEY);
    localStorage.removeItem(ROUND_DELAY_KEY);
    localStorage.removeItem(ACTIVE_SOUND_KEY);
    localStorage.removeItem(ACTIVE_FONT_KEY);
    localStorage.removeItem(THEME_PRESET_KEY);
    localStorage.removeItem(CUSTOM_THEME_KEY);
    localStorage.removeItem(THEME_ENGINE_V2_KEY);
    localStorage.removeItem(HOLOGRAPHIC_UI_LAYER_KEY);
    localStorage.removeItem(DYNAMIC_ENVIRONMENT_KEY);
    localStorage.removeItem(FUNBOX_MODIFIERS_KEY);

    setStoredCaretStyle("default");
    setStoredCaretBlink(true);
    setStoredCaretSmooth(true);

    setChargMode(false);
    setKeyboardLayout("qwerty");
    setRestartKeybind("");
    setKeySize(15);
    setHideLiveFeedback(false);
    setShowWordMeaning(true);
    setAllowHomophones(false);
    setAutoEnterOnExactLength(false);
    setGameMode("master");
    window.dispatchEvent(new Event(GAME_MODE_CHANGED_EVENT));
    setRoundDelayMs(DEFAULT_ROUND_DELAY_MS);
    setActiveSound("default");
    setActiveFont("default");
    setThemePreset(DEFAULT_THEME_PRESET);
    setActiveThemePresetSection("library");
    setThemeEngineV2Enabled(false);
    setHolographicUiLayerEnabled(false);
    setDynamicEnvironmentEnabled(false);
    setActiveThemeTab("preset");
    setActivePresetThemeTab("all");
    setThemeSearch("");
    setCustomTheme(getStoredCustomTheme());
    setActiveFunboxModifiers([]);
    setCaretStyle("default");
    setCaretBlink(true);
    setCaretSmooth(true);
    setReferralMessage("All local settings reset.");

    applyThemePreset(DEFAULT_THEME_PRESET);
    applyFont(getFontPack("default"));
    emitFunboxModifiersUpdated();
  };

  const jumpToSection = (id: SettingsSectionId) => {
    setActiveSettingsSection(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
      <div className="w-full">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-card/60 border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-extrabold font-mono text-primary text-glow tracking-tight">Settings</h1>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-6 items-start">
          <aside className="lg:sticky lg:top-6 rounded-xl bg-card/30 border border-border/40 p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-3">Sections</p>
            <div className="space-y-2">
              {SETTINGS_SECTIONS.map((section) => {
                const active = activeSettingsSection === section.id;
                return (
                    <button
                    key={section.id}
                    onClick={() => jumpToSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-full text-xs font-mono border transition-colors ${
                      active
                        ? section.danger
                          ? "border-destructive/70 bg-destructive/10 text-destructive"
                          : "border-primary/70 bg-primary/10 text-primary"
                        : section.danger
                        ? "border-border/60 bg-card/50 hover:border-destructive/60 hover:text-destructive"
                        : "border-border/60 bg-card/50 hover:border-primary/60 hover:text-primary"
                    }`}
                  >
                    {section.label}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="space-y-6">
          <div className="rounded-lg border border-border/50 bg-card/30 px-4 py-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Now editing: {SETTINGS_SECTIONS.find((section) => section.id === activeSettingsSection)?.label}
            </p>
          </div>

          {activeSettingsSection === "section-gameplay" && (
          <>
          <div id="section-gameplay" className="px-5 py-4 rounded-xl bg-card/40 border border-border/40">
            <div className="flex items-center gap-3 mb-3">
              <Keyboard size={16} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Typing Difficulty</p>
                <p className="text-[10px] text-muted-foreground">Choose your active game mode</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TYPING_DIFFICULTIES.map((difficulty) => (
                <button
                  key={difficulty.value}
                  onClick={() => {
                    setGameMode(difficulty.value);
                    localStorage.setItem(GAME_MODE_KEY, difficulty.value);
                    window.dispatchEvent(new Event(GAME_MODE_CHANGED_EVENT));
                  }}
                  className={`px-3 py-2 rounded-full text-sm font-mono transition-colors ${
                    gameMode === difficulty.value
                      ? "bg-primary text-primary-foreground border border-primary"
                      : "bg-card/60 border border-border text-muted-foreground hover:text-foreground hover:border-primary"
                  }`}
                >
                  {difficulty.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              const value = !allowHomophones;
              setAllowHomophones(value);
              localStorage.setItem(ALLOW_HOMOPHONES_KEY, String(value));
            }}
            className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-card/40 border border-border/40 text-sm text-foreground hover:border-primary transition-colors mt-3"
          >
            <TextCursorInput size={16} className={allowHomophones ? "text-primary" : "text-muted-foreground"} />
            <div className="text-left flex-1">
              <p className="font-medium">Allow Homophones</p>
              <p className="text-[10px] text-muted-foreground">Uses homophone spellings only when available (original spellings are excluded)</p>
            </div>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${allowHomophones ? "bg-primary/20 text-primary" : "bg-card/60 text-muted-foreground"}`}>
              {allowHomophones ? "ON" : "OFF"}
            </span>
          </button>

          <button
            onClick={() => {
              const value = !chargMode;
              setChargMode(value);
              localStorage.setItem(CHARG_KEY, String(value));
            }}
            className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-card/40 border border-border/40 text-sm text-foreground hover:border-primary transition-colors"
          >
            <Zap size={16} className={chargMode ? "text-primary" : "text-muted-foreground"} />
            <div className="text-left flex-1">
              <p className="font-medium">Charg Mode</p>
              <p className="text-[10px] text-muted-foreground">Add the legendary word to the pool</p>
            </div>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${chargMode ? "bg-primary/20 text-primary" : "bg-card/60 text-muted-foreground"}`}>
              {chargMode ? "ON" : "OFF"}
            </span>
          </button>

          <button
            onClick={() => {
              const value = !showWordMeaning;
              setShowWordMeaning(value);
              localStorage.setItem(SHOW_WORD_MEANING_KEY, String(value));
            }}
            className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-card/40 border border-border/40 text-sm text-foreground hover:border-primary transition-colors"
          >
            <Keyboard size={16} className={showWordMeaning ? "text-primary" : "text-muted-foreground"} />
            <div className="text-left flex-1">
              <p className="font-medium">Show Word Meanings</p>
              <p className="text-[10px] text-muted-foreground">Shows saved web definitions as “Means: …” above each word</p>
            </div>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${showWordMeaning ? "bg-primary/20 text-primary" : "bg-card/60 text-muted-foreground"}`}>
              {showWordMeaning ? "ON" : "OFF"}
            </span>
          </button>

          <button
            onClick={() => {
              const value = !autoEnterOnExactLength;
              setAutoEnterOnExactLength(value);
              localStorage.setItem(AUTO_ENTER_ON_EXACT_LENGTH_KEY, String(value));
            }}
            className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-card/40 border border-border/40 text-sm text-foreground hover:border-primary transition-colors"
          >
            <Keyboard size={16} className={autoEnterOnExactLength ? "text-primary" : "text-muted-foreground"} />
            <div className="text-left flex-1">
              <p className="font-medium">Auto Enter on Exact Length</p>
              <p className="text-[10px] text-muted-foreground">Automatically submits when typed characters match the exact target length</p>
            </div>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${autoEnterOnExactLength ? "bg-primary/20 text-primary" : "bg-card/60 text-muted-foreground"}`}>
              {autoEnterOnExactLength ? "ON" : "OFF"}
            </span>
          </button>

          <div className="px-5 py-4 rounded-xl bg-card/40 border border-border/40">
            <div className="flex items-center gap-3 mb-2">
              <Keyboard size={16} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Round Transition Delay</p>
                <p className="text-[10px] text-muted-foreground">Time before next word appears after submit</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={MIN_ROUND_DELAY_MS}
                  max={MAX_ROUND_DELAY_MS}
                  step={50}
                  value={roundDelayMs}
                  onChange={(e) => {
                    const next = clampRoundDelayMs(Number(e.target.value));
                    setRoundDelayMs(next);
                    localStorage.setItem(ROUND_DELAY_KEY, String(next));
                  }}
                  className="flex-1"
                />
                <span className="text-xs font-mono w-[64px] text-right">{roundDelayMs}ms</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[500, 1000, 1500, 2000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setRoundDelayMs(preset);
                      localStorage.setItem(ROUND_DELAY_KEY, String(preset));
                    }}
                    className={`text-[10px] font-mono px-2 py-1 rounded-full border ${
                      roundDelayMs === preset
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-primary/60"
                    }`}
                  >
                    {preset}ms
                  </button>
                ))}
              </div>
            </div>
          </div>
          </>
          )}

          {activeSettingsSection === "section-modifiers" && (
          <div id="section-modifiers" className="px-5 py-4 rounded-xl bg-card/40 border border-border/40">
            <div className="flex items-center gap-3 mb-3">
              <Gamepad2 size={16} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Funbox Modifiers</p>
                <p className="text-[10px] text-muted-foreground">Hover a modifier to see what it does</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-mono text-muted-foreground">Selected: {activeFunboxModifiers.length}</p>
              <button
                onClick={() => setActiveFunboxModifiers([])}
                className="text-[10px] font-mono px-2 py-1 rounded-full border border-border/70 text-muted-foreground hover:text-primary hover:border-primary transition-colors"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-3">
              {modifierSections.map((section) => (
                <div key={section.id} className="rounded-lg border border-border/50 bg-card/30 p-2.5">
                  <div className="mb-2 flex items-end justify-between gap-2">
                    <p className="text-[10px] font-mono text-foreground">{section.title}</p>
                    <p className="text-[9px] font-mono text-muted-foreground">{section.subtitle}</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {section.modifiers.map((modifier) => {
                      const active = activeFunboxModifiers.includes(modifier.id);

                      return (
                        <div key={modifier.id} className="group relative">
                          <button
                            onClick={() => {
                              setActiveFunboxModifiers((previous) =>
                                previous.includes(modifier.id)
                                  ? previous.filter((item) => item !== modifier.id)
                                  : [...previous, modifier.id]
                              );
                            }}
                            className={`w-full px-2 py-2 rounded-full text-[11px] font-mono transition-colors text-left border ${
                              active
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card/60 border-border text-muted-foreground hover:text-foreground hover:border-primary"
                            }`}
                          >
                            <span className="truncate block">{modifier.label}</span>
                          </button>
                          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-20 w-[190px] rounded-md border border-border/60 bg-card/95 px-2 py-1 text-[10px] leading-snug text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg">
                            {modifier.description}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {activeSettingsSection === "section-keyboard" && (
          <>
          <div id="section-keyboard" className="px-5 py-4 rounded-xl bg-card/40 border border-border/40">
            <div className="flex items-center gap-3 mb-3">
              <Keyboard size={16} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Keyboard Layout</p>
                <p className="text-[10px] text-muted-foreground">Change letter arrangement</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {KEYBOARD_LAYOUTS.map((layout) => (
                <button
                  key={layout.value}
                  onClick={() => {
                    setKeyboardLayout(layout.value);
                    localStorage.setItem(LAYOUT_KEY, layout.value);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-mono transition-colors ${
                    keyboardLayout === layout.value
                      ? "bg-primary text-primary-foreground border border-primary"
                      : "bg-card/60 border border-border text-muted-foreground hover:text-foreground hover:border-primary"
                  }`}
                >
                  {layout.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-4 rounded-xl bg-card/40 border border-border/40">
            <div className="flex items-center gap-3 mb-2">
              <Keyboard size={16} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Keymap Size</p>
                <p className="text-[10px] text-muted-foreground">0 = off, max 50px</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={50}
                value={keySize}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setKeySize(value);
                  localStorage.setItem(KEYMAP_SIZE_KEY, String(value));
                }}
                className="flex-1"
              />
              <span className="text-xs font-mono">{keySize}px</span>
            </div>
          </div>

          <button
            onClick={() => {
              const value = !hideLiveFeedback;
              setHideLiveFeedback(value);
              localStorage.setItem(HIDE_LIVE_FEEDBACK_KEY, String(value));
            }}
            className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-card/40 border border-border/40 text-sm text-foreground hover:border-primary transition-colors"
          >
            <Keyboard size={16} className={hideLiveFeedback ? "text-primary" : "text-muted-foreground"} />
            <div className="text-left flex-1">
              <p className="font-medium">Hide Live Feedback</p>
              <p className="text-[10px] text-muted-foreground">Hides the live letter boxes while typing</p>
            </div>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${hideLiveFeedback ? "bg-primary/20 text-primary" : "bg-card/60 text-muted-foreground"}`}>
              {hideLiveFeedback ? "ON" : "OFF"}
            </span>
          </button>

          <div className="px-5 py-4 rounded-xl bg-card/40 border border-border/40">
            <div className="flex items-center gap-3 mb-2">
              <Keyboard size={16} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Restart Keybind</p>
                <p className="text-[10px] text-muted-foreground">Press any key combination</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground bg-card/60 px-2 py-1 rounded border border-border">
                {restartKeybind || "Not set"}
              </span>
              <button
                onClick={() => setRecording(true)}
                className={`text-[10px] font-mono px-2 py-1 rounded-lg border transition-colors ${
                  recording
                    ? "border-primary text-primary bg-primary/10 animate-pulse"
                    : "border-border text-muted-foreground hover:text-primary hover:border-primary"
                }`}
              >
                {recording ? "Press keys..." : "Record"}
              </button>
              {restartKeybind && (
                <button
                  onClick={() => {
                    setRestartKeybind("");
                    localStorage.removeItem(KEYBIND_KEY);
                  }}
                  className="text-[10px] text-destructive hover:text-destructive/80"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          </>
          )}

          {activeSettingsSection === "section-audio" && (
          <div id="section-audio" className="px-5 py-4 rounded-xl bg-card/40 border border-border/40">
            <div className="flex items-center gap-3 mb-2">
              <Volume2 size={16} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Audio</p>
                <p className="text-[10px] text-muted-foreground">Choose your typing sound and font</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-[10px] font-mono text-muted-foreground space-y-1">
                <span className="block">Typing Sound</span>
                <select
                  value={activeSound}
                  onChange={(e) => handleSoundChange(e.target.value)}
                  className="w-full rounded-md border border-border bg-card/60 px-2 py-1.5 text-xs text-foreground"
                >
                  {ALL_SOUNDS.map((sound) => (
                    <option key={sound.id} value={sound.id}>
                      {sound.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-[10px] font-mono text-muted-foreground space-y-1">
                <span className="block">Word Font</span>
                <select
                  value={activeFont}
                  onChange={(e) => handleFontChange(e.target.value)}
                  className="w-full rounded-md border border-border bg-card/60 px-2 py-1.5 text-xs text-foreground"
                >
                  {ALL_FONTS.map((font) => (
                    <option key={font.id} value={font.id}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          )}

          {activeSettingsSection === "section-themes" && (
          <div id="section-themes" className="px-5 py-4 rounded-xl bg-card/40 border border-border/40">
            <div className="flex items-center gap-3 mb-2">
              <Palette size={16} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Theme</p>
              </div>
            </div>
            <div className="mb-2 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setActiveThemeTab("preset");
                  setActiveThemePresetSection("library");
                  if (themePreset === CUSTOM_THEME_PRESET) setThemePreset(DEFAULT_THEME_PRESET);
                }}
                className={`text-[10px] font-mono px-4 py-1 rounded-md border ${
                  activeThemeTab === "preset"
                    ? "border-border bg-secondary text-foreground"
                    : "border-border/60 bg-card/50 text-muted-foreground"
                }`}
              >
                preset
              </button>
              <button
                onClick={() => {
                  setActiveThemeTab("custom");
                  setThemePreset(CUSTOM_THEME_PRESET);
                }}
                className={`text-[10px] font-mono px-4 py-1 rounded-md border ${
                  activeThemeTab === "custom"
                    ? "border-border bg-secondary text-foreground"
                    : "border-border/60 bg-card/50 text-muted-foreground"
                }`}
              >
                custom
              </button>
            </div>

            {activeThemeTab === "preset" ? (
              <>
                <div className="mb-2 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setActiveThemePresetSection("library")}
                    className={`text-[10px] font-mono px-3 py-1 rounded-md border ${
                      activeThemePresetSection === "library"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 bg-card/50 text-muted-foreground"
                    }`}
                  >
                    library
                  </button>
                  <button
                    onClick={() => setActiveThemePresetSection("randomize")}
                    className={`text-[10px] font-mono px-3 py-1 rounded-md border ${
                      activeThemePresetSection === "randomize"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 bg-card/50 text-muted-foreground"
                    }`}
                  >
                    randomize
                  </button>
                  <button
                    onClick={() => setActiveThemePresetSection("visual")}
                    className={`text-[10px] font-mono px-3 py-1 rounded-md border ${
                      activeThemePresetSection === "visual"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 bg-card/50 text-muted-foreground"
                    }`}
                  >
                    visual fx
                  </button>
                </div>

                {activeThemePresetSection === "library" && (
                  <>
                    <input
                      type="text"
                      value={themeSearch}
                      onChange={(e) => setThemeSearch(e.target.value)}
                      placeholder="Search themes..."
                      className="mb-2 w-full rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
                    />

                    <div className="mb-2 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setActivePresetThemeTab("all")}
                        className={`text-[10px] font-mono px-3 py-1 rounded-md border ${
                          activePresetThemeTab === "all"
                            ? "border-border bg-secondary text-foreground"
                            : "border-border/60 bg-card/50 text-muted-foreground"
                        }`}
                      >
                        all
                      </button>
                      <button
                        onClick={() => setActivePresetThemeTab("animated")}
                        className={`text-[10px] font-mono px-3 py-1 rounded-md border ${
                          activePresetThemeTab === "animated"
                            ? "border-border bg-secondary text-foreground"
                            : "border-border/60 bg-card/50 text-muted-foreground"
                        }`}
                      >
                        animated ({animatedThemePresetNames.length})
                      </button>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto rounded-md border border-border/60 bg-black/30 p-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                        <button
                          onClick={() => setThemePreset(DEFAULT_THEME_PRESET)}
                          className={`h-7 rounded-[4px] border text-[10px] font-mono px-2 text-left transition-all ${
                            themePreset === DEFAULT_THEME_PRESET
                              ? "border-primary ring-1 ring-primary"
                              : "border-border/40"
                          }`}
                          style={{ backgroundColor: "#000000", color: "#e2b714" }}
                        >
                          default (space)
                        </button>

                        {filteredThemes.map((theme) => (
                          <div key={theme.name} className="h-7 rounded-[4px] border border-border/30 flex items-center overflow-hidden">
                            <button
                              onClick={() => setThemePreset(theme.name)}
                              className={`h-full flex-1 text-[10px] font-mono px-2 text-left transition-all ${
                                themePreset === theme.name
                                  ? "ring-1 ring-primary"
                                  : ""
                              }`}
                              style={{
                                backgroundColor: theme.bg,
                                color: theme.main,
                              }}
                              title={theme.name.replace(/_/g, " ")}
                            >
                              <span className="inline-flex w-full items-center justify-between gap-1">
                                <span className="truncate">{theme.name.replace(/_/g, " ")}</span>
                                <span className="inline-flex items-center gap-0.5">
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.main }} />
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.sub }} />
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.text }} />
                                </span>
                              </span>
                            </button>
                            <button
                              onClick={() => toggleFavoriteTheme(theme.name)}
                              className={`h-full w-7 text-[11px] font-mono border-l ${
                                favoriteThemeNames.includes(theme.name)
                                  ? "border-primary/60 text-primary bg-primary/10"
                                  : "border-border/50 text-muted-foreground bg-card/40"
                              }`}
                              title={favoriteThemeNames.includes(theme.name) ? "Unfavorite" : "Favorite"}
                            >
                              {favoriteThemeNames.includes(theme.name) ? "★" : "☆"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {activeThemePresetSection === "randomize" && (
                  <div className="mb-2 rounded-md border border-border/60 bg-card/40 p-2 space-y-2">
                    <label className="text-[10px] font-mono text-muted-foreground block">Randomize Theme (after completing a word)</label>
                    <select
                      value={randomizeThemeMode}
                      onChange={(e) => setRandomizeThemeMode(e.target.value as RandomizeThemeMode)}
                      className="w-full rounded-md border border-border bg-card/60 px-2 py-1.5 text-xs text-foreground"
                    >
                      <option value="off">off</option>
                      <option value="favorite">favorite</option>
                      <option value="light">light</option>
                      <option value="dark">dark</option>
                      <option value="auto">auto</option>
                      <option value="custom">custom</option>
                    </select>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      After completing a word, the theme will be set to a random one. The random themes are not saved to your config. If set to favorite, only favorite themes will be randomized. If set to light or dark, only presets with light or dark background colors will be randomized, respectively. If set to auto, dark or light themes are used depending on your system theme. If set to custom, custom themes will be randomized.
                    </p>
                    <p className="text-[10px] text-muted-foreground">Current mode: {randomizeThemeMode} • Favorites saved: {favoriteThemeNames.length}</p>
                  </div>
                )}

                {activeThemePresetSection === "visual" && (
                  <div className="mb-2 rounded-md border border-border/60 bg-card/40 p-2 space-y-2">
                    <p className="text-[10px] font-mono text-muted-foreground">Visual systems</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <button
                        onClick={() => setThemeEngineV2Enabled((previous) => !previous)}
                        className={`text-[10px] font-mono px-3 py-1.5 rounded-md border transition-colors ${
                          themeEngineV2Enabled
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 bg-card/50 text-muted-foreground"
                        }`}
                      >
                        Theme Engine 2.0: {themeEngineV2Enabled ? "on" : "off"}
                      </button>
                      <button
                        onClick={() => setHolographicUiLayerEnabled((previous) => !previous)}
                        className={`text-[10px] font-mono px-3 py-1.5 rounded-md border transition-colors ${
                          holographicUiLayerEnabled
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 bg-card/50 text-muted-foreground"
                        }`}
                      >
                        Holographic UI: {holographicUiLayerEnabled ? "on" : "off"}
                      </button>
                      <button
                        onClick={() => setDynamicEnvironmentEnabled((previous) => !previous)}
                        className={`text-[10px] font-mono px-3 py-1.5 rounded-md border transition-colors ${
                          dynamicEnvironmentEnabled
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 bg-card/50 text-muted-foreground"
                        }`}
                      >
                        Dynamic Environment: {dynamicEnvironmentEnabled ? "on" : "off"}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Theme Engine 2.0 intensifies ambient visual motion, Holographic UI adds glass/chromatic depth to interface panels, and Dynamic Environment tints the scene based on local time.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-md border border-border/60 bg-black/30 p-2 space-y-2">
                <p className="text-[10px] text-muted-foreground font-mono">Custom theme colors</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      ["bg", "Background"],
                      ["main", "Main"],
                      ["caret", "Caret"],
                      ["glow", "Glow"],
                      ["sub", "Sub"],
                      ["subAlt", "Sub Alt"],
                      ["text", "Text"],
                      ["error", "Error"],
                      ["errorExtra", "Error Extra"],
                      ["colorfulError", "Colorful Error"],
                      ["colorfulErrorExtra", "Colorful Error Extra"],
                    ] as [keyof CustomTheme, string][]
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                      <input
                        type="color"
                        value={customTheme[key]}
                        onChange={(e) => setCustomTheme((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="h-6 w-8 rounded border border-border bg-card/50"
                      />
                      <span className="truncate">{label}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => setThemePreset(CUSTOM_THEME_PRESET)}
                  className="text-[10px] font-mono px-3 py-1 rounded-md border border-primary/50 text-primary hover:bg-primary/10"
                >
                  Apply Custom Theme
                </button>
              </div>
            )}
          </div>
          )}

          {activeSettingsSection === "section-monetization" && (
          <div id="section-monetization" className="px-5 py-4 rounded-xl bg-card/40 border border-border/40">
            <div className="flex items-center gap-3 mb-3">
              <Gift size={16} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Referrals</p>
                <p className="text-[10px] text-muted-foreground">Share your code and redeem rewards</p>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-card/50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Gift size={14} className="text-primary" />
                <p className="text-xs font-mono text-muted-foreground">Referral Rewards</p>
              </div>
              <p className="mb-2 text-[10px] font-mono text-muted-foreground">Redeem a referral and both players get 10,000 XP.</p>

              <p className="mb-2 text-[10px] font-mono text-muted-foreground">Your level: {myLevel}</p>

              <label className="block text-[10px] text-muted-foreground font-mono mb-1">Your code</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={referralCode || ""}
                  readOnly
                  className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-xs font-mono text-foreground"
                  placeholder={user ? (referralCodeLoading ? "Loading..." : "No code available") : "Sign in to get a referral code"}
                />
                <button
                  onClick={handleCopyReferralCode}
                  disabled={!referralCode || referralCodeLoading}
                  className="px-3 py-2 rounded-md text-xs font-mono border border-border text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  Copy
                </button>
              </div>

              {myLevel > 50 && (
                <>
                  <label className="block text-[10px] text-muted-foreground font-mono mb-1">Custom code (level 51+)</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={customReferralCode}
                      onChange={(e) => setCustomReferralCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-xs font-mono text-foreground"
                      placeholder="Use A-Z, 0-9, _ (4-20 chars)"
                      maxLength={20}
                    />
                    <button
                      onClick={handleSetCustomReferralCode}
                      disabled={!user || customReferralLoading || customReferralCode.trim().length < 4}
                      className="px-3 py-2 rounded-md text-xs font-mono border border-primary/60 text-primary hover:bg-primary/10 disabled:opacity-50"
                    >
                      {customReferralLoading ? "Saving..." : "Set"}
                    </button>
                  </div>
                </>
              )}

              <label className="block text-[10px] text-muted-foreground font-mono mb-1">Redeem code</label>
              <div className="flex gap-2">
                <input
                  value={referralInput}
                  onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-xs font-mono text-foreground"
                  placeholder="Enter referral code"
                />
                <button
                  onClick={handleRedeemReferral}
                  disabled={!user || referralLoading || referralInput.trim().length === 0}
                  className="px-3 py-2 rounded-md text-xs font-mono border border-primary/60 text-primary hover:bg-primary/10 disabled:opacity-50"
                >
                  {referralLoading ? "Redeeming..." : "Redeem"}
                </button>
              </div>
              {referralMessage && <p className="mt-2 text-[10px] text-muted-foreground font-mono">{referralMessage}</p>}
            </div>
          </div>
          )}

          {activeSettingsSection === "section-caret" && (
          <div id="section-caret" className="px-5 py-4 rounded-xl bg-card/40 border border-border/40">
            <div className="flex items-center gap-3 mb-2">
              <TextCursorInput size={16} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Caret</p>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-[10px] font-mono text-muted-foreground mb-1">Style</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {([
                  ["default", "default"],
                  ["bar", "bar"],
                  ["block", "block"],
                  ["outline", "outline"],
                  ["underline", "underline"],
                  ["off", "off"],
                ] as [CaretStyle, string][]).map(([style, label]) => (
                  <button
                    key={style}
                    onClick={() => {
                      setCaretStyle(style);
                      setStoredCaretStyle(style);
                    }}
                    className={`text-[10px] font-mono px-2 py-1 rounded-md border transition-colors ${
                      caretStyle === style
                        ? "border-primary text-primary bg-primary/10"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-primary/60"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const next = !caretBlink;
                  setCaretBlink(next);
                  setStoredCaretBlink(next);
                }}
                className="flex items-center justify-between text-[10px] font-mono px-3 py-2 rounded-md border border-border/70 bg-card/50 hover:border-primary/60"
              >
                <span className="text-muted-foreground">Blinking</span>
                <span className={caretBlink ? "text-primary" : "text-muted-foreground"}>{caretBlink ? "ON" : "OFF"}</span>
              </button>

              <button
                onClick={() => {
                  const next = !caretSmooth;
                  setCaretSmooth(next);
                  setStoredCaretSmooth(next);
                }}
                className="flex items-center justify-between text-[10px] font-mono px-3 py-2 rounded-md border border-border/70 bg-card/50 hover:border-primary/60"
              >
                <span className="text-muted-foreground">Smooth</span>
                <span className={caretSmooth ? "text-primary" : "text-muted-foreground"}>{caretSmooth ? "ON" : "OFF"}</span>
              </button>
            </div>
          </div>
          )}

          {activeSettingsSection === "section-data" && (
          <>
          <div id="section-data" />
          <button
            onClick={handleResetGameplayDefaults}
            className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-card/40 border border-border/40 text-sm text-foreground hover:border-primary transition-colors"
          >
            <RotateCcw size={16} className="text-primary" />
            <div className="text-left flex-1">
              <p className="font-medium">Reset Gameplay Settings</p>
              <p className="text-[10px] text-muted-foreground">Restore gameplay mode, toggles, and delay defaults</p>
            </div>
          </button>

          <button
            onClick={handleResetAllSettings}
            className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-card/40 border border-border/40 text-sm text-foreground hover:border-primary transition-colors"
          >
            <RotateCcw size={16} className="text-primary" />
            <div className="text-left flex-1">
              <p className="font-medium">Reset All Local Settings</p>
              <p className="text-[10px] text-muted-foreground">Resets theme, audio, keyboard, modifiers, and gameplay settings</p>
            </div>
          </button>

          <button
            onClick={() => {
              setShowResetConfirmDialog(true);
            }}
            className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive hover:bg-destructive/20 transition-colors"
          >
            <RotateCcw size={16} />
            <div className="text-left flex-1">
              <p className="font-medium">Reset Statistics</p>
              <p className="text-[10px] text-destructive/70">Clear all saved stats</p>
            </div>
          </button>

          <AlertDialog open={showResetConfirmDialog} onOpenChange={setShowResetConfirmDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset statistics?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reset all statistics?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={closeResetDialogs}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setShowResetConfirmDialog(false);
                    setShowResetPhraseDialog(true);
                  }}
                >
                  Yes, continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showResetPhraseDialog} onOpenChange={setShowResetPhraseDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Type confirmation phrase</AlertDialogTitle>
                <AlertDialogDescription>
                  Type &quot;{RESET_STATS_PHRASE}&quot; exactly to continue.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={resetPhraseInput}
                onChange={(e) => setResetPhraseInput(e.target.value)}
                placeholder={RESET_STATS_PHRASE}
                autoFocus
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={closeResetDialogs}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={resetPhraseInput !== RESET_STATS_PHRASE}
                  onClick={() => {
                    setShowResetPhraseDialog(false);
                    setShowResetFinalDialog(true);
                  }}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showResetFinalDialog} onOpenChange={setShowResetFinalDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Final confirmation</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is irreversible and there is no way to ever get old stats back.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={resetIrreversibleAck}
                  onCheckedChange={(checked) => setResetIrreversibleAck(checked === true)}
                />
                <span>I agree this is irreversible and my old statistics cannot be recovered.</span>
              </label>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={closeResetDialogs}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={!resetIrreversibleAck}
                  onClick={() => {
                    localStorage.removeItem("spelldown-stats");
                    closeResetDialogs();
                  }}
                >
                  Permanently reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
