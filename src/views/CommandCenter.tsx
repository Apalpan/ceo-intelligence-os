import { Gavel, ShieldAlert, Users, Sparkles, Activity, Flame, AlertTriangle, ArrowUpRight, Database, Clock } from "lucide-react";
import { useStore } from "@/store";
import { realCompanies } from "@/lib/data";
import { cx, dash, companyVar } from "@/lib/format";
import { Card, KPICard, ScoreRing, Semaforo, Badge, Confidence, scoreColor, riskColor, EmptyState } from "@/components/ui";
import { ViewHeader, Grid, type ViewProps } from "./_shared";

export default function CommandCenter({ navigate }: ViewProps) {
  const { bundle, companyFilter, openDrawer } = useStore();
  if (!bundle) return null;
  const cf = companyFilter;
  const inC = (e?: string) => cf === "all" || e === cf;

  const companies = realCompanies(bundle).filter((e) => e.presente && inC(e.nombre));
  const projects = bundle.proyectos.filter((p) => inC(p.empresa));
  const risks = bundle.riesgos.filter((r) => inC(r.empresa));
  const decisions = bundle.decisiones;
  const collabs = bundle.colaboradores;

  const healthVals = companies.map((c) => c.health_score).filter((v): v is number => typeof v === "number");
  const avgHealth = healthVals.length ? Math.round(healthVals.reduce((a, b) => a + b, 0) / healthVals.length) : 0;
  const p0 = risks.filter((r) => r.urgencia.includes("P0"));
  const overloaded = collabs.filter((c) => c.wip_score >= 75).sort((a, b) => b.wip_score - a.wip_score);
  const topDec = [...decisions].sort((a, b) => (a.urgencia.includes("P0") ? 0 : 1) - (b.urgencia.includes("P0") ? 0 : 1));
  const topAttn = [...projects].sort((a, b) => b.ceo_attention - a.ceo_attention).slice(0, 6);
  const reds = projects.filter((p) => p.estado === "rojo");
  const dq = bundle.data_quality;

  return (
    <>
      <ViewHeader id="command-center" right={
        <div className="text-right hidden sm:block">
          <div className="text-[11px] text-muted">Corte COO</div>
          <div className="text-xs font-medium tnum">{bundle.meta.corte}</div>
        </div>
      } />

      {/* KPI strip */}
      <Grid cols={4} className="mb-3">
        <KPICard label="Salud global" value={avgHealth} accent={scoreColor(avgHealth)} icon={Activity}
          sub={<span className="text-muted">{companies.length} empresas activas</span>}
          onClick={() => navigate("executive")} />
        <KPICard label="Riesgos P0" value={p0.length} accent="var(--red)" icon={Flame}
          sub={<span className="text-muted">{risks.length} riesgos totales</span>}
          onClick={() => navigate("risks")} />
        <KPICard label="Decisiones CEO" value={decisions.length} accent="var(--violet)" icon={Gavel}
          sub={<span className="text-muted">{decisions.filter(d => d.urgencia.includes("P0")).length} urgentes</span>}
          onClick={() => navigate("decisions")} />
        <KPICard label="Sobrecargados" value={overloaded.length} accent="var(--amber)" icon={Users}
          sub={<span className="text-muted">WIP ≥ 75</span>}
          onClick={() => navigate("people")} />
      </Grid>

      {/* company health strip */}
      <Card className="mb-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold">Salud por empresa</h3>
          <button onClick={() => navigate("executive")} className="text-xs text-[var(--brand)] hover:underline inline-flex items-center gap-1">Ver detalle <ArrowUpRight size={13} /></button>
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {companies.map((c) => (
            <button key={c.id} onClick={() => navigate("executive")}
              className="press flex flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-surface-2/40 p-3 hover:shadow-card transition-shadow">
              <ScoreRing value={c.health_score} size={58} label="Health" />
              <div className="text-center">
                <div className="text-xs font-semibold flex items-center gap-1.5 justify-center">
                  <span className="h-2 w-2 rounded-[3px]" style={{ background: companyVar(c.nombre) }} />{c.nombre}
                </div>
                <div className="mt-0.5"><Semaforo estado={c.estado_global} label /></div>
              </div>
            </button>
          ))}
          {companies.length === 0 && <div className="col-span-full"><EmptyState icon={Activity} title="Sin empresas para este filtro" /></div>}
        </div>
      </Card>

      <Grid cols={2} className="mb-3">
        {/* Decidir hoy */}
        <Card>
          <ListHead icon={Gavel} title="Decidir hoy" accent="var(--violet)" onMore={() => navigate("decisions")} />
          <div className="space-y-1.5 mt-2">
            {topDec.slice(0, 5).map((d) => (
              <button key={d.id} onClick={() => openDrawer({ type: "decision", id: d.id })}
                className="w-full text-left press rounded-lg border border-[var(--border)] p-2.5 hover:bg-surface-2 transition-colors">
                <div className="flex items-start gap-2">
                  <Badge color={d.urgencia.includes("P0") ? "var(--red)" : "var(--amber)"}>{d.urgencia}</Badge>
                  <span className="text-sm font-medium flex-1 leading-snug">{d.titulo}</span>
                </div>
                <p className="text-xs text-muted mt-1 line-clamp-2">{dash(d.recomendacion)}</p>
                <p className="text-[11px] text-muted mt-1">Límite: {dash(d.fecha_limite)}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Riesgos P0 */}
        <Card>
          <ListHead icon={ShieldAlert} title="Riesgos P0 / P1" accent="var(--red)" onMore={() => navigate("risks")} />
          <div className="space-y-1.5 mt-2">
            {[...risks].sort((a, b) => b.risk_score - a.risk_score).slice(0, 6).map((r) => (
              <button key={r.id} onClick={() => openDrawer({ type: "risk", id: r.id })}
                className="w-full text-left press rounded-lg border border-[var(--border)] p-2.5 hover:bg-surface-2 transition-colors flex items-start gap-2.5">
                <span className="mt-0.5 h-8 w-1 rounded-full shrink-0" style={{ background: riskColor(r.risk_score) }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Badge color={r.urgencia.includes("P0") ? "var(--red)" : "var(--amber)"}>{r.urgencia}</Badge>
                    <span className="text-[11px] text-muted">{r.empresa}</span>
                  </div>
                  <p className="text-sm leading-snug mt-1 line-clamp-2">{r.riesgo}</p>
                </div>
                <span className="text-sm tnum font-semibold shrink-0" style={{ color: riskColor(r.risk_score) }}>{r.risk_score}</span>
              </button>
            ))}
          </div>
        </Card>
      </Grid>

      <Grid cols={2} className="mb-3">
        {/* Foco CEO proyectos */}
        <Card>
          <ListHead icon={Flame} title="Foco de atención CEO" accent="var(--brand)" onMore={() => navigate("projects")} />
          <div className="mt-2 divide-y divide-[var(--border)]">
            {topAttn.map((p) => (
              <button key={p.id} onClick={() => openDrawer({ type: "project", id: p.id })}
                className="w-full text-left py-2 flex items-center gap-3 hover:bg-surface-2 transition-colors rounded-lg px-1">
                <Semaforo estado={p.estado} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{p.nombre}</div>
                  <div className="text-[11px] text-muted truncate">{p.empresa} · {p.area} · {dash(p.responsable)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm tnum font-semibold" style={{ color: scoreColor(100 - p.ceo_attention) }}>{p.ceo_attention}</div>
                  <div className="text-[10px] text-muted">atención</div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Equipo sobrecargado */}
        <Card>
          <ListHead icon={Users} title="Equipo sobrecargado (WIP)" accent="var(--amber)" onMore={() => navigate("people")} />
          <div className="mt-2 divide-y divide-[var(--border)]">
            {overloaded.slice(0, 6).map((c) => (
              <button key={c.id} onClick={() => openDrawer({ type: "person", id: c.id })}
                className="w-full text-left py-2 flex items-center gap-3 hover:bg-surface-2 transition-colors rounded-lg px-1">
                <div className="grid place-items-center h-8 w-8 rounded-full text-[11px] font-semibold text-white shrink-0"
                  style={{ background: `color-mix(in oklch, ${riskColor(c.wip_score)} 85%, black)` }}>
                  {c.nombre.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{c.nombre}</div>
                  <div className="text-[11px] text-muted truncate">{dash(c.proxima_accion)}</div>
                </div>
                <span className="text-sm tnum font-semibold shrink-0" style={{ color: riskColor(c.wip_score) }}>{c.wip_score}</span>
              </button>
            ))}
            {overloaded.length === 0 && <EmptyState icon={Users} title="Sin sobrecarga crítica" />}
          </div>
        </Card>
      </Grid>

      {/* Alerts row */}
      <Grid cols={3}>
        <Card>
          <ListHead icon={AlertTriangle} title="Datos contradictorios" accent="var(--amber)" onMore={() => navigate("data-quality")} />
          <div className="mt-2 space-y-1.5">
            {dq.contradicciones_detalle.length === 0 && <p className="text-xs text-muted py-3">Sin contradicciones detectadas.</p>}
            {dq.contradicciones_detalle.map((c, i) => (
              <div key={i} className="text-xs text-fg-2 rounded-lg bg-surface-2 px-2.5 py-2 border border-[var(--border)]">{c}</div>
            ))}
          </div>
        </Card>
        <Card>
          <ListHead icon={Database} title="Calidad de datos" accent="var(--brand)" onMore={() => navigate("data-quality")} />
          <div className="flex items-center gap-4 mt-2">
            <ScoreRing value={dq.data_quality_score} label="DQ" />
            <div className="flex-1 text-xs space-y-1 text-muted">
              <div className="flex justify-between"><span>Completitud</span><span className="tnum text-fg-2">{dq.completitud}</span></div>
              <div className="flex justify-between"><span>Evidencia</span><span className="tnum text-fg-2">{dq.evidencia}</span></div>
              <div className="flex justify-between"><span>Gaps</span><span className="tnum text-fg-2">{dq.gaps.length}</span></div>
            </div>
          </div>
        </Card>
        <Card>
          <ListHead icon={Sparkles} title="Madurez AI-Native" accent="var(--violet)" onMore={() => navigate("ai-native")} />
          <div className="flex items-center gap-4 mt-2">
            <ScoreRing value={bundle.ai_native.overall_score} color="var(--violet)" label="AI" />
            <div className="flex-1 text-xs text-muted">
              <p className="text-fg-2 font-medium">{bundle.ai_native.clasificacion}</p>
              <p className="mt-1">{bundle.ai_native.agentes_propuestos} agentes propuestos · {bundle.ai_native.procesos_automatizables} procesos automatizables</p>
            </div>
          </div>
        </Card>
      </Grid>

      {reds.length > 0 && (
        <p className="text-[11px] text-muted mt-4 flex items-center gap-1.5">
          <Clock size={12} /> {reds.length} proyectos en rojo · {p0.length} riesgos P0 · datos con confianza marcada · click en cualquier ítem para ver evidencia y fuente.
        </p>
      )}
    </>
  );
}

function ListHead({ icon: Icon, title, accent, onMore }:
  { icon: typeof Gavel; title: string; accent: string; onMore?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="grid place-items-center h-7 w-7 rounded-lg" style={{ background: `color-mix(in oklch, ${accent} 14%, transparent)`, color: accent }}><Icon size={15} /></span>
        <h3 className="text-[15px] font-semibold">{title}</h3>
      </div>
      {onMore && <button onClick={onMore} className="text-xs text-[var(--brand)] hover:underline inline-flex items-center gap-1">Ver todo <ArrowUpRight size={12} /></button>}
    </div>
  );
}
