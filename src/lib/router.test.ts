import { describe, expect, it } from 'vitest';
import { buildHash, parseHash } from './router';

describe('router por hash', () => {
  it('interpreta rutas del lector y del editor', () => {
    expect(parseHash('#/leer?p=5')).toEqual({ name: 'read', page: 4 });
    expect(parseHash('#/editar?p=2')).toEqual({ name: 'edit', page: 1 });
    expect(parseHash('')).toEqual({ name: 'read', page: 0 });
    expect(parseHash('#/leer?p=-4')).toEqual({ name: 'read', page: 0 });
    expect(parseHash('#/leer?p=abc')).toEqual({ name: 'read', page: 0 });
  });

  it('genera enlaces profundos', () => {
    expect(buildHash({ name: 'read', page: 2 })).toBe('#/leer?p=3');
    expect(buildHash({ name: 'edit', page: 0 })).toBe('#/editar?p=1');
  });
});
