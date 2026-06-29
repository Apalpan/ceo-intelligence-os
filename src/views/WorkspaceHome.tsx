import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { useStore } from "@/store";
import { WS_BY_ID, NAV_BY_ID } from "@/nav";
import { realCompanies } from "@/lib/data";
import { dash, companyVar } from "@/lib/format";
import { Card, KPICard, Badge, ScoreRing, Semaforo, BarRow, scoreColor, riskColor } from "@/components/ui";
import { ViewHeader, Grid, type ViewProps } from "./_shared";
import type { Bundle } from "@/types";

const soles = (v: number | string) => (typeof v === "number" ? "S/ " + v.toLocaleString("es-PE") : "X");

export default function WorkspaceHome({ id, navigate }: { id: string } & ViewProps) {
  const { bundle, companyFilter, openDrawer } = useStore();
  if (!bundle) return null;
  const ws = WS_BY_ID[id];
  const inC = (e?: string) => companyFilter === "all" || e === companyFilter;

  const { kpis, blocks } = build(id, bundle, inC, navigate, openDrawer);
  const isGlobal = id === "global";

  return (
    <>
      {isGlobal ? (
        <div className="relative overflow-hidden rounded-2xl mb-4 px-5 py-5 sm:px-7 sm:py-6 text-white shadow-card"
          style={{ background: "linear-gradient(135deg, var(--navy), var(--brand) 65%, var(--blue-light))" }}>
          <div className="absolute inset-0 opacity-[0.14] grid-bg" />
          <div className="relative flex items-center gap-4">
            <span className="grid place-items-center bg-white/95 font-display font-extrabold rounded-2xl shrink-0 shadow"
              style={{ width: 54, height: 54, fontSize: 28, color: "var(--brand)" }}>X</span>
            <div className="min-w-0">
              <h1 className="font-display font-extrabold leading-none tracking-tight" style={{ fontSize: "clamp(1.6rem,1.1rem+2vw,2.4rem)" }}>
                X · CEO Intelligence
              </h1>
              <p className="text-[13px] sm:text-sm opacity-90 mt-1.5">
                Ecosistema AP · GEN+ · AECODE · VisionPro · THESIA · AgentFlow — periodo {bundle.meta.periodo} · corte {bundle.meta.corte.split(" ")[0]}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <ViewHeader id={id} right={
          <div className="text-right hidden sm:block">
            <div className="text-[11px] text-muted">Periodo</div>
            <div className="text-xs font-medium tnum">{bundle.meta.periodo} · corte {bundle.meta.corte.split(" ")[0]}</div>
          </div>
        } />
      )}
      {kpis.length > 0 && <Grid cols={4} className="mb-3">{kpis}</Grid>}
      {blocks}

      {/* navegador de secciones */}
      <div className="mt-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">Secciones de este dashboard</div>
        <div className="grid gap-2.5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {ws.sections.filter((s) => s !== id).map((sid) => {
            const n = NAV_BY_ID[sid];
            if (!n) return null;
            const Icon = n.icon;
            return (
              <button key={sid} onClick={() => navigate(sid)}
                className="card !p-3 text-left press hover:shadow-card-hover transition-shadow group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="grid place-items-center h-8 w-8 rounded-lg bg-surface-2" style={{ color: ws.accent }}><Icon size={16} /></span>
                  <ArrowUpRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-sm font-medium leading-tight">{n.short}</div>
                <div className="text-[11px] text-muted line-clamp-2 mt-0.5">{n.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

type OpenDrawer = (t: { type: "project" | "person" | "risk" | "decision" | "agent"; id: string }) => void;

function build(id: string, b: Bundle, inC: (e?: string) => boolean, navigate: (s: string) => void, open: OpenDrawer):
  { kpis: ReactNode[]; blocks: ReactNode } {
  const projects = b.proyectos.filter((p) => inC(p.empresa));
  const risks = b.riesgos.filter((r) => inC(r.empresa));
  const K = (label: string, value: ReactNode, accent: string, extra?: Record<string, unknown>) =>
    <KPICard key={label} label={label} value={value} accent={accent} {...extra} />;

  if (id === "global") {
    const comps = realCompanies(b).filter((e) => e.presente && inC(e.nombre));
    const hv = comps.map((c) => c.health_score).filter((v): v is number => typeof v === "number");
    const avg = hv.length ? Math.round(hv.reduce((a, x) => a + x, 0) / hv.length) : 0;
    const p0 = risks.filter((r) => r.urgencia.includes("P0"));
    return {
      kpis: [
        K("Salud global", avg, scoreColor(avg)), K("Riesgos P0", p0.length, "var(--red)"),
        K("Decisiones", b.decisiones.length, "var(--violet)"),
        K("AI-Native", b.ai_native.overall_score, "var(--brand)"),
      ],
      blocks: (
        <Grid cols={2}>
          <Card>
            <Head title="Salud por empresa" onMore={() => navigate("executive")} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {comps.map((c) => (
                <button key={c.id} onClick={() => navigate("executive")} className="press flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] p-2.5 hover:shadow-card">
                  <ScoreRing value={c.health_score} size={52} />
                  <div className="text-[11px] font-semibold flex items-center gap-1"><span className="h-2 w-2 rounded-[3px]" style={{ background: companyVar(c.nombre) }} />{c.nombre}</div>
                  <Semaforo estado={c.estado_global} />
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <Head title="Decidir hoy + riesgos P0" onMore={() => navigate("decisions")} />
            <div className="space-y-1.5 mt-2">
              {b.decisiones.filter((d) => d.urgencia.includes("P0")).slice(0, 3).map((d) => (
                <button key={d.id} onClick={() => open({ type: "decision", id: d.id })} className="w-full text-left press rounded-lg border border-[var(--border)] p-2 hover:bg-surface-2">
                  <div className="flex items-center gap-1.5"><Badge color="var(--red)">{d.urgencia}</Badge><span className="text-sm font-medium truncate">{d.titulo}</span></div>
                </button>
              ))}
              {[...risks].sort((a, c) => c.risk_score - a.risk_score).slice(0, 3).map((r) => (
                <button key={r.id} onClick={() => open({ type: "risk", id: r.id })} className="w-full text-left press rounded-lg border border-[var(--border)] p-2 hover:bg-surface-2 flex items-center gap-2">
                  <span className="h-6 w-1 rounded-full" style={{ background: riskColor(r.risk_score) }} />
                  <span className="text-sm flex-1 truncate">{r.riesgo}</span><span className="tnum text-xs font-semibold" style={{ color: riskColor(r.risk_score) }}>{r.risk_score}</span>
                </button>
              ))}
            </div>
          </Card>
        </Grid>
      ),
    };
  }

  if (id === "finanzas") {
    const cost = b.costos;
    const caja = projects.filter((p) => /caja|cobr|finanz|factur|edp/i.test(p.area + p.nombre + p.funcion));
    return {
      kpis: [
        K("Planilla total", soles(cost.planilla_total), "var(--emerald)", { sub: `${cost.periodo} · ${cost.moneda}` }),
        ...Object.entries(cost.planilla_por_empresa).slice(0, 2).map(([e, v]) => K(`Planilla ${e}`, soles(v), companyVar(e))),
        K("Frentes de caja", caja.length, "var(--amber)", { onClick: () => navigate("cash") }),
      ],
      blocks: (
        <Grid cols={2}>
          <Card>
            <Head title="Planilla por empresa" onMore={() => navigate("team-cost")} />
            <div className="mt-2">
              {cost.enmascarado
                ? Object.keys(cost.planilla_por_empresa).map((e) => (
                    <div key={e} className="flex items-center justify-between py-1.5 text-sm border-b border-[var(--border)] last:border-0">
                      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: companyVar(e) }} />{e}</span>
                      <span className="tnum text-muted">X</span></div>))
                : Object.entries(cost.planilla_por_empresa).map(([e, v]) =>
                    <BarRow key={e} label={e} value={typeof v === "number" ? v : 0} max={typeof cost.planilla_total === "number" ? cost.planilla_total : 1} color={companyVar(e)} right={soles(v).replace("S/ ", "")} />)}
            </div>
            {cost.enmascarado && <p className="text-[10px] text-muted mt-2">Montos enmascarados («X»). Real solo en local.</p>}
          </Card>
          <Card>
            <Head title="Caja & cobranzas" onMore={() => navigate("cash")} />
            <div className="space-y-1.5 mt-2">
              {caja.map((p) => (
                <button key={p.id} onClick={() => open({ type: "project", id: p.id })} className="w-full text-left press rounded-lg border border-[var(--border)] p-2 hover:bg-surface-2 flex items-center gap-2">
                  <Semaforo estado={p.estado} /><span className="text-sm flex-1 truncate">{p.nombre}</span><span className="text-[11px] text-muted">{dash(p.responsable)}</span>
                </button>
              ))}
              {caja.length === 0 && <p className="text-xs text-muted py-3">Sin frentes de caja para este filtro.</p>}
            </div>
          </Card>
        </Grid>
      ),
    };
  }

  if (id === "comercial") {
    const com = projects.filter((p) => ["Comercial", "Marketing"].includes(p.funcion));
    const summit = projects.filter((p) => p.unidad === "AECODE AI Construction Summit");
    return {
      kpis: [
        K("Frentes comerciales", com.length, "var(--amber)"),
        K("Summit/Sponsors", summit.length, "var(--violet)", { onClick: () => navigate("summit") }),
        K("Riesgos comerciales", risks.filter((r) => /comercial|sponsor|ventas|marketing/i.test(r.area + r.riesgo)).length, "var(--red)"),
        K("En rojo", com.filter((p) => p.estado === "rojo").length, "var(--red)"),
      ],
      blocks: (
        <Card>
          <Head title="Pipeline comercial & marketing" onMore={() => navigate("sales")} />
          <div className="grid sm:grid-cols-2 gap-2 mt-2">
            {com.map((p) => (
              <button key={p.id} onClick={() => open({ type: "project", id: p.id })} className="text-left press rounded-lg border border-[var(--border)] p-2.5 hover:bg-surface-2">
                <div className="flex items-center gap-2"><Semaforo estado={p.estado} /><span className="text-sm font-medium flex-1 truncate">{p.nombre}</span><Badge color="var(--amber)">{p.funcion}</Badge></div>
                <div className="text-[11px] text-muted mt-0.5 truncate">{p.empresa} · {dash(p.responsable)}</div>
              </button>
            ))}
          </div>
        </Card>
      ),
    };
  }

  if (id === "proyectos") {
    const reds = projects.filter((p) => p.estado === "rojo");
    const avg = projects.length ? Math.round(projects.reduce((a, p) => a + p.health_score, 0) / projects.length) : 0;
    return {
      kpis: [
        K("Proyectos", projects.length, "var(--brand)"), K("En rojo", reds.length, "var(--red)"),
        K("Salud media", avg, scoreColor(avg)), K("Riesgos", risks.length, "var(--amber)"),
      ],
      blocks: (
        <Card>
          <Head title="Foco de atención (proyectos)" onMore={() => navigate("projects")} />
          <div className="mt-2 divide-y divide-[var(--border)]">
            {[...projects].sort((a, c) => c.ceo_attention - a.ceo_attention).slice(0, 8).map((p) => (
              <button key={p.id} onClick={() => open({ type: "project", id: p.id })} className="w-full text-left py-2 flex items-center gap-3 hover:bg-surface-2 rounded-lg px-1">
                <Semaforo estado={p.estado} />
                <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{p.nombre}</div><div className="text-[11px] text-muted truncate">{p.empresa} · {p.area} · {dash(p.responsable)}</div></div>
                <span className="tnum text-sm font-semibold" style={{ color: scoreColor(p.health_score) }}>{p.health_score}</span>
              </button>
            ))}
          </div>
        </Card>
      ),
    };
  }

  if (id === "automation") {
    const an = b.ai_native;
    return {
      kpis: [
        K("AI-Native", an.overall_score, "var(--violet)", { sub: an.clasificacion }),
        K("Agentes propuestos", an.agentes_propuestos, "var(--brand)", { onClick: () => navigate("ai-native") }),
        K("Procesos automatizables", an.procesos_automatizables, "var(--cyan)", { onClick: () => navigate("tactical") }),
        K("Backlog P0", an.backlog_automatizacion.filter((x) => x.prioridad.includes("P0")).length, "var(--red)"),
      ],
      blocks: (
        <Grid cols={2}>
          <Card>
            <Head title="Backlog de automatización" onMore={() => navigate("ai-native")} />
            <div className="space-y-1.5 mt-2">
              {an.backlog_automatizacion.slice(0, 6).map((x, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-[var(--border)] p-2">
                  <Badge color={x.prioridad.includes("P0") ? "var(--red)" : "var(--amber)"}>{x.prioridad}</Badge>
                  <span className="text-sm flex-1 truncate">{x.proceso}</span><span className="text-[11px] text-muted">{x.empresa}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <Head title="Agentes prioritarios" onMore={() => navigate("ai-native")} />
            <div className="grid gap-2 mt-2">
              {b.agentes.filter((a) => a.prioridad.includes("P0")).slice(0, 6).map((a) => (
                <button key={a.id} onClick={() => open({ type: "agent", id: a.id })} className="text-left press rounded-lg border border-[var(--border)] p-2 hover:bg-surface-2">
                  <div className="flex items-center gap-2"><Badge color="var(--red)">{a.prioridad}</Badge><span className="text-sm font-medium flex-1 truncate">{a.nombre}</span></div>
                  <div className="text-[11px] text-muted truncate mt-0.5">{a.empresa} · owner {a.owner_humano}</div>
                </button>
              ))}
            </div>
          </Card>
        </Grid>
      ),
    };
  }

  // team
  const withCost = b.colaboradores.filter((c) => typeof c.costo_final === "number");
  const feedback = b.colaboradores.filter((c) => c.necesita_feedback).length;
  return {
    kpis: [
      K("Personas", b.colaboradores.length, "var(--cyan)"),
      K("Planilla total", soles(b.costos.planilla_total), "var(--emerald)", { onClick: () => navigate("team-cost") }),
      K("AI-Native prom.", b.ai_native.overall_score, "var(--violet)"),
      K("Requieren feedback", feedback, "var(--amber)", { onClick: () => navigate("people") }),
    ],
    blocks: (
      <Grid cols={2}>
        <Card>
          <Head title="Ranking de carga (WIP)" onMore={() => navigate("people")} />
          <div className="mt-2">{[...b.colaboradores].sort((a, c) => c.wip_score - a.wip_score).slice(0, 6).map((c) =>
            <BarRow key={c.id} label={c.nombre} value={c.wip_score} color={riskColor(c.wip_score)} />)}</div>
        </Card>
        <Card>
          <Head title="Costo vs aporte (revisar)" onMore={() => navigate("team-cost")} />
          <div className="space-y-1.5 mt-2">
            {withCost.filter((c) => c.costo_aporte === "Revisar" && !c.solo_costo).slice(0, 6).map((c) => (
              <button key={c.id} onClick={() => { useStore.getState().setPersonFilter(c.nombre); navigate("person-focus"); }}
                className="w-full text-left press rounded-lg border border-[var(--border)] p-2 hover:bg-surface-2 flex items-center gap-2">
                <span className="text-sm flex-1 truncate">{c.nombre}</span>
                <Badge color="var(--red)">{c.costo_aporte}</Badge>
                <span className="text-[11px] text-muted tnum">aporte {c.aporte_score}</span>
              </button>
            ))}
            {withCost.filter((c) => c.costo_aporte === "Revisar" && !c.solo_costo).length === 0 && <p className="text-xs text-muted py-3">Sin casos marcados para revisar.</p>}
          </div>
        </Card>
      </Grid>
    ),
  };
}

function Head({ title, onMore }: { title: string; onMore?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {onMore && <button onClick={onMore} className="text-xs text-[var(--brand)] hover:underline inline-flex items-center gap-1">Ver todo <ArrowUpRight size={12} /></button>}
    </div>
  );
}
