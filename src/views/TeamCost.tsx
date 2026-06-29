import { useMemo } from "react";
import { Banknote, Users, Star, ShieldCheck } from "lucide-react";
import { useStore } from "@/store";
import { dash, companyVar, cx } from "@/lib/format";
import { Card, SectionTitle, KPICard, Badge, BarRow, scoreColor, riskColor } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { ViewHeader, Grid, type ViewProps } from "./_shared";
import type { Colaborador } from "@/types";

const money = (v: number | string) => (typeof v === "number" ? "S/ " + v.toLocaleString("es-PE") : "X");
const tagColor = (t: string) =>
  t === "Alto valor" ? "var(--emerald)" : t === "Revisar" ? "var(--red)" : t === "Equilibrado" ? "var(--amber)" : "var(--muted)";

export default function TeamCost(_: ViewProps) {
  const { bundle, companyFilter, openDrawer } = useStore();
  if (!bundle) return null;
  const cost = bundle.costos;
  const masked = !!cost.enmascarado;

  const rows = useMemo(() => bundle.colaboradores.filter((c) =>
    !c.solo_costo &&
    (companyFilter === "all" || c.empresas.includes(companyFilter))),
    [bundle, companyFilter]);

  const evalAvg = rows.length ? Math.round(rows.reduce((a, c) => a + c.evaluacion, 0) / rows.length) : 0;
  const feedback = rows.filter((c) => c.necesita_feedback).length;
  const headByCo = bundle.empresas.filter((e) => e.presente && e.nombre !== "AP")
    .map((e) => ({ label: e.nombre, value: bundle.colaboradores.filter((c) => c.empresas.includes(e.nombre)).length, color: companyVar(e.nombre) }));

  const cols: Column<Colaborador>[] = [
    { key: "nombre", header: "Persona", sortValue: (r) => r.nombre, width: "22%", render: (r) => (
      <div><div className="font-medium">{r.nombre}</div><div className="text-[11px] text-muted truncate">{dash(r.rol)}</div></div>) },
    { key: "empresa", header: "Empresa", render: (r) => <div className="flex flex-wrap gap-1">{r.empresas.slice(0, 2).map((e) => <Badge key={e} color={companyVar(e)}>{e}</Badge>)}</div> },
    { key: "eval", header: "Evaluación", align: "right", sortValue: (r) => r.evaluacion, render: (r) => <span className="tnum font-semibold" style={{ color: scoreColor(r.evaluacion) }}>{r.evaluacion}</span> },
    { key: "aporte", header: "Aporte", align: "right", sortValue: (r) => r.aporte_score, render: (r) => <span className="tnum" style={{ color: scoreColor(r.aporte_score) }}>{r.aporte_score}</span> },
    { key: "wip", header: "WIP", align: "right", sortValue: (r) => r.wip_score, render: (r) => <span className="tnum" style={{ color: riskColor(r.wip_score) }}>{r.wip_score}</span> },
    { key: "ai", header: "AI", align: "right", sortValue: (r) => r.ai_native_score, render: (r) => <span className="tnum">{r.ai_native_score}</span> },
    { key: "acts", header: "Actividades", align: "right", sortValue: (r) => r.actividades_clave.length, render: (r) => <span className="tnum text-muted">{r.actividades_clave.length}</span> },
    { key: "costo", header: "Costo/mes", align: "right", sortValue: (r) => (typeof r.costo_final === "number" ? r.costo_final : 0), render: (r) => <span className="tnum font-medium">{money(r.costo_final)}</span> },
    { key: "ratio", header: "Costo/Aporte", align: "center", render: (r) => <Badge color={tagColor(r.costo_aporte)}>{dash(r.costo_aporte)}</Badge> },
  ];

  return (
    <>
      <ViewHeader id="team-cost" right={<Badge color={masked ? "var(--muted)" : "var(--amber)"}>{masked ? "Sueldos: X (enmascarado)" : "Sensible"}</Badge>} />

      <Grid cols={4} className="mb-3">
        <KPICard label="Personas" value={rows.length} accent="var(--cyan)" icon={Users} />
        <KPICard label="Evaluación promedio" value={evalAvg} accent={scoreColor(evalAvg)} icon={Star} />
        <KPICard label={`Planilla · ${cost.periodo}`} value={money(cost.planilla_total)} accent="var(--emerald)" icon={Banknote} sub={masked ? "enmascarado" : cost.moneda} />
        <KPICard label="Requieren feedback" value={feedback} accent="var(--violet)" icon={ShieldCheck} />
      </Grid>

      <Grid cols={2} className="mb-3">
        <Card>
          <SectionTitle title="Mejores evaluaciones" subtitle="Top aporte/evaluación" />
          {[...rows].sort((a, b) => b.evaluacion - a.evaluacion).slice(0, 7).map((c) =>
            <BarRow key={c.id} label={c.nombre} value={c.evaluacion} color={scoreColor(c.evaluacion)} />)}
        </Card>
        <Card>
          <SectionTitle title="Equipo por empresa" subtitle="Headcount" />
          {headByCo.map((h) => <BarRow key={h.label} label={h.label} value={h.value} max={Math.max(...headByCo.map((x) => x.value), 1)} color={h.color} right={h.value} />)}
        </Card>
      </Grid>

      <Card className="!p-2">
        <DataTable columns={cols} rows={rows} getKey={(r) => r.id}
          onRowClick={(r) => { useStore.getState().setPersonFilter(r.nombre); window.location.hash = "/person-focus"; }}
          initialSort={{ key: "eval", dir: "desc" }} />
      </Card>
      <p className={cx("text-[11px] text-muted mt-3")}>
        {masked
          ? "Sueldos enmascarados con «X» (sin PII, apto para publicar). Para ver montos reales en local: AP_SHOW_COSTS=1 python etl/parse_vault.py."
          : `Costo: ${cost.fuente} (${cost.periodo}).`} Evaluación = rol·actividades·trazabilidad·aporte·AI·balance de carga (determinística). Click en una fila → Persona 360.
      </p>
    </>
  );
}
