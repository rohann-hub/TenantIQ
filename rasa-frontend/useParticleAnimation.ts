import { useEffect, useRef } from "react";
import type { OrbState } from "../types";

const TAU = Math.PI * 2;

interface Particle {
  x: number;
  y: number;
  z: number;
  bx: number;
  by: number;
  bz: number;
  vx: number;
  vy: number;
  vz: number;
  sz: number;
  tw: number;
}

interface Ripple {
  r: number;
  a: number;
  x: number;
  y: number;
}

interface UseParticleAnimationOptions {
  /** Reactive orb state — drives speed and brightness targets. */
  state: OrbState;
  /** CSS hue number (default 245), matching the `accent` attribute. */
  accent?: number;
}

/**
 * Faithful port of the original `<particle-orb>` custom element.
 * Canvas-2D, ~300 particles projected from a 3D sphere. Every constant,
 * easing factor and formula is preserved verbatim from the source so the
 * motion feel is identical. Respects prefers-reduced-motion.
 */
export function useParticleAnimation({
  state,
  accent = 245,
}: UseParticleAnimationOptions) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep the latest attribute values available to the animation loop
  // without restarting it.
  const stateRef = useRef<OrbState>(state);
  const accentRef = useRef<number>(accent);
  stateRef.current = state;
  accentRef.current = accent;

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // ---- mutable animation state (mirrors the original instance fields) ----
    const particles: Particle[] = [];
    const ripples: Ripple[] = [];
    const mouse = { x: 0, y: 0, inside: false, near: false };
    let t = 0;
    let speed = 1;
    let targetSpeed = 1;
    let bloom = 0;
    let bright = 0;
    let targetBright = 0;
    let flash = 0;
    let px = 0;
    let py = 0;
    let raf = 0;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let stateName: OrbState = stateRef.current;

    // Recompute speed/brightness targets whenever the state prop changes.
    // Called once per frame; a no-op while the state is unchanged, matching
    // the original `attributeChangedCallback` semantics.
    const applyState = () => {
      const s = stateRef.current;
      if (s === stateName) return;
      stateName = s;
      targetSpeed =
        s === "thinking"
          ? 3.2
          : s === "responding"
            ? 1.6
            : s === "listening"
              ? 0.7
              : 1;
      targetBright = s === "listening" ? 0.5 : s === "thinking" ? 0.3 : 0;
    };

    // ---- particle seeding (identical distribution) ----
    const N = 300;
    for (let i = 0; i < N; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = TAU * u;
      const phi = Math.acos(2 * v - 1);
      const r = Math.cbrt(Math.random()) * 0.92 + 0.06;
      particles.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        bx: 0,
        by: 0,
        bz: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        sz: 0.9 + Math.random() * 1.9,
        tw: Math.random() * TAU,
      });
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.clientWidth || 300;
      h = host.clientHeight || 300;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      if (reduced) draw(0);
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(host);
    resize();

    // ---- pointer interaction (identical thresholds) ----
    const onMove = (e: PointerEvent) => {
      const b = host.getBoundingClientRect();
      mouse.x = e.clientX - (b.left + b.width / 2);
      mouse.y = e.clientY - (b.top + b.height / 2);
      const d = Math.hypot(mouse.x, mouse.y);
      mouse.near = d < b.width * 0.9;
      mouse.inside = d < b.width * 0.5;
    };
    const onLeave = () => {
      mouse.near = false;
      mouse.inside = false;
    };
    const onClick = (e: PointerEvent) => {
      const b = host.getBoundingClientRect();
      ripples.push({
        r: 0,
        a: 0.55,
        x: e.clientX - (b.left + b.width / 2),
        y: e.clientY - (b.top + b.height / 2),
      });
      flash = 0.45;
      for (const p of particles) {
        p.vx += p.x * 0.12;
        p.vy += p.y * 0.12;
        p.vz += p.z * 0.12;
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointerdown", onClick);

    function draw(dt: number) {
      if (!ctx || !w) return;
      applyState();
      t += dt * speed;
      speed += (targetSpeed - speed) * Math.min(dt * 2.5, 1);
      bright += (targetBright - bright) * Math.min(dt * 3, 1);
      flash *= 1 - dt * 4;
      const bloomTarget = mouse.inside ? 1 : 0;
      bloom += (bloomTarget - bloom) * Math.min(dt * 5, 1);

      const hue = accentRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.37;
      const big = R > 60;

      const breathe = 1 + Math.sin(t * 0.45) * 0.02;
      let pulse = 0;
      if (stateName === "responding")
        pulse = Math.max(0, Math.sin(t * 3.2)) * 0.025;
      const scale = breathe * (1 + bloom * 0.05 + pulse + flash * 0.06);
      const floatY = Math.sin(t * 0.3) * R * 0.03;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // ambient glow
      const glowR = R * 1.7 * scale;
      const glowA = 0.16 + bloom * 0.1 + bright * 0.08 + flash * 0.5;
      const g = ctx.createRadialGradient(
        cx,
        cy + floatY,
        R * 0.1,
        cx,
        cy + floatY,
        glowR,
      );
      g.addColorStop(0, `hsla(${hue}, 70%, 72%, ${glowA})`);
      g.addColorStop(
        0.55,
        `hsla(${hue + 25}, 65%, 78%, ${0.07 + bloom * 0.05})`,
      );
      g.addColorStop(1, "hsla(0, 0%, 100%, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx - glowR, cy + floatY - glowR, glowR * 2, glowR * 2);

      // pointer parallax lean
      if (!reduced && big) {
        const tx = Math.max(-1, Math.min(1, mouse.x / (w * 0.9)));
        const ty = Math.max(-1, Math.min(1, mouse.y / (h * 0.9)));
        px += (tx - px) * Math.min(dt * 3, 1);
        py += (ty - py) * Math.min(dt * 3, 1);
      }

      const ry = t * 0.12 + px * 0.45;
      const rx = Math.sin(t * 0.07) * 0.35 + py * 0.35;
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);

      const turb = stateName === "thinking" ? 2.2 : 1;
      const mx = mouse.x;
      const my = mouse.y;
      const attract = mouse.near && !reduced;
      const front: { sx: number; sy: number }[] = [];

      for (const p of particles) {
        if (!reduced) {
          p.vx += (Math.random() - 0.5) * 0.02 * turb - p.bx * 0.015;
          p.vy += (Math.random() - 0.5) * 0.02 * turb - p.by * 0.015;
          p.vz += (Math.random() - 0.5) * 0.02 * turb - p.bz * 0.015;
          p.vx *= 0.94;
          p.vy *= 0.94;
          p.vz *= 0.94;
          p.bx += p.vx * dt * 8;
          p.by += p.vy * dt * 8;
          p.bz += p.vz * dt * 8;
          const m = Math.hypot(p.bx, p.by, p.bz);
          if (m > 0.28) {
            const k = 0.28 / m;
            p.bx *= k;
            p.by *= k;
            p.bz *= k;
          }
        }
        const x = p.x + p.bx;
        const y = p.y + p.by;
        const z = p.z + p.bz;
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y1 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        const persp = 1 / (1.6 - z2 * 0.5);
        let sx = cx + x1 * R * scale * persp;
        let sy = cy + floatY + y1 * R * scale * persp;

        if (attract) {
          const dx = cx + mx - sx;
          const dy = cy + my - sy;
          const d = Math.hypot(dx, dy) + 1;
          const pull = Math.min(900 / (d * d), 0.14);
          sx += dx * pull;
          sy += dy * pull;
        }

        const depth = (z2 + 1) / 2;
        const tw = 0.75 + Math.sin(t * 1.4 + p.tw) * 0.25;
        const a = (0.24 + depth * 0.62) * tw + bright * 0.12;
        const size = p.sz * (0.6 + depth * 1.0) * persp;
        const l = 62 + depth * 30;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${hue + depth * 30}, ${45 + depth * 20}%, ${l}%, ${Math.min(a, 1)})`;
        ctx.arc(sx, sy, size, 0, TAU);
        ctx.fill();

        if (big && depth > 0.68 && front.length < 60) front.push({ sx, sy });
      }

      // molecular connection lines while cursor is inside
      if (big && bloom > 0.05 && !reduced) {
        const thr = R * 0.3;
        const thr2 = thr * thr;
        ctx.lineWidth = 0.6;
        for (let i = 0; i < front.length; i++) {
          for (let j = i + 1; j < front.length; j++) {
            const dx = front[i].sx - front[j].sx;
            const dy = front[i].sy - front[j].sy;
            const d2 = dx * dx + dy * dy;
            if (d2 < thr2) {
              const a = bloom * (1 - d2 / thr2) * 0.22;
              ctx.beginPath();
              ctx.strokeStyle = `hsla(${hue}, 60%, 62%, ${a})`;
              ctx.moveTo(front[i].sx, front[i].sy);
              ctx.lineTo(front[j].sx, front[j].sy);
              ctx.stroke();
            }
          }
        }
      }

      // click ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += dt * R * 2.4;
        rp.a *= 1 - dt * 1.8;
        if (rp.a < 0.01 || rp.r > R * 2.4) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${hue}, 60%, 65%, ${rp.a})`;
        ctx.lineWidth = 1.25;
        ctx.arc(cx + rp.x * 0.2, cy + floatY + rp.y * 0.2, rp.r, 0, TAU);
        ctx.stroke();
      }
    }

    // Prime speed/brightness targets for the initial state so the first
    // frame is already correct.
    {
      const s = stateRef.current;
      stateName = s;
      targetSpeed =
        s === "thinking"
          ? 3.2
          : s === "responding"
            ? 1.6
            : s === "listening"
              ? 0.7
              : 1;
      targetBright = s === "listening" ? 0.5 : s === "thinking" ? 0.3 : 0;
    }

    if (reduced) {
      t = 20;
      draw(0);
    } else {
      let last = performance.now();
      const tick = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        draw(dt);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onClick);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { hostRef, canvasRef };
}
