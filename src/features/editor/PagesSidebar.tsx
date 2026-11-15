import { useState } from 'react';
import { ArrowDown, ArrowUp, Copy, GripVertical, Plus, Trash2 } from 'lucide-react';
import type { Book } from '@/domain/types';
import { PAGE_FORMATS } from '@/config/app.config';
import { PageRenderer } from '@/components/PageRenderer';
import { createPage } from '@/content/factories';
import type { BookAction } from '@/store/bookReducer';

interface Props {
  book: Book;
  currentPageId: string;
  onSelect: (pageId: string) => void;
  dispatch: (action: BookAction) => void;
}

export function PagesSidebar({ book, currentPageId, onSelect, dispatch }: Props) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const ratio = PAGE_FORMATS[book.settings.format]?.ratio ?? 0.707;
  const currentIndex = book.pages.findIndex((p) => p.id === currentPageId);

  const addPage = () => {
    const page = createPage();
    dispatch({ type: 'page/add', index: currentIndex + 1, page });
    onSelect(page.id);
  };

  return (
    <aside className="pages-sidebar" aria-label="Páginas">
      <header className="pages-head">
        <h2>Páginas</h2>
        <span className="pages-count">{book.pages.length}</span>
      </header>
      <ol className="pages-list">
        {book.pages.map((page, i) => {
          const active = page.id === currentPageId;
          return (
            <li
              key={page.id}
              className={`page-item${active ? ' is-active' : ''}${dragOver === i ? ' is-drop' : ''}`}
              draggable
              onDragStart={(e) => {
                setDragFrom(i);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(i));
              }}
              onDragOver={(e) => {
                if (dragFrom === null) return;
                e.preventDefault();
                setDragOver(i);
              }}
              onDragLeave={() => setDragOver((v) => (v === i ? null : v))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragFrom !== null && dragFrom !== i) dispatch({ type: 'page/move', from: dragFrom, to: i });
                setDragFrom(null);
                setDragOver(null);
              }}
              onDragEnd={() => {
                setDragFrom(null);
                setDragOver(null);
              }}
            >
              <button
                type="button"
                className="page-select"
                onClick={() => onSelect(page.id)}
                aria-current={active ? 'page' : undefined}
                aria-label={`Editar página ${i + 1}${page.title ? `: ${page.title}` : ''}`}
              >
                <GripVertical size={14} className="page-grip" aria-hidden="true" />
                <span className="page-mini" style={{ aspectRatio: String(ratio) }}>
                  <PageRenderer page={page} />
                </span>
                <span className="page-meta">
                  <strong>Página {i + 1}</strong>
                  <small>{page.title || `${page.elements.length} elemento${page.elements.length === 1 ? '' : 's'}`}</small>
                </span>
              </button>
              <div className="page-actions">
                <button type="button" className="icon-btn on-dark sm" disabled={i === 0} onClick={() => dispatch({ type: 'page/move', from: i, to: i - 1 })} aria-label={`Subir página ${i + 1}`} title="Subir">
                  <ArrowUp size={14} />
                </button>
                <button type="button" className="icon-btn on-dark sm" disabled={i === book.pages.length - 1} onClick={() => dispatch({ type: 'page/move', from: i, to: i + 1 })} aria-label={`Bajar página ${i + 1}`} title="Bajar">
                  <ArrowDown size={14} />
                </button>
                <button type="button" className="icon-btn on-dark sm" onClick={() => dispatch({ type: 'page/duplicate', pageId: page.id })} aria-label={`Duplicar página ${i + 1}`} title="Duplicar">
                  <Copy size={14} />
                </button>
                <button type="button" className="icon-btn on-dark sm" disabled={book.pages.length <= 1} onClick={() => dispatch({ type: 'page/remove', pageId: page.id })} aria-label={`Eliminar página ${i + 1}`} title="Eliminar">
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="pages-foot">
        <button type="button" className="btn btn-primary btn-block" onClick={addPage}>
          <Plus size={18} /> Agregar página
        </button>
      </div>
    </aside>
  );
}
