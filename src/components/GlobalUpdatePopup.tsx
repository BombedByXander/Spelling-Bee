import { useEffect, useMemo, useState } from "react";
import { RELEASE_VERSION, UPDATE_POPUP_NEVER_KEY, UPDATE_POPUP_SESSION_DISMISSED_KEY } from "@/lib/release";
import { useAuth } from "@/hooks/useAuth";

const GlobalUpdatePopup = () => {
  const { user, loading } = useAuth();
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

  if (!showUpdatePopup) return null;

  return (
    <>
      <div className="fixed inset-0 z-30 bg-background" />
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 w-[min(94vw,760px)] rounded-2xl border border-border bg-card/95 px-4 py-4 shadow-2xl backdrop-blur-sm">
        <div className="max-h-[72vh] overflow-y-auto pr-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold font-mono text-primary text-glow tracking-tight">New update · v26.1</h2>
              <p className="mt-1 text-[10px] text-muted-foreground font-mono italic">"Why the huge version jump", you may be asking — it's sorta inspired by iOS, the year 2026 (isolated to 26) and the update.</p>
              <p className="mt-1 text-xs text-muted-foreground font-mono">Important changes:</p>
            </div>
            <button
              onClick={() => {
                sessionStorage.setItem(dismissedSessionKey, "true");
                setShowUpdatePopup(false);
              }}
              className="px-2 py-1 rounded-md font-mono text-[10px] border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
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
                className="px-2 py-1 rounded-md font-mono text-[10px] border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            >
                Never show again (v26.1)
            </button>
          </div>

          <ul className="mt-3 space-y-2 text-sm text-foreground">
            <li>• New AnnouncementBar: instant site announcements (fetch-on-mount, realtime updates, local dismissal).</li>
            <li>• Static fallback for announcements via `/announcement.json` with fast polling for static deployments.</li>
            <li>• Announcement styling improvements: centered text, pop-in/out animation, larger dismiss button, and higher z-index.</li>
            <li>• Theme Engine 2.0 added for stronger ambient gradients, glow intensity, and motion depth.</li>
            <li>• Added Holographic UI Layer toggle for glass/chromatic panel styling.</li>
            <li>• Added Dynamic Environment toggle that tints the game based on your local time of day.</li>
            <li>• Referral rewards increased: both players now earn 10,000 XP per valid redeem.</li>
            <li>• Added Easter Garden theme visuals plus secret bunny-bounce word effect toggle.</li>
            <li>• Added monkeytype-style Randomize Theme modes that rotate after each completed word.</li>
            <li>• Added gameplay toggle: Auto Enter on Exact Length.</li>
            <li>• Added global refresh/update visibility improvements for all users.</li>
            <li>• Added custom game mode reliability and autofocus fixes.</li>
            <li>• Added live admin client-side streak override control.</li>
            <li>• Added Nightmare+ mode and difficulty naming migration (Impossible → Nightmare).</li>
            <li>• Added new streak visuals with expanded tier progression and stronger color transitions.</li>
            <li>• Main HUD redesigned with minimal liquid-glass dock styling.</li>
          </ul>

          <p className="mt-4 text-xs text-muted-foreground font-mono">Bug fixes:</p>
          <ul className="mt-2 space-y-2 text-sm text-foreground">
            <li>• Fixed a startup white-screen regression caused by a stray visual component.</li>
            <li>• Announcements now appear for visitors without a page refresh and respect local dismissal state.</li>
            <li>• Mobile UX improvements: condensed control bar and reduced base font-size on mobile for compact layout.</li>
            <li>• Reactive keymap now hides on mobile to reduce clutter.</li>
            <li>• Live feedback now correctly matches all active modifiers across all game modes.</li>
            <li>• WPM now uses monkeytype-style net calculation so typing errors lower reported speed.</li>
            <li>• Clan creation now enforces 4-letter max clan tags.</li>
            <li>• Homophone validation no longer incorrectly breaks streaks on accepted spellings.</li>
            <li>• Settings/Profile overlay no longer resets active streak state.</li>
            <li>• Round transition delay now supports full range down to 0ms.</li>
            <li>• Salvia now splits words at randomized points (not fixed midpoint).</li>
            <li>• Nightmare+ pool now contains only the Lopado word as requested.</li>
            <li>• Profile trends/history section removed for cleaner dashboard UX.</li>
            <li>• Index startup black-screen regression resolved after layout redesign.</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default GlobalUpdatePopup;
