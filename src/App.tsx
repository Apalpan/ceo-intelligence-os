import { useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useStore } from "@/store";
import { useHashRoute } from "@/lib/useHashRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Drawer } from "@/components/Drawer";
import { VIEWS } from "@/views";
import CompanyDashboard from "@/views/CompanyDashboard";
import ProjectFicha from "@/views/ProjectFicha";
import { DEFAULT_VIEW, WS_BY_ID, workspaceOf } from "@/nav";

const COMPANIES = ["GEN+", "AECODE", "VisionPro", "THESIA", "AgentFlow"];

export default function App() {
  const { status, error, load, workspace, setWorkspace, companyFilter, bundle } = useStore();
  const [route, navigate] = useHashRoute();

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (route.view === "co" || route.view === "ficha") return;
    if (WS_BY_ID[route.view]) setWorkspace(route.view);
    else if (!WS_BY_ID[workspace]?.sections.includes(route.view)) setWorkspace(workspaceOf(route.view));
  }, [route.view]); // eslint-disable-line react-hooks/exhaustive-deps

  // active company drives the accent (data-company)
  let activeCompany = "GEN+";
  if (route.view === "co" && COMPANIES.includes(route.param)) activeCompany = route.param;
  else if (route.view === "ficha" && bundle) activeCompany = bundle.proyectos.find((p) => p.id === route.param)?.empresa || "GEN+";
  else if (companyFilter !== "all" && companyFilter !== "AP") activeCompany = companyFilter;

  let content: React.ReactNode = null;
  if (route.view === "co") content = <CompanyDashboard empresa={route.param} navigate={navigate} />;
  else if (route.view === "ficha") content = <ProjectFicha id={route.param} navigate={navigate} />;
  else { const V = VIEWS[route.view] ?? VIEWS[DEFAULT_VIEW]; content = <V navigate={navigate} />; }

  return (
    <div data-company={activeCompany} className="flex h-screen overflow-hidden bg-bg text-fg">
      <Sidebar route={route.view} param={route.param} navigate={navigate} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header route={route.view} />

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-[1320px] px-3 sm:px-5 py-5">
            {status === "loading" && (
              <div className="grid place-items-center py-32 text-muted">
                <Loader2 className="animate-spin mb-3" size={28} />
                <p className="text-sm">Cargando inteligencia del vault…</p>
              </div>
            )}
            {status === "error" && (
              <div className="max-w-lg mx-auto card p-6 text-center mt-16">
                <AlertTriangle className="mx-auto mb-3 text-[var(--amber)]" size={28} />
                <h2 className="text-base font-semibold mb-1">No se pudo cargar la data</h2>
                <p className="text-sm text-muted mb-3">{error}</p>
                <p className="text-xs text-muted">Genera la capa de datos con <code className="font-mono bg-surface-2 px-1.5 py-0.5 rounded">npm run etl</code> y vuelve a intentar.</p>
              </div>
            )}
            {status === "ready" && <div key={route.view + route.param} className="animate-fade-in">{content}</div>}
          </div>
        </main>
      </div>

      <CommandPalette navigate={navigate} />
      <Drawer navigate={navigate} />
    </div>
  );
}
