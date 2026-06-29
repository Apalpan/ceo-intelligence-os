# -*- coding: utf-8 -*-
"""
parse_vault.py — ETL for CEO Intelligence OS.

Reads the normalized CEO Intelligence markdown in the Obsidian vault, extracts
16 entity types, computes 7 deterministic scores, diffs against the previous
baseline (deltas), and emits:
  - public/data/normalized/*.json   (one file per entity, traceable)
  - public/data/ceo_os.json         (combined bundle the app fetches)
  - public/data/baselines/latest.json + history/<ts>.json
  - reports/*.md                    (briefing, feedback, ai-native, data quality, automation)
  - logs/update_log.md              (appended corte)

Anti-hallucination: every entity carries `confianza` and `fuente`. Missing
fields are kept as "No se tiene claro" rather than invented. Run: python etl/parse_vault.py
"""
import os
import re
import io
import json
import hashlib
import datetime as dt

import seeds

# --------------------------------------------------------------------------- #
# Paths
# --------------------------------------------------------------------------- #
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
VAULT = os.environ.get(
    "AP_VAULT",
    r"D:\AP\AP_Knowledge_OS\00_CEO_Intelligence",
)
# Vault root (one level up) to read team/finance/commercial sources outside CEO_Intelligence.
VAULT_ROOT = os.environ.get("AP_VAULT_ROOT", os.path.dirname(VAULT))
PERIODO = os.environ.get("AP_PERIODO", "2026-06")
OUT = os.path.join(ROOT, "public", "data")
NORM = os.path.join(OUT, "normalized")
BASE = os.path.join(OUT, "baselines")
HIST = os.path.join(BASE, "history")
REPORTS = os.path.join(ROOT, "reports")
LOGS = os.path.join(ROOT, "logs")
for d in (NORM, BASE, HIST, REPORTS, LOGS):
    os.makedirs(d, exist_ok=True)

NOW = dt.datetime.now()
STAMP = NOW.strftime("%Y-%m-%d %H:%M")
TS = NOW.strftime("%Y%m%d-%H%M%S")
UNCLEAR = "No se tiene claro"

COMPANY_ORDER = ["GEN+", "AECODE", "VisionPro", "AgentFlow", "THESIA", "SP+", "AP"]
COMPANY_COLOR = {
    "GEN+": "genplus", "AECODE": "aecode", "VisionPro": "visionpro",
    "AgentFlow": "agentflow", "THESIA": "thesia", "SP+": "spplus", "AP": "ap",
}

# --------------------------------------------------------------------------- #
# IO helpers
# --------------------------------------------------------------------------- #
def read(path):
    try:
        with io.open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception:
        return None

def write_json(path, data):
    with io.open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def slug(*parts):
    s = "-".join(str(p) for p in parts).lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "x"

def vfile(name):
    return os.path.join(VAULT, name)

# --------------------------------------------------------------------------- #
# Markdown parsing
# --------------------------------------------------------------------------- #
def parse_sections(text):
    """Return list of (h2_heading, [tables]) where each table is a list of row dicts."""
    if not text:
        return []
    sections, cur, buf = [], "(root)", []
    out = []

    def flush_table(lines, heading):
        rows = [l for l in lines if l.strip().startswith("|")]
        if len(rows) < 2:
            return None
        def cells(r):
            return [c.strip() for c in r.strip().strip("|").split("|")]
        headers = cells(rows[0])
        body = []
        for r in rows[2:]:  # skip header + separator
            c = cells(r)
            if len(c) < len(headers):
                c += [""] * (len(headers) - len(c))
            body.append({headers[i]: c[i] for i in range(len(headers))})
        return body

    lines = text.splitlines()
    i = 0
    pending = {}  # heading -> list of tables
    cur_heading = "(root)"
    table_lines = []
    for line in lines:
        if line.startswith("## "):
            if table_lines:
                t = flush_table(table_lines, cur_heading)
                if t:
                    pending.setdefault(cur_heading, []).append(t)
                table_lines = []
            cur_heading = line[3:].strip()
        elif line.strip().startswith("|"):
            table_lines.append(line)
        else:
            if table_lines:
                t = flush_table(table_lines, cur_heading)
                if t:
                    pending.setdefault(cur_heading, []).append(t)
                table_lines = []
    if table_lines:
        t = flush_table(table_lines, cur_heading)
        if t:
            pending.setdefault(cur_heading, []).append(t)
    return [(h, ts) for h, ts in pending.items()]

def col(row, *cands):
    """Fuzzy column getter by case-insensitive substring of header."""
    keys = list(row.keys())
    for cand in cands:
        cl = cand.lower()
        for k in keys:
            if cl in k.lower():
                v = (row.get(k) or "").strip()
                return v
    return ""

def clean(v):
    v = (v or "").strip()
    if not v or v.lower() in ("-", "n/a", "na", "no", "no se tiene claro", "nan"):
        return UNCLEAR
    return v

def norm_company(s):
    s = (s or "").lower()
    if "gen" in s and "agent" not in s:
        return "GEN+"
    if "aecode" in s:
        return "AECODE"
    if "vision" in s:
        return "VisionPro"
    if "thesia" in s:
        return "THESIA"
    if "agent" in s:
        return "AgentFlow"
    if "sp+" in s or "sp +" in s:
        return "SP+"
    return "AP"

# --------------------------------------------------------------------------- #
# Funciones canónicas (áreas funcionales por empresa) — punto 2.
# Orden = precedencia de clasificación (más específico primero).
# --------------------------------------------------------------------------- #
FUNCIONES = ["Administración", "Contabilidad", "Finanzas", "Comercial", "Marketing",
             "Operaciones / Proyectos", "Automatización", "Talento / Team"]
FUNC_ICON = {
    "Administración": "Building2", "Contabilidad": "Calculator", "Finanzas": "Banknote",
    "Comercial": "Handshake", "Marketing": "Megaphone", "Operaciones / Proyectos": "HardHat",
    "Automatización": "Workflow", "Talento / Team": "Users",
}
_FUNC_KW = [
    ("Contabilidad", ["contab", "tribut", "sunat", "impuesto", "planilla", "factur"]),
    ("Finanzas", ["caja", "cobr", "edp", "finanz", "pago", "presupuesto", "valoriza", "rentab", "margen"]),
    ("Administración", ["admin", "legal", "contrato", "documenta", "gerencia", "coordinacion general", "coordinación general"]),
    ("Automatización", ["automatiz", "agentflow", "agent flow", "flujo", "n8n", "script", "besco", "rpa", "integracion", "integración", "migracion", "migración"]),
    ("Marketing", ["marketing", "growth", "campaña", "campana", "pieza", "ghl", "reto", "tiktok", "congreso", "brochure", "pauta", "ads", "comunidad", "embajador"]),
    ("Comercial", ["comercial", "ventas", "sponsor", "propuesta", "cotiz", "b2b", "b2c", "lead", "pipeline", "cliente", "oportunidad", "deck"]),
    ("Talento / Team", ["talento", "team", "equipo", "rrhh", "cultura", "capacit", "onboarding", "contrata"]),
    ("Operaciones / Proyectos", ["delivery", "bim", "proyecto", "obra", "training", "diplomado", "academ", "producto", "app", "web", "visionpro", "pdk", "esparq", "summit", "dev", "qa", "certificad", "postventa", "startup", "modelo", "plano", "cañete", "canete", "faucett", "dovela", "circle", "ptar", "tingo"]),
]

def classify_funcion(*texts):
    s = " ".join(t for t in texts if t).lower()
    for fn, kws in _FUNC_KW:
        if any(k in s for k in kws):
            return fn
    return "Operaciones / Proyectos"

# Altitud (estratégico/táctico/operativo) y Modo (gestión/ejecución/desarrollo) — punto 3.
def classify_altitud(*texts):
    s = " ".join(t for t in texts if t).lower()
    if any(k in s for k in ["dod", "decision", "decisión", "estrategia", "roadmap", "alcance", "modelo de", "vision", "visión", "postmortem", "checklist", "matriz", "forecast", "presupuesto", "regla", "definir", "priorizar"]):
        return "Estratégico"
    if any(k in s for k in ["tablero", "sprint", "sla", "seguimiento", "coordina", "validar", "revisar", "plan", "agenda", "corte", "owner", "cruce", "control"]):
        return "Táctico"
    return "Operativo"

def classify_modo(*texts):
    s = " ".join(t for t in texts if t).lower()
    if any(k in s for k in ["automatiz", "flujo", "n8n", "script", "agente", "dev", "código", "codigo", "deploy", "backend", "api", "integracion", "integración", "rpa"]):
        return "Desarrollo / Automatización"
    if any(k in s for k in ["tablero", "decision", "decisión", "priorizar", "coordina", "owner", "sla", "estrategia", "definir", "validar cifra", "control", "matriz"]):
        return "Gestión"
    return "Ejecución"

# Sub-unidades AECODE — punto solicitado (Automation y Summit separados).
AECODE_UNITS = ["AECODE Live Training", "AECODE B2B", "AECODE Comunidad",
                "AECODE Automation", "AECODE AI Construction Summit",
                "AECODE Producto / Plataforma", "AECODE Startup"]
_AECODE_KW = [
    ("AECODE AI Construction Summit", ["summit", "congreso", "sponsor", "ponente", "pre congreso"]),
    ("AECODE Automation", ["automation", "automatiz", "agente", "agentflow", "n8n", "flujo"]),
    ("AECODE B2B", ["b2b", "empresa", "corporativo", "in-company", "in company", "utec", "coneic"]),
    ("AECODE Comunidad", ["comunidad", "community", "embajador", "reto", "free"]),
    ("AECODE Startup", ["startup", "kaman", "convocatoria", "demo day", "pitch"]),
    ("AECODE Live Training", ["training", "diplomado", "curso", "academ", "live", "certificad", "postventa", "rubrica", "licencia", "ventas"]),
    ("AECODE Producto / Plataforma", ["producto", "plataforma", "app", "web", "fase", "aula", "aecodito", "algoritmo"]),
]
def classify_aecode_unidad(area, nombre):
    s = (area + " " + nombre).lower()
    for u, kws in _AECODE_KW:
        if any(k in s for k in kws):
            return u
    return "AECODE Live Training"

# --------------------------------------------------------------------------- #
# Costos / RH (Cierre-RH-Pagos-*) — punto: cuánto gana cada uno + costo/aporte.
# --------------------------------------------------------------------------- #
def _money(s):
    if not s:
        return None
    m = re.search(r"S/\.?\s*([\d.,]+)", s)
    if not m:
        return None
    raw = m.group(1).replace(",", "")
    try:
        return float(raw)
    except ValueError:
        return None

def parse_rh_costs():
    """Lee el último Cierre-RH-Pagos-*.md y devuelve {nombre_canon: {...costo}}."""
    folder = os.path.join(VAULT_ROOT, "04_Team GEN+", "Cultura-Operativa")
    out, periodo = {}, None
    if not os.path.isdir(folder):
        return out, periodo
    files = sorted([f for f in os.listdir(folder) if re.match(r"Cierre-RH-Pagos.*\.md$", f, re.I)])
    if not files:
        return out, periodo
    path = os.path.join(folder, files[-1])
    text = read(path) or ""
    fm = re.search(r"periodo:\s*([\d-]+)", text)
    periodo = fm.group(1) if fm else None
    for _, tables in parse_sections(text):
        for table in tables:
            for row in table:
                persona = clean(col(row, "persona"))
                base = _money(col(row, "remuneracion base", "remuneración base", "base"))
                final = _money(col(row, "monto final", "monto"))
                rh_emp = col(row, "rh / empresa", "rh/empresa", "rh")
                desc = clean(col(row, "descripcion", "descripción"))
                if persona == UNCLEAR or base is None and final is None:
                    continue
                por_empresa = {}
                for part in re.split(r"[;]", rh_emp or ""):
                    em = norm_company(part.split(":")[0])
                    amt = _money(part)
                    if amt and em in COMPANY_ORDER:
                        por_empresa[em] = por_empresa.get(em, 0) + amt
                out[persona] = {
                    "persona": persona, "costo_base": base, "costo_final": final or base,
                    "costo_por_empresa": por_empresa, "rol_rh": desc, "fuente": files[-1],
                }
    return out, periodo

def split_people(s):
    """Divide un campo 'responsable' en nombres individuales."""
    if not s or s == UNCLEAR:
        return []
    parts = re.split(r"[/,]|\s+y\s+", s)
    out = []
    for p in parts:
        n = p.strip()
        if n and n.lower() not in ("equipo", "team", "varios", "n/a"):
            out.append(n)
    return out

def match_cost(nombre, costs):
    """Empareja colaborador con su fila RH por nombre o primer token (Inferido)."""
    if nombre in costs:
        return costs[nombre]
    first = nombre.split()[0].lower()
    for k, v in costs.items():
        if k.split()[0].lower() == first:
            return v
    return None

# --------------------------------------------------------------------------- #
# Scoring primitives (deterministic)
# --------------------------------------------------------------------------- #
ESTADO_RISK = {"rojo": 0.85, "amarillo": 0.45, "verde": 0.15}
ESTADO_PROGRESS = {"rojo": 0.35, "amarillo": 0.6, "verde": 0.88}
CONF = {"alta": 1.0, "media": 0.6, "media-alta": 0.75, "baja": 0.3}
CARGA = {"muy alta": 1.0, "alta": 0.8, "media-alta": 0.65, "media": 0.5, "baja": 0.3}
URG = {"p0": 1.0, "p1": 0.7, "p2": 0.45, "p3": 0.25}
PRIO = {"critica": 1.0, "crítica": 1.0, "alta": 0.8, "media": 0.5, "baja": 0.3}

def estado_color(s):
    s = (s or "").lower()
    if "rojo" in s:
        return "rojo"
    if "amaril" in s:
        return "amarillo"
    if "verde" in s:
        return "verde"
    return "amarillo"

def conf_val(s):
    return CONF.get((s or "").strip().lower(), 0.5)

def pct(text):
    if not text:
        return None
    m = re.findall(r"(\d{1,3})\s*%", text)
    if m:
        return max(0, min(100, int(m[0])))
    return None

def has(v):
    return 1.0 if v and v != UNCLEAR else 0.0

def r100(x):
    return int(round(max(0.0, min(1.0, x)) * 100))

def band(score, hi=75, mid=55):
    if score >= hi:
        return "verde"
    if score >= mid:
        return "amarillo"
    return "rojo"

# --------------------------------------------------------------------------- #
# Entity builders
# --------------------------------------------------------------------------- #
def build_projects():
    text = read(vfile("01_Matriz_Proyectos.md"))
    out = []
    for heading, tables in parse_sections(text):
        sect_company = norm_company(heading)
        for table in tables:
            for row in table:
                empresa = norm_company(col(row, "empresa")) if col(row, "empresa") else sect_company
                if empresa == "AP":
                    empresa = sect_company if sect_company != "AP" else "AP"
                nombre = clean(col(row, "proyecto"))
                if nombre == UNCLEAR:
                    continue
                area = clean(col(row, "area", "área"))
                resp = clean(col(row, "responsable"))
                avance_txt = col(row, "avance reportado", "avance")
                estado = clean(col(row, "estado"))
                ec = estado_color(estado)
                conf = clean(col(row, "confianza"))
                cv = conf_val(conf)
                evidencia = clean(col(row, "evidencia"))
                pendientes = clean(col(row, "pendientes"))
                bloqueos = clean(col(row, "bloqueos"))
                riesgos = clean(col(row, "riesgos"))
                hito = clean(col(row, "proximo hito", "próximo hito", "proximo"))
                avance_pct = pct(avance_txt)
                if avance_pct is None:
                    avance_pct = int(ESTADO_PROGRESS[ec] * 100)

                # Health Score
                avance_validado = (avance_pct / 100.0) * (0.6 + 0.4 * cv)
                comp = {
                    "avance_validado": avance_validado,
                    "claridad_owner": has(resp),
                    "claridad_fecha": has(hito),
                    "evidencia": cv if evidencia != UNCLEAR else 0.3,
                    "bajo_riesgo": 1 - ESTADO_RISK[ec],
                    "cierre_real": 0.9 if ec == "verde" else avance_validado * 0.7,
                    "claridad_sig_accion": has(hito) or has(pendientes),
                }
                health = r100(
                    comp["avance_validado"] * 0.20
                    + comp["claridad_owner"] * 0.15
                    + comp["claridad_fecha"] * 0.15
                    + comp["evidencia"] * 0.15
                    + comp["bajo_riesgo"] * 0.15
                    + comp["cierre_real"] * 0.10
                    + comp["claridad_sig_accion"] * 0.10
                )
                risk = r100(
                    ESTADO_RISK[ec] * 0.45
                    + (0.0 if evidencia != UNCLEAR else 0.25)
                    + (0.0 if hito != UNCLEAR else 0.15)
                    + (0.15 if (bloqueos != UNCLEAR) else 0.0)
                )
                # CEO attention: caja/cliente impact heuristic by area keywords
                a = (area + " " + nombre).lower()
                impacto_caja = 1.0 if any(k in a for k in ["caja", "cobr", "sponsor", "ventas", "comercial"]) else 0.5
                impacto_cliente = 1.0 if any(k in a for k in ["delivery", "esparq", "pdk", "summit", "cliente", "cañete", "canete"]) else 0.5
                ceo_attn = r100(
                    impacto_caja * 0.25 + impacto_cliente * 0.20
                    + (ESTADO_RISK[ec]) * 0.20 + (ESTADO_RISK[ec]) * 0.15
                    + (0.1 if bloqueos != UNCLEAR else 0.0)
                    + (0.1 if ec == "rojo" else 0.0)
                )
                out.append({
                    "id": slug("prj", empresa, nombre),
                    "empresa": empresa, "area": area, "nombre": nombre,
                    "funcion": classify_funcion(area, nombre),
                    "unidad": classify_aecode_unidad(area, nombre) if empresa == "AECODE" else empresa,
                    "personas": split_people(resp),
                    "responsable": resp,
                    "avance_reportado": avance_pct,
                    "avance_validado": r100(avance_validado),
                    "estado": ec,
                    "pendientes": pendientes, "bloqueos": bloqueos, "riesgos": riesgos,
                    "proximo_hito": hito, "evidencia": evidencia, "confianza": conf,
                    "health_score": health, "risk_score": risk, "ceo_attention": ceo_attn,
                    "impacto_caja": r100(impacto_caja), "impacto_cliente": r100(impacto_cliente),
                    "fuente": "01_Matriz_Proyectos.md",
                })
    return out

def build_collaborators(projects, costs):
    text = read(vfile("02_Matriz_Colaboradores.md"))
    out = []
    matched_cost_keys = set()
    for heading, tables in parse_sections(text):
        for table in tables:
            for row in table:
                nombre = clean(col(row, "colaborador"))
                if nombre == UNCLEAR or nombre.lower() in ("colaborador",):
                    continue
                empresa_area = clean(col(row, "empresa/area", "empresa", "empresa/área"))
                proyectos = clean(col(row, "proyectos"))
                hechas = clean(col(row, "actividades realizadas", "actividades"))
                pend = clean(col(row, "pendientes"))
                carga = clean(col(row, "carga"))
                riesgos = clean(col(row, "riesgos"))
                feedback = clean(col(row, "feedback"))
                prox = clean(col(row, "proxima accion", "próxima acción", "proxima"))
                cargav = CARGA.get(carga.lower(), 0.5)
                n_proj = len([p for p in re.split(r"[/,]", proyectos) if p.strip()]) if proyectos != UNCLEAR else 1
                needs_fb = 1.0 if feedback.lower().startswith("si") or feedback.lower().startswith("sí") else 0.4

                prof = seeds.AI_PROFILE.get(nombre, None)
                if prof:
                    ai_native = r100(
                        prof["uso_ia"] * 0.20 + prof["contexto"] * 0.20 + prof["traza"] * 0.15
                        + prof["autom"] * 0.15 + prof["doc"] * 0.10 + prof["delega"] * 0.10
                        + prof["mejora"] * 0.10
                    )
                    ai_leverage = r100((prof["uso_ia"] + prof["autom"] + prof["doc"] + prof["delega"] + prof["mejora"]) / 5)
                    context_q = r100(prof["contexto"])
                    tools = prof["tools"]; tools_rec = prof["tools_rec"]
                    agentes = prof["agentes"]; delegables = prof["delegables"]
                    ai_conf = "Inferido"
                else:
                    ai_native = r100(0.35 + 0.1 * cargav)
                    ai_leverage = 40
                    context_q = 45
                    tools = []; tools_rec = ["Claude Code", "Codex"]
                    agentes = []; delegables = []
                    ai_conf = UNCLEAR

                wip = r100(0.45 * min(n_proj / 5.0, 1.0) + 0.40 * cargav + 0.15 * needs_fb)
                bottleneck = r100(
                    0.35 * min(n_proj / 5.0, 1.0) + 0.30 * cargav
                    + 0.20 * needs_fb + 0.15 * (1.0 if "wip" in riesgos.lower() or "sobrecarga" in riesgos.lower() else 0.3)
                )
                # Grafo persona -> proyectos (responsable contiene su nombre, o lo menciona)
                first = nombre.split()[0].lower()
                my_projs = [p for p in projects
                            if any(first == n.split()[0].lower() for n in p["personas"])
                            or nombre.lower() in (proyectos or "").lower()]
                proyecto_ids = [p["id"] for p in my_projs]
                avg_h = int(round(sum(p["health_score"] for p in my_projs) / len(my_projs))) if my_projs else 0
                crit_share = (len([p for p in my_projs if p["estado"] == "rojo"]) / len(my_projs)) if my_projs else 0
                aporte = r100(0.40 * min(len(my_projs) / 5.0, 1.0) + 0.35 * (avg_h / 100.0) + 0.25 * crit_share)
                # Costo (RH)
                c = match_cost(nombre, costs)
                if c:
                    matched_cost_keys.add(c["persona"])
                costo_final = c["costo_final"] if c else UNCLEAR
                costo_base = c["costo_base"] if c else UNCLEAR
                costo_emp = c["costo_por_empresa"] if c else {}
                rol_rh = c["rol_rh"] if c else UNCLEAR
                out.append({
                    "id": slug("col", nombre),
                    "nombre": nombre, "empresa_area": empresa_area,
                    "funcion": classify_funcion(empresa_area, proyectos, hechas),
                    "empresas": [c for c in COMPANY_ORDER if c.lower().replace("+", "") in empresa_area.lower().replace("+", "")] or [norm_company(empresa_area)],
                    "proyectos": proyectos, "n_proyectos": n_proj,
                    "actividades": hechas, "pendientes": pend,
                    "carga": carga, "carga_val": round(cargav, 2),
                    "riesgos": riesgos, "necesita_feedback": needs_fb >= 0.9,
                    "proxima_accion": prox,
                    "wip_score": wip, "bottleneck_score": bottleneck,
                    "context_quality_score": context_q, "ai_leverage_score": ai_leverage,
                    "ai_native_score": ai_native,
                    "proyecto_ids": proyecto_ids, "avg_proj_health": avg_h, "aporte_score": aporte,
                    "costo_final": costo_final, "costo_base": costo_base, "costo_por_empresa": costo_emp,
                    "rol_rh": rol_rh, "costo_aporte": "", "solo_costo": False,
                    "herramientas_actuales": tools, "herramientas_recomendadas": tools_rec,
                    "agentes_recomendados": agentes, "procesos_delegables": delegables,
                    "confianza_ai": ai_conf,
                    "fuente": "02_Matriz_Colaboradores.md",
                })

    # Personas presentes en RH pero no en la matriz de actividad (solo costo).
    for key, c in costs.items():
        if key in matched_cost_keys:
            continue
        empresas = list(c["costo_por_empresa"].keys()) or ["AECODE"]
        out.append({
            "id": slug("col", key), "nombre": key, "empresa_area": " / ".join(empresas),
            "funcion": classify_funcion(c.get("rol_rh", "")), "empresas": empresas,
            "proyectos": UNCLEAR, "n_proyectos": 0, "actividades": c.get("rol_rh", UNCLEAR),
            "pendientes": UNCLEAR, "carga": UNCLEAR, "carga_val": 0.0, "riesgos": UNCLEAR,
            "necesita_feedback": False, "proxima_accion": UNCLEAR,
            "wip_score": 0, "bottleneck_score": 0, "context_quality_score": 0,
            "ai_leverage_score": 0, "ai_native_score": 0,
            "proyecto_ids": [], "avg_proj_health": 0, "aporte_score": 0,
            "costo_final": c["costo_final"], "costo_base": c["costo_base"],
            "costo_por_empresa": c["costo_por_empresa"], "rol_rh": c.get("rol_rh", UNCLEAR),
            "costo_aporte": "", "solo_costo": True,
            "herramientas_actuales": [], "herramientas_recomendadas": [],
            "agentes_recomendados": [], "procesos_delegables": [],
            "confianza_ai": UNCLEAR, "fuente": "Cierre-RH-Pagos",
        })

    # Etiqueta costo/aporte por percentiles (solo quienes tienen costo numérico).
    withcost = [c for c in out if isinstance(c["costo_final"], (int, float))]
    if withcost:
        costs_sorted = sorted(c["costo_final"] for c in withcost)
        apt_sorted = sorted(c["aporte_score"] for c in withcost)
        def pctl(val, arr):
            return sum(1 for x in arr if x <= val) / len(arr)
        for c in withcost:
            cp = pctl(c["costo_final"], costs_sorted)
            ap = pctl(c["aporte_score"], apt_sorted)
            diff = ap - cp
            c["costo_aporte"] = ("Alto valor" if diff >= 0.18 else
                                 "Revisar" if diff <= -0.18 else "Equilibrado")
            c["valor_diff"] = round(diff, 2)
    for c in out:
        c.setdefault("valor_diff", 0)
        if not c["costo_aporte"]:
            c["costo_aporte"] = UNCLEAR
    return out

def build_participaciones(projects, collaborators):
    """Edge list persona <-> proyecto con rol (responsable / colaborador)."""
    edges = []
    name_by_first = {}
    for c in collaborators:
        name_by_first.setdefault(c["nombre"].split()[0].lower(), c["nombre"])
    for p in projects:
        for n in p["personas"]:
            canon = name_by_first.get(n.split()[0].lower(), n)
            edges.append({"persona": canon, "proyecto_id": p["id"], "proyecto": p["nombre"],
                          "empresa": p["empresa"], "unidad": p.get("unidad", p["empresa"]),
                          "rol": "responsable"})
    return edges

def build_risks():
    text = read(vfile("03_Bloqueos_Riesgos.md"))
    out, blocks = [], []
    for heading, tables in parse_sections(text):
        for table in tables:
            for row in table:
                tipo = clean(col(row, "tipo"))
                riesgo = clean(col(row, "riesgo"))
                if riesgo == UNCLEAR:
                    continue
                empresa = norm_company(col(row, "empresa"))
                area = clean(col(row, "area", "área"))
                proyecto = clean(col(row, "proyecto"))
                resp = clean(col(row, "responsable"))
                causa = clean(col(row, "causa"))
                impacto = clean(col(row, "impacto"))
                urg = clean(col(row, "urgencia"))
                accion = clean(col(row, "accion recomendada", "acción", "accion"))
                dueno = clean(col(row, "dueno", "dueño"))
                ul = (urg or "").lower()
                uv = URG.get(ul, 0.5)
                contradiccion = 1.0 if any(k in riesgo.lower() for k in ["inconsist", "contradic", "118", "131"]) else 0.0
                score = r100(
                    (0.9 if ul == "p0" else 0.7 if ul == "p1" else 0.5) * 0.25
                    + uv * 0.25 + 0.4 * 0.15 + uv * 0.15
                    + (0.5 if "/" in resp else 1.0) * 0.10 + contradiccion * 0.10
                )
                sev = "P0" if ul == "p0" else "P1" if ul == "p1" else "P2" if ul == "p2" else clean(urg)
                out.append({
                    "id": slug("risk", empresa, riesgo)[:60],
                    "tipo": tipo, "riesgo": riesgo, "empresa": empresa, "area": area,
                    "proyecto": proyecto, "responsable": resp, "causa": causa,
                    "impacto": impacto, "urgencia": sev, "accion": accion,
                    "dueno_sugerido": dueno, "risk_score": score,
                    "estado": "abierto", "confianza": "Alta",
                    "fuente": "03_Bloqueos_Riesgos.md",
                })
    return out

def build_blockers(projects):
    """Synthesize bloqueos from project 'bloqueos' columns (verified, traceable)."""
    out = []
    for p in projects:
        b = p.get("bloqueos")
        if b and b != UNCLEAR:
            out.append({
                "id": slug("blk", p["empresa"], p["nombre"])[:60],
                "empresa": p["empresa"], "area": p["area"], "proyecto": p["nombre"],
                "descripcion": b, "responsable_bloqueado": p["responsable"],
                "impacto": p.get("riesgos", UNCLEAR),
                "urgencia": "P0" if p["estado"] == "rojo" else "P1",
                "accion_recomendada": p.get("proximo_hito", UNCLEAR),
                "estado": "abierto", "confianza": p["confianza"],
                "fuente": "01_Matriz_Proyectos.md",
            })
    return out

def parse_kv_list(text, section_keys):
    """Parse '## section' blocks with 'N. **Title**' or 'N. Title' items + '- key: value' bullets."""
    if not text:
        return []
    items, cur_section, cur = [], None, None
    for line in text.splitlines():
        h = re.match(r"^##\s+(.*)$", line)
        if h:
            cur_section = h.group(1).strip()
            continue
        it = re.match(r"^\d+\.\s+(.*)$", line)
        if it:
            if cur:
                items.append(cur)
            title = it.group(1).strip()
            title = re.sub(r"^\*\*(.+?)\*\*$", r"\1", title).strip("* ")
            cur = {"titulo": title, "seccion": cur_section or "", "campos": {}}
            continue
        kv = re.match(r"^\s*[-*]\s*([^:]+):\s*(.*)$", line)
        if kv and cur is not None:
            cur["campos"][kv.group(1).strip().lower()] = kv.group(2).strip()
    if cur:
        items.append(cur)
    return items

def build_decisions():
    text = read(vfile("04_Decisiones_CEO.md"))
    out = []
    for i, it in enumerate(parse_kv_list(text, [])):
        f = it["campos"]
        nivel = "urgente" if "urgente" in it["seccion"].lower() else "estrategica"
        out.append({
            "id": slug("dec", it["titulo"])[:60],
            "titulo": it["titulo"], "nivel": nivel,
            "contexto": f.get("contexto", UNCLEAR),
            "opciones": f.get("opciones", UNCLEAR),
            "recomendacion": f.get("recomendacion coo", f.get("recomendacion", UNCLEAR)),
            "riesgo_no_decidir": f.get("riesgo de no decidir", f.get("riesgo", UNCLEAR)),
            "fecha_limite": f.get("fecha limite sugerida", f.get("fecha limite", UNCLEAR)),
            "info_faltante": f.get("informacion faltante", UNCLEAR),
            "estado": "pendiente",
            "urgencia": "P0" if nivel == "urgente" else "P1",
            "confianza": "Alta", "fuente": "04_Decisiones_CEO.md",
        })
    return out

def build_priorities():
    text = read(vfile("05_Prioridades_Semana.md"))
    out = []
    for it in parse_kv_list(text, []):
        f = it["campos"]
        s = it["seccion"].lower()
        nivel = "alta" if "alta" in s else "media" if "media" in s else "baja"
        pregunta = next((v for k, v in f.items() if k.startswith("pregunta")), UNCLEAR)
        out.append({
            "id": slug("pri", it["titulo"])[:60],
            "titulo": it["titulo"], "nivel": nivel,
            "owner": f.get("owner", UNCLEAR),
            "resultado_esperado": f.get("resultado esperado", UNCLEAR),
            "fecha": f.get("fecha", UNCLEAR),
            "pregunta_daily": pregunta,
            "estado": "abierta", "confianza": "Alta",
            "fuente": "05_Prioridades_Semana.md",
        })
    return out

def build_highlights():
    text = read(vfile("06_Key_Highlights_Equipo.md"))
    out = []
    for heading, tables in parse_sections(text):
        for table in tables:
            for row in table:
                nombre = clean(col(row, "colaborador"))
                if nombre == UNCLEAR:
                    continue
                out.append({
                    "id": slug("hl", nombre),
                    "colaborador": nombre,
                    "aprendizaje": clean(col(row, "aprendizaje")),
                    "decision": clean(col(row, "decision", "decisión")),
                    "solucion": clean(col(row, "solucion", "solución")),
                    "valor": clean(col(row, "valor")),
                    "proyecto": clean(col(row, "proyecto")),
                    "fuente": "06_Key_Highlights_Equipo.md",
                })
    return out

def build_tasks(projects, priorities):
    out = []
    for p in priorities:
        out.append({
            "id": slug("task", p["titulo"])[:60],
            "empresa": UNCLEAR, "area": UNCLEAR, "proyecto": p["titulo"],
            "funcion": classify_funcion(p["titulo"], p["resultado_esperado"]),
            "altitud": classify_altitud(p["titulo"], p["resultado_esperado"]),
            "modo": classify_modo(p["titulo"], p["resultado_esperado"]),
            "colaborador": p["owner"], "descripcion": p["resultado_esperado"],
            "estado": "pendiente", "prioridad": p["nivel"],
            "fecha_objetivo": p["fecha"], "resultado_esperado": p["resultado_esperado"],
            "evidencia": UNCLEAR, "confianza": "Alta", "fuente": "05_Prioridades_Semana.md",
        })
    for p in projects:
        if p["pendientes"] != UNCLEAR:
            out.append({
                "id": slug("task", p["empresa"], p["nombre"])[:60],
                "empresa": p["empresa"], "area": p["area"], "proyecto": p["nombre"],
                "funcion": p.get("funcion", classify_funcion(p["area"], p["nombre"])),
                "altitud": classify_altitud(p["nombre"], p["pendientes"]),
                "modo": classify_modo(p["nombre"], p["pendientes"]),
                "colaborador": p["responsable"], "descripcion": p["pendientes"],
                "estado": "pendiente", "prioridad": "alta" if p["estado"] == "rojo" else "media",
                "fecha_objetivo": p["proximo_hito"], "resultado_esperado": p["proximo_hito"],
                "evidencia": p["evidencia"], "confianza": p["confianza"],
                "fuente": "01_Matriz_Proyectos.md",
            })
    return out

def aggregate_functions(projects):
    """Matriz Empresa × Función — punto 2."""
    cells = {}
    for p in projects:
        key = (p["empresa"], p["funcion"])
        c = cells.setdefault(key, {"empresa": p["empresa"], "funcion": p["funcion"],
                                   "n": 0, "health": [], "risk": [], "reds": 0, "proyectos": []})
        c["n"] += 1
        c["health"].append(p["health_score"])
        c["risk"].append(p["risk_score"])
        c["proyectos"].append(p["id"])
        if p["estado"] == "rojo":
            c["reds"] += 1
    out = []
    for (emp, fn), c in cells.items():
        out.append({
            "id": slug("fn", emp, fn), "empresa": emp, "funcion": fn, "icon": FUNC_ICON.get(fn, "Box"),
            "n_proyectos": c["n"], "reds": c["reds"],
            "health_score": int(round(sum(c["health"]) / len(c["health"]))),
            "risk_score": int(round(sum(c["risk"]) / len(c["risk"]))),
            "proyectos": c["proyectos"],
        })
    return out

def build_evidence(projects):
    out = []
    for p in projects:
        if p["evidencia"] != UNCLEAR:
            out.append({
                "id": slug("ev", p["empresa"], p["nombre"])[:60],
                "tipo": "reporte", "fuente": p["evidencia"],
                "relacionado_con": p["nombre"], "empresa": p["empresa"],
                "fecha": "2026-06-28", "confiabilidad": p["confianza"],
            })
    return out

def build_sources():
    text = read(vfile("08_Log_Actualizacion.md")) or ""
    out = []
    capture = False
    for line in text.splitlines():
        if "Archivos fuente revisados" in line:
            capture = True
            continue
        if capture and line.startswith("###"):
            break
        m = re.match(r"^\s*[-*]\s*`?(.+?)`?\s*$", line)
        if capture and m:
            path = m.group(1).strip().strip("`")
            name = os.path.basename(path.replace("\\", "/"))
            out.append({
                "id": slug("src", name)[:60], "tipo": "md", "ruta": path,
                "nombre": name, "procesado": True, "calidad": "Alta",
            })
    return out

# --------------------------------------------------------------------------- #
# Aggregates
# --------------------------------------------------------------------------- #
def aggregate_companies(projects, collaborators, risks, procesos):
    comps = {}
    for c in COMPANY_ORDER:
        comps[c] = {
            "id": slug("emp", c), "nombre": c, "color": COMPANY_COLOR[c],
            "proyectos": [], "health": [], "risk": [], "ai": [], "process": [],
        }
    for p in projects:
        comps.setdefault(p["empresa"], comps["AP"])
        comps[p["empresa"]]["proyectos"].append(p["id"])
        comps[p["empresa"]]["health"].append(p["health_score"])
        comps[p["empresa"]]["risk"].append(p["risk_score"])
    for r in risks:
        if r["empresa"] in comps:
            comps[r["empresa"]]["risk"].append(r["risk_score"])
    for col_ in collaborators:
        for e in col_["empresas"]:
            if e in comps:
                comps[e]["ai"].append(col_["ai_native_score"])
    for pr in procesos:
        if pr["empresa"] in comps:
            comps[pr["empresa"]]["process"].append(pr["process_score"])

    out = []
    for c in COMPANY_ORDER:
        d = comps[c]
        if not d["proyectos"] and not d["ai"] and c not in ("GEN+", "AECODE", "VisionPro", "AgentFlow", "THESIA"):
            continue
        def avg(xs, default=None):
            return int(round(sum(xs) / len(xs))) if xs else default
        health = avg(d["health"])
        risk = avg(d["risk"])
        ai = avg(d["ai"])
        proc = avg(d["process"])
        present = bool(d["proyectos"] or d["ai"])
        estado = "rojo" if (risk or 0) >= 65 or (health is not None and health < 50) else \
                 "amarillo" if (health is None or health < 72 or (risk or 0) >= 45) else "verde"
        out.append({
            "id": d["id"], "nombre": c, "color": d["color"],
            "n_proyectos": len(d["proyectos"]),
            "health_score": health if health is not None else (UNCLEAR if not present else 50),
            "risk_score": risk if risk is not None else UNCLEAR,
            "ai_native_score": ai if ai is not None else UNCLEAR,
            "process_score": proc if proc is not None else UNCLEAR,
            "estado_global": estado if present else UNCLEAR,
            "presente": present,
            "owner": "Alejandro",
        })
    return out

def aggregate_areas(projects):
    areas = {}
    for p in projects:
        key = (p["empresa"], p["area"])
        a = areas.setdefault(key, {"empresa": p["empresa"], "nombre": p["area"],
                                   "health": [], "risk": [], "n": 0})
        a["health"].append(p["health_score"])
        a["risk"].append(p["risk_score"])
        a["n"] += 1
    out = []
    for (emp, name), a in areas.items():
        if name == UNCLEAR:
            continue
        out.append({
            "id": slug("area", emp, name), "empresa": emp, "nombre": name,
            "n_proyectos": a["n"],
            "health_score": int(round(sum(a["health"]) / len(a["health"]))),
            "risk_score": int(round(sum(a["risk"]) / len(a["risk"]))),
            "estado": band(int(round(sum(a["health"]) / len(a["health"])))),
        })
    return out

def build_processes():
    out = []
    for p in seeds.PROCESOS:
        score = r100(
            p["claridad_input"] * 0.15 + p["claridad_output"] * 0.15 + p["owner_claro"] * 0.15
            + p["sla_claro"] * 0.10 + p["trazabilidad"] * 0.15 + p["automatizacion"] * 0.15
            + p["metrica"] * 0.15
        )
        out.append({
            "id": slug("proc", p["empresa"], p["nombre"]),
            "empresa": p["empresa"], "area": p["area"], "nombre": p["nombre"],
            "input": p["input"], "output": p["output"], "owner": p["owner"],
            "sla": p["sla"], "herramientas": p["herramientas"],
            "herramientas_ia": p["herramientas_ia"], "agente_sugerido": p["agente"],
            "estado": p["estado"], "process_score": score,
            "automatizable": p["automatizable"], "prioridad_automatizacion": p["prioridad_auto"],
            "confianza": "Inferido", "fuente": "seeds.py / 05_Mapeo de Procesos",
        })
    return out

def build_agents():
    out = []
    for a in seeds.AGENTS:
        out.append({
            "id": slug("agt", a["empresa"], a["nombre"]),
            "nombre": a["nombre"], "empresa": a["empresa"], "area": a["area"],
            "proposito": a["proposito"], "owner_humano": a["owner_humano"],
            "estado": "propuesto", "impacto_estimado": a["impacto"],
            "dificultad": a["dificultad"], "prioridad": a["prioridad"],
            "prompt_base": a["prompt_base"], "confianza": "Inferido",
            "fuente": "seeds.py (catálogo de agentes)",
        })
    return out

def build_tools():
    return [{
        "id": slug("tool", t["nombre"]), "nombre": t["nombre"], "categoria": t["categoria"],
        "casos_uso": t["casos"], "nivel": t["nivel"], "confianza": "Inferido",
    } for t in seeds.TOOLS]

def build_ai_native(collaborators, companies, agents, procesos):
    by_person = [{
        "colaborador": c["nombre"], "ai_native_score": c["ai_native_score"],
        "ai_leverage_score": c["ai_leverage_score"],
        "herramientas_actuales": c["herramientas_actuales"],
        "herramientas_recomendadas": c["herramientas_recomendadas"],
        "agentes_recomendados": c["agentes_recomendados"],
        "procesos_delegables": c["procesos_delegables"],
        "confianza": c["confianza_ai"],
    } for c in collaborators]

    def classify(s):
        if s == UNCLEAR:
            return UNCLEAR
        return ("AI-native avanzado" if s >= 90 else "AI-first funcional" if s >= 75
                else "IA asistida" if s >= 60 else "uso superficial" if s >= 40
                else "operación manual vulnerable")

    scored = [c["ai_native_score"] for c in collaborators if isinstance(c["ai_native_score"], int)]
    overall = int(round(sum(scored) / len(scored))) if scored else UNCLEAR
    by_company = []
    for comp in companies:
        if comp["ai_native_score"] != UNCLEAR:
            by_company.append({"empresa": comp["nombre"], "ai_native_score": comp["ai_native_score"],
                               "clasificacion": classify(comp["ai_native_score"])})
    autom_backlog = sorted(
        [p for p in procesos if p["automatizable"]],
        key=lambda p: (p["prioridad_automatizacion"], -p["process_score"]))
    return {
        "overall_score": overall, "clasificacion": classify(overall),
        "por_persona": by_person, "por_empresa": by_company,
        "agentes_propuestos": len(agents),
        "procesos_automatizables": len([p for p in procesos if p["automatizable"]]),
        "backlog_automatizacion": [
            {"proceso": p["nombre"], "empresa": p["empresa"], "prioridad": p["prioridad_automatizacion"],
             "process_score": p["process_score"], "agente": p["agente_sugerido"]}
            for p in autom_backlog],
    }

def build_data_quality(projects, collaborators, risks):
    total_fields, filled = 0, 0
    for p in projects:
        for k in ("responsable", "proximo_hito", "evidencia", "pendientes"):
            total_fields += 1
            if p.get(k) and p[k] != UNCLEAR:
                filled += 1
    completitud = filled / total_fields if total_fields else 0
    contradictions = len([r for r in risks if "inconsist" in r["riesgo"].lower() or "contradic" in r["riesgo"].lower()])
    consistencia = max(0.0, 1 - contradictions / max(len(risks), 1))
    with_ev = len([p for p in projects if p["evidencia"] != UNCLEAR])
    evidencia = with_ev / max(len(projects), 1)
    # actualidad: vs corte date
    actualidad = 0.9
    normalizacion = 0.85
    dq = r100(completitud * 0.25 + consistencia * 0.20 + actualidad * 0.20
              + evidencia * 0.20 + normalizacion * 0.15)
    gaps = []
    for p in projects:
        miss = [k for k in ("responsable", "proximo_hito", "evidencia") if p.get(k) == UNCLEAR]
        if miss:
            gaps.append({"entidad": p["nombre"], "empresa": p["empresa"], "faltante": miss})
    return {
        "data_quality_score": dq,
        "completitud": r100(completitud), "consistencia": r100(consistencia),
        "actualidad": r100(actualidad), "evidencia": r100(evidencia),
        "normalizacion": r100(normalizacion),
        "contradicciones": contradictions, "gaps": gaps,
        "contradicciones_detalle": [r["riesgo"] for r in risks
                                    if "inconsist" in r["riesgo"].lower()],
    }

# --------------------------------------------------------------------------- #
# Deltas vs baseline
# --------------------------------------------------------------------------- #
def compute_deltas(projects, risks):
    prev = None
    latest = os.path.join(BASE, "latest.json")
    if os.path.exists(latest):
        try:
            with io.open(latest, "r", encoding="utf-8") as f:
                prev = json.load(f)
        except Exception:
            prev = None
    deltas = []
    cur_proj = {p["id"]: p["health_score"] for p in projects}
    cur_risk = {r["id"]: r["risk_score"] for r in risks}
    if prev:
        pp = prev.get("projects", {})
        for pid, h in cur_proj.items():
            if pid not in pp:
                deltas.append({"entidad": "proyecto", "id": pid, "tipo": "nuevo",
                               "antes": None, "despues": h})
            elif pp[pid] != h:
                deltas.append({"entidad": "proyecto", "id": pid, "tipo": "cambio",
                               "antes": pp[pid], "despues": h})
        for pid in pp:
            if pid not in cur_proj:
                deltas.append({"entidad": "proyecto", "id": pid, "tipo": "cerrado",
                               "antes": pp[pid], "despues": None})
    snapshot = {"generated_at": STAMP, "projects": cur_proj, "risks": cur_risk}
    write_json(latest, snapshot)
    write_json(os.path.join(HIST, "baseline-%s.json" % TS), snapshot)
    first_run = prev is None
    return deltas, first_run

# --------------------------------------------------------------------------- #
# Reports
# --------------------------------------------------------------------------- #
def gen_reports(bundle):
    P = bundle["proyectos"]; R = bundle["riesgos"]; D = bundle["decisiones"]
    PR = bundle["prioridades"]; C = bundle["colaboradores"]; AN = bundle["ai_native"]
    DQ = bundle["data_quality"]; AG = bundle["agentes"]

    top_dec = sorted(D, key=lambda d: 0 if d["urgencia"] == "P0" else 1)[:10]
    top_risk = sorted(R, key=lambda r: -r["risk_score"])[:10]
    top_proj = sorted(P, key=lambda p: -p["ceo_attention"])[:10]
    overloaded = sorted([c for c in C if c["wip_score"] >= 70], key=lambda c: -c["wip_score"])

    # Briefing
    b = ["# Briefing CEO — %s\n" % STAMP,
         "## Estado de 30 segundos\n"]
    for e in bundle["empresas"]:
        if e.get("presente"):
            b.append("- **%s** — salud %s · riesgo %s · AI-native %s · estado %s" % (
                e["nombre"], e["health_score"], e["risk_score"], e["ai_native_score"],
                str(e["estado_global"]).upper()))
    b.append("\n## Decidir hoy (Top decisiones)\n")
    for d in top_dec:
        b.append("- [%s] **%s** — %s (límite: %s)" % (
            d["urgencia"], d["titulo"], d["recomendacion"][:120], d["fecha_limite"]))
    b.append("\n## Riesgos P0/P1\n")
    for r in top_risk:
        b.append("- [%s] %s · %s — %s" % (r["urgencia"], r["empresa"], r["riesgo"][:90], r["accion"][:90]))
    b.append("\n## Foco de atención CEO (proyectos)\n")
    for p in top_proj:
        b.append("- %s · %s — atención %s · salud %s · estado %s" % (
            p["empresa"], p["nombre"], p["ceo_attention"], p["health_score"], p["estado"].upper()))
    b.append("\n## Colaboradores sobrecargados (WIP)\n")
    for c in overloaded:
        b.append("- %s — WIP %s · carga %s · %s" % (c["nombre"], c["wip_score"], c["carga"], c["proxima_accion"][:80]))
    with io.open(os.path.join(REPORTS, "briefing_ceo.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(b) + "\n")

    # Feedback y prioridades (formato pedido)
    COLOR = {"GEN+": "🔵", "AECODE": "🟣", "VisionPro": "🟪", "AgentFlow": "🟦", "THESIA": "🟡", "SP+": "⬜", "AP": "⚫"}
    fb = ["# 🤖 Feedback y Prioridades — %s\n" % STAMP]
    for nivel in ("alta", "media", "baja"):
        ps = [p for p in PR if p["nivel"] == nivel]
        if not ps:
            continue
        fb.append("## Prioridad %s\n" % nivel)
        for p in ps:
            fb.append("✅ %s **%s**" % (COLOR.get("AECODE", "✅"), p["titulo"]))
            fb.append("• %s — owner: %s · fecha: %s" % (p["resultado_esperado"][:140], p["owner"], p["fecha"]))
        fb.append("")
    with io.open(os.path.join(REPORTS, "feedback_prioridades.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(fb) + "\n")

    # AI-native recommendations
    an = ["# Recomendaciones AI-Native — %s\n" % STAMP,
          "AI-Native Score global: **%s** (%s)\n" % (AN["overall_score"], AN["clasificacion"]),
          "## Por colaborador\n"]
    for p in sorted(AN["por_persona"], key=lambda x: x["ai_native_score"] if isinstance(x["ai_native_score"], int) else 0):
        an.append("- **%s** — AI-native %s · agentes: %s" % (
            p["colaborador"], p["ai_native_score"], ", ".join(p["agentes_recomendados"]) or "—"))
    an.append("\n## Backlog de automatización\n")
    for x in AN["backlog_automatizacion"]:
        an.append("- [%s] %s (%s) → %s · proceso score %s" % (
            x["prioridad"], x["proceso"], x["empresa"], x["agente"], x["process_score"]))
    with io.open(os.path.join(REPORTS, "ai_native_recommendations.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(an) + "\n")

    # Data quality
    dq = ["# Reporte de Calidad de Datos — %s\n" % STAMP,
          "Data Quality Score: **%s**\n" % DQ["data_quality_score"],
          "- Completitud: %s · Consistencia: %s · Actualidad: %s · Evidencia: %s · Normalización: %s" % (
              DQ["completitud"], DQ["consistencia"], DQ["actualidad"], DQ["evidencia"], DQ["normalizacion"]),
          "- Contradicciones: %s\n" % DQ["contradicciones"], "## Gaps (información faltante)\n"]
    for g in DQ["gaps"]:
        dq.append("- %s (%s): falta %s" % (g["entidad"], g["empresa"], ", ".join(g["faltante"])))
    with io.open(os.path.join(REPORTS, "data_quality_report.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(dq) + "\n")

    # Automation backlog
    ab = ["# Backlog de Automatización — %s\n" % STAMP, "## Agentes propuestos (por prioridad)\n"]
    for a in sorted(AG, key=lambda a: (a["prioridad"], -a["impacto_estimado"])):
        ab.append("- [%s] **%s** (%s · %s) — %s · owner: %s" % (
            a["prioridad"], a["nombre"], a["empresa"], a["area"], a["proposito"], a["owner_humano"]))
    with io.open(os.path.join(REPORTS, "automation_backlog.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(ab) + "\n")

def _safe(name):
    return re.sub(r"[^\w\-]+", "-", name.replace("+", "plus")).strip("-")[:60] or "x"

def _fm(clase, empresa="AP"):
    return ("---\ntipo: dashboard-auto\nestado: operativo\nowner: Alejandro Palpan\n"
            "empresa: %s\norigen: ceo-intelligence-os\nclase: %s\nfecha: %s\nultima_actualizacion: %s\n"
            "---\n\n> Generado automaticamente por CEO Intelligence OS (npm run etl). "
            "Fuente de verdad: los 8 archivos de 00_CEO_Intelligence (Codex). No editar a mano.\n\n"
            % (empresa, clase, STAMP, STAMP))

EMP_KPI_SLOTS = {
    "GEN+": ["Entregables validados", "Alcance contratado vs real", "Adicionales detectados",
             "EDP / facturas pendientes", "Horas en riesgo", "Estado de cobro"],
    "AECODE": ["Leads", "Ventas completas", "Primeras cuotas", "Pendiente de cobro", "Conversion por canal",
               "Skills verificadas con evidencia", "Evidence Upload Rate", "Certificados emitidos", "Reclamos"],
    "VisionPro": ["Demo estable", "Camaras activas", "Eventos detectados", "Precision IA",
                  "Conectividad", "Usuarios creados", "Alertas utiles vs ruido", "Oferta piloto"],
    "THESIA": ["Tesis activas", "Propuestas", "Validacion de mercado", "Fechas comprometidas"],
    "AgentFlow": ["Flujos activos", "Ejecuciones exitosas", "Fallos", "Tiempo ahorrado",
                  "Acciones humanas requeridas", "Logs auditables", "Fallback definido"],
}


def _dash(title, diag, metrics, projects, risks, people, decisions, acciones, fuente, confianza, empresa):
    L = [_fm("dashboard", empresa), "# %s" % title, "",
         "**Diagnostico ejecutivo:** %s" % diag, "",
         "## Metricas principales", "", "| Metrica | Valor |", "|---|---|"]
    for k, v in metrics:
        L.append("| %s | %s |" % (k, v))
    L += ["", "## Estado actual / avances verificados", "",
          "| Proyecto | Owner | Estado | Salud | Avance | Proximo hito | Confianza |",
          "|---|---|---|---:|---:|---|---|"]
    for p in sorted(projects, key=lambda p: -p["ceo_attention"]):
        L.append("| [[%s]] | %s | %s | %s | %s%% | %s | %s |" % (
            p["nombre"], p["responsable"], p["estado"].upper(), p["health_score"],
            p["avance_validado"], p["proximo_hito"], p["confianza"]))
    if not projects:
        L.append("| _No se tiene claro_ |  |  |  |  |  |  |")
    L += ["", "## Bloqueos"]
    blk = [p for p in projects if p["bloqueos"] != UNCLEAR]
    L += ["- **%s** — %s" % (p["nombre"], p["bloqueos"]) for p in blk] or ["- No se tiene claro"]
    L += ["", "## Riesgos"]
    rk = sorted(risks, key=lambda r: -r["risk_score"])[:8]
    L += ["- [%s] %s — accion: %s (dueno: %s)" % (r["urgencia"], r["riesgo"], r["accion"], r["dueno_sugerido"]) for r in rk] or ["- No se tiene claro"]
    L += ["", "## Decisiones requeridas"]
    L += ["- [%s] %s — recomendacion COO: %s (limite %s)" % (d["urgencia"], d["titulo"], d["recomendacion"], d["fecha_limite"]) for d in decisions[:6]] or ["- No se tiene claro"]
    L += ["", "## Acciones recomendadas (antes del proximo corte)"]
    L += ["- %s" % a for a in acciones[:6]] or ["- No se tiene claro"]
    L += ["", "## Owners / equipo"]
    L += ["- [[%s]] — %s (aporte %s)" % (c["nombre"], c.get("funcion", "-"), c["aporte_score"]) for c in sorted(people, key=lambda c: -c["aporte_score"])[:12]] or ["- No se tiene claro"]
    L += ["", "---", "_Fuente: %s · Confianza: %s · Ultima actualizacion: %s_" % (fuente, confianza, STAMP)]
    return L


def emit_obsidian(bundle):
    """Fase 1 (Plan Maestro): emite la capa Markdown operativa por capas en el vault.
    No sobrescribe los 8 archivos base de Codex (fuente de verdad)."""
    base = VAULT  # 00_CEO_Intelligence
    P, R, D, C = bundle["proyectos"], bundle["riesgos"], bundle["decisiones"], bundle["colaboradores"]
    PR, EMP, FN, cont = bundle["prioridades"], bundle["empresas"], bundle["funciones"], bundle["costos"]
    EMPRESAS = [e for e in EMP if e.get("presente") and e["nombre"] != "AP"]
    soles = lambda v: "S/ " + format(v, ",.0f")

    # limpiar carpetas numeradas auto-generadas de corridas previas (solo si son nuestras)
    for old in ["01_Empresas", "02_Areas", "03_Proyectos", "04_Team", "05_Riesgos", "06_Decisiones", "07_Logs"]:
        dd = os.path.join(base, old)
        if os.path.isdir(dd):
            try:
                fs = [f for f in os.listdir(dd) if f.endswith(".md")]
                if fs and all("Generado automaticamente" in (read(os.path.join(dd, f)) or "") for f in fs):
                    for f in os.listdir(dd):
                        os.remove(os.path.join(dd, f))
                    os.rmdir(dd)
            except Exception:
                pass

    def ensure(*parts):
        pth = os.path.join(base, *parts)
        os.makedirs(pth, exist_ok=True)
        return pth

    def w(path, lines):
        with io.open(path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")

    GLOBAL = ensure("00_Global"); EMPDIR = ensure("Empresas"); AREADIR = ensure("Areas")
    AECDIR = ensure("Empresas", "AECODE"); GENDIR = ensure("Empresas", "GEN+")
    PRJDIR = ensure("Proyectos"); TEAMDIR = ensure("Team"); LOGDIR = ensure("_Log")

    def decisions_for(keys):
        ks = [k.lower() for k in keys]
        return [d for d in D if any(k in (d["titulo"] + " " + d["contexto"] + " " + d["recomendacion"]).lower() for k in ks)]

    def acciones_for(keys):
        ks = [k.lower() for k in keys]
        out = []
        for p in PR:
            if any(k in (p["titulo"] + " " + p["resultado_esperado"] + " " + p["owner"]).lower() for k in ks):
                out.append("%s — owner %s · %s" % (p["resultado_esperado"], p["owner"], p["fecha"]))
        return out

    def people_for(emp=None, funcs=None):
        res = []
        for c in C:
            if emp and not (emp in c.get("empresas", []) or emp in (c.get("costo_por_empresa") or {})):
                continue
            if funcs and c.get("funcion") not in funcs:
                continue
            res.append(c)
        return res

    # ---- Dashboard Global CEO (X) ----
    g = [_fm("global"), "# Dashboard Global CEO · X", "",
         "Periodo: **%s** · Corte: %s" % (bundle["meta"]["periodo"], bundle["meta"]["corte"]), "",
         "> El archivo fuente `00_Dashboard_CEO.md` (Codex) NO se sobrescribe; este es el global derivado.", "",
         "## Resumen ejecutivo · semaforo por empresa", "",
         "| Empresa | Estado | Salud | Riesgo | AI-Native | Proyectos |", "|---|---|---:|---:|---:|---:|"]
    for e in EMPRESAS:
        g.append("| [[%s_Dashboard\\|%s]] | %s | %s | %s | %s | %s |" % (
            _safe(e["nombre"]), e["nombre"], str(e["estado_global"]).upper(),
            e["health_score"], e["risk_score"], e["ai_native_score"], e["n_proyectos"]))
    g += ["", "## Top riesgos P0/P1"]
    g += ["- [%s] %s · %s — %s" % (r["urgencia"], r["empresa"], r["riesgo"], r["accion"]) for r in sorted(R, key=lambda r: -r["risk_score"])[:10]]
    g += ["", "## Decisiones pendientes de Alejandro"]
    g += ["- [%s] %s — %s (limite %s)" % (d["urgencia"], d["titulo"], d["recomendacion"], d["fecha_limite"]) for d in sorted(D, key=lambda d: 0 if d["urgencia"] == "P0" else 1)[:10]]
    g += ["", "## Proyectos criticos"]
    g += ["- %s · %s — atencion %s · salud %s · %s" % (p["empresa"], p["nombre"], p["ceo_attention"], p["health_score"], p["estado"].upper()) for p in sorted(P, key=lambda p: -p["ceo_attention"])[:10]]
    g += ["", "## Prioridades de la semana / acciones antes del proximo corte"]
    g += ["- (%s) %s — owner %s · %s" % (p["nivel"], p["titulo"], p["owner"], p["fecha"]) for p in PR]
    g += ["", "## Semaforo por funcion (empresa x funcion)", "", "| Empresa | Funcion | Proyectos | Rojos | Salud |", "|---|---|---:|---:|---:|"]
    for f in sorted(FN, key=lambda x: (x["empresa"], x["funcion"])):
        g.append("| %s | %s | %s | %s | %s |" % (f["empresa"], f["funcion"], f["n_proyectos"], f["reds"], f["health_score"]))
    g += ["", "---", "_Generado: %s · Planilla total %s: %s_" % (STAMP, cont["periodo"], soles(cont["planilla_total"]))]
    w(os.path.join(GLOBAL, "Dashboard-Global-CEO.md"), g)

    # ---- Dashboards por empresa ----
    for e in EMPRESAS:
        emp = e["nombre"]
        eps = [p for p in P if p["empresa"] == emp]
        ers = [r for r in R if r["empresa"] == emp]
        epp = people_for(emp)
        planilla = cont["planilla_por_empresa"].get(emp)
        diag = "Estado %s. %d proyectos (%d en rojo), %d riesgos (%d P0). Salud media %s, AI-Native %s." % (
            str(e["estado_global"]).upper(), len(eps), len([p for p in eps if p["estado"] == "rojo"]),
            len(ers), len([r for r in ers if r["urgencia"] == "P0"]), e["health_score"], e["ai_native_score"])
        metrics = [("Salud", e["health_score"]), ("Riesgo", e["risk_score"]), ("AI-Native", e["ai_native_score"]),
                   ("Proyectos", len(eps)), ("En rojo", len([p for p in eps if p["estado"] == "rojo"]))]
        if planilla is not None:
            metrics.append(("Planilla %s" % cont["periodo"], soles(planilla)))
            metrics.append(("Personas", len(epp)))
        if emp == "AECODE":
            metrics.append(("Norte: Skills verificadas / usuario activo mensual", "No se tiene claro"))
        for k in EMP_KPI_SLOTS.get(emp, []):
            metrics.append((k, "No se tiene claro"))
        dec = decisions_for([emp.replace("+", ""), emp])
        acc = acciones_for([emp.replace("+", ""), emp]) or [p["proximo_hito"] for p in eps if p["proximo_hito"] != UNCLEAR][:5]
        w(os.path.join(EMPDIR, "%s_Dashboard.md" % _safe(emp)),
          _dash("%s · Dashboard" % emp, diag, metrics, eps, ers, epp, dec, acc, "01_Matriz_Proyectos.md + Cierre-RH-Pagos", "Alta", emp))

    # ---- AECODE granular ----
    AEC = [p for p in P if p["empresa"] == "AECODE"]
    aec_specs = [
        ("Ventas", lambda p: p["funcion"] == "Comercial", ["ventas", "comercial", "cobro", "cuota", "lead"],
         ["Leads", "Ventas completas", "Primeras cuotas", "Pendiente de cobro", "Conversion por canal", "Ejecutivo comercial", "Bloqueos de material"]),
        ("Marketing", lambda p: p["funcion"] == "Marketing", ["marketing", "campana", "ghl", "pieza", "reto"],
         ["Pieza", "Canal", "Lead", "Venta atribuida"]),
        ("Training", lambda p: p["unidad"] == "AECODE Live Training", ["training", "diplomado", "certificad", "licencia", "rubrica"],
         ["Certificados emitidos", "Licencias", "Reclamos"]),
        ("Summit", lambda p: p["unidad"] == "AECODE AI Construction Summit", ["summit", "sponsor", "congreso"],
         ["Sponsors cerrados", "Pago/beneficio cruzado", "Agenda"]),
        ("Producto-Digital", lambda p: p["unidad"] == "AECODE Producto / Plataforma", ["producto", "app", "web", "fase", "aula"],
         ["Diseno listo", "Implementacion", "QA", "Deploy", "Adopcion"]),
        ("Comunidad-Growth", lambda p: p["unidad"] == "AECODE Comunidad", ["comunidad", "reto", "embajador"],
         ["Miembros activos", "Engagement"]),
        ("Sponsors-Partners", lambda p: "sponsor" in (p["nombre"] + p["area"]).lower(), ["sponsor", "partner"],
         ["Sponsors", "Monto", "Beneficios entregados"]),
    ]
    for name, filt, keys, slots in aec_specs:
        sp = [p for p in AEC if filt(p)]
        sr = [r for r in R if r["empresa"] == "AECODE" and any(k in (r["riesgo"] + r["area"] + r["proyecto"]).lower() for k in keys)]
        metrics = [("Proyectos", len(sp)), ("En rojo", len([p for p in sp if p["estado"] == "rojo"]))] + [(s, "No se tiene claro") for s in slots]
        w(os.path.join(AECDIR, "%s.md" % name),
          _dash("AECODE · %s" % name.replace("-", " "), "Unidad AECODE %s: %d frentes." % (name, len(sp)),
                metrics, sp, sr, people_for("AECODE"), decisions_for(keys), acciones_for(keys),
                "01_Matriz_Proyectos.md", "Media", "AECODE"))

    # ---- GEN+ granular ----
    GEN = [p for p in P if p["empresa"] == "GEN+"]
    gen_specs = [
        ("Proyectos", lambda p: True, ["proyecto", "delivery", "bim", "modelo"],
         ["Proyectos activos", "Entregables validados", "Proximas valorizaciones"]),
        ("Comercial-B2B", lambda p: p["funcion"] == "Comercial", ["comercial", "propuesta", "cotiz", "cliente", "b2b", "tdr"],
         ["Pipeline", "Propuestas", "Cierres"]),
        ("Administracion-Caja", lambda p: p["funcion"] in ("Finanzas", "Contabilidad", "Administración"), ["caja", "cobr", "factura", "edp", "admin"],
         ["EDP / facturas pendientes", "Estado de cobro", "Adicionales detectados"]),
        ("Delivery-BIM-VDC", lambda p: ("delivery" in p["area"].lower() or "bim" in (p["area"] + p["nombre"]).lower()), ["bim", "delivery", "canete", "faucett", "dovela", "ptar", "circle", "tingo", "vdc"],
         ["Entregables validados", "Alcance contratado vs real", "Horas en riesgo", "Adicionales"]),
        ("Automatizaciones", lambda p: p["funcion"] == "Automatización", ["automatiz", "agente", "besco", "flujo"],
         ["Flujos activos", "Tiempo ahorrado"]),
        ("Propuestas-Cotizaciones", lambda p: "esparq" in p["nombre"].lower() or p["funcion"] == "Comercial", ["propuesta", "cotiz", "esparq", "tdr"],
         ["Cotizaciones abiertas", "Monto pipeline"]),
    ]
    for name, filt, keys, slots in gen_specs:
        sp = [p for p in GEN if filt(p)]
        sr = [r for r in R if r["empresa"] == "GEN+" and any(k in (r["riesgo"] + r["area"] + r["proyecto"]).lower() for k in keys)]
        metrics = [("Proyectos", len(sp)), ("En rojo", len([p for p in sp if p["estado"] == "rojo"]))] + [(s, "No se tiene claro") for s in slots]
        w(os.path.join(GENDIR, "%s.md" % name),
          _dash("GEN+ · %s" % name.replace("-", " "), "Area GEN+ %s: %d frentes." % (name, len(sp)),
                metrics, sp, sr, people_for("GEN+"), decisions_for(keys), acciones_for(keys),
                "01_Matriz_Proyectos.md", "Media", "GEN+"))
    w(os.path.join(GENDIR, "Team-GEN.md"),
      _dash("GEN+ · Team", "Equipo GEN+.", [("Personas", len(people_for("GEN+")))], [], [], people_for("GEN+"), [], [], "02_Matriz_Colaboradores.md + RH", "Alta", "GEN+"))

    # ---- Dashboards por area (transversal) ----
    area_specs = [
        ("Administracion_Finanzas", ["Finanzas", "Contabilidad", "Administración"], None),
        ("Comercial", ["Comercial"], None),
        ("Proyectos_Delivery", ["Operaciones / Proyectos"], None),
        ("Marketing", ["Marketing"], None),
        ("Producto_Digital", None, ["producto", "app", "web", "visionpro", "pdk", "fase", "aula"]),
        ("Automation_AI_Ops", ["Automatización"], None),
    ]
    for name, funcs, kw in area_specs:
        if funcs:
            sp = [p for p in P if p["funcion"] in funcs]
        else:
            sp = [p for p in P if any(k in (p["nombre"] + p["area"]).lower() for k in kw)]
        sr = [r for r in R if r["proyecto"] in [p["nombre"] for p in sp] or any((p["nombre"] in (r["proyecto"] or "")) for p in sp)]
        ppl = people_for(funcs=funcs) if funcs else []
        diag = "%d proyectos · %d en rojo · %d riesgos." % (len(sp), len([p for p in sp if p["estado"] == "rojo"]), len(sr))
        metrics = [("Proyectos", len(sp)), ("En rojo", len([p for p in sp if p["estado"] == "rojo"])), ("Riesgos", len(sr))]
        w(os.path.join(AREADIR, "%s.md" % name),
          _dash("Area · %s" % name.replace("_", " / "), diag, metrics, sp, sr, ppl,
                decisions_for([name.split("_")[0]]), acciones_for([name.split("_")[0]]), "Multi-fuente", "Media", "AP"))
    # area Team / Riesgos / Decisiones
    w(os.path.join(AREADIR, "Team.md"),
      _dash("Area · Team / Colaboradores", "%d personas (%d con feedback CEO)." % (len(C), len([c for c in C if c.get("necesita_feedback")])),
            [("Personas", len(C)), ("Planilla %s" % cont["periodo"], soles(cont["planilla_total"]))], [], [], C, [], [], "02_Matriz_Colaboradores.md", "Alta", "AP"))
    rs = [_fm("riesgos"), "# Area · Riesgos & Bloqueos", "", "| Urg | Empresa | Riesgo | Accion | Dueno | Score |", "|---|---|---|---|---|---:|"]
    rs += ["| %s | %s | %s | %s | %s | %s |" % (r["urgencia"], r["empresa"], r["riesgo"], r["accion"], r["dueno_sugerido"], r["risk_score"]) for r in sorted(R, key=lambda r: -r["risk_score"])]
    w(os.path.join(AREADIR, "Riesgos.md"), rs)
    ds = [_fm("decisiones"), "# Area · Decisiones CEO", ""]
    for d in D:
        ds += ["## [%s] %s" % (d["urgencia"], d["titulo"]), "- Contexto: %s" % d["contexto"],
               "- Recomendacion COO: %s" % d["recomendacion"], "- Riesgo de no decidir: %s" % d["riesgo_no_decidir"],
               "- Fecha limite: %s" % d["fecha_limite"], "- Info faltante: %s" % d["info_faltante"], ""]
    w(os.path.join(AREADIR, "Decisiones.md"), ds)

    # ---- Fichas por proyecto (contrato) ----
    for p in P:
        s = [_fm("proyecto", p["empresa"]), "# %s" % p["nombre"], "",
             "%s · %s · %s · Owner: %s" % (p["empresa"], p.get("unidad", p["empresa"]), p["area"], p["responsable"]),
             "Estado **%s** · Salud %s · Riesgo %s · Atencion CEO %s · Confianza %s" % (
                 p["estado"].upper(), p["health_score"], p["risk_score"], p["ceo_attention"], p["confianza"]),
             "", "## Contrato de datos",
             "- Avance interno: %s%%" % p["avance_validado"],
             "- Entregable enviado: No se tiene claro",
             "- Validacion externa (cliente): No se tiene claro",
             "- Estado de cobro / EDP: Requiere validacion",
             "- Alcance contratado vs real: No se tiene claro",
             "- Adicionales detectados: No se tiene claro",
             "", "## Operativo",
             "- Proximo hito: %s" % p["proximo_hito"], "- Pendientes: %s" % p["pendientes"],
             "- Bloqueos: %s" % p["bloqueos"], "- Riesgos: %s" % p["riesgos"],
             "- Personas: %s" % ", ".join("[[%s]]" % n for n in p["personas"]),
             "- Evidencia: %s" % p["evidencia"], "- Fuente: %s · Confianza: %s" % (p["fuente"], p["confianza"])]
        w(os.path.join(PRJDIR, "%s.md" % _safe(p["nombre"])), s)

    # ---- Team (indice + fichas) ----
    idx = [_fm("team"), "# Team · Indice", "",
           "| Persona | Funcion | Empresas | Aporte | WIP | AI | Costo | Costo/Aporte |", "|---|---|---|---:|---:|---:|---:|---|"]
    for c in sorted(C, key=lambda c: -c["aporte_score"]):
        costo = soles(c["costo_final"]) if isinstance(c["costo_final"], (int, float)) else "-"
        idx.append("| [[%s]] | %s | %s | %s | %s | %s | %s | %s |" % (
            c["nombre"], c.get("funcion", "-"), ", ".join(c.get("empresas", [])), c["aporte_score"],
            c["wip_score"], c["ai_native_score"], costo, c.get("costo_aporte", "-")))
    w(os.path.join(TEAMDIR, "00_Team-Indice.md"), idx)
    for c in C:
        myp = [p for p in P if p["id"] in c.get("proyecto_ids", [])]
        s = [_fm("colaborador"), "# %s" % c["nombre"], "",
             "%s · Funcion: %s" % (c["empresa_area"], c.get("funcion", "-")),
             "Aporte %s · WIP %s · AI-Native %s · Carga %s" % (c["aporte_score"], c["wip_score"], c["ai_native_score"], c["carga"])]
        if isinstance(c["costo_final"], (int, float)):
            s.append("Costo %s: %s · Costo/Aporte: %s" % (cont["periodo"], soles(c["costo_final"]), c.get("costo_aporte", "-")))
        s += ["", "## Proyectos"] + (["- [[%s]] (%s) — %s" % (p["nombre"], p["empresa"], p["estado"].upper()) for p in myp] or ["- No se tiene claro"])
        s += ["", "## Foco", "- Proxima accion: %s" % c["proxima_accion"], "- Pendientes: %s" % c["pendientes"],
              "- Agentes sugeridos: %s" % ", ".join(c.get("agentes_recomendados", []) or ["-"])]
        w(os.path.join(TEAMDIR, "%s.md" % _safe(c["nombre"])), s)

    # ---- Log ----
    lg = [_fm("log"), "# Estado ETL / Log de actualizacion", "",
          "Generado: %s · Periodo: %s · Costos: %s" % (STAMP, bundle["meta"]["periodo"], cont["periodo"]), "",
          "## Conteos"] + ["- %s: %s" % (k, v) for k, v in bundle["meta"]["counts"].items()] + \
         ["", "## Deltas: %d" % len(bundle["deltas"]),
          "", "## Fuentes revisadas"] + ["- %s" % f["nombre"] for f in bundle["fuentes"][:30]]
    w(os.path.join(LOGDIR, "Estado-ETL.md"), lg)

    n = 1 + len(EMPRESAS) + len(aec_specs) + len(gen_specs) + 1 + len(area_specs) + 3 + len(P) + len(C) + 2
    print("[ETL] Obsidian: %d dashboards .md emitidos (00_Global, Empresas, Areas, Proyectos, Team, _Log)" % n)

def append_log(bundle, deltas, first_run):
    lines = ["", "## %s" % STAMP, "",
             "- Corrida ETL parse_vault.py (%s)." % ("baseline inicial" if first_run else "delta"),
             "- Entidades: %d proyectos, %d colaboradores, %d riesgos, %d decisiones, %d prioridades, %d agentes, %d procesos." % (
                 len(bundle["proyectos"]), len(bundle["colaboradores"]), len(bundle["riesgos"]),
                 len(bundle["decisiones"]), len(bundle["prioridades"]), len(bundle["agentes"]), len(bundle["procesos"])),
             "- Data Quality Score: %s · AI-Native Score: %s." % (
                 bundle["data_quality"]["data_quality_score"], bundle["ai_native"]["overall_score"]),
             "- Deltas detectados: %d." % len(deltas)]
    path = os.path.join(LOGS, "update_log.md")
    header = "" if os.path.exists(path) else "# Log de actualización — CEO Intelligence OS\n"
    with io.open(path, "a", encoding="utf-8") as f:
        if header:
            f.write(header)
        f.write("\n".join(lines) + "\n")

# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #
def main():
    print("[ETL] Vault:", VAULT)
    if not os.path.isdir(VAULT):
        print("[ETL] WARNING: vault path not found. Outputs will be empty.")

    rh_costs, rh_periodo = parse_rh_costs()
    print("[ETL] RH costos:", len(rh_costs), "personas · periodo", rh_periodo)
    projects = build_projects()
    collaborators = build_collaborators(projects, rh_costs)
    participaciones = build_participaciones(projects, collaborators)
    risks = build_risks()
    blockers = build_blockers(projects)
    decisions = build_decisions()
    priorities = build_priorities()
    highlights = build_highlights()
    tasks = build_tasks(projects, priorities)
    evidence = build_evidence(projects)
    sources = build_sources()
    procesos = build_processes()
    agents = build_agents()
    tools = build_tools()
    companies = aggregate_companies(projects, collaborators, risks, procesos)
    areas = aggregate_areas(projects)
    funciones = aggregate_functions(projects)
    # Resumen de costos / planilla (solo para Team + Finanzas).
    planilla_emp = {}
    for c in collaborators:
        for emp, amt in (c.get("costo_por_empresa") or {}).items():
            planilla_emp[emp] = round(planilla_emp.get(emp, 0) + amt, 2)
    costos = {
        "periodo": rh_periodo or "2026-05",
        "planilla_por_empresa": planilla_emp,
        "planilla_total": round(sum(planilla_emp.values()), 2),
        "n_personas_costo": len([c for c in collaborators if isinstance(c["costo_final"], (int, float))]),
        "moneda": "PEN",
        "fuente": "Cierre-RH-Pagos (04_Team GEN+)",
    }
    ai_native = build_ai_native(collaborators, companies, agents, procesos)
    data_quality = build_data_quality(projects, collaborators, risks)
    deltas, first_run = compute_deltas(projects, risks)

    bundle = {
        "meta": {
            "generated_at": STAMP, "vault": VAULT, "first_run": first_run,
            "corte": "2026-06-28 16:25 PET",
            "periodo": PERIODO, "periodo_costos": costos["periodo"],
            "counts": {
                "empresas": len([c for c in companies if c.get("presente")]),
                "proyectos": len(projects), "colaboradores": len(collaborators),
                "riesgos": len(risks), "bloqueos": len(blockers),
                "decisiones": len(decisions), "prioridades": len(priorities),
                "agentes": len(agents), "procesos": len(procesos),
                "deltas": len(deltas),
            },
        },
        "empresas": companies, "areas": areas, "funciones": funciones, "proyectos": projects,
        "colaboradores": collaborators, "riesgos": risks, "bloqueos": blockers,
        "decisiones": decisions, "prioridades": priorities, "tareas": tasks,
        "evidencias": evidence, "fuentes": sources, "deltas": deltas,
        "procesos": procesos, "agentes": agents, "herramientas_ia": tools,
        "ai_native": ai_native, "data_quality": data_quality, "highlights": highlights,
        "participaciones": participaciones, "costos": costos,
    }

    # individual files
    for key in ("empresas", "areas", "funciones", "proyectos", "colaboradores", "riesgos",
                "bloqueos", "decisiones", "prioridades", "tareas", "evidencias",
                "fuentes", "deltas", "procesos", "agentes", "herramientas_ia",
                "ai_native", "data_quality", "highlights", "participaciones", "costos"):
        write_json(os.path.join(NORM, "%s.json" % key), bundle[key])
    write_json(os.path.join(OUT, "ceo_os.json"), bundle)

    gen_reports(bundle)
    append_log(bundle, deltas, first_run)
    if os.environ.get("AP_EMIT_OBSIDIAN", "1") != "0":
        try:
            emit_obsidian(bundle)
        except Exception as e:
            print("[ETL] Obsidian emit skipped:", e)

    print("[ETL] OK -> %d projects, %d collaborators, %d risks, %d agents, %d processes" % (
        len(projects), len(collaborators), len(risks), len(agents), len(procesos)))
    print("[ETL] Data Quality:", data_quality["data_quality_score"],
          "AI-Native:", ai_native["overall_score"], "Deltas:", len(deltas))
    print("[ETL] Wrote bundle to", os.path.join(OUT, "ceo_os.json"))


if __name__ == "__main__":
    main()
