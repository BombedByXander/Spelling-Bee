import { useState, useEffect } from "react";

interface Props {
  onComplete: () => void;
}

const Intermission = ({ onComplete }: Props) => {
  const [seconds, setSeconds] = useState(7);

  useEffect(() => {
    if (seconds <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, onComplete]);

  const progress = ((7 - seconds) / 8) * 100;

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 gap-8 select-none">
      <h1 className="text-4xl sm:text-6xl font-extrabold font-mono text-primary text-glow tracking-tight">
        Intermission
      </h1>
      <p className="text-muted-foreground text-sm sm:text-base max-w-md text-center leading-relaxed">
        Type the word exactly as shown on screen, see how fast you can type the words without messing up!
      </p>
      <div className="flex flex-col items-center gap-4 mt-4">
        <span className="text-6xl sm:text-8xl font-mono font-black text-foreground tabular-nums">
          {seconds}
        </span>
        <div className="w-48 h-1 rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground tracking-widest uppercase">GET READY!</p>
      </div>
      <button
        onClick={onComplete}
        className="mt-6 text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
      >
        Skip
      </button>
    </div>
  );
};

export default Intermission;
