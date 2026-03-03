import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isOwnerUser } from "@/lib/roles";
import { getLevelFromXp } from "@/lib/level";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  streak_count: number;
  correct_count: number;
  rank: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
}
interface PublicProfileStats {
  stars: number;
  total_correct: number;
  best_streak: number;
}

interface WeeklyHistoryRow {
  week_start: string;
  streak_count: number;
  correct_count: number;
}

const Leaderboard = ({ open, onClose }: Props) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [selectedProfile, setSelectedProfile] = useState<LeaderboardEntry | null>(null);
  const [selectedStats, setSelectedStats] = useState<PublicProfileStats | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<WeeklyHistoryRow[]>([]);
  const [selectedStatsLoading, setSelectedStatsLoading] = useState(false);

  const fetchSelectedProfileStats = async (entry: LeaderboardEntry) => {
    setSelectedStatsLoading(true);

    const fallbackStats: PublicProfileStats = {
      stars: 0,
      total_correct: Number(entry.correct_count || 0),
      best_streak: Number(entry.streak_count || 0),
    };

    try {
      const [profileRes, historyRes] = await Promise.all([
        (supabase as any).rpc("get_public_profile_stats", { p_user_id: entry.user_id }),
        (supabase as any).rpc("get_public_weekly_history", { p_user_id: entry.user_id, p_limit: 10 }),
      ]);

      const profileRow = Array.isArray(profileRes.data) ? profileRes.data[0] : null;

      if (profileRes.error || !profileRow) {
        setSelectedStats(fallbackStats);
        setSelectedHistory((historyRes.data ?? []) as WeeklyHistoryRow[]);
      } else {
        setSelectedStats({
          stars: Number(profileRow.stars ?? fallbackStats.stars),
          total_correct: Number(profileRow.total_correct ?? fallbackStats.total_correct),
          best_streak: Number(profileRow.best_streak ?? fallbackStats.best_streak),
        });
        setSelectedHistory((historyRes.data ?? []) as WeeklyHistoryRow[]);
      }
    } catch {
      setSelectedStats(fallbackStats);
      setSelectedHistory([]);
    } finally {
      setSelectedStatsLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    const [{ data, error }, { data: roles }] = await Promise.all([
      supabase.from("weekly_leaderboard").select("*").order("rank", { ascending: true }).limit(50),
      supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
    ]);

    if (!error && data) {
      const castedEntries = data as unknown as LeaderboardEntry[];
      setEntries(castedEntries);
    }
    if (roles) {
      setAdminIds(new Set(roles.map((row: any) => row.user_id)));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    fetchLeaderboard();
    const channel = supabase
      .channel("leaderboard-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "weekly_streaks" }, () => fetchLeaderboard())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open]);

  if (!open) return null;

  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const resetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday));
  const msUntilReset = resetDate.getTime() - now.getTime();
  const daysLeft = Math.floor(msUntilReset / 86400000);
  const hoursLeft = Math.floor((msUntilReset % 86400000) / 3600000);
  const ownerBadgeClassName = "text-[8px] px-1.5 py-0.5 rounded-full font-mono font-bold border border-[hsl(45_95%_55%/0.62)] bg-[hsl(45_95%_55%/0.2)] text-[hsl(45_95%_55%)] text-glow-yellow";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-[40rem] max-h-[82vh] mx-4 rounded-2xl bg-card/95 border border-border backdrop-blur-md overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold font-mono text-primary text-glow tracking-tight">Weekly Leaderboard</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">×</button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 tracking-wide uppercase">
            Resets in {daysLeft}d {hoursLeft}h · Ranked by weekly correct words
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
          {loading ? (
            <p className="text-center text-muted-foreground text-sm py-8">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No activity yet this week. Be the first!</p>
          ) : (
            entries.map((entry) => (
              <button
                key={entry.user_id}
                onClick={() => {
                  const isSame = selectedProfile?.user_id === entry.user_id;
                  if (isSame) {
                    setSelectedProfile(null);
                    setSelectedStats(null);
                    setSelectedHistory([]);
                    return;
                  }
                  setSelectedProfile(entry);
                  void fetchSelectedProfileStats(entry);
                }}
                className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors w-full text-left ${
                  entry.rank <= 3 ? "bg-primary/5" : "hover:bg-card/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-sm font-bold w-6 text-right ${
                    entry.rank === 1 ? "text-[hsl(45_95%_55%)]" :
                    entry.rank === 2 ? "text-[hsl(220_10%_70%)]" :
                    entry.rank === 3 ? "text-[hsl(25_70%_50%)]" :
                    "text-muted-foreground"
                  }`}>
                    {entry.rank}
                  </span>
                  <div className="w-11 h-11 rounded-full bg-card border border-border overflow-hidden flex-shrink-0">
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full text-xs font-bold text-muted-foreground font-mono">
                        {entry.display_name?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-foreground font-medium truncate max-w-[120px]">
                      {entry.display_name}
                    </span>
                    {adminIds.has(entry.user_id) && !isOwnerUser(entry.user_id) && (
                      <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-mono font-bold">
                        Admin
                      </span>
                    )}
                    {isOwnerUser(entry.user_id) && (
                      <span className={ownerBadgeClassName}>
                        Owner
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground font-mono">{entry.correct_count} correct</span>
                  <span className="font-mono text-sm font-bold text-primary">{entry.streak_count} 🔥</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Profile Preview */}
        {selectedProfile && (
          <div className="px-5 py-3 border-t border-border bg-card/60 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-card border border-border overflow-hidden flex-shrink-0">
                {selectedProfile.avatar_url ? (
                  <img src={selectedProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="flex items-center justify-center w-full h-full text-lg font-bold text-muted-foreground font-mono">
                    {selectedProfile.display_name?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-foreground">{selectedProfile.display_name}</span>
                  {adminIds.has(selectedProfile.user_id) && !isOwnerUser(selectedProfile.user_id) && (
                    <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-mono font-bold">Admin</span>
                  )}
                  {isOwnerUser(selectedProfile.user_id) && (
                    <span className={ownerBadgeClassName}>Owner</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground font-mono">@{selectedProfile.username || "unnamed"}</span>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm font-bold text-primary font-mono">{selectedProfile.correct_count}</p>
                <p className="text-[9px] text-muted-foreground">correct this week</p>
              </div>
            </div>

            {selectedStatsLoading ? (
              <p className="text-xs text-muted-foreground font-mono">Loading player dashboard stats...</p>
            ) : selectedStats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="rounded-lg border border-border/40 bg-card/50 p-2">
                    <p className="text-[9px] text-muted-foreground font-mono uppercase">Total Correct</p>
                    <p className="text-sm font-bold font-mono text-foreground">{selectedStats.total_correct}</p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-card/50 p-2">
                    <p className="text-[9px] text-muted-foreground font-mono uppercase">Best Streak</p>
                    <p className="text-sm font-bold font-mono text-foreground">{selectedStats.best_streak}</p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-card/50 p-2">
                    <p className="text-[9px] text-muted-foreground font-mono uppercase">XP</p>
                    <p className="text-sm font-bold font-mono text-foreground">{selectedStats.stars}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border/40 bg-card/50 p-2">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">Level</span>
                    <span className="text-foreground">{getLevelFromXp(selectedStats.stars).level}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary/80"
                      style={{ width: `${Math.max(2, Math.round(getLevelFromXp(selectedStats.stars).progress * 100))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Weekly History</p>
                  {selectedHistory.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground">No weekly history yet.</p>
                  ) : (
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {selectedHistory.map((week) => (
                        <div key={week.week_start} className="rounded-md border border-border/30 bg-card/40 px-2 py-1.5">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-muted-foreground">{new Date(week.week_start).toLocaleDateString()}</span>
                            <span className="text-foreground">{week.correct_count} correct · {week.streak_count} streak</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
