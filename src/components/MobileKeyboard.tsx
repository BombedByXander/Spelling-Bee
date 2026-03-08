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
}

const MobileKeyboard = ({ layout = "qwerty", onKey }: Props) => {
  const rows = KEYBOARDS[layout];

  return (
    <div className="w-full max-w-2xl mx-auto px-1 pb-safe bg-transparent">
      <div className="bg-card/90 border border-border rounded-xl p-2 space-y-2">
        {rows.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-2">
            {row.map((k) => (
              <button
                key={k}
                onClick={() => onKey(k)}
                className="flex-0 px-3 py-2 rounded-md bg-card/60 border border-border text-sm font-mono text-foreground hover:bg-primary/10"
              >
                {k}
              </button>
            ))}
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
