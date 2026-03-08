import { useEffect, useMemo, useState } from "react";
import { RELEASE_VERSION, UPDATE_POPUP_NEVER_KEY, UPDATE_POPUP_SESSION_DISMISSED_KEY } from "@/lib/release";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

const GlobalUpdatePopup = () => {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);

  const popupScopeKey = useMemo(() => user?.id || "guest", [user?.id]);
  const neverKey = `${UPDATE_POPUP_NEVER_KEY}-${popupScopeKey}`;
  const dismissedSessionKey = `${UPDATE_POPUP_SESSION_DISMISSED_KEY}-${popupScopeKey}`;

  useEffect(() => {
    if (loading) return;
    setShowUpdatePopup(
      localStorage.getItem(neverKey) !== "true" &&
      sessionStorage.getItem(dismissedSessionKey) !== "true"
    );
  }, [dismissedSessionKey, loading, neverKey]);

  // Hide the global update popup on mobile devices to avoid covering the entire viewport
  if (isMobile) return null;

  if (!showUpdatePopup) return null;

  return (
    <>
      <div className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm" />
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 w-[min(94vw,760px)] rounded-2xl border border-border bg-card/95 px-4 py-4 shadow-2xl backdrop-blur-sm">
        <div className="max-h-[72vh] overflow-y-auto pr-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold font-mono text-primary text-glow tracking-tight">New update · v26.2</h2>
              <p className="mt-1 text-[10px] text-muted-foreground font-mono italic">"Why the huge version jump", you may be asking — it's sorta inspired by iOS, the year 2026 (isolated to 26) and the update.</p>
              <p className="mt-1 text-xs text-muted-foreground font-mono">Important changes:</p>
            </div>
            <button
              onClick={() => {
                sessionStorage.setItem(dismissedSessionKey, "true");
                setShowUpdatePopup(false);
              }}
              className="px-2 py-1 rounded-full font-mono text-[10px] border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            >
              Close
            </button>
          </div>

          {/* Versioning explanation removed per request; only the version label is shown */}

            <div className="mt-3 mb-2">
            <button
              onClick={() => {
                localStorage.setItem(neverKey, "true");
                sessionStorage.setItem(dismissedSessionKey, "true");
                setShowUpdatePopup(false);
              }}
                className="px-2 py-1 rounded-full font-mono text-[10px] border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            >
                Don't show again
            </button>
          </div>

          <ul className="mt-3 space-y-2 text-sm text-foreground">
            <li>• Leaderboard is now a Top 50 all time Highest Streak.</li>
            <li>• .GIF file types now supported for profile pictures.</li>
            <li>• Added Profile Picture cropping & panning.</li>
            <li>• Mobile support is now added for the site. </li>
            <li>• Mobile now has a built-in keyboard.</li>
            <li>• Dock has more simple captions and size is improved.</li>
          </ul>

          <p className="mt-4 text-xs text-muted-foreground font-mono">Bug fixes:</p>
          <ul className="mt-2 space-y-2 text-sm text-foreground">
            <li>• Profile picture images not showing.</li>
            <li>• TikTok logo not displaying correctly.</li>
            <li>• Other minor bug fixes and improvements.</li>
            <li>• Optimization Tweaks and performance improvements.</li>

          </ul>
        </div>
      </div>
    </>
  );
};

export default GlobalUpdatePopup;
