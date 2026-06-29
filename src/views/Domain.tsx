import { useStore } from "@/store";
import { dash, companyVar } from "@/lib/format";
import { Card, SectionTitle, Semaforo, Badge, KPICard, ScaffoldNote, Progress, scoreColor, riskColor, EmptyState } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { ViewHeader, Grid } from "./_shared";
import type { Proyecto } from "@/types";
import { FolderKanban } from "lucide-react";

interface Cfg { keywords: string[]; next: string; }
const CFG: Record<string, Cfg> = {
  cash: { keywords: ["caja", "cobr", "factura", "edp", "ingreso", "sponsor", "ventas", "comercial", "pago"], next: "EDPs/facturas con monto y fecha de compromiso, forecast de caja semanal y conexión con cobranzas." },
  sales: { keywords: ["ventas", "comercial", "marketing", "lead", "sponsor", "b2c", "b2b", "congreso", "ghl", "training", "reto"], next: "Funnel pieza→canal→lead→venta, SLA por lead, cifra oficial y atribución de marketing." },
  delivery: { keywords: ["delivery", "bim", "cañete", "canete", "faucett", "dovelas", "circle", "ptar", "tingo", "alcance", "qa", "puente", "buzon"], next: "Matriz de alcance base/adicional/reproceso, QA/QC por entregable y valorización de cambios." },
  product: { keywords: ["producto", "app", "web", "visionpro", "pdk", "dev", "fase", "esparq", "inmobiliario", "besco", "digital", "agente"], next: "Roadmap de producto, separación diseño/dev/QA y estado de releases por fase." },
  training: { keywords: ["training", "diplomado", "certificad", "academ", "comunidad", "postventa", "curso", "licencia", "rubrica"], next: "Tablero por diplomado: rúbrica, entregable, certificado CIP, sustitutorio y bloqueos de licencia." },
  summit: { keywords: ["summit", "sponsor", "agenda", "evento", "congreso", "ponente"], next: "Cruce sponsor→pago→beneficio→delegación→stand→ponente y checklist de producción del evento." },
};

export default function Domain({ id }: { id: string }) {
  const { bundle, companyFilter, openDrawer } = useStore();
  if (!bundle) return null;
  const cfg = CFG[id];
  const match = (s: string) => cfg.keywords.some((k) => s.toLowerCase().includes(k));

  let projects = bundle.proyectos.filter((p) => match(p.area + " " + p.nombre + " " + p.empresa));
  let risks = bundle.riesgos.filter((r) => match(r.area + " " + r.riesgo + " " + r.proyecto));
  if (companyFilter !== "all") {
    projects = projects.filter((p) => p.empresa === companyFilter);
    risks = risks.filter((r) => r.empresa === companyFilter);
  }
  const reds = projects.filter((p) => p.estado === "rojo").length;
  const avgHealth = projects.length ? Math.round(projects.reduce((a, b) => a + b.health_score, 0) / projects.length) : 0;

  const cols: Column<Proyecto>[] = [
    { key: "nombre", header: "Proyecto", sortValue: (r) => r.nombre, width: "34%", render: (r) => (
      <div className="flex items-center gap-2 min-w-0"><span className="h-6 w-1 rounded-full shrink-0" style={{ background: companyVar(r.empresa) }} />
        <div className="min-w-0"><div className="font-medium truncate">{r.nombre}</div><div className="text-[11px] text-muted">{r.empresa} · {r.area}</div></div></div>) },
    { key: "resp", header: "Responsable", sortValue: (r) => r.responsable, render: (r) => <span className="text-fg-2 text-xs">{dash(r.responsable)}</span> },
    { key: "estado", header: "Estado", align: "center", render: (r) => <Semaforo estado={r.estado} /> },
    { key: "av", header: "Avance", width: "110px", sortValue: (r) => r.avance_validado, render: (r) => <div className="w-20"><Progress value={r.avance_validado} color={companyVar(r.empresa)} height={5} /></div> },
    { key: "health", header: "Health", align: "right", sortValue: (r) => r.health_score, render: (r) => <span className="tnum font-semibold" style={{ color: scoreColor(r.health_score) }}>{r.health_score}</span> },
  ];

  return (
    <>
      <ViewHeader id={id} />
      <Grid cols={4} className="mb-3">
        <KPICard label="Proyectos" value={projects.length} accent="var(--brand)" icon={FolderKanban} />
        <KPICard label="En rojo" value={reds} accent="var(--red)" />
        <KPICard label="Salud media" value={avgHealth} accent={scoreColor(avgHealth)} />
        <KPICard label="Riesgos" value={risks.length} accent="var(--amber)" />
      </Grid>

      <Grid cols={2} className="mb-3">
        <Card className="!p-2">
          <div className="px-2 pt-1.5 pb-1"><SectionTitle title="Proyectos del área" subtitle={`${projects.length} relacionados`} /></div>
          {projects.length ? <DataTable columns={cols} rows={projects} getKey={(r) => r.id} onRowClick={(r) => openDrawer({ type: "project", id: r.id })} initialSort={{ key: "health", dir: "asc" }} />
            : <EmptyState icon={FolderKanban} title="Sin proyectos para este filtro" />}
        </Card>
        <Card>
          <SectionTitle title="Riesgos relacionados" subtitle={`${risks.length}`} />
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
            {risks.sort((a, b) => b.risk_score - a.risk_score).map((r) => (
              <button key={r.id} onClick={() => openDrawer({ type: "risk", id: r.id })}
                className="w-full text-left press rounded-lg border border-[var(--border)] p-2.5 hover:bg-surface-2 flex items-start gap-2.5">
                <span className="mt-0.5 h-7 w-1 rounded-full shrink-0" style={{ background: riskColor(r.risk_score) }} />
                <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><Badge color={r.urgencia.includes("P0") ? "var(--red)" : "var(--amber)"}>{r.urgencia}</Badge><span className="text-[11px] text-muted">{r.empresa}</span></div>
                  <p className="text-sm leading-snug mt-0.5 line-clamp-2">{r.riesgo}</p></div>
              </button>
            ))}
            {risks.length === 0 && <EmptyState icon={FolderKanban} title="Sin riesgos" />}
          </div>
        </Card>
      </Grid>

      <ScaffoldNote>Vista en evolución — ya muestra datos reales filtrados del vault. Próximo ciclo añade: {cfg.next}</ScaffoldNote>
    </>
  );
}
