import { ArrowLeft, FileText, Users, ShieldAlert, Target } from "lucide-react";
import { useStore } from "@/store";
import { dash, companyVar } from "@/lib/format";
import { Card, SectionTitle, KPICard, Badge, Confidence, Semaforo, ScoreRing, Progress, KeyVal, EmptyState, scoreColor, riskColor } from "@/components/ui";
import { Grid, type ViewProps } from "./_shared";

// Contrato de datos (V2): estados que separan avance / entregable / validación / cobro.
const CONTRACT = [
  { k: "Avance interno", derive: (a: number) => `${a}%`, tone: "ok" },
  { k: "Entregable enviado", slot: true },
  { k: "Validación externa", slot: true },
  { k: "Estado de cobro", slot: true, val: "Requiere validación" },
  { k: "Alcance contratado vs real", slot: true },
  { k: "Adicionales detectados", slot: true },
  { k: "EDP / factura", slot: true, val: "Requiere validación" },
  { k: "Horas en riesgo", slot: true },
];

export default function ProjectFicha({ id, navigate }: { id: string } & ViewProps) {
  const { bundle, openDrawer } = useStore();
  if (!bundle) return null;
  const p = bundle.proyectos.find((x) => x.id === id);
  if (!p) return <EmptyState icon={Target} title="Proyecto no encontrado" hint="Vuelve al portafolio." />;

  const risks = bundle.riesgos.filter((r) => r.proyecto === p.nombre || (r.proyecto && p.nombre.toLowerCase().includes(r.proyecto.toLowerCase())));
  const nameByFirst: Record<string, string> = {};
  bundle.colaboradores.forEach((c) => { nameByFirst[c.nombre.split(" ")[0].toLowerCase()] = c.nombre; });

  return (
    <>
      <button onClick={() => navigate(`co/${p.empresa}`)} className="press inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg-2 mb-3">
        <ArrowLeft size={14} /> {p.empresa}
      </button>

      {/* hero */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: companyVar(p.empresa) }} />
            <span className="text-xs text-muted">{p.empresa} · {p.unidad !== p.empresa ? p.unidad + " · " : ""}{p.area}</span>
          </div>
          <h1 className="text-display">{p.nombre}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Semaforo estado={p.estado} label />
            <Badge color="var(--brand)">{p.funcion}</Badge>
            <Confidence value={p.confianza} />
            <span className="text-xs text-muted">Owner: <b className="text-fg-2">{dash(p.responsable)}</b></span>
          </div>
        </div>
      </div>

      {/* scores */}
      <Grid cols={4} className="mb-3">
        <Card className="flex items-center gap-3"><ScoreRing value={p.health_score} label="Health" /><div className="text-xs text-muted">Salud del<br />proyecto</div></Card>
        <Card className="flex items-center gap-3"><ScoreRing value={p.risk_score} color={riskColor(p.risk_score)} label="Risk" /><div className="text-xs text-muted">Riesgo</div></Card>
        <Card className="flex items-center gap-3"><ScoreRing value={p.ceo_attention} label="CEO" /><div className="text-xs text-muted">Atención<br />CEO</div></Card>
        <Card>
          <div className="text-xs text-muted mb-1">Avance reportado → validado</div>
          <div className="text-2xl font-display font-semibold tnum">{p.avance_reportado}% <span className="text-muted text-base">→</span> {p.avance_validado}%</div>
          <Progress value={p.avance_validado} color={companyVar(p.empresa)} />
        </Card>
      </Grid>

      {/* contrato de datos */}
      <Card className="mb-3">
        <SectionTitle icon={Target} title="Contrato de datos" subtitle="Avance · entregable · validación · cobro" right={<Badge color="var(--amber)">slots: requiere fuente</Badge>} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CONTRACT.map((c) => {
            const val = c.slot ? (c.val || "No se tiene claro") : c.derive!(p.avance_validado);
            return (
              <div key={c.k} className={`rounded-lg border p-2.5 ${c.slot ? "border-dashed border-[var(--border-strong)] bg-surface-2/40" : "border-[var(--border)]"}`}>
                <div className="text-[11px] text-fg-2 leading-tight">{c.k}</div>
                <div className={`text-sm mt-1 font-medium ${c.slot ? "text-muted" : ""}`} style={!c.slot ? { color: "var(--emerald)" } : undefined}>{val}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Grid cols={2} className="mb-3">
        <Card>
          <SectionTitle title="Estado operativo" />
          <div className="space-y-0.5">
            <KeyVal k="Próximo hito" v={p.proximo_hito} />
            <KeyVal k="Pendientes" v={p.pendientes} />
            <KeyVal k="Bloqueos" v={p.bloqueos} />
            <KeyVal k="Riesgos (nota)" v={p.riesgos} />
            <KeyVal k="Impacto caja" v={`${p.impacto_caja}/100`} />
            <KeyVal k="Impacto cliente" v={`${p.impacto_cliente}/100`} />
          </div>
        </Card>
        <Card>
          <SectionTitle icon={Users} title="Personas que intervienen" subtitle={`${p.personas.length}`} />
          {p.personas.length ? (
            <div className="flex flex-wrap gap-1.5">
              {p.personas.map((n, i) => {
                const canon = nameByFirst[n.split(" ")[0].toLowerCase()] || n;
                return (
                  <button key={i} onClick={() => { useStore.getState().setPersonFilter(canon); navigate("person-focus"); }}
                    className="press inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] pl-1 pr-2.5 py-0.5 text-xs hover:bg-surface-2">
                    <span className="grid place-items-center h-5 w-5 rounded-full text-[9px] font-semibold text-white" style={{ background: companyVar(p.empresa) }}>{canon.slice(0, 2).toUpperCase()}</span>
                    {canon}
                  </button>
                );
              })}
            </div>
          ) : <EmptyState icon={Users} title="Sin responsables identificados" />}

          <div className="mt-4">
            <SectionTitle icon={ShieldAlert} title="Riesgos del proyecto" subtitle={`${risks.length}`} />
            <div className="space-y-1.5">
              {risks.map((r) => (
                <button key={r.id} onClick={() => openDrawer({ type: "risk", id: r.id })} className="w-full text-left press rounded-lg border border-[var(--border)] p-2 hover:bg-surface-2 flex items-center gap-2">
                  <Badge color={r.urgencia.includes("P0") ? "var(--red)" : "var(--amber)"}>{r.urgencia}</Badge>
                  <span className="text-xs flex-1 truncate">{r.riesgo}</span>
                </button>
              ))}
              {risks.length === 0 && <p className="text-xs text-muted py-1">Sin riesgos vinculados.</p>}
            </div>
          </div>
        </Card>
      </Grid>

      <Card>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
          <FileText size={13} /> Evidencia: <span className="text-fg-2">{dash(p.evidencia)}</span>
          <span>· Fuente: <span className="text-fg-2">{p.fuente}</span></span>
          <span>· Confianza: <span className="text-fg-2">{p.confianza}</span></span>
        </div>
      </Card>
    </>
  );
}
