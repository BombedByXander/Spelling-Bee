import { useState, useEffect } from "react";
import { X, Check, Lock, Star } from "lucide-react";
import { ALL_FONTS, getFontPack, applyFont } from "@/lib/fonts";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
  userId?: string;
  activeFont: string;
  onFontChange: (id: string) => void;
}

const FontShop = ({ open, onClose, userId, activeFont, onFontChange }: Props) => {
  const [purchased, setPurchased] = useState<Set<string>>(new Set(["default"]));
  const [stars, setStars] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) return;
    const fetchData = async () => {
      try {
        const profileQuery = supabase.from("profiles").select("stars").eq("id", userId).single();
        const purchasesQuery = supabase.from<{ font_id: string }>("font_purchases").select("font_id").eq("user_id", userId);
        const [profileRes, purchasesRes] = await Promise.all([profileQuery, purchasesQuery]);
        if (profileRes.error) {
          console.error("Error fetching profile for font shop:", profileRes.error);
        }
        if (profileRes.data && typeof profileRes.data.stars === "number") {
          setStars(profileRes.data.stars);
        }
        if (purchasesRes.error) {
          console.error("Error fetching font purchases:", purchasesRes.error);
        }
        if (purchasesRes.data) {
          setPurchased(new Set(["default", ...purchasesRes.data.map((p) => p.font_id)]));
        }
      } catch (e) {
        console.error("Unexpected error in FontShop fetchData", e);
      }
    };
    fetchData();
  }, [open, userId]);

  const handlePurchase = async (font: (typeof ALL_FONTS)[0]) => {
    if (!userId) return;
    setLoading(font.id);
    try {
      const { data, error } = await supabase.rpc<boolean | { ok?: boolean }>("purchase_font", { p_font_id: font.id, p_cost: font.cost });
      if (error) {
        console.error("purchase_font RPC error:", error);
        setMessage(error.message || "Purchase failed");
      } else if (data === true) {
        setPurchased(p => new Set(p).add(font.id));
        setStars(s => s - font.cost);
        setMessage("Purchased!");
      } else if (data === false) {
        setMessage("Insufficient stars");
        } else {
          // unexpected response; try graceful fallback
          if (data && typeof data === "object" && 'ok' in data && (data as { ok?: boolean }).ok) {
            setPurchased(p => new Set(p).add(font.id));
            setStars(s => s - font.cost);
            setMessage("Purchased!");
          } else {
            setMessage("Purchase failed (unexpected response)");
            console.error("purchase_font unexpected data:", data);
          }
      }
    } catch (e) {
      console.error(e);
      setMessage((e as Error).message || "Purchase error");
    }
    setLoading(null);
  };

  const handleSelect = async (id: string) => {
    if (!userId) return;
    const fontPack = getFontPack(id);
    applyFont(fontPack);
    onFontChange(id);
    await supabase.from("profiles").update({ active_font: id }).eq("id", userId);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md max-h-[80vh] mx-4 rounded-2xl bg-card/95 border border-border backdrop-blur-md overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold font-mono text-primary text-glow tracking-tight">Font Shop</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">×</button>
          </div>
          <div className="flex items-center gap-1 mt-1">
              <Star size={12} className="text-[hsl(45_95%_55%)] fill-[hsl(45_95%_55%)]" />
              <span className="text-xs text-muted-foreground font-mono">{stars} stars</span>
            </div>
          {message && (
            <div className="px-3 py-2">
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {!userId && (
            <p className="text-center text-muted-foreground text-xs py-4">Sign in to purchase fonts</p>
          )}
          {ALL_FONTS.map(font => {
            const owned = purchased.has(font.id);
            const isActive = activeFont === font.id;
            const canAfford = stars >= font.cost;

            return (
              <div key={font.id} className={`flex items-center justify-between py-3 px-3 rounded-xl border transition-all ${isActive ? "border-primary/40 bg-primary/5" : "border-border/50 bg-card/30"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{font.name}</span>
                    {isActive && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-mono">ACTIVE</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{font.description}</p>
                  <div className="mt-1.5 px-2 py-1 rounded bg-card/60 border border-border/40 text-[10px]" style={{ ...JSON.parse(`{"fontFamily":"${font.fontFamily}","fontWeight":"${font.fontWeight}","letterSpacing":"${font.letterSpacing}"}`) }}>
                    The quick brown fox
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  {owned ? (
                    isActive ? (
                      <span className="p-1.5 text-primary"><Check size={14} /></span>
                    ) : (
                      <button onClick={() => handleSelect(font.id)} className="text-[10px] font-mono px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">Use</button>
                    )
                  ) : (
                    <button
                      onClick={() => handlePurchase(font)}
                      disabled={!canAfford || loading === font.id}
                      className={`text-[10px] font-mono px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                        canAfford
                          ? "bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
                          : "bg-destructive/10 text-destructive/60 cursor-not-allowed flex items-center gap-1"
                      }`}
                    >
                      {!canAfford && <Lock size={10} />}
                      {loading === font.id ? "..." : `${font.cost}⭐`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FontShop;
