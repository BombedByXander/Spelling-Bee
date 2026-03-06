import { useState } from "react";
import { RELEASE_VERSION } from "../lib/release";
import { Info, X } from "lucide-react";
import { createPortal } from "react-dom";

const DISCORD_URL = "https://discord.gg/Eb8ga2ZuqM";

const DiscordIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
  </svg>
);

interface Props {
  inline?: boolean;
}

const InfoButton = ({ inline }: Props) => {
  const [open, setOpen] = useState(false);

  const modal = open ? (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>

        <div className="mb-6">
          <h3 className="text-2xl font-extrabold font-mono text-primary text-glow tracking-tight mb-3">Credits</h3>
          <div className="bg-gradient-to-r from-primary/20 to-transparent p-4 rounded-xl border border-primary/30 space-y-4">
            <div>
              <p className="text-xs font-mono text-primary/80 mb-1">Founder, Scripter & Designer</p>
              <p className="text-lg font-bold text-primary">@xanderisontop</p>
              <p className="text-[10px] text-muted-foreground">on Discord</p>
            </div>
            <div>
              <p className="text-xs font-mono text-primary/80 mb-1">Co-Founder & Bug Tester</p>
              <p className="text-lg font-bold text-primary">@jaco66666666</p>
              <p className="text-[10px] text-muted-foreground">on Discord</p>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-muted-foreground font-mono text-center">v26.1</p>
          <p className="mt-1 text-[10px] text-muted-foreground font-mono text-center italic">"Why the huge version jump", you may be asking — it's sorta inspired by iOS, the year 2026 (isolated to 26) and the update.</p>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full bg-gradient-to-r from-[hsl(235_86%_65%)] to-[hsl(235_76%_55%)] text-white font-semibold text-sm hover:from-[hsl(235_86%_75%)] hover:to-[hsl(235_76%_65%)] transition-all transform hover:scale-105"
          >
            <DiscordIcon size={18} />
            Join Our Discord
          </a>
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
