import { useState } from "react";
import type { ChatMessage } from "../../types";

interface MessageProps {
  message: ChatMessage;
  copied: boolean;
  onCopy: () => void;
}


export function Message({ message, copied, onCopy }: MessageProps) {
  const [copyHover, setCopyHover] = useState(false);

  if (message.role === "user") {
    return (
      <div
        className="flex justify-end"
        style={{ animation: "msgIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both" }}
      >
        <div
          className="rn-msg"
          style={{
            maxWidth: "78%",
            fontSize: "14.5px",
            fontWeight: 500,
            lineHeight: 1.6,
            color: "#fafafa",
            background: "linear-gradient(135deg, #27272a, #3f3f46)",
            padding: "13px 18px",
            borderRadius: "20px 20px 6px 20px",
            boxShadow: "0 4px 16px rgba(24, 24, 27, 0.14)",
          }}
        >
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex justify-start"
      style={{
        gap: "12px",
        animation: "msgIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
      }}
    >
      <div
        className="flex-shrink-0 rounded-full"
        style={{
          width: "30px",
          height: "30px",
          marginTop: "4px",
          background: "radial-gradient(circle at 35% 30%, #e0e7ff, #a5b4fc 75%)",
          boxShadow: "0 2px 8px rgba(129, 140, 248, 0.3)",
        }}
      />
      <div
        className="rn-msg flex flex-col items-start"
        style={{ maxWidth: "78%", gap: "6px" }}
      >
        <div
          style={{
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
          {message.text}
        </div>
        <button
          onClick={onCopy}
          onMouseEnter={() => setCopyHover(true)}
          onMouseLeave={() => setCopyHover(false)}
          className="font-sans cursor-pointer"
          style={{
            fontSize: "11px",
            fontWeight: 500,
            color: copyHover ? "#6366f1" : "#a1a1aa",
            background: copyHover ? "rgba(129, 140, 248, 0.08)" : "transparent",
            border: "none",
            padding: "2px 6px",
            borderRadius: "8px",
            transition: "all 0.2s ease",
          }}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
