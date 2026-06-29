import { useMemo, useState, type ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cx } from "@/lib/format";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortValue?: (row: T) => number | string;
  align?: "left" | "right" | "center";
  className?: string;
  width?: string;
}

export function DataTable<T>({ columns, rows, getKey, onRowClick, initialSort, dense }:
  {
    columns: Column<T>[]; rows: T[]; getKey: (r: T) => string;
    onRowClick?: (r: T) => void; initialSort?: { key: string; dir: "asc" | "desc" }; dense?: boolean;
  }) {
  const [sort, setSort] = useState(initialSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const colDef = columns.find((c) => c.key === sort.key);
    if (!colDef?.sortValue) return rows;
    const sv = colDef.sortValue;
    const r = [...rows].sort((a, b) => {
      const va = sv(a), vb = sv(b);
      if (typeof va === "number" && typeof vb === "number") return va - vb;
      return String(va).localeCompare(String(vb), "es");
    });
    return sort.dir === "desc" ? r.reverse() : r;
  }, [rows, sort, columns]);

  const toggle = (key: string) =>
    setSort((s) => s?.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" });

  return (
    <div className="overflow-x-auto scrollbar-thin -mx-1 px-1">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width }}
                className={cx("text-[11px] font-semibold uppercase tracking-wide text-muted px-3 py-2 select-none",
                  c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left")}>
                {c.sortValue ? (
                  <button onClick={() => toggle(c.key)}
                    className={cx("inline-flex items-center gap-1 hover:text-fg-2 transition-colors",
                      c.align === "right" && "flex-row-reverse")}>
                    {c.header}
                    {sort?.key === c.key ? (sort.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
                      : <ChevronsUpDown size={12} className="opacity-40" />}
                  </button>
                ) : c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={getKey(row)} onClick={() => onRowClick?.(row)}
              className={cx("border-b border-[var(--border)] last:border-0 transition-colors",
                onRowClick && "cursor-pointer hover:bg-surface-2")}>
              {columns.map((c) => (
                <td key={c.key}
                  className={cx(dense ? "px-3 py-1.5" : "px-3 py-2.5", "align-top",
                    c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left",
                    c.className)}>
                  {c.render ? c.render(row) : (row as Record<string, ReactNode>)[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && <div className="text-center text-xs text-muted py-8">Sin resultados con los filtros actuales.</div>}
    </div>
  );
}
