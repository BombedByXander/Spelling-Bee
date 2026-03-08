import React from "react";

export type KeyboardLayout = "qwerty" | "azerty" | "dvorak" | "colemak";

const KEYBOARDS: Record<KeyboardLayout, string[][]> = {
  qwerty: [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ],
  azerty: [
    ["A", "Z", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["Q", "S", "D", "F", "G", "H", "J", "K", "L", "M"],
    ["W", "X", "C", "V", "B", "N"],
  ],
  dvorak: [
    ["'", ",", ".", "P", "Y", "F", "G", "C", "R", "L"],
    ["A", "O", "E", "U", "I", "D", "H", "T", "N", "S"],
    [";", "Q", "J", "K", "X", "B", "Z"],
  ],
  colemak: [
    ["Q", "W", "F", "P", "B", "J", "L", "U", "Y", ";"],
    ["A", "R", "S", "T", "G", "M", "N", "E", "I", "O"],
    ["Z", "X", "C", "D", "V", "K", "H"],
  ],
};

interface Props {
  layout?: KeyboardLayout;
  onKey: (key: string) => void;
  lastKey?: string | null;
  theFilesActive?: boolean;
}

const MobileKeyboard = ({ layout = "qwerty", onKey }: Props) => {
  const rows = KEYBOARDS[layout];
  const [flashKey, setFlashKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!lastKey) return;
    setFlashKey(lastKey.toUpperCase());
    const t = setTimeout(() => setFlashKey(null), 150);
    return () => clearTimeout(t);
  }, [lastKey]);

  return (
    <div className="w-full max-w-2xl mx-auto px-1 pb-safe bg-transparent">
      <div className="bg-card/90 border border-border rounded-xl p-2 space-y-2">
        {rows.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-2">
            {row.map((k) => {
              const isLetter = /[A-Z0-9]/i.test(k);
              const isFlash = flashKey === k.toUpperCase();
              return (
                <button
                  key={k}
                  onClick={() => onKey(k)}
                  className={`px-3 py-2 rounded-[10px] text-sm font-mono transition-all duration-100 transform-gpu will-change-transform border ${
                    isFlash
                      ? "bg-primary/90 text-primary-foreground border-primary shadow-md shadow-primary/40 scale-[1.04]"
                      : "bg-card/55 border-border/40 text-muted-foreground/65"
                  }`}
                >
                  {theFilesActive && isLetter ? <span style={{ color: "#000" }}>■</span> : k.toLowerCase()}
                </button>
              );
            })}
          </div>
        ))}

        <div className="flex justify-center gap-2">
          <button onClick={() => onKey("BACKSPACE")} className="px-4 py-2 rounded-md bg-destructive/10 border border-destructive text-sm font-mono">⌫</button>
          <button onClick={() => onKey("SPACE")} className="px-6 py-2 rounded-md bg-card/60 border border-border text-sm font-mono">Space</button>
          <button onClick={() => onKey("ENTER")} className="px-4 py-2 rounded-md bg-primary/10 border border-primary text-sm font-mono">Enter</button>
        </div>
      </div>
    </div>
  );
};

export default MobileKeyboard;
