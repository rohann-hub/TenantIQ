import { useState } from "react";
import { useCardTilt } from "../../hooks/useCardTilt";

interface SuggestionChipProps {
  icon: string;
  label: string;
  onClick: () => void;
}


export function SuggestionChip({ icon, label, onClick }: SuggestionChipProps) {
  const { onMove, onLeave } = useCardTilt();
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={(e) => {
        setHover(false);
        onLeave(e);
      }}
      onPointerEnter={() => setHover(true)}
      className="rn-chip font-sans flex items-center cursor-pointer will-change-transform"
      style={{
        gap: "9px",
        fontSize: "13.5px",
        fontWeight: 500,
        color: hover ? "#18181b" : "#3f3f46",
        background: hover ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.72)",
        border: `1px solid ${hover ? "rgba(129, 140, 248, 0.35)" : "rgba(24, 24, 27, 0.07)"}`,
        borderRadius: "18px",
        padding: "13px 18px",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: hover
          ? "0 10px 26px rgba(24, 24, 27, 0.08)"
          : "0 1px 3px rgba(24, 24, 27, 0.03)",
        transition:
          "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease, border-color 0.35s ease, color 0.35s ease, background 0.35s ease",
      }}
    >
      <span
        className="text-periwinkle"
        style={{ fontSize: "14px", lineHeight: 1 }}
      >
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
