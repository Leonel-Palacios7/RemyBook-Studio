import { describe, expect, it } from 'vitest';
import { createDefaultBook, createPage, createShape, createText } from '@/content/factories';
import { bookReducer, createInitialState, type BookState } from './bookReducer';

function setup(): BookState {
  return createInitialState(createDefaultBook());
}

describe('bookReducer', () => {
  it('inicia con 8 páginas en blanco', () => {
    const s = setup();
    expect(s.book.pages).toHaveLength(8);
    expect(s.book.pages.every((p) => p.elements.length === 0)).toBe(true);
  });

  it('agrega páginas en una posición y sin límite', () => {
    let s = setup();
    const page = createPage({ title: 'Nueva' });
    s = bookReducer(s, { type: 'page/add', index: 1, page });
    expect(s.book.pages[1]?.title).toBe('Nueva');
    for (let i = 0; i < 300; i++) s = bookReducer(s, { type: 'page/add' });
    expect(s.book.pages).toHaveLength(309);
  });

  it('no elimina la última página', () => {
    let s = createInitialState({ ...createDefaultBook(), pages: [createPage()] });
    s = bookReducer(s, { type: 'page/remove', pageId: s.book.pages[0]!.id });
    expect(s.book.pages).toHaveLength(1);
  });

  it('reordena y duplica páginas', () => {
    let s = setup();
    const first = s.book.pages[0]!.id;
    s = bookReducer(s, { type: 'page/move', from: 0, to: 3 });
    expect(s.book.pages[3]?.id).toBe(first);
    s = bookReducer(s, { type: 'page/duplicate', pageId: first });
    expect(s.book.pages).toHaveLength(9);
    expect(s.book.pages[4]?.id).not.toBe(first);
    expect(s.book.pages[4]?.title).toBe(s.book.pages[3]?.title);
  });

  it('agrega, actualiza, duplica, ordena y elimina elementos', () => {
    let s = setup();
    const pageId = s.book.pages[0]!.id;
    const text = createText({ text: 'Hola' });
    const shape = createShape('rect');
    s = bookReducer(s, { type: 'element/add', pageId, element: text });
    s = bookReducer(s, { type: 'element/add', pageId, element: shape });
    s = bookReducer(s, { type: 'element/update', pageId, elementId: text.id, patch: { text: 'Hola SENA' } });
    expect(s.book.pages[0]!.elements[0]).toMatchObject({ text: 'Hola SENA', kind: 'text' });

    s = bookReducer(s, { type: 'element/order', pageId, elementId: text.id, direction: 'front' });
    expect(s.book.pages[0]!.elements.at(-1)?.id).toBe(text.id);

    s = bookReducer(s, { type: 'element/duplicate', pageId, elementId: shape.id });
    expect(s.book.pages[0]!.elements).toHaveLength(3);

    s = bookReducer(s, { type: 'element/remove', pageId, elementId: text.id });
    expect(s.book.pages[0]!.elements.find((e) => e.id === text.id)).toBeUndefined();
  });

  it('no permite cambiar el id ni el tipo de un elemento', () => {
    let s = setup();
    const pageId = s.book.pages[0]!.id;
    const text = createText();
    s = bookReducer(s, { type: 'element/add', pageId, element: text });
    s = bookReducer(s, {
      type: 'element/update',
      pageId,
      elementId: text.id,
      patch: { id: 'otro', kind: 'shape' } as never,
    });
    expect(s.book.pages[0]!.elements[0]).toMatchObject({ id: text.id, kind: 'text' });
  });

  it('deshace y rehace cambios', () => {
    let s = setup();
    s = bookReducer(s, { type: 'book/meta', patch: { title: 'A' } });
    s = bookReducer(s, { type: 'book/meta', patch: { title: 'B' } });
    s = bookReducer(s, { type: 'history/undo' });
    expect(s.book.title).toBe('A');
    s = bookReducer(s, { type: 'history/redo' });
    expect(s.book.title).toBe('B');
    s = bookReducer(s, { type: 'history/undo' });
    s = bookReducer(s, { type: 'book/meta', patch: { title: 'C' } });
    expect(s.future).toHaveLength(0);
  });

  it('agrupa los cambios transitorios (arrastrar) en un solo paso del historial', () => {
    let s = setup();
    const pageId = s.book.pages[0]!.id;
    const el = createShape('ellipse');
    s = bookReducer(s, { type: 'element/add', pageId, element: el });
    const before = s.past.length;
    s = bookReducer(s, { type: 'history/checkpoint' });
    for (let x = 0; x < 20; x++) {
      s = bookReducer(s, { type: 'element/update', pageId, elementId: el.id, patch: { x }, transient: true });
    }
    expect(s.past.length).toBe(before + 1);
    s = bookReducer(s, { type: 'history/undo' });
    expect(s.book.pages[0]!.elements[0]!.x).toBe(el.x);
  });

  it('ignora acciones sin efecto', () => {
    const s = setup();
    expect(bookReducer(s, { type: 'history/undo' })).toBe(s);
    expect(bookReducer(s, { type: 'page/move', from: 2, to: 2 })).toBe(s);
  });

  it('reemplaza el libro y reinicia el historial si se pide', () => {
    let s = setup();
    s = bookReducer(s, { type: 'book/meta', patch: { title: 'X' } });
    s = bookReducer(s, { type: 'book/replace', book: createDefaultBook(), resetHistory: true });
    expect(s.past).toHaveLength(0);
  });
});
