// Entity types mirroring the ETL bundle (public/data/ceo_os.json).
// Score fields can be the string "No se tiene claro" when not derivable.

export type Num = number | string;
export type Estado = "rojo" | "amarillo" | "verde" | string;
export type CompanyName = "GEN+" | "AECODE" | "VisionPro" | "AgentFlow" | "THESIA" | "SP+" | "AP";

export interface Empresa {
  id: string;
  nombre: CompanyName;
  color: string;
  n_proyectos: number;
  health_score: Num;
  risk_score: Num;
  ai_native_score: Num;
  process_score: Num;
  estado_global: Estado;
  presente: boolean;
  owner: string;
}

export interface Area {
  id: string; empresa: string; nombre: string; n_proyectos: number;
  health_score: number; risk_score: number; estado: Estado;
}

export interface Funcion {
  id: string; empresa: string; funcion: string; icon: string;
  n_proyectos: number; reds: number; health_score: number; risk_score: number; proyectos: string[];
}

export interface Participacion {
  persona: string; proyecto_id: string; proyecto: string; empresa: string; unidad: string; rol: string;
}

export interface Costos {
  periodo: string; planilla_por_empresa: Record<string, Num>; planilla_total: Num;
  n_personas_costo: number; moneda: string; fuente: string; enmascarado?: boolean;
}

export interface ActividadClave {
  act: string; area: string; actividad: string; prioridad: string; sla: string; evidencia: string; metrica: string;
}
export interface AvanceDetalle { seccion: string; texto: string; }

export interface Proyecto {
  id: string; empresa: string; area: string; nombre: string; funcion: string;
  unidad: string; personas: string[]; responsable: string;
  evaluacion: number; eval_dims: Record<string, number>;
  avance_reportado: number; avance_validado: number; estado: Estado;
  pendientes: string; bloqueos: string; riesgos: string; proximo_hito: string;
  evidencia: string; confianza: string;
  health_score: number; risk_score: number; ceo_attention: number;
  impacto_caja: number; impacto_cliente: number; fuente: string;
}

export interface Colaborador {
  id: string; nombre: string; empresa_area: string; funcion: string; empresas: string[];
  rol: string; enfoque: string[]; actividades_clave: ActividadClave[]; avances_detalle: AvanceDetalle[];
  metricas: string[]; restricciones: string[]; evaluacion: number; eval_dims: Record<string, number>;
  proyectos: string; n_proyectos: number; actividades: string; pendientes: string;
  carga: string; carga_val: number; riesgos: string; necesita_feedback: boolean;
  proxima_accion: string;
  wip_score: number; bottleneck_score: number; context_quality_score: number;
  ai_leverage_score: number; ai_native_score: number;
  proyecto_ids: string[]; avg_proj_health: number; aporte_score: number;
  costo_final: Num; costo_base: Num; costo_por_empresa: Record<string, number>;
  rol_rh: string; costo_aporte: string; valor_diff: number; solo_costo: boolean;
  herramientas_actuales: string[]; herramientas_recomendadas: string[];
  agentes_recomendados: string[]; procesos_delegables: string[];
  confianza_ai: string; fuente: string;
}

export interface Riesgo {
  id: string; tipo: string; riesgo: string; empresa: string; area: string;
  proyecto: string; responsable: string; causa: string; impacto: string;
  urgencia: string; accion: string; dueno_sugerido: string; risk_score: number;
  estado: string; confianza: string; fuente: string;
}

export interface Bloqueo {
  id: string; empresa: string; area: string; proyecto: string; descripcion: string;
  responsable_bloqueado: string; impacto: string; urgencia: string;
  accion_recomendada: string; estado: string; confianza: string; fuente: string;
}

export interface Decision {
  id: string; titulo: string; nivel: string; contexto: string; opciones: string;
  recomendacion: string; riesgo_no_decidir: string; fecha_limite: string;
  info_faltante: string; estado: string; urgencia: string; confianza: string; fuente: string;
}

export interface Prioridad {
  id: string; titulo: string; nivel: string; owner: string; resultado_esperado: string;
  fecha: string; pregunta_daily: string; estado: string; confianza: string; fuente: string;
}

export interface Tarea {
  id: string; empresa: string; area: string; proyecto: string; funcion: string;
  altitud: string; modo: string; colaborador: string;
  descripcion: string; estado: string; prioridad: string; fecha_objetivo: string;
  resultado_esperado: string; evidencia: string; confianza: string; fuente: string;
}

export interface Proceso {
  id: string; empresa: string; area: string; nombre: string; input: string; output: string;
  owner: string; sla: string; herramientas: string[]; herramientas_ia: string[];
  agente_sugerido: string; estado: string; process_score: number;
  automatizable: boolean; prioridad_automatizacion: string; confianza: string; fuente: string;
}

export interface Agente {
  id: string; nombre: string; empresa: string; area: string; proposito: string;
  owner_humano: string; estado: string; impacto_estimado: number; dificultad: number;
  prioridad: string; prompt_base: string; confianza: string; fuente: string;
}

export interface Herramienta { id: string; nombre: string; categoria: string; casos_uso: string[]; nivel: string; confianza: string; }
export interface Evidencia { id: string; tipo: string; fuente: string; relacionado_con: string; empresa: string; fecha: string; confiabilidad: string; }
export interface Fuente { id: string; tipo: string; ruta: string; nombre: string; procesado: boolean; calidad: string; }
export interface Delta { entidad: string; id: string; tipo: string; antes: number | null; despues: number | null; }
export interface Highlight { id: string; colaborador: string; aprendizaje: string; decision: string; solucion: string; valor: string; proyecto: string; fuente: string; }

export interface AiNative {
  overall_score: Num; clasificacion: string;
  por_persona: Array<{ colaborador: string; ai_native_score: Num; ai_leverage_score: number;
    herramientas_actuales: string[]; herramientas_recomendadas: string[];
    agentes_recomendados: string[]; procesos_delegables: string[]; confianza: string; }>;
  por_empresa: Array<{ empresa: string; ai_native_score: number; clasificacion: string }>;
  agentes_propuestos: number; procesos_automatizables: number;
  backlog_automatizacion: Array<{ proceso: string; empresa: string; prioridad: string; process_score: number; agente: string }>;
}

export interface DataQuality {
  data_quality_score: number; completitud: number; consistencia: number; actualidad: number;
  evidencia: number; normalizacion: number; contradicciones: number;
  gaps: Array<{ entidad: string; empresa: string; faltante: string[] }>;
  contradicciones_detalle: string[];
}

export interface Bundle {
  meta: {
    generated_at: string; vault: string; first_run: boolean; corte: string;
    periodo: string; periodo_costos: string;
    counts: Record<string, number>;
  };
  empresas: Empresa[]; areas: Area[]; funciones: Funcion[]; proyectos: Proyecto[]; colaboradores: Colaborador[];
  riesgos: Riesgo[]; bloqueos: Bloqueo[]; decisiones: Decision[]; prioridades: Prioridad[];
  tareas: Tarea[]; evidencias: Evidencia[]; fuentes: Fuente[]; deltas: Delta[];
  procesos: Proceso[]; agentes: Agente[]; herramientas_ia: Herramienta[];
  ai_native: AiNative; data_quality: DataQuality; highlights: Highlight[];
  participaciones: Participacion[]; costos: Costos;
}
