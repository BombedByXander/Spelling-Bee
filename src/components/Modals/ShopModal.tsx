import { useEffect, useState } from "react";
import { Check, Lock, Play, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ALL_SOUNDS, SoundPack } from "@/lib/sounds";
import { ALL_FONTS, applyFont, getFontPack } from "@/lib/fonts";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
  userId?: string;
  activeSound: string;
  onSoundChange: (id: string) => void;
  activeFont: string;
  onFontChange: (id: string) => void;
}

const ShopModal = ({
  open,
  onClose,
  userId,
  activeSound,
  onSoundChange,
  activeFont,
  onFontChange,
}: Props) => {
  const [activeTab, setActiveTab] = useState("sounds");
  const [stars, setStars] = useState(0);
  const [purchasedSounds, setPurchasedSounds] = useState<Set<string>>(new Set(["default"]));
  const [purchasedFonts, setPurchasedFonts] = useState<Set<string>>(new Set(["default"]));
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) return;

    const fetchData = async () => {
      const [profileRes, soundRes, fontRes] = await Promise.all([
        supabase.from("profiles").select("stars, active_sound, active_font").eq("id", userId).single(),
        supabase.from("sound_purchases").select("sound_id").eq("user_id", userId),
        supabase.from("font_purchases").select("font_id").eq("user_id", userId),
      ]);

      if (profileRes.data) {
        const row: any = profileRes.data;
        setStars(row.stars ?? 0);
        if (row.active_sound) onSoundChange(row.active_sound);
        if (row.active_font) onFontChange(row.active_font);
      }
      if (soundRes.data) setPurchasedSounds(new Set(["default", ...soundRes.data.map((row: any) => row.sound_id)]));
      if (fontRes.data) setPurchasedFonts(new Set(["default", ...fontRes.data.map((row: any) => row.font_id)]));
    };

    fetchData();
  }, [open, userId, onSoundChange, onFontChange]);

  const handlePurchaseSound = async (sound: SoundPack) => {
    if (!userId) return;
    setLoadingId(`sound-${sound.id}`);
    setMessage(null);

    const { data, error } = await supabase.rpc("purchase_sound", {
      p_sound_id: sound.id,
      p_cost: sound.cost,
    });

    if (error) {
      setMessage(error.message || "Purchase failed");
    } else if (data) {
      setPurchasedSounds((prev) => new Set(prev).add(sound.id));
      setStars((prev) => prev - sound.cost);
      setMessage("Purchased!");
    } else {
      setMessage("Insufficient stars");
    }

    setLoadingId(null);
  };

  const handlePurchaseFont = async (font: (typeof ALL_FONTS)[0]) => {
    if (!userId) return;
    setLoadingId(`font-${font.id}`);
    setMessage(null);

    const { data, error } = await supabase.rpc("purchase_font", {
      p_font_id: font.id,
      p_cost: font.cost,
    });

    if (error) {
      setMessage(error.message || "Purchase failed");
    } else if (data === true || (data && typeof data === "object" && (data as any).ok)) {
      setPurchasedFonts((prev) => new Set(prev).add(font.id));
      setStars((prev) => prev - font.cost);
      setMessage("Purchased!");
    } else {
      setMessage("Insufficient stars");
    }

    setLoadingId(null);
  };

  const handleSelectSound = async (id: string) => {
    if (!userId) return;
    onSoundChange(id);
    const selected = ALL_SOUNDS.find((sound) => sound.id === id);
    selected?.play();
    await supabase.from("profiles").update({ active_sound: id }).eq("id", userId);
  };

  const handleSelectFont = async (id: string) => {
    if (!userId) return;
    const fontPack = getFontPack(id);
    applyFont(fontPack);
    onFontChange(id);
    await supabase.from("profiles").update({ active_font: id }).eq("id", userId);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] mx-4 rounded-2xl bg-card/95 border border-border backdrop-blur-md overflow-hidden flex flex-col min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold font-mono text-primary text-glow tracking-tight">Shop</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">
              ×
            </button>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Star size={12} className="text-[hsl(45_95%_55%)] fill-[hsl(45_95%_55%)]" />
            <span className="text-xs text-muted-foreground font-mono">{stars} stars</span>
          </div>
          {message && <p className="text-xs text-muted-foreground mt-2">{message}</p>}
        </div>

        <div className="flex-1 min-h-0 overflow-hidden px-5 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full min-h-0 flex flex-col">
            <TabsList className="grid grid-cols-2 w-full max-w-sm">
              <TabsTrigger value="sounds">Sound Shop</TabsTrigger>
              <TabsTrigger value="fonts">Font Shop</TabsTrigger>
            </TabsList>

            <TabsContent value="sounds" className="flex-1 min-h-0 overflow-y-auto mt-3 space-y-2 pr-1">
              {!userId && <p className="text-center text-muted-foreground text-xs py-4">Sign in to purchase sounds</p>}
              {ALL_SOUNDS.map((sound) => {
                const owned = purchasedSounds.has(sound.id);
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
                          <button onClick={() => handleSelectSound(sound.id)} className="text-[10px] font-mono px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">Use</button>
                        )
                      ) : (
                        <button
                          onClick={() => handlePurchaseSound(sound)}
                          disabled={!userId || !canAfford || loadingId === `sound-${sound.id}`}
                          className={`text-[10px] font-mono px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                            canAfford
                              ? "bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
                              : "bg-destructive/10 text-destructive/60 cursor-not-allowed"
                          }`}
                        >
                          {!canAfford && <Lock size={10} />}
                          {loadingId === `sound-${sound.id}` ? "..." : `${sound.cost}⭐`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="fonts" className="flex-1 min-h-0 overflow-y-auto mt-3 space-y-2 pr-1">
              {!userId && <p className="text-center text-muted-foreground text-xs py-4">Sign in to purchase fonts</p>}
              {ALL_FONTS.map((font) => {
                const owned = purchasedFonts.has(font.id);
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
                      <div
                        className="mt-1.5 px-2 py-1 rounded bg-card/60 border border-border/40 text-[10px]"
                        style={{
                          fontFamily: font.fontFamily,
                          fontWeight: font.fontWeight,
                          letterSpacing: font.letterSpacing,
                        }}
                      >
                        The quick brown fox
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {owned ? (
                        isActive ? (
                          <span className="p-1.5 text-primary"><Check size={14} /></span>
                        ) : (
                          <button onClick={() => handleSelectFont(font.id)} className="text-[10px] font-mono px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">Use</button>
                        )
                      ) : (
                        <button
                          onClick={() => handlePurchaseFont(font)}
                          disabled={!userId || !canAfford || loadingId === `font-${font.id}`}
                          className={`text-[10px] font-mono px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                            canAfford
                              ? "bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
                              : "bg-destructive/10 text-destructive/60 cursor-not-allowed"
                          }`}
                        >
                          {!canAfford && <Lock size={10} />}
                          {loadingId === `font-${font.id}` ? "..." : `${font.cost}⭐`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ShopModal;
