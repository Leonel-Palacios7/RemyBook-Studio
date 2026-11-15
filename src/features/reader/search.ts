import type { Book } from '@/domain/types';

export interface SearchHit {
  pageIndex: number;
  pageTitle: string;
  snippet: string;
  /** Posición del término dentro del fragmento. */
  matchStart: number;
  matchLength: number;
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Busca un término en títulos de página y elementos de texto. Ignora
 * mayúsculas y tildes ("pagina" encuentra "Página").
 */
export function searchBook(book: Book, query: string, contextChars = 40): SearchHit[] {
  const needle = normalize(query.trim());
  if (needle.length < 2) return [];
  const hits: SearchHit[] = [];
  book.pages.forEach((page, pageIndex) => {
    const sources = [page.title, ...page.elements.flatMap((el) => (el.kind === 'text' ? [el.text] : []))];
    for (const raw of sources) {
      if (!raw) continue;
      // NFC garantiza que los índices del texto normalizado coincidan con el original.
      const source = raw.normalize('NFC');
      const hay = normalize(source);
      let from = 0;
      let idx = hay.indexOf(needle, from);
      while (idx !== -1) {
        const start = Math.max(0, idx - contextChars);
        const end = Math.min(source.length, idx + needle.length + contextChars);
        const prefix = start > 0 ? '…' : '';
        const suffix = end < source.length ? '…' : '';
        hits.push({
          pageIndex,
          pageTitle: page.title,
          snippet: prefix + source.slice(start, end) + suffix,
          matchStart: prefix.length + (idx - start),
          matchLength: needle.length,
        });
        from = idx + needle.length;
        idx = hay.indexOf(needle, from);
      }
    }
  });
  return hits;
}

/** Entradas del índice: páginas con título. */
export function tableOfContents(book: Book): { pageIndex: number; title: string }[] {
  return book.pages
    .map((p, pageIndex) => ({ pageIndex, title: p.title.trim() }))
    .filter((entry) => entry.title.length > 0);
}
