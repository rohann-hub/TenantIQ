import { useEffect, useRef } from "react";


export function useCursorFx() {
  const spotRef = useRef<HTMLDivElement | null>(null);
  const parARef = useRef<HTMLDivElement | null>(null);
  const parBRef = useRef<HTMLDivElement | null>(null);
  const sendWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;

    const ptr = { x: window.innerWidth / 2, y: window.innerHeight / 3 };
    const spot = { x: ptr.x, y: ptr.y };
    const mag = { x: 0, y: 0 };
    let raf = 0;

    const onPtr = (e: PointerEvent) => {
      ptr.x = e.clientX;
      ptr.y = e.clientY;
    };
    window.addEventListener("pointermove", onPtr, { passive: true });

    const tick = () => {
      const p = ptr;

      // spotlight — eased follow, offset by half its 620px size
      spot.x += (p.x - spot.x) * 0.07;
      spot.y += (p.y - spot.y) * 0.07;
      const spotEl = spotRef.current;
      if (spotEl) {
        spotEl.style.transform = `translate3d(${(spot.x - 300).toFixed(1)}px, ${(spot.y - 300).toFixed(1)}px, 0)`;
      }

      // background parallax — two layers, opposite directions
      const nx = p.x / window.innerWidth - 0.5;
      const ny = p.y / window.innerHeight - 0.5;
      const parAEl = parARef.current;
      const parBEl = parBRef.current;
      if (parAEl) {
        parAEl.style.transform = `translate3d(${(nx * 26).toFixed(1)}px, ${(ny * 18).toFixed(1)}px, 0)`;
      }
      if (parBEl) {
        parBEl.style.transform = `translate3d(${(nx * -34).toFixed(1)}px, ${(ny * -24).toFixed(1)}px, 0)`;
      }

      // magnetic send button — pulls toward cursor within 110px
      const sendEl = sendWrapRef.current;
      if (sendEl) {
        const b = sendEl.getBoundingClientRect();
        const cx = b.left + b.width / 2 - mag.x;
        const cy = b.top + b.height / 2 - mag.y;
        const dx = p.x - cx;
        const dy = p.y - cy;
        const d = Math.hypot(dx, dy);
        const tt = d < 110 ? (110 - d) / 110 : 0;
        mag.x += (dx * 0.3 * tt - mag.x) * 0.16;
        mag.y += (dy * 0.3 * tt - mag.y) * 0.16;
        sendEl.style.translate = `${mag.x.toFixed(1)}px ${mag.y.toFixed(1)}px`;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPtr);
    };
  }, []);

  return { spotRef, parARef, parBRef, sendWrapRef };
}
