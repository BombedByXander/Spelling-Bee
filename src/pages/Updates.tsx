import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RELEASE_VERSION } from "@/lib/release";

const Updates = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-card/60 border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            title="Back"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-extrabold font-mono text-primary text-glow tracking-tight">Update Log</h1>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h2 className="text-lg font-extrabold font-mono text-primary text-glow tracking-tight">v{RELEASE_VERSION}</h2>
              {/* v26.09.8 is the current version */}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            "Hold up, whats up with the weird version number?!" you may say. This project now uses a date-based versioning system because it fits the live release cycle better.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The new system is pretty simple, and is based on the date. First number is the year, second is the week number and third is the version.
          </p>

          <div>
            <p className="text-xs text-muted-foreground font-mono">Important changes:</p>
            <ul className="mt-2 space-y-2 text-sm text-foreground">
              <li>• Theme Engine 2.0 added for stronger ambient gradients, glow intensity, and motion depth.</li>
              <li>• Added Holographic UI Layer toggle for glass/chromatic panel styling.</li>
              <li>• Added Dynamic Environment toggle that tints the game based on your local time of day.</li>
              <li>• Referral system improved: random reliable code generation + redeem stability.</li>
              <li>• Referral rewards increased: both players now earn 10,000 XP per valid redeem.</li>
              <li>• Level 50+ players can now set a custom referral code.</li>
              <li>• Added “Allow Homophones” setting under Typing Difficulty (homophone-only mode).</li>
              <li>• Added 5 new working Funbox modifiers: leet, no vowels, pig latin, spaced out, vowel shift.</li>
              <li>• Raw WPM tracking updated for more accurate live/final values.</li>
              <li>• Added Guesser modifier with mode-specific behavior and dot masking patterns.</li>
              <li>• Added Easter Garden theme visuals plus secret bunny-bounce word effect toggle.</li>
              <li>• Added update-available refresh banner with confetti and preview trigger support.</li>
              <li>• Added new Animated theme tab with 60 dedicated animated-only presets.</li>
              <li>• Increased readability: gameplay word size +1px, live WPM/streak size +2px.</li>
              <li>• Settings navigation redesigned to section-focused view for less clutter.</li>
              <li>• Added gameplay Round Transition Delay setting (250–3000ms + quick presets).</li>
              <li>• Added Danger Zone tools: Reset Gameplay Settings + Reset All Local Settings.</li>
              <li>• Added monkeytype-style Randomize Theme modes (favorite/light/dark/auto/custom) that rotate after each completed word.</li>
            </ul>
          </div>

          <div>
            <p className="text-xs text-muted-foreground font-mono">Bug fixes:</p>
            <ul className="mt-2 space-y-2 text-sm text-foreground">
              <li>• Live feedback now correctly matches all active modifiers across all game modes.</li>
              <li>• Backwards modifier now accepts proper capitalization when typed exactly.</li>
              <li>• Theme symbol endings from Aurora Vault to Frost Shrine now render seamlessly.</li>
              <li>• Guesser display is now consistent between normal and blackout word rendering.</li>
              <li>• WPM now uses monkeytype-style net calculation so typing errors lower reported speed.</li>
              <li>• Net WPM logic is now consistent across all game modes and final/live reads.</li>
              <li>• Admin Panel now supports assigning admin/moderator roles for authorized users.</li>
              <li>• Clan creation now enforces 4-letter max clan tags.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Updates;
