import { PanelLeftClose, PanelLeft, Command, Dot as DotIcon } from "lucide-react";
import { NAV, NAV_GROUPS } from "@/nav";
import { useStore } from "@/store";
import { cx } from "@/lib/format";

const depthColor = { core: "var(--emerald)", live: "var(--brand)", scaffold: "var(--amber)" } as const;

export function Sidebar({ route, navigate }: { route: string; navigate: (id: string) => void }) {
  const { sidebarCollapsed, toggleSidebar, mobileNavOpen, setMobileNav, setPalette } = useStore();
  const collapsed = sidebarCollapsed;

  const go = (id: string) => { navigate(id); setMobileNav(false); };

  return (
    <>
      {/* mobile backdrop */}
      {mobileNavOpen && <div className="fixed inset-0 z-30 bg-[color-mix(in_oklch,var(--navy)_40%,transparent)] lg:hidden animate-fade-in" onClick={() => setMobileNav(false)} />}

      <aside
        className={cx(
          "z-40 flex flex-col border-r border-[var(--border)] bg-surface shrink-0",
          "fixed inset-y-0 left-0 lg:static transition-[transform,width] duration-300 ease-out-expo",
          collapsed ? "w-[68px]" : "w-[244px]",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* brand */}
        <div className={cx("flex items-center gap-2.5 h-14 px-3 border-b border-[var(--border)]", collapsed && "justify-center")}>
          <div className="grid place-items-center h-8 w-8 rounded-lg shrink-0 text-white font-display font-bold text-sm"
            style={{ background: "linear-gradient(135deg, var(--brand), var(--violet))" }}>AP</div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[13px] font-semibold leading-tight tracking-tight">CEO Intelligence</div>
              <div className="text-[10px] text-muted leading-tight">Operating System</div>
            </div>
          )}
        </div>

        {/* search trigger */}
        <div className="px-2.5 pt-2.5">
          <button onClick={() => setPalette(true)}
            className={cx("w-full press flex items-center gap-2 rounded-lg border border-[var(--border)] bg-surface-2 text-muted hover:text-fg-2 transition-colors",
              collapsed ? "justify-center h-9" : "px-2.5 h-9 text-xs")}>
            <Command size={14} />
            {!collapsed && <><span className="flex-1 text-left">Buscar…</span><kbd className="text-[10px] font-mono rounded bg-surface-3 px-1.5 py-0.5 border border-[var(--border)]">⌘K</kbd></>}
          </button>
        </div>

        {/* nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-2.5 py-2.5 space-y-3">
          {NAV_GROUPS.map((group) => (
            <div key={group}>
              {!collapsed && <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted/80">{group}</div>}
              <div className="space-y-0.5">
                {NAV.filter((n) => n.group === group).map((n) => {
                  const active = route === n.id;
                  const Icon = n.icon;
                  return (
                    <button key={n.id} onClick={() => go(n.id)} title={collapsed ? n.label : undefined}
                      className={cx("group relative w-full press flex items-center gap-2.5 rounded-lg text-[13px] transition-colors",
                        collapsed ? "justify-center h-9" : "px-2.5 h-9",
                        active ? "bg-[color-mix(in_oklch,var(--brand)_12%,transparent)] text-fg font-medium"
                          : "text-fg-2 hover:bg-surface-2 hover:text-fg")}>
                      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[var(--brand)]" />}
                      <Icon size={17} className="shrink-0" style={{ color: active ? "var(--brand)" : undefined }} />
                      {!collapsed && <span className="flex-1 text-left truncate">{n.short}</span>}
                      {!collapsed && <span className="h-1.5 w-1.5 rounded-full shrink-0 opacity-70" style={{ background: depthColor[n.depth] }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* footer */}
        <div className="border-t border-[var(--border)] p-2.5">
          <button onClick={toggleSidebar}
            className={cx("hidden lg:flex w-full press items-center gap-2 rounded-lg h-9 text-xs text-muted hover:text-fg-2 hover:bg-surface-2 transition-colors",
              collapsed ? "justify-center" : "px-2.5")}>
            {collapsed ? <PanelLeft size={16} /> : <><PanelLeftClose size={16} /><span>Colapsar</span></>}
          </button>
          {!collapsed && (
            <div className="px-2 pt-2 flex items-center gap-1.5 text-[10px] text-muted">
              <DotIcon size={14} className="text-[var(--emerald)]" /> core · datos vivos · en evolución
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
