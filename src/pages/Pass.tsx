import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import SeasonPassPanel from "@/components/SeasonPassPanel";

const Pass = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border border-border/40 bg-card/40 p-5">
            <p className="text-sm text-muted-foreground">Sign in to use Season Pass.</p>
            <button
              onClick={() => navigate("/auth")}
              className="mt-3 text-xs font-mono px-3 py-1.5 rounded-md border border-primary/50 text-primary hover:bg-primary/10"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold font-mono text-primary text-glow tracking-tight">Season Pass</h1>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
            title="Back"
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        <SeasonPassPanel userId={user.id} />
      </div>
    </div>
  );
};

export default Pass;
