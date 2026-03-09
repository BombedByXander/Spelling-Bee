import { useEffect, useRef } from "react";

interface Planet {
  x: number;
  y: number;
  r: number;
  color: string;
  glowColor: string;
  ringColor?: string;
  hasRing: boolean;
  orbitSpeed: number;
  orbitAngle: number;
  orbitRadius: number;
  cx: number;
  cy: number;
  craterSpecs: { dx: number; dy: number; r: number; rimOffsetX: number; rimOffsetY: number }[];
}

const PLANET_PALETTES = [
  { body: "rgba(100, 50, 160, 0.15)", glow: "rgba(140, 80, 220, 0.08)", ring: "rgba(160, 100, 240, 0.08)" },
  { body: "rgba(40, 120, 160, 0.12)", glow: "rgba(60, 180, 220, 0.07)", ring: "rgba(80, 200, 240, 0.06)" },
  { body: "rgba(180, 80, 50, 0.12)", glow: "rgba(220, 100, 60, 0.07)", ring: "rgba(240, 120, 80, 0.06)" },
  { body: "rgba(50, 160, 100, 0.12)", glow: "rgba(70, 220, 130, 0.07)", ring: "rgba(80, 240, 150, 0.06)" },
  { body: "rgba(160, 50, 120, 0.12)", glow: "rgba(200, 70, 160, 0.07)", ring: "rgba(220, 90, 180, 0.06)" },
  { body: "rgba(200, 160, 40, 0.1)", glow: "rgba(240, 200, 60, 0.06)", ring: "rgba(255, 220, 80, 0.05)" },
];

const CosmicBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    resize();
    window.addEventListener("resize", resize);

    // Stars
    const stars: { x: number; y: number; r: number; opacity: number; speed: number }[] = [];
    for (let i = 0; i < 250; i++) {
      stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.5 + 0.3, opacity: Math.random(), speed: Math.random() * 0.005 + 0.002 });
    }

    // Twinkling stars (actual star shape) with gradient colors
    const twinkleStars: { x: number; y: number; size: number; colorIdx: number; phase: number }[] = [];
    const starColors = ["rgba(173, 216, 230, 1)", "rgba(255, 255, 200, 1)", "rgba(200, 150, 255, 1)"]; // light blue, yellow, purple
    for (let i = 0; i < 80; i++) {
      twinkleStars.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.6,
        size: Math.random() * 2 + 1,
        colorIdx: Math.floor(Math.random() * starColors.length),
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Helper function to draw 5-pointed star
    const drawStar = (cx: number, cy: number, size: number, color: string, alpha: number) => {
      const innerRadius = size * 0.4;
      const outerRadius = size;
      const starColors = ["rgba(92, 200, 255, 1)", "rgba(200, 90, 255, 1)", "rgba(140, 200, 255, 1)"]; // cyan, magenta, pale cyan
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = color.replace(/[\d.]+\)/, `${alpha})`);
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // Shooting stars
    const shootingStars: { x: number; y: number; len: number; speed: number; angle: number; life: number; maxLife: number }[] = [];

    // Enhanced planets
    const planets: Planet[] = [];
    for (let i = 0; i < 5; i++) {
      const pal = PLANET_PALETTES[i % PLANET_PALETTES.length];
      const radius = 25 + Math.random() * 50;
      const numCraters = 3 + Math.floor(Math.random() * 3);
      const craterSpecs: { dx: number; dy: number; r: number; rimOffsetX: number; rimOffsetY: number }[] = [];
      for (let c = 0; c < numCraters; c++) {
        const angle = Math.random() * Math.PI * 2;
        const distFactor = 0.35 + Math.random() * 0.25;
        const craterR = radius * (0.06 + Math.random() * 0.06);
        const dx = Math.cos(angle) * radius * distFactor;
        const dy = Math.sin(angle) * radius * distFactor;
        craterSpecs.push({ dx, dy, r: craterR, rimOffsetX: -craterR * 0.15, rimOffsetY: -craterR * 0.15 });
      }
      planets.push({
        x: 0,
        y: 0,
        r: radius,
        color: pal.body,
        glowColor: pal.glow,
        ringColor: Math.random() > 0.4 ? pal.ring : undefined,
        hasRing: Math.random() > 0.35,
        orbitSpeed: 0.00008 + Math.random() * 0.00015,
        orbitAngle: Math.random() * Math.PI * 2,
        orbitRadius: 80 + Math.random() * 350,
        cx: Math.random() * w,
        cy: Math.random() * h,
        craterSpecs,
      });
    }

    const draw = () => {
      // Fill with near-black for OLED-style background (prevents grey or translucent bleed-through)
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);
      const now = Date.now();

      // Stars with twinkle
      for (const star of stars) {
        const flicker = 0.5 + 0.5 * Math.sin(now * star.speed + star.x);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${flicker * star.opacity})`;
        ctx.fill();
      }

      // Twinkling stars (5-pointed with gradient colors)
      for (const tstar of twinkleStars) {
        const flicker = 0.3 + 0.7 * Math.sin(now * 0.003 + tstar.phase);
        const color = starColors[tstar.colorIdx];
        drawStar(tstar.x, tstar.y, tstar.size, color, flicker);
      }

      // Occasionally spawn a shooting star (push an object for the draw loop)
      if (Math.random() < 1 / 400 && shootingStars.length < 3) {
        const sx = Math.random() * w;
        const sy = Math.random() * h * 0.6;
        const angle = Math.PI / 6 + Math.random() * Math.PI / 6;
        shootingStars.push({
          x: sx,
          y: sy,
          len: 80 + Math.random() * 120,
          speed: 6 + Math.random() * 4,
          angle,
          life: 0,
          maxLife: 50 + Math.floor(Math.random() * 80),
        });
      }
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.life++;
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        const progress = s.life / s.maxLife;
        const alpha = progress < 0.5 ? 1 : 1 - (progress - 0.5) * 2;
        const tailX = s.x - Math.cos(s.angle) * s.len;
        const tailY = s.y - Math.sin(s.angle) * s.len;
        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, `rgba(72,200,255, 0)`);
        grad.addColorStop(1, `rgba(72,200,255, ${alpha * 0.9})`);
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
        if (s.life >= s.maxLife) shootingStars.splice(i, 1);
      }

      for (const p of planets) {
        p.orbitAngle += p.orbitSpeed;
        p.x = p.cx + Math.cos(p.orbitAngle) * p.orbitRadius;
        p.y = p.cy + Math.sin(p.orbitAngle) * p.orbitRadius * 0.3;

        // Outer glow
        const outerGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        outerGlow.addColorStop(0, p.glowColor);
        outerGlow.addColorStop(1, "transparent");
        ctx.fillStyle = outerGlow;
        ctx.fillRect(p.x - p.r * 3, p.y - p.r * 3, p.r * 6, p.r * 6);

        // Body gradient (3D effect with light bevel)
        const bodyGrad = ctx.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.3, 0, p.x, p.y, p.r);
        bodyGrad.addColorStop(0, p.color.replace(/[\d.]+\)$/, "0.2)"));  // Subtle highlight
        bodyGrad.addColorStop(0.4, p.color.replace(/[\d.]+\)$/, "0.18)"));  // Mid-tone
        bodyGrad.addColorStop(0.7, p.color);
        bodyGrad.addColorStop(1, p.color.replace(/[\d.]+\)$/, "0.06)"));  // Subtle shadow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = bodyGrad;
        ctx.fill();
        
        // Inner bevel (very subtle light edge)
        const innerBevel = ctx.createRadialGradient(p.x, p.y, p.r * 0.5, p.x, p.y, p.r);
        innerBevel.addColorStop(0, "rgba(255, 255, 255, 0)");
        innerBevel.addColorStop(0.7, "rgba(255, 255, 255, 0)");
        innerBevel.addColorStop(1, "rgba(255, 255, 255, 0.04)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = innerBevel;
        ctx.fill();
        
        // Outer shadow edge (very subtle emboss)
        const outerShadow = ctx.createRadialGradient(p.x + p.r * 0.2, p.y + p.r * 0.2, p.r * 0.8, p.x, p.y, p.r * 1.2);
        outerShadow.addColorStop(0, "rgba(0, 0, 0, 0)");
        outerShadow.addColorStop(0.8, "rgba(0, 0, 0, 0.02)");
        outerShadow.addColorStop(1, "rgba(0, 0, 0, 0.06)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = outerShadow;
        ctx.fill();

        // Craters - use precomputed specs to avoid per-frame jitter
        for (const spec of p.craterSpecs) {
          const cx = p.x + spec.dx;
          const cy = p.y + spec.dy;
          const craterR = spec.r;

          // Inner shadow (gives depth)
          const craterGrad = ctx.createRadialGradient(cx - craterR * 0.25, cy - craterR * 0.25, 0, cx, cy, craterR);
          craterGrad.addColorStop(0, "rgba(0,0,0,0.18)");
          craterGrad.addColorStop(0.6, "rgba(0,0,0,0.08)");
          craterGrad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.beginPath();
          ctx.arc(cx, cy, craterR, 0, Math.PI * 2);
          ctx.fillStyle = craterGrad;
          ctx.fill();

          // Rim highlight (light catching the lip)
          ctx.beginPath();
          ctx.arc(cx + spec.rimOffsetX, cy + spec.rimOffsetY, craterR * 1.05, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,255,255,0.06)";
          ctx.lineWidth = Math.max(0.6, craterR * 0.25);
          ctx.stroke();
        }

        // (Removed micro-noise to avoid flickering/shaking dots)

        // Specular highlight (soft bright spot)
        const specX = p.x - p.r * 0.35;
        const specY = p.y - p.r * 0.35;
        const specRad = p.r * 0.18;
        const specGrad = ctx.createRadialGradient(specX, specY, 0, specX, specY, specRad);
        specGrad.addColorStop(0, "rgba(255,255,255,0.55)");
        specGrad.addColorStop(0.35, "rgba(255,255,255,0.12)");
        specGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(specX, specY, specRad, 0, Math.PI * 2);
        ctx.fillStyle = specGrad;
        ctx.fill();

        // Ring
        if (p.hasRing && p.ringColor) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(0.15);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * 2, p.r * 0.25, 0, 0, Math.PI * 2);
          ctx.strokeStyle = p.ringColor;
          ctx.lineWidth = 2.5;
          ctx.stroke();
          // Second ring
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * 2.3, p.r * 0.3, 0, 0, Math.PI * 2);
          ctx.strokeStyle = p.ringColor.replace(/[\d.]+\)$/, "0.03)");
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Holographic grid overlay (subtle scanlines)
      ctx.save();
      ctx.globalAlpha = 0.03;
      ctx.strokeStyle = "rgba(72,200,255,0.12)";
      ctx.lineWidth = 1;
      const rowSpacing = Math.max(80, Math.round(h / 12));
      for (let gy = 0; gy < h; gy += rowSpacing) {
        ctx.beginPath();
        const offset = Math.sin(now * 0.0006 + gy) * 6;
        ctx.moveTo(0, gy + offset);
        ctx.lineTo(w, gy + offset);
        ctx.stroke();
      }
      ctx.restore();

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

    return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default CosmicBackground;
