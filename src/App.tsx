import { useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useStore } from "@/store";
import { useHashRoute } from "@/lib/useHashRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Drawer } from "@/components/Drawer";
import { VIEWS } from "@/views";
import { DEFAULT_VIEW, WS_BY_ID, workspaceOf } from "@/nav";

export default function App() {
  const { status, error, load, workspace, setWorkspace } = useStore();
  const [route, navigate] = useHashRoute();

  useEffect(() => { load(); }, [load]);

  // Keep the active workspace in sync with the current section.
  useEffect(() => {
    if (WS_BY_ID[route]) setWorkspace(route);
    else if (!WS_BY_ID[workspace]?.sections.includes(route)) setWorkspace(workspaceOf(route));
  }, [route]); // eslint-disable-line react-hooks/exhaustive-deps

  const View = VIEWS[route] ?? VIEWS[DEFAULT_VIEW];

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-fg">
      <Sidebar route={route} navigate={navigate} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header route={route} />

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
            {status === "ready" && (
              <div key={route} className="animate-fade-in">
                <View navigate={navigate} />
              </div>
            )}
          </div>
        </main>
      </div>

      <CommandPalette navigate={navigate} />
      <Drawer />
    </div>
  );
}
