import { ArrowUpRight } from "lucide-react";
import { useStore } from "@/store";
import { realCompanies } from "@/lib/data";
import { dash, companyVar } from "@/lib/format";
import { Card, ScoreRing, Semaforo, Badge, riskColor, scoreColor } from "@/components/ui";
import { ViewHeader, type ViewProps } from "./_shared";

export default function ExecutiveHealth({ navigate }: ViewProps) {
  const { bundle, companyFilter, openDrawer } = useStore();
  if (!bundle) return null;
  const cf = companyFilter;
  const companies = realCompanies(bundle).filter((e) => e.presente && (cf === "all" || e.nombre === cf));

  return (
    <>
      <ViewHeader id="executive" />
      <div className="space-y-3">
        {companies.map((c) => {
          const projects = bundle.proyectos.filter((p) => p.empresa === c.nombre);
          const risks = bundle.riesgos.filter((r) => r.empresa === c.nombre);
          const reds = projects.filter((p) => p.estado === "rojo");
          const crit = [...projects].sort((a, b) => b.ceo_attention - a.ceo_attention).slice(0, 4);
          const areas = bundle.areas.filter((a) => a.empresa === c.nombre);
          return (
            <Card key={c.id} className="!p-0 overflow-hidden">
              <div className="h-1 w-full" style={{ background: companyVar(c.nombre) }} />
              <div className="p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row gap-5">
                  {/* left: identity + scores */}
                  <div className="lg:w-72 shrink-0">
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="grid place-items-center h-9 w-9 rounded-xl text-white font-display font-bold"
                        style={{ background: companyVar(c.nombre) }}>{c.nombre.replace("+", "").slice(0, 2)}</span>
                      <div>
                        <div className="text-base font-semibold leading-tight">{c.nombre}</div>
                        <Semaforo estado={c.estado_global} label />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <ScoreRing value={c.health_score} size={62} label="Health" />
                      <ScoreRing value={c.risk_score} size={62} color={typeof c.risk_score === "number" ? riskColor(c.risk_score) : undefined} label="Risk" />
                      <ScoreRing value={c.ai_native_score} size={62} color="var(--violet)" label="AI" />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <Badge color="var(--brand)">{projects.length} proyectos</Badge>
                      {reds.length > 0 && <Badge color="var(--red)">{reds.length} en rojo</Badge>}
                      <Badge color="var(--amber)">{risks.length} riesgos</Badge>
                    </div>
                  </div>

                  {/* middle: critical projects */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Proyectos críticos</div>
                    <div className="space-y-1">
                      {crit.map((p) => (
                        <button key={p.id} onClick={() => openDrawer({ type: "project", id: p.id })}
                          className="w-full text-left flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2 transition-colors">
                          <Semaforo estado={p.estado} />
                          <span className="flex-1 text-sm truncate">{p.nombre}</span>
                          <span className="text-[11px] text-muted truncate hidden sm:block w-28">{p.area}</span>
                          <span className="text-sm tnum font-semibold w-9 text-right" style={{ color: scoreColor(p.health_score) }}>{p.health_score}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* right: areas */}
                  <div className="lg:w-56 shrink-0">
                    <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Áreas</div>
                    <div className="space-y-1.5">
                      {areas.slice(0, 6).map((a) => (
                        <div key={a.id} className="flex items-center gap-2 text-xs">
                          <Semaforo estado={a.estado} />
                          <span className="flex-1 truncate text-fg-2">{dash(a.nombre)}</span>
                          <span className="tnum text-muted">{a.health_score}</span>
                        </div>
                      ))}
                      {areas.length === 0 && <p className="text-xs text-muted">Sin áreas mapeadas.</p>}
                    </div>
                    <button onClick={() => navigate("projects")} className="mt-3 text-xs text-[var(--brand)] hover:underline inline-flex items-center gap-1">
                      Ver proyectos <ArrowUpRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
