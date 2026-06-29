import { useMemo } from "react";
import { Banknote, Users, Scale } from "lucide-react";
import { useStore } from "@/store";
import { dash, companyVar } from "@/lib/format";
import { Card, SectionTitle, KPICard, Badge, Donut, BarRow, riskColor, scoreColor } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { ViewHeader, Grid, type ViewProps } from "./_shared";
import type { Colaborador } from "@/types";

const soles = (v: number | string) =>
  typeof v === "number" ? "S/ " + v.toLocaleString("es-PE", { minimumFractionDigits: 0 }) : "—";

const tagColor = (t: string) =>
  t === "Alto valor" ? "var(--emerald)" : t === "Revisar" ? "var(--red)" : t === "Equilibrado" ? "var(--amber)" : "var(--muted)";

export default function TeamCost(_: ViewProps) {
  const { bundle, companyFilter, openDrawer } = useStore();
  if (!bundle) return null;
  const cost = bundle.costos;

  const rows = useMemo(() => bundle.colaboradores.filter((c) =>
    typeof c.costo_final === "number" &&
    (companyFilter === "all" || c.empresas.includes(companyFilter) || (c.costo_por_empresa && companyFilter in c.costo_por_empresa))),
    [bundle, companyFilter]);

  const donut = Object.entries(cost.planilla_por_empresa).map(([emp, v]) => ({ value: v, color: companyVar(emp), label: emp }));

  const cols: Column<Colaborador>[] = [
    { key: "nombre", header: "Persona", sortValue: (r) => r.nombre, width: "20%", render: (r) => (
      <div><div className="font-medium">{r.nombre}{r.solo_costo && <span className="ml-1 text-[10px] text-muted">(solo costo)</span>}</div>
        <div className="text-[11px] text-muted truncate">{dash(r.empresa_area)}</div></div>) },
    { key: "costo", header: "Costo/mes", align: "right", sortValue: (r) => (typeof r.costo_final === "number" ? r.costo_final : 0),
      render: (r) => <span className="tnum font-semibold">{soles(r.costo_final)}</span> },
    { key: "split", header: "Por empresa", render: (r) => (
      <div className="flex flex-wrap gap-1">{Object.entries(r.costo_por_empresa || {}).map(([e, v]) =>
        <Badge key={e} color={companyVar(e)}>{e} {soles(v).replace("S/ ", "")}</Badge>)}</div>) },
    { key: "aporte", header: "Aporte", align: "right", sortValue: (r) => r.aporte_score,
      render: (r) => r.solo_costo ? <span className="text-muted text-xs">s/ matriz</span> : <span className="tnum font-semibold" style={{ color: scoreColor(r.aporte_score) }}>{r.aporte_score}</span> },
    { key: "ratio", header: "Costo/Aporte", align: "center", sortValue: (r) => r.valor_diff,
      render: (r) => r.solo_costo ? <span className="text-muted text-xs">—</span> : <Badge color={tagColor(r.costo_aporte)}>{r.costo_aporte}</Badge> },
    { key: "proj", header: "Proyectos", align: "right", sortValue: (r) => r.proyecto_ids.length, render: (r) => <span className="tnum">{r.proyecto_ids.length}</span> },
  ];

  return (
    <>
      <ViewHeader id="team-cost" right={<Badge color="var(--amber)">Sensible · Team/Finanzas</Badge>} />

      <Grid cols={4} className="mb-3">
        <KPICard label={`Planilla total · ${cost.periodo}`} value={soles(cost.planilla_total)} accent="var(--emerald)" icon={Banknote} sub={`${cost.moneda} · ${cost.n_personas_costo} personas`} />
        {Object.entries(cost.planilla_por_empresa).slice(0, 3).map(([emp, v]) => (
          <KPICard key={emp} label={`Planilla ${emp}`} value={soles(v)} accent={companyVar(emp)} />
        ))}
      </Grid>

      <Grid cols={2} className="mb-3">
        <Card className="flex items-center gap-5">
          <Donut segments={donut} size={108} stroke={16} />
          <div className="flex-1 space-y-1.5">
            {donut.map((d) => (
              <div key={d.label} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: d.color }} />
                <span className="flex-1 text-fg-2">{d.label}</span>
                <span className="tnum font-medium">{soles(d.value)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle icon={Scale} title="Mayor costo vs aporte" subtitle="Top costo · revisar equilibrio" />
          {[...rows].sort((a, b) => (b.costo_final as number) - (a.costo_final as number)).slice(0, 6).map((c) => (
            <BarRow key={c.id} label={c.nombre} value={typeof c.costo_final === "number" ? c.costo_final : 0} max={6000}
              color={c.solo_costo ? "var(--muted)" : tagColor(c.costo_aporte)} right={soles(c.costo_final).replace("S/ ", "")} />
          ))}
        </Card>
      </Grid>

      <Card className="!p-2">
        <DataTable columns={cols} rows={rows} getKey={(r) => r.id}
          onRowClick={(r) => openDrawer({ type: "person", id: r.id })} initialSort={{ key: "costo", dir: "desc" }} />
      </Card>
      <p className="text-[11px] text-muted mt-3 flex items-center gap-1.5"><Users size={12} /> Costo: {cost.fuente} ({cost.periodo}). Aporte: proxy determinístico (nº proyectos · salud · criticidad) — confianza Inferido. CEO y personas sin matriz de actividad se muestran como "solo costo".</p>
    </>
  );
}
