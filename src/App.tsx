import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Topbar } from '@/app/Topbar';
import { Reader } from '@/features/reader/Reader';
import { TemplatesDialog } from '@/features/templates/TemplatesDialog';
import { useToast } from '@/lib/hooks';
import { useHashRoute, type RouteName } from '@/lib/router';
import { useBook } from '@/store/BookProvider';

// El editor se carga bajo demanda: el lector público queda más liviano.
const Editor = lazy(() => import('@/features/editor/Editor'));

const THEME_KEY = 'sena-flipbook-studio:theme';

function initialTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* almacenamiento no disponible */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const { book, saveStatus, dispatch } = useBook();
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [toast, setToast] = useToast(3500);
  const [route, navigate] = useHashRoute();
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* sin persistencia */
    }
  }, [theme]);

  useEffect(() => {
    document.title = `${book.title || 'Publicación'} · SENA Flipbook Studio`;
  }, [book.title]);

  const goTo = useCallback((name: RouteName, page = route.page) => navigate({ name, page }), [navigate, route.page]);
  const setPage = useCallback((page: number) => navigate({ name: route.name, page }, true), [navigate, route.name]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <Topbar
        route={route.name}
        onNavigate={(name) => goTo(name)}
        bookTitle={book.title}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        saveStatus={saveStatus}
      />
      <main id="main" className="app-main">
        {route.name === 'read' ? (
          <Reader
            initialPage={route.page}
            onPageChange={setPage}
            onEdit={(page) => goTo('edit', page)}
            onOpenTemplates={() => setTemplatesOpen(true)}
          />
        ) : (
          <Suspense fallback={<div className="app-loading">Cargando editor…</div>}>
            <Editor
              initialPage={route.page}
              onPageChange={setPage}
              onPreview={(page) => goTo('read', page)}
              onOpenTemplates={() => setTemplatesOpen(true)}
            />
          </Suspense>
        )}
      </main>
      {templatesOpen && (
        <TemplatesDialog
          onClose={() => setTemplatesOpen(false)}
          onApply={(next) => {
            dispatch({ type: 'book/replace', book: next });
            setTemplatesOpen(false);
            navigate({ name: route.name, page: 0 });
            setToast(`Plantilla «${next.title}» aplicada. Ctrl+Z en el editor para deshacer.`);
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
