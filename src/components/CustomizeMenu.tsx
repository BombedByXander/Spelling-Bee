import { useState, useEffect } from "react";
import { X, Keyboard, Zap, Volume2, Zap as ZapIcon, Globe, RotateCcw } from "lucide-react";
import { KeyboardLayout } from "@/components/KeyboardMap";

interface Props {
  open: boolean;
  onClose: () => void;
  restartKeybind: string;
  onKeybindChange: (keybind: string) => void;
  onRestart: () => void;
  chargMode: boolean;
  onChargToggle: (v: boolean) => void;
  keyboardLayout: KeyboardLayout;
  onKeyboardLayoutChange: (layout: KeyboardLayout) => void;
  keySize: number;
  onKeySizeChange: (size: number) => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  isDarkTheme: boolean;
  onThemeToggle: (dark: boolean) => void;
}

const KEYBIND_KEY = "spelldown-restart-keybind";
const LAYOUT_KEY = "spelldown-keyboard-layout";
const KEYMAP_SIZE_KEY = "spelldown-keymap-size";
const VOLUME_KEY = "spelldown-volume";
const THEME_KEY = "spelldown-theme";

const KEYBOARD_LAYOUTS: { label: string; value: KeyboardLayout }[] = [
  { label: "QWERTY", value: "qwerty" },
  { label: "AZERTY", value: "azerty" },
  { label: "Dvorak", value: "dvorak" },
  { label: "Colemak", value: "colemak" },
];

const CustomizeMenu = ({ open, onClose, restartKeybind, onKeybindChange, onRestart, chargMode, onChargToggle, keyboardLayout, onKeyboardLayoutChange, keySize, onKeySizeChange, volume, onVolumeChange, isDarkTheme, onThemeToggle }: Props) => {
  const [recording, setRecording] = useState(false);

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
        onKeybindChange(combo);
        localStorage.setItem(KEYBIND_KEY, combo);
        setRecording(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [recording, onKeybindChange]);

  const handleLayoutChange = (layout: KeyboardLayout) => {
    onKeyboardLayoutChange(layout);
    localStorage.setItem(LAYOUT_KEY, layout);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm mx-4 rounded-2xl bg-card/95 border border-border backdrop-blur-md overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-extrabold font-mono text-primary text-glow tracking-tight">Customize</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl">×</button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          {/* Keyboard Layout */}
          <div className="px-4 py-3 rounded-xl bg-card/40 border border-border/40">
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
                  onClick={() => handleLayoutChange(layout.value)}
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

          {/* Keyboard Size */}
          <div className="px-4 py-3 rounded-xl bg-card/40 border border-border/40">
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
                onChange={e => {
                  const v = Number(e.target.value);
                  onKeySizeChange(v);
                  localStorage.setItem(KEYMAP_SIZE_KEY, String(v));
                }}
                className="flex-1"
              />
              <span className="text-xs font-mono">{keySize}px</span>
            </div>
          </div>

          {/* Restart Keybind */}
          <div className="px-4 py-3 rounded-xl bg-card/40 border border-border/40">
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
                  onClick={() => { onKeybindChange(""); localStorage.removeItem(KEYBIND_KEY); }}
                  className="text-[10px] text-destructive hover:text-destructive/80"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Charg Mode */}
          <button
            onClick={() => onChargToggle(!chargMode)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-card/40 border border-border/40 text-sm text-foreground hover:border-primary transition-colors"
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

          {/* Volume Control */}
          <div className="px-4 py-3 rounded-xl bg-card/40 border border-border/40">
            <div className="flex items-center gap-3 mb-2">
              <Volume2 size={16} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Master Volume</p>
                <p className="text-[10px] text-muted-foreground">0 = mute</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={e => {
                  const v = Number(e.target.value);
                  onVolumeChange(v);
                  localStorage.setItem(VOLUME_KEY, String(v));
                }}
                className="flex-1"
              />
              <span className="text-xs font-mono">{Math.round(volume * 100)}%</span>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => {
              const newTheme = !isDarkTheme;
              onThemeToggle(newTheme);
              localStorage.setItem(THEME_KEY, String(newTheme));
              const root = document.documentElement;
              if (newTheme) {
                root.classList.remove("light");
                root.classList.add("dark");
              } else {
                root.classList.remove("dark");
                root.classList.add("light");
              }
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-card/40 border border-border/40 text-sm text-foreground hover:border-primary transition-colors"
          >
            <Globe size={16} className="text-primary" />
            <div className="text-left flex-1">
              <p className="font-medium">Theme</p>
              <p className="text-[10px] text-muted-foreground">Dark or light mode</p>
            </div>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${isDarkTheme ? "bg-primary/20 text-primary" : "bg-card/60 text-muted-foreground"}`}>
              {isDarkTheme ? "Dark" : "Light"}
            </span>
          </button>

          {/* Reset Statistics */}
          <button
            onClick={() => {
              if (confirm("Reset all statistics? This cannot be undone.")) {
                localStorage.removeItem("spelldown-stats");
                alert("Statistics reset!");
              }
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive hover:bg-destructive/20 transition-colors"
          >
            <RotateCcw size={16} />
            <div className="text-left flex-1">
              <p className="font-medium">Reset Statistics</p>
              <p className="text-[10px] text-destructive/70">Clear all saved stats</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizeMenu;
