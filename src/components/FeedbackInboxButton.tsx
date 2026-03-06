import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Inbox, ThumbsDown, ThumbsUp, Trash2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";

const FEEDBACK_VOTER_KEY = "spelldown-feedback-voter-key";

interface FeedbackEntry {
  id: string;
  created_at: string;
  user_id: string | null;
  display_name: string | null;
  message: string;
  category?: string | null;
}

interface FeedbackVote {
  feedback_id: string;
  voter_key: string;
  vote_type: "up" | "down";
}

interface Props {
  isAdmin?: boolean;
  inline?: boolean;
}

const getOrCreateVoterKey = () => {
  const existing = localStorage.getItem(FEEDBACK_VOTER_KEY);
  if (existing) return existing;
  const generated = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `voter-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(FEEDBACK_VOTER_KEY, generated);
  return generated;
};

const FeedbackInboxButton = ({ isAdmin = false, inline = false }: Props) => {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [votes, setVotes] = useState<FeedbackVote[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingVoteId, setSavingVoteId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState("");
  const [savingEditId, setSavingEditId] = useState<string | null>(null);

  const voterKey = useMemo(() => getOrCreateVoterKey(), []);

  const scoreByFeedback = useMemo(() => {
    const map: Record<string, { up: number; down: number }> = {};
    for (const vote of votes) {
      if (!map[vote.feedback_id]) map[vote.feedback_id] = { up: 0, down: 0 };
      if (vote.vote_type === "up") map[vote.feedback_id].up += 1;
      else map[vote.feedback_id].down += 1;
    }
    return map;
  }, [votes]);

  const myVoteByFeedback = useMemo(() => {
    const map: Record<string, "up" | "down" | null> = {};
    for (const vote of votes) {
      if (vote.voter_key === voterKey) map[vote.feedback_id] = vote.vote_type;
    }
    return map;
  }, [votes, voterKey]);

  const loadBoard = async () => {
    setLoading(true);
    setError(null);

    const [{ data: feedbackData, error: feedbackError }, { data: voteData, error: voteError }] = await Promise.all([
      supabase
        .from("feedback_submissions")
        .select("id, created_at, user_id, display_name, message, category")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("feedback_votes")
        .select("feedback_id, voter_key, vote_type")
        .limit(5000),
    ]);

    if (feedbackError || voteError) {
      setLoading(false);
      setError("Could not load feedback inbox right now.");
      return;
    }

    setEntries((feedbackData ?? []) as FeedbackEntry[]);
    setVotes((voteData ?? []) as FeedbackVote[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    loadBoard();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const inboxChannel = supabase
      .channel("feedback-inbox-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedback_submissions" },
        () => {
          void loadBoard();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedback_votes" },
        () => {
          void loadBoard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inboxChannel);
    };
  }, [open]);

  const handleVote = async (feedbackId: string, nextVote: "up" | "down") => {
    if (savingVoteId) return;
    setSavingVoteId(feedbackId);
    setError(null);

    const currentVote = myVoteByFeedback[feedbackId] ?? null;

    const { error: deleteError } = await supabase
      .from("feedback_votes")
      .delete()
      .eq("feedback_id", feedbackId)
      .eq("voter_key", voterKey);

    if (deleteError) {
      setSavingVoteId(null);
      setError("Could not update vote right now.");
      return;
    }

    if (currentVote !== nextVote) {
      const { error: insertError } = await supabase
        .from("feedback_votes")
        .insert({
          feedback_id: feedbackId,
          voter_key: voterKey,
          vote_type: nextVote,
        });

      if (insertError) {
        setSavingVoteId(null);
        setError("Could not update vote right now.");
        return;
      }
    }

    await loadBoard();
    setSavingVoteId(null);
  };

  const handleDelete = async (feedbackId: string) => {
    if (!isAdmin) return;
    if (!window.confirm("Delete this feedback globally?")) return;

    const { error: deleteError } = await supabase
      .from("feedback_submissions")
      .delete()
      .eq("id", feedbackId);

    if (deleteError) {
      setError("Could not delete feedback.");
      return;
    }

    if (expandedId === feedbackId) setExpandedId(null);
    await loadBoard();
  };

  const handleStartEdit = (entry: FeedbackEntry) => {
    setEditingEntryId(entry.id);
    setEditingMessage(entry.message);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditingMessage("");
  };

  const handleSaveEdit = async (feedbackId: string) => {
    const nextMessage = editingMessage.trim();
    if (!nextMessage) {
      setError("Feedback message cannot be empty.");
      return;
    }

    setSavingEditId(feedbackId);

    const { error: updateError } = await supabase
      .from("feedback_submissions")
      .update({ message: nextMessage })
      .eq("id", feedbackId);

    if (updateError) {
      setSavingEditId(null);
      setError("Could not update feedback.");
      return;
    }

    setEntries((previous) =>
      previous.map((entry) => (entry.id === feedbackId ? { ...entry, message: nextMessage } : entry))
    );
    setSavingEditId(null);
    setEditingEntryId(null);
    setEditingMessage("");
  };

  const modal = open ? (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/70 backdrop-blur-sm px-4" onClick={() => setOpen(false)}>
      <div className="bg-card border border-border rounded-2xl p-5 max-w-2xl w-full max-h-[86vh] overflow-hidden relative flex flex-col" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close feedback inbox"
        >
          <X size={16} />
        </button>

        <h3 className="text-lg font-extrabold font-mono text-primary text-glow tracking-tight">Feedback Inbox</h3>
        <p className="mt-1 text-xs text-muted-foreground font-mono">Everyone can vote and expand entries to read more.</p>

        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

        <div className="mt-4 border-t border-border pt-3 overflow-y-auto space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading feedback...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No feedback yet.</p>
          ) : (
            entries.map((entry) => {
              const score = scoreByFeedback[entry.id] ?? { up: 0, down: 0 };
              const myVote = myVoteByFeedback[entry.id] ?? null;
              const expanded = expandedId === entry.id;
              const isEditing = editingEntryId === entry.id;
              const sender = entry.display_name || (entry.user_id ? "User" : "Guest");
              const dateLabel = new Date(entry.created_at).toLocaleString();

              return (
                <div key={entry.id} className="rounded-lg border border-border/60 bg-card/60 p-3">
                  <button
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{sender} {entry.category ? (<span className="ml-2 text-sm">{entry.category === 'bug' ? '🪲' : entry.category === 'critical' ? '❕' : '💬'}</span>) : null}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{dateLabel}</p>
                      </div>
                      <div className="inline-flex items-center gap-2 text-muted-foreground">
                        <span className="text-[11px] font-mono">{score.up - score.down}</span>
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="mt-2">
                        <textarea
                          value={editingMessage}
                          onChange={(event) => setEditingMessage(event.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground"
                        />
                      </div>
                    ) : (
                      <p className={`mt-2 text-sm text-foreground ${expanded ? "whitespace-pre-wrap" : "line-clamp-2"}`}>
                        {entry.message}
                      </p>
                    )}
                  </button>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleVote(entry.id, "up")}
                        disabled={savingVoteId === entry.id}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border transition-colors ${
                          myVote === "up"
                            ? "border-primary text-primary bg-primary/10"
                            : "border-border text-muted-foreground hover:text-primary hover:border-primary"
                        }`}
                      >
                        <ThumbsUp size={12} /> {score.up}
                      </button>
                      <button
                        onClick={() => handleVote(entry.id, "down")}
                        disabled={savingVoteId === entry.id}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border transition-colors ${
                          myVote === "down"
                            ? "border-destructive text-destructive bg-destructive/10"
                            : "border-border text-muted-foreground hover:text-destructive hover:border-destructive"
                        }`}
                      >
                        <ThumbsDown size={12} /> {score.down}
                      </button>
                    </div>

                    {isAdmin && (
                      <div className="inline-flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(entry.id)}
                              disabled={savingEditId === entry.id}
                              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border border-primary/70 text-primary hover:bg-primary/10 transition-colors disabled:opacity-60"
                            >
                              {savingEditId === entry.id ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border border-border text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(entry)}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border border-primary/70 text-primary hover:bg-primary/10 transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border border-destructive/70 text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`${inline ? "" : "fixed bottom-5 left-5 z-20 "}inline-flex items-center gap-2 px-3 py-2 rounded-full bg-card/70 border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors`}
        aria-label="Open feedback inbox"
        title="Feedback Inbox"
      >
        <Inbox size={16} />
        <span className="text-[11px] font-mono font-semibold tracking-wide">Inbox</span>
      </button>
      {typeof document !== "undefined" && modal ? createPortal(modal, document.body) : null}
    </>
  );
};

export default FeedbackInboxButton;
