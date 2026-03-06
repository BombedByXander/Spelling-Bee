import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isOwnerUser } from "@/lib/roles";
import { getLevelFromXp } from "@/lib/level";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  streak_count?: number | null;
  correct_count?: number | null;
  rank?: number | null;
  best_wpm?: number | null;
  modifiers?: string[] | null;
  mode?: string | null;
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
    // Prefer an all-time WPM leaderboard view if present; fall back to weekly leaderboard
    const [{ data, error }, { data: roles }] = await Promise.all([
      supabase.from("all_time_wpm_leaderboard").select("*").order("rank", { ascending: true }).limit(50),
      supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
    ]);
    let castedEntries: LeaderboardEntry[] = [];
    if (!error && data && Array.isArray(data) && data.length > 0) {
      castedEntries = data as unknown as LeaderboardEntry[];
      setEntries(castedEntries);
    } else {
      // fallback to weekly view first
      const fallback = await supabase.from("weekly_leaderboard").select("*").order("rank", { ascending: true }).limit(50);
      if (fallback.data && Array.isArray(fallback.data) && fallback.data.length > 0) {
        castedEntries = fallback.data as unknown as LeaderboardEntry[];
        setEntries(castedEntries);
      } else {
        // final fallback: build from user_best_wpm + profiles so everyone persisted is visible
        const { data: ub } = await supabase.from("user_best_wpm").select("user_id, best_wpm, mode, modifiers").order("best_wpm", { ascending: false }).limit(50);
        if (ub && Array.isArray(ub) && ub.length > 0) {
          const ids = ub.map((r: any) => r.user_id);
          const { data: profs } = await supabase.from("profiles").select("id, display_name, username, avatar_url").in("id", ids as any[]);
          const profById: Record<string, any> = {};
          (profs ?? []).forEach((p: any) => { profById[p.id] = p; });
          const built = (ub as any[]).map((r: any, i: number) => ({
            user_id: r.user_id,
            display_name: profById[r.user_id]?.display_name ?? "(unknown)",
            username: profById[r.user_id]?.username ?? null,
            avatar_url: profById[r.user_id]?.avatar_url ?? null,
            best_wpm: Number(r.best_wpm),
            modifiers: Array.isArray(r.modifiers) ? r.modifiers : [],
            mode: r.mode ?? null,
            rank: i + 1,
          } as LeaderboardEntry));
          castedEntries = built;
          setEntries(castedEntries);
        } else {
          setEntries([]);
        }
      }
    }
    // Ensure leaderboard includes any persisted bests not present in the view: merge with user_best_wpm top 50
    try {
      const { data: ubAll } = await supabase.from('user_best_wpm').select('user_id, best_wpm, mode, modifiers').order('best_wpm', { ascending: false }).limit(50);
      if (ubAll && Array.isArray(ubAll) && ubAll.length > 0) {
        // fetch profiles for any ids not already present
        const missingIds = ubAll.map((r: any) => r.user_id).filter((id: string) => !castedEntries.find((e) => e.user_id === id));
        if (missingIds.length > 0) {
          const { data: profsAll } = await supabase.from('profiles').select('id, display_name, username, avatar_url').in('id', missingIds as any[]);
          const profByIdAll: Record<string, any> = {};
          (profsAll ?? []).forEach((p: any) => { profByIdAll[p.id] = p; });
          const builtExtra = (ubAll as any[])
            .filter((r: any) => missingIds.includes(r.user_id))
            .map((r: any) => ({
              user_id: r.user_id,
              display_name: profByIdAll[r.user_id]?.display_name ?? '(unknown)',
              username: profByIdAll[r.user_id]?.username ?? null,
              avatar_url: profByIdAll[r.user_id]?.avatar_url ?? null,
              best_wpm: Number(r.best_wpm),
              modifiers: Array.isArray(r.modifiers) ? r.modifiers : [],
              mode: r.mode ?? null,
            } as LeaderboardEntry));
          // merge and resort by best_wpm
          const merged = [...castedEntries, ...builtExtra];
          merged.sort((a, b) => (Number(b.best_wpm ?? -Infinity) - Number(a.best_wpm ?? -Infinity)));
          // reassign ranks
          const withRanks = merged.map((m, i) => ({ ...m, rank: i + 1 }));
          setEntries(withRanks.slice(0, 50));
          castedEntries = withRanks.slice(0, 50);
        }
      }
    } catch {
      // ignore any merge errors and continue
    }

    // If user is signed in, fetch their personal row and append if not in top list
    try {
      const { data: userResp } = await supabase.auth.getUser();
      const uid = userResp?.user?.id ?? null;
      if (uid) {
        const already = (data ?? []).find((r: any) => r.user_id === uid) ?? null;
        if (!already) {
          // try to fetch from all_time view first, fallback to user_best_wpm
          let userRow: any = null;
          try {
            const { data: ur } = await supabase.from('all_time_wpm_leaderboard').select('*').eq('user_id', uid).maybeSingle();
            userRow = ur ?? null;
          } catch {
            // ignore
          }
          if (!userRow) {
            const { data: ub } = await supabase.from('user_best_wpm').select('user_id, best_wpm, mode, modifiers').eq('user_id', uid).maybeSingle();
            if (ub && ub.user_id) {
              // fetch display name from profiles
              const { data: prof } = await supabase.from('profiles').select('display_name, username, avatar_url').eq('id', uid).maybeSingle();
              // compute rank by counting users with higher best_wpm
              let computedRank: number | null = null;
              try {
                const { count } = await supabase.from('user_best_wpm').select('user_id', { count: 'exact' }).gt('best_wpm', ub.best_wpm);
                computedRank = (count ?? 0) + 1;
              } catch {
                computedRank = null;
              }
              userRow = {
                user_id: ub.user_id,
                display_name: (prof && prof.display_name) ? prof.display_name : 'You',
                username: prof?.username ?? null,
                avatar_url: prof?.avatar_url ?? null,
                best_wpm: ub.best_wpm,
                modifiers: Array.isArray(ub.modifiers) ? ub.modifiers : [],
                mode: ub.mode ?? null,
                rank: computedRank,
              } as any;
            }
          }
          if (userRow) {
            setEntries((prev) => {
              // avoid duplicates
              if (prev.find((r) => r.user_id === userRow.user_id)) return prev;
              return [...prev, userRow];
            });
          }
        }
      }
    } catch {
      // ignore auth errors
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
      .on("postgres_changes", { event: "*", schema: "public", table: "user_best_wpm" }, () => fetchLeaderboard())
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
            <h2 className="text-lg font-extrabold font-mono text-primary text-glow tracking-tight">All-Time Highest WPM (Top 50)</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">×</button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 tracking-wide uppercase">
            Ranked by peak recorded WPM · Top 50 all-time performers
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
          {loading ? (
            <p className="text-center text-muted-foreground text-sm py-8">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No activity yet this week. Be the first!</p>
          ) : (
            entries.map((entry) => {
              const modifiersList = Array.isArray(entry.modifiers) && entry.modifiers.length > 0 ? entry.modifiers.join(", ") : "none";
              const modeLabel = entry.mode ?? "unknown";
              return (
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
                  (entry.rank && entry.rank <= 3) ? "bg-primary/5" : "hover:bg-card/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-sm font-bold w-6 text-right ${
                    entry.rank === 1 ? "text-[hsl(45_95%_55%)]" :
                    entry.rank === 2 ? "text-[hsl(220_10%_70%)]" :
                    entry.rank === 3 ? "text-[hsl(25_70%_50%)]" :
                    "text-muted-foreground"
                  }`}>
                    {entry.rank ?? "-"}
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
                    <span
                      className="text-sm text-foreground font-medium truncate max-w-[120px]"
                      title={`Mode: ${modeLabel} · Modifiers: ${modifiersList}`}
                    >
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
                  <span className="text-[10px] text-muted-foreground font-mono">WPM</span>
                  <span
                    className="font-mono text-sm font-bold text-primary"
                    title={`Mode: ${modeLabel} · Modifiers: ${modifiersList}`}
                  >
                    {entry.best_wpm ? entry.best_wpm.toFixed(2) : "-"}
                  </span>
                </div>
              </button>
            )})
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
