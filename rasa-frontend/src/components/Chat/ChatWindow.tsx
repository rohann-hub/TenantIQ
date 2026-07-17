import { useEffect, useRef } from "react";
import { Message } from "./Message";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { TypingIndicator } from "./TypingIndicator";
import type { ChatMessage } from "../../types";

interface ChatWindowProps {
  messages: ChatMessage[];
  thinking: boolean;
  isTyping: boolean;
  typingText: string;
  copiedIdx: number;
  onCopy: (text: string, idx: number) => void;
}


export function ChatWindow({
  messages,
  thinking,
  isTyping,
  typingText,
  copiedIdx,
  onCopy,
}: ChatWindowProps) {
  const scrollerRef = useRef<HTMLElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      const scroller = scrollerRef.current;
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
      window.scrollTo(0, document.body.scrollHeight);
    });
  }, [messages, thinking, isTyping, typingText]);

  return (
    <main
      ref={scrollerRef}
      className="rn-conv relative z-[1] flex-1 flex flex-col items-center overflow-y-auto"
      data-screen-label="Conversation"
      style={{
        padding: "0 clamp(14px, 3vw, 20px) clamp(158px, 20vh, 178px)",
      }}
    >
      <div
        className="w-full max-w-[720px] flex flex-col"
        style={{ gap: "18px", paddingTop: "12px" }}
      >
        {messages.map((m, i) => (
          <Message
            key={i}
            message={m}
            copied={copiedIdx === i}
            onCopy={() => onCopy(m.text, i)}
          />
        ))}

        {thinking && <ThinkingIndicator />}
        {isTyping && <TypingIndicator text={typingText} />}

        <div ref={endRef} />
      </div>
    </main>
  );
}
