import { useEffect, useState, useCallback } from "react";
import { DEFAULT_VIEW, NAV_BY_ID } from "@/nav";

function parse(): string {
  const h = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return NAV_BY_ID[h] ? h : DEFAULT_VIEW;
}

export function useHashRoute(): [string, (id: string) => void] {
  const [route, setRoute] = useState<string>(parse());
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
