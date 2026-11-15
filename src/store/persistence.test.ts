import { describe, expect, it } from 'vitest';
import { createDefaultBook } from '@/content/factories';
import { APP_CONFIG } from '@/config/app.config';
import { createMemoryAdapter, localStorageAdapter } from './persistence';

describe('persistencia', () => {
  it('guarda y carga en memoria', async () => {
    const adapter = createMemoryAdapter();
    const book = createDefaultBook();
    await adapter.save(book);
    expect(await adapter.load()).toEqual(book);
    await adapter.clear();
    expect(await adapter.load()).toBeNull();
  });

  it('guarda en localStorage y valida al cargar', async () => {
    const book = createDefaultBook();
    await localStorageAdapter.save(book);
    expect((await localStorageAdapter.load())?.id).toBe(book.id);
    localStorage.setItem(APP_CONFIG.storageKey, '{"datos":"corruptos"}');
    expect(await localStorageAdapter.load()).toBeNull();
    await localStorageAdapter.clear();
  });
});
