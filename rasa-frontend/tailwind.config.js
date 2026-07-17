/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "'Helvetica Neue'", "sans-serif"],
      },
      colors: {
        // Exact palette lifted from the original export.
        ink: "#18181b",
        "ink-soft": "#27272a",
        "ink-mid": "#3f3f46",
        muted: "#71717a",
        "muted-2": "#a1a1aa",
        canvas: "#fafafa",
        indigo: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
        },
        periwinkle: "#818cf8",
        lavender: "#a5b4fc",
        violet: "#a78bfa",
      },
      keyframes: {
        drift1: {
          "0%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(60px,-40px,0) scale(1.12)" },
          "100%": { transform: "translate3d(0,0,0) scale(1)" },
        },
        drift2: {
          "0%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(-50px,50px,0) scale(0.92)" },
          "100%": { transform: "translate3d(0,0,0) scale(1)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translate3d(0,14px,0)" },
          to: { opacity: "1", transform: "translate3d(0,0,0)" },
        },
        wordUp: {
          from: {
            opacity: "0",
            transform: "translate3d(0,16px,0) rotate(2deg)",
            filter: "blur(6px)",
          },
          to: {
            opacity: "1",
            transform: "translate3d(0,0,0) rotate(0)",
            filter: "blur(0)",
          },
        },
        msgIn: {
          from: { opacity: "0", transform: "translate3d(0,10px,0) scale(0.98)" },
          to: { opacity: "1", transform: "translate3d(0,0,0) scale(1)" },
        },
        dotPulse: {
          "0%, 60%, 100%": { opacity: "0.25", transform: "translate3d(0,0,0)" },
          "30%": { opacity: "1", transform: "translate3d(0,-3px,0)" },
        },
        caretBlink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        chipIn: {
          from: { opacity: "0", transform: "translate3d(0,8px,0) scale(0.96)" },
          to: { opacity: "1", transform: "translate3d(0,0,0) scale(1)" },
        },
      },
      // Exact cubic-bezier used throughout the export.
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
