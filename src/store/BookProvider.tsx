import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type { Book } from '@/domain/types';
import { createDefaultBook } from '@/content/factories';
import { bookReducer, createInitialState, type BookAction, type BookState } from './bookReducer';
import { getDefaultAdapter, type StorageAdapter } from './persistence';

export type SaveStatus = 'loading' | 'saved' | 'saving' | 'error';

interface BookContextValue {
  state: BookState;
  book: Book;
  dispatch: (action: BookAction) => void;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: SaveStatus;
  resetBook: () => void;
}

const BookContext = createContext<BookContextValue | null>(null);

interface Props {
  children: ReactNode;
  initialBook?: Book;
  storage?: StorageAdapter;
  /** Retardo del guardado automático (ms). */
  saveDelay?: number;
}

export function BookProvider({ children, initialBook, storage, saveDelay = 600 }: Props) {
  const adapter = useMemo(() => storage ?? getDefaultAdapter(), [storage]);
  const [state, dispatch] = useReducer(bookReducer, initialBook ?? createDefaultBook(), createInitialState);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('loading');
  const loaded = useRef(false);

  // Carga inicial desde el almacenamiento local.
  useEffect(() => {
    let cancelled = false;
    adapter
      .load()
      .then((stored) => {
        if (cancelled) return;
        if (stored) dispatch({ type: 'book/replace', book: stored, resetHistory: true });
      })
      .catch(() => undefined)
      .finally(() => {
        if (cancelled) return;
        loaded.current = true;
        setSaveStatus('saved');
      });
    return () => {
      cancelled = true;
    };
  }, [adapter]);

  // Guardado automático con retardo.
  useEffect(() => {
    if (!loaded.current) return;
    setSaveStatus('saving');
    const timer = window.setTimeout(() => {
      adapter
        .save(state.book)
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('error'));
    }, saveDelay);
    return () => window.clearTimeout(timer);
  }, [adapter, state.book, saveDelay]);

  const value = useMemo<BookContextValue>(
    () => ({
      state,
      book: state.book,
      dispatch,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      saveStatus,
      resetBook: () => dispatch({ type: 'book/replace', book: createDefaultBook() }),
    }),
    [state, saveStatus],
  );

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBook(): BookContextValue {
  const ctx = useContext(BookContext);
  if (!ctx) throw new Error('useBook debe usarse dentro de <BookProvider>.');
  return ctx;
}
