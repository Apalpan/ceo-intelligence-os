import { useStore } from "@/store";
import { companyVar, dash } from "@/lib/format";
import { Card, Badge, ScoreRing, scoreColor } from "@/components/ui";
import { ViewHeader, type ViewProps } from "./_shared";

const ESTADO_LABEL: Record<string, { t: string; c: string }> = {
  escalable: { t: "Escalable", c: "var(--emerald)" },
  controlado: { t: "Controlado", c: "var(--emerald)" },
  funcional: { t: "Funcional", c: "var(--amber)" },
  manual: { t: "Manual", c: "var(--amber)" },
  caotico: { t: "Caótico", c: "var(--red)" },
};

export default function Tactical(_: ViewProps) {
  const { bundle, companyFilter } = useStore();
  if (!bundle) return null;
  const procesos = bundle.procesos.filter((p) => companyFilter === "all" || p.empresa === companyFilter)
    .sort((a, b) => a.process_score - b.process_score);

  return (
    <>
      <ViewHeader id="tactical" right={<span className="text-xs text-muted">{procesos.length} procesos · {procesos.filter(p => p.automatizable).length} automatizables</span>} />
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
        {procesos.map((p) => {
          const e = ESTADO_LABEL[p.estado] ?? { t: p.estado, c: "var(--muted)" };
          return (
            <Card key={p.id} className="!p-0 overflow-hidden">
              <div className="flex">
                <div className="w-1.5 shrink-0" style={{ background: companyVar(p.empresa) }} />
                <div className="p-4 flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold">{p.nombre}</h3>
                        <Badge color="var(--brand)">{p.empresa}</Badge>
                        <Badge color={e.c}>{e.t}</Badge>
                        {p.automatizable && <Badge color="var(--violet)">{p.prioridad_automatizacion} auto</Badge>}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                        <Field k="Input" v={p.input} />
                        <Field k="Output" v={p.output} />
                        <Field k="Owner" v={p.owner} />
                        <Field k="SLA" v={p.sla} />
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {p.herramientas.map((h, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 border border-[var(--border)] text-muted">{h}</span>)}
                      </div>
                      <div className="mt-2 text-[11px] text-muted">Agente sugerido: <span className="text-[var(--violet)] font-medium">{p.agente_sugerido}</span></div>
                    </div>
                    <ScoreRing value={p.process_score} size={56} color={scoreColor(p.process_score)} label="Proc" />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="text-[11px] text-muted mt-4">Process Score = claridad input/output · owner · SLA · trazabilidad · automatización · métrica. Procesos derivados del mapeo de procesos del vault (confianza: inferido).</p>
    </>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return <div className="min-w-0"><span className="text-muted">{k}: </span><span className="text-fg-2">{dash(v)}</span></div>;
}
