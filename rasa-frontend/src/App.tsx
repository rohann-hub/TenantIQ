import { Background } from "./components/Layout/Background";
import { Header } from "./components/Layout/Header";
import { Hero } from "./components/Layout/Hero";
import { Footer } from "./components/Layout/Footer";
import { ChatWindow } from "./components/Chat/ChatWindow";
import { ChatInput } from "./components/Chat/ChatInput";
import { useChat } from "./hooks/useChat";
import { useCursorFx } from "./hooks/useCursorFx";


export default function App() {
  const chat = useChat();
  const { spotRef, parARef, parBRef, sendWrapRef } = useCursorFx();

  return (
    <div
      data-screen-label="AI Assistant"
      className="relative flex flex-col font-sans overflow-hidden"
      style={{
        minHeight: "100dvh",
        color: "#18181b",
        background: "#fafafa",
      }}
    >
      <Background parARef={parARef} parBRef={parBRef} spotRef={spotRef} />

      <Header hasMessages={chat.hasMessages} onReset={chat.reset} />

      {chat.hasMessages ? (
        <ChatWindow
          messages={chat.messages}
          thinking={chat.thinking}
          isTyping={chat.isTyping}
          typingText={chat.typingText}
          copiedIdx={chat.copiedIdx}
          onCopy={chat.copy}
        />
      ) : (
        <Hero orbState={chat.orbState} onAsk={(q) => chat.ask(q)} />
      )}

      <ChatInput
        value={chat.input}
        sendGlyph={chat.sendGlyph}
        sendWrapRef={sendWrapRef}
        onChange={chat.setInput}
        onSend={() => chat.ask(chat.input)}
        onFocus={() => chat.setFocused(true)}
        onBlur={() => chat.setFocused(false)}
      >
        <Footer />
      </ChatInput>
    </div>
  );
}
