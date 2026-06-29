import type { Bundle } from "@/types";

const BASE = import.meta.env.BASE_URL || "/";

/** Loads the combined ETL bundle. The ETL writes public/data/ceo_os.json. */
export async function loadBundle(): Promise<Bundle> {
  const url = `${BASE}data/ceo_os.json`;
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`No se pudo cargar ${url} (${res.status}). Corre: npm run etl`);
  return (await res.json()) as Bundle;
}

/** Companies shown as tiles (exclude the AP roll-up; keep declared units). */
export const realCompanies = (b: Bundle) =>
  b.empresas.filter((e) => e.nombre !== "AP");
