import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ACHIEVEMENT_DEFS } from "@/lib/achievements";

type Toast = { id: string; name: string; description: string; icon?: string };

const AchievementToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (e: any) => {
      const slug = e?.detail?.slug as string | undefined;
      if (!slug) return;
      const def = ACHIEVEMENT_DEFS.find((d) => d.slug === slug);
      const toast = {
        id: `${slug}-${Date.now()}`,
        name: def?.name || slug,
        description: def?.description || "Achievement unlocked",
        icon: def?.icon,
      } as Toast;
      setToasts((prev) => [...prev.slice(-2), toast]);
      // auto-dismiss
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 4000);
    };

    window.addEventListener("achievement:unlocked", handler as EventListener);
    return () => window.removeEventListener("achievement:unlocked", handler as EventListener);
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="flex items-center gap-3 rounded-md bg-card/90 border border-border px-3 py-2 shadow-md">
          <div className="text-2xl">{t.icon || "🏅"}</div>
          <div className="text-xs">
            <div className="font-bold text-foreground">{t.name}</div>
            <div className="text-muted-foreground">{t.description}</div>
          </div>
        </div>
      ))}
    </div>,
    document.body
  );
};

export default AchievementToast;
