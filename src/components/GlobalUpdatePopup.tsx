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
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-extrabold font-mono text-primary text-glow tracking-tight">New update · {RELEASE_VERSION}</h2>
                <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-mono border border-border">Early Access</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground font-mono">Info: {RELEASE_VERSION}</p>
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
              Never show again ({RELEASE_VERSION})
            </button>
          </div>

          <div className="mt-3">
            <p className="text-sm font-semibold">Updates (Today & Yesterday)</p>
            <ul className="mt-2 space-y-2 text-sm text-foreground">
              <li>• Announcements system + admin CRUD with realtime delivery and static fallback.</li>
              <li>• Mobile UX: compact controls, reduced base font-size, and hidden reactive keymap on mobile.</li>
              <li>• Space theme remaster: new tokens, canvas visuals, and decorative SVG overlay.</li>
              <li>• Added funbox modifier "the_files" to visually block the input area for gameplay tests.</li>
              <li>• Fixed multiple TypeScript/JSX build errors and completed a clean production build.</li>
            </ul>

            <p className="mt-4 text-xs text-muted-foreground font-mono">Bug fixes</p>
            <ul className="mt-2 space-y-2 text-sm text-foreground">
              <li>• Resolved startup white/black-screen regressions and duplicate JSX parse errors.</li>
              <li>• Fixed canvas parse/duplicate variable issues in the background rendering code.</li>
              <li>• Announcements now show immediately to visitors and respect local dismissal state.</li>
              <li>• Mobile layout and focus/autofocus issues resolved for custom game modes.</li>
              <li>• General stability fixes across admin panels and game components from recent edits.</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default GlobalUpdatePopup;
