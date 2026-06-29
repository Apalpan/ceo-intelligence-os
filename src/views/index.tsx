import type { FC } from "react";
import type { ViewProps } from "./_shared";
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

const D = (id: string): FC<ViewProps> => () => <Domain id={id} />;

export const VIEWS: Record<string, FC<ViewProps>> = {
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
  cash: D("cash"),
  sales: D("sales"),
  delivery: D("delivery"),
  product: D("product"),
  training: D("training"),
  summit: D("summit"),
};
