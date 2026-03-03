import { useMemo, useState } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const trimmedMessage = useMemo(() => message.trim(), [message]);
  const hasProfanity = useMemo(() => PROFANITY_REGEX.test(trimmedMessage), [trimmedMessage]);

  const resetAndClose = () => {
    setOpen(false);
    setMessage("");
    setDisplayName("");
    setError(null);
    setSuccess(false);
  };

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

    const sender = displayName.trim() || (userId ? "Signed-in user" : "Guest");
    const { error: insertError } = await supabase
      .from("feedback_submissions")
      .insert({
        message: trimmedMessage,
        display_name: sender,
        user_id: userId ?? null,
      });

    setSubmitting(false);

    if (insertError) {
      const errCode = insertError.code || "";
      const errMessage = (insertError.message || "").toLowerCase();

      if (errCode === "42P01" || errMessage.includes("feedback_submissions")) {
        setError("Feedback table is not ready yet. Admin needs to run the latest database migration.");
      } else if (errCode === "42501") {
        setError("Feedback permissions are not configured yet. Admin needs to run the latest database migration.");
      } else {
        setError(`Could not submit feedback right now. (${insertError.message || "Unknown error"})`);
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

        <h3 className="text-lg font-extrabold font-mono text-primary text-glow tracking-tight">Send Feedback</h3>
        <p className="mt-1 text-xs text-muted-foreground font-mono">No curses allowed.</p>

        <div className="mt-4 space-y-3">
          <label className="block text-xs text-muted-foreground font-mono">
            Name (optional)
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              className="mt-1 w-full rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
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
              className="mt-1 w-full resize-none rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
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
