import { supabase } from "@/integrations/supabase/client";

export type AchievementDef = {
  slug: string;
  name: string;
  description: string;
  icon?: string;
};

// Define some sample achievements
export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { slug: "first-win", name: "First Win", description: "Complete your first game", icon: "🏆" },
  { slug: "streak-10", name: "Steady 10", description: "Reach a 10-day streak", icon: "🔥" },
  { slug: "wordsmith-100", name: "Wordsmith 100", description: "Spell 100 words correctly", icon: "✍️" },
];

// Emit an in-browser event so UI toasts can pick it up immediately
export const emitAchievementUnlocked = (slug: string) => {
  window.dispatchEvent(new CustomEvent("achievement:unlocked", { detail: { slug } }));
};

// Server-side persistence helper: call to record unlocked achievement for a user
export const persistUnlockedAchievement = async (userId: string, achievementSlug: string) => {
  // First load achievement id by slug
  try {
    const { data: achData, error: achErr } = await supabase.from("achievements").select("id").eq("slug", achievementSlug).maybeSingle();
    if (achErr || !achData) return { error: achErr || new Error("Achievement not found") };

    const achievementId = (achData as any).id as string;
    const { data, error } = await supabase.from("user_achievements").insert({ user_id: userId, achievement_id: achievementId });
    return { data, error };
  } catch (e) {
    return { error: e };
  }
};
