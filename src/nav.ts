import {
  LayoutDashboard, Activity, Compass, Workflow, ListChecks, FolderKanban,
  ShieldAlert, Gavel, Users, Bot, Banknote, Megaphone, HardHat, Cpu,
  GraduationCap, CalendarDays, GitBranch, Database, FileSearch, History,
  type LucideIcon,
} from "lucide-react";

export type Depth = "core" | "live" | "scaffold";

export interface NavItem {
  id: string;
  label: string;
  short: string;
  icon: LucideIcon;
  group: string;
  depth: Depth;
  desc: string;
}

export const NAV: NavItem[] = [
  { id: "command-center", label: "CEO Command Center", short: "Command Center", icon: LayoutDashboard, group: "Ejecutivo", depth: "core", desc: "Vista de 30 segundos: qué decidir, qué está en rojo, qué genera caja." },
  { id: "executive", label: "Executive Business Health", short: "Business Health", icon: Activity, group: "Ejecutivo", depth: "core", desc: "Salud por empresa: health, risk, AI-native, proyectos críticos." },
  { id: "strategic", label: "Strategic Intelligence", short: "Strategic", icon: Compass, group: "Ejecutivo", depth: "scaffold", desc: "Matrices impacto/urgencia, caja/estrategia, core/growth/kill." },

  { id: "projects", label: "Projects Portfolio", short: "Projects", icon: FolderKanban, group: "Operación", depth: "core", desc: "Portafolio de proyectos con avance, evidencia y health." },
  { id: "risks", label: "Risks & Blockers", short: "Risks", icon: ShieldAlert, group: "Operación", depth: "core", desc: "Riesgos y bloqueos priorizados por severidad P0–P2." },
  { id: "decisions", label: "Decisions CEO", short: "Decisions", icon: Gavel, group: "Operación", depth: "core", desc: "Decisiones pendientes con opciones, recomendación y límite." },
  { id: "tactical", label: "Tactical Process Control", short: "Processes", icon: Workflow, group: "Operación", depth: "live", desc: "Procesos por área con Process Score y agente sugerido." },
  { id: "operational", label: "Operational Detail", short: "Operational", icon: ListChecks, group: "Operación", depth: "scaffold", desc: "Detalle granular Empresa→Área→Proyecto→Tarea." },

  { id: "people", label: "People & AI Workforce", short: "People & AI", icon: Users, group: "Personas & IA", depth: "core", desc: "Equipo + agentes: carga, WIP, autonomía y leverage IA." },
  { id: "ai-native", label: "AI-Native Transformation", short: "AI-Native", icon: Bot, group: "Personas & IA", depth: "live", desc: "Madurez AI-first, fuerza de agentes y backlog de automatización." },

  { id: "cash", label: "Cash & Revenue", short: "Cash", icon: Banknote, group: "Negocio", depth: "scaffold", desc: "Caja, cobranzas y proyectos que generan ingresos." },
  { id: "sales", label: "Sales & Marketing", short: "Sales", icon: Megaphone, group: "Negocio", depth: "scaffold", desc: "Comercial B2C/B2B, marketing y atribución." },
  { id: "delivery", label: "Delivery & Operations", short: "Delivery", icon: HardHat, group: "Negocio", depth: "scaffold", desc: "Delivery BIM, alcance y QA/QC." },
  { id: "product", label: "Product & Technology", short: "Product", icon: Cpu, group: "Negocio", depth: "scaffold", desc: "Producto digital, VisionPro y dev." },
  { id: "training", label: "Training & Community", short: "Training", icon: GraduationCap, group: "Negocio", depth: "scaffold", desc: "Academia, certificados, comunidad y postventa." },
  { id: "summit", label: "Summit & Events", short: "Summit", icon: CalendarDays, group: "Negocio", depth: "scaffold", desc: "AI Construction Summit: sponsors, agenda, producción." },

  { id: "context", label: "Context Pipeline", short: "Context", icon: GitBranch, group: "Datos & Contexto", depth: "live", desc: "Cómo entra y se normaliza la información hacia el dashboard." },
  { id: "data-quality", label: "Data Quality", short: "Data Quality", icon: Database, group: "Datos & Contexto", depth: "live", desc: "Completitud, consistencia, evidencia y contradicciones." },
  { id: "evidence", label: "Evidence Center", short: "Evidence", icon: FileSearch, group: "Datos & Contexto", depth: "scaffold", desc: "Trazabilidad de evidencias y fuentes por entidad." },
  { id: "update-log", label: "Update Log", short: "Update Log", icon: History, group: "Datos & Contexto", depth: "live", desc: "Cortes, deltas e historial de actualización del sistema." },
];

export const NAV_GROUPS = ["Ejecutivo", "Operación", "Personas & IA", "Negocio", "Datos & Contexto"];
export const NAV_BY_ID = Object.fromEntries(NAV.map((n) => [n.id, n]));
export const DEFAULT_VIEW = "command-center";
