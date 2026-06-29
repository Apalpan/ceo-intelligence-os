import { useMemo, useState, useEffect } from "react";
import { Bot, Wrench, ArrowRight, Layers, Compass } from "lucide-react";
import { useStore } from "@/store";
import { cx, dash, companyVar } from "@/lib/format";
import { Card, SectionTitle, Badge, ScoreRing, Semaforo, KeyVal, scoreColor, riskColor, EmptyState } from "@/components/ui";
import { ViewHeader, Grid, type ViewProps } from "./_shared";

const soles = (v: number | string) => typeof v === "number" ? "S/ " + v.toLocaleString("es-PE") : "—";
const ALTITUD = ["Estratégico", "Táctico", "Operativo"];
const MODO = ["Gestión", "Ejecución", "Desarrollo / Automatización"];

export default function PersonFocus(_: ViewProps) {
  const { bundle, personFilter, setPersonFilter, openDrawer } = useStore();
  const [lens, setLens] = useState<"altitud" | "modo">("altitud");
  if (!bundle) return null;

  const people = [...bundle.colaboradores].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const active = useMemo(() =>
    bundle.colaboradores.find((c) => c.nombre === personFilter) ||
    [...bundle.colaboradores].filter((c) => !c.solo_costo).sort((a, b) => b.aporte_score - a.aporte_score)[0],
    [bundle, personFilter]);

  useEffect(() => { if (active && personFilter === "all") setPersonFilter(active.nombre); }, [active, personFilter, setPersonFilter]);
  if (!active) return <><ViewHeader id="person-focus" /><EmptyState icon={Compass} title="Sin personas" /></>;

  const first = active.nombre.split(" ")[0].toLowerCase();
  const myProjects = bundle.proyectos.filter((p) => active.proyecto_ids.includes(p.id));
  const myTasks = bundle.tareas.filter((t) => (t.colaborador || "").split(" ")[0].toLowerCase() === first);
  const groups = lens === "altitud" ? ALTITUD : MODO;
  const keyOf = (t: typeof myTasks[0]) => (lens === "altitud" ? t.altitud : t.modo);

  return (
    <>
      <ViewHeader id="person-focus" right={
        <select value={active.nombre} onChange={(e) => setPersonFilter(e.target.value)}
          className="h-9 rounded-lg border border-[var(--border)] bg-surface px-2.5 text-sm outline-none focus-visible:ring-2">
          {people.map((p) => <option key={p.id} value={p.nombre}>{p.nombre}{p.solo_costo ? " · (solo costo)" : ""}</option>)}
        </select>
      } />

      {/* chips rápidos */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-2 mb-3">
        {people.filter((p) => !p.solo_costo).map((p) => (
          <button key={p.id} onClick={() => setPersonFilter(p.nombre)}
            className={cx("press shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              p.nombre === active.nombre ? "border-[var(--brand)] bg-[color-mix(in_oklch,var(--brand)_12%,transparent)] text-fg" : "border-[var(--border)] text-fg-2 hover:bg-surface-2")}>
            {p.nombre}
          </button>
        ))}
      </div>

      <Grid cols={3} className="mb-3">
        <Card className="md:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="grid place-items-center h-12 w-12 rounded-full text-base font-semibold text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${companyVar(active.empresas[0] || "AP")}, color-mix(in oklch, ${companyVar(active.empresas[0] || "AP")} 55%, black))` }}>
              {active.nombre.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold leading-tight">{active.nombre}</div>
              <div className="text-[11px] text-muted">{dash(active.empresa_area)}</div>
              {active.necesita_feedback && <Badge color="var(--violet)">Feedback CEO</Badge>}
            </div>
          </div>
          <div className="flex justify-between gap-1">
            <ScoreRing value={active.ai_native_score} size={52} color="var(--violet)" label="AI" />
            <ScoreRing value={active.wip_score} size={52} color={riskColor(active.wip_score)} label="WIP" />
            <ScoreRing value={active.aporte_score} size={52} color={scoreColor(active.aporte_score)} label="Aporte" />
          </div>
          <div className="mt-3 space-y-0.5">
            <KeyVal k="Función" v={dash(active.funcion)} />
            <KeyVal k="Costo/mes" v={soles(active.costo_final)} />
            <KeyVal k="Costo/Aporte" v={active.solo_costo ? "—" : dash(active.costo_aporte)} />
            <KeyVal k="Carga" v={dash(active.carga)} />
            <KeyVal k="Próxima acción" v={dash(active.proxima_accion)} />
          </div>
        </Card>

        {/* proyectos (bidireccional) */}
        <Card className="md:col-span-2">
          <SectionTitle title="Proyectos donde interviene" subtitle={`${myProjects.length} · click para detalle`} />
          {myProjects.length ? (
            <div className="grid sm:grid-cols-2 gap-2">
              {myProjects.map((p) => (
                <button key={p.id} onClick={() => openDrawer({ type: "project", id: p.id })}
                  className="text-left press rounded-lg border border-[var(--border)] p-2.5 hover:bg-surface-2 transition-colors">
                  <div className="flex items-center gap-2">
                    <Semaforo estado={p.estado} />
                    <span className="text-sm font-medium flex-1 truncate">{p.nombre}</span>
                    <span className="tnum text-xs font-semibold" style={{ color: scoreColor(p.health_score) }}>{p.health_score}</span>
                  </div>
                  <div className="text-[11px] text-muted mt-0.5 truncate">{p.empresa} · {p.area}</div>
                  {p.personas.length > 1 && <div className="text-[10px] text-muted mt-1">Con: {p.personas.filter((n) => n.split(" ")[0].toLowerCase() !== first).join(", ") || "—"}</div>}
                </button>
              ))}
            </div>
          ) : <EmptyState icon={Compass} title="Sin proyectos mapeados en la matriz" hint="Aparecen al figurar como responsable o mención en sus proyectos." />}
        </Card>
      </Grid>

      {/* enfoque por altitud / modo */}
      <Card className="mb-3">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <SectionTitle icon={Layers} title="Enfoque y actividades" subtitle={`${myTasks.length} tareas/pendientes`} />
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] p-0.5">
            <button onClick={() => setLens("altitud")} className={cx("press rounded-md px-2.5 h-7 text-xs font-medium", lens === "altitud" ? "bg-surface-2 text-fg" : "text-muted")}>Estratégico/Táctico/Operativo</button>
            <button onClick={() => setLens("modo")} className={cx("press rounded-md px-2.5 h-7 text-xs font-medium", lens === "modo" ? "bg-surface-2 text-fg" : "text-muted")}>Gestión/Ejecución/Desarrollo</button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {groups.map((g) => {
            const items = myTasks.filter((t) => keyOf(t) === g);
            return (
              <div key={g} className="rounded-xl border border-[var(--border)] bg-surface-2/30 p-3">
                <div className="text-xs font-semibold mb-2 flex items-center justify-between">
                  <span>{g}</span><span className="text-muted tnum">{items.length}</span>
                </div>
                <div className="space-y-1.5">
                  {items.map((t, i) => (
                    <div key={i} className="rounded-lg bg-surface border border-[var(--border)] p-2">
                      <p className="text-xs text-fg-2 line-clamp-3">{dash(t.descripcion)}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge color={t.prioridad === "alta" ? "var(--red)" : "var(--amber)"}>{t.prioridad}</Badge>
                        <span className="text-[10px] text-muted truncate">{dash(t.proyecto)}</span>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-[11px] text-muted">—</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Grid cols={3}>
        <Card><Block icon={Wrench} title="Herramientas IA recomendadas" items={active.herramientas_recomendadas} accent="var(--brand)" /></Card>
        <Card><Block icon={Bot} title="Agentes recomendados" items={active.agentes_recomendados} accent="var(--violet)" /></Card>
        <Card><Block icon={ArrowRight} title="Procesos delegables a IA" items={active.procesos_delegables} accent="var(--cyan)" /></Card>
      </Grid>
    </>
  );
}

function Block({ icon: Icon, title, items, accent }: { icon: typeof Bot; title: string; items: string[]; accent: string }) {
  return (
    <>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted mb-2"><Icon size={13} />{title}</div>
      {items?.length ? <div className="flex flex-wrap gap-1.5">{items.map((it, i) => <Badge key={i} color={accent}>{it}</Badge>)}</div>
        : <p className="text-xs text-muted">Sin datos aún.</p>}
    </>
  );
}
