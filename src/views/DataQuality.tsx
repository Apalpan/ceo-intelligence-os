import { AlertTriangle, FileWarning } from "lucide-react";
import { useStore } from "@/store";
import { Card, SectionTitle, ScoreRing, BarRow, Badge, EmptyState } from "@/components/ui";
import { ViewHeader, Grid, type ViewProps } from "./_shared";

export default function DataQuality(_: ViewProps) {
  const { bundle } = useStore();
  if (!bundle) return null;
  const dq = bundle.data_quality;
  const metrics = [
    { label: "Completitud", v: dq.completitud, w: "25%" },
    { label: "Consistencia", v: dq.consistencia, w: "20%" },
    { label: "Actualidad", v: dq.actualidad, w: "20%" },
    { label: "Evidencia", v: dq.evidencia, w: "20%" },
    { label: "Normalización", v: dq.normalizacion, w: "15%" },
  ];

  return (
    <>
      <ViewHeader id="data-quality" />
      <Grid cols={3} className="mb-3">
        <Card className="flex items-center gap-4">
          <ScoreRing value={dq.data_quality_score} size={88} label="DQ Score" />
          <div className="text-xs text-muted">
            <p className="text-fg-2 font-medium text-sm mb-1">Calidad global</p>
            <p>{dq.contradicciones} contradicciones · {dq.gaps.length} gaps de información.</p>
            <p className="mt-1">Fuentes procesadas: {bundle.fuentes.length}</p>
          </div>
        </Card>
        <Card className="md:col-span-2">
          <SectionTitle title="Componentes del score" subtitle="Ponderación determinística" />
          {metrics.map((m) => <BarRow key={m.label} label={`${m.label} (${m.w})`} value={m.v} right={m.v} />)}
        </Card>
      </Grid>

      <Grid cols={2}>
        <Card>
          <SectionTitle icon={AlertTriangle} title="Contradicciones" subtitle="Datos en conflicto" />
          {dq.contradicciones_detalle.length === 0 ? <EmptyState icon={AlertTriangle} title="Sin contradicciones" /> :
            <div className="space-y-1.5">{dq.contradicciones_detalle.map((c, i) =>
              <div key={i} className="text-xs text-fg-2 rounded-lg bg-[color-mix(in_oklch,var(--amber)_8%,transparent)] border border-[color-mix(in_oklch,var(--amber)_22%,transparent)] px-2.5 py-2">{c}</div>)}</div>}
        </Card>
        <Card>
          <SectionTitle icon={FileWarning} title="Gaps de información" subtitle={`${dq.gaps.length} entidades incompletas`} />
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
            {dq.gaps.map((g, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-2.5 py-1.5">
                <span className="text-xs flex-1 truncate text-fg-2">{g.entidad}</span>
                <span className="text-[11px] text-muted">{g.empresa}</span>
                <div className="flex gap-1">{g.faltante.map((f) => <Badge key={f} color="var(--amber)">{f}</Badge>)}</div>
              </div>
            ))}
            {dq.gaps.length === 0 && <EmptyState icon={FileWarning} title="Sin gaps" />}
          </div>
        </Card>
      </Grid>
    </>
  );
}
