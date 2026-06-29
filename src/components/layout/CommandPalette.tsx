import { useEffect, useMemo, useRef, useState } from "react";
import { Search, CornerDownLeft } from "lucide-react";
import { useStore, type DrawerTarget } from "@/store";
import { NAV } from "@/nav";
import { searchAll, type SearchHit } from "@/lib/search";
import { cx } from "@/lib/format";

type Row =
  | { kind: "view"; id: string; label: string; sub: string }
  | { kind: "entity"; hit: SearchHit };

export function CommandPalette({ navigate }: { navigate: (id: string) => void }) {
  const { paletteOpen, setPalette, bundle, openDrawer } = useStore();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // global ⌘K / Ctrl+K
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette(true); }
      if (e.key === "Escape") setPalette(false);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [setPalette]);

  useEffect(() => { if (paletteOpen) { setQ(""); setActive(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [paletteOpen]);

  const rows: Row[] = useMemo(() => {
    const views = NAV
      .filter((n) => !q || n.label.toLowerCase().includes(q.toLowerCase()) || n.group.toLowerCase().includes(q.toLowerCase()))
      .map((n) => ({ kind: "view" as const, id: n.id, label: n.label, sub: n.group }));
    const ents = searchAll(bundle, q).map((hit) => ({ kind: "entity" as const, hit }));
    return q ? [...views.slice(0, 5), ...ents] : views;
  }, [q, bundle]);

  useEffect(() => { setActive(0); }, [q]);

  if (!paletteOpen) return null;

  const choose = (row: Row) => {
    if (row.kind === "view") navigate(row.id);
    else {
      const h = row.hit;
      navigate(h.view);
      const typeMap: Record<string, "project" | "person" | "risk" | "decision" | "agent" | undefined> = {
        Proyecto: "project", Persona: "person", Riesgo: "risk", Decisión: "decision", Agente: "agent",
      };
      const t = typeMap[h.type];
      if (t && bundle) {
        // find id by label
        const finders: Record<string, () => string | undefined> = {
          project: () => bundle.proyectos.find((p) => p.nombre === h.label)?.id,
          person: () => bundle.colaboradores.find((p) => p.nombre === h.label)?.id,
          risk: () => bundle.riesgos.find((p) => p.riesgo === h.label)?.id,
          decision: () => bundle.decisiones.find((p) => p.titulo === h.label)?.id,
          agent: () => bundle.agentes.find((p) => p.nombre === h.label)?.id,
        };
        const id = finders[t]?.();
        if (id) setTimeout(() => openDrawer({ type: t, id }), 60);
      }
    }
    setPalette(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, rows.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && rows[active]) { e.preventDefault(); choose(rows[active]); }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-[color-mix(in_oklch,var(--navy)_45%,transparent)] backdrop-blur-[3px] animate-fade-in" onClick={() => setPalette(false)} />
      <div role="dialog" aria-label="Command palette"
        className="relative w-full max-w-xl card p-0 overflow-hidden shadow-pop animate-scale-in">
        <div className="flex items-center gap-2.5 px-4 h-12 border-b border-[var(--border)]">
          <Search size={16} className="text-muted" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Buscar vistas, proyectos, personas, riesgos, agentes…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted" />
          <kbd className="text-[10px] font-mono rounded bg-surface-2 px-1.5 py-0.5 border border-[var(--border)] text-muted">ESC</kbd>
        </div>
        <div className="max-h-[52vh] overflow-y-auto scrollbar-thin py-1.5">
          {rows.length === 0 && <div className="px-4 py-8 text-center text-xs text-muted">Sin coincidencias.</div>}
          {rows.map((row, i) => {
            const sel = i === active;
            const label = row.kind === "view" ? row.label : row.hit.label;
            const sub = row.kind === "view" ? row.sub : row.hit.sub;
            const tag = row.kind === "view" ? "Vista" : row.hit.type;
            return (
              <button key={i} onMouseEnter={() => setActive(i)} onClick={() => choose(row)}
                className={cx("w-full flex items-center gap-3 px-4 py-2 text-left transition-colors", sel ? "bg-surface-2" : "")}>
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted w-16 shrink-0">{tag}</span>
                <span className="flex-1 min-w-0">
                  <span className="text-sm text-fg block truncate">{label}</span>
                  <span className="text-xs text-muted block truncate">{sub}</span>
                </span>
                {sel && <CornerDownLeft size={14} className="text-muted shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
