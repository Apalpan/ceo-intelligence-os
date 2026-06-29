import { create } from "zustand";
import type { Bundle } from "@/types";
import { loadBundle } from "@/lib/data";

type Theme = "light" | "dark";
type Status = "idle" | "loading" | "ready" | "error";
export type DrawerTarget = { type: "project" | "person" | "risk" | "decision" | "agent"; id: string } | null;

interface AppState {
  theme: Theme;
  toggleTheme: () => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  mobileNavOpen: boolean;
  setMobileNav: (v: boolean) => void;

  workspace: string;
  setWorkspace: (w: string) => void;

  bundle: Bundle | null;
  status: Status;
  error: string | null;
  load: () => Promise<void>;

  companyFilter: string; // "all" | company name
  setCompanyFilter: (c: string) => void;

  functionFilter: string; // "all" | función canónica
  setFunctionFilter: (f: string) => void;

  personFilter: string; // "all" | nombre colaborador
  setPersonFilter: (p: string) => void;

  query: string;
  setQuery: (q: string) => void;

  paletteOpen: boolean;
  setPalette: (v: boolean) => void;

  drawer: DrawerTarget;
  openDrawer: (t: DrawerTarget) => void;
  closeDrawer: () => void;
}

function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.add("theme-transition-stop");
  root.setAttribute("data-theme", t);
  try { localStorage.setItem("ceo-os-theme", t); } catch {}
  window.setTimeout(() => root.classList.remove("theme-transition-stop"), 60);
}

const initialTheme: Theme =
  (typeof document !== "undefined" &&
    (document.documentElement.getAttribute("data-theme") as Theme)) || "light";

export const useStore = create<AppState>((set, get) => ({
  theme: initialTheme,
  toggleTheme: () => {
    const next: Theme = get().theme === "light" ? "dark" : "light";
    applyTheme(next);
    set({ theme: next });
  },

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  mobileNavOpen: false,
  setMobileNav: (v) => set({ mobileNavOpen: v }),

  workspace: "global",
  setWorkspace: (w) => set({ workspace: w }),

  bundle: null,
  status: "idle",
  error: null,
  load: async () => {
    set({ status: "loading", error: null });
    try {
      const b = await loadBundle();
      set({ bundle: b, status: "ready" });
    } catch (e) {
      set({ status: "error", error: (e as Error).message });
    }
  },

  companyFilter: "all",
  setCompanyFilter: (c) => set({ companyFilter: c }),

  functionFilter: "all",
  setFunctionFilter: (f) => set({ functionFilter: f }),

  personFilter: "all",
  setPersonFilter: (p) => set({ personFilter: p }),

  query: "",
  setQuery: (q) => set({ query: q }),

  paletteOpen: false,
  setPalette: (v) => set({ paletteOpen: v }),

  drawer: null,
  openDrawer: (t) => set({ drawer: t }),
  closeDrawer: () => set({ drawer: null }),
}));

/** Apply a company filter to any list with an `empresa` field. */
export function byCompany<T extends { empresa?: string }>(rows: T[], filter: string): T[] {
  if (filter === "all") return rows;
  return rows.filter((r) => r.empresa === filter);
}
