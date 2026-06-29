import type { Bundle } from "@/types";

export interface SearchHit {
  type: string;
  label: string;
  sub: string;
  view: string;
  empresa?: string;
}

/** Lightweight global search across the main entities (for ⌘K and the header). */
export function searchAll(b: Bundle | null, q: string): SearchHit[] {
  if (!b || !q.trim()) return [];
  const t = q.trim().toLowerCase();
  const m = (s?: string) => (s || "").toLowerCase().includes(t);
  const hits: SearchHit[] = [];

  for (const p of b.proyectos)
    if (m(p.nombre) || m(p.responsable) || m(p.area) || m(p.empresa))
      hits.push({ type: "Proyecto", label: p.nombre, sub: `${p.empresa} · ${p.area}`, view: "projects", empresa: p.empresa });
  for (const c of b.colaboradores)
    if (m(c.nombre) || m(c.proyectos) || m(c.empresa_area))
      hits.push({ type: "Persona", label: c.nombre, sub: c.empresa_area, view: "people" });
  for (const r of b.riesgos)
    if (m(r.riesgo) || m(r.empresa) || m(r.responsable))
      hits.push({ type: "Riesgo", label: r.riesgo, sub: `${r.empresa} · ${r.urgencia}`, view: "risks", empresa: r.empresa });
  for (const d of b.decisiones)
    if (m(d.titulo) || m(d.recomendacion))
      hits.push({ type: "Decisión", label: d.titulo, sub: d.urgencia, view: "decisions" });
  for (const a of b.agentes)
    if (m(a.nombre) || m(a.proposito) || m(a.owner_humano))
      hits.push({ type: "Agente", label: a.nombre, sub: `${a.empresa} · ${a.owner_humano}`, view: "ai-native", empresa: a.empresa });
  for (const pr of b.procesos)
    if (m(pr.nombre) || m(pr.owner))
      hits.push({ type: "Proceso", label: pr.nombre, sub: pr.empresa, view: "tactical", empresa: pr.empresa });

  return hits.slice(0, 40);
}
