import { useState, useEffect } from "react";
import { X, Play, Check, Lock, Star } from "lucide-react";
import { ALL_SOUNDS, SoundPack, getSoundPack } from "@/lib/sounds";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
  userId?: string;
  activeSound: string;
  onSoundChange: (id: string) => void;
}

const SoundShop = ({ open, onClose, userId, activeSound, onSoundChange }: Props) => {
  const [purchased, setPurchased] = useState<Set<string>>(new Set(["default"]));
  const [stars, setStars] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) return;
    // Fetch user's stars and purchases
    const fetchData = async () => {
      const [profileRes, purchasesRes] = await Promise.all([
        supabase.from("profiles").select("stars, active_sound").eq("id", userId).single(),
        supabase.from("sound_purchases").select("sound_id").eq("user_id", userId),
      ]);
      if (profileRes.data) {
        setStars(profileRes.data.stars);
      }
      if (purchasesRes.data) {
        setPurchased(new Set(["default", ...purchasesRes.data.map((p: any) => p.sound_id)]));
      }
    };
    fetchData();
  }, [open, userId]);

  const handlePurchase = async (sound: SoundPack) => {
    if (!userId) return;
    setLoading(sound.id);
    const { data } = await supabase.rpc("purchase_sound", { p_sound_id: sound.id, p_cost: sound.cost });
    if (data) {
      setPurchased(p => new Set(p).add(sound.id));
      setStars(s => s - sound.cost);
    }
    setLoading(null);
  };

  const handleSelect = async (id: string) => {
    if (!userId) return;
    onSoundChange(id);
    await supabase.from("profiles").update({ active_sound: id }).eq("id", userId);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md max-h-[80vh] mx-4 rounded-2xl bg-card/95 border border-border backdrop-blur-md overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold font-mono text-primary text-glow tracking-tight">Sound Shop</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">×</button>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Star size={12} className="text-[hsl(45_95%_55%)] fill-[hsl(45_95%_55%)]" />
            <span className="text-xs text-muted-foreground font-mono">{stars} stars</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {!userId && (
            <p className="text-center text-muted-foreground text-xs py-4">Sign in to purchase sounds</p>
          )}
          {ALL_SOUNDS.map(sound => {
            const owned = purchased.has(sound.id);
            const isActive = activeSound === sound.id;
            const canAfford = stars >= sound.cost;

            return (
              <div key={sound.id} className={`flex items-center justify-between py-3 px-3 rounded-xl border transition-all ${isActive ? "border-primary/40 bg-primary/5" : "border-border/50 bg-card/30"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{sound.name}</span>
                    {isActive && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-mono">ACTIVE</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{sound.description}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button onClick={() => sound.play()} className="p-1.5 rounded-full bg-card/60 border border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors" title="Preview">
                    <Play size={12} />
                  </button>
                  {owned ? (
                    isActive ? (
                      <span className="p-1.5 text-primary"><Check size={14} /></span>
                    ) : (
                      <button onClick={() => handleSelect(sound.id)} className="text-[10px] font-mono px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">Use</button>
                    )
                  ) : (
                    <button
                      onClick={() => handlePurchase(sound)}
                      disabled={!userId || !canAfford || loading === sound.id}
                      className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-lg bg-card/60 border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors disabled:opacity-40"
                    >
                      {loading === sound.id ? "..." : (
                        <>
                          <Star size={10} className="text-[hsl(45_95%_55%)]" />
                          {sound.cost}
                        </>
                      )}
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

export default SoundShop;
