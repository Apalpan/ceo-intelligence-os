import type { ReactNode } from "react";
import { NAV_BY_ID } from "@/nav";
import { DepthTag } from "@/components/ui";

export interface ViewProps { navigate: (id: string) => void; }

export function ViewHeader({ id, right }: { id: string; right?: ReactNode }) {
  const n = NAV_BY_ID[id];
  if (!n) return null;
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-display">{n.label}</h1>
          <DepthTag depth={n.depth} />
        </div>
        <p className="text-sm text-muted mt-1 max-w-2xl">{n.desc}</p>
      </div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </div>
  );
}

export function Grid({ children, cols = "auto", className = "" }:
  { children: ReactNode; cols?: "auto" | 2 | 3 | 4; className?: string }) {
  const map = {
    auto: "grid-cols-[repeat(auto-fill,minmax(240px,1fr))]",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  } as const;
  return <div className={`grid gap-3 ${map[cols]} ${className}`}>{children}</div>;
}
