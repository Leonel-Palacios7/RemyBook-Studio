import { describe, expect, it } from 'vitest';
import {
  clampView,
  convertView,
  easeInOutCubic,
  fitPageSize,
  getLeaves,
  leafAngle,
  leafCount,
  leafZIndex,
  maxView,
  pagesInView,
  primaryPage,
  viewForPage,
} from './layout';

describe('motor de giro: modelo de hojas', () => {
  it('agrupa las páginas en hojas de dos caras en modo doble', () => {
    expect(leafCount('double', 8)).toBe(4);
    expect(getLeaves('double', 5)).toEqual([
      { index: 0, front: 0, back: 1 },
      { index: 1, front: 2, back: 3 },
      { index: 2, front: 4, back: null },
    ]);
  });

  it('usa una hoja por página en modo sencillo', () => {
    expect(getLeaves('single', 3).map((l) => l.front)).toEqual([0, 1, 2]);
    expect(getLeaves('single', 3).every((l) => l.back === null)).toBe(true);
  });

  it('muestra la portada sola a la derecha y luego pares de páginas', () => {
    expect(pagesInView('double', 8, 0)).toEqual([null, 0]);
    expect(pagesInView('double', 8, 1)).toEqual([1, 2]);
    expect(pagesInView('double', 8, 4)).toEqual([7, null]);
    expect(pagesInView('single', 8, 3)).toEqual([3]);
  });

  it('calcula la última vista según la cantidad de páginas', () => {
    expect(maxView('double', 8)).toBe(4);
    expect(maxView('double', 7)).toBe(3);
    expect(maxView('single', 7)).toBe(6);
    expect(maxView('double', 0)).toBe(0);
  });

  it('limita la vista al rango válido', () => {
    expect(clampView('double', 8, -3)).toBe(0);
    expect(clampView('double', 8, 99)).toBe(4);
  });

  it('encuentra la vista que contiene una página', () => {
    expect(viewForPage('double', 8, 0)).toBe(0);
    expect(viewForPage('double', 8, 1)).toBe(1);
    expect(viewForPage('double', 8, 2)).toBe(1);
    expect(viewForPage('double', 8, 7)).toBe(4);
    expect(viewForPage('single', 8, 5)).toBe(5);
  });

  it('conserva la página visible al cambiar entre escritorio y móvil', () => {
    expect(primaryPage('double', 8, 2)).toBe(3);
    expect(convertView('double', 'single', 8, 2)).toBe(3);
    expect(convertView('single', 'double', 8, 4)).toBe(2);
  });

  it('calcula el ángulo de las hojas giradas y en movimiento', () => {
    expect(leafAngle(0, 1)).toBe(-180);
    expect(leafAngle(1, 1)).toBe(0);
    expect(leafAngle(1, 2, { leaf: 1, direction: 1, progress: 0.5 })).toBe(-90);
    expect(leafAngle(1, 1, { leaf: 1, direction: -1, progress: 0.25 })).toBe(-135);
  });

  it('apila las hojas como un libro real', () => {
    const total = 4;
    // Sin girar: la primera hoja queda encima.
    expect(leafZIndex(0, total, 0, false)).toBeGreaterThan(leafZIndex(1, total, 0, false));
    // Giradas: la última girada queda encima.
    expect(leafZIndex(2, total, -180, false)).toBeGreaterThan(leafZIndex(1, total, -180, false));
    // La hoja en movimiento siempre por encima de todas.
    expect(leafZIndex(1, total, -90, true)).toBeGreaterThan(leafZIndex(0, total, 0, false));
  });

  it('ajusta el tamaño de página al espacio disponible', () => {
    expect(fitPageSize(1000, 700, 0.5, 'double')).toEqual({ width: 350, height: 700 });
    expect(fitPageSize(300, 1000, 0.5, 'single')).toEqual({ width: 300, height: 600 });
  });

  it('la curva de aceleración va de 0 a 1', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
  });
});
