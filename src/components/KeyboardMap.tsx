import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export type KeyboardLayout = "qwerty" | "azerty" | "dvorak" | "colemak";

interface Props {
  lastKey: string | null;
  layout?: KeyboardLayout;
  // size in pixels; if 0 the keyboard is hidden
  size?: number;
}

const KEYBOARDS: Record<KeyboardLayout, string[][]> = {
  qwerty: [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"],
    ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"],
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

const KeyboardMap = ({ lastKey, layout = "qwerty", size = 20 }: Props) => {
  const isMobile = useIsMobile();
  // hide entirely on mobile
  if (isMobile) return null;
  // hide if size explicitly zero
  if (size === 0) return null;
  const [flashKey, setFlashKey] = useState<string | null>(null);

  useEffect(() => {
    if (!lastKey) return;
    const upperKey = lastKey.toUpperCase();
    setFlashKey(upperKey);
    const t = setTimeout(() => setFlashKey(null), 150);
    return () => clearTimeout(t);
  }, [lastKey]);

  const rows = KEYBOARDS[layout];
  const rowOffsets = layout === "qwerty" ? [0, 18, 36] : [0, 14, 28];
  const keyDimension = Math.max(26, Math.min(42, size + 10));
  const keyFontSize = Math.max(12, Math.min(16, Math.round(size * 0.6)));

  return (
    <div className="flex flex-col items-center gap-[6px]">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-[4px]" style={{ marginLeft: rowOffsets[ri] ?? 0 }}>
          {row.map((key) => {
            const isFlash = flashKey === key;
            return (
              <div
                key={key}
                className={`flex items-center justify-center font-mono border transition-all duration-100 transform-gpu will-change-transform ${
                  isFlash
                    ? "rounded-[10px] bg-primary/90 text-primary-foreground border-primary shadow-md shadow-primary/40 scale-[1.08]"
                    : "rounded-[10px] bg-card/55 border-border/40 text-muted-foreground/65 scale-100"
                }`}
                style={{ width: keyDimension, height: keyDimension, fontSize: keyFontSize, fontWeight: 500 }}
              >
                {key.toLowerCase()}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default KeyboardMap;
