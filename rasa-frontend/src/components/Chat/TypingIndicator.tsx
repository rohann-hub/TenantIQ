import { ParticleOrb } from "../Orb/ParticleOrb";

interface TypingIndicatorProps {
  text: string;
}


export function TypingIndicator({ text }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start" style={{ gap: "12px" }}>
      <ParticleOrb
        state="responding"
        accent={245}
        style={{ width: "38px", height: "38px", flexShrink: 0 }}
      />
      <div
        className="rn-msg"
        style={{
          maxWidth: "78%",
          fontSize: "14.5px",
          fontWeight: 400,
          lineHeight: 1.7,
          color: "#27272a",
          background: "rgba(255, 255, 255, 0.8)",
          border: "1px solid rgba(24, 24, 27, 0.05)",
          padding: "14px 19px",
          borderRadius: "6px 20px 20px 20px",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 2px 12px rgba(24, 24, 27, 0.04)",
          whiteSpace: "pre-line",
        }}
      >
        {text}
        <span
          style={{
            display: "inline-block",
            width: "2px",
            height: "14px",
            background: "#818cf8",
            marginLeft: "2px",
            verticalAlign: "-2px",
            animation: "caretBlink 0.9s step-end infinite",
          }}
        />
      </div>
    </div>
  );
}
