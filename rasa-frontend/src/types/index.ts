export type OrbState = "idle" | "listening" | "thinking" | "responding";

export type Role = "user" | "assistant";

export interface ChatMessage {
  role: Role;
  text: string;
  route?: "rasa" | "llm";   // which backend path handled it
}

export interface Suggestion {
  icon: string;
  label: string;
  query: string;
}
