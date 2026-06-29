import { FileText, FileCheck2 } from "lucide-react";
import { useStore } from "@/store";
import { dash } from "@/lib/format";
import { Card, SectionTitle, Badge, Confidence, ScaffoldNote, EmptyState } from "@/components/ui";
import { ViewHeader, Grid, type ViewProps } from "./_shared";

export default function Evidence(_: ViewProps) {
  const { bundle, companyFilter } = useStore();
  if (!bundle) return null;
  const ev = bundle.evidencias.filter((e) => companyFilter === "all" || e.empresa === companyFilter);
  const sources = bundle.fuentes;

  return (
    <>
      <ViewHeader id="evidence" right={<span className="text-xs text-muted">{ev.length} evidencias · {sources.length} fuentes</span>} />
      <Grid cols={2} className="mb-3">
        <Card>
          <SectionTitle icon={FileCheck2} title="Evidencias por entidad" subtitle="Trazabilidad de avances" />
          <div className="space-y-1.5 max-h-[440px] overflow-y-auto scrollbar-thin pr-1">
            {ev.map((e) => (
              <div key={e.id} className="rounded-lg border border-[var(--border)] p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <Badge color="var(--brand)">{e.empresa}</Badge>
                  <span className="text-xs font-medium flex-1 truncate">{e.relacionado_con}</span>
                  <Confidence value={e.confiabilidad} />
                </div>
                <p className="text-[11px] text-muted">{dash(e.fuente)}</p>
              </div>
            ))}
            {ev.length === 0 && <EmptyState icon={FileText} title="Sin evidencias para este filtro" />}
          </div>
        </Card>
        <Card>
          <SectionTitle icon={FileText} title="Fuentes procesadas" subtitle="Archivos del último corte" />
          <div className="space-y-1 max-h-[440px] overflow-y-auto scrollbar-thin pr-1">
            {sources.map((f) => (
              <div key={f.id} className="flex items-center gap-2 text-xs py-1.5 border-b border-[var(--border)] last:border-0">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--emerald)] shrink-0" />
                <span className="flex-1 truncate text-fg-2">{f.nombre}</span>
                <Badge color="var(--emerald)">{f.calidad}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </Grid>
      <ScaffoldNote>Vista en evolución — próximo ciclo: visor de evidencia (abrir el fragmento/archivo del vault), filtros por tipo (PDF/imagen/reporte) y enlace directo a la nota de Obsidian.</ScaffoldNote>
    </>
  );
}
