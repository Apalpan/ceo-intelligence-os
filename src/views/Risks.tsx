import { useMemo, useState } from "react";
import { Ban } from "lucide-react";
import { useStore } from "@/store";
import { cx, dash } from "@/lib/format";
import { realCompanies } from "@/lib/data";
import { Card, SectionTitle, Badge, Confidence, riskColor, EmptyState } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { ViewHeader, Grid, type ViewProps } from "./_shared";
import type { Riesgo } from "@/types";

const URG = ["P0", "P1", "P2"];

export default function Risks(_: ViewProps) {
  const { bundle, companyFilter, openDrawer } = useStore();
  const [urg, setUrg] = useState("all");
  if (!bundle) return null;

  const all = bundle.riesgos.filter((r) => companyFilter === "all" || r.empresa === companyFilter);
  const rows = useMemo(() => all.filter((r) => urg === "all" || r.urgencia.includes(urg)), [all, urg]);
  const companies = realCompanies(bundle).filter((e) => e.presente && (companyFilter === "all" || e.nombre === companyFilter));
  const blockers = bundle.bloqueos.filter((b) => companyFilter === "all" || b.empresa === companyFilter);

  const cell = (emp: string, u: string) => all.filter((r) => r.empresa === emp && r.urgencia.includes(u)).length;

  const cols: Column<Riesgo>[] = [
    { key: "urg", header: "Urg.", align: "center", width: "60px", sortValue: (r) => r.urgencia, render: (r) => <Badge color={r.urgencia.includes("P0") ? "var(--red)" : r.urgencia.includes("P1") ? "var(--amber)" : "var(--muted)"}>{r.urgencia}</Badge> },
    { key: "riesgo", header: "Riesgo", sortValue: (r) => r.riesgo, width: "34%", render: (r) => (
      <div><div className="font-medium leading-snug">{r.riesgo}</div><div className="text-[11px] text-muted">{r.empresa} · {dash(r.area)}</div></div>) },
    { key: "tipo", header: "Tipo", sortValue: (r) => r.tipo, render: (r) => <span className="text-fg-2 text-xs">{dash(r.tipo)}</span> },
    { key: "accion", header: "Acción recomendada", render: (r) => <span className="text-xs text-fg-2 line-clamp-2">{dash(r.accion)}</span> },
    { key: "dueno", header: "Dueño", sortValue: (r) => r.dueno_sugerido, render: (r) => <span className="text-xs">{dash(r.dueno_sugerido)}</span> },
    { key: "score", header: "Score", align: "right", sortValue: (r) => r.risk_score, render: (r) => <span className="tnum font-semibold" style={{ color: riskColor(r.risk_score) }}>{r.risk_score}</span> },
  ];

  return (
    <>
      <ViewHeader id="risks" right={
        <div className="flex items-center gap-1">
          {["all", ...URG].map((u) => (
            <button key={u} onClick={() => setUrg(u)}
              className={cx("press rounded-lg px-2.5 h-8 text-xs font-medium border transition-colors",
                urg === u ? "border-[var(--brand)] bg-[color-mix(in_oklch,var(--brand)_10%,transparent)] text-fg" : "border-[var(--border)] text-fg-2 hover:bg-surface-2")}>
              {u === "all" ? "Todos" : u}
            </button>
          ))}
        </div>
      } />

      <Grid cols={2} className="mb-3">
        {/* heatmap */}
        <Card>
          <SectionTitle title="Mapa de riesgos" subtitle="Empresa × severidad" />
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead><tr className="text-[11px] text-muted">
                <th className="text-left font-medium py-1">Empresa</th>
                {URG.map((u) => <th key={u} className="text-center font-medium py-1 w-16">{u}</th>)}
                <th className="text-right font-medium py-1 w-12">Σ</th>
              </tr></thead>
              <tbody>
                {companies.map((c) => {
                  const total = all.filter((r) => r.empresa === c.nombre).length;
                  return (
                    <tr key={c.id} className="border-t border-[var(--border)]">
                      <td className="py-1.5 text-fg-2">{c.nombre}</td>
                      {URG.map((u) => {
                        const n = cell(c.nombre, u);
                        const col = u === "P0" ? "var(--red)" : u === "P1" ? "var(--amber)" : "var(--muted)";
                        return <td key={u} className="text-center py-1.5">
                          <span className="inline-grid place-items-center h-7 w-7 rounded-lg tnum text-xs font-semibold"
                            style={{ background: n ? `color-mix(in oklch, ${col} ${18 + n * 16}%, transparent)` : "var(--surface-2)", color: n ? col : "var(--muted)" }}>{n || "·"}</span>
                        </td>;
                      })}
                      <td className="text-right py-1.5 tnum font-semibold">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* blockers */}
        <Card>
          <SectionTitle icon={Ban} title="Bloqueos activos" subtitle={`${blockers.length} desde proyectos`} />
          <div className="space-y-1.5 max-h-[260px] overflow-y-auto scrollbar-thin pr-1">
            {blockers.map((b) => (
              <div key={b.id} className="rounded-lg border border-[var(--border)] p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <Badge color={b.urgencia.includes("P0") ? "var(--red)" : "var(--amber)"}>{b.urgencia}</Badge>
                  <span className="text-[11px] text-muted">{b.empresa} · {dash(b.proyecto)}</span>
                </div>
                <p className="text-xs text-fg-2 line-clamp-2">{b.descripcion}</p>
              </div>
            ))}
            {blockers.length === 0 && <EmptyState icon={Ban} title="Sin bloqueos registrados" />}
          </div>
        </Card>
      </Grid>

      <Card className="!p-2">
        <DataTable columns={cols} rows={rows} getKey={(r) => r.id}
          onRowClick={(r) => openDrawer({ type: "risk", id: r.id })} initialSort={{ key: "score", dir: "desc" }} />
      </Card>
    </>
  );
}
