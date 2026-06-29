import { useEffect, useState, useCallback } from "react";
import { DEFAULT_VIEW } from "@/nav";

export interface Route { view: string; param: string; }

function parse(): Route {
  const h = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  const [a, b] = h.split("/");
  return { view: a || DEFAULT_VIEW, param: b ? decodeURIComponent(b) : "" };
}

export function useHashRoute(): [Route, (id: string) => void] {
  const [route, setRoute] = useState<Route>(parse());
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const navigate = useCallback((id: string) => {
    window.location.hash = `/${id}`;
    window.scrollTo({ top: 0 });
  }, []);
  return [route, navigate];
}
