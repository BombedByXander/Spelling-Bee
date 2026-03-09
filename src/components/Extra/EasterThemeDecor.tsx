import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Egg, Rabbit } from "lucide-react";
import { EASTER_BUNNY_BOUNCE_KEY, EASTER_BUNNY_TOGGLE_EVENT } from "@/lib/theme";

const EGG_POSITIONS = [
  { left: "8%", bottom: "11%", rotate: "-8deg", delay: "0s" },
  { left: "16%", bottom: "17%", rotate: "5deg", delay: "0.4s" },
  { left: "27%", bottom: "9%", rotate: "-12deg", delay: "0.8s" },
  { left: "74%", bottom: "8%", rotate: "7deg", delay: "0.2s" },
  { left: "84%", bottom: "13%", rotate: "-6deg", delay: "0.55s" },
  { left: "92%", bottom: "9%", rotate: "10deg", delay: "0.95s" },
];

const EasterThemeDecor = () => {
  const [bunnyBounceEnabled, setBunnyBounceEnabled] = useState(
    () => localStorage.getItem(EASTER_BUNNY_BOUNCE_KEY) === "true"
  );

  useEffect(() => {
    const sync = () => {
      setBunnyBounceEnabled(localStorage.getItem(EASTER_BUNNY_BOUNCE_KEY) === "true");
    };

    window.addEventListener("storage", sync);
    window.addEventListener(EASTER_BUNNY_TOGGLE_EVENT, sync as EventListener);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EASTER_BUNNY_TOGGLE_EVENT, sync as EventListener);
    };
  }, []);

  const toggleSecretEgg = () => {
    const next = !bunnyBounceEnabled;
    localStorage.setItem(EASTER_BUNNY_BOUNCE_KEY, String(next));
    setBunnyBounceEnabled(next);
    window.dispatchEvent(new CustomEvent(EASTER_BUNNY_TOGGLE_EVENT));

    if (next) {
      toast.success("Bunny bounce enabled", {
        description: "Secret egg activated. Your word now hops like a bunny.",
      });
    } else {
      toast("Bunny bounce disabled", {
        description: "Secret egg toggled off.",
      });
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[24] overflow-hidden" aria-hidden="true">
      <div className="absolute left-[11%] bottom-[7%] easter-bunny-bob text-primary/90 drop-shadow-[0_10px_30px_rgba(255,179,218,0.35)]">
        <Rabbit size={68} strokeWidth={2.2} />
      </div>

      {EGG_POSITIONS.map((egg) => (
        <span
          key={`${egg.left}-${egg.bottom}`}
          className="absolute easter-egg-float text-primary/80 drop-shadow-[0_0_10px_rgba(255,212,121,0.25)]"
          style={{
            left: egg.left,
            bottom: egg.bottom,
            ["--egg-rotate" as string]: egg.rotate,
            animationDelay: egg.delay,
          }}
        >
          <Egg size={24} strokeWidth={2.1} />
        </span>
      ))}

      <button
        type="button"
        onClick={toggleSecretEgg}
        className={`pointer-events-auto absolute right-[13%] bottom-[17%] p-1 rounded-full transition-transform duration-200 hover:scale-105 active:scale-95 ${
          bunnyBounceEnabled ? "easter-secret-egg-on" : "easter-secret-egg-off"
        }`}
        title="Secret egg toggle"
        aria-label="Toggle bunny bounce modifier"
      >
        <Egg size={24} strokeWidth={2.1} />
      </button>
    </div>
  );
};

export default EasterThemeDecor;
