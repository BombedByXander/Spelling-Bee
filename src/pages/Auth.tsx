import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import StarryBackground from "@/components/Extra/StarryBackground";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        if (!displayName.trim()) {
          toast({ title: "Display name required", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({ title: "Check your email to confirm your account!" });
      }
    } catch (err: any) {
      toast({ title: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StarryBackground />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold font-mono text-primary text-glow tracking-tight">
              Spelling Bee
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              {isLogin ? "Sign in to track your streaks" : "Create an account to compete"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl font-mono text-sm bg-input/80 border-2 border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:box-glow backdrop-blur-sm transition-all"
                maxLength={20}
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl font-mono text-sm bg-input/80 border-2 border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:box-glow backdrop-blur-sm transition-all"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl font-mono text-sm bg-input/80 border-2 border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:box-glow backdrop-blur-sm transition-all"
              minLength={6}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-mono text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "..." : isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate("/")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
            >
              Play as a guest
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;

