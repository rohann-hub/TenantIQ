// import type { AnswerKey, Suggestion } from "../types";

// /**
//  * Canned demo responses — copied verbatim from the original export so the
//  * behaviour (and every newline) is identical.
//  */
// export const ANSWERS: Record<AnswerKey, string> = {
//   services:
//     "We offer three core services:\n\n• Strategy & consulting — roadmap and architecture guidance from senior specialists.\n• Managed platform — we host, monitor, and scale your workloads with a 99.99% SLA.\n• Integration support — hands-on help connecting RASA-NLU to your existing tools.\n\nWant me to go deeper on any of these?",
//   // product:
//   //   "Our platform gives your team a single workspace for data, automation, and AI-assisted workflows. It connects to 80+ tools out of the box, runs on SOC 2 Type II certified infrastructure, and typically takes under a day to set up. Happy to walk you through a specific feature.",
//   // pricing:
//   //   "Pricing is simple and per-seat:\n\n• Starter — $19/user/mo, core features, community support.\n• Growth — $49/user/mo, automation, SSO, priority support.\n• Enterprise — custom, dedicated success manager and custom SLAs.\n\nAll plans include a 14-day free trial, no card required.",
//   support:
//     "You can reach our support team anytime:\n\n• Live chat — right here, 24/7.\n• Email — support@ddlearning.tech, answered within 4 hours.\n• Phone — +91 8668490563,\n• Mon–Fri, 10:30am – 6:30pm .\n\nWould you like me to open a ticket for you now?",
//   // policies:
//   //   "Here are the essentials:\n\n• Privacy — we never sell your data; you can export or delete it anytime.\n• Refunds — full refund within 30 days, no questions asked.\n• Security — SOC 2 Type II, GDPR compliant, data encrypted at rest and in transit.\n\nI can share the full policy documents if you'd like.",
// };

// export const FALLBACK =
//   "Great question. I don't have a live connection in this demo, but in production I'd search our knowledge base and give you a precise, sourced answer here — usually in under two seconds. Try one of the suggested topics to see a full response.";

// /** Hero suggestion chips — same icons, labels, keys and queries as the source. */
// export const SUGGESTIONS: Suggestion[] = [
//   {
//     icon: "◈",
//     label: "Ask about our services",
//     key: "services",
//     query: "What services do you offer?",
//   },
//   {
//     icon: "◉",
//     label: "Contact support",
//     key: "support",
//     query: "How do I contact support?",
//   },
// ];

// /**
//  * Maps free text to a canned answer key using the exact regex order from the
//  * original export. Returns null when nothing matches (→ FALLBACK).
//  */
// export function resolveKey(text: string): AnswerKey | null {
//   const q = text.toLowerCase();
//   // if (/(price|pricing|cost|plan)/.test(q)) return "pricing";
//   if (/(service|offer|do you do)/.test(q)) return "services";
//   // if (/(product|feature|platform)/.test(q)) return "product";
//   if (/(support|help|contact|phone|email)/.test(q)) return "support";
//   // if (/(policy|policies|privacy|refund|security|legal)/.test(q))
//   // return "policies";
//   return null;
// }

import type { Suggestion } from "../types";

/**
 * Suggestion chips shown on the Hero screen.
 * Each sends its `query` to the backend — no canned answers.
 */
export const SUGGESTIONS: Suggestion[] = [
  {
    icon: "◈",
    label: "Ask about our services",
    query: "What services do you offer?",
  },
  {
    icon: "◉",
    label: "Contact support",
    query: "How do I contact support?",
  },
  {
    icon: "◆",
    label: "General knowledge",
    query: "What is the capital of Tripura?",
  },
  {
    icon: "◎",
    label: "Tell me about yourself",
    query: "What are you and what can you do?",
  },
];

/** Offline fallback when the backend is unreachable */
export const OFFLINE_FALLBACK =
  "I'm having trouble connecting to the server right now. Please make sure the backend is running at localhost:8000 and try again.";

