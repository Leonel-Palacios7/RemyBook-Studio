import { useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import type { Book } from '@/domain/types';
import { PAGE_FORMATS } from '@/config/app.config';
import { PageRenderer } from '@/components/PageRenderer';
import { searchBook, tableOfContents } from './search';

export type PanelKind = 'thumbs' | 'toc' | 'search';

const TITLES: Record<PanelKind, string> = { thumbs: 'Miniaturas', toc: 'Índice', search: 'Buscar' };

interface Props {
  kind: PanelKind;
  book: Book;
  currentPages: number[];
  query: string;
  onQueryChange: (q: string) => void;
  onSelectPage: (page: number) => void;
  onClose: () => void;
}

export function SidePanel({ kind, book, currentPages, query, onQueryChange, onSelectPage, onClose }: Props) {
  const searchRef = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => (kind === 'search' ? searchBook(book, query) : []), [book, kind, query]);
  const toc = useMemo(() => tableOfContents(book), [book]);
  const ratio = PAGE_FORMATS[book.settings.format]?.ratio ?? 0.707;

  useEffect(() => {
    if (kind === 'search') searchRef.current?.focus();
  }, [kind]);

  return (
    <aside className="side-panel" aria-label={TITLES[kind]}>
      <header className="side-panel-head">
        <h2>{TITLES[kind]}</h2>
        <button type="button" className="icon-btn sm ghost" onClick={onClose} aria-label="Cerrar panel">
          <X size={18} />
        </button>
      </header>

      {kind === 'thumbs' && (
        <ol className="thumbs" aria-label="Páginas">
          {book.pages.map((page, i) => (
            <li key={page.id}>
              <button
                type="button"
                className={`thumb${currentPages.includes(i) ? ' is-current' : ''}`}
                onClick={() => onSelectPage(i)}
                aria-label={`Ir a la página ${i + 1}${page.title ? `: ${page.title}` : ''}`}
                aria-current={currentPages.includes(i) ? 'page' : undefined}
              >
                <span className="thumb-paper" style={{ aspectRatio: String(ratio) }}>
                  <PageRenderer page={page} />
                </span>
                <span className="thumb-label">{i + 1}</span>
              </button>
            </li>
          ))}
        </ol>
      )}

      {kind === 'toc' && (
        <div className="toc">
          {toc.length === 0 ? (
            <p className="muted panel-empty">
              El índice se genera con los títulos de página. Asigna un título a cada página desde el editor.
            </p>
          ) : (
            <ol>
              {toc.map((entry) => (
                <li key={entry.pageIndex}>
                  <button
                    type="button"
                    className={currentPages.includes(entry.pageIndex) ? 'is-current' : ''}
                    onClick={() => onSelectPage(entry.pageIndex)}
                  >
                    <span>{entry.title}</span>
                    <span className="toc-page">{entry.pageIndex + 1}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {kind === 'search' && (
        <div className="search">
          <label className="sr-only" htmlFor="reader-search">
            Buscar en la publicación
          </label>
          <input
            ref={searchRef}
            id="reader-search"
            className="input"
            type="search"
            placeholder="Buscar texto…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          <p className="muted search-count" aria-live="polite">
            {query.trim().length < 2
              ? 'Escribe al menos 2 caracteres.'
              : `${hits.length} ${hits.length === 1 ? 'resultado' : 'resultados'}`}
          </p>
          <ul className="search-results">
            {hits.map((hit, i) => (
              <li key={`${hit.pageIndex}-${i}`}>
                <button type="button" onClick={() => onSelectPage(hit.pageIndex)}>
                  <span className="search-page">Página {hit.pageIndex + 1}</span>
                  <span className="search-snippet">
                    {hit.snippet.slice(0, hit.matchStart)}
                    <mark>{hit.snippet.slice(hit.matchStart, hit.matchStart + hit.matchLength)}</mark>
                    {hit.snippet.slice(hit.matchStart + hit.matchLength)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
