import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

interface ChatInputProps {
  value: string;
  sendGlyph: string;
  sendWrapRef: RefObject<HTMLDivElement | null>;
  onChange: (value: string) => void;
  onSend: () => void;
  onFocus: () => void;
  onBlur: () => void;
  children?: React.ReactNode;
}


export function ChatInput({
  value,
  sendGlyph,
  sendWrapRef,
  onChange,
  onSend,
  onFocus,
  onBlur,
  children,
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [sendHover, setSendHover] = useState(false);
  const [sendActive, setSendActive] = useState(false);

  // "/" focuses the input, matching the original global shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sendTransform = sendActive
    ? "scale(0.94)"
    : sendHover
      ? "scale(1.08)"
      : "scale(1)";

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-[3] flex flex-col justify-end items-center pointer-events-none"
      style={{
        padding: "0 clamp(14px, 3vw, 20px) 12px",
        background:
          "linear-gradient(to top, rgba(250, 250, 250, 1) 30%, rgba(250, 250, 250, 0))",
      }}
    >
      <div
        className="pointer-events-auto w-full max-w-[720px] flex items-center mb-3"
        style={{
          gap: "10px",
          background: "rgba(255, 255, 255, 0.75)",
          border: `1px solid ${focused ? "rgba(129, 140, 248, 0.45)" : "rgba(24, 24, 27, 0.08)"}`,
          borderRadius: "24px",
          padding: "8px 8px 8px 22px",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: focused
            ? "0 8px 32px rgba(99, 102, 241, 0.14), 0 0 0 4px rgba(129, 140, 248, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)"
            : "0 8px 32px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSend();
          }}
          onFocus={() => {
            setFocused(true);
            onFocus();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur();
          }}
          placeholder="Message TenantIQ..."
          aria-label="Message TenantIQ"
          className="flex-1 min-w-0 font-sans bg-transparent border-none outline-none"
          style={{
            fontSize: "clamp(14px, 1.6vw, 15px)",
            fontWeight: 400,
            color: "#18181b",
            padding: "10px 0",
          }}
        />
        <div ref={sendWrapRef} style={{ willChange: "translate" }}>
          <button
            onClick={onSend}
            aria-label="Send"
            onMouseEnter={() => setSendHover(true)}
            onMouseLeave={() => {
              setSendHover(false);
              setSendActive(false);
            }}
            onMouseDown={() => setSendActive(true)}
            onMouseUp={() => setSendActive(false)}
            className="flex-shrink-0 flex items-center justify-center border-none rounded-full cursor-pointer text-white"
            style={{
              width: "44px",
              height: "44px",
              background: "linear-gradient(135deg, #6366f1, #818cf8)",
              fontSize: "17px",
              boxShadow: sendHover
                ? "0 6px 20px rgba(99, 102, 241, 0.45)"
                : "0 4px 14px rgba(99, 102, 241, 0.35)",
              transform: sendTransform,
              transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {sendGlyph}
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
