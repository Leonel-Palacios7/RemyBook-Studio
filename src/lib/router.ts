import { useCallback, useEffect, useState } from 'react';

/** Enrutador mínimo basado en el hash: funciona en hosting estático (GitHub Pages). */
export type RouteName = 'read' | 'edit';
export interface Route {
  name: RouteName;
  page: number;
}

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  const [path = '', query = ''] = clean.split('?');
  const params = new URLSearchParams(query);
  const raw = Number.parseInt(params.get('p') ?? '1', 10);
  const page = Number.isFinite(raw) && raw > 0 ? raw - 1 : 0;
  return { name: path === 'editar' ? 'edit' : 'read', page };
}

export function buildHash(route: Route): string {
  return route.name === 'edit' ? `#/editar?p=${route.page + 1}` : `#/leer?p=${route.page + 1}`;
}

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const navigate = useCallback((next: Route, replace = false) => {
    const hash = buildHash(next);
    if (replace) window.history.replaceState(null, '', hash);
    else window.location.hash = hash;
    setRoute(next);
  }, []);
  return [route, navigate] as const;
}
