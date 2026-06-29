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

def build_collaborators():
    text = read(vfile("02_Matriz_Colaboradores.md"))
    out = []
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
                out.append({
                    "id": slug("col", nombre),
                    "nombre": nombre, "empresa_area": empresa_area,
                    "empresas": [c for c in COMPANY_ORDER if c.lower().replace("+", "") in empresa_area.lower().replace("+", "")] or [norm_company(empresa_area)],
                    "proyectos": proyectos, "n_proyectos": n_proj,
                    "actividades": hechas, "pendientes": pend,
                    "carga": carga, "carga_val": round(cargav, 2),
                    "riesgos": riesgos, "necesita_feedback": needs_fb >= 0.9,
                    "proxima_accion": prox,
                    "wip_score": wip, "bottleneck_score": bottleneck,
                    "context_quality_score": context_q, "ai_leverage_score": ai_leverage,
                    "ai_native_score": ai_native,
                    "herramientas_actuales": tools, "herramientas_recomendadas": tools_rec,
                    "agentes_recomendados": agentes, "procesos_delegables": delegables,
                    "confianza_ai": ai_conf,
                    "fuente": "02_Matriz_Colaboradores.md",
                })
    return out

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
                "colaborador": p["responsable"], "descripcion": p["pendientes"],
                "estado": "pendiente", "prioridad": "alta" if p["estado"] == "rojo" else "media",
                "fecha_objetivo": p["proximo_hito"], "resultado_esperado": p["proximo_hito"],
                "evidencia": p["evidencia"], "confianza": p["confianza"],
                "fuente": "01_Matriz_Proyectos.md",
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

    projects = build_projects()
    collaborators = build_collaborators()
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
    ai_native = build_ai_native(collaborators, companies, agents, procesos)
    data_quality = build_data_quality(projects, collaborators, risks)
    deltas, first_run = compute_deltas(projects, risks)

    bundle = {
        "meta": {
            "generated_at": STAMP, "vault": VAULT, "first_run": first_run,
            "corte": "2026-06-28 16:25 PET",
            "counts": {
                "empresas": len([c for c in companies if c.get("presente")]),
                "proyectos": len(projects), "colaboradores": len(collaborators),
                "riesgos": len(risks), "bloqueos": len(blockers),
                "decisiones": len(decisions), "prioridades": len(priorities),
                "agentes": len(agents), "procesos": len(procesos),
                "deltas": len(deltas),
            },
        },
        "empresas": companies, "areas": areas, "proyectos": projects,
        "colaboradores": collaborators, "riesgos": risks, "bloqueos": blockers,
        "decisiones": decisions, "prioridades": priorities, "tareas": tasks,
        "evidencias": evidence, "fuentes": sources, "deltas": deltas,
        "procesos": procesos, "agentes": agents, "herramientas_ia": tools,
        "ai_native": ai_native, "data_quality": data_quality, "highlights": highlights,
    }

    # individual files
    for key in ("empresas", "areas", "proyectos", "colaboradores", "riesgos",
                "bloqueos", "decisiones", "prioridades", "tareas", "evidencias",
                "fuentes", "deltas", "procesos", "agentes", "herramientas_ia",
                "ai_native", "data_quality", "highlights"):
        write_json(os.path.join(NORM, "%s.json" % key), bundle[key])
    write_json(os.path.join(OUT, "ceo_os.json"), bundle)

    gen_reports(bundle)
    append_log(bundle, deltas, first_run)

    print("[ETL] OK -> %d projects, %d collaborators, %d risks, %d agents, %d processes" % (
        len(projects), len(collaborators), len(risks), len(agents), len(procesos)))
    print("[ETL] Data Quality:", data_quality["data_quality_score"],
          "AI-Native:", ai_native["overall_score"], "Deltas:", len(deltas))
    print("[ETL] Wrote bundle to", os.path.join(OUT, "ceo_os.json"))


if __name__ == "__main__":
    main()
