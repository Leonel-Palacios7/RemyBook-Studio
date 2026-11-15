import { createPortal } from 'react-dom';
import type { Book } from '@/domain/types';
import { PAGE_FORMATS } from '@/config/app.config';
import { PageRenderer } from '@/components/PageRenderer';

/**
 * Vista de impresión: todas las páginas, una por hoja. Solo es visible al
 * imprimir (o «Guardar como PDF» desde el diálogo del navegador).
 */
export function PrintView({ book }: { book: Book }) {
  const format = PAGE_FORMATS[book.settings.format] ?? PAGE_FORMATS['a4-portrait'];
  return createPortal(
    <div className="print-view" aria-hidden="true">
      <style>{`@page { size: ${format.css}; margin: 0; }`}</style>
      {book.pages.map((page, i) => (
        <div key={page.id} className="print-page">
          <PageRenderer page={page} pageNumber={i + 1} showNumber={book.settings.showPageNumbers} />
        </div>
      ))}
    </div>,
    document.body,
  );
}
