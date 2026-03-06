import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pause, Play } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ReplayEvent {
  at: number;
  mode: string;
  prompt: string;
  typed: string;
  correct: boolean;
  elapsedMs: number;
}

const ReplayViewer = () => {
  const { shareCode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState("unknown");
  const [summary, setSummary] = useState<any>(null);
  const [events, setEvents] = useState<ReplayEvent[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const { data, error: replayError } = await (supabase as any)
        .from("run_replays")
        .select("mode, summary, events")
        .eq("share_code", shareCode)
        .maybeSingle();

      if (replayError || !data) {
        setError("Replay not found.");
        setLoading(false);
        return;
      }

      setMode(data.mode || "unknown");
      setSummary(data.summary || null);
      setEvents(Array.isArray(data.events) ? data.events : []);
      setIndex(0);
      setLoading(false);
    };

    if (shareCode) load();
  }, [shareCode]);

  useEffect(() => {
    if (!playing || events.length === 0) return;
    const timer = window.setInterval(() => {
      setIndex((current) => {
        if (current >= events.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [playing, events.length]);

  const activeEvent = useMemo(() => events[index] ?? null, [events, index]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-card/60 border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"><ArrowLeft size={16} /></button>
          <h1 className="text-2xl font-extrabold font-mono text-primary text-glow tracking-tight">Replay Viewer</h1>
          <Link to="/" className="ml-auto text-xs font-mono text-muted-foreground hover:text-primary">Home</Link>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading replay...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <>
            <div className="rounded-xl border border-border/60 bg-card/60 p-4">
              <p className="text-xs font-mono text-muted-foreground uppercase">Mode</p>
              <p className="text-lg font-bold mt-1">{mode}</p>
              <p className="text-xs text-muted-foreground mt-2">Attempts: {summary?.attempts ?? events.length} · Accuracy: {summary?.accuracy ?? 0}%</p>
            </div>

            <div className="mt-4 rounded-xl border border-border/60 bg-card/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">Event {events.length ? index + 1 : 0} / {events.length}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPlaying((v) => !v)} disabled={events.length === 0} className="p-2 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary disabled:opacity-50">
                    {playing ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                </div>
              </div>

              {activeEvent ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-muted-foreground font-mono uppercase">Prompt</p>
                  <p className="text-lg font-mono">{activeEvent.prompt}</p>
                  <p className="text-xs text-muted-foreground font-mono uppercase mt-3">Typed</p>
                  <p className={`text-sm font-mono ${activeEvent.correct ? "text-primary" : "text-destructive"}`}>{activeEvent.typed || "(empty)"}</p>
                  <p className="text-xs text-muted-foreground mt-3">Elapsed: {(Number(activeEvent.elapsedMs || 0) / 1000).toFixed(2)}s</p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No events in this replay yet.</p>
              )}

              <input
                className="mt-4 w-full"
                type="range"
                min={0}
                max={Math.max(0, events.length - 1)}
                value={index}
                onChange={(e) => setIndex(Number(e.target.value))}
                disabled={events.length === 0}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReplayViewer;
