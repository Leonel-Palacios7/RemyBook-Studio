import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Book, Page, PageElement } from '@/domain/types';
import { PAGE_FORMATS } from '@/config/app.config';
import { ElementContent } from '@/components/PageRenderer';
import { elementBoxStyle, textStyle } from '@/components/elementStyles';
import { fitPageSize } from '@/engine/layout';
import { useElementSize } from '@/lib/hooks';
import { safeColor, safeImageUrl } from '@/lib/sanitize';
import type { BookAction } from '@/store/bookReducer';
import { applyInteraction, type Handle, type Interaction } from './geometry';

interface Props {
  book: Book;
  page: Page;
  selectedId: string | null;
  editingId: string | null;
  onSelect: (id: string | null) => void;
  onStartEditing: (id: string) => void;
  onStopEditing: () => void;
  onDropImages: (files: File[], at: { x: number; y: number }) => void;
  dispatch: (action: BookAction) => void;
}

const HANDLES: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const KIND_LABEL: Record<PageElement['kind'], string> = { text: 'Texto', image: 'Imagen', shape: 'Forma' };

export function Canvas({ book, page, selectedId, editingId, onSelect, onStartEditing, onStopEditing, onDropImages, dispatch }: Props) {
  const [wrapRef, size] = useElementSize<HTMLDivElement>();
  const pageRef = useRef<HTMLDivElement>(null);
  const action = useRef<Interaction | null>(null);
  const [guides, setGuides] = useState({ v: false, h: false });
  const [dropActive, setDropActive] = useState(false);

  const ratio = PAGE_FORMATS[book.settings.format]?.ratio ?? 0.707;
  const { width, height } = fitPageSize(Math.max(0, size.width - 48), Math.max(0, size.height - 48), ratio, 'single');

  const begin = (e: ReactPointerEvent, el: PageElement, kind: Interaction['kind'], handle?: Handle) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(el.id);
    if (el.locked || editingId === el.id) return;
    const rect = (e.currentTarget.closest('.ed-el') as HTMLElement | null)?.getBoundingClientRect();
    dispatch({ type: 'history/checkpoint' });
    action.current = {
      kind,
      handle,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origin: el,
      pageWidth: width,
      pageHeight: height,
      center: rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: 0, y: 0 },
    };
    pageRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const a = action.current;
    if (!a || a.pointerId !== e.pointerId) return;
    const { patch, snapped } = applyInteraction(a, e.clientX, e.clientY, e.shiftKey);
    setGuides(snapped);
    dispatch({ type: 'element/update', pageId: page.id, elementId: a.origin.id, patch, transient: true });
  };

  const end = (e: ReactPointerEvent) => {
    if (action.current?.pointerId !== e.pointerId) return;
    action.current = null;
    setGuides({ v: false, h: false });
  };

  const bg = safeImageUrl(page.backgroundImage);

  return (
    <div
      className={`canvas-wrap${dropActive ? ' is-drop' : ''}`}
      ref={wrapRef}
      onDragOver={(e) => {
        if (!Array.from(e.dataTransfer.types).includes('Files')) return;
        e.preventDefault();
        setDropActive(true);
      }}
      onDragLeave={() => setDropActive(false)}
      onDrop={(e) => {
        setDropActive(false);
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
        if (!files.length || !pageRef.current) return;
        e.preventDefault();
        const r = pageRef.current.getBoundingClientRect();
        onDropImages(files, { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
    >
      {width > 0 && (
        <div
          ref={pageRef}
          className="canvas-page pr-page"
          style={{
            width,
            height,
            background: safeColor(page.background, '#fff'),
            backgroundImage: bg ? `url("${bg}")` : undefined,
          }}
          onPointerDown={() => {
            onSelect(null);
            onStopEditing();
          }}
          onPointerMove={onPointerMove}
          onPointerUp={end}
          onPointerCancel={end}
          data-testid="canvas-page"
          aria-label={`Lienzo de la página ${page.title || ''}`.trim()}
          role="region"
        >
          {page.elements.map((el) => {
            const isSelected = el.id === selectedId;
            const isEditing = el.id === editingId && el.kind === 'text';
            return (
              <div
                key={el.id}
                className={`ed-el pr-el${isSelected ? ' is-selected' : ''}${el.locked ? ' is-locked' : ''}`}
                style={elementBoxStyle(el)}
                onPointerDown={(e) => begin(e, el, 'move')}
                onDoubleClick={() => el.kind === 'text' && onStartEditing(el.id)}
                data-testid={`element-${el.kind}`}
                aria-label={`${KIND_LABEL[el.kind]}${el.kind === 'text' ? `: ${el.text.slice(0, 40)}` : ''}`}
                aria-selected={isSelected}
                role="option"
                tabIndex={-1}
              >
                {isEditing && el.kind === 'text' ? (
                  <textarea
                    className="pr-text ed-textarea"
                    style={textStyle(el)}
                    value={el.text}
                    autoFocus
                    aria-label="Editar texto"
                    onPointerDown={(e) => e.stopPropagation()}
                    onFocus={() => dispatch({ type: 'history/checkpoint' })}
                    onChange={(e) =>
                      dispatch({ type: 'element/update', pageId: page.id, elementId: el.id, patch: { text: e.target.value }, transient: true })
                    }
                    onBlur={onStopEditing}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.stopPropagation();
                        onStopEditing();
                      }
                    }}
                  />
                ) : (
                  <ElementContent el={el} />
                )}
                {isSelected && !el.locked && !isEditing && (
                  <>
                    {HANDLES.map((h) => (
                      <span key={h} className={`ed-handle h-${h}`} onPointerDown={(e) => begin(e, el, 'resize', h)} aria-hidden="true" />
                    ))}
                    <span className="ed-rotate" onPointerDown={(e) => begin(e, el, 'rotate')} aria-hidden="true" title="Rotar (Mayús = pasos de 15°)" />
                  </>
                )}
              </div>
            );
          })}
          {guides.v && <div className="ed-guide is-v" aria-hidden="true" />}
          {guides.h && <div className="ed-guide is-h" aria-hidden="true" />}
          {page.elements.length === 0 && (
            <div className="canvas-hint" aria-hidden="true">
              Página en blanco
              <small>Usa la barra superior para agregar texto, imágenes o formas, o arrastra imágenes aquí.</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
