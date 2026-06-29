import { useMemo } from "react";
import { Activity, ShieldAlert, Gavel, Users, FolderKanban, Banknote, Boxes } from "lucide-react";
import { useStore } from "@/store";
import { dash, companyVar, cx } from "@/lib/format";
import { Card, SectionTitle, KPICard, Badge, ScoreRing, Semaforo, EmptyState, scoreColor, riskColor, BrandMark, AECODITO, DepthTag } from "@/components/ui";
import { Grid, type ViewProps } from "./_shared";

const soles = (v: number) => "S/ " + v.toLocaleString("es-PE");

// KPIs específicos por empresa (V2). Los no derivables quedan como slot "No se tiene claro".
const KPI_SLOTS: Record<string, string[]> = {
  "GEN+": ["Entregables validados", "Alcance contratado vs real", "Adicionales detectados", "EDP / facturas pendientes", "Horas en riesgo", "Estado de cobro"],
  AECODE: ["Leads", "Ventas completas", "Primeras cuotas", "Pendiente de cobro", "Conversión por canal", "Skills verificadas", "Evidence Upload Rate", "Certificados emitidos", "Reclamos / bloqueos"],
  VisionPro: ["Demo estable", "Cámaras activas", "Eventos detectados", "Precisión IA", "Conectividad", "Usuarios creados", "Alertas útiles vs ruido", "Oferta piloto"],
  THESIA: ["Tesis activas", "Propuestas", "Validación de mercado", "Fechas comprometidas"],
  AgentFlow: ["Flujos activos", "Ejecuciones exitosas", "Fallos", "Tiempo ahorrado", "Acciones humanas requeridas", "Logs auditables", "Fallback definido"],
};

export default function CompanyDashboard({ empresa, navigate }: { empresa: string } & ViewProps) {
  const { bundle, openDrawer } = useStore();
  if (!bundle) return null;
  const meta = bundle.empresas.find((e) => e.nombre === empresa);
  const projects = useMemo(() => bundle.proyectos.filter((p) => p.empresa === empresa), [bundle, empresa]);
  const risks = bundle.riesgos.filter((r) => r.empresa === empresa);
  const people = bundle.colaboradores.filter((c) => c.empresas.includes(empresa) || (c.costo_por_empresa && empresa in c.costo_por_empresa));
  const planilla = bundle.costos.planilla_por_empresa[empresa];
  const reds = projects.filter((p) => p.estado === "rojo");
  const p0 = risks.filter((r) => r.urgencia.includes("P0"));
  const decisions = bundle.decisiones.filter((d) => (d.recomendacion + d.contexto + d.titulo).toLowerCase().includes(empresa.toLowerCase().replace("+", "")));
  const slots = KPI_SLOTS[empresa] || [];

  // unidades (AECODE)
  const units = empresa === "AECODE"
    ? Object.entries(projects.reduce<Record<string, number>>((a, p) => { a[p.unidad] = (a[p.unidad] || 0) + 1; return a; }, {}))
    : [];

  if (!meta) return <EmptyState icon={Boxes} title={`Sin datos para ${empresa}`} />;

  return (
    <>
      {/* hero */}
      <div className="relative flex items-start justify-between gap-4 mb-5 overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <BrandMark name={empresa} size={52} radius={16} />
          <div className="min-w-0">
            <div className="flex items-center gap-2"><h1 className="text-display">{empresa}</h1><DepthTag depth="live" /></div>
            <p className="text-sm text-muted mt-0.5">Dashboard de empresa · periodo {bundle.meta.periodo}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {empresa === "AECODE" && <img src={AECODITO} alt="" className="h-14 w-14 object-contain hidden sm:block opacity-90" loading="lazy" />}
          <Semaforo estado={meta.estado_global} label />
        </div>
      </div>

      {/* diagnóstico ejecutivo */}
      <Card className="mb-3" style={{ borderLeft: `3px solid ${companyVar(empresa)}` }}>
        <SectionTitle title="Diagnóstico ejecutivo" />
        <p className="text-sm text-fg-2">
          {empresa} opera en estado <b style={{ color: scoreColor(typeof meta.health_score === "number" ? meta.health_score : 50) }}>{String(meta.estado_global).toUpperCase()}</b>.
          {" "}{projects.length} proyectos ({reds.length} en rojo), {risks.length} riesgos ({p0.length} P0).
          {typeof planilla === "number" && <> Planilla {bundle.costos.periodo}: <b>{soles(planilla)}</b> ({people.length} personas).</>}
          {" "}Salud media {dash(meta.health_score)}, AI-Native {dash(meta.ai_native_score)}.
        </p>
      </Card>

      {/* KPIs derivables */}
      <Grid cols={4} className="mb-3">
        <KPICard label="Salud" value={meta.health_score} accent={scoreColor(typeof meta.health_score === "number" ? meta.health_score : 0)} icon={Activity} />
        <KPICard label="Riesgo" value={meta.risk_score} accent={typeof meta.risk_score === "number" ? riskColor(meta.risk_score) : "var(--muted)"} icon={ShieldAlert} />
        <KPICard label="Proyectos" value={projects.length} accent="var(--brand)" icon={FolderKanban} sub={`${reds.length} en rojo`} />
        {typeof planilla === "number"
          ? <KPICard label={`Planilla ${bundle.costos.periodo}`} value={soles(planilla)} accent="var(--emerald)" icon={Banknote} sub={`${people.length} personas`} onClick={() => navigate("team-cost")} />
          : <KPICard label="AI-Native" value={meta.ai_native_score} accent="var(--violet)" icon={Users} />}
      </Grid>

      {units.length > 0 && (
        <Card className="mb-3">
          <SectionTitle icon={Boxes} title="Unidades AECODE" subtitle="Proyectos por unidad" />
          <div className="flex flex-wrap gap-2">
            {units.map(([u, n]) => (
              <span key={u} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm">
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent2)" }} />{u.replace("AECODE ", "")}<b className="tnum">{n}</b>
              </span>
            ))}
          </div>
        </Card>
      )}

      <Grid cols={2} className="mb-3">
        {/* proyectos */}
        <Card>
          <SectionTitle icon={FolderKanban} title="Proyectos activos" subtitle={`${projects.length}`} right={<button onClick={() => navigate("projects")} className="text-xs text-[var(--brand)] hover:underline">Portafolio</button>} />
          <div className="divide-y divide-[var(--border)] max-h-[340px] overflow-y-auto scrollbar-thin">
            {projects.sort((a, b) => b.ceo_attention - a.ceo_attention).map((p) => (
              <button key={p.id} onClick={() => navigate(`ficha/${p.id}`)}
                className="w-full text-left py-2 flex items-center gap-3 hover:bg-surface-2 rounded-lg px-1 transition-colors">
                <Semaforo estado={p.estado} />
                <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{p.nombre}</div><div className="text-[11px] text-muted truncate">{p.area} · {dash(p.responsable)}</div></div>
                <span className="tnum text-sm font-semibold" style={{ color: scoreColor(p.health_score) }}>{p.health_score}</span>
              </button>
            ))}
            {projects.length === 0 && <EmptyState icon={FolderKanban} title="Sin proyectos" />}
          </div>
        </Card>

        {/* riesgos + decisiones */}
        <div className="space-y-3">
          <Card>
            <SectionTitle icon={ShieldAlert} title="Riesgos" subtitle={`${risks.length} · ${p0.length} P0`} right={<button onClick={() => navigate("risks")} className="text-xs text-[var(--brand)] hover:underline">Ver todo</button>} />
            <div className="space-y-1.5 max-h-[150px] overflow-y-auto scrollbar-thin">
              {risks.sort((a, b) => b.risk_score - a.risk_score).slice(0, 5).map((r) => (
                <button key={r.id} onClick={() => openDrawer({ type: "risk", id: r.id })} className="w-full text-left press rounded-lg border border-[var(--border)] p-2 hover:bg-surface-2 flex items-center gap-2">
                  <Badge color={r.urgencia.includes("P0") ? "var(--red)" : "var(--amber)"}>{r.urgencia}</Badge>
                  <span className="text-xs flex-1 truncate">{r.riesgo}</span>
                </button>
              ))}
              {risks.length === 0 && <p className="text-xs text-muted py-2">Sin riesgos.</p>}
            </div>
          </Card>
          <Card>
            <SectionTitle icon={Gavel} title="Decisiones que afectan" subtitle={`${decisions.length}`} />
            <div className="space-y-1">
              {decisions.slice(0, 4).map((d) => (
                <button key={d.id} onClick={() => openDrawer({ type: "decision", id: d.id })} className="w-full text-left text-xs press rounded-lg p-1.5 hover:bg-surface-2 flex items-center gap-1.5">
                  <Badge color={d.urgencia.includes("P0") ? "var(--red)" : "var(--amber)"}>{d.urgencia}</Badge><span className="truncate">{d.titulo}</span>
                </button>
              ))}
              {decisions.length === 0 && <p className="text-xs text-muted py-2">Sin decisiones asociadas.</p>}
            </div>
          </Card>
        </div>
      </Grid>

      <Grid cols={2}>
        {/* personas */}
        <Card>
          <SectionTitle icon={Users} title="Equipo" subtitle={`${people.length} personas`} right={<button onClick={() => navigate("people")} className="text-xs text-[var(--brand)] hover:underline">People</button>} />
          <div className="grid sm:grid-cols-2 gap-1.5 max-h-[260px] overflow-y-auto scrollbar-thin">
            {people.sort((a, b) => b.aporte_score - a.aporte_score).map((c) => (
              <button key={c.id} onClick={() => { useStore.getState().setPersonFilter(c.nombre); navigate("person-focus"); }}
                className="text-left press rounded-lg border border-[var(--border)] p-2 hover:bg-surface-2 flex items-center gap-2">
                <span className="grid place-items-center h-7 w-7 rounded-full text-[10px] font-semibold text-white shrink-0" style={{ background: companyVar(empresa) }}>{c.nombre.slice(0, 2).toUpperCase()}</span>
                <div className="min-w-0 flex-1"><div className="text-xs font-medium truncate">{c.nombre}</div><div className="text-[10px] text-muted truncate">{dash(c.funcion)}</div></div>
              </button>
            ))}
          </div>
        </Card>

        {/* KPI slots (estructura V2) */}
        <Card>
          <SectionTitle title="KPIs de empresa" subtitle="Estructura V2 · pendiente de fuente" right={<Badge color="var(--amber)">Requiere validación</Badge>} />
          <div className="grid grid-cols-2 gap-1.5">
            {slots.map((k) => (
              <div key={k} className="rounded-lg border border-dashed border-[var(--border-strong)] p-2 bg-surface-2/40">
                <div className="text-[11px] text-fg-2 leading-tight">{k}</div>
                <div className="text-xs text-muted mt-0.5">No se tiene claro</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted mt-2">Slots listos para llenarse desde el vault o Sheets (ventas/caja/CV). No se inventan números.</p>
        </Card>
      </Grid>
    </>
  );
}
