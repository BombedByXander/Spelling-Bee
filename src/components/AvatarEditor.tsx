import React, { useRef, useState, useEffect } from "react";
import { X, Check } from "lucide-react";

type Props = {
  file: File;
  onCancel: () => void;
  onUpload: (fileToUpload: File) => void;
};

export default function AvatarEditor({ file, onCancel, onUpload }: Props) {
  const url = useRef<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isGif, setIsGif] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    url.current = URL.createObjectURL(file);
    setIsGif(file.type === "image/gif" || (file.name || "").toLowerCase().endsWith(".gif"));
    return () => {
      if (url.current) URL.revokeObjectURL(url.current);
    };
  }, [file]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const newScale = Math.max(0.5, Math.min(3, scale - e.deltaY * 0.0015));
      setScale(newScale);
      setOffset((o) => clampOffset(o, newScale));
    };
    const node = containerRef.current;
    if (node) node.addEventListener("wheel", onWheel, { passive: false });
    return () => node && node.removeEventListener("wheel", onWheel as EventListener);
  }, [scale]);

  // Auto-fit image so something is visible immediately
  const onImgLoad = () => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;
    const cRect = container.getBoundingClientRect();
    const scaleFit = Math.max(cRect.width / img.naturalWidth, cRect.height / img.naturalHeight);
    // keep scale within allowed range
    const initial = Math.max(0.5, Math.min(3, scaleFit));
    setScale(initial);
    // center and clamp
    setOffset(clampOffset({ x: 0, y: 0 }, initial));
  };

  const onPointerDown: React.PointerEventHandler = (e) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove: React.PointerEventHandler = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => {
      const next = { x: o.x + dx, y: o.y + dy };
      return clampOffset(next, scale);
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch (err) {
      void err;
    }
  };

  const handleConfirm = async () => {
    if (isGif) {
      // upload original gif file (no crop)
      onUpload(file);
      return;
    }

    // Render crop to canvas (square)
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx || !imgRef.current || !containerRef.current) return;

    // compute image draw parameters
    const img = imgRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    // scale ratio between displayed img and natural size
    const displayToNatural = img.naturalWidth / imgRect.width;

    // offset within the displayed area relative to center
    const dx = (rect.width / 2 - (imgRect.left - rect.left + imgRect.width / 2) + offset.x) * displayToNatural;
    const dy = (rect.height / 2 - (imgRect.top - rect.top + imgRect.height / 2) + offset.y) * displayToNatural;

    const drawSize = size * (1 / scale) * displayToNatural; // rough

    // Draw with current scale and offset centered
    ctx.fillStyle = "#0000";
    ctx.fillRect(0, 0, size, size);
    // center draw
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.scale(scale, scale);
    ctx.drawImage(
      img,
      -img.naturalWidth / 2 - dx,
      -img.naturalHeight / 2 - dy,
      img.naturalWidth,
      img.naturalHeight,
    );
    ctx.restore();

    const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), "image/png", 0.92));
    if (!blob) return;
    const outFile = new File([blob], "avatar.png", { type: "image/png" });
    onUpload(outFile);
  };

  // Clamp offset so the image always covers the container (no transparent edges visible)
  const clampOffset = (candidate: { x: number; y: number }, forScale: number) => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return { x: candidate.x, y: candidate.y };

    const cRect = container.getBoundingClientRect();
    const cW = cRect.width;
    const cH = cRect.height;

    const dispW = img.naturalWidth * forScale;
    const dispH = img.naturalHeight * forScale;

    const halfCw = cW / 2;
    const halfCh = cH / 2;
    const halfIw = dispW / 2;
    const halfIh = dispH / 2;

    const minX = halfCw - halfIw; // left edge <= 0
    const maxX = halfIw - halfCw; // right edge >= cW
    const minY = halfCh - halfIh;
    const maxY = halfIh - halfCh;

    const clamp1 = (v: number, lo: number, hi: number) => {
      if (lo > hi) return 0; // image smaller than container in this axis -> center
      return Math.max(lo, Math.min(hi, v));
    };

    return {
      x: clamp1(candidate.x, minX, maxX),
      y: clamp1(candidate.y, minY, maxY),
    };
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
      <div className="bg-card rounded-lg border border-border p-4 w-[92vw] max-w-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-mono text-muted-foreground">Adjust avatar</div>
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            <button onClick={handleConfirm} className="inline-flex items-center gap-1 px-3 py-1 rounded bg-primary text-primary-foreground"><Check size={14} /> Save</button>
          </div>
        </div>

        <div
          ref={containerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="w-full h-64 bg-muted rounded overflow-hidden relative touch-none"
        >
          {url.current && (
            <img
              ref={imgRef}
              src={url.current}
              alt="avatar preview"
              draggable={false}
              onLoad={onImgLoad}
              style={{
                position: "absolute",
                left: `calc(50% + ${offset.x}px)`,
                top: `calc(50% + ${offset.y}px)`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                transformOrigin: "center center",
                userSelect: "none",
                touchAction: "none",
                maxWidth: "none",
                maxHeight: "none",
              }}
            />
          )}
          {/* Circular cutout overlay (darken outside, highlight circle) */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.55) 49%)",
            }}
          />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="text-xs text-muted-foreground">Use mouse wheel to zoom, drag to pan.</div>
          <div className="ml-auto text-xs text-muted-foreground">{isGif ? "Animated GIF (uploaded as-is)" : "PNG/JPEG crop"}</div>
        </div>
      </div>
    </div>
  );
}
