import { useState } from "react";
import { Bot, Workflow, Sparkles } from "lucide-react";
import { useStore } from "@/store";
import { cx, companyVar } from "@/lib/format";
import { Card, SectionTitle, Badge, ScoreRing, BarRow, KPICard, scoreColor } from "@/components/ui";
import { ViewHeader, Grid, type ViewProps } from "./_shared";

export default function AINative({ navigate }: ViewProps) {
  const { bundle, companyFilter, openDrawer } = useStore();
  const [empFilter, setEmpFilter] = useState("all");
  if (!bundle) return null;
  const an = bundle.ai_native;

  const cf = companyFilter !== "all" ? companyFilter : empFilter;
  const agents = bundle.agentes.filter((a) => cf === "all" || a.empresa === cf);
  const empresasInAgents = Array.from(new Set(bundle.agentes.map((a) => a.empresa)));
  const byPrio = (p: string) => (p.includes("P0") ? 0 : p.includes("P1") ? 1 : 2);

  return (
    <>
      <ViewHeader id="ai-native" />

      <Grid cols={4} className="mb-3">
        <KPICard label="AI-Native Score" value={an.overall_score} accent="var(--violet)" icon={Sparkles} sub={an.clasificacion} />
        <KPICard label="Agentes propuestos" value={an.agentes_propuestos} accent="var(--brand)" icon={Bot} sub="catálogo por área" />
        <KPICard label="Procesos automatizables" value={an.procesos_automatizables} accent="var(--cyan)" icon={Workflow} onClick={() => navigate("tactical")} />
        <KPICard label="Backlog P0" value={an.backlog_automatizacion.filter(b => b.prioridad.includes("P0")).length} accent="var(--red)" sub="automatización urgente" />
      </Grid>

      <Grid cols={2} className="mb-3">
        <Card>
          <SectionTitle title="Madurez AI-first por empresa" subtitle="Promedio de colaboradores" />
          <div>
            {an.por_empresa.map((e) => (
              <BarRow key={e.empresa} label={e.empresa} value={e.ai_native_score} color={companyVar(e.empresa)} right={e.ai_native_score} />
            ))}
          </div>
          <p className="text-[11px] text-muted mt-2">Escala: 90+ avanzado · 75+ AI-first · 60+ asistida · 40+ superficial · &lt;40 manual.</p>
        </Card>
        <Card>
          <SectionTitle title="Backlog de automatización" subtitle="Procesos ordenados por prioridad" right={
            <button onClick={() => navigate("tactical")} className="text-xs text-[var(--brand)] hover:underline">Procesos</button>} />
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
            {[...an.backlog_automatizacion].sort((a, b) => byPrio(a.prioridad) - byPrio(b.prioridad)).map((b, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-lg border border-[var(--border)] p-2">
                <Badge color={b.prioridad.includes("P0") ? "var(--red)" : b.prioridad.includes("P1") ? "var(--amber)" : "var(--muted)"}>{b.prioridad}</Badge>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{b.proceso}</div>
                  <div className="text-[11px] text-muted truncate">{b.empresa} → {b.agente}</div>
                </div>
                <span className="tnum text-xs font-semibold" style={{ color: scoreColor(b.process_score) }}>{b.process_score}</span>
              </div>
            ))}
          </div>
        </Card>
      </Grid>

      <Card>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <SectionTitle icon={Bot} title="Fuerza laboral de agentes" subtitle={`${agents.length} agentes`} />
          {companyFilter === "all" && (
            <div className="flex items-center gap-1 flex-wrap">
              <button onClick={() => setEmpFilter("all")}
                className={cx("press rounded-lg px-2.5 h-8 text-xs border", empFilter === "all" ? "border-[var(--brand)] text-fg bg-[color-mix(in_oklch,var(--brand)_10%,transparent)]" : "border-[var(--border)] text-fg-2")}>Todas</button>
              {empresasInAgents.map((e) => (
                <button key={e} onClick={() => setEmpFilter(e)}
                  className={cx("press rounded-lg px-2.5 h-8 text-xs border", empFilter === e ? "border-[var(--brand)] text-fg bg-[color-mix(in_oklch,var(--brand)_10%,transparent)]" : "border-[var(--border)] text-fg-2")}>{e}</button>
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-2.5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((a) => (
            <button key={a.id} onClick={() => openDrawer({ type: "agent", id: a.id })}
              className="card !p-3 text-left press hover:shadow-card-hover transition-shadow">
              <div className="flex items-start gap-2 mb-1.5">
                <span className="h-7 w-1 rounded-full shrink-0" style={{ background: companyVar(a.empresa) }} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-tight">{a.nombre}</div>
                  <div className="text-[11px] text-muted">{a.empresa} · {a.area}</div>
                </div>
                <Badge color={a.prioridad.includes("P0") ? "var(--red)" : "var(--brand)"}>{a.prioridad}</Badge>
              </div>
              <p className="text-xs text-muted line-clamp-2">{a.proposito}</p>
              <div className="flex items-center justify-between mt-2 text-[11px]">
                <span className="text-muted">Owner: <b className="text-fg-2">{a.owner_humano}</b></span>
                <span className="text-muted">Impacto {a.impacto_estimado}/5</span>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </>
  );
}
