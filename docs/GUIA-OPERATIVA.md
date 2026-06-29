# Guía operativa — CEO Intelligence OS

Para Alejandro. Cómo operar el sistema con mínima fricción.

---

## Ritual semanal (15 min, lunes)

1. **Abre el dashboard** (`npm run dev` o el deploy en Pages).
2. **CEO Command Center** (30 s): mira el semáforo por empresa, "Decidir hoy", riesgos P0 y equipo sobrecargado.
3. **Decisions CEO**: resuelve o delega las decisiones P0. Cada una tiene opciones + recomendación COO + qué información falta.
4. **People & AI**: revisa quién está en WIP ≥ 75 (rojo) y a quién darle feedback. Click en la persona → agentes recomendados y procesos delegables.
5. **Risks & Blockers**: confirma que cada P0 tiene dueño y acción.
6. **AI-Native**: elige 1 agente del backlog P0 para construir esta semana (Claude Code / Codex).

## Ritual de actualización (cuando llega info nueva)

1. Pide a Codex: *"normaliza esto en 00_CEO_Intelligence"* (o edítalo tú).
2. Corre `npm run etl`.
3. Recarga el dashboard (↻). Revisa **Update Log** para ver los deltas.

## Qué responde el sistema

- ¿Qué decidir hoy? → **Command Center / Decisions**
- ¿Qué está en rojo? → **Command Center / Executive Health**
- ¿Qué genera caja? → **Cash** (+ impacto_caja en proyectos)
- ¿Quién está sobrecargado? → **People & AI** (WIP)
- ¿Quién bloquea flujos? → **People & AI** (Bottleneck)
- ¿Qué automatizar primero? → **AI-Native** (backlog) / **Tactical** (process score bajo)
- ¿Qué cambió desde el último corte? → **Update Log** (deltas)
- ¿Qué dato está contradictorio o falta? → **Data Quality**

## Cómo agregar una empresa / unidad nueva
Aparece sola en el dashboard apenas tenga proyectos en `01_Matriz_Proyectos.md` con su nombre normalizado (`norm_company` en el ETL ya mapea GEN+, AECODE, VisionPro, AgentFlow, THESIA, SP+). Para una unidad nueva, agrégala al `COMPANY_ORDER` y `COMPANY_COLOR` del ETL y al token `--c-*` en `src/index.css`.

## Cómo mejorar la capa AI-native de una persona
Edita `etl/seeds.py` → `AI_PROFILE["Nombre"]` (uso_ia, contexto, automatización, agentes, procesos delegables). Vuelve a correr el ETL.

## Construir agentes primero (recomendación)
Por impacto × facilidad, en orden: **Cobranzas Agent** (caja GEN+), **Sponsors Agent** (Summit), **Training Operations Agent** (certificados), **CEO Briefing Agent**, **Control de Alcance BIM Agent** (Cañete). Cada agente trae un `prompt_base` en su drawer (AI-Native → click en el agente).
