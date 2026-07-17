import { ParticleOrb } from "../Orb/ParticleOrb";
import { SuggestionChip } from "../UI/SuggestionChip";
import { SUGGESTIONS } from "../../data/answers";
import type { OrbState } from "../../types";

interface HeroProps {
  orbState: OrbState;
  onAsk: (query: string) => void;
}

const HEADLINE = ["How", "can", "I", "help", "you"];


export function Hero({ orbState, onAsk }: HeroProps) {
  return (
    <main
      className="rn-hero relative z-[1] flex-1 flex flex-col items-center justify-center"
      data-screen-label="Hero"
      style={{
        padding: "12px clamp(18px, 4vw, 24px) clamp(150px, 22vh, 180px)",
        gap: 0,
      }}
    >
      <div className="rn-hero-inner flex flex-col items-center w-full max-w-[700px]">
        <div className="relative flex flex-col items-center">
          <ParticleOrb
            state={orbState}
            accent={245}
            style={{
              width: "max(220px, min(420px, 58vw, 46vh))",
              height: "max(220px, min(420px, 58vw, 46vh))",
              cursor: "pointer",
            }}
          />
        </div>

        <h1
          className="flex flex-wrap justify-center text-center"
          style={{
            margin: "clamp(4px, 2vw, 12px) 0 0",
            fontSize: "clamp(28px, 5.2vw, 44px)",
            fontWeight: 300,
            letterSpacing: "-0.02em",
            gap: "0 0.28em",
          }}
        >
          {HEADLINE.map((word, i) => (
            <span
              key={word}
              style={{
                animation: `wordUp 0.7s ${0.05 + i * 0.07}s cubic-bezier(0.22, 1, 0.36, 1) both`,
              }}
            >
              {word}
            </span>
          ))}
          <span
            style={{
              animation:
                "wordUp 0.7s 0.40s cubic-bezier(0.22, 1, 0.36, 1) both",
              fontWeight: 500,
              background: "linear-gradient(120deg, #6366f1, #a78bfa)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            today?
          </span>
        </h1>

        <p
          className="text-center text-muted"
          style={{
            margin: "14px 0 0",
            maxWidth: "440px",
            fontSize: "clamp(14px, 1.6vw, 15px)",
            fontWeight: 400,
            lineHeight: 1.6,
            animation: "fadeUp 0.7s 0.5s ease both",
          }}
        >
          Ask me anything about our&nbsp; company — I'll answer in seconds.
        </p>

        <div
          className="rn-suggest flex flex-wrap justify-center w-full"
          style={{
            gap: "10px",
            marginTop: "clamp(26px, 4vw, 36px)",
            maxWidth: "680px",
            animation: "fadeUp 0.7s 0.6s ease both",
            perspective: "800px",
          }}
        >
          {SUGGESTIONS.map((s) => (
            <SuggestionChip
              key={s.query}
              icon={s.icon}
              label={s.label}
              onClick={() => onAsk(s.query)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
