import type { ReactNode, CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { cx, COMPANY_TOKEN, dash, companyVar } from "@/lib/format";

const ASSET = import.meta.env.BASE_URL || "/";
const MONO: Record<string, string> = { "GEN+": "G+", VisionPro: "VP", AgentFlow: "AF", THESIA: "TH", "SP+": "SP", AP: "AP" };

/** Real logo for AECODE; premium gradient monogram for the rest. */
export function BrandMark({ name, size = 32, radius = 10 }: { name: string; size?: number; radius?: number }) {
  if (name === "AECODE") {
    return <img src={`${ASSET}logos/aecode-iso.png`} alt="AECODE" loading="lazy"
      className="object-contain shrink-0" style={{ width: size, height: size, borderRadius: radius }} />;
  }
  if (name === "GEN+") {
    return <img src={`${ASSET}logos/genplus-iso.svg`} alt="GEN+"
      className="shrink-0" style={{ width: size, height: size, borderRadius: radius }} />;
  }
  const c = companyVar(name);
  return (
    <span className="grid place-items-center text-white font-display font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36, borderRadius: radius,
        background: `linear-gradient(140deg, ${c}, color-mix(in oklch, ${c} 52%, black))` }}>
      {MONO[name] ?? name.slice(0, 2).toUpperCase()}
    </span>
  );
}

/** Master "X" brand mark for the global dashboard. */
export function XMark({ size = 32, radius = 10 }: { size?: number; radius?: number }) {
  return (
    <span className="grid place-items-center text-white font-display font-extrabold shrink-0 relative overflow-hidden"
      style={{ width: size, height: size, fontSize: size * 0.5, borderRadius: radius,
        background: "linear-gradient(140deg, var(--navy), var(--brand) 62%, var(--blue-light))" }}>
      X
    </span>
  );
}

export const AECODITO = `${ASSET}logos/aecodito.png`;

/* ----------------------------------------------------------------- color */
export const scoreColor = (v: number | string) =>
  typeof v !== "number" ? "var(--muted)" : v >= 75 ? "var(--emerald)" : v >= 55 ? "var(--amber)" : "var(--red)";
export const riskColor = (v: number) =>
  v >= 65 ? "var(--red)" : v >= 45 ? "var(--amber)" : "var(--emerald)";
export const estadoColor = (e: string) => {
  const x = (e || "").toLowerCase();
  return x.includes("rojo") ? "var(--red)" : x.includes("verde") ? "var(--emerald)"
    : x.includes("amaril") ? "var(--amber)" : "var(--muted)";
};

/* ------------------------------------------------------------------ Card */
export function Card({ className, children, hover, style }:
  { className?: string; children: ReactNode; hover?: boolean; style?: CSSProperties }) {
  return (
    <div
      style={style}
      className={cx("card p-4 sm:p-5", hover && "transition-shadow duration-200 hover:shadow-card-hover", className)}
    >{children}</div>
  );
}

export function SectionTitle({ icon: Icon, title, subtitle, right }:
  { icon?: LucideIcon; title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && <span className="grid place-items-center h-8 w-8 rounded-lg bg-surface-2 text-fg-2 shrink-0"><Icon size={16} /></span>}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold tracking-tight truncate">{title}</h3>
          {subtitle && <p className="text-xs text-muted truncate">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

/* ----------------------------------------------------------------- Badge */
export function Badge({ children, color, soft = true, className }:
  { children: ReactNode; color?: string; soft?: boolean; className?: string }) {
  const c = color || "var(--muted)";
  return (
    <span
      className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none border", className)}
      style={{
        color: c,
        borderColor: `color-mix(in oklch, ${c} 30%, transparent)`,
        background: soft ? `color-mix(in oklch, ${c} 12%, transparent)` : "transparent",
      }}
    >{children}</span>
  );
}

export function Dot({ color, pulse }: { color: string; pulse?: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0">
      {pulse && <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: color }} />}
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
    </span>
  );
}

export function Semaforo({ estado, label }: { estado: string; label?: boolean }) {
  const c = estadoColor(estado);
  const txt = estado?.toLowerCase().includes("rojo") ? "Rojo" : estado?.toLowerCase().includes("verde") ? "Verde"
    : estado?.toLowerCase().includes("amaril") ? "Amarillo" : "—";
  return (
    <span className="inline-flex items-center gap-1.5">
      <Dot color={c} pulse={txt === "Rojo"} />
      {label && <span className="text-xs font-medium" style={{ color: c }}>{txt}</span>}
    </span>
  );
}

export function Confidence({ value }: { value: string }) {
  const x = (value || "").toLowerCase();
  const c = x.startsWith("alta") || x.startsWith("verif") ? "var(--emerald)"
    : x.startsWith("media") || x.startsWith("infer") ? "var(--amber)" : "var(--muted)";
  return <Badge color={c} soft>{value || "s/d"}</Badge>;
}

export function CompanyChip({ name, onClick, active }:
  { name: string; onClick?: () => void; active?: boolean }) {
  const c = `var(--c-${COMPANY_TOKEN[name] ?? "ap"})`;
  return (
    <button
      onClick={onClick}
      className={cx("press inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "text-fg" : "text-fg-2 hover:text-fg")}
      style={{
        borderColor: active ? c : "var(--border)",
        background: active ? `color-mix(in oklch, ${c} 12%, transparent)` : "transparent",
      }}
    >
      <span className="h-2 w-2 rounded-[3px]" style={{ background: c }} />{name}
    </button>
  );
}

/* -------------------------------------------------------------- KPI Card */
export function KPICard({ label, value, sub, icon: Icon, accent = "var(--brand)", footer, onClick }:
  { label: string; value: ReactNode; sub?: ReactNode; icon?: LucideIcon; accent?: string; footer?: ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cx("card p-4 relative overflow-hidden group", onClick && "cursor-pointer press transition-shadow hover:shadow-card-hover")}
    >
      <div className="absolute left-0 top-0 h-full w-[3px]" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted uppercase tracking-wide">{label}</p>
        {Icon && <Icon size={15} className="text-muted shrink-0" />}
      </div>
      <div className="mt-1.5 text-[26px] font-display font-semibold tnum leading-none" style={{ color: "var(--fg)" }}>{value}</div>
      {sub && <div className="mt-1.5 text-xs text-fg-2">{sub}</div>}
      {footer && <div className="mt-2 pt-2 border-t text-[11px] text-muted">{footer}</div>}
    </div>
  );
}

/* ------------------------------------------------------------- ScoreRing */
export function ScoreRing({ value, size = 64, stroke = 7, color, label, sub }:
  { value: number | string; size?: number; stroke?: number; color?: string; label?: string; sub?: string }) {
  const v = typeof value === "number" ? value : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (v / 100) * c;
  const col = color || scoreColor(value);
  return (
    <div className="inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 col-start-1 row-start-1">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={typeof value === "number" ? off : c} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .7s cubic-bezier(.16,1,.3,1)" }} />
      </svg>
      <div className="col-start-1 row-start-1 text-center leading-none">
        <div className="font-display font-semibold tnum" style={{ fontSize: size * 0.28, color: "var(--fg)" }}>
          {typeof value === "number" ? value : "—"}
        </div>
        {label && <div className="text-[9px] uppercase tracking-wide text-muted mt-0.5">{label}</div>}
      </div>
      {sub && <div className="col-span-full text-[10px] text-muted mt-1">{sub}</div>}
    </div>
  );
}

export function Progress({ value, color, height = 6 }: { value: number; color?: string; height?: number }) {
  const col = color || scoreColor(value);
  return (
    <div className="w-full rounded-full bg-surface-3 overflow-hidden" style={{ height }}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: col, transition: "width .6s cubic-bezier(.16,1,.3,1)" }} />
    </div>
  );
}

export function BarRow({ label, value, color, max = 100, right }:
  { label: string; value: number; color?: string; max?: number; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-28 shrink-0 text-xs text-fg-2 truncate">{label}</div>
      <div className="flex-1"><Progress value={(value / max) * 100} color={color} /></div>
      <div className="w-10 text-right text-xs tnum font-medium">{right ?? value}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- Donut */
export function Donut({ segments, size = 92, stroke = 14 }:
  { segments: { value: number; color: string; label: string }[]; size?: number; stroke?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
      {segments.map((s, i) => {
        const len = (s.value / total) * c;
        const seg = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color}
          strokeWidth={stroke} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc}
          style={{ transition: "stroke-dasharray .6s ease" }} />;
        acc += len;
        return seg;
      })}
    </svg>
  );
}

/* ---------------------------------------------------------------- Radar */
export function Radar({ data, size = 190, color = "var(--brand)" }:
  { data: { label: string; value: number }[]; size?: number; color?: string }) {
  const n = data.length || 1;
  const cx = size / 2, cy = size / 2, r = size / 2 - 34;
  const pt = (i: number, val: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = r * Math.max(0, Math.min(100, val)) / 100;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  };
  const axis = (i: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const poly = data.map((d, i) => pt(i, d.value).join(",")).join(" ");
  return (
    <svg width={size} height={size} className="overflow-visible">
      {[33, 66, 100].map((ring) => (
        <polygon key={ring} points={data.map((_, i) => pt(i, ring).join(",")).join(" ")}
          fill="none" stroke="var(--border)" strokeWidth="1" />
      ))}
      {data.map((_, i) => { const [x, y] = axis(i); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />; })}
      <polygon points={poly} fill={`color-mix(in oklch, ${color} 22%, transparent)`} stroke={color} strokeWidth="2"
        style={{ transition: "all .5s cubic-bezier(.16,1,.3,1)" }} />
      {data.map((d, i) => pt(i, d.value)).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill={color} />)}
      {data.map((d, i) => {
        const [x, y] = axis(i);
        const lx = cx + (x - cx) * 1.2, ly = cy + (y - cy) * 1.2;
        return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
          className="fill-[var(--muted)]" style={{ fontSize: 9 }}>{d.label}</text>;
      })}
    </svg>
  );
}

/* ----------------------------------------------------------- Empty/Skeleton */
export function EmptyState({ icon: Icon, title, hint }:
  { icon: LucideIcon; title: string; hint?: string }) {
  return (
    <div className="grid place-items-center text-center py-12 px-6">
      <span className="grid place-items-center h-12 w-12 rounded-2xl bg-surface-2 text-muted mb-3"><Icon size={22} /></span>
      <p className="text-sm font-medium text-fg-2">{title}</p>
      {hint && <p className="text-xs text-muted mt-1 max-w-sm">{hint}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("relative overflow-hidden rounded-lg bg-surface-2", className)}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-[color-mix(in_oklch,var(--fg)_6%,transparent)] to-transparent" />
  </div>;
}

export function KeyVal({ k, v, mono }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-[var(--border)] last:border-0">
      <span className="text-xs text-muted shrink-0">{k}</span>
      <span className={cx("text-xs text-right text-fg-2", mono && "font-mono")}>{typeof v === "string" ? dash(v) : v}</span>
    </div>
  );
}

/* --------------------------------------------------------------- Scaffold note */
export function ScaffoldNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-surface-2/60 px-4 py-3 text-xs text-muted flex items-start gap-2">
      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[var(--amber)]" />
      <span>{children}</span>
    </div>
  );
}

export function DepthTag({ depth }: { depth: "core" | "live" | "scaffold" }) {
  const map = {
    core: { c: "var(--emerald)", t: "Core" },
    live: { c: "var(--brand)", t: "Datos en vivo" },
    scaffold: { c: "var(--amber)", t: "En evolución" },
  }[depth];
  return <Badge color={map.c}>{map.t}</Badge>;
}
