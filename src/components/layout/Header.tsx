import { useState } from "react";
import { Menu, Search, Sun, Moon, RefreshCw, ChevronRight } from "lucide-react";
import { useStore } from "@/store";
import { NAV_BY_ID, WS_BY_ID } from "@/nav";
import { realCompanies } from "@/lib/data";
import { cx, SHELL_STYLE } from "@/lib/format";
import { CompanyChip } from "@/components/ui";

export function Header({ route }: { route: string }) {
  const { theme, toggleTheme, setMobileNav, setPalette, bundle, status, load,
    companyFilter, setCompanyFilter, workspace } = useStore();
  const meta = NAV_BY_ID[route];
  const ws = WS_BY_ID[workspace];
  const [spin, setSpin] = useState(false);

  const refresh = async () => { setSpin(true); await load(); setTimeout(() => setSpin(false), 500); };

  return (
    <header style={SHELL_STYLE} className="sticky top-0 z-20 glass border-b border-[var(--border)]">
      <div className="flex items-center gap-3 h-14 px-3 sm:px-4">
        <button onClick={() => setMobileNav(true)} aria-label="Abrir menú"
          className="lg:hidden press grid place-items-center h-9 w-9 rounded-lg hover:bg-surface-2 text-fg-2"><Menu size={18} /></button>

        {/* breadcrumb */}
        <div className="flex items-center gap-1.5 min-w-0">
          {ws?.icon && <ws.icon size={15} className="shrink-0" style={{ color: ws.accent }} />}
          <span className="text-xs text-muted hidden sm:inline truncate max-w-[180px]">{ws?.short}</span>
          <ChevronRight size={13} className="text-muted hidden sm:inline" />
          <span className="text-sm font-semibold tracking-tight truncate">{meta?.label}</span>
        </div>

        <div className="flex-1" />

        {/* global search (desktop) */}
        <button onClick={() => setPalette(true)}
          className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg border border-[var(--border)] bg-surface-2 text-muted hover:text-fg-2 transition-colors w-56 text-xs">
          <Search size={14} /><span className="flex-1 text-left">Buscar proyecto, persona…</span>
          <kbd className="text-[10px] font-mono rounded bg-surface-3 px-1.5 py-0.5 border border-[var(--border)]">⌘K</kbd>
        </button>

        <button onClick={() => setPalette(true)} aria-label="Buscar"
          className="md:hidden press grid place-items-center h-9 w-9 rounded-lg hover:bg-surface-2 text-fg-2"><Search size={17} /></button>

        <button onClick={refresh} title={bundle ? `Corte: ${bundle.meta.corte} · Generado: ${bundle.meta.generated_at}` : "Actualizar"}
          aria-label="Actualizar datos"
          className="press grid place-items-center h-9 w-9 rounded-lg hover:bg-surface-2 text-fg-2">
          <RefreshCw size={16} className={cx((spin || status === "loading") && "animate-spin")} />
        </button>

        <button onClick={toggleTheme} aria-label="Cambiar tema"
          className="press grid place-items-center h-9 w-9 rounded-lg hover:bg-surface-2 text-fg-2">
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>

      {/* freshness banner — el sistema declara su propia ceguera (anti dato-muerto) */}
      {bundle && (() => {
        const age = bundle.meta.vault_age_hours;
        const stale = age == null || age > 6;
        if (!stale) return null;
        const txt = age == null
          ? "Frescura del dato desconocida"
          : `Datos de hace ${age < 1 ? "menos de 1" : Math.round(age)}h`;
        return (
          <div role="status"
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 text-[11px] font-medium border-t border-amber-500/30 bg-amber-500/[0.12] text-amber-600">
            <span aria-hidden>⚠</span>
            <span>{txt} — corre <code className="font-mono">npm run etl</code> para actualizar.</span>
          </div>
        );
      })()}

      {/* company filter rail */}
      {bundle && (
        <div className="flex items-center gap-1.5 px-3 sm:px-4 pb-2 overflow-x-auto scrollbar-thin">
          <CompanyChip name="Todas" onClick={() => setCompanyFilter("all")} active={companyFilter === "all"} />
          {realCompanies(bundle).filter((e) => e.presente).map((e) => (
            <CompanyChip key={e.id} name={e.nombre} onClick={() => setCompanyFilter(e.nombre)} active={companyFilter === e.nombre} />
          ))}
        </div>
      )}
    </header>
  );
}
