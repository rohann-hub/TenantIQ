import { useState } from "react";

interface HeaderProps {
  hasMessages: boolean;
  onReset: () => void;
}


export function Header({ hasMessages, onReset }: HeaderProps) {
  const [hover, setHover] = useState(false);

  return (
    <header
      className="rn-header relative z-[2] flex items-center justify-between"
      style={{
        padding: "clamp(16px, 2.6vw, 24px) clamp(18px, 3.4vw, 34px)",
      }}
    >
      <div className="flex items-center gap-[10px]">
        <div
          className="w-[26px] h-[26px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #c7d2fe, #818cf8 70%)",
            boxShadow: "0 2px 10px rgba(129, 140, 248, 0.35)",
          }}
        />
        <span
          className="text-[15px] font-semibold"
          style={{ letterSpacing: "0.02em" }}
        >
          TenantIQ
        </span>
        <span
          className="rn-brand-tag text-[11px] font-medium text-muted rounded-full"
          style={{
            background: "rgba(255, 255, 255, 0.7)",
            border: "1px solid rgba(24, 24, 27, 0.06)",
            padding: "3px 9px",
            marginLeft: "4px",
          }}
        >
          AI Assistant
        </span>
      </div>

      {hasMessages && (
        <button
          onClick={onReset}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className="font-sans text-[12.5px] font-medium rounded-full cursor-pointer"
          style={{
            color: hover ? "#18181b" : "#71717a",
            background: "rgba(255, 255, 255, 0.7)",
            border: `1px solid ${hover ? "rgba(24, 24, 27, 0.16)" : "rgba(24, 24, 27, 0.07)"}`,
            padding: "7px 16px",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            transition: "all 0.25s ease",
            transform: hover ? "translateY(-1px)" : "none",
            boxShadow: hover ? "0 4px 14px rgba(24, 24, 27, 0.06)" : "none",
          }}
        >
          New conversation
        </button>
      )}
    </header>
  );
}
