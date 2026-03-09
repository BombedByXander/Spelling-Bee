import { useEffect, useState } from "react";
import { CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SeasonPassProgress {
  progress_date: string;
  baseline_stars: number;
  baseline_total_correct: number;
  claimed_login_reward: boolean;
  claimed_stars_reward: boolean;
  claimed_correct_reward: boolean;
}

interface ProfileProgress {
  stars: number;
  total_correct: number;
}

interface Props {
  userId: string;
}

const SEASON_PASS_STARS_TARGET = 300;
const SEASON_PASS_CORRECT_TARGET = 40;
const SEASON_PASS_LOGIN_REWARD = 100;
const SEASON_PASS_STARS_REWARD = 300;
const SEASON_PASS_CORRECT_REWARD = 400;
const SEASON_PASS_LOCAL_STORAGE_PREFIX = "spelldown-season-pass";

const getTodayDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getLocalSeasonPassKey = (userId: string, dateKey: string) => `${SEASON_PASS_LOCAL_STORAGE_PREFIX}:${userId}:${dateKey}`;

const normalizeLocalProgress = (
  userId: string,
  profile: ProfileProgress,
  fallbackDate = getTodayDateKey()
): SeasonPassProgress => {
  const key = getLocalSeasonPassKey(userId, fallbackDate);
  const raw = localStorage.getItem(key);

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as SeasonPassProgress;
      if (parsed?.progress_date === fallbackDate) {
        return {
          progress_date: parsed.progress_date,
          baseline_stars: Number(parsed.baseline_stars ?? 0),
          baseline_total_correct: Number(parsed.baseline_total_correct ?? 0),
          claimed_login_reward: Boolean(parsed.claimed_login_reward),
          claimed_stars_reward: Boolean(parsed.claimed_stars_reward),
          claimed_correct_reward: Boolean(parsed.claimed_correct_reward),
        };
      }
    } catch {
      // Ignore corrupt local storage and recreate today's baseline.
    }
  }

  const created: SeasonPassProgress = {
    progress_date: fallbackDate,
    baseline_stars: Number(profile.stars ?? 0),
    baseline_total_correct: Number(profile.total_correct ?? 0),
    claimed_login_reward: false,
    claimed_stars_reward: false,
    claimed_correct_reward: false,
  };
  localStorage.setItem(key, JSON.stringify(created));
  return created;
};

const saveLocalProgress = (userId: string, progress: SeasonPassProgress) => {
  localStorage.setItem(getLocalSeasonPassKey(userId, progress.progress_date), JSON.stringify(progress));
};

const SeasonPassPanel = ({ userId }: Props) => {
  const [seasonPass, setSeasonPass] = useState<SeasonPassProgress | null>(null);
  const [profileProgress, setProfileProgress] = useState<ProfileProgress>({ stars: 0, total_correct: 0 });
  const [seasonPassError, setSeasonPassError] = useState<string | null>(null);
  const [claimingReward, setClaimingReward] = useState<"login" | "stars" | "correct" | null>(null);
  const [showSeasonPass, setShowSeasonPass] = useState(true);
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);
  const [creatingCheckout, setCreatingCheckout] = useState(false);

  const refreshProfileProgress = async (): Promise<ProfileProgress> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("stars, total_correct")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      const nextProgress = {
        stars: Number(data.stars ?? 0),
        total_correct: Number(data.total_correct ?? 0),
      };
      setProfileProgress(nextProgress);
      return nextProgress;
    }

    return profileProgress;
  };

  const refreshSeasonPass = async (profileSnapshot: ProfileProgress) => {
    const { data, error } = await supabase.rpc("get_or_create_season_pass_daily_progress");
    if (error) {
      const localProgress = normalizeLocalProgress(userId, profileSnapshot);
      setUsingLocalFallback(true);
      setSeasonPassError(null);
      setSeasonPass(localProgress);
      return;
    }

    const firstRow = Array.isArray(data) ? data[0] : null;
    if (!firstRow) {
      const localProgress = normalizeLocalProgress(userId, profileSnapshot);
      setUsingLocalFallback(true);
      setSeasonPassError(null);
      setSeasonPass(localProgress);
      return;
    }

    setUsingLocalFallback(false);
    setSeasonPassError(null);
    setSeasonPass({
      progress_date: firstRow.progress_date,
      baseline_stars: Number(firstRow.baseline_stars ?? 0),
      baseline_total_correct: Number(firstRow.baseline_total_correct ?? 0),
      claimed_login_reward: Boolean(firstRow.claimed_login_reward),
      claimed_stars_reward: Boolean(firstRow.claimed_stars_reward),
      claimed_correct_reward: Boolean(firstRow.claimed_correct_reward),
    });
  };

  const claimSeasonPassReward = async (rewardKey: "login" | "stars" | "correct") => {
    if (claimingReward) return;
    setClaimingReward(rewardKey);

    if (usingLocalFallback) {
      if (!seasonPass) {
        setClaimingReward(null);
        return;
      }

      const starsProgress = Math.max(0, Number(profileProgress.stars ?? 0) - Number(seasonPass.baseline_stars ?? 0));
      const correctProgress = Math.max(
        0,
        Number(profileProgress.total_correct ?? 0) - Number(seasonPass.baseline_total_correct ?? 0)
      );

      let rewardAmount = 0;
      let nextProgress = { ...seasonPass };

      if (rewardKey === "login" && !seasonPass.claimed_login_reward) {
        rewardAmount = SEASON_PASS_LOGIN_REWARD;
        nextProgress = { ...nextProgress, claimed_login_reward: true };
      }

      if (rewardKey === "stars" && !seasonPass.claimed_stars_reward && starsProgress >= SEASON_PASS_STARS_TARGET) {
        rewardAmount = SEASON_PASS_STARS_REWARD;
        nextProgress = { ...nextProgress, claimed_stars_reward: true };
      }

      if (rewardKey === "correct" && !seasonPass.claimed_correct_reward && correctProgress >= SEASON_PASS_CORRECT_TARGET) {
        rewardAmount = SEASON_PASS_CORRECT_REWARD;
        nextProgress = { ...nextProgress, claimed_correct_reward: true };
      }

      if (rewardAmount > 0) {
        const { error: addStarsError } = await supabase.rpc("add_stars", { p_amount: rewardAmount });
        if (addStarsError) {
          const { error: fallbackUpdateError } = await supabase
            .from("profiles")
            .update({ stars: Number(profileProgress.stars ?? 0) + rewardAmount })
            .eq("id", userId);
          if (fallbackUpdateError) {
            setSeasonPassError("Could not claim reward right now.");
            setClaimingReward(null);
            return;
          }
        }

        saveLocalProgress(userId, nextProgress);
        setSeasonPass(nextProgress);
      }

      const refreshedProfile = await refreshProfileProgress();
      await refreshSeasonPass(refreshedProfile);
      setClaimingReward(null);
      return;
    }

    const { data } = await supabase.rpc("claim_season_pass_reward", { p_reward_key: rewardKey });

    if (data) {
      const refreshedProfile = await refreshProfileProgress();
      await refreshSeasonPass(refreshedProfile);
    }

    setClaimingReward(null);
  };

  useEffect(() => {
    const loadSeasonPass = async () => {
      const currentProfile = await refreshProfileProgress();
      await refreshSeasonPass(currentProfile);
    };

    void loadSeasonPass();
  }, [userId]);

  const starsGainedToday =
    seasonPass ? Math.max(0, Number(profileProgress.stars ?? 0) - Number(seasonPass.baseline_stars ?? 0)) : 0;
  const correctGainedToday =
    seasonPass
      ? Math.max(0, Number(profileProgress.total_correct ?? 0) - Number(seasonPass.baseline_total_correct ?? 0))
      : 0;
  const seasonPassClaimedCount = seasonPass
    ? [seasonPass.claimed_login_reward, seasonPass.claimed_stars_reward, seasonPass.claimed_correct_reward].filter(Boolean)
        .length
    : 0;

  return (
    <div className="rounded-xl bg-card/35 border border-border/40 p-3 space-y-3">
      <button
        onClick={() => setShowSeasonPass((current) => !current)}
        className="w-full rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-primary/15 transition-colors"
      >
        <div className="min-w-0">
          <div className="text-xs font-bold text-primary font-mono uppercase tracking-wide">Season Pass</div>
          <div className="text-[10px] text-muted-foreground font-mono">Daily free missions · {seasonPassClaimedCount}/3 claimed today</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] px-2 py-1 rounded-md bg-background/60 border border-border/50 text-foreground font-mono inline-flex items-center gap-1">
            <CalendarDays size={12} />
            Calendar
          </span>
          {showSeasonPass ? <ChevronUp size={14} className="text-primary" /> : <ChevronDown size={14} className="text-primary" />}
        </div>
      </button>

      {showSeasonPass && (
        <div className="space-y-3">
          {/* Buy season pass CTA */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-bold font-mono text-foreground">Buy Season Pass</div>
              <div className="text-[11px] text-muted-foreground font-mono">One-time purchase — unlock premium cosmetics and bonuses</div>
            </div>
            <div>
              <button
                onClick={async () => {
                  if (!userId || creatingCheckout) return;
                  setCreatingCheckout(true);
                  try {
                    const res = await fetch("/api/create-stripe-checkout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ userId }),
                    });
                    const payload = await res.json();
                    if (payload?.url) {
                      window.location.href = payload.url;
                    } else {
                      console.error("Checkout creation failed", payload);
                    }
                  } catch (e) {
                    console.error(e);
                  }
                  setCreatingCheckout(false);
                }}
                className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-mono text-sm"
                disabled={creatingCheckout}
              >
                {creatingCheckout ? "Redirecting..." : "Buy — $4.99"}
              </button>
            </div>
          </div>
          <SeasonPassCalendarStrip progressDate={seasonPass?.progress_date} allClaimed={seasonPassClaimedCount === 3} />
          {usingLocalFallback && (
            <p className="text-[11px] text-muted-foreground font-mono">Season Pass is running in fallback mode.</p>
          )}
          {seasonPassError ? (
            <p className="text-[11px] text-destructive font-mono">{seasonPassError}</p>
          ) : seasonPass ? (
            <div className="space-y-2">
              <SeasonMissionRow
                title="Check in"
                description="Claim your free daily reward"
                progressLabel="1/1"
                rewardLabel={`+${SEASON_PASS_LOGIN_REWARD} XP`}
                completed
                claimed={seasonPass.claimed_login_reward}
                busy={claimingReward === "login"}
                onClaim={() => claimSeasonPassReward("login")}
              />
              <SeasonMissionRow
                title="XP Grind"
                description="Earn 300 XP today"
                progressLabel={`${Math.min(starsGainedToday, SEASON_PASS_STARS_TARGET)}/${SEASON_PASS_STARS_TARGET}`}
                rewardLabel={`+${SEASON_PASS_STARS_REWARD} XP`}
                completed={starsGainedToday >= SEASON_PASS_STARS_TARGET}
                claimed={seasonPass.claimed_stars_reward}
                busy={claimingReward === "stars"}
                onClaim={() => claimSeasonPassReward("stars")}
              />
              <SeasonMissionRow
                title="Word Sprint"
                description="Spell 40 words today"
                progressLabel={`${Math.min(correctGainedToday, SEASON_PASS_CORRECT_TARGET)}/${SEASON_PASS_CORRECT_TARGET}`}
                rewardLabel={`+${SEASON_PASS_CORRECT_REWARD} XP`}
                completed={correctGainedToday >= SEASON_PASS_CORRECT_TARGET}
                claimed={seasonPass.claimed_correct_reward}
                busy={claimingReward === "correct"}
                onClaim={() => claimSeasonPassReward("correct")}
              />
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground font-mono">Loading Season Pass...</p>
          )}
        </div>
      )}
    </div>
  );
};

const SeasonPassCalendarStrip = ({ progressDate, allClaimed }: { progressDate?: string; allClaimed: boolean }) => {
  const base = progressDate ? new Date(`${progressDate}T00:00:00`) : new Date();
  const dateKey = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const targetKey = progressDate ?? dateKey(base);

  const days = Array.from({ length: 7 }, (_, index) => {
    const offset = index - 3;
    const day = new Date(base);
    day.setDate(base.getDate() + offset);
    return day;
  });

  return (
    <div className="rounded-lg border border-border/50 bg-background/35 px-2 py-2">
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = dateKey(day);
          const isToday = key === targetKey;
          return (
            <div
              key={key}
              className={`rounded-md border px-1 py-1 text-center ${isToday ? "border-primary/50 bg-primary/12" : "border-border/40 bg-card/20"}`}
            >
              <div className="text-[8px] font-mono text-muted-foreground uppercase">{day.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}</div>
              <div className={`text-[10px] font-mono ${isToday ? "text-primary" : "text-foreground/80"}`}>{day.getDate()}</div>
              <div className="text-[8px] font-mono mt-0.5 text-muted-foreground">{isToday ? (allClaimed ? "done" : "live") : "-"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SeasonMissionRow = ({
  title,
  description,
  progressLabel,
  rewardLabel,
  completed,
  claimed,
  busy,
  onClaim,
}: {
  title: string;
  description: string;
  progressLabel: string;
  rewardLabel: string;
  completed: boolean;
  claimed: boolean;
  busy: boolean;
  onClaim: () => void;
}) => {
  const canClaim = completed && !claimed && !busy;

  return (
    <div className="rounded-lg border border-border/50 bg-background/40 px-3 py-2 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs font-semibold font-mono text-foreground">{title}</div>
        <div className="text-[10px] text-muted-foreground font-mono">{description}</div>
        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Progress: {progressLabel}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] px-2 py-1 rounded border border-primary/30 bg-primary/10 text-primary font-mono">
          {rewardLabel}
        </span>
        {claimed ? (
          <span className="text-[10px] px-2 py-1 rounded border border-emerald-400/40 bg-emerald-500/10 text-emerald-300 font-mono">
            Claimed
          </span>
        ) : (
          <button
            onClick={onClaim}
            disabled={!canClaim}
            className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${canClaim ? "border-primary/40 text-primary hover:bg-primary/10" : "border-border/50 text-muted-foreground/60 cursor-not-allowed"}`}
          >
            {busy ? "Claiming..." : "Claim"}
          </button>
        )}
      </div>
    </div>
  );
};

export default SeasonPassPanel;
