import type { Book } from '@/domain/types';
import { APP_CONFIG } from '@/config/app.config';
import { parseBook } from '@/content/schema';

/**
 * Persistencia local. Se usa IndexedDB (sin límite práctico de 5 MB, ideal
 * para imágenes embebidas) y, si no está disponible, localStorage.
 */
export interface StorageAdapter {
  load(): Promise<Book | null>;
  save(book: Book): Promise<void>;
  clear(): Promise<void>;
}

const DB_NAME = 'sena-flipbook-studio';
const STORE = 'books';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        transaction.oncomplete = () => {
          db.close();
          resolve(request.result);
        };
        transaction.onerror = () => reject(transaction.error);
      }),
  );
}

function validate(data: unknown): Book | null {
  if (!data) return null;
  const parsed = parseBook(data);
  return parsed.ok ? parsed.book : null;
}

export const indexedDbAdapter: StorageAdapter = {
  async load() {
    return validate(await tx('readonly', (s) => s.get(APP_CONFIG.storageKey)));
  },
  async save(book) {
    await tx('readwrite', (s) => s.put(book, APP_CONFIG.storageKey));
  },
  async clear() {
    await tx('readwrite', (s) => s.delete(APP_CONFIG.storageKey));
  },
};

export const localStorageAdapter: StorageAdapter = {
  async load() {
    try {
      const raw = localStorage.getItem(APP_CONFIG.storageKey);
      return raw ? validate(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  },
  async save(book) {
    localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(book));
  },
  async clear() {
    localStorage.removeItem(APP_CONFIG.storageKey);
  },
};

export function createMemoryAdapter(initial: Book | null = null): StorageAdapter {
  let value = initial;
  return {
    async load() {
      return value;
    },
    async save(book) {
      value = book;
    },
    async clear() {
      value = null;
    },
  };
}

export function getDefaultAdapter(): StorageAdapter {
  if (typeof indexedDB !== 'undefined') return indexedDbAdapter;
  if (typeof localStorage !== 'undefined') return localStorageAdapter;
  return createMemoryAdapter();
}
