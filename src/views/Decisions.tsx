import { Gavel, Clock, HelpCircle, CheckCircle2 } from "lucide-react";
import { useStore } from "@/store";
import { dash } from "@/lib/format";
import { Card, Badge, Confidence } from "@/components/ui";
import { ViewHeader, Grid, type ViewProps } from "./_shared";
import type { Decision } from "@/types";

export default function Decisions(_: ViewProps) {
  const { bundle, openDrawer } = useStore();
  if (!bundle) return null;
  const urgentes = bundle.decisiones.filter((d) => d.nivel === "urgente");
  const estrat = bundle.decisiones.filter((d) => d.nivel !== "urgente");

  return (
    <>
      <ViewHeader id="decisions" right={<span className="text-xs text-muted">{bundle.decisiones.length} decisiones</span>} />
      <Grid cols={2}>
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-2"><span className="h-2 w-2 rounded-full bg-[var(--red)]" /> Urgentes ({urgentes.length})</h3>
          <div className="space-y-2.5">{urgentes.map((d) => <DecisionCard key={d.id} d={d} onClick={() => openDrawer({ type: "decision", id: d.id })} />)}</div>
        </div>
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-2"><span className="h-2 w-2 rounded-full bg-[var(--amber)]" /> Estratégicas ({estrat.length})</h3>
          <div className="space-y-2.5">{estrat.map((d) => <DecisionCard key={d.id} d={d} onClick={() => openDrawer({ type: "decision", id: d.id })} />)}</div>
        </div>
      </Grid>
    </>
  );
}

function DecisionCard({ d, onClick }: { d: Decision; onClick: () => void }) {
  return (
    <Card hover className="cursor-pointer press" >
      <button onClick={onClick} className="text-left w-full">
        <div className="flex items-start gap-2 mb-2">
          <span className="grid place-items-center h-7 w-7 rounded-lg bg-[color-mix(in_oklch,var(--violet)_14%,transparent)] text-[var(--violet)] shrink-0"><Gavel size={14} /></span>
          <h4 className="text-sm font-semibold leading-snug flex-1">{d.titulo}</h4>
          <Badge color={d.urgencia.includes("P0") ? "var(--red)" : "var(--amber)"}>{d.urgencia}</Badge>
        </div>
        {d.recomendacion !== "No se tiene claro" && (
          <div className="rounded-lg bg-[color-mix(in_oklch,var(--emerald)_8%,transparent)] border border-[color-mix(in_oklch,var(--emerald)_22%,transparent)] px-2.5 py-1.5 mb-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--emerald)] font-semibold mb-0.5"><CheckCircle2 size={11} /> Recomendación COO</div>
            <p className="text-xs text-fg-2">{d.recomendacion}</p>
          </div>
        )}
        <p className="text-xs text-muted line-clamp-2 mb-2">{dash(d.contexto)}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1"><Clock size={11} /> {dash(d.fecha_limite)}</span>
          {d.info_faltante !== "No se tiene claro" && <span className="inline-flex items-center gap-1 text-[var(--amber)]"><HelpCircle size={11} /> Falta info</span>}
        </div>
      </button>
    </Card>
  );
}
