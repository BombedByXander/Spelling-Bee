import { useState } from "react";
import { Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  open: boolean;
  onClose: () => void;
}

const CodesModal = ({ open, onClose }: Props) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { user } = useAuth();

  if (!open) return null;

  const handleRedeem = async () => {
    if (!user) { setMessage("Sign in to redeem codes"); return; }
    if (!code.trim()) return;
    const normalizedCode = code.trim().toUpperCase();
    setLoading(true);
    setMessage(null);
    try {
      let data: unknown = null;
      let error: { message?: string } | null = null;

      const oneArgResult = await (supabase as any).rpc("redeem_promo_code", { p_code: normalizedCode });
      data = oneArgResult?.data;
      error = oneArgResult?.error ?? null;

      if (error?.message?.includes("p_code, p_user")) {
        const twoArgResult = await supabase.rpc("redeem_promo_code", { p_code: normalizedCode, p_user: user.id });
        data = twoArgResult.data;
        error = twoArgResult.error;
      }

      if (error) {
        if (error.message?.includes("schema cache")) {
          setMessage("Redeem function is updating. Try again in a few seconds.");
        } else {
          setMessage(error.message || "Failed to redeem");
        }
      } else if (data && typeof data === "object") {
        const res = data as any;
        if (res.ok) {
          setMessage(`Redeemed! +${res.stars} ⭐`);
          setCode("");
        } else {
          setMessage(res.error || "Could not redeem");
        }
      } else {
        setMessage("Unknown response from server");
      }
    } catch (err) {
      const e = err as Error;
      setMessage(e?.message || "Error");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-sm mx-4 p-5 rounded-2xl bg-card border border-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <Gift className="text-primary" />
          <h3 className="font-bold">Redeem Code</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Enter a promo code to receive stars.</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter code"
          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground mb-3"
        />
        {message && <p className="text-sm text-muted-foreground mb-3">{message}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-muted-foreground">Close</button>
          <button onClick={handleRedeem} disabled={loading || !code.trim()} className="px-3 py-2 bg-primary text-primary-foreground rounded">
            {loading ? "Redeeming..." : "Redeem"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodesModal;
