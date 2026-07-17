import { memo } from "react";
import type { CSSProperties } from "react";
import { useParticleAnimation } from "../../hooks/useParticleAnimation";
import type { OrbState } from "../../types";

interface ParticleOrbProps {
  state: OrbState;

  accent?: number;
  className?: string;
  style?: CSSProperties;
}


function ParticleOrbComponent({
  state,
  accent = 245,
  className,
  style,
}: ParticleOrbProps) {
  const { hostRef, canvasRef } = useParticleAnimation({ state, accent });

  return (
    <div
      ref={hostRef}
      className={className}
      role="img"
      aria-label="RASA-NLU assistant orb"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        touchAction: "manipulation",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}

export const ParticleOrb = memo(ParticleOrbComponent);
