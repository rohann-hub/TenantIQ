import { useCallback, useMemo, useRef, useState } from "react";
import type { ChatMessage, OrbState } from "../types";
import { OFFLINE_FALLBACK } from "../data/answers";
import { sendMessage } from "../utils/api";

/**
 * Generate a random session ID.
 * Persisted in the ref so it survives re-renders but resets on page reload.
 */
function makeSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [typingText, setTypingText] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(-1);

  const typeI = useRef<ReturnType<typeof setInterval> | null>(null);
  const copyT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(makeSessionId());

  const busyRef = useRef(false);
  busyRef.current = thinking || typingText !== null;

  /**
   * Animate the response text character-by-character (typing effect).
   * Once complete, pushes the full message into the messages array.
   */
  const streamToUI = useCallback((full: string, route?: "rasa" | "llm") => {
    setThinking(false);
    setTypingText("");
    let i = 0;
    typeI.current = setInterval(() => {
      i += 2 + Math.floor(Math.random() * 3);
      if (i >= full.length) {
        if (typeI.current) clearInterval(typeI.current);
        setTypingText(null);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: full, route },
        ]);
      } else {
        setTypingText(full.slice(0, i));
      }
    }, 24);
  }, []);

  /**
   * Send a message to the backend and display the response.
   */
  const ask = useCallback(
    async (text: string) => {
      if (busyRef.current) return;
      const t = (text || "").trim();
      if (!t) return;

      // Immediately show the user message and enter thinking state
      setMessages((prev) => [...prev, { role: "user", text: t }]);
      setInput("");
      setThinking(true);

      try {
        // Call the backend
        const res = await sendMessage(t, sessionRef.current);
        streamToUI(res.final_answer, res.route);
      } catch (err) {
        console.error("Chat API error:", err);
        streamToUI(OFFLINE_FALLBACK);
      }
    },
    [streamToUI],
  );

  const copy = useCallback((text: string, idx: number) => {
    try {
      navigator.clipboard.writeText(text);
    } catch {
      /* clipboard blocked */
    }
    setCopiedIdx(idx);
    if (copyT.current) clearTimeout(copyT.current);
    copyT.current = setTimeout(() => setCopiedIdx(-1), 1600);
  }, []);

  const reset = useCallback(() => {
    if (typeI.current) clearInterval(typeI.current);
    setMessages([]);
    setThinking(false);
    setTypingText(null);
    setInput("");
    setCopiedIdx(-1);
    // New session on reset so conversation memory starts fresh
    sessionRef.current = makeSessionId();
  }, []);

  const isTyping = typingText !== null;
  const hasMessages = messages.length > 0;
  const busy = thinking || isTyping;

  const orbState: OrbState = thinking
    ? "thinking"
    : isTyping
      ? "responding"
      : focused
        ? "listening"
        : "idle";

  const sendGlyph = busy ? "◌" : "↑";

  return useMemo(
    () => ({
      // state
      messages,
      input,
      thinking,
      typingText: typingText ?? "",
      isTyping,
      hasMessages,
      focused,
      copiedIdx,
      orbState,
      sendGlyph,
      // actions
      setInput,
      setFocused,
      ask,
      copy,
      reset,
    }),
    [
      messages,
      input,
      thinking,
      typingText,
      isTyping,
      hasMessages,
      focused,
      copiedIdx,
      orbState,
      sendGlyph,
      ask,
      copy,
      reset,
    ],
  );
}
