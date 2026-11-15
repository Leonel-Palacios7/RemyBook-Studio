import { describe, expect, it } from 'vitest';
import { createShape } from '@/content/factories';
import { applyInteraction, type Interaction } from './geometry';

const base = (over: Partial<Interaction> = {}): Interaction => ({
  kind: 'move',
  pointerId: 1,
  startX: 0,
  startY: 0,
  origin: createShape('rect', { x: 10, y: 10, w: 20, h: 20 }),
  pageWidth: 500,
  pageHeight: 1000,
  center: { x: 100, y: 100 },
  ...over,
});

describe('geometría del editor', () => {
  it('mueve en porcentajes de la página', () => {
    const { patch } = applyInteraction(base(), 50, 100, false);
    expect(patch).toEqual({ x: 20, y: 20 });
  });

  it('se ajusta al centro de la página', () => {
    // Centro del elemento = 10 + 20/2 + dx; con dx ≈ 29.6 % queda a 0.4 % del centro.
    const { patch, snapped } = applyInteraction(base(), 148, 0, false);
    expect(patch.x).toBe(40);
    expect(snapped.v).toBe(true);
  });

  it('redimensiona desde la esquina inferior derecha', () => {
    const { patch } = applyInteraction(base({ kind: 'resize', handle: 'se' }), 50, 100, false);
    expect(patch).toMatchObject({ x: 10, y: 10, w: 30, h: 30 });
  });

  it('redimensiona desde la esquina superior izquierda moviendo el origen', () => {
    const { patch } = applyInteraction(base({ kind: 'resize', handle: 'nw' }), 25, 50, false);
    expect(patch).toMatchObject({ x: 15, y: 15, w: 15, h: 15 });
  });

  it('mantiene la proporción con Mayús', () => {
    const { patch } = applyInteraction(base({ kind: 'resize', handle: 'se' }), 100, 0, true);
    expect(patch.w).toBe(40);
    expect(patch.h).toBe(40);
  });

  it('no permite tamaños menores al mínimo', () => {
    const { patch } = applyInteraction(base({ kind: 'resize', handle: 'e' }), -1000, 0, false);
    expect(patch.w).toBe(1);
  });

  it('rota alrededor del centro y ajusta a 15° con Mayús', () => {
    const right = applyInteraction(base({ kind: 'rotate' }), 200, 100, false);
    expect(right.patch.rotation).toBe(90);
    const snapped = applyInteraction(base({ kind: 'rotate' }), 200, 107, true);
    expect(snapped.patch.rotation).toBe(90);
  });
});
