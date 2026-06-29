import { useState } from "react";
import { useStore } from "@/store";
import { companyVar, dash } from "@/lib/format";
import { Card, SectionTitle, Semaforo, scoreColor, EmptyState } from "@/components/ui";
import { realCompanies } from "@/lib/data";
import { ViewHeader, type ViewProps } from "./_shared";
import { FolderKanban } from "lucide-react";

const FUNCIONES = ["Administración", "Contabilidad", "Finanzas", "Comercial", "Marketing",
  "Operaciones / Proyectos", "Automatización", "Talento / Team"];

export default function Functions(_: ViewProps) {
  const { bundle, companyFilter, openDrawer } = useStore();
  const [sel, setSel] = useState<{ empresa: string; funcion: string } | null>(null);
  if (!bundle) return null;

  const companies = realCompanies(bundle).filter((e) => e.presente && (companyFilter === "all" || e.nombre === companyFilter));
  const cell = (emp: string, fn: string) => bundle.funciones.find((f) => f.empresa === emp && f.funcion === fn);
  const selProjects = sel ? bundle.proyectos.filter((p) => p.empresa === sel.empresa && p.funcion === sel.funcion) : [];

  return (
    <>
      <ViewHeader id="functions" />
      <Card className="mb-3 overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm border-collapse min-w-[760px]">
          <thead>
            <tr>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted py-2 pr-3">Empresa \ Función</th>
              {FUNCIONES.map((f) => (
                <th key={f} className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted py-2 px-1 align-bottom">
                  <span className="block leading-tight">{f.replace(" / ", "/")}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-t border-[var(--border)]">
                <td className="py-2 pr-3 font-medium whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: companyVar(c.nombre) }} />{c.nombre}</span>
                </td>
                {FUNCIONES.map((f) => {
                  const cl = cell(c.nombre, f);
                  const active = sel?.empresa === c.nombre && sel?.funcion === f;
                  return (
                    <td key={f} className="text-center py-1.5 px-1">
                      {cl ? (
                        <button onClick={() => setSel(active ? null : { empresa: c.nombre, funcion: f })}
                          className={cx2("press inline-grid place-items-center h-10 w-12 rounded-lg border transition-all", active ? "ring-2" : "")}
                          style={{ background: `color-mix(in oklch, ${scoreColor(cl.health_score)} ${14 + cl.n_proyectos * 8}%, transparent)`,
                            borderColor: active ? scoreColor(cl.health_score) : "transparent" }}
                          title={`${c.nombre} · ${f}: ${cl.n_proyectos} proyectos · health ${cl.health_score}`}>
                          <span className="text-sm font-semibold tnum" style={{ color: scoreColor(cl.health_score) }}>{cl.n_proyectos}</span>
                          {cl.reds > 0 && <span className="text-[9px] text-[var(--red)] leading-none">{cl.reds}🔴</span>}
                        </button>
                      ) : <span className="text-muted/40 text-xs">·</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {sel ? (
        <Card>
          <SectionTitle title={`${sel.empresa} · ${sel.funcion}`} subtitle={`${selProjects.length} proyectos`} />
          <div className="divide-y divide-[var(--border)]">
            {selProjects.map((p) => (
              <button key={p.id} onClick={() => openDrawer({ type: "project", id: p.id })}
                className="w-full text-left py-2 flex items-center gap-3 hover:bg-surface-2 rounded-lg px-1 transition-colors">
                <Semaforo estado={p.estado} />
                <span className="flex-1 text-sm truncate">{p.nombre}</span>
                <span className="text-[11px] text-muted truncate w-32 hidden sm:block">{dash(p.responsable)}</span>
                <span className="tnum text-sm font-semibold w-9 text-right" style={{ color: scoreColor(p.health_score) }}>{p.health_score}</span>
              </button>
            ))}
            {selProjects.length === 0 && <EmptyState icon={FolderKanban} title="Sin proyectos en esta celda" />}
          </div>
        </Card>
      ) : (
        <p className="text-xs text-muted">Click en una celda para ver los proyectos de esa empresa × función. El número es la cantidad de proyectos; el color, la salud media.</p>
      )}
    </>
  );
}

function cx2(...a: (string | false | undefined)[]) { return a.filter(Boolean).join(" "); }
