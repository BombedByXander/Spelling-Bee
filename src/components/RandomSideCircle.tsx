import React, { useMemo } from "react";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const RandomSideCircle: React.FC = () => {
  const props = useMemo(() => {
    const side = Math.random() < 0.5 ? "left" : "right";
    const top = rand(6, 80); // percent from top
    const size = rand(48, 140); // px
    const hue = rand(180, 320);
    const alpha = (rand(12, 22) / 100).toFixed(2);
    const color = `hsla(${hue}, 80%, 60%, ${alpha})`;
    return { side, top, size, color };
  }, []);

  const style: React.CSSProperties = {
    position: "fixed",
    top: `${props.top}%`,
    [props.side]: `-20px`,
    width: `${props.size}px`,
    height: `${props.size}px`,
    borderRadius: "9999px",
    background: props.color,
    boxShadow: `0 8px 24px rgba(0,0,0,0.08)`,
    transform: "translateX(0)",
    pointerEvents: "none",
    zIndex: 30,
    opacity: 0.95,
  } as React.CSSProperties;

  return <div aria-hidden style={style} />;
};

export default RandomSideCircle;
