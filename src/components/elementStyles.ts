import type { CSSProperties } from 'react';
import type { ImageMask, PageElement, ShapeElement, TextElement } from '@/domain/types';
import { safeColor } from '@/lib/sanitize';

/** Estilo de posicionamiento común (porcentajes de la página). */
export function elementBoxStyle(el: PageElement): CSSProperties {
  return {
    left: `${el.x}%`,
    top: `${el.y}%`,
    width: `${el.w}%`,
    height: `${el.h}%`,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    opacity: el.opacity,
  };
}

/** Estilos tipográficos de un elemento de texto (compartidos con el editor). */
export function textStyle(el: TextElement): CSSProperties {
  return {
    fontSize: `${el.fontSize}cqw`,
    fontFamily: el.fontFamily,
    fontWeight: el.fontWeight,
    fontStyle: el.italic ? 'italic' : 'normal',
    textDecoration: el.underline ? 'underline' : 'none',
    color: safeColor(el.color, '#000'),
    background: safeColor(el.background),
    textAlign: el.align,
    lineHeight: el.lineHeight,
    padding: `${el.padding}cqw`,
    borderRadius: `${el.radius}cqw`,
    letterSpacing: el.letterSpacing ? `${el.letterSpacing}em` : undefined,
    textTransform: el.uppercase ? 'uppercase' : undefined,
  };
}


/**
 * Recortes de imagen. Se usan radios enormes (se reducen proporcionalmente
 * según el tamaño real) y clip-path con porcentajes, así la silueta se
 * conserva a cualquier escala.
 */
export function maskStyle(mask: ImageMask | undefined, radius: number): CSSProperties {
  switch (mask) {
    case 'arch':
      return { borderRadius: '9999px 9999px 0 0' };
    case 'circle':
      return { borderRadius: '50%' };
    case 'pill':
      return { borderRadius: '9999px' };
    case 'blob':
      return { borderRadius: '62% 38% 55% 45% / 48% 58% 42% 52%' };
    case 'leaf':
      return { borderRadius: '0 9999px 0 9999px' };
    case 'hexagon':
      return { clipPath: 'polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0% 50%)' };
    case 'diamond':
      return { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
    default:
      return { borderRadius: `${radius}cqw` };
  }
}

/** Relleno sólido o degradado de una forma. */
export function shapeFill(el: ShapeElement): string {
  const from = safeColor(el.fill);
  if (!el.fillTo) return from;
  return `linear-gradient(${el.gradientAngle ?? 180}deg, ${from}, ${safeColor(el.fillTo)})`;
}
