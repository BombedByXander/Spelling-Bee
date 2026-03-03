import { supabase } from "@/integrations/supabase/client";

const REPLAY_BUFFER_KEY = "spelldown-replay-buffer-v1";

export interface ReplayEvent {
  at: number;
  mode: string;
  prompt: string;
  typed: string;
  correct: boolean;
  elapsedMs: number;
}

const safeParse = (raw: string | null): ReplayEvent[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getReplayBuffer = (): ReplayEvent[] => {
  return safeParse(localStorage.getItem(REPLAY_BUFFER_KEY));
};

export const recordReplayEvent = (event: Omit<ReplayEvent, "at">) => {
  const current = getReplayBuffer();
  const next = [...current, { ...event, at: Date.now() }].slice(-300);
  localStorage.setItem(REPLAY_BUFFER_KEY, JSON.stringify(next));
};

export const clearReplayBuffer = () => {
  localStorage.removeItem(REPLAY_BUFFER_KEY);
};

const randomShareCode = () => {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
};

export const createReplayShareLink = async (authorId?: string) => {
  const events = getReplayBuffer();
  if (events.length === 0) {
    throw new Error("No replay events captured yet.");
  }

  const attempts = events.length;
  const correctCount = events.filter((event) => event.correct).length;
  const accuracy = attempts > 0 ? Math.round((correctCount / attempts) * 10000) / 100 : 0;
  const latestMode = events[events.length - 1]?.mode ?? "unknown";

  const shareCode = randomShareCode();
  const summary = {
    attempts,
    correctCount,
    accuracy,
    firstAt: events[0]?.at ?? null,
    lastAt: events[events.length - 1]?.at ?? null,
  };

  const { error } = await (supabase as any)
    .from("run_replays")
    .insert({
      share_code: shareCode,
      author_id: authorId ?? null,
      mode: latestMode,
      summary,
      events,
    });

  if (error) {
    throw new Error(error.message || "Failed to create replay link.");
  }

  return `${window.location.origin}/replay/${shareCode}`;
};
