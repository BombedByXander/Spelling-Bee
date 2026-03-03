import { useEffect, useState } from "react";
import { ArrowLeft, Star, Trophy, Target, Flame, Camera, Calendar, RefreshCw, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getLevelFromXp } from "@/lib/level";

interface ProfileData {
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  stars: number;
  total_correct: number;
  best_streak: number;
  username_changed_at: string | null;
}

interface LeaderboardRow {
  rank: number | null;
  week_start: string | null;
  streak_count: number | null;
  correct_count: number | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  fullPage?: boolean;
}

const MISSING_ROW_ERROR_CODE = "PGRST116";

const normalizeProfileData = (rawProfile: any): ProfileData => ({
  display_name: rawProfile?.display_name || "Player",
  username: rawProfile?.username ?? null,
  avatar_url: rawProfile?.avatar_url ?? null,
  stars: Number(rawProfile?.stars ?? 0),
  total_correct: Number(rawProfile?.total_correct ?? 0),
  best_streak: Number(rawProfile?.best_streak ?? 0),
  username_changed_at: rawProfile?.username_changed_at ?? null,
});

const PersonalDashboard = ({ open, onClose, userId, fullPage = false }: Props) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [currentRank, setCurrentRank] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshProfileStars = async () => {
    const { data } = await supabase.from("profiles").select("stars").eq("id", userId).single();
    if (data) {
      setProfile((p) => (p ? { ...p, stars: Number(data.stars ?? p.stars) } : p));
    }
  };

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setLoadError(null);

    try {
      const [profileRes, rankRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("weekly_leaderboard")
          .select("rank, week_start, streak_count, correct_count")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      let profileData = profileRes.data as ProfileData | null;
      const missingProfile = !profileData || profileRes.error?.code === MISSING_ROW_ERROR_CODE;

      if (missingProfile) {
        const { data: authUserData } = await supabase.auth.getUser();
        const fallbackDisplayName =
          (authUserData.user?.user_metadata?.display_name as string | undefined)?.trim() ||
          (authUserData.user?.email?.split("@")[0] ?? "Player");

        await supabase.from("profiles").upsert(
          {
            id: userId,
            display_name: fallbackDisplayName,
          },
          { onConflict: "id" }
        );

        const profileRetry = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        profileData = (profileRetry.data as ProfileData | null) ?? null;

        if (profileRetry.error) {
          console.error("Error loading profile after auto-create:", profileRetry.error);
        }
      }

      if (!profileData) {
        if (profileRes.error && profileRes.error.code !== MISSING_ROW_ERROR_CODE) {
          console.error("Error loading profile:", profileRes.error);
        }
        setLoadError("Could not load dashboard profile right now.");
        setProfile(null);
      } else {
        const normalizedProfile = normalizeProfileData(profileData);
        setProfile(normalizedProfile);
      }

      setCurrentRank((rankRes.data as LeaderboardRow | null)?.rank ?? null);

      if (!silent && profileData) {
        const { data: claimed } = await supabase.rpc("claim_daily_login");
        if (claimed) {
          setDailyClaimed(true);
          await refreshProfileStars();
        }
      }
    } catch {
      setLoadError("Could not load dashboard data. Please try again.");
      setProfile(null);
      setCurrentRank(null);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchData();
  }, [open, userId]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;
    await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = data.publicUrl + "?t=" + Date.now();
    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId);
    setProfile(p => p ? { ...p, avatar_url: avatarUrl } : p);
    setUploading(false);
  };

  const handleNameSave = async () => {
    if (!newName.trim()) return;
    await supabase.from("profiles").update({ display_name: newName.trim() }).eq("id", userId);
    setProfile(p => p ? { ...p, display_name: newName.trim() } : p);
    setEditingName(false);
  };

  const handleUsernameSave = async () => {
    if (!newUsername.trim() || newUsername.trim().length < 3) {
      setUsernameError("Username must be 3-20 characters");
      return;
    }
    const { data } = await supabase.rpc("change_username", { p_new_username: newUsername.trim() });
    if (data === false) {
      setUsernameError("You can only change username once every month");
    } else {
      setProfile(p => p ? { ...p, username: newUsername.trim(), username_changed_at: new Date().toISOString() } : p);
      setEditingUsername(false);
      setUsernameError("");
    }
  };

  const canChangeUsername = () => {
    if (!profile?.username_changed_at) return true;
    const last = new Date(profile.username_changed_at);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return last < oneMonthAgo;
  };

  if (!fullPage && !open) return null;

  const levelData = profile ? getLevelFromXp(profile.stars) : null;

  const dashboardContent = (
      <div className={`w-full ${fullPage ? "" : "max-w-2xl max-h-[88vh] mx-4 rounded-2xl bg-card/95 border border-border backdrop-blur-md overflow-hidden"} flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className={`px-5 py-4 ${fullPage ? "mb-2" : "border-b border-border"}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold font-mono text-primary text-glow tracking-tight">Personal Dashboard</h2>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-[10px] text-muted-foreground font-mono">Profile, progression, and weekly insights</p>
                <button
                  onClick={() => fetchData(true)}
                  className="text-[10px] text-muted-foreground hover:text-primary transition-colors font-mono"
                  title="Refresh dashboard"
                >
                  <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
            {fullPage ? (
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
                title="Back"
              >
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">×</button>
            )}
          </div>
        </div>

        <div className={`flex-1 ${fullPage ? "overflow-visible" : "overflow-y-auto min-h-0"} px-5 py-4 space-y-5`}>
          {loading ? (
            <p className="text-center text-muted-foreground text-sm py-8">Loading...</p>
          ) : loadError ? (
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-center">
              <p className="text-sm text-destructive font-medium">{loadError}</p>
              <button
                onClick={() => fetchData(true)}
                className="mt-3 text-xs font-mono px-3 py-1.5 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : !profile ? (
            <div className="rounded-xl bg-card/35 border border-border/40 p-4 text-center">
              <p className="text-sm text-muted-foreground">No dashboard data found for this account yet.</p>
            </div>
          ) : profile && (
            <>
              {/* Daily Login Banner */}
              {dailyClaimed && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-xs text-primary font-mono">
                  <Calendar size={14} />
                  Daily login bonus! +100 XP
                </div>
              )}

              {/* Avatar + Name */}
              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 items-center rounded-xl bg-card/30 border border-border/40 p-4">
                <div className="relative group mx-auto md:mx-0">
                  <div className="w-20 h-20 rounded-full bg-card border-2 border-border overflow-hidden flex items-center justify-center">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-muted-foreground font-mono">{profile.display_name[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <Camera size={16} className="text-foreground" />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>
                <div className="flex-1">
                  {/* Display Name */}
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="px-2 py-1 bg-input border border-border rounded text-sm font-mono text-foreground w-32"
                        maxLength={20}
                        autoFocus
                        onKeyDown={e => e.key === "Enter" && handleNameSave()}
                      />
                      <button onClick={handleNameSave} className="text-primary text-xs">Save</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingName(true); setNewName(profile.display_name); }} className="text-foreground font-bold text-lg hover:text-primary transition-colors">
                      {profile.display_name}
                    </button>
                  )}

                  {/* Username */}
                  {editingUsername ? (
                    <div className="mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">@</span>
                        <input
                          value={newUsername}
                          onChange={e => { setNewUsername(e.target.value); setUsernameError(""); }}
                          className="px-2 py-0.5 bg-input border border-border rounded text-xs font-mono text-foreground w-28"
                          maxLength={20}
                          autoFocus
                          onKeyDown={e => e.key === "Enter" && handleUsernameSave()}
                        />
                        <button onClick={handleUsernameSave} className="text-primary text-[10px]">Save</button>
                        <button onClick={() => setEditingUsername(false)} className="text-muted-foreground text-[10px]">Cancel</button>
                      </div>
                      {usernameError && <p className="text-[10px] text-destructive mt-1">{usernameError}</p>}
                    </div>
                  ) : (
                    <div className="mt-3 space-y-1">
                      <div className="text-xs font-mono text-muted-foreground">@{profile.username || "unnamed"}</div>
                      <button
                        onClick={() => { if (canChangeUsername()) { setEditingUsername(true); setNewUsername(profile.username || ""); } }}
                        className={`text-[10px] font-mono uppercase tracking-wider transition-colors ${canChangeUsername() ? "text-primary hover:text-primary/80" : "text-muted-foreground/50 cursor-not-allowed"}`}
                        title={canChangeUsername() ? "Change username" : "You can change your username once every month"}
                      >
                        Change @
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} className="text-[hsl(45_95%_55%)] fill-[hsl(45_95%_55%)]" />
                    <span className="text-xs text-muted-foreground font-mono">
                      Level {levelData?.level ?? 1} · {profile.stars} XP
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Medal size={12} className="text-primary" />
                    <span className="text-xs text-muted-foreground font-mono">
                      {currentRank ? `Weekly rank #${currentRank}` : "Not ranked this week yet"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <StatBox icon={<Target size={14} />} label="Total Correct" value={profile.total_correct} />
                  <StatBox icon={<Flame size={14} />} label="Best Streak" value={profile.best_streak} />
                  <StatBox icon={<Star size={14} />} label="XP" value={profile.stars} />
                  <StatBox icon={<Trophy size={14} />} label="Weekly Rank" value={currentRank ? `#${currentRank}` : "—"} />
                </div>
                {levelData && (
                  <div className="w-full rounded-xl bg-card/35 border border-border/40 p-3">
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="text-foreground">Level {levelData.level}</span>
                      <span className="text-muted-foreground">
                        {Math.max(0, levelData.xpInLevel)}/{levelData.xpForNext} XP to next
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary/80"
                        style={{ width: `${Math.max(2, Math.round(levelData.progress * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {dashboardContent}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      {dashboardContent}
    </div>
  );
};

const StatBox = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <div className="flex flex-col items-center py-3 px-2 rounded-xl bg-card/40 border border-border/40">
    <span className="text-primary mb-1">{icon}</span>
    <span className="text-lg font-extrabold font-mono text-foreground">{value}</span>
    <span className="text-[8px] text-muted-foreground uppercase tracking-widest mt-0.5">{label}</span>
  </div>
);

export default PersonalDashboard;
