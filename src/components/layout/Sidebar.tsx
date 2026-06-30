import { PanelLeftClose, PanelLeft, Command, Activity, ExternalLink } from "lucide-react";
import { WORKSPACES, WS_BY_ID, NAV_BY_ID } from "@/nav";
import { useStore } from "@/store";
import { cx, SHELL_STYLE } from "@/lib/format";
import { XMark, BrandMark, GEN_WORDMARK_WHITE } from "@/components/ui";

const depthColor = { core: "var(--emerald)", live: "var(--brand)", scaffold: "var(--amber)" } as const;
const COMPANIES = ["GEN+", "AECODE", "VisionPro", "THESIA", "AgentFlow"];

export function Sidebar({ route, param, navigate }: { route: string; param: string; navigate: (id: string) => void }) {
  const { sidebarCollapsed, toggleSidebar, mobileNavOpen, setMobileNav, setPalette,
    workspace, setWorkspace } = useStore();
  const collapsed = sidebarCollapsed;
  const ws = WS_BY_ID[workspace] ?? WORKSPACES[0];

  const goWorkspace = (id: string) => { setWorkspace(id); navigate(id); setMobileNav(false); };
  const goSection = (id: string) => { navigate(id); setMobileNav(false); };

  return (
    <>
      {mobileNavOpen && <div className="fixed inset-0 z-30 bg-[color-mix(in_oklch,var(--navy)_40%,transparent)] lg:hidden animate-fade-in" onClick={() => setMobileNav(false)} />}

      <aside style={SHELL_STYLE} className={cx(
        "z-40 flex flex-col border-r border-[var(--border)] bg-surface shrink-0",
        "fixed inset-y-0 left-0 lg:static transition-[transform,width] duration-300 ease-out-expo",
        collapsed ? "w-[68px]" : "w-[252px]",
        mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>

        {/* brand */}
        <div className={cx("flex items-center gap-2.5 h-14 px-3 border-b border-[var(--border)]", collapsed && "justify-center")}>
          <XMark size={34} radius={11} />
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[15px] font-display font-extrabold leading-none tracking-tight">X</div>
              <div className="text-[10px] text-muted leading-tight mt-0.5">CEO Intelligence · GEN+ / AECODE</div>
            </div>
          )}
        </div>

        {/* workspace switcher */}
        <div className="px-2.5 pt-2.5">
          {!collapsed && <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted/80">Dashboards</div>}
          <div className="space-y-0.5">
            {WORKSPACES.map((w) => {
              const active = workspace === w.id;
              const Icon = w.icon;
              return (
                <button key={w.id} onClick={() => goWorkspace(w.id)} title={collapsed ? w.label : undefined}
                  className={cx("group relative w-full press flex items-center gap-2.5 rounded-lg text-[13px] transition-colors",
                    collapsed ? "justify-center h-9" : "px-2.5 h-9",
                    active ? "text-fg font-semibold" : "text-fg-2 hover:bg-surface-2 hover:text-fg")}
                  style={active ? { background: `color-mix(in oklch, ${w.accent} 14%, transparent)` } : undefined}>
                  {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full" style={{ background: w.accent }} />}
                  <Icon size={17} className="shrink-0" style={{ color: active ? w.accent : undefined }} />
                  {!collapsed && <span className="flex-1 text-left truncate">{w.short}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* empresas switcher */}
        <div className="px-2.5 pt-2.5">
          {!collapsed && <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted/80">Empresas</div>}
          <div className={cx("gap-0.5", collapsed ? "space-y-0.5" : "grid grid-cols-1")}>
            {COMPANIES.map((c) => {
              const active = route === "co" && param === c;
              return (
                <button key={c} onClick={() => { navigate(`co/${c}`); setMobileNav(false); }} title={collapsed ? c : undefined}
                  className={cx("group relative w-full press flex items-center gap-2.5 rounded-lg text-[13px] transition-colors",
                    collapsed ? "justify-center h-9" : "px-2 h-9",
                    active ? "bg-surface-2 text-fg font-medium" : "text-fg-2 hover:bg-surface-2 hover:text-fg")}>
                  {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full" style={{ background: "var(--accent)" }} />}
                  <BrandMark name={c} size={22} radius={6} />
                  {!collapsed && <span className="flex-1 text-left truncate">{c}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-2.5 pt-2.5">
          <button onClick={() => setPalette(true)}
            className={cx("w-full press flex items-center gap-2 rounded-lg border border-[var(--border)] bg-surface-2 text-muted hover:text-fg-2 transition-colors",
              collapsed ? "justify-center h-9" : "px-2.5 h-9 text-xs")}>
            <Command size={14} />
            {!collapsed && <><span className="flex-1 text-left">Buscar…</span><kbd className="text-[10px] font-mono rounded bg-surface-3 px-1.5 py-0.5 border border-[var(--border)]">⌘K</kbd></>}
          </button>
        </div>

        {/* sections of current workspace */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-2.5 py-2.5">
          {!collapsed && <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted/80 truncate">{ws.short}</div>}
          <div className="space-y-0.5">
            {ws.sections.map((sid) => {
              const n = NAV_BY_ID[sid];
              if (!n) return null;
              const active = route === sid;
              const Icon = n.icon;
              return (
                <button key={sid} onClick={() => goSection(sid)} title={collapsed ? n.label : undefined}
                  className={cx("group relative w-full press flex items-center gap-2.5 rounded-lg text-[13px] transition-colors",
                    collapsed ? "justify-center h-9" : "px-2.5 h-9",
                    active ? "bg-[color-mix(in_oklch,var(--brand)_12%,transparent)] text-fg font-medium" : "text-fg-2 hover:bg-surface-2 hover:text-fg")}>
                  {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[var(--brand)]" />}
                  <Icon size={16} className="shrink-0" style={{ color: active ? "var(--brand)" : undefined }} />
                  {!collapsed && <span className="flex-1 text-left truncate">{n.short}</span>}
                  {!collapsed && <span className="h-1.5 w-1.5 rounded-full shrink-0 opacity-70" style={{ background: depthColor[n.depth] }} />}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-[var(--border)] p-2.5 space-y-1">
          {!collapsed && (
            <div className="flex items-center gap-2 px-1 pb-1.5 opacity-80">
              <span className="text-[9px] uppercase tracking-wider text-shell-muted" style={{ color: "var(--shell-muted)" }}>Ecosistema</span>
              <img src={GEN_WORDMARK_WHITE} alt="GEN+" className="h-3.5 w-auto" />
            </div>
          )}
          <a href={`${import.meta.env.BASE_URL}activity/`} target="_blank" rel="noreferrer"
            title="AECODE Activity Control OS"
            className={cx("w-full press flex items-center gap-2.5 rounded-lg h-9 text-[13px] text-fg-2 hover:bg-surface-2 hover:text-fg transition-colors",
              collapsed ? "justify-center" : "px-2.5")}>
            <Activity size={16} className="shrink-0" style={{ color: "var(--c-aecode)" }} />
            {!collapsed && <><span className="flex-1 text-left truncate">AECODE Activity</span><ExternalLink size={12} className="opacity-50" /></>}
          </a>
          <button onClick={toggleSidebar}
            className={cx("hidden lg:flex w-full press items-center gap-2 rounded-lg h-9 text-xs text-muted hover:text-fg-2 hover:bg-surface-2 transition-colors",
              collapsed ? "justify-center" : "px-2.5")}>
            {collapsed ? <PanelLeft size={16} /> : <><PanelLeftClose size={16} /><span>Colapsar</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}
