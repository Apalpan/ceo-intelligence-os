import { useMemo, useState, useEffect } from "react";
import { Bot, Wrench, ArrowRight, Layers, Compass, Search, Target, AlertTriangle, Sparkles, ListChecks, FolderKanban } from "lucide-react";
import { useStore } from "@/store";
import { cx, dash, companyVar } from "@/lib/format";
import { Card, SectionTitle, Badge, ScoreRing, Radar, Semaforo, BrandMark, scoreColor, riskColor, EmptyState } from "@/components/ui";
import { ViewHeader, Grid, type ViewProps } from "./_shared";

const ALTITUD = ["Estratégico", "Táctico", "Operativo"];
const MODO = ["Gestión", "Ejecución", "Desarrollo / Automatización"];
const prioColor = (p: string) => /critic/i.test(p) ? "var(--red)" : /alta/i.test(p) ? "var(--amber)" : "var(--muted)";

export default function PersonFocus(_: ViewProps) {
  const { bundle, personFilter, setPersonFilter, openDrawer } = useStore();
  const [lens, setLens] = useState<"altitud" | "modo">("altitud");
  const [q, setQ] = useState("");
  const [areaF, setAreaF] = useState("all");
  if (!bundle) return null;

  const people = [...bundle.colaboradores].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const active = useMemo(() =>
    bundle.colaboradores.find((c) => c.nombre === personFilter) ||
    [...bundle.colaboradores].filter((c) => !c.solo_costo).sort((a, b) => b.evaluacion - a.evaluacion)[0],
    [bundle, personFilter]);
  useEffect(() => { if (active && personFilter === "all") setPersonFilter(active.nombre); }, [active, personFilter, setPersonFilter]);
  if (!active) return <><ViewHeader id="person-focus" /><EmptyState icon={Compass} title="Sin personas" /></>;

  const company = active.empresas[0] || "AP";
  const first = active.nombre.split(" ")[0].toLowerCase();
  const myProjects = bundle.proyectos.filter((p) => active.proyecto_ids.includes(p.id));
  const myTasks = bundle.tareas.filter((t) => (t.colaborador || "").split(" ")[0].toLowerCase() === first);
  const radarData = Object.entries(active.eval_dims || {}).map(([label, value]) => ({ label, value }));

  const areas = Array.from(new Set(active.actividades_clave.map((a) => a.area).filter(Boolean)));
  const acts = active.actividades_clave.filter((a) =>
    (areaF === "all" || a.area === areaF) &&
    (!q || (a.actividad + a.area + a.metrica).toLowerCase().includes(q.toLowerCase())));

  const groups = lens === "altitud" ? ALTITUD : MODO;
  const keyOf = (t: typeof myTasks[0]) => (lens === "altitud" ? t.altitud : t.modo);
  const evalColor = scoreColor(active.evaluacion);

  return (
    <div data-company={company}>
      <ViewHeader id="person-focus" right={
        <select value={active.nombre} onChange={(e) => setPersonFilter(e.target.value)}
          className="h-9 rounded-lg border border-[var(--border)] bg-surface px-2.5 text-sm outline-none focus-visible:ring-2">
          {people.map((p) => <option key={p.id} value={p.nombre}>{p.nombre}{p.solo_costo ? " · (solo costo)" : ""}</option>)}
        </select>
      } />

      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-2 mb-3">
        {people.filter((p) => !p.solo_costo).map((p) => (
          <button key={p.id} onClick={() => setPersonFilter(p.nombre)}
            className={cx("press shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              p.nombre === active.nombre ? "border-[var(--brand)] bg-[color-mix(in_oklch,var(--brand)_12%,transparent)] text-fg" : "border-[var(--border)] text-fg-2 hover:bg-surface-2")}>
            {p.nombre}
          </button>
        ))}
      </div>

      {/* identidad + evaluacion */}
      <Grid cols={3} className="mb-3">
        <Card className="md:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="grid place-items-center h-14 w-14 rounded-2xl text-lg font-display font-extrabold text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${companyVar(company)}, color-mix(in oklch, ${companyVar(company)} 52%, black))` }}>
              {active.nombre.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold leading-tight truncate">{active.nombre}</div>
              <div className="text-[11px] text-muted leading-snug line-clamp-2">{dash(active.rol)}</div>
              <div className="mt-1 flex items-center gap-1.5"><BrandMark name={company} size={14} radius={4} /><span className="text-[11px] text-muted">{active.empresa_area}</span></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ScoreRing value={active.evaluacion} size={76} color={evalColor} label="Evaluación" />
            <div className="flex-1 grid grid-cols-2 gap-1.5 text-xs">
              <Mini label="Aporte" v={active.aporte_score} />
              <Mini label="AI-native" v={active.ai_native_score} c="var(--violet)" />
              <Mini label="WIP" v={active.wip_score} c={riskColor(active.wip_score)} />
              <Mini label="Costo" v={typeof active.costo_final === "number" ? active.costo_final : "X"} />
            </div>
          </div>
          {active.necesita_feedback && <div className="mt-2"><Badge color="var(--violet)">Requiere feedback CEO</Badge></div>}
        </Card>

        <Card className="md:col-span-1 flex flex-col items-center justify-center">
          <SectionTitle title="Evaluación 360" subtitle="6 dimensiones" />
          {radarData.length ? <Radar data={radarData} size={188} color={evalColor} /> : <EmptyState icon={Target} title="Sin datos" />}
        </Card>

        <Card className="md:col-span-1">
          <SectionTitle icon={FolderKanban} title="Proyectos" subtitle={`${myProjects.length} donde interviene`} />
          <div className="space-y-1.5 max-h-[230px] overflow-y-auto scrollbar-thin">
            {myProjects.map((p) => (
              <button key={p.id} onClick={() => openDrawer({ type: "project", id: p.id })}
                className="w-full text-left press rounded-lg border border-[var(--border)] p-2 hover:bg-surface-2 flex items-center gap-2">
                <Semaforo estado={p.estado} />
                <span className="text-sm flex-1 truncate">{p.nombre}</span>
                <span className="tnum text-xs font-semibold" style={{ color: scoreColor(p.health_score) }}>{p.health_score}</span>
              </button>
            ))}
            {myProjects.length === 0 && <EmptyState icon={Compass} title="Sin proyectos mapeados" />}
          </div>
        </Card>
      </Grid>

      {/* enfoque */}
      {active.enfoque.length > 0 && (
        <Card className="mb-3">
          <SectionTitle icon={Sparkles} title="Enfoque del rol" />
          <div className="flex flex-wrap gap-1.5">{active.enfoque.map((e, i) => <Badge key={i} color="var(--brand)">{e}</Badge>)}</div>
        </Card>
      )}

      {/* actividades clave (20+ puntos, filtrable) */}
      <Card className="mb-3">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <SectionTitle icon={ListChecks} title="Actividades clave por proyecto" subtitle={`${acts.length} de ${active.actividades_clave.length}`} />
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-surface-2 border border-[var(--border)]">
              <Search size={13} className="text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar actividad…"
                className="bg-transparent outline-none text-xs w-32 placeholder:text-muted" />
            </div>
            <select value={areaF} onChange={(e) => setAreaF(e.target.value)}
              className="h-8 rounded-lg border border-[var(--border)] bg-surface px-2 text-xs outline-none">
              <option value="all">Todas las áreas</option>
              {areas.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        {acts.length ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {acts.map((a, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-surface-2/30 p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono text-muted">{a.act}</span>
                  <Badge color={prioColor(a.prioridad)}>{dash(a.prioridad)}</Badge>
                </div>
                <p className="text-[13px] font-medium leading-snug mb-2">{a.actividad}</p>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {a.area !== "No se tiene claro" && <span className="px-1.5 py-0.5 rounded bg-surface-3 text-fg-2">{a.area}</span>}
                  {a.sla !== "No se tiene claro" && <span className="px-1.5 py-0.5 rounded bg-surface-3 text-muted">SLA {a.sla}</span>}
                </div>
                {a.evidencia !== "No se tiene claro" && <p className="text-[10px] text-muted mt-1.5">📎 {a.evidencia}</p>}
              </div>
            ))}
          </div>
        ) : <EmptyState icon={ListChecks} title="Sin actividades clave registradas" hint="Se extraen de Actividades-Clave.md del colaborador." />}
      </Card>

      {/* avances + restricciones + aportes */}
      <Grid cols={3} className="mb-3">
        <Card className="md:col-span-1">
          <SectionTitle icon={Layers} title="Avances recientes" subtitle={`${active.avances_detalle.length} registrados`} />
          <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
            {groupAvances(active.avances_detalle).map(([sec, items]) => (
              <div key={sec}>
                <div className="text-[10px] uppercase tracking-wide text-muted mb-1">{sec}</div>
                <ul className="space-y-1">{items.map((t, i) => <li key={i} className="text-xs text-fg-2 flex gap-1.5"><span className="text-[var(--emerald)] mt-0.5">▪</span><span>{t}</span></li>)}</ul>
              </div>
            ))}
            {active.avances_detalle.length === 0 && <EmptyState icon={Layers} title="Sin avances" />}
          </div>
        </Card>
        <Card className="md:col-span-1">
          <SectionTitle icon={AlertTriangle} title="Restricciones" subtitle="Lo que lo bloquea" />
          <div className="space-y-1.5">
            {active.restricciones.map((r, i) => (
              <div key={i} className="text-xs text-fg-2 rounded-lg bg-[color-mix(in_oklch,var(--amber)_8%,transparent)] border border-[color-mix(in_oklch,var(--amber)_22%,transparent)] px-2.5 py-2">{r}</div>
            ))}
            {active.restricciones.length === 0 && <p className="text-xs text-muted py-3">Sin restricciones registradas.</p>}
          </div>
        </Card>
        <Card className="md:col-span-1">
          <SectionTitle icon={Sparkles} title="Aportes & métricas" subtitle="Valor que mueve" />
          <div className="flex flex-wrap gap-1.5 mb-2">{active.metricas.map((m, i) => <Badge key={i} color="var(--emerald)">{m}</Badge>)}</div>
          <div className="space-y-1.5 mt-2">
            <Block icon={Bot} title="Agentes sugeridos" items={active.agentes_recomendados} accent="var(--violet)" />
            <Block icon={Wrench} title="Herramientas IA" items={active.herramientas_recomendadas} accent="var(--brand)" />
            <Block icon={ArrowRight} title="Delegable a IA" items={active.procesos_delegables} accent="var(--cyan)" />
          </div>
        </Card>
      </Grid>

      {/* enfoque por altitud/modo */}
      {myTasks.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <SectionTitle icon={Compass} title="Tareas por enfoque" subtitle={`${myTasks.length} tareas/pendientes`} />
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
                  <div className="text-xs font-semibold mb-2 flex items-center justify-between"><span>{g}</span><span className="text-muted tnum">{items.length}</span></div>
                  <div className="space-y-1.5">
                    {items.map((t, i) => <div key={i} className="rounded-lg bg-surface border border-[var(--border)] p-2 text-xs text-fg-2 line-clamp-3">{dash(t.descripcion)}</div>)}
                    {items.length === 0 && <p className="text-[11px] text-muted">—</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function Mini({ label, v, c }: { label: string; v: number | string; c?: string }) {
  return (
    <div className="rounded-lg bg-surface-2 px-2 py-1.5">
      <div className="text-[10px] text-muted">{label}</div>
      <div className="text-sm font-semibold tnum" style={{ color: typeof v === "number" ? (c || scoreColor(v)) : "var(--muted)" }}>{v}</div>
    </div>
  );
}
function Block({ icon: Icon, title, items, accent }: { icon: typeof Bot; title: string; items: string[]; accent: string }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted mb-1"><Icon size={12} />{title}</div>
      <div className="flex flex-wrap gap-1">{items.map((it, i) => <Badge key={i} color={accent}>{it}</Badge>)}</div>
    </div>
  );
}
function groupAvances(av: { seccion: string; texto: string }[]): [string, string[]][] {
  const m = new Map<string, string[]>();
  for (const a of av) { const k = a.seccion || "General"; if (!m.has(k)) m.set(k, []); m.get(k)!.push(a.texto); }
  return Array.from(m.entries()).slice(0, 8);
}
