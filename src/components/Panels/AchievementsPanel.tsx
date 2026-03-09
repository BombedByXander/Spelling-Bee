import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ACHIEVEMENT_DEFS } from "@/lib/achievements";

const AchievementsPanel = ({ userId }: { userId: string }) => {
  const [unlocked, setUnlocked] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at, achievements(name, slug)")
        .eq("user_id", userId);
      if (error) {
        setLoading(false);
        return;
      }
      const map: Record<string, string> = {};
      (data ?? []).forEach((row) => {
        const r = row as Record<string, unknown>;
        const achievements = r["achievements"] as Record<string, unknown> | undefined | null;
        const slug = (achievements && typeof achievements["slug"] === "string" ? String(achievements["slug"]) : null) ||
          (typeof r["achievement_id"] === "string" ? String(r["achievement_id"]) : null);
        const at = r["unlocked_at"] ? String(r["unlocked_at"]) : null;
        if (slug && at) map[slug] = at;
      });
      setUnlocked(map);
      setLoading(false);
    };
    void load();
  }, [userId]);

  return (
    <div className="rounded-lg border border-border/30 bg-card/50 p-3">
      <h3 className="text-sm font-bold font-mono text-foreground mb-2">Achievements</h3>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {ACHIEVEMENT_DEFS.map((def) => {
            const unlockedAt = unlocked[def.slug];
            return (
              <div key={def.slug} className={`p-2 rounded-md border ${unlockedAt ? "border-emerald-400/50 bg-emerald-500/6" : "border-border/30 bg-card/30"}`}>
                <div className="flex items-center gap-2">
                  <div className="text-xl">{def.icon}</div>
                  <div>
                    <div className="text-xs font-semibold">{def.name}</div>
                    <div className="text-[10px] text-muted-foreground">{def.description}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AchievementsPanel;
