import { useMemo, useState } from "react";
import { Search, Bot, MessageSquareWarning } from "lucide-react";
import { useStore } from "@/store";
import { cx, dash } from "@/lib/format";
import { Card, SectionTitle, Badge, ScoreRing, BarRow, riskColor, scoreColor } from "@/components/ui";
import { ViewHeader, Grid, type ViewProps } from "./_shared";

type SortKey = "wip" | "ai" | "bottleneck" | "name";

export default function PeopleAI(_: ViewProps) {
  const { bundle, companyFilter, openDrawer } = useStore();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("wip");
  if (!bundle) return null;

  const people = useMemo(() => {
    let list = bundle.colaboradores.filter((c) =>
      (companyFilter === "all" || c.empresas.includes(companyFilter) || c.empresa_area.includes(companyFilter)) &&
      (!q || (c.nombre + c.proyectos + c.empresa_area).toLowerCase().includes(q.toLowerCase())));
    const cmp: Record<SortKey, (a: typeof list[0], b: typeof list[0]) => number> = {
      wip: (a, b) => b.wip_score - a.wip_score,
      ai: (a, b) => b.ai_native_score - a.ai_native_score,
      bottleneck: (a, b) => b.bottleneck_score - a.bottleneck_score,
      name: (a, b) => a.nombre.localeCompare(b.nombre),
    };
    return [...list].sort(cmp[sort]);
  }, [bundle, companyFilter, q, sort]);

  const topWip = [...bundle.colaboradores].sort((a, b) => b.wip_score - a.wip_score).slice(0, 6);
  const topAi = [...bundle.colaboradores].sort((a, b) => b.ai_native_score - a.ai_native_score).slice(0, 6);
  const needFb = bundle.colaboradores.filter((c) => c.necesita_feedback).length;

  const SORTS: { id: SortKey; label: string }[] = [
    { id: "wip", label: "WIP" }, { id: "ai", label: "AI-native" },
    { id: "bottleneck", label: "Cuello botella" }, { id: "name", label: "A-Z" },
  ];

  return (
    <>
      <ViewHeader id="people" right={<span className="text-xs text-muted">{people.length} personas · {needFb} requieren feedback</span>} />

      <Grid cols={2} className="mb-3">
        <Card>
          <SectionTitle icon={MessageSquareWarning} title="Ranking de carga (WIP)" subtitle="Quién está saturado" />
          <div>{topWip.map((c) => <BarRow key={c.id} label={c.nombre} value={c.wip_score} color={riskColor(c.wip_score)} />)}</div>
        </Card>
        <Card>
          <SectionTitle icon={Bot} title="Ranking AI-Native" subtitle="Apalancamiento con IA" />
          <div>{topAi.map((c) => <BarRow key={c.id} label={c.nombre} value={c.ai_native_score} color={scoreColor(c.ai_native_score)} />)}</div>
        </Card>
      </Grid>

      <Card className="!p-3 mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2 flex-1 px-2.5 h-9 rounded-lg bg-surface-2 border border-[var(--border)]">
            <Search size={14} className="text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar persona o proyecto…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted mr-1">Orden:</span>
            {SORTS.map((s) => (
              <button key={s.id} onClick={() => setSort(s.id)}
                className={cx("press rounded-lg px-2.5 h-9 text-xs font-medium border transition-colors",
                  sort === s.id ? "border-[var(--brand)] bg-[color-mix(in_oklch,var(--brand)_10%,transparent)] text-fg" : "border-[var(--border)] text-fg-2 hover:bg-surface-2")}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {people.map((c) => (
          <button key={c.id} onClick={() => openDrawer({ type: "person", id: c.id })}
            className="card p-4 text-left press hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center h-11 w-11 rounded-full text-sm font-semibold text-white shrink-0"
                style={{ background: `linear-gradient(135deg, ${riskColor(c.wip_score)}, color-mix(in oklch, ${riskColor(c.wip_score)} 60%, black))` }}>
                {c.nombre.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{c.nombre}</div>
                <div className="text-[11px] text-muted truncate">{c.empresa_area}</div>
              </div>
              {c.necesita_feedback && <Badge color="var(--violet)">Feedback</Badge>}
            </div>

            <div className="flex items-center justify-between mt-3 gap-2">
              <ScoreRing value={c.wip_score} size={48} color={riskColor(c.wip_score)} label="WIP" />
              <ScoreRing value={c.ai_native_score} size={48} color="var(--violet)" label="AI" />
              <ScoreRing value={c.bottleneck_score} size={48} color={riskColor(c.bottleneck_score)} label="Cuello" />
              <ScoreRing value={c.context_quality_score} size={48} label="Contexto" />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-muted">Carga: <b className="text-fg-2">{dash(c.carga)}</b></span>
              <span className="text-[11px] text-muted">{c.n_proyectos} proyectos</span>
            </div>

            {c.agentes_recomendados.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {c.agentes_recomendados.slice(0, 2).map((a, i) => <Badge key={i} color="var(--violet)">{a}</Badge>)}
                {c.agentes_recomendados.length > 2 && <Badge color="var(--muted)">+{c.agentes_recomendados.length - 2}</Badge>}
              </div>
            )}
          </button>
        ))}
      </div>
    </>
  );
}
