import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, LayoutTemplate, X } from 'lucide-react';
import { PageRenderer } from '@/components/PageRenderer';
import { PAGE_FORMATS } from '@/config/app.config';
import { TEMPLATES, buildTemplateBook } from '@/content/templates/catalog';
import type { Book } from '@/domain/types';
import './templates.css';

interface Props {
  onClose: () => void;
  onApply: (book: Book) => void;
}

/** Galería de plantillas: vista previa de todas las páginas y aplicación con un clic. */
export function TemplatesDialog({ onClose, onApply }: Props) {
  // Las vistas previas se generan una sola vez al abrir la galería.
  const previews = useMemo(() => TEMPLATES.map((def) => ({ def, book: buildTemplateBook(def) })), []);
  const [selected, setSelected] = useState(previews[0]!.def.theme.id);
  const dialogRef = useRef<HTMLDivElement>(null);
  const current = previews.find((p) => p.def.theme.id === selected) ?? previews[0]!;
  const ratio = PAGE_FORMATS[current.book.settings.format].ratio;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>('button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      previousFocus?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="tpl-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} className="tpl-dialog" role="dialog" aria-modal="true" aria-labelledby="tpl-title">
        <header className="tpl-head">
          <span className="tpl-icon" aria-hidden="true">
            <LayoutTemplate size={20} />
          </span>
          <div>
            <h2 id="tpl-title">Plantillas de turismo</h2>
            <p className="muted">10 brochures de 6 páginas, totalmente editables. Reemplaza textos y suelta tus fotos en los marcos.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar plantillas">
            <X size={18} />
          </button>
        </header>

        <div className="tpl-body">
          <ul className="tpl-grid" aria-label="Plantillas disponibles">
            {previews.map(({ def, book }) => {
              const active = def.theme.id === selected;
              return (
                <li key={def.theme.id}>
                  <button
                    type="button"
                    className={`tpl-card${active ? ' is-active' : ''}`}
                    onClick={() => setSelected(def.theme.id)}
                    aria-pressed={active}
                    aria-label={`Ver plantilla ${def.theme.name}`}
                  >
                    <span className="tpl-cover" style={{ aspectRatio: String(ratio) }}>
                      <PageRenderer page={book.pages[0]!} />
                    </span>
                    <span className="tpl-name">{def.theme.name}</span>
                    <span className="tpl-swatches" aria-hidden="true">
                      {[def.theme.palette.primary, def.theme.palette.secondary, def.theme.palette.accent].map((c) => (
                        <i key={c} style={{ background: c }} />
                      ))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <section className="tpl-detail" aria-label={`Vista previa de ${current.def.theme.name}`}>
            <div className="tpl-detail-head">
              <div>
                <h3>{current.def.theme.name}</h3>
                <p className="muted">{current.def.theme.description}</p>
                <div className="tpl-tags">
                  {current.def.theme.tags.map((tag) => (
                    <span key={tag} className="chip">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onApply(buildTemplateBook(current.def))}
              >
                <Check size={18} /> Usar esta plantilla
              </button>
            </div>
            <ol className="tpl-pages">
              {current.book.pages.map((page, i) => (
                <li key={page.id}>
                  <span className="tpl-page" style={{ aspectRatio: String(ratio) }}>
                    <PageRenderer page={page} />
                  </span>
                  <small>
                    {i + 1}. {page.title}
                  </small>
                </li>
              ))}
            </ol>
            <p className="muted small">Al aplicarla se reemplaza la publicación actual. Puedes deshacerlo con Ctrl+Z en el editor.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
