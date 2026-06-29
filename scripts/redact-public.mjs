// Build-time redaction for the PUBLIC (Vercel) deploy.
// Removes salaries / payroll / cost data so nothing sensitive ships to a public URL.
// Runs in the build environment only — the repo's committed data stays intact.
import { readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";

const F = "public/data/ceo_os.json";
const R = "Restringido";

try {
  const b = JSON.parse(readFileSync(F, "utf8"));

  for (const c of b.colaboradores || []) {
    c.costo_final = R;
    c.costo_base = R;
    c.costo_por_empresa = {};
    c.rol_rh = R;
    c.costo_aporte = R;
    c.valor_diff = 0;
  }
  if (b.costos) {
    b.costos = { ...b.costos, planilla_por_empresa: {}, planilla_total: 0, n_personas_costo: 0, restringido: true };
  }
  b.meta = { ...(b.meta || {}), publico: true };

  writeFileSync(F, JSON.stringify(b));

  // The app only fetches ceo_os.json — drop the per-entity dumps + baselines so
  // costos.json / colaboradores.json never reach the public URL.
  for (const d of ["public/data/normalized", "public/data/baselines"]) {
    if (existsSync(d)) rmSync(d, { recursive: true, force: true });
  }
  console.log("[redact] Public build: salaries/payroll removed, raw dumps dropped.");
} catch (e) {
  console.error("[redact] failed:", e.message);
  process.exit(1);
}
