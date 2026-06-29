import { History, GitCommit, FileStack } from "lucide-react";
import { useStore } from "@/store";
import { Card, SectionTitle, KPICard, Badge, EmptyState } from "@/components/ui";
import { ViewHeader, Grid, type ViewProps } from "./_shared";

export default function UpdateLog(_: ViewProps) {
  const { bundle } = useStore();
  if (!bundle) return null;
  const m = bundle.meta;

  return (
    <>
      <ViewHeader id="update-log" />
      <Grid cols={4} className="mb-3">
        <KPICard label="Corte COO" value={<span className="text-base">{m.corte}</span>} accent="var(--brand)" icon={History} />
        <KPICard label="Generado" value={<span className="text-base">{m.generated_at}</span>} accent="var(--violet)" icon={GitCommit} />
        <KPICard label="Entidades" value={Object.values(m.counts).reduce((a, b) => a + b, 0)} accent="var(--emerald)" icon={FileStack} />
        <KPICard label="Deltas" value={bundle.deltas.length} accent={bundle.deltas.length ? "var(--amber)" : "var(--muted)"} sub={m.first_run ? "baseline inicial" : "vs corte previo"} />
      </Grid>

      <Grid cols={2} className="mb-3">
        <Card>
          <SectionTitle title="Conteo por entidad" subtitle="Estado del último corte" />
          <div className="grid grid-cols-2 gap-x-4">
            {Object.entries(m.counts).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-1.5 border-b border-[var(--border)] text-sm">
                <span className="text-fg-2 capitalize">{k}</span><span className="tnum font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle title="Deltas detectados" subtitle="Cambios vs baseline" />
          {bundle.deltas.length === 0 ? (
            <EmptyState icon={GitCommit} title={m.first_run ? "Baseline inicial creado" : "Sin cambios desde el último corte"}
              hint="Los deltas aparecerán cuando vuelvas a correr el ETL tras actualizar el vault." />
          ) : (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
              {bundle.deltas.map((d, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs">
                  <Badge color={d.tipo === "nuevo" ? "var(--emerald)" : d.tipo === "cerrado" ? "var(--muted)" : "var(--amber)"}>{d.tipo}</Badge>
                  <span className="flex-1 truncate text-fg-2">{d.id}</span>
                  <span className="tnum text-muted">{d.antes ?? "—"} → {d.despues ?? "—"}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Grid>

      <Card>
        <SectionTitle title="Cómo actualizar" subtitle="Comando operativo permanente" />
        <ol className="space-y-2 text-sm">
          {[
            'Codex normaliza la info nueva en D:\\AP\\AP_Knowledge_OS\\00_CEO_Intelligence (8 archivos).',
            'Corre el ETL: npm run etl  (o python etl/parse_vault.py).',
            'El ETL recalcula scores, deltas, briefing y reportes; guarda baseline + historial.',
            'Click en ↻ (header) o recarga para ver el nuevo estado.',
          ].map((t, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="grid place-items-center h-5 w-5 rounded-full bg-surface-2 text-[11px] font-semibold text-fg-2 shrink-0">{i + 1}</span>
              <span className="text-fg-2 font-mono text-xs leading-relaxed">{t}</span>
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}
