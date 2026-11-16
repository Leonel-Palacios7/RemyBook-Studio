import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutTemplate, PenLine } from 'lucide-react';
import { APP_CONFIG, PAGE_FORMATS } from '@/config/app.config';
import { PageRenderer } from '@/components/PageRenderer';
import { FlipBook } from '@/engine/FlipBook';
import { playPageTurn } from '@/engine/sound';
import {
  clampView,
  convertView,
  fitPageSize,
  maxView,
  pagesInView,
  primaryPage,
  viewForPage,
  type FlipMode,
} from '@/engine/layout';
import { isFullscreen, shareLink, toggleFullscreen } from '@/lib/browser';
import { isEditableTarget, useElementSize, useMediaQuery, usePrefersReducedMotion, useToast } from '@/lib/hooks';
import { buildHash } from '@/lib/router';
import { useBook } from '@/store/BookProvider';
import { ReaderToolbar } from './ReaderToolbar';
import { SidePanel, type PanelKind } from './SidePanel';
import { PrintView } from './PrintView';
import './reader.css';

const MUTE_KEY = 'sena-flipbook-studio:muted';

interface Props {
  initialPage: number;
  onPageChange: (page: number) => void;
  onEdit: (page: number) => void;
  onOpenTemplates: () => void;
}

export function Reader({ initialPage, onPageChange, onEdit, onOpenTemplates }: Props) {
  const { book } = useBook();
  const pageCount = book.pages.length;
  const narrow = useMediaQuery(`(max-width: ${APP_CONFIG.singlePageBreakpoint}px)`);
  const reducedMotion = usePrefersReducedMotion();
  const mode: FlipMode = narrow ? 'single' : 'double';

  // La vista se guarda junto con el modo para convertirla al cambiar de pantalla.
  const [nav, setNav] = useState(() => ({ mode, view: viewForPage(mode, pageCount, initialPage) }));
  const view = clampView(mode, pageCount, nav.mode === mode ? nav.view : convertView(nav.mode, mode, pageCount, nav.view));
  const setView = useCallback(
    (next: number) => setNav({ mode, view: clampView(mode, pageCount, next) }),
    [mode, pageCount],
  );

  const [zoom, setZoom] = useState(1);
  const [panel, setPanel] = useState<PanelKind | null>(null);
  const [query, setQuery] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const soundEnabled = book.settings.pageSound !== false;
  const toggleMute = useCallback(() => {
    setMuted((m) => {
      try {
        localStorage.setItem(MUTE_KEY, m ? '0' : '1');
      } catch {
        /* sin persistencia */
      }
      return !m;
    });
  }, []);
  const onTurnStart = useCallback(() => {
    if (soundEnabled && !muted) playPageTurn({ duration: book.settings.flipDuration });
  }, [book.settings.flipDuration, muted, soundEnabled]);
  const [toast, setToast] = useToast();
  const rootRef = useRef<HTMLDivElement>(null);
  const [stageRef, stage] = useElementSize<HTMLDivElement>();

  const last = maxView(mode, pageCount);
  const current = primaryPage(mode, pageCount, view);
  const visible = pagesInView(mode, pageCount, view).filter((p): p is number => p !== null);

  useEffect(() => {
    onPageChange(current);
  }, [current, onPageChange]);

  useEffect(() => {
    const onFs = () => setFullscreen(isFullscreen());
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const goToPage = useCallback((page: number) => setView(viewForPage(mode, pageCount, page)), [mode, pageCount, setView]);
  const next = useCallback(() => setView(view + 1), [setView, view]);
  const prev = useCallback(() => setView(view - 1), [setView, view]);
  const zoomBy = useCallback(
    (delta: number) =>
      setZoom((z) => Math.min(APP_CONFIG.zoom.max, Math.max(APP_CONFIG.zoom.min, Math.round((z + delta) * 100) / 100))),
    [],
  );

  const share = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}${buildHash({ name: 'read', page: current })}`;
    const result = await shareLink({ title: book.title || 'Publicación', text: book.description, url });
    setToast(result === 'copied' ? 'Enlace copiado al portapapeles' : result === 'shared' ? 'Enlace compartido' : 'No se pudo compartir');
  }, [book.description, book.title, current, setToast]);

  const print = useCallback(() => window.print(), []);

  // Navegación con teclado.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prev();
          break;
        case 'Home':
          e.preventDefault();
          setView(0);
          break;
        case 'End':
          e.preventDefault();
          setView(last);
          break;
        case '+':
        case '=':
          zoomBy(APP_CONFIG.zoom.step);
          break;
        case '-':
          zoomBy(-APP_CONFIG.zoom.step);
          break;
        case '0':
          setZoom(1);
          break;
        case 'f':
        case 'F':
          void toggleFullscreen(rootRef.current ?? undefined);
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'Escape':
          setPanel(null);
          break;
        default:
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [last, next, prev, setView, toggleMute, zoomBy]);

  const ratio = PAGE_FORMATS[book.settings.format]?.ratio ?? PAGE_FORMATS['a4-portrait'].ratio;
  const padX = narrow ? 16 : 120;
  const padY = narrow ? 150 : 190;
  const base = fitPageSize(Math.max(0, stage.width - padX), Math.max(0, stage.height - padY), ratio, mode);
  const pageWidth = Math.max(80, Math.round(base.width * zoom));
  const pageHeight = Math.max(80 / ratio, Math.round(base.height * zoom));

  const highlight = panel === 'search' ? query : undefined;
  const renderPage = useCallback(
    (index: number) => {
      const page = book.pages[index];
      if (!page) return null;
      return (
        <PageRenderer
          page={page}
          pageNumber={index + 1}
          showNumber={book.settings.showPageNumbers}
          highlightText={highlight}
        />
      );
    },
    [book.pages, book.settings.showPageNumbers, highlight],
  );

  const isEmpty = useMemo(() => book.pages.every((p) => p.elements.length === 0 && !p.backgroundImage), [book.pages]);
  const label =
    visible.length > 1 ? `Páginas ${visible[0]! + 1} y ${visible[1]! + 1} de ${pageCount}` : `Página ${current + 1} de ${pageCount}`;

  return (
    <div className="reader" ref={rootRef}>
      <div className="reader-head">
        <div className="reader-title">
          <strong>{book.title || 'Publicación sin título'}</strong>
          <span className="chip">{visible.map((p) => p + 1).join('–') || '—'} / {pageCount}</span>
        </div>
        <button type="button" className="btn btn-sm reader-edit" onClick={() => onEdit(current)}>
          <PenLine size={16} /> <span className="hide-sm">Editar esta página</span>
        </button>
      </div>

      <div
        className={`reader-stage${zoom > 1 ? ' is-zoomed' : ''}`}
        ref={stageRef}
        aria-roledescription="publicación"
        aria-label={book.title}
      >
        <div className="reader-canvas" style={{ minWidth: zoom > 1 ? pageWidth * (mode === 'double' ? 2 : 1) + 80 : undefined }}>
          {stage.width > 0 && (
            <FlipBook
              key={mode}
              pageCount={pageCount}
              mode={mode}
              view={view}
              onViewChange={setView}
              pageWidth={pageWidth}
              pageHeight={pageHeight}
              duration={reducedMotion ? 0 : book.settings.flipDuration}
              renderPage={renderPage}
              dragDisabled={zoom > 1}
              onTurnStart={onTurnStart}
            />
          )}
        </div>

        {isEmpty && (
          <div className="reader-empty card" role="note">
            <strong>Tu publicación está en blanco</strong>
            <span className="muted">Agrega textos, imágenes y formas desde el editor. Todo se guarda en este equipo.</span>
            <div className="row wrap" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={onOpenTemplates}>
                <LayoutTemplate size={16} /> Elegir una plantilla
              </button>
              <button type="button" className="btn btn-sm" onClick={() => onEdit(current)}>
                <PenLine size={16} /> Empezar en blanco
              </button>
            </div>
          </div>
        )}
      </div>

      <button type="button" className="reader-arrow is-prev" onClick={prev} disabled={view <= 0} aria-label="Página anterior">
        <ChevronLeft size={28} />
      </button>
      <button type="button" className="reader-arrow is-next" onClick={next} disabled={view >= last} aria-label="Página siguiente">
        <ChevronRight size={28} />
      </button>

      <ReaderToolbar
        view={view}
        last={last}
        currentPage={current}
        pageCount={pageCount}
        zoom={zoom}
        panel={panel}
        fullscreen={fullscreen}
        sound={soundEnabled ? !muted : null}
        onToggleSound={toggleMute}
        onFirst={() => setView(0)}
        onPrev={prev}
        onNext={next}
        onLast={() => setView(last)}
        onGoToPage={goToPage}
        onZoomIn={() => zoomBy(APP_CONFIG.zoom.step)}
        onZoomOut={() => zoomBy(-APP_CONFIG.zoom.step)}
        onZoomReset={() => setZoom(1)}
        onTogglePanel={(kind) => setPanel((p) => (p === kind ? null : kind))}
        onShare={share}
        onPrint={print}
        onFullscreen={() => void toggleFullscreen(rootRef.current ?? undefined)}
      />

      {panel && (
        <SidePanel
          kind={panel}
          book={book}
          currentPages={visible}
          query={query}
          onQueryChange={setQuery}
          onSelectPage={(page) => {
            goToPage(page);
            if (narrow) setPanel(null);
          }}
          onClose={() => setPanel(null)}
        />
      )}

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {label}
      </div>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      <PrintView book={book} />
    </div>
  );
}
