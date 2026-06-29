import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useStore } from "@/store";
import { dash } from "@/lib/format";
import { Card, Badge, Confidence, ScaffoldNote } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { ViewHeader, type ViewProps } from "./_shared";
import type { Tarea } from "@/types";

export default function Operational(_: ViewProps) {
  const { bundle, companyFilter } = useStore();
  const [q, setQ] = useState("");
  if (!bundle) return null;

  const rows = useMemo(() => bundle.tareas.filter((t) =>
    (companyFilter === "all" || t.empresa === companyFilter || t.empresa === "No se tiene claro") &&
    (!q || (t.proyecto + t.colaborador + t.descripcion).toLowerCase().includes(q.toLowerCase()))),
    [bundle, companyFilter, q]);

  const cols: Column<Tarea>[] = [
    { key: "proyecto", header: "Proyecto / Prioridad", sortValue: (r) => r.proyecto, width: "26%", render: (r) => (
      <div><div className="font-medium truncate">{r.proyecto}</div><div className="text-[11px] text-muted">{dash(r.empresa)}</div></div>) },
    { key: "desc", header: "Tarea / pendiente", render: (r) => <span className="text-xs text-fg-2 line-clamp-2">{dash(r.descripcion)}</span> },
    { key: "owner", header: "Owner", sortValue: (r) => r.colaborador, render: (r) => <span className="text-xs">{dash(r.colaborador)}</span> },
    { key: "prio", header: "Prioridad", align: "center", sortValue: (r) => r.prioridad, render: (r) => <Badge color={r.prioridad === "alta" ? "var(--red)" : r.prioridad === "media" ? "var(--amber)" : "var(--muted)"}>{r.prioridad}</Badge> },
    { key: "fecha", header: "Fecha", sortValue: (r) => r.fecha_objetivo, render: (r) => <span className="text-xs text-muted">{dash(r.fecha_objetivo)}</span> },
    { key: "conf", header: "Conf.", align: "center", render: (r) => <Confidence value={r.confianza} /> },
  ];

  return (
    <>
      <ViewHeader id="operational" right={<span className="text-xs text-muted">{rows.length} tareas</span>} />
      <Card className="!p-2 mb-3">
        <div className="flex items-center gap-2 flex-1 px-2.5 h-9 m-1 rounded-lg bg-surface-2 border border-[var(--border)]">
          <Search size={14} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar tarea, proyecto, owner…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted" />
        </div>
        <DataTable columns={cols} rows={rows} getKey={(r) => r.id} dense initialSort={{ key: "prio", dir: "asc" }} />
      </Card>
      <ScaffoldNote>Vista en evolución — tareas derivadas de pendientes y prioridades del vault. Próximo ciclo: drill-down Empresa→Área→Proyecto→Tarea→Evidencia con resultado esperado vs obtenido y feedback sugerido por tarea.</ScaffoldNote>
    </>
  );
}
