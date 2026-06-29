import { useStore } from "@/store";
import { companyVar } from "@/lib/format";
import { Card, SectionTitle, Badge, ScaffoldNote, scoreColor } from "@/components/ui";
import { ViewHeader, Grid, type ViewProps } from "./_shared";

// 2x2: X = impacto cliente/caja (avg of the two), Y = urgencia (risk_score)
export default function Strategic(_: ViewProps) {
  const { bundle, companyFilter, openDrawer } = useStore();
  if (!bundle) return null;
  const projects = bundle.proyectos.filter((p) => companyFilter === "all" || p.empresa === companyFilter);

  const point = (p: typeof projects[0]) => ({
    x: (p.impacto_caja + p.impacto_cliente) / 2,
    y: p.risk_score,
  });

  const quadrant = (p: typeof projects[0]) => {
    const { x, y } = point(p);
    if (x >= 60 && y >= 50) return { t: "Acelerar / blindar", c: "var(--red)" };
    if (x >= 60 && y < 50) return { t: "Core (escalar)", c: "var(--emerald)" };
    if (x < 60 && y >= 50) return { t: "Vigilar / decidir", c: "var(--amber)" };
    return { t: "Mantener / delegar", c: "var(--muted)" };
  };

  return (
    <>
      <ViewHeader id="strategic" />
      <Card className="mb-3">
        <SectionTitle title="Matriz Impacto × Riesgo" subtitle="X: impacto caja+cliente · Y: severidad de riesgo" />
        <div className="relative w-full aspect-[16/9] max-h-[440px] rounded-xl border border-[var(--border)] grid-bg overflow-hidden">
          {/* quadrant labels */}
          <div className="absolute inset-0 pointer-events-none text-[10px] uppercase tracking-wide text-muted">
            <span className="absolute left-2 top-2">↑ Riesgo · ← Impacto</span>
            <span className="absolute right-2 top-2 text-[var(--red)]">Acelerar / blindar</span>
            <span className="absolute right-2 bottom-2 text-[var(--emerald)]">Core / escalar</span>
            <span className="absolute left-2 bottom-2">Mantener / delegar</span>
          </div>
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--border)]" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--border)]" />
          {projects.map((p) => {
            const { x, y } = point(p);
            return (
              <button key={p.id} onClick={() => openDrawer({ type: "project", id: p.id })}
                title={`${p.nombre} · impacto ${Math.round(x)} · riesgo ${y}`}
                className="absolute -translate-x-1/2 translate-y-1/2 press group"
                style={{ left: `${4 + x * 0.92}%`, bottom: `${4 + y * 0.9}%` }}>
                <span className="block h-3 w-3 rounded-full ring-2 ring-[var(--surface)]" style={{ background: companyVar(p.empresa) }} />
                <span className="absolute left-1/2 -translate-x-1/2 mt-1 text-[9px] whitespace-nowrap text-muted opacity-0 group-hover:opacity-100 transition-opacity">{p.nombre}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Grid cols={2} className="mb-3">
        {["Acelerar / blindar", "Core (escalar)", "Vigilar / decidir", "Mantener / delegar"].map((q) => {
          const items = projects.filter((p) => quadrant(p).t === q);
          if (!items.length) return null;
          const c = quadrant(items[0]).c;
          return (
            <Card key={q}>
              <SectionTitle title={q} subtitle={`${items.length} proyectos`} right={<span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />} />
              <div className="space-y-1">
                {items.map((p) => (
                  <button key={p.id} onClick={() => openDrawer({ type: "project", id: p.id })}
                    className="w-full text-left flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2 text-sm">
                    <span className="h-2 w-2 rounded-[3px]" style={{ background: companyVar(p.empresa) }} />
                    <span className="flex-1 truncate">{p.nombre}</span>
                    <Badge color={scoreColor(p.health_score)}>{p.health_score}</Badge>
                  </button>
                ))}
              </div>
            </Card>
          );
        })}
      </Grid>

      <ScaffoldNote>Vista en evolución — la matriz usa scores reales. Próximo ciclo añade: matrices Caja×Estrategia, Esfuerzo×Retorno y clasificación core/growth/experimental/kill editable.</ScaffoldNote>
    </>
  );
}
