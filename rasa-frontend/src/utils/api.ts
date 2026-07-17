/**
 * API client for the FastAPI backend.
 *
 * In development, Vite proxies /api requests to localhost:8000
 * so we use relative URLs here — no hardcoded host.
 */

const BASE = "/api/v1";

//  Types matching the backend ChatResponse 
export interface ChatApiResponse {
  query: string;
  intent: string | null;
  confidence: number;
  entities: Record<string, unknown>[];
  context: string[];
  rag_relevant: boolean;
  route: "rasa" | "llm";
  final_answer: string;
  session_id: string;
}

// Regular (blocking) chat
export async function sendMessage(
  query: string,
  sessionId: string,
): Promise<ChatApiResponse> {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, session_id: sessionId }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`Backend error (${res.status}): ${err}`);
  }

  return res.json();
}

//  Streaming chat (SSE) 
export async function sendMessageStream(
  query: string,
  sessionId: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): Promise<void> {
  try {
    const res = await fetch(`${BASE}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, session_id: sessionId }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Stream error (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n\n").filter(Boolean);

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6); // remove "data: "

        if (data === "[DONE]") {
          onDone();
          return;
        }

        onToken(data);
      }
    }

    onDone();
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

// Health check
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch("/health", { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
