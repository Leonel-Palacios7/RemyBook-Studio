import type { Book, Page, PageElement } from '@/domain/types';
import { APP_CONFIG } from '@/config/app.config';
import { clonePage, createPage } from '@/content/factories';
import { createId } from '@/lib/id';

/**
 * Estado del editor con historial (deshacer/rehacer). El reductor es una
 * función pura: fácil de probar y sin efectos secundarios.
 */
export interface BookState {
  book: Book;
  past: Book[];
  future: Book[];
}

export type BookAction =
  | { type: 'book/replace'; book: Book; resetHistory?: boolean }
  | { type: 'book/meta'; patch: Partial<Pick<Book, 'title' | 'description' | 'author'>> }
  | { type: 'book/settings'; patch: Partial<Book['settings']> }
  | { type: 'page/add'; index?: number; page?: Page }
  | { type: 'page/remove'; pageId: string }
  | { type: 'page/duplicate'; pageId: string }
  | { type: 'page/move'; from: number; to: number }
  | { type: 'page/update'; pageId: string; patch: Partial<Omit<Page, 'id' | 'elements'>> }
  | { type: 'element/add'; pageId: string; element: PageElement }
  | { type: 'element/update'; pageId: string; elementId: string; patch: Partial<PageElement>; transient?: boolean }
  | { type: 'element/remove'; pageId: string; elementId: string }
  | { type: 'element/duplicate'; pageId: string; elementId: string }
  | { type: 'element/order'; pageId: string; elementId: string; direction: 'forward' | 'backward' | 'front' | 'back' }
  | { type: 'history/checkpoint' }
  | { type: 'history/undo' }
  | { type: 'history/redo' };

export function createInitialState(book: Book): BookState {
  return { book, past: [], future: [] };
}

function mapPage(book: Book, pageId: string, fn: (page: Page) => Page): Book {
  return { ...book, pages: book.pages.map((p) => (p.id === pageId ? fn(p) : p)) };
}

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= list.length) return list;
  const target = Math.max(0, Math.min(list.length - 1, to));
  const copy = list.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(target, 0, item as T);
  return copy;
}

/** Aplica una acción al libro (sin historial). Devuelve el mismo objeto si no hay cambios. */
export function applyToBook(book: Book, action: BookAction): Book {
  switch (action.type) {
    case 'book/replace':
      return action.book;
    case 'book/meta':
      return { ...book, ...action.patch };
    case 'book/settings':
      return { ...book, settings: { ...book.settings, ...action.patch } };
    case 'page/add': {
      const page = action.page ?? createPage();
      const index = action.index ?? book.pages.length;
      const pages = book.pages.slice();
      pages.splice(Math.max(0, Math.min(pages.length, index)), 0, page);
      return { ...book, pages };
    }
    case 'page/remove': {
      // Una publicación siempre conserva al menos una página.
      if (book.pages.length <= 1) return book;
      return { ...book, pages: book.pages.filter((p) => p.id !== action.pageId) };
    }
    case 'page/duplicate': {
      const index = book.pages.findIndex((p) => p.id === action.pageId);
      const source = book.pages[index];
      if (!source) return book;
      const pages = book.pages.slice();
      pages.splice(index + 1, 0, clonePage(source));
      return { ...book, pages };
    }
    case 'page/move': {
      const pages = moveItem(book.pages, action.from, action.to);
      return pages === book.pages ? book : { ...book, pages };
    }
    case 'page/update':
      return mapPage(book, action.pageId, (p) => ({ ...p, ...action.patch }));
    case 'element/add':
      return mapPage(book, action.pageId, (p) => ({ ...p, elements: [...p.elements, action.element] }));
    case 'element/update':
      return mapPage(book, action.pageId, (p) => ({
        ...p,
        elements: p.elements.map((el) =>
          el.id === action.elementId ? ({ ...el, ...action.patch, id: el.id, kind: el.kind } as PageElement) : el,
        ),
      }));
    case 'element/remove':
      return mapPage(book, action.pageId, (p) => ({
        ...p,
        elements: p.elements.filter((el) => el.id !== action.elementId),
      }));
    case 'element/duplicate':
      return mapPage(book, action.pageId, (p) => {
        const source = p.elements.find((el) => el.id === action.elementId);
        if (!source) return p;
        const copy = { ...structuredClone(source), id: createId(source.kind[0]), x: source.x + 3, y: source.y + 3 };
        return { ...p, elements: [...p.elements, copy] };
      });
    case 'element/order':
      return mapPage(book, action.pageId, (p) => {
        const from = p.elements.findIndex((el) => el.id === action.elementId);
        if (from < 0) return p;
        const last = p.elements.length - 1;
        const to = {
          forward: from + 1,
          backward: from - 1,
          front: last,
          back: 0,
        }[action.direction];
        return { ...p, elements: moveItem(p.elements, from, to) };
      });
    default:
      return book;
  }
}

function pushPast(past: Book[], book: Book): Book[] {
  const next = [...past, book];
  return next.length > APP_CONFIG.historyLimit ? next.slice(next.length - APP_CONFIG.historyLimit) : next;
}

export function bookReducer(state: BookState, action: BookAction): BookState {
  switch (action.type) {
    case 'history/undo': {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return { book: previous, past: state.past.slice(0, -1), future: [state.book, ...state.future] };
    }
    case 'history/redo': {
      const [next, ...rest] = state.future;
      if (!next) return state;
      return { book: next, past: pushPast(state.past, state.book), future: rest };
    }
    case 'history/checkpoint':
      // Guarda el estado actual antes de una serie de cambios transitorios (arrastrar).
      return { ...state, past: pushPast(state.past, state.book), future: [] };
    case 'book/replace':
      if (action.resetHistory) return createInitialState(action.book);
      break;
    default:
      break;
  }

  const book = applyToBook(state.book, action);
  if (book === state.book) return state;
  const stamped = { ...book, updatedAt: new Date().toISOString() };
  if (action.type === 'element/update' && action.transient) {
    return { ...state, book: stamped };
  }
  return { book: stamped, past: pushPast(state.past, state.book), future: [] };
}
