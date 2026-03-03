import { useNavigate } from "react-router-dom";
import PersonalDashboard from "@/components/PersonalDashboard";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-xl border border-border/40 bg-card/40 p-5">
            <p className="text-sm text-muted-foreground">Sign in to view your dashboard.</p>
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

  return <PersonalDashboard open={true} onClose={() => navigate(-1)} userId={user.id} fullPage />;
};

export default Dashboard;
