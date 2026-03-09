import { useEffect, useState } from "react";

const DEPLOYED_ASSET_REGEX = /src=["'](\/assets\/index-[^"']+\.js)["']/i;
const REFRESH_CONFETTI_COLORS = [
  "hsl(349 89% 60%)",
  "hsl(42 100% 62%)",
  "hsl(163 74% 48%)",
  "hsl(221 83% 58%)",
  "hsl(280 86% 69%)",
];

const REFRESH_CONFETTI_PARTICLES = Array.from({ length: 34 }, (_, index) => ({
  id: index,
  left: ((index * 17) % 100) + 1,
  size: 5 + (index % 4),
  delay: (index % 12) * 0.19,
  duration: 3.6 + (index % 7) * 0.42,
  drift: (index % 2 === 0 ? 1 : -1) * (7 + (index % 6) * 3),
  rotation: (index % 2 === 0 ? 1 : -1) * (150 + (index % 8) * 22),
  color: REFRESH_CONFETTI_COLORS[index % REFRESH_CONFETTI_COLORS.length],
}));

const GlobalRefreshNotice = () => {
  const [showRefreshNotice, setShowRefreshNotice] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const previewParam = new URLSearchParams(window.location.search).get("previewUpdateNotice");
    if (previewParam === "1") {
      setShowRefreshNotice(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentAsset = Array.from(document.querySelectorAll<HTMLScriptElement>("script[src]"))
      .map((script) => script.getAttribute("src") || "")
      .find((src) => /\/assets\/index-[^/]+\.js$/i.test(src));

    if (!currentAsset) return;

    let disposed = false;

    const checkForUpdate = async () => {
      try {
        const response = await fetch("/", { cache: "no-store" });
        const html = await response.text();
        const latestAsset = html.match(DEPLOYED_ASSET_REGEX)?.[1];
        if (!latestAsset || disposed) return;
        if (latestAsset !== currentAsset) {
          setShowRefreshNotice(true);
        }
      } catch {
        // Ignore network errors; will retry on next poll/visibility change.
      }
    };

    void checkForUpdate();
    const intervalId = window.setInterval(checkForUpdate, 120000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkForUpdate();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (!showRefreshNotice) return null;

  return (
    <>
      <div className="update-confetti-wrap" aria-hidden="true">
        {REFRESH_CONFETTI_PARTICLES.map((particle) => (
          <span
            key={particle.id}
            className="update-confetti-piece"
            style={{
              left: `${particle.left}%`,
              width: `${particle.size}px`,
              height: `${particle.size * 1.9}px`,
              animationDelay: `-${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              background: particle.color,
              ["--confetti-drift" as string]: `${particle.drift}px`,
              ["--confetti-rotation" as string]: `${particle.rotation}deg`,
            }}
          />
        ))}
      </div>
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,560px)] rounded-xl border border-primary/60 bg-card/95 px-3 py-2 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-mono text-foreground">There is an update! Refresh the page to see these updates.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-2.5 py-1 rounded-md font-mono text-[11px] font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Refresh
          </button>
        </div>
      </div>
    </>
  );
};

export default GlobalRefreshNotice;
