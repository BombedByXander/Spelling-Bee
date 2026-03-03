import { Volume2, VolumeX } from "lucide-react";

const MUTE_KEY = "spelldown-muted";

export function getMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === "true";
}

export function setMuted(v: boolean) {
  localStorage.setItem(MUTE_KEY, String(v));
}

const MuteButton = ({ muted, onToggle }: { muted: boolean; onToggle: (v: boolean) => void }) => (
  <button
    onClick={() => onToggle(!muted)}
    className="p-2 rounded-full bg-card/60 border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors duration-200"
    title={muted ? "Unmute" : "Mute"}
  >
    {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
  </button>
);

export default MuteButton;
