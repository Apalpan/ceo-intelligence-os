import {
  LayoutDashboard, Activity, Compass, Workflow, ListChecks, FolderKanban,
  ShieldAlert, Gavel, Users, Bot, Banknote, Megaphone, HardHat, Cpu,
  GraduationCap, CalendarDays, GitBranch, Database, FileSearch, History,
  Crown, Calculator, Coins, UserSquare, Grid3x3, Handshake,
  type LucideIcon,
} from "lucide-react";

export type Depth = "core" | "live" | "scaffold";

export interface NavItem {
  id: string;
  label: string;
  short: string;
  icon: LucideIcon;
  workspace: string;
  depth: Depth;
  desc: string;
}

export interface Workspace {
  id: string;
  label: string;
  short: string;
  icon: LucideIcon;
  accent: string; // css var
  desc: string;
  sections: string[]; // section ids; first is the home overview
}

/** Los 6 dashboards. Cada uno tiene su link local: #/<id> */
export const WORKSPACES: Workspace[] = [
  { id: "global", label: "CEO Global · Ejecutivo Maestro", short: "Global", icon: Crown, accent: "var(--navy)",
    desc: "Vista maestra cross-empresa: salud, decisiones, riesgos y prioridades. Sin montos individuales.",
    sections: ["global", "command-center", "executive", "strategic", "decisions", "risks", "data-quality", "update-log"] },
  { id: "finanzas", label: "Empresa · Admin · Contabilidad · Finanzas", short: "Finanzas", icon: Banknote, accent: "var(--emerald)",
    desc: "Caja, cobranzas, planilla por empresa, contabilidad, tributación y administración.",
    sections: ["finanzas", "cash", "contabilidad", "team-cost", "decisions", "risks"] },
  { id: "comercial", label: "Comercial", short: "Comercial", icon: Handshake, accent: "var(--amber)",
    desc: "Pipeline B2B/B2C, marketing, sponsors y conversión.",
    sections: ["comercial", "sales", "summit", "projects"] },
  { id: "proyectos", label: "Proyectos · Operaciones", short: "Proyectos", icon: HardHat, accent: "var(--brand)",
    desc: "Portafolio, delivery BIM, producto, procesos y detalle operativo.",
    sections: ["proyectos", "projects", "delivery", "product", "functions", "tactical", "operational", "risks"] },
  { id: "automation", label: "Automation · Agentes", short: "Automation", icon: Bot, accent: "var(--violet)",
    desc: "Madurez AI-native, fuerza de agentes, procesos automatizables y pipeline de contexto.",
    sections: ["automation", "ai-native", "tactical", "context"] },
  { id: "team", label: "Team · Talento", short: "Team", icon: Users, accent: "var(--cyan)",
    desc: "Personas, costo vs aporte, carga, AI-native y enfoque 360 por colaborador.",
    sections: ["team", "people", "person-focus", "functions", "evidence"] },
];

export const NAV: NavItem[] = [
  // homes (overview de cada workspace)
  { id: "global", label: "Resumen Ejecutivo Global", short: "Resumen", icon: Crown, workspace: "global", depth: "core", desc: "Estado maestro de 30 segundos del ecosistema AP." },
  { id: "finanzas", label: "Resumen Finanzas", short: "Resumen", icon: Banknote, workspace: "finanzas", depth: "live", desc: "Caja, planilla y salud financiera por empresa." },
  { id: "comercial", label: "Resumen Comercial", short: "Resumen", icon: Handshake, workspace: "comercial", depth: "live", desc: "Pipeline, sponsors y marketing." },
  { id: "proyectos", label: "Resumen Proyectos", short: "Resumen", icon: HardHat, workspace: "proyectos", depth: "core", desc: "Portafolio y operaciones." },
  { id: "automation", label: "Resumen Automation", short: "Resumen", icon: Bot, workspace: "automation", depth: "live", desc: "Agentes y automatización." },
  { id: "team", label: "Resumen Team", short: "Resumen", icon: Users, workspace: "team", depth: "core", desc: "Personas, costo y aporte." },

  // global sections
  { id: "command-center", label: "CEO Command Center", short: "Command Center", icon: LayoutDashboard, workspace: "global", depth: "core", desc: "Qué decidir, qué está en rojo, qué genera caja." },
  { id: "executive", label: "Executive Business Health", short: "Business Health", icon: Activity, workspace: "global", depth: "core", desc: "Salud por empresa: health, risk, AI-native." },
  { id: "strategic", label: "Strategic Intelligence", short: "Strategic", icon: Compass, workspace: "global", depth: "live", desc: "Matriz impacto × riesgo, core/growth/kill." },
  { id: "decisions", label: "Decisions CEO", short: "Decisions", icon: Gavel, workspace: "global", depth: "core", desc: "Decisiones con opciones, recomendación y límite." },
  { id: "risks", label: "Risks & Blockers", short: "Risks", icon: ShieldAlert, workspace: "global", depth: "core", desc: "Riesgos y bloqueos por severidad." },
  { id: "data-quality", label: "Data Quality", short: "Data Quality", icon: Database, workspace: "global", depth: "live", desc: "Completitud, consistencia y contradicciones." },
  { id: "update-log", label: "Update Log", short: "Update Log", icon: History, workspace: "global", depth: "live", desc: "Cortes, deltas e historial." },

  // finanzas sections
  { id: "cash", label: "Caja & Cobranzas", short: "Caja", icon: Coins, workspace: "finanzas", depth: "live", desc: "Caja por cobrar y proyectos que generan ingresos." },
  { id: "contabilidad", label: "Contabilidad & Administración", short: "Contab/Admin", icon: Calculator, workspace: "finanzas", depth: "live", desc: "Tributación, legal y administración." },
  { id: "team-cost", label: "Costo de Equipo (Planilla)", short: "Planilla", icon: Banknote, workspace: "finanzas", depth: "live", desc: "Costo por persona y por empresa, costo vs aporte." },

  // comercial sections
  { id: "sales", label: "Sales & Marketing", short: "Sales", icon: Megaphone, workspace: "comercial", depth: "live", desc: "Comercial B2C/B2B, marketing y atribución." },
  { id: "summit", label: "Summit & Sponsors", short: "Summit", icon: CalendarDays, workspace: "comercial", depth: "live", desc: "AI Construction Summit: sponsors y producción." },

  // proyectos sections
  { id: "projects", label: "Projects Portfolio", short: "Portafolio", icon: FolderKanban, workspace: "proyectos", depth: "core", desc: "Portafolio con avance, evidencia y health." },
  { id: "delivery", label: "Delivery & Operations", short: "Delivery", icon: HardHat, workspace: "proyectos", depth: "live", desc: "Delivery BIM, alcance y QA/QC." },
  { id: "product", label: "Product & Technology", short: "Product", icon: Cpu, workspace: "proyectos", depth: "live", desc: "Producto digital, VisionPro y dev." },
  { id: "functions", label: "Mapa Funcional", short: "Funciones", icon: Grid3x3, workspace: "proyectos", depth: "live", desc: "Empresa × función (admin, finanzas, comercial, ops, automatización, team)." },
  { id: "tactical", label: "Tactical Process Control", short: "Procesos", icon: Workflow, workspace: "proyectos", depth: "live", desc: "Procesos por área con Process Score." },
  { id: "operational", label: "Operational Detail", short: "Operativo", icon: ListChecks, workspace: "proyectos", depth: "live", desc: "Tareas por altitud y modo." },

  // automation sections
  { id: "ai-native", label: "AI-Native Transformation", short: "AI-Native", icon: Bot, workspace: "automation", depth: "live", desc: "Madurez AI-first y backlog de automatización." },
  { id: "context", label: "Context Pipeline", short: "Context", icon: GitBranch, workspace: "automation", depth: "live", desc: "Cómo entra y se normaliza la información." },

  // team sections
  { id: "people", label: "People & AI Workforce", short: "People", icon: Users, workspace: "team", depth: "core", desc: "Equipo + agentes: carga, WIP, leverage IA." },
  { id: "person-focus", label: "Persona 360", short: "Persona 360", icon: UserSquare, workspace: "team", depth: "core", desc: "Enfoque, proyectos y resultados por persona (estratégico/táctico/operativo)." },
  { id: "evidence", label: "Evidence Center", short: "Evidence", icon: FileSearch, workspace: "team", depth: "scaffold", desc: "Trazabilidad de evidencias y fuentes." },
];

export const NAV_BY_ID = Object.fromEntries(NAV.map((n) => [n.id, n]));
export const WS_BY_ID = Object.fromEntries(WORKSPACES.map((w) => [w.id, w]));
export const SECTION_WS: Record<string, string> = Object.fromEntries(NAV.map((n) => [n.id, n.workspace]));
export const DEFAULT_VIEW = "global";

export function workspaceOf(sectionId: string): string {
  return SECTION_WS[sectionId] ?? "global";
}
