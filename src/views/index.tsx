import type { FC } from "react";
import type { ViewProps } from "./_shared";
import WorkspaceHome from "./WorkspaceHome";
import CommandCenter from "./CommandCenter";
import ExecutiveHealth from "./ExecutiveHealth";
import Strategic from "./Strategic";
import Projects from "./Projects";
import Risks from "./Risks";
import Decisions from "./Decisions";
import Tactical from "./Tactical";
import Operational from "./Operational";
import PeopleAI from "./PeopleAI";
import AINative from "./AINative";
import ContextPipeline from "./ContextPipeline";
import DataQuality from "./DataQuality";
import Evidence from "./Evidence";
import UpdateLog from "./UpdateLog";
import Domain from "./Domain";
import Functions from "./Functions";
import TeamCost from "./TeamCost";
import PersonFocus from "./PersonFocus";

const D = (id: string): FC<ViewProps> => (p) => <Domain id={id} />;
const H = (id: string): FC<ViewProps> => (p) => <WorkspaceHome id={id} navigate={p.navigate} />;

export const VIEWS: Record<string, FC<ViewProps>> = {
  // workspace homes
  global: H("global"),
  finanzas: H("finanzas"),
  comercial: H("comercial"),
  proyectos: H("proyectos"),
  automation: H("automation"),
  team: H("team"),

  // sections
  "command-center": CommandCenter,
  executive: ExecutiveHealth,
  strategic: Strategic,
  projects: Projects,
  risks: Risks,
  decisions: Decisions,
  tactical: Tactical,
  operational: Operational,
  people: PeopleAI,
  "ai-native": AINative,
  context: ContextPipeline,
  "data-quality": DataQuality,
  evidence: Evidence,
  "update-log": UpdateLog,
  functions: Functions,
  "team-cost": TeamCost,
  "person-focus": PersonFocus,

  // domain (keyword-filtered) sections
  cash: D("cash"),
  contabilidad: D("contabilidad"),
  sales: D("sales"),
  summit: D("summit"),
  delivery: D("delivery"),
  product: D("product"),
};
