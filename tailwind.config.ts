import type { Config } from "tailwindcss";

/**
 * Tokens live in src/index.css as CSS custom properties (OKLCH, light/dark aware).
 * Tailwind only references them so the whole system is driven by a few variables.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        fg: "var(--fg)",
        "fg-2": "var(--fg-2)",
        muted: "var(--muted)",
        navy: "var(--navy)",
        brand: "var(--brand)",
        "brand-soft": "var(--brand-soft)",
        "blue-light": "var(--blue-light)",
        violet: "var(--violet)",
        cyan: "var(--cyan)",
        emerald: "var(--emerald)",
        amber: "var(--amber)",
        red: "var(--red)",
        slate: "var(--slate)",
        // semantic state colors
        "ok": "var(--ok)",
        "warn": "var(--warn)",
        "crit": "var(--crit)",
        "info": "var(--info)",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
        "3xl": "24px",
      },
      boxShadow: {
        card: "0 1px 2px -1px rgb(15 23 42 / 0.08), 0 2px 8px -2px rgb(15 23 42 / 0.06)",
        "card-hover": "0 4px 12px -2px rgb(15 23 42 / 0.10), 0 8px 24px -4px rgb(15 23 42 / 0.08)",
        pop: "0 8px 30px -6px rgb(15 23 42 / 0.18), 0 2px 8px -2px rgb(15 23 42 / 0.10)",
        glow: "0 0 0 1px var(--brand-soft), 0 6px 24px -8px var(--brand-soft)",
      },
      transitionTimingFunction: {
        "out-quad": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.32s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in": "slide-in 0.28s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
