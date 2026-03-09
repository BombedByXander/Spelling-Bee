import { useEffect, useMemo, useState } from "react";
import { MessageSquarePlus, X } from "lucide-react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";

const PROFANITY_REGEX = /\b(fuck|fucking|shit|bitch|asshole|bastard|dick|pussy|cunt|motherfucker|nigga|nigger|kike|faggot|cracker|cock|penis)\b/i;

interface Props {
  userId?: string;
  inline?: boolean;
}

const FeedbackButton = ({ userId, inline = false }: Props) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [fetchedDisplayName, setFetchedDisplayName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState<"bug" | "critical" | "feedback">("feedback");

  const CATEGORY_EMOJI: Record<string, string> = {
    bug: "🪲",
    critical: "❕",
    feedback: "💬",
  };

  const trimmedMessage = useMemo(() => message.trim(), [message]);
  const hasProfanity = useMemo(() => PROFANITY_REGEX.test(trimmedMessage), [trimmedMessage]);

  const resetAndClose = () => {
    setOpen(false);
    setMessage("");
    // keep fetched display name for next open, but clear manual input
    setDisplayName("");
    setError(null);
    setSuccess(false);
  };

  useEffect(() => {
    if (!open) return;
    if (!userId) return;

    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();
        if (error) return;
        const d = data as Record<string, unknown> | null;
        const name = d && typeof d["display_name"] === "string" ? String(d["display_name"]) : null;
        if (mounted) setFetchedDisplayName(name);
        if (name && !displayName) setDisplayName(name);
      } catch (e) {
        void e;
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, userId]);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    if (trimmedMessage.length < 6) {
      setError("Please enter at least 6 characters.");
      return;
    }

    if (trimmedMessage.length > 600) {
      setError("Feedback is too long (max 600 characters).");
      return;
    }

    if (hasProfanity) {
      setError("Please remove curses before sending.");
      return;
    }

    setSubmitting(true);

    const sender = displayName.trim() || (userId ? fetchedDisplayName || "Signed-in user" : "Guest");

    // Try to insert with category; if DB doesn't have column, fall back to inserting without it
    setSubmitting(true);
    let insertError: unknown = null;
    try {
      type FeedbackPayload = { message: string; display_name: string; user_id: string | null; category: "bug" | "critical" | "feedback" };
      const payload: FeedbackPayload = {
        message: trimmedMessage,
        display_name: sender,
        user_id: userId ?? null,
        category: category,
      };
      const res = await supabase.from("feedback_submissions").insert(payload);
      insertError = res.error;
      // If unknown column error, retry without category
      const ie = insertError as Record<string, unknown> | null;
      const ieMsg = ie && typeof ie["message"] === "string" ? String(ie["message"]).toLowerCase() : "";
      if (ie && /column .*category/.test(ieMsg)) {
        const fallback = await supabase
          .from("feedback_submissions")
          .insert({ message: trimmedMessage, display_name: sender, user_id: userId ?? null });
        insertError = fallback.error;
      }
    } catch (e) {
      insertError = e as unknown;
    }

    setSubmitting(false);

    if (insertError) {
      const ie = insertError as Record<string, unknown> | null;
      const errCode = ie && typeof ie["code"] === "string" ? String(ie["code"]) : "";
      const errMessage = ie && typeof ie["message"] === "string" ? String(ie["message"]).toLowerCase() : "";

      if (errCode === "42P01" || errMessage.includes("feedback_submissions")) {
        setError("Feedback table is not ready yet. Admin needs to run the latest database migration.");
      } else if (errCode === "42501") {
        setError("Feedback permissions are not configured yet. Admin needs to run the latest database migration.");
      } else {
        setError(`Could not submit feedback right now. (${(ie && String(ie["message"])) || "Unknown error"})`);
      }
      console.error("Feedback submit failed:", insertError);
      return;
    }

    setSuccess(true);
    setMessage("");
  };

  const modal = open ? (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/70 backdrop-blur-sm px-4" onClick={resetAndClose}>
      <div className="bg-card border border-border rounded-2xl p-5 max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={resetAndClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close feedback"
        >
          <X size={16} />
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-extrabold font-mono text-primary text-glow tracking-tight">Send Feedback</h3>
            <p className="mt-1 text-xs text-muted-foreground font-mono">No curses allowed.</p>
          </div>
          <div className="text-sm text-muted-foreground font-mono flex items-center gap-2">
            <span className="text-xl">{CATEGORY_EMOJI[category]}</span>
            <span className="text-xs">{displayName || fetchedDisplayName || (userId ? "Signed-in user" : "Guest")}</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCategory("bug")}
              type="button"
              className={`px-2 py-1 rounded-full text-sm ${category === "bug" ? "bg-primary/15 border border-primary text-primary" : "bg-card/50 border border-border text-muted-foreground"}`}
            >
              🪲 Bug
            </button>
            <button
              onClick={() => setCategory("critical")}
              type="button"
              className={`px-2 py-1 rounded-full text-sm ${category === "critical" ? "bg-primary/15 border border-primary text-primary" : "bg-card/50 border border-border text-muted-foreground"}`}
            >
              ❕ Critical
            </button>
            <button
              onClick={() => setCategory("feedback")}
              type="button"
              className={`px-2 py-1 rounded-full text-sm ${category === "feedback" ? "bg-primary/15 border border-primary text-primary" : "bg-card/50 border border-border text-muted-foreground"}`}
            >
              💬 Feedback
            </button>
          </div>
            <label className="block text-xs text-muted-foreground font-mono">
            Name (optional)
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
                className="mt-1 w-full rounded-full border border-border bg-card/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              placeholder="Anonymous"
            />
          </label>

            <label className="block text-xs text-muted-foreground font-mono">
            Feedback
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={600}
              rows={5}
                className="mt-1 w-full resize-none rounded-xl border border-border bg-card/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              placeholder="Tell us what to improve..."
            />
          </label>

          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>{trimmedMessage.length}/600</span>
            {hasProfanity && <span className="text-destructive">Remove curses to submit</span>}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
          {success && <p className="text-xs text-primary">Feedback posted. Thanks!</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-2.5 rounded-xl font-mono text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
          >
            {submitting ? "Posting..." : "Post Feedback"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`${inline ? "" : "fixed bottom-5 left-5 z-20 "}inline-flex items-center gap-2 px-3 py-2 rounded-full bg-card/70 border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors`}
        aria-label="Open feedback"
        title="Feedback"
      >
        <MessageSquarePlus size={16} />
        <span className="text-[11px] font-mono font-semibold tracking-wide">Feedback</span>
      </button>
      {typeof document !== "undefined" && modal ? createPortal(modal, document.body) : null}
    </>
  );
};

export default FeedbackButton;
