import { useEffect } from "react";
import { X, FileText, Bot, Wrench, ArrowRight } from "lucide-react";
import { useStore } from "@/store";
import { cx, dash, companyVar } from "@/lib/format";
import { Badge, Confidence, ScoreRing, Semaforo, KeyVal, Progress, scoreColor, riskColor, estadoColor } from "@/components/ui";

export function Drawer() {
  const { drawer, closeDrawer, bundle } = useStore();
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    if (drawer) window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [drawer, closeDrawer]);

  if (!drawer || !bundle) return null;

  let title = "", company = "AP", body: React.ReactNode = null;

  if (drawer.type === "project") {
    const p = bundle.proyectos.find((x) => x.id === drawer.id);
    if (p) {
      title = p.nombre; company = p.empresa;
      body = (
        <>
          <div className="flex items-center gap-4 mb-4">
            <ScoreRing value={p.health_score} label="Health" />
            <ScoreRing value={p.risk_score} color={riskColor(p.risk_score)} label="Risk" />
            <ScoreRing value={p.ceo_attention} color={scoreColor(100 - p.ceo_attention)} label="CEO" />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <Semaforo estado={p.estado} label />
            <Badge color="var(--brand)">{p.area}</Badge>
            <Confidence value={p.confianza} />
          </div>
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1"><span className="text-muted">Avance reportado vs validado</span>
              <span className="tnum">{p.avance_reportado}% → <b>{p.avance_validado}%</b></span></div>
            <Progress value={p.avance_validado} color={companyVar(company)} />
          </div>
          <div className="space-y-0.5">
            <KeyVal k="Responsable" v={p.responsable} />
            <KeyVal k="Próximo hito" v={p.proximo_hito} />
            <KeyVal k="Pendientes" v={p.pendientes} />
            <KeyVal k="Bloqueos" v={p.bloqueos} />
            <KeyVal k="Riesgos" v={p.riesgos} />
            <KeyVal k="Impacto caja" v={`${p.impacto_caja}/100`} />
            <KeyVal k="Impacto cliente" v={`${p.impacto_cliente}/100`} />
          </div>
          <SourceRow fuente={p.fuente} evidencia={p.evidencia} />
        </>
      );
    }
  } else if (drawer.type === "person") {
    const c = bundle.colaboradores.find((x) => x.id === drawer.id);
    if (c) {
      title = c.nombre; company = c.empresas[0] || "AP";
      body = (
        <>
          <div className="flex items-center gap-3 mb-4">
            <ScoreRing value={c.ai_native_score} label="AI-native" />
            <ScoreRing value={c.wip_score} color={riskColor(c.wip_score)} label="WIP" />
            <ScoreRing value={c.bottleneck_score} color={riskColor(c.bottleneck_score)} label="Cuello" />
            <ScoreRing value={c.ai_leverage_score} label="Leverage" />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge color="var(--brand)">{c.empresa_area}</Badge>
            <Badge color={c.carga_val >= 0.8 ? "var(--red)" : "var(--amber)"}>Carga {dash(c.carga)}</Badge>
            {c.necesita_feedback && <Badge color="var(--violet)">Feedback CEO</Badge>}
          </div>
          <div className="space-y-0.5">
            <KeyVal k="Proyectos" v={c.proyectos} />
            <KeyVal k="Actividades" v={c.actividades} />
            <KeyVal k="Pendientes" v={c.pendientes} />
            <KeyVal k="Riesgos" v={c.riesgos} />
            <KeyVal k="Próxima acción" v={c.proxima_accion} />
          </div>
          <Block icon={Wrench} title="Herramientas IA recomendadas" items={c.herramientas_recomendadas} />
          <Block icon={Bot} title="Agentes recomendados" items={c.agentes_recomendados} accent="var(--violet)" />
          <Block icon={ArrowRight} title="Procesos delegables a IA" items={c.procesos_delegables} accent="var(--cyan)" />
          <SourceRow fuente={c.fuente} confianza={c.confianza_ai} />
        </>
      );
    }
  } else if (drawer.type === "risk") {
    const r = bundle.riesgos.find((x) => x.id === drawer.id);
    if (r) {
      title = r.riesgo; company = r.empresa;
      body = (
        <>
          <div className="flex items-center gap-4 mb-4">
            <ScoreRing value={r.risk_score} color={riskColor(r.risk_score)} label="Risk" />
            <div className="flex flex-wrap gap-2">
              <Badge color={r.urgencia.includes("P0") ? "var(--red)" : "var(--amber)"}>{r.urgencia}</Badge>
              <Badge color="var(--brand)">{r.tipo}</Badge>
              <Confidence value={r.confianza} />
            </div>
          </div>
          <div className="space-y-0.5">
            <KeyVal k="Área / Proyecto" v={`${dash(r.area)} · ${dash(r.proyecto)}`} />
            <KeyVal k="Responsable" v={r.responsable} />
            <KeyVal k="Causa probable" v={r.causa} />
            <KeyVal k="Impacto" v={r.impacto} />
            <KeyVal k="Acción recomendada" v={r.accion} />
            <KeyVal k="Dueño sugerido" v={r.dueno_sugerido} />
          </div>
          <SourceRow fuente={r.fuente} />
        </>
      );
    }
  } else if (drawer.type === "decision") {
    const d = bundle.decisiones.find((x) => x.id === drawer.id);
    if (d) {
      title = d.titulo; company = "AP";
      body = (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge color={d.urgencia.includes("P0") ? "var(--red)" : "var(--amber)"}>{d.urgencia}</Badge>
            <Badge color="var(--violet)">{d.nivel}</Badge>
          </div>
          <div className="space-y-0.5">
            <KeyVal k="Contexto" v={d.contexto} />
            <KeyVal k="Opciones" v={d.opciones} />
            <KeyVal k="Recomendación" v={<span className="font-medium text-fg">{dash(d.recomendacion)}</span>} />
            <KeyVal k="Riesgo de no decidir" v={d.riesgo_no_decidir} />
            <KeyVal k="Fecha límite" v={d.fecha_limite} />
            <KeyVal k="Información faltante" v={d.info_faltante} />
          </div>
          <SourceRow fuente={d.fuente} />
        </>
      );
    }
  } else if (drawer.type === "agent") {
    const a = bundle.agentes.find((x) => x.id === drawer.id);
    if (a) {
      title = a.nombre; company = a.empresa;
      body = (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge color={a.prioridad.includes("P0") ? "var(--red)" : "var(--brand)"}>{a.prioridad}</Badge>
            <Badge color="var(--violet)">{a.area}</Badge>
            <Badge color="var(--muted)">{a.estado}</Badge>
          </div>
          <div className="space-y-0.5">
            <KeyVal k="Propósito" v={a.proposito} />
            <KeyVal k="Owner humano" v={a.owner_humano} />
            <KeyVal k="Impacto estimado" v={`${a.impacto_estimado}/5`} />
            <KeyVal k="Dificultad" v={`${a.dificultad}/5`} />
          </div>
          <div className="mt-3 rounded-xl bg-surface-2 border border-[var(--border)] p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted mb-1">Prompt base</p>
            <p className="text-xs text-fg-2 font-mono leading-relaxed">{a.prompt_base}</p>
          </div>
          <SourceRow fuente={a.fuente} confianza={a.confianza} />
        </>
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[color-mix(in_oklch,var(--navy)_45%,transparent)] backdrop-blur-[2px] animate-fade-in" onClick={closeDrawer} />
      <aside role="dialog" aria-label={title}
        className="absolute right-0 top-0 h-full w-full max-w-[480px] bg-surface border-l border-[var(--border)] shadow-pop flex flex-col animate-slide-in">
        <div className="h-1.5 w-full" style={{ background: companyVar(company) }} />
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--border)]">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-muted">{company}</div>
            <h2 className="text-base font-semibold leading-tight" style={{ textWrap: "balance" as never }}>{title || "Detalle"}</h2>
          </div>
          <button onClick={closeDrawer} aria-label="Cerrar"
            className="press grid place-items-center h-8 w-8 rounded-lg hover:bg-surface-2 text-fg-2 shrink-0"><X size={16} /></button>
        </header>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4">{body || <p className="text-sm text-muted">No encontrado.</p>}</div>
      </aside>
    </div>
  );
}

function Block({ icon: Icon, title, items, accent = "var(--brand)" }:
  { icon: typeof Bot; title: string; items: string[]; accent?: string }) {
  if (!items?.length) return null;
  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted mb-2"><Icon size={13} />{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it, i) => <Badge key={i} color={accent}>{it}</Badge>)}
      </div>
    </div>
  );
}

function SourceRow({ fuente, evidencia, confianza }: { fuente: string; evidencia?: string; confianza?: string }) {
  return (
    <div className="mt-5 pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2 text-[11px] text-muted">
      <span className="inline-flex items-center gap-1"><FileText size={12} /> Fuente: <span className="text-fg-2">{dash(fuente)}</span></span>
      {evidencia && evidencia !== "No se tiene claro" && <span className="inline-flex items-center gap-1">· Evidencia: <span className="text-fg-2">{evidencia}</span></span>}
      {confianza && <span>· Confianza: <span className="text-fg-2">{confianza}</span></span>}
    </div>
  );
}
