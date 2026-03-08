import { useState } from "react";
import { RELEASE_VERSION } from "../lib/release";
import { Info, X } from "lucide-react";
import { createPortal } from "react-dom";

const DISCORD_URL = "https://discord.gg/Eb8ga2ZuqM";
const TIKTOK_URL = "https://www.tiktok.com/@creepsinthecloset";
const GITHUB_URL = "https://github.com/BombedByXander";

const DiscordIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
  </svg>
);

const TikTokIcon = ({ size = 16 }: { size?: number }) => (
  <img
    src={`https://cdn.simpleicons.org/tiktok/ffffff`}
    alt="TikTok"
    width={size}
    height={size}
    style={{ display: "inline-block" }}
  />
);

const GitHubIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.16 6.84 9.49.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.61-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1.01.07 1.54 1.04 1.54 1.04.9 1.54 2.36 1.1 2.94.84.09-.65.35-1.1.63-1.35-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0112 6.8c.85.004 1.71.115 2.51.34 1.9-1.29 2.74-1.02 2.74-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85 0 1.33-.01 2.4-.01 2.73 0 .26.18.58.69.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z" />
  </svg>
);

interface Props {
  inline?: boolean;
}

const InfoButton = ({ inline }: Props) => {
  const [open, setOpen] = useState(false);

  const modal = open ? (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/70 backdrop-blur-sm" onClick={() => { setOpen(false); }}>
      <div
        className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => { setOpen(false); }}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>

        <div className="mb-6">
          <h3 className="text-2xl font-extrabold font-mono text-primary text-glow tracking-tight mb-3">Credits</h3>
          <div className="bg-gradient-to-r from-primary/20 to-transparent p-4 rounded-xl border border-primary/30 space-y-4">
            {[
              {
                name: "@xanderisontop",
                roles: ["Founder", "Scripter", "Designer", "Bug Fixer","UX Designer", "UI Designer"],
                note: "on Discord",
              },
              {
                name: "@jaco66666666",
                roles: ["Co-Founder", "Bug Finder", "Support Member", "Developer"],
                note: "on Discord",
              },
            ].map((c) => (
              <div key={c.name} className="relative">
                <p className="text-xs font-mono text-primary/80 mb-1">{c.roles.join(", ")}</p>
                <p className="text-lg font-bold text-primary">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">{c.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-muted-foreground font-mono text-center">v26.2</p>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex flex-col gap-3">
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full bg-gradient-to-r from-[hsl(235_86%_65%)] to-[hsl(235_76%_55%)] text-white font-semibold text-sm hover:from-[hsl(235_86%_75%)] hover:to-[hsl(235_76%_65%)] transition-all transform hover:scale-105"
            >
              <DiscordIcon size={18} />
              Join Our Discord
            </a>

            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full bg-black text-white font-semibold text-sm hover:opacity-95 transition-all transform hover:scale-105"
            >
              <TikTokIcon size={18} />
              Follow on TikTok
            </a>

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full bg-[#24292f] text-white font-semibold text-sm hover:opacity-95 transition-all transform hover:scale-105"
            >
              <GitHubIcon size={18} />
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`${inline ? "" : "fixed bottom-5 right-5 z-20 "}p-2 rounded-full bg-card/60 border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors`}
        aria-label="Info"
      >
        <Info size={16} />
      </button>
      {typeof document !== "undefined" && modal ? createPortal(modal, document.body) : null}
    </>
  );
};

export default InfoButton;
