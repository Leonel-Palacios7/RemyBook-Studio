import type { Book, ImageElement, Page, ShapeElement, ShapeType, TextElement } from '@/domain/types';
import { FONT_FAMILIES, SENA_PALETTE } from '@/config/app.config';
import { createId } from '@/lib/id';
import { parseBook } from './schema';
import defaultBookJson from './book.default.json';

/** Publicación inicial (todas las páginas en blanco), validada desde JSON. */
export function createDefaultBook(): Book {
  const parsed = parseBook(structuredClone(defaultBookJson));
  if (!parsed.ok) throw new Error(parsed.error);
  return { ...parsed.book, updatedAt: new Date().toISOString() };
}

export function createPage(partial: Partial<Page> = {}): Page {
  return { id: createId('p'), title: '', background: SENA_PALETTE.white, elements: [], ...partial };
}

export function createText(partial: Partial<TextElement> = {}): TextElement {
  return {
    id: createId('t'),
    kind: 'text',
    x: 10,
    y: 10,
    w: 80,
    h: 12,
    rotation: 0,
    opacity: 1,
    text: 'Escriba aquí su texto',
    fontSize: 5,
    fontFamily: FONT_FAMILIES[0].value,
    fontWeight: 600,
    italic: false,
    underline: false,
    color: SENA_PALETTE.ink,
    background: 'transparent',
    align: 'left',
    lineHeight: 1.2,
    padding: 0,
    radius: 0,
    ...partial,
  };
}

export function createImage(src: string, partial: Partial<ImageElement> = {}): ImageElement {
  return {
    id: createId('i'),
    kind: 'image',
    x: 15,
    y: 25,
    w: 70,
    h: 35,
    rotation: 0,
    opacity: 1,
    src,
    alt: '',
    fit: 'cover',
    radius: 2,
    ...partial,
  };
}

export function createShape(shape: ShapeType, partial: Partial<ShapeElement> = {}): ShapeElement {
  const isLine = shape === 'line';
  return {
    id: createId('s'),
    kind: 'shape',
    x: 30,
    y: 40,
    w: 40,
    h: isLine ? 1 : 25,
    rotation: 0,
    opacity: 1,
    shape,
    fill: isLine ? SENA_PALETTE.green : SENA_PALETTE.green,
    stroke: 'transparent',
    strokeWidth: 0,
    radius: shape === 'rect' ? 3 : 0,
    ...partial,
  };
}

/** Copia profunda de una página con identificadores nuevos. */
export function clonePage(page: Page): Page {
  return {
    ...structuredClone(page),
    id: createId('p'),
    elements: page.elements.map((el) => ({ ...structuredClone(el), id: createId(el.kind[0]) })),
  };
}
