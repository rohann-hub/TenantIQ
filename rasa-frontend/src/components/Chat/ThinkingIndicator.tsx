import { ParticleOrb } from "../Orb/ParticleOrb";


export function ThinkingIndicator() {
  return (
    <div
      className="flex justify-start"
      style={{ gap: "12px", animation: "msgIn 0.4s ease both" }}
    >
      <ParticleOrb
        state="thinking"
        accent={245}
        style={{ width: "38px", height: "38px", flexShrink: 0 }}
      />
      <div
        className="flex items-center"
        style={{
          gap: "5px",
          background: "rgba(255, 255, 255, 0.8)",
          border: "1px solid rgba(24, 24, 27, 0.05)",
          padding: "0 18px",
          height: "44px",
          borderRadius: "6px 20px 20px 20px",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        {[0, 0.15, 0.3].map((delay) => (
          <span
            key={delay}
            className="rounded-full bg-periwinkle"
            style={{
              width: "6px",
              height: "6px",
              animation: `dotPulse 1.2s ${delay}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
