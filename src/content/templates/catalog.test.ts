import { describe, expect, it } from 'vitest';
import { parseBook } from '@/content/schema';
import { TEMPLATES, buildTemplateBook, findTemplate } from './catalog';

describe('plantillas de turismo', () => {
  it('ofrece 10 plantillas con identificadores y nombres únicos', () => {
    expect(TEMPLATES).toHaveLength(10);
    expect(new Set(TEMPLATES.map((t) => t.theme.id)).size).toBe(10);
    expect(new Set(TEMPLATES.map((t) => t.theme.name)).size).toBe(10);
  });

  it.each(TEMPLATES.map((t) => [t.theme.name, t] as const))('«%s» genera un libro válido de 6 páginas', (_name, def) => {
    const book = buildTemplateBook(def);
    expect(parseBook(book).ok).toBe(true);
    expect(book.pages).toHaveLength(6);
    expect(book.pages[0]!.title).toBe('Portada');
    // Cada página tiene contenido y los marcos de foto quedan listos para reemplazar.
    for (const page of book.pages) expect(page.elements.length).toBeGreaterThan(3);
    const images = book.pages.flatMap((p) => p.elements.filter((e) => e.kind === 'image'));
    expect(images.length).toBeGreaterThan(8);
    expect(images.every((i) => i.kind === 'image' && i.src === '' && !!i.placeholder)).toBe(true);
  });

  it('crea identificadores nuevos en cada uso', () => {
    const def = findTemplate('selva-viva')!;
    const a = buildTemplateBook(def);
    const b = buildTemplateBook(def);
    expect(a.pages[0]!.id).not.toBe(b.pages[0]!.id);
    const ids = a.pages.flatMap((p) => [p.id, ...p.elements.map((e) => e.id)]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('las portadas son distintas entre sí', () => {
    const signatures = TEMPLATES.map((def) =>
      buildTemplateBook(def)
        .pages[0]!.elements.map((e) => `${e.kind}:${e.kind === 'shape' ? e.shape : ''}`)
        .join('|'),
    );
    expect(new Set(signatures).size).toBe(10);
  });
});
