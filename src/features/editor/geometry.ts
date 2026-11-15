import type { PageElement } from '@/domain/types';

export type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export interface Interaction {
  kind: 'move' | 'resize' | 'rotate';
  handle?: Handle;
  pointerId: number;
  startX: number;
  startY: number;
  origin: PageElement;
  pageWidth: number;
  pageHeight: number;
  /** Centro del elemento en coordenadas de pantalla (para rotar). */
  center: { x: number; y: number };
}

const SNAP = 1; // % de tolerancia para las guías
const MIN = 1; // tamaño mínimo en %

/** Ajusta un valor a un objetivo si está dentro de la tolerancia. */
function snapTo(value: number, targets: number[]): { value: number; hit: boolean } {
  for (const t of targets) if (Math.abs(value - t) <= SNAP) return { value: t, hit: true };
  return { value, hit: false };
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Calcula el cambio de un elemento durante mover / redimensionar / rotar.
 * Función pura: recibe la interacción y la posición del puntero.
 */
export function applyInteraction(
  a: Interaction,
  clientX: number,
  clientY: number,
  shift: boolean,
): { patch: Partial<PageElement>; snapped: { v: boolean; h: boolean } } {
  const o = a.origin;
  const dx = ((clientX - a.startX) / Math.max(1, a.pageWidth)) * 100;
  const dy = ((clientY - a.startY) / Math.max(1, a.pageHeight)) * 100;

  if (a.kind === 'move') {
    // Guías: centro de página y bordes.
    const cx = snapTo(o.x + dx + o.w / 2, [50]);
    const cy = snapTo(o.y + dy + o.h / 2, [50]);
    let x = cx.value - o.w / 2;
    let y = cy.value - o.h / 2;
    if (!cx.hit) x = snapTo(x, [0, 100 - o.w]).value;
    if (!cy.hit) y = snapTo(y, [0, 100 - o.h]).value;
    return { patch: { x: round(x), y: round(y) }, snapped: { v: cx.hit, h: cy.hit } };
  }

  if (a.kind === 'rotate') {
    const angle = (Math.atan2(clientY - a.center.y, clientX - a.center.x) * 180) / Math.PI + 90;
    let rotation = ((angle + 540) % 360) - 180;
    if (shift) rotation = Math.round(rotation / 15) * 15;
    return { patch: { rotation: round(rotation) }, snapped: { v: false, h: false } };
  }

  // Redimensionar
  const h = a.handle ?? 'se';
  let { x, y, w, h: height } = o;
  if (h.includes('e')) w = o.w + dx;
  if (h.includes('w')) {
    w = o.w - dx;
    x = o.x + dx;
  }
  if (h.includes('s')) height = o.h + dy;
  if (h.includes('n')) {
    height = o.h - dy;
    y = o.y + dy;
  }
  // Mayús en esquinas: mantener proporción.
  if (shift && h.length === 2 && o.w > 0 && o.h > 0) {
    const scale = Math.max(w / o.w, height / o.h);
    const nw = o.w * scale;
    const nh = o.h * scale;
    if (h.includes('w')) x = o.x + o.w - nw;
    if (h.includes('n')) y = o.y + o.h - nh;
    w = nw;
    height = nh;
  }
  if (w < MIN) {
    if (h.includes('w')) x -= MIN - w;
    w = MIN;
  }
  if (height < MIN) {
    if (h.includes('n')) y -= MIN - height;
    height = MIN;
  }
  return { patch: { x: round(x), y: round(y), w: round(w), h: round(height) }, snapped: { v: false, h: false } };
}
