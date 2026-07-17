import { useCallback } from "react";
import { useReducedMotion } from "./useReducedMotion";


export function useCardTilt() {
  const reduced = useReducedMotion();

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (reduced) return;
      const el = e.currentTarget;
      const b = el.getBoundingClientRect();
      const px = (e.clientX - b.left) / b.width - 0.5;
      const py = (e.clientY - b.top) / b.height - 0.5;
      el.style.transform = `perspective(600px) rotateX(${(-py * 9).toFixed(2)}deg) rotateY(${(px * 11).toFixed(2)}deg) translateY(-3px)`;
    },
    [reduced],
  );

  const onLeave = useCallback((e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "";
  }, []);

  return { onMove, onLeave };
}
