import { describe, expect, it } from 'vitest';
import { clamp, safeColor, safeImageUrl } from './sanitize';

describe('sanitize', () => {
  it('permite https, data:image y rutas relativas', () => {
    expect(safeImageUrl('https://example.org/a.png')).toBe('https://example.org/a.png');
    expect(safeImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=');
    expect(safeImageUrl('./assets/foto.webp')).toBe('./assets/foto.webp');
  });

  it('bloquea esquemas peligrosos', () => {
    expect(safeImageUrl('javascript:alert(1)')).toBe('');
    expect(safeImageUrl('data:text/html;base64,PHNjcmlwdD4=')).toBe('');
    expect(safeImageUrl('http://inseguro.com/a.png')).toBe('');
    expect(safeImageUrl('vbscript:x')).toBe('');
    expect(safeImageUrl('')).toBe('');
  });

  it('valida colores', () => {
    expect(safeColor('#39A900')).toBe('#39A900');
    expect(safeColor('rgb(1, 2, 3)')).toBe('rgb(1, 2, 3)');
    expect(safeColor('transparent')).toBe('transparent');
    expect(safeColor('red; background:url(x)', '#fff')).toBe('#fff');
    expect(safeColor('url(javascript:1)')).toBe('transparent');
  });

  it('limita números', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(Number.NaN, 1, 3)).toBe(1);
  });
});
