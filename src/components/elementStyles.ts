import type { CSSProperties } from 'react';
import type { PageElement, TextElement } from '@/domain/types';
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
  };
}

