import { describe, expect, it } from 'vitest';
import { createDefaultBook, createText } from '@/content/factories';
import { searchBook, tableOfContents } from './search';

describe('búsqueda e índice', () => {
  const book = createDefaultBook();
  book.pages[2]!.elements.push(createText({ text: 'Formación técnica y tecnológica de calidad' }));
  book.pages[5]!.title = 'Tecnología';

  it('encuentra texto sin importar mayúsculas ni tildes', () => {
    const hits = searchBook(book, 'tecnologi');
    expect(hits.map((h) => h.pageIndex)).toEqual([2, 5]);
    const first = hits[0]!;
    expect(first.snippet.slice(first.matchStart, first.matchStart + first.matchLength)).toBe('tecnológi');
  });

  it('exige al menos dos caracteres', () => {
    expect(searchBook(book, 'a')).toEqual([]);
  });

  it('genera el índice a partir de los títulos de página', () => {
    expect(tableOfContents(book)).toEqual([
      { pageIndex: 0, title: 'Portada' },
      { pageIndex: 5, title: 'Tecnología' },
      { pageIndex: 7, title: 'Contraportada' },
    ]);
  });
});
