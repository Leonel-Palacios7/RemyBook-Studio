import { describe, expect, it } from 'vitest';
import { createDefaultBook, createImage, createShape, createText } from './factories';
import { parseBook, parseBookJson } from './schema';

describe('validación del contenido', () => {
  it('acepta la publicación por defecto y elementos de todos los tipos', () => {
    const book = createDefaultBook();
    book.pages[0]!.elements.push(createText(), createImage('https://example.org/a.png'), createShape('star'));
    expect(parseBook(book).ok).toBe(true);
  });

  it('rechaza contenido con estructura inválida', () => {
    const bad = { ...createDefaultBook(), pages: [] };
    const r = parseBook(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/pages/);
  });

  it('rechaza tipos de elemento desconocidos', () => {
    const book = createDefaultBook();
    (book.pages[0]!.elements as unknown[]).push({ ...createText(), kind: 'script' });
    expect(parseBook(book).ok).toBe(false);
  });

  it('informa JSON mal formado', () => {
    const r = parseBookJson('{no es json');
    expect(r).toEqual({ ok: false, error: 'El archivo no es un JSON válido.' });
  });

  it('el contenido por defecto vive en JSON, separado de los componentes', () => {
    const book = createDefaultBook();
    expect(book.pages.map((p) => p.title)).toContain('Portada');
  });
});

describe('formas y marcos nuevos', () => {
  it('acepta degradados, siluetas y espaciado de texto', () => {
    const book = createDefaultBook();
    book.pages[0]!.elements.push(
      createShape('arch', { fillTo: '#ffffff', gradientAngle: 90 }),
      createShape('wave'),
      createImage('', { mask: 'blob', placeholder: '#cccccc' }),
      createText({ letterSpacing: 0.2, uppercase: true }),
    );
    expect(parseBook(book).ok).toBe(true);
  });
});
