/**
 * Modelo de dominio de una publicación.
 *
 * Todas las posiciones y tamaños de los elementos se expresan en porcentaje
 * del ancho/alto de la página (0–100). Los tamaños de fuente se expresan en
 * porcentaje del ancho de la página (unidades `cqw`). Así una misma página se
 * ve idéntica en el lector, en el editor, en las miniaturas y al imprimir.
 */

export type ElementKind = 'text' | 'image' | 'shape';

export interface ElementBase {
  id: string;
  kind: ElementKind;
  /** Posición X de la esquina superior izquierda, % del ancho de la página. */
  x: number;
  /** Posición Y de la esquina superior izquierda, % del alto de la página. */
  y: number;
  /** Ancho, % del ancho de la página. */
  w: number;
  /** Alto, % del alto de la página. */
  h: number;
  /** Rotación en grados. */
  rotation: number;
  /** Opacidad 0–1. */
  opacity: number;
  /** Bloqueado: no se puede mover ni redimensionar en el editor. */
  locked?: boolean;
}

export type TextAlign = 'left' | 'center' | 'right' | 'justify';

export interface TextElement extends ElementBase {
  kind: 'text';
  text: string;
  /** Tamaño de fuente como % del ancho de la página. */
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  italic: boolean;
  underline: boolean;
  color: string;
  background: string;
  align: TextAlign;
  lineHeight: number;
  /** Relleno interno, % del ancho de la página. */
  padding: number;
  /** Radio de borde, % del ancho de la página. */
  radius: number;
}

export type ImageFit = 'cover' | 'contain' | 'fill';

export interface ImageElement extends ElementBase {
  kind: 'image';
  src: string;
  alt: string;
  fit: ImageFit;
  radius: number;
}

export type ShapeType = 'rect' | 'ellipse' | 'triangle' | 'line' | 'star' | 'arrow';

export interface ShapeElement extends ElementBase {
  kind: 'shape';
  shape: ShapeType;
  fill: string;
  stroke: string;
  /** Grosor de borde, % del ancho de la página. */
  strokeWidth: number;
  radius: number;
}

export type PageElement = TextElement | ImageElement | ShapeElement;

export interface Page {
  id: string;
  /** Título opcional: alimenta el índice y la búsqueda. */
  title: string;
  background: string;
  backgroundImage?: string;
  elements: PageElement[];
}

export type PageFormat = 'a4-portrait' | 'a4-landscape' | 'letter-portrait' | 'square' | 'widescreen';

export interface BookSettings {
  format: PageFormat;
  /** Mostrar números de página en el lector. */
  showPageNumbers: boolean;
  /** Duración del giro en milisegundos. */
  flipDuration: number;
  /** Sonido / efectos futuros: reservado para nuevas versiones. */
  [key: string]: unknown;
}

export interface Book {
  schemaVersion: 1;
  id: string;
  title: string;
  description: string;
  author: string;
  updatedAt: string;
  settings: BookSettings;
  pages: Page[];
}
