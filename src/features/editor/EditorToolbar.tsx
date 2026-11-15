import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Circle,
  Eye,
  Image as ImageIcon,
  Minus,
  Printer,
  Redo2,
  Shapes,
  Square,
  Star,
  Triangle,
  Type,
  Undo2,
} from 'lucide-react';
import { createShape, createText } from '@/content/factories';
import type { PageElement, ShapeType } from '@/domain/types';
import { SENA_PALETTE } from '@/config/app.config';
import type { BookAction } from '@/store/bookReducer';

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  dispatch: (action: BookAction) => void;
  onAdd: (el: PageElement) => void;
  onAddImages: (files: FileList) => void;
  onPreview: () => void;
  pageNumber: number;
  pageCount: number;
}

const SHAPES: { type: ShapeType; label: string; Icon: typeof Square }[] = [
  { type: 'rect', label: 'Rectángulo', Icon: Square },
  { type: 'ellipse', label: 'Elipse', Icon: Circle },
  { type: 'triangle', label: 'Triángulo', Icon: Triangle },
  { type: 'star', label: 'Estrella', Icon: Star },
  { type: 'arrow', label: 'Flecha', Icon: ArrowRight },
  { type: 'line', label: 'Línea', Icon: Minus },
];

const TEXT_PRESETS = [
  { label: 'Título', patch: { text: 'Título', fontSize: 9, fontWeight: 800, h: 14, color: SENA_PALETTE.greenDark } },
  { label: 'Subtítulo', patch: { text: 'Subtítulo', fontSize: 5.5, fontWeight: 600, h: 9 } },
  { label: 'Párrafo', patch: { text: 'Escriba aquí el contenido del párrafo.', fontSize: 3.2, fontWeight: 400, h: 22, lineHeight: 1.5 } },
];

export function EditorToolbar({ canUndo, canRedo, dispatch, onAdd, onAddImages, onPreview, pageNumber, pageCount }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [menu, setMenu] = useState<'text' | 'shape' | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Cierra los menús al hacer clic fuera o al pulsar Escape.
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(null);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  return (
    <div ref={rootRef} className="editor-toolbar card" role="toolbar" aria-label="Herramientas">
      <div className="et-group">
        <div className="et-menu">
          <button type="button" className={`btn btn-sm${menu === 'text' ? ' is-open' : ''}`} onClick={() => setMenu(menu === 'text' ? null : 'text')} aria-expanded={menu === 'text'} aria-haspopup="menu">
            <Type size={16} /> Texto
          </button>
          {menu === 'text' && (
            <div className="et-popover" role="menu">
              {TEXT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onAdd(createText(preset.patch));
                    setMenu(null);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
          <ImageIcon size={16} /> Imagen
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/avif,image/svg+xml"
          multiple
          hidden
          data-testid="image-input"
          onChange={(e) => {
            if (e.target.files?.length) onAddImages(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="et-menu">
          <button type="button" className={`btn btn-sm${menu === 'shape' ? ' is-open' : ''}`} onClick={() => setMenu(menu === 'shape' ? null : 'shape')} aria-expanded={menu === 'shape'} aria-haspopup="menu">
            <Shapes size={16} /> Formas
          </button>
          {menu === 'shape' && (
            <div className="et-popover et-shapes" role="menu">
              {SHAPES.map(({ type, label, Icon }) => (
                <button
                  key={type}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onAdd(createShape(type));
                    setMenu(null);
                  }}
                >
                  <Icon size={18} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <span className="chip et-page">
        Página {pageNumber} de {pageCount}
      </span>

      <div className="et-group">
        <button type="button" className="icon-btn sm" onClick={() => dispatch({ type: 'history/undo' })} disabled={!canUndo} aria-label="Deshacer" title="Deshacer (Ctrl+Z)">
          <Undo2 size={16} />
        </button>
        <button type="button" className="icon-btn sm" onClick={() => dispatch({ type: 'history/redo' })} disabled={!canRedo} aria-label="Rehacer" title="Rehacer (Ctrl+Y)">
          <Redo2 size={16} />
        </button>
        <button type="button" className="icon-btn sm" onClick={() => window.print()} aria-label="Imprimir o guardar como PDF" title="Imprimir / PDF">
          <Printer size={16} />
        </button>
        <button type="button" className="btn btn-sm btn-dark" onClick={onPreview}>
          <Eye size={16} /> Vista previa
        </button>
      </div>
    </div>
  );
}
