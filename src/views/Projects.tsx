import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useStore } from "@/store";
import { cx, dash, companyVar } from "@/lib/format";
import { Card, Semaforo, Badge, Confidence, Progress, scoreColor, riskColor } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { ViewHeader, type ViewProps } from "./_shared";
import type { Proyecto } from "@/types";

const ESTADOS = [
  { id: "all", label: "Todos" },
  { id: "rojo", label: "Rojo" },
  { id: "amarillo", label: "Amarillo" },
  { id: "verde", label: "Verde" },
];

export default function Projects(_: ViewProps) {
  const { bundle, companyFilter, openDrawer } = useStore();
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("all");
  if (!bundle) return null;

  const rows = useMemo(() => {
    return bundle.proyectos.filter((p) =>
      (companyFilter === "all" || p.empresa === companyFilter) &&
      (estado === "all" || p.estado === estado) &&
      (!q || (p.nombre + p.responsable + p.area + p.empresa).toLowerCase().includes(q.toLowerCase())));
  }, [bundle, companyFilter, estado, q]);

  const cols: Column<Proyecto>[] = [
    {
      key: "nombre", header: "Proyecto", sortValue: (r) => r.nombre, width: "30%",
      render: (r) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="h-7 w-1 rounded-full shrink-0" style={{ background: companyVar(r.empresa) }} />
          <div className="min-w-0">
            <div className="font-medium truncate">{r.nombre}</div>
            <div className="text-[11px] text-muted truncate">{r.empresa} · {r.area}</div>
          </div>
        </div>
      ),
    },
    { key: "responsable", header: "Responsable", sortValue: (r) => r.responsable, render: (r) => <span className="text-fg-2">{dash(r.responsable)}</span> },
    { key: "estado", header: "Estado", align: "center", sortValue: (r) => r.estado, render: (r) => <Semaforo estado={r.estado} /> },
    {
      key: "avance", header: "Avance", width: "120px", sortValue: (r) => r.avance_validado,
      render: (r) => (
        <div className="w-24">
          <div className="flex justify-between text-[11px] text-muted mb-0.5"><span className="tnum">{r.avance_validado}%</span></div>
          <Progress value={r.avance_validado} color={companyVar(r.empresa)} height={5} />
        </div>
      ),
    },
    { key: "health", header: "Health", align: "right", sortValue: (r) => r.health_score, render: (r) => <span className="tnum font-semibold" style={{ color: scoreColor(r.health_score) }}>{r.health_score}</span> },
    { key: "risk", header: "Risk", align: "right", sortValue: (r) => r.risk_score, render: (r) => <span className="tnum font-semibold" style={{ color: riskColor(r.risk_score) }}>{r.risk_score}</span> },
    { key: "attn", header: "CEO", align: "right", sortValue: (r) => r.ceo_attention, render: (r) => <span className="tnum">{r.ceo_attention}</span> },
    { key: "conf", header: "Conf.", align: "center", sortValue: (r) => r.confianza, render: (r) => <Confidence value={r.confianza} /> },
  ];

  return (
    <>
      <ViewHeader id="projects" right={
        <span className="text-xs text-muted">{rows.length} de {bundle.proyectos.length}</span>
      } />
      <Card className="!p-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 flex-1 px-2.5 h-9 rounded-lg bg-surface-2 border border-[var(--border)]">
            <Search size={14} className="text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar proyecto, responsable, área…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted" />
          </div>
          <div className="flex items-center gap-1">
            {ESTADOS.map((e) => (
              <button key={e.id} onClick={() => setEstado(e.id)}
                className={cx("press rounded-lg px-2.5 h-9 text-xs font-medium border transition-colors",
                  estado === e.id ? "border-[var(--brand)] bg-[color-mix(in_oklch,var(--brand)_10%,transparent)] text-fg" : "border-[var(--border)] text-fg-2 hover:bg-surface-2")}>
                {e.label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-2">
          <DataTable columns={cols} rows={rows} getKey={(r) => r.id}
            onRowClick={(r) => openDrawer({ type: "project", id: r.id })}
            initialSort={{ key: "attn", dir: "desc" }} />
        </div>
      </Card>
    </>
  );
}
