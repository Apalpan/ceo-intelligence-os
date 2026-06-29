import { clsx, type ClassValue } from "clsx";
import type { CSSProperties } from "react";

export const cx = (...a: ClassValue[]) => clsx(a);
export const UNCLEAR = "No se tiene claro";
export const isUnclear = (v: unknown) =>
  v === undefined || v === null || v === "" || v === UNCLEAR;

export const COMPANY_TOKEN: Record<string, string> = {
  "GEN+": "genplus", AECODE: "aecode", VisionPro: "visionpro",
  AgentFlow: "agentflow", THESIA: "thesia", "SP+": "spplus", AP: "ap",
};

export const companyVar = (name: string) =>
  `var(--c-${COMPANY_TOKEN[name] ?? "ap"})`;

export const accentStyle = (name: string): CSSProperties =>
  ({ ["--accent" as never]: companyVar(name) });

/** Remaps content tokens to the dark executive-shell tokens for descendants. */
export const SHELL_STYLE = {
  ["--bg" as never]: "var(--shell-bg)",
  ["--surface" as never]: "var(--shell-surface)",
  ["--surface-2" as never]: "var(--shell-surface-2)",
  ["--surface-3" as never]: "color-mix(in oklch, var(--shell-surface-2) 78%, white 10%)",
  ["--fg" as never]: "var(--shell-fg)",
  ["--fg-2" as never]: "var(--shell-fg-2)",
  ["--muted" as never]: "var(--shell-muted)",
  ["--border" as never]: "var(--shell-border)",
  ["--border-strong" as never]: "color-mix(in oklch, var(--shell-border) 65%, white 20%)",
} as CSSProperties;

type Tone = { label: string; text: string; bg: string; dot: string; ring: string };

export function estadoMeta(estado: string): Tone {
  const e = (estado || "").toLowerCase();
  if (e.includes("rojo"))
    return { label: "Rojo", text: "text-[var(--red)]", bg: "bg-[color-mix(in_oklch,var(--red)_14%,transparent)]", dot: "bg-[var(--red)]", ring: "ring-[var(--red)]" };
  if (e.includes("verde"))
    return { label: "Verde", text: "text-[var(--emerald)]", bg: "bg-[color-mix(in_oklch,var(--emerald)_14%,transparent)]", dot: "bg-[var(--emerald)]", ring: "ring-[var(--emerald)]" };
  if (e.includes("amaril"))
    return { label: "Amarillo", text: "text-[var(--amber)]", bg: "bg-[color-mix(in_oklch,var(--amber)_16%,transparent)]", dot: "bg-[var(--amber)]", ring: "ring-[var(--amber)]" };
  return { label: estado || "—", text: "text-muted", bg: "bg-surface-2", dot: "bg-[var(--muted)]", ring: "ring-[var(--border)]" };
}

export function scoreTone(n: number | string): Tone {
  if (typeof n !== "number") return estadoMeta("");
  if (n >= 75) return estadoMeta("verde");
  if (n >= 55) return estadoMeta("amarillo");
  return estadoMeta("rojo");
}

export function riskTone(n: number): Tone {
  // inverse of score: high risk = red
  if (n >= 65) return estadoMeta("rojo");
  if (n >= 45) return estadoMeta("amarillo");
  return estadoMeta("verde");
}

export function urgencyMeta(u: string): Tone {
  const x = (u || "").toUpperCase();
  if (x.includes("P0")) return estadoMeta("rojo");
  if (x.includes("P1")) return estadoMeta("amarillo");
  return { label: x || "P2", text: "text-muted", bg: "bg-surface-2", dot: "bg-[var(--muted)]", ring: "ring-[var(--border)]" };
}

export function confTone(c: string): Tone {
  const x = (c || "").toLowerCase();
  if (x.startsWith("alta") || x.startsWith("verif"))
    return { label: c, text: "text-[var(--emerald)]", bg: "bg-[color-mix(in_oklch,var(--emerald)_12%,transparent)]", dot: "bg-[var(--emerald)]", ring: "ring-[var(--emerald)]" };
  if (x.startsWith("media") || x.startsWith("infer"))
    return { label: c, text: "text-[var(--amber)]", bg: "bg-[color-mix(in_oklch,var(--amber)_14%,transparent)]", dot: "bg-[var(--amber)]", ring: "ring-[var(--amber)]" };
  return { label: c || UNCLEAR, text: "text-muted", bg: "bg-surface-2", dot: "bg-[var(--muted)]", ring: "ring-[var(--border)]" };
}

export const nivelMeta = (n: string): Tone => {
  const x = (n || "").toLowerCase();
  if (x.includes("alta") || x.includes("urgente") || x.includes("critic")) return estadoMeta("rojo");
  if (x.includes("media") || x.includes("estrat")) return estadoMeta("amarillo");
  return estadoMeta("verde");
};

export const dash = (v: unknown) => (isUnclear(v) ? "—" : String(v));
export const fmtScore = (v: number | string) => (typeof v === "number" ? String(v) : "—");
