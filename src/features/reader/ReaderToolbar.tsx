import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  ListOrdered,
  Maximize,
  Minimize,
  Printer,
  Search,
  Share2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { APP_CONFIG } from '@/config/app.config';
import type { PanelKind } from './SidePanel';

interface Props {
  view: number;
  last: number;
  currentPage: number;
  pageCount: number;
  zoom: number;
  panel: PanelKind | null;
  fullscreen: boolean;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
  onGoToPage: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onTogglePanel: (kind: PanelKind) => void;
  onShare: () => void;
  onPrint: () => void;
  onFullscreen: () => void;
}

export function ReaderToolbar(p: Props) {
  const [draft, setDraft] = useState(String(p.currentPage + 1));
  useEffect(() => setDraft(String(p.currentPage + 1)), [p.currentPage]);

  const commit = () => {
    const n = Number.parseInt(draft, 10);
    if (Number.isFinite(n)) p.onGoToPage(Math.min(p.pageCount, Math.max(1, n)) - 1);
    else setDraft(String(p.currentPage + 1));
  };

  return (
    <div className="reader-toolbar" role="toolbar" aria-label="Controles del lector">
      <div className="tb-group">
        <button type="button" className="icon-btn on-dark sm hide-sm" onClick={p.onFirst} disabled={p.view <= 0} aria-label="Primera página" title="Primera página (Inicio)">
          <ChevronsLeft size={18} />
        </button>
        <button type="button" className="icon-btn on-dark sm" onClick={p.onPrev} disabled={p.view <= 0} aria-label="Anterior" title="Anterior (←)">
          <ChevronLeft size={18} />
        </button>
        <form
          className="tb-page"
          onSubmit={(e) => {
            e.preventDefault();
            commit();
          }}
        >
          <label className="sr-only" htmlFor="tb-page-input">
            Ir a la página
          </label>
          <input
            id="tb-page-input"
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
            onBlur={commit}
            aria-describedby="tb-page-total"
          />
          <span id="tb-page-total">/ {p.pageCount}</span>
        </form>
        <button type="button" className="icon-btn on-dark sm" onClick={p.onNext} disabled={p.view >= p.last} aria-label="Siguiente" title="Siguiente (→)">
          <ChevronRight size={18} />
        </button>
        <button type="button" className="icon-btn on-dark sm hide-sm" onClick={p.onLast} disabled={p.view >= p.last} aria-label="Última página" title="Última página (Fin)">
          <ChevronsRight size={18} />
        </button>
      </div>

      <span className="tb-sep" aria-hidden="true" />

      <div className="tb-group">
        <button type="button" className={`icon-btn on-dark sm${p.panel === 'thumbs' ? ' is-active' : ''}`} onClick={() => p.onTogglePanel('thumbs')} aria-label="Miniaturas" aria-pressed={p.panel === 'thumbs'} title="Miniaturas">
          <LayoutGrid size={18} />
        </button>
        <button type="button" className={`icon-btn on-dark sm${p.panel === 'toc' ? ' is-active' : ''}`} onClick={() => p.onTogglePanel('toc')} aria-label="Índice" aria-pressed={p.panel === 'toc'} title="Índice">
          <ListOrdered size={18} />
        </button>
        <button type="button" className={`icon-btn on-dark sm${p.panel === 'search' ? ' is-active' : ''}`} onClick={() => p.onTogglePanel('search')} aria-label="Buscar" aria-pressed={p.panel === 'search'} title="Buscar">
          <Search size={18} />
        </button>
      </div>

      <span className="tb-sep hide-sm" aria-hidden="true" />

      <div className="tb-group hide-sm">
        <button type="button" className="icon-btn on-dark sm" onClick={p.onZoomOut} disabled={p.zoom <= APP_CONFIG.zoom.min} aria-label="Alejar" title="Alejar (−)">
          <ZoomOut size={18} />
        </button>
        <button type="button" className="tb-zoom" onClick={p.onZoomReset} title="Restablecer zoom (0)" aria-label={`Zoom ${Math.round(p.zoom * 100)} %, restablecer`}>
          {Math.round(p.zoom * 100)}%
        </button>
        <button type="button" className="icon-btn on-dark sm" onClick={p.onZoomIn} disabled={p.zoom >= APP_CONFIG.zoom.max} aria-label="Acercar" title="Acercar (+)">
          <ZoomIn size={18} />
        </button>
      </div>

      <span className="tb-sep" aria-hidden="true" />

      <div className="tb-group">
        <button type="button" className="icon-btn on-dark sm" onClick={p.onShare} aria-label="Compartir" title="Compartir">
          <Share2 size={18} />
        </button>
        <button type="button" className="icon-btn on-dark sm hide-sm" onClick={p.onPrint} aria-label="Imprimir o guardar como PDF" title="Imprimir / PDF">
          <Printer size={18} />
        </button>
        <button type="button" className="icon-btn on-dark sm" onClick={p.onFullscreen} aria-label={p.fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'} title="Pantalla completa (F)">
          {p.fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>
    </div>
  );
}
