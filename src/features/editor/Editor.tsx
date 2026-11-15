import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createImage } from '@/content/factories';
import type { PageElement } from '@/domain/types';
import { readImageAsDataUrl } from '@/lib/browser';
import { isEditableTarget, useToast } from '@/lib/hooks';
import { createId } from '@/lib/id';
import { useBook } from '@/store/BookProvider';
import { PrintView } from '@/features/reader/PrintView';
import { PagesSidebar } from './PagesSidebar';
import { EditorToolbar } from './EditorToolbar';
import { Canvas } from './Canvas';
import { Inspector } from './Inspector';
import './editor.css';

interface Props {
  initialPage: number;
  onPageChange: (page: number) => void;
  onPreview: (page: number) => void;
}

export default function Editor({ initialPage, onPageChange, onPreview }: Props) {
  const { book, dispatch, canUndo, canRedo } = useBook();
  const [pageId, setPageId] = useState(() => book.pages[Math.min(initialPage, book.pages.length - 1)]?.id ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useToast();
  const clipboard = useRef<PageElement | null>(null);

  // Si la página seleccionada desaparece (eliminada / deshacer), elegir otra válida.
  const pageIndex = Math.max(0, book.pages.findIndex((p) => p.id === pageId));
  const page = book.pages[pageIndex]!;
  useEffect(() => {
    if (page.id !== pageId) setPageId(page.id);
  }, [page.id, pageId]);
  useEffect(() => onPageChange(pageIndex), [pageIndex, onPageChange]);

  const selected = useMemo(() => page.elements.find((el) => el.id === selectedId) ?? null, [page.elements, selectedId]);

  const selectPage = useCallback((id: string) => {
    setPageId(id);
    setSelectedId(null);
    setEditingId(null);
  }, []);

  const addElement = useCallback(
    (element: PageElement) => {
      dispatch({ type: 'element/add', pageId: page.id, element });
      setSelectedId(element.id);
    },
    [dispatch, page.id],
  );

  const addImageFiles = useCallback(
    async (files: FileList | File[], at?: { x: number; y: number }) => {
      for (const file of Array.from(files)) {
        try {
          const src = await readImageAsDataUrl(file);
          const el = createImage(src, { alt: file.name.replace(/\.[^.]+$/, '') });
          if (at) {
            el.x = Math.max(0, at.x - el.w / 2);
            el.y = Math.max(0, at.y - el.h / 2);
          }
          addElement(el);
        } catch (err) {
          setToast((err as Error).message || 'No se pudo cargar la imagen');
        }
      }
    },
    [addElement, setToast],
  );

  // Atajos de teclado del editor.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        dispatch({ type: e.shiftKey ? 'history/redo' : 'history/undo' });
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        dispatch({ type: 'history/redo' });
        return;
      }
      if (isEditableTarget(e.target)) return;
      if (mod && e.key.toLowerCase() === 'v' && clipboard.current) {
        e.preventDefault();
        const copy = { ...structuredClone(clipboard.current), id: createId(clipboard.current.kind[0]) };
        copy.x += 3;
        copy.y += 3;
        clipboard.current = copy;
        addElement(copy);
        return;
      }
      if (!selected) return;
      if (mod && e.key.toLowerCase() === 'c') {
        clipboard.current = structuredClone(selected);
        setToast('Elemento copiado');
        return;
      }
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        dispatch({ type: 'element/duplicate', pageId: page.id, elementId: selected.id });
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        dispatch({ type: 'element/remove', pageId: page.id, elementId: selected.id });
        setSelectedId(null);
        return;
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        return;
      }
      if (e.key === 'Enter' && selected.kind === 'text') {
        e.preventDefault();
        setEditingId(selected.id);
        return;
      }
      const step = e.shiftKey ? 5 : 0.5;
      const delta: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const d = delta[e.key];
      if (d && !selected.locked) {
        e.preventDefault();
        dispatch({
          type: 'element/update',
          pageId: page.id,
          elementId: selected.id,
          patch: { x: selected.x + d[0], y: selected.y + d[1] },
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addElement, dispatch, page.id, selected, setToast]);

  return (
    <div className="editor">
      <PagesSidebar
        book={book}
        currentPageId={page.id}
        onSelect={selectPage}
        dispatch={dispatch}
      />

      <section className="editor-center" aria-label="Lienzo de edición">
        <EditorToolbar
          canUndo={canUndo}
          canRedo={canRedo}
          dispatch={dispatch}
          onAdd={addElement}
          onAddImages={addImageFiles}
          onPreview={() => onPreview(pageIndex)}
          pageNumber={pageIndex + 1}
          pageCount={book.pages.length}
        />
        <Canvas
          book={book}
          page={page}
          selectedId={selectedId}
          editingId={editingId}
          onSelect={(id) => {
            setSelectedId(id);
            if (id !== editingId) setEditingId(null);
          }}
          onStartEditing={setEditingId}
          onStopEditing={() => setEditingId(null)}
          onDropImages={addImageFiles}
          dispatch={dispatch}
        />
      </section>

      <Inspector
        book={book}
        page={page}
        element={selected}
        dispatch={dispatch}
        onDeselect={() => setSelectedId(null)}
        notify={setToast}
      />

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      <PrintView book={book} />
    </div>
  );
}
