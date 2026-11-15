/**
 * Motor de giro de páginas — modelo de hojas ("leaves").
 *
 * Modo doble (escritorio): cada hoja física tiene un anverso y un reverso.
 *   hoja k → anverso = página 2k, reverso = página 2k+1.
 *   La portada (página 0) aparece sola a la derecha, como en un libro real.
 *   Vista v → izquierda = página 2v-1, derecha = página 2v.
 *
 * Modo sencillo (móvil): cada página es una hoja con reverso de papel.
 *   hoja k → anverso = página k. Vista v → página v.
 *
 * Una hoja está "girada" (a la izquierda) cuando su índice es menor que la
 * vista actual. Girar hacia adelante = girar la hoja `v`; hacia atrás = la `v-1`.
 */

export type FlipMode = 'double' | 'single';

export interface Leaf {
  index: number;
  front: number | null;
  back: number | null;
}

export function leafCount(mode: FlipMode, pageCount: number): number {
  if (pageCount <= 0) return 0;
  return mode === 'double' ? Math.ceil(pageCount / 2) : pageCount;
}

export function getLeaves(mode: FlipMode, pageCount: number): Leaf[] {
  const count = leafCount(mode, pageCount);
  return Array.from({ length: count }, (_, index) => {
    if (mode === 'single') return { index, front: index, back: null };
    const front = 2 * index;
    const back = front + 1 < pageCount ? front + 1 : null;
    return { index, front, back };
  });
}

/** Última vista navegable. */
export function maxView(mode: FlipMode, pageCount: number): number {
  if (pageCount <= 0) return 0;
  return mode === 'double' ? Math.floor(pageCount / 2) : pageCount - 1;
}

export function clampView(mode: FlipMode, pageCount: number, view: number): number {
  return Math.max(0, Math.min(maxView(mode, pageCount), Math.round(view)));
}

/** Páginas visibles en una vista: [izquierda, derecha] (null = vacío). */
export function pagesInView(mode: FlipMode, pageCount: number, view: number): (number | null)[] {
  if (mode === 'single') return view < pageCount ? [view] : [];
  const left = 2 * view - 1;
  const right = 2 * view;
  return [left >= 0 && left < pageCount ? left : null, right < pageCount ? right : null];
}

/** Vista que contiene una página concreta. */
export function viewForPage(mode: FlipMode, pageCount: number, page: number): number {
  const p = Math.max(0, Math.min(pageCount - 1, page));
  return clampView(mode, pageCount, mode === 'double' ? Math.ceil(p / 2) : p);
}

/** Página "principal" de una vista (la que se usa para enlaces y contador). */
export function primaryPage(mode: FlipMode, pageCount: number, view: number): number {
  const visible = pagesInView(mode, pageCount, view).filter((p): p is number => p !== null);
  return visible[0] ?? 0;
}

/** Convierte la vista entre modos conservando la página que el lector ve. */
export function convertView(from: FlipMode, to: FlipMode, pageCount: number, view: number): number {
  if (from === to) return clampView(to, pageCount, view);
  return viewForPage(to, pageCount, primaryPage(from, pageCount, view));
}

/** Hoja que gira al pasar de `from` a `from ± 1`. */
export function leafForTurn(from: number, direction: 1 | -1): number {
  return direction === 1 ? from : from - 1;
}

/**
 * Ángulo (grados, 0 → -180) de cada hoja.
 * `turning` describe una hoja en movimiento con progreso 0–1.
 */
export function leafAngle(
  leaf: number,
  view: number,
  turning?: { leaf: number; direction: 1 | -1; progress: number } | null,
): number {
  if (turning && turning.leaf === leaf) {
    const p = Math.max(0, Math.min(1, turning.progress));
    return turning.direction === 1 ? -180 * p : -180 * (1 - p);
  }
  return leaf < view ? -180 : 0;
}

/**
 * Orden de apilamiento. Las hojas sin girar se apilan con la primera arriba;
 * las giradas con la última arriba. La hoja en movimiento siempre queda encima.
 */
export function leafZIndex(leaf: number, total: number, angle: number, isTurning: boolean): number {
  if (isTurning) return total * 2 + 10;
  return angle <= -90 ? leaf + 1 : total * 2 - leaf;
}

/** Hojas que deben renderizar contenido (ventana alrededor de la vista). */
export function isLeafNear(leaf: number, view: number, radius = 2): boolean {
  return leaf >= view - radius - 1 && leaf <= view + radius;
}

/** Curva de aceleración del giro (suave al inicio y al final). */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Calcula el tamaño de página que cabe en el área disponible. */
export function fitPageSize(
  availableWidth: number,
  availableHeight: number,
  ratio: number,
  mode: FlipMode,
): { width: number; height: number } {
  const columns = mode === 'double' ? 2 : 1;
  const maxW = Math.max(0, availableWidth / columns);
  const maxH = Math.max(0, availableHeight);
  let width = maxW;
  let height = width / ratio;
  if (height > maxH) {
    height = maxH;
    width = height * ratio;
  }
  return { width: Math.floor(width), height: Math.floor(height) };
}
