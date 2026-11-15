import type { ImageElement, ImageMask, Page, PageElement, PageFormat, ShapeElement, ShapeType, TextElement } from '@/domain/types';
import { createImage, createPage, createShape, createText } from '@/content/factories';

/**
 * Kit para componer plantillas. Las coordenadas están en % de la página
 * (x sobre el ancho, y sobre el alto) y los tamaños de fuente en % del ancho.
 */

export const SANS = "'Work Sans Variable', 'Work Sans', system-ui, sans-serif";
export const SERIF = "Georgia, 'Times New Roman', serif";

export interface Palette {
  /** Fondo de las páginas interiores. */
  paper: string;
  ink: string;
  muted: string;
  primary: string;
  secondary: string;
  accent: string;
  /** Tono suave para tarjetas y fondos de íconos. */
  soft: string;
  /** Texto sobre colores oscuros. */
  light: string;
  /** Tono de los marcos de foto vacíos. */
  photo: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  tags: string[];
  format: PageFormat;
  palette: Palette;
  /** Silueta de las fotos. */
  frame: ImageMask;
  /** Forma decorativa característica. */
  motif: ShapeType;
  headingFont: string;
  headingWeight: number;
  /** Títulos en cursiva serif para acentos. */
  accentFont: string;
  /** Variantes de las páginas interiores (0, 1 o 2). */
  layout: { intro: number; destinations: number; gallery: number };
}

/** Relación alto/ancho de una página A4 vertical. */
export const ASPECT = 297 / 210;

/** Alto (en % de la página) que produce una caja cuadrada de ancho `w` en A4 vertical. */
export const sq = (w: number, ratio = 210 / 297) => Math.round(w * ratio * 100) / 100;

export function t(text: string, x: number, y: number, w: number, h: number, o: Partial<TextElement> = {}): TextElement {
  return createText({
    text,
    x,
    y,
    w,
    h,
    fontSize: 3,
    fontWeight: 400,
    lineHeight: 1.3,
    fontFamily: SANS,
    ...o,
  });
}

export function s(
  shape: ShapeType,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  o: Partial<ShapeElement> = {},
): ShapeElement {
  return createShape(shape, { x, y, w, h, fill, radius: 0, ...o });
}

export function img(alt: string, x: number, y: number, w: number, h: number, mask: ImageMask = 'none', o: Partial<ImageElement> = {}): ImageElement {
  return createImage('', { alt, x, y, w, h, mask, radius: 2, ...o });
}

export function pg(title: string, background: string, elements: PageElement[]): Page {
  return createPage({ title, background, elements });
}

/** Etiqueta en píldora: forma + texto centrado. */
export function pill(text: string, x: number, y: number, w: number, h: number, fill: string, color: string, size = 2.2): PageElement[] {
  return [
    s('rect', x, y, w, h, fill, { radius: 50 }),
    // Centrado vertical: alto de línea (1,2 × fuente, en unidades de ancho) llevado a % del alto.
    t(text, x, y + Math.max(0, (h - (1.2 * size) / ASPECT) / 2), w, h, {
      fontSize: size,
      fontWeight: 700,
      color,
      align: 'center',
      lineHeight: 1.2,
      letterSpacing: 0.04,
    }),
  ];
}
