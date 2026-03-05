import { type ReactNode, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Trophy, User, Settings, Shield, Wrench, Info, LogIn, LogOut, CalendarDays } from "lucide-react";
import SpellingGame from "@/components/SpellingGame";
import CustomGame from "@/components/CustomGame";
import BeginnerGame from "@/components/BeginnerGame";
import NoviceGame from "@/components/NoviceGame";
import ModerateGame from "@/components/ModerateGame";
import GeniusGame from "@/components/GeniusGame";
import EasterThemeDecor from "@/components/EasterThemeDecor";
import CosmicBackground from "@/components/CosmicBackground";
import StarryBackground from "@/components/StarryBackground";
import InfoButton from "@/components/InfoButton";
import Intermission from "@/components/Intermission";
import Leaderboard from "@/components/Leaderboard";
import CustomSettings from "@/components/CustomSettings";
import ErrorBoundary from "@/components/ErrorBoundary";
import AdminPanel from "@/components/AdminPanel";
import MuteButton, { getMuted } from "@/components/MuteButton";
import FeedbackButton from "@/components/FeedbackButton";
import FeedbackInboxButton from "@/components/FeedbackInboxButton";
import { KeyboardLayout } from "@/components/KeyboardMap";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_THEME_PRESET, EASTER_THEME_NAME, getEffectiveThemePreset, RUNTIME_THEME_PRESET_KEY, THEME_CHANGED_EVENT } from "@/lib/theme";
import { applyFont, getFontPack } from "@/lib/fonts";
import { isOwnerUser } from "@/lib/roles";

const CHARG_KEY = "spelldown-charg-mode";
const KEYBIND_KEY = "spelldown-restart-keybind";
const LAYOUT_KEY = "spelldown-keyboard-layout";
const KEYMAP_SIZE_KEY = "spelldown-keymap-size";
const CUSTOM_WORDS_KEY = "spelldown-custom-words";
const GAME_MODE_KEY = "spelldown-game-mode";
const GAME_MODE_CHANGED_EVENT = "spelldown-game-mode-changed";
const INTERMISSION_SEEN_KEY = "spelldown-intermission-seen";

const isAnnouncementsMissingError = (error: unknown) => {
  const err = error as { code?: string; message?: string } | null;
  const message = (err?.message || "").toLowerCase();
  return err?.code === "PGRST205" || err?.code === "42P01" || (message.includes("announcements") && message.includes("schema cache"));
};

type GameMode = "master" | "custom" | "beginner" | "novice" | "moderate" | "genius";

interface QuickActionProps {
  label: string;
  children: ReactNode;
}

const QuickAction = ({ label, children }: QuickActionProps) => (
  <div className="inline-flex min-w-[46px] flex-col items-center justify-start gap-1">
    {children}
    <span
      className="text-[7px] leading-none font-mono text-muted-foreground whitespace-nowrap text-center select-none"
    >
      {label}
    </span>
  </div>
);

// GAME_MODE_LABELS removed — mode indicator consolidated into bottom dock

const Index = () => {
  const [chargMode, setChargMode] = useState(() => localStorage.getItem(CHARG_KEY) === "true");
  const [showIntermission, setShowIntermission] = useState(() => sessionStorage.getItem(INTERMISSION_SEEN_KEY) !== "true");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showCustomSettings, setShowCustomSettings] = useState(false);
  const [muted, setMuted] = useState(() => getMuted());
  const [activeSound, setActiveSound] = useState(() => localStorage.getItem("spelldown-active-sound") || "default");
  const [activeFont, setActiveFont] = useState(() => localStorage.getItem("spelldown-active-font") || "default");
  const [keyboardLayout, setKeyboardLayout] = useState<KeyboardLayout>(() => (localStorage.getItem(LAYOUT_KEY) as KeyboardLayout) || "qwerty");
  const [restartKeybind, setRestartKeybind] = useState(() => localStorage.getItem(KEYBIND_KEY) || "");
  const [isAdmin, setIsAdmin] = useState(false);
  const [restartTrigger, setRestartTrigger] = useState(0);
  const [keySize, setKeySize] = useState(() => {
    const v = Number(localStorage.getItem(KEYMAP_SIZE_KEY));
    return isNaN(v) ? 15 : v;
  });
  const [gameMode, setGameMode] = useState<GameMode>(() => {
    const storedMode = localStorage.getItem(GAME_MODE_KEY);
    return (storedMode as GameMode) || "master";
  });
  const [customWordsInput, setCustomWordsInput] = useState(() => localStorage.getItem(CUSTOM_WORDS_KEY) || "");
  const [activeAnnouncement, setActiveAnnouncement] = useState<string | null>(null);
  const [activeThemePreset, setActiveThemePreset] = useState(() => getEffectiveThemePreset());

  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  // Check admin role
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }

    if (isOwnerUser(user.id)) {
      setIsAdmin(true);
      return;
    }

    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").then(({ data }) => {
      setIsAdmin(!!(data && data.length > 0));
    });
  }, [user]);

  // Claim daily login on app load
  useEffect(() => {
    if (!user) return;
    supabase.rpc("claim_daily_login").then(() => {});
  }, [user]);

  useEffect(() => {
    const syncGameMode = () => {
      const storedMode = localStorage.getItem(GAME_MODE_KEY);
      const normalizedMode = storedMode === "impossible" ? "nightmare" : storedMode;
      const nextMode = (normalizedMode as GameMode) || "master";
      setGameMode((currentMode) => (currentMode === nextMode ? currentMode : nextMode));
    };

    window.addEventListener(GAME_MODE_CHANGED_EVENT, syncGameMode as EventListener);
    return () => window.removeEventListener(GAME_MODE_CHANGED_EVENT, syncGameMode as EventListener);
  }, []);

  useEffect(() => {
    if (!user) {
      setActiveSound(localStorage.getItem("spelldown-active-sound") || "default");
      setActiveFont("default");
      return;
    }

    const loadActiveCosmetics = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("active_sound, active_font")
        .eq("id", user.id)
        .single();

      if (error || !data) return;
      const row: any = data;
      setActiveSound(row.active_sound || "default");
      setActiveFont(row.active_font || "default");
      localStorage.setItem("spelldown-active-sound", row.active_sound || "default");
      localStorage.setItem("spelldown-active-font", row.active_font || "default");
    };

    loadActiveCosmetics();
  }, [user]);

  const fetchActiveAnnouncement = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("announcements")
        .select("message, created_at")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(25);

      if (error) {
        if (!isAnnouncementsMissingError(error)) {
          console.error("Error loading active announcement:", error);
        }
        setActiveAnnouncement(null);
        return;
      }

      // We don't require starts_at/ends_at scheduling in DB migration; show latest active announcement
      const latest = ((data ?? []) as Array<{ message?: string; created_at?: string }>)[0];
      setActiveAnnouncement(latest?.message && String(latest.message).trim() ? String(latest.message).trim() : null);
    } catch (error) {
      if (!isAnnouncementsMissingError(error)) {
        console.error("Exception loading active announcement:", error);
      }
      setActiveAnnouncement(null);
    }
  }, []);

  useEffect(() => {
    fetchActiveAnnouncement();
  }, [fetchActiveAnnouncement]);

  // Reduce base font size on mobile for compact UI
  useEffect(() => {
    if (isMobile) {
      document.documentElement.style.fontSize = "15px";
    } else {
      document.documentElement.style.fontSize = "";
    }
    return () => {
      document.documentElement.style.fontSize = "";
    };
  }, [isMobile]);


  useEffect(() => {
    sessionStorage.removeItem(RUNTIME_THEME_PRESET_KEY);
    setActiveThemePreset(getEffectiveThemePreset());
  }, []);

  useEffect(() => {
    const syncTheme = () => setActiveThemePreset(getEffectiveThemePreset());
    window.addEventListener("storage", syncTheme);
    window.addEventListener(THEME_CHANGED_EVENT, syncTheme as EventListener);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener(THEME_CHANGED_EVENT, syncTheme as EventListener);
    };
  }, []);

  const handleMuteToggle = (v: boolean) => {
    setMuted(v);
    localStorage.setItem("spelldown-muted", String(v));
  };

  useEffect(() => {
    applyFont(getFontPack(activeFont));
  }, [activeFont]);

  const handleCustomWordsChange = (words: string) => {
    setCustomWordsInput(words);
    localStorage.setItem(CUSTOM_WORDS_KEY, words);
  };

  // Parse custom words into WordEntry format
  const customWords = customWordsInput
    .split(",")
    .map(w => w.trim())
    .filter(w => w.length > 0)
    .map(w => ({ primary: w, alternates: [] }));

  const selectedTheme = (activeThemePreset || DEFAULT_THEME_PRESET).trim().toLowerCase().replace(/_/g, " ");
  const showSpaceBackground = selectedTheme === DEFAULT_THEME_PRESET;
  const showUltraBlackStars = selectedTheme === "ultra black";
  const showEasterGardenDecor = selectedTheme === EASTER_THEME_NAME;
  if (showIntermission) {
    return (
      <>
        {showEasterGardenDecor && <EasterThemeDecor />}
        {showSpaceBackground && <CosmicBackground />}
        {showUltraBlackStars && <StarryBackground />}
        <Intermission
          onComplete={() => {
            sessionStorage.setItem(INTERMISSION_SEEN_KEY, "true");
            setShowIntermission(false);
          }}
        />
      </>
    );
  }

  return (
    <>
      {showEasterGardenDecor && <EasterThemeDecor />}
      {/* legacy inline announcement removed — use global AnnouncementBar component */}
      {showSpaceBackground && <CosmicBackground />}
      {showUltraBlackStars && <StarryBackground />}

      {/* Top-left mode indicator and top-right dock removed — consolidated into bottom dock */}

      {gameMode === "custom" && customWords.length > 0 ? (
        <CustomGame
          key={restartTrigger}
          customWords={customWords}
          userId={user?.id}
          activeSound={activeSound}
          activeFont={activeFont}
          keyboardLayout={keyboardLayout}
          keySize={keySize}
          restartKeybind={restartKeybind}
        />
      ) : gameMode === "beginner" ? (
        <BeginnerGame
          key={restartTrigger}
          userId={user?.id}
          activeSound={activeSound}
          activeFont={activeFont}
          keyboardLayout={keyboardLayout}
          keySize={keySize}
          restartKeybind={restartKeybind}
        />
      ) : gameMode === "novice" ? (
        <NoviceGame
          key={restartTrigger}
          userId={user?.id}
          activeSound={activeSound}
          activeFont={activeFont}
          keyboardLayout={keyboardLayout}
          keySize={keySize}
          restartKeybind={restartKeybind}
        />
      ) : gameMode === "moderate" ? (
        <ModerateGame
          key={restartTrigger}
          userId={user?.id}
          activeSound={activeSound}
          activeFont={activeFont}
          keyboardLayout={keyboardLayout}
          keySize={keySize}
          restartKeybind={restartKeybind}
        />
      ) : gameMode === "genius" ? (
        <GeniusGame
          key={restartTrigger}
          userId={user?.id}
          activeSound={activeSound}
          activeFont={activeFont}
          keyboardLayout={keyboardLayout}
          keySize={keySize}
          restartKeybind={restartKeybind}
        />
      ) : (
        <SpellingGame
          key={restartTrigger}
          chargMode={chargMode}
          userId={user?.id}
          activeSound={activeSound}
          activeFont={activeFont}
          keyboardLayout={keyboardLayout}
          keySize={keySize}
          restartKeybind={restartKeybind}
        />
      )}

      {isMobile && (
        <div className="fixed top-4 right-3 z-30 flex items-center gap-2">
          {user ? (
            <>
              <button
                onClick={() => navigate("/dashboard", { state: { backgroundLocation: location } })}
                className="p-2 rounded-lg bg-card/60 border border-border text-muted-foreground hover:text-primary transition-colors"
                title="Dashboard"
              >
                <User size={16} />
              </button>
              <button
                onClick={() => navigate("/settings", { state: { backgroundLocation: location } })}
                className="p-2 rounded-lg bg-card/60 border border-border text-muted-foreground hover:text-primary transition-colors"
                title="Settings"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={signOut}
                className="p-2 rounded-lg bg-card/60 border border-border text-muted-foreground hover:text-primary transition-colors"
                title="Sign Out"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="p-2 rounded-lg bg-card/60 border border-border text-muted-foreground hover:text-primary transition-colors"
              title="Sign In"
              aria-label="Sign in"
            >
              <LogIn size={16} />
            </button>
          )}

          <InfoButton inline />
        </div>
      )}

      {isMobile ? null : (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20 group">
          <div className="flex flex-col items-center pointer-events-none">
          {/* Gesture bar — visible as a thin rounded line; hover the area to reveal dock */}
          <div className="mb-2 pointer-events-auto">
            <div
              className="w-24 h-1.5 rounded-full bg-border/40 transition-colors duration-200 ease-out hover:bg-border/60"
              aria-hidden
            />
          </div>

          <div className="dock-shell rounded-[26px] border border-white/25 bg-card/45 backdrop-blur-xl px-3 py-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.25)] transform transition-all duration-300 ease-out translate-y-4 opacity-0 pointer-events-none group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <QuickAction label="Post">
                  <FeedbackButton userId={user?.id} inline />
                </QuickAction>
                <QuickAction label="Board">
                  <FeedbackInboxButton isAdmin={isAdmin} inline />
                </QuickAction>
              </div>

              <div className="w-px h-6 bg-border/40" />

              <div className="flex items-center gap-2 flex-wrap justify-center max-w-[78vw] sm:max-w-none">
                <QuickAction label="Info">
                  <InfoButton inline />
                </QuickAction>
                <QuickAction label="Leaders">
                  <button
                    onClick={() => setShowLeaderboard(true)}
                    className="dock-button p-2 rounded-full bg-card/55 border border-white/20 text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors"
                    title="Leaderboard"
                  >
                    <Trophy size={16} />
                  </button>
                </QuickAction>
                <QuickAction label="Settings">
                  <button
                    onClick={() => navigate("/settings", { state: { backgroundLocation: location } })}
                    className="dock-button p-2 rounded-full bg-card/55 border border-white/20 text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors"
                    title="Settings"
                  >
                    <Settings size={16} />
                  </button>
                </QuickAction>
                <QuickAction label="Pass">
                  <button
                    onClick={() => navigate("/pass", { state: { backgroundLocation: location } })}
                    className="dock-button p-2 rounded-full bg-card/55 border border-white/20 text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors"
                    title="Season Pass"
                  >
                    <CalendarDays size={16} />
                  </button>
                </QuickAction>
                {gameMode === "custom" && (
                  <QuickAction label="Custom">
                    <button
                      onClick={() => setShowCustomSettings(true)}
                      className="dock-button p-2 rounded-full bg-primary/18 border border-primary/45 text-primary hover:bg-primary/28 hover:border-primary/65 transition-colors"
                      title="Custom Settings"
                    >
                      <Wrench size={16} />
                    </button>
                  </QuickAction>
                )}
                <QuickAction label="Sound">
                  <MuteButton muted={muted} onToggle={handleMuteToggle} />
                </QuickAction>
              </div>

              <div className="w-px h-6 bg-border/40" />

              <div className="flex items-center gap-2">
                {user ? (
                  <>
                    <button
                      onClick={() => navigate("/dashboard", { state: { backgroundLocation: location } })}
                      className="dock-button p-2 rounded-full bg-card/55 border border-white/20 text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors"
                      title="Profile"
                    >
                      <User size={16} />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setShowAdmin(true)}
                        className="dock-button p-2 rounded-full bg-card/55 border border-white/20 text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors"
                        title="Admin Panel"
                      >
                        <Shield size={16} />
                      </button>
                    )}
                    <button
                      onClick={signOut}
                      className="dock-button p-2 rounded-full bg-card/55 border border-white/20 text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors"
                      title="Sign Out"
                      aria-label="Sign out"
                    >
                      <LogOut size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate("/auth")}
                    className="dock-button p-2 rounded-full bg-card/55 border border-white/20 text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors"
                    title="Sign In"
                    aria-label="Sign in"
                  >
                    <LogIn size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      <Leaderboard open={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <ErrorBoundary>
        <CustomSettings
          open={showCustomSettings}
          onClose={() => setShowCustomSettings(false)}
          customWordsInput={customWordsInput}
          onCustomWordsChange={handleCustomWordsChange}
        />
      </ErrorBoundary>
      {isAdmin && (
        <AdminPanel
          open={showAdmin}
          onClose={() => setShowAdmin(false)}
          canManageRoles={isAdmin}
          currentUserId={user?.id}
        />
      )}
    </>
  );
};

export default Index;
