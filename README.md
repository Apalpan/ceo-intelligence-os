# CEO Intelligence OS — AP

> Sistema nervioso AI-native del ecosistema AP (GEN+ · AECODE · VisionPro · AgentFlow · THESIA · SP+).
> No es un dashboard bonito: convierte el vault de Obsidian en contexto, scores, decisiones, prioridades, riesgos y recomendaciones de automatización.

**Stack:** Vite + React + TypeScript + Tailwind (app) · Python stdlib (ETL) · datos desde el vault Obsidian `00_CEO_Intelligence`.

---

## Cómo funciona (arquitectura)

```
Vault Obsidian                 ETL (Python)                 App (Vite + React)
00_CEO_Intelligence/*.md  ──►  etl/parse_vault.py     ──►   public/data/*.json  ──►  20 vistas
(8 archivos normalizados)      + etl/seeds.py               (1 bundle + 18 entidades)   interactivas
                               + 7 scores deterministas     reports/*.md  ·  logs/*.md
```

1. **Codex** normaliza la información cruda (WhatsApp, reportes, audios, Excel) en los 8 archivos de `D:\AP\AP_Knowledge_OS\00_CEO_Intelligence`.
2. **El ETL** (`parse_vault.py`) lee esos archivos, extrae 18 tipos de entidad, calcula los scores, compara contra el baseline anterior (deltas) y emite JSON + reportes.
3. **La app** consume `public/data/ceo_os.json` y rinde el dashboard multicapa.

La capa de agentes / procesos / madurez AI-native (`etl/seeds.py`) está marcada como **`Inferido` (propuesta)** para distinguirla de la data verificada del vault. **Regla antialucinación:** toda entidad lleva `confianza` y `fuente`; lo que falta queda como `No se tiene claro`, nunca inventado.

---

## Cómo correrlo

```bash
cd d:\AP\ceo-intelligence-os
npm install            # una vez
npm run etl            # genera la capa de datos desde el vault  (= python etl/parse_vault.py)
npm run dev            # http://localhost:5173
```

Producción / deploy:

```bash
npm run build          # type-check + build estático en /dist
npm run preview        # sirve /dist localmente
```

`vite.config.ts` usa `base: "./"` → el `/dist` funciona en GitHub Pages, en un subpath o abierto como archivo. El ruteo es por hash (`#/command-center`), no requiere servidor.

---

## "Actualiza mi dashboard" (comando operativo permanente)

Cuando llegue información nueva:

1. Codex (o tú) actualiza los 8 `.md` de `00_CEO_Intelligence`.
2. Corre **`npm run etl`** (o `python etl/parse_vault.py`).
   - Escanea y re-normaliza, recalcula scores, **genera deltas vs el baseline anterior**, guarda baseline + historial, regenera reportes y agrega una entrada al log.
3. En la app, click en **↻** (header) o recarga. La vista *Update Log* muestra el corte, conteos y deltas.

> El ETL es idempotente y guarda un baseline cada corrida en `public/data/baselines/` para que los deltas sean reales.

### Apuntar a otra ruta del vault
```bash
AP_VAULT="D:\ruta\al\vault\00_CEO_Intelligence" python etl/parse_vault.py
```

---

## Las 20 vistas

| Grupo | Vistas |
|---|---|
| **Ejecutivo** | CEO Command Center · Executive Business Health · Strategic Intelligence |
| **Operación** | Projects Portfolio · Risks & Blockers · Decisions CEO · Tactical Process Control · Operational Detail |
| **Personas & IA** | People & AI Workforce · AI-Native Transformation |
| **Negocio** | Cash · Sales & Marketing · Delivery · Product · Training & Community · Summit & Events |
| **Datos & Contexto** | Context Pipeline · Data Quality · Evidence Center · Update Log |

Nivel de profundidad por vista (badge en cada una): **core** (premium completo), **datos en vivo** (funcional con data real), **en evolución** (muestra data real filtrada + roadmap del próximo ciclo).

---

## Scores deterministas

Calculados en `etl/parse_vault.py` (0–100), reproducibles:

| Score | Entidad | Fórmula (pesos) |
|---|---|---|
| **Health** | Proyecto | avance_validado .20 · owner .15 · fecha .15 · evidencia .15 · bajo_riesgo .15 · cierre_real .10 · sig_acción .10 |
| **Risk** | Riesgo/Proyecto | impacto .25 · urgencia .25 · falta_evidencia .15 · proximidad .15 · dependencia .10 · contradicción .10 |
| **CEO Attention** | Proyecto | impacto_caja .25 · impacto_cliente .20 · urgencia .20 · riesgo .15 · bloqueo .10 · falta_decisión .10 |
| **WIP / Bottleneck** | Colaborador | proyectos activos · carga · feedback · dependencias |
| **AI-Native** | Persona/Empresa | uso_ia .20 · contexto .20 · trazabilidad .15 · automatización .15 · doc .10 · delegar .10 · mejora .10 |
| **Process** | Proceso | input .15 · output .15 · owner .15 · SLA .10 · trazabilidad .15 · automatización .15 · métrica .15 |
| **Data Quality** | Global | completitud .25 · consistencia .20 · actualidad .20 · evidencia .20 · normalización .15 |

---

## Reportes generados (en `/reports`)

- `briefing_ceo.md` — briefing de 30 segundos + decisiones + riesgos + foco + sobrecarga.
- `feedback_prioridades.md` — lista pura de prioridades por nivel.
- `ai_native_recommendations.md` — madurez AI por persona + backlog de automatización.
- `data_quality_report.md` — score, contradicciones y gaps.
- `automation_backlog.md` — agentes propuestos por prioridad.
- `logs/update_log.md` — historial de cortes.

---

## Estado del primer ciclo (2026-06-28)

**Construido a profundidad premium:** Command Center, Executive Health, People & AI, Projects, Risks, Decisions.
**Datos en vivo:** AI-Native, Tactical (procesos), Context Pipeline, Data Quality, Update Log.
**En evolución (data real filtrada + roadmap):** Strategic, Operational, Evidence, Cash, Sales, Delivery, Product, Training, Summit.

### Datos incompletos detectados (del vault)
Monto/fecha por factura-EDP GEN+ · Sheet vivo de sponsors · internet y URL demo VisionPro · QA App Summit (Anderson) · cifra oficial de ventas Training · matriz alcance Cañete. Reportes individuales pobres: Anderson, Yudely, Ivana, Paolo, Moisés, Alex Anchayhua, Sebastián, Reiner.

### Contradicciones detectadas
Ventas junio AECODE Training: **Talia 118 vs Genesis 131** (marcada en Data Quality y en los riesgos).

---

## Roadmap de próximos ciclos
1. Completar las 9 vistas "en evolución" a profundidad core.
2. Pipeline automático: WhatsApp → Drive → agente extractor → vault → ETL → alertas P0 a Gmail/WhatsApp.
3. Visor de evidencia (abrir fragmento/nota del vault).
4. Edición de clasificación estratégica (core/growth/experimental/kill) persistente.
5. Pase completo de accesibilidad con Playwright (estados reales).

Ver `docs/GUIA-OPERATIVA.md` para el ritual semanal del CEO.
