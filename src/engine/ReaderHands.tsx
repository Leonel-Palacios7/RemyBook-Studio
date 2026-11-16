import { memo, useId, type CSSProperties } from 'react';
import type { FlipMode } from './layout';
import type { HandsLook } from './hands';

/**
 * Manos ilustradas (dibujo vectorial original) que sostienen el libro por los
 * lados y acompañan la hoja mientras gira, como si una persona estuviera
 * leyendo. Son decorativas: no reciben eventos ni se anuncian a lectores
 * de pantalla.
 */

/** Tamaño del dibujo y punto de agarre (borde de la página) en sus coordenadas. */
const VB = { w: 240, h: 200 };
const GRIP = { x: 70, y: 100 };

function HandSvg({ look }: { look: HandsLook }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width="100%" height="100%" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`skin${id}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={look.tone} />
          <stop offset="1" stopColor={look.tone} stopOpacity="0.92" />
        </linearGradient>
        <linearGradient id={`shade${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <filter id={`soft${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>
      {/* Sombra del pulgar sobre la página */}
      <path
        d="M101 134 C83 132 53 124 31 118 C17 114 13 102 25 98 C39 94 65 102 87 110 C99 114 107 122 101 134 Z"
        fill="#000"
        opacity="0.22"
        filter={`url(#soft${id})`}
      />
      {/* Antebrazo */}
      <path d="M118 118 C150 132 200 146 240 154 L240 200 L152 200 C136 180 120 160 108 140 Z" fill={`url(#skin${id})`} />
      {/* Dorso de la mano */}
      <path
        d="M64 70 C68 50 96 42 122 48 C152 55 174 76 176 102 C178 130 162 152 136 160 C110 166 80 156 68 134 C60 118 60 88 64 70 Z"
        fill={`url(#skin${id})`}
      />
      <path
        d="M64 70 C68 50 96 42 122 48 C152 55 174 76 176 102 C178 130 162 152 136 160 C110 166 80 156 68 134 C60 118 60 88 64 70 Z"
        fill={`url(#shade${id})`}
      />
      {/* Nudillos (los dedos quedan detrás de la hoja) */}
      <g fill="none" stroke="#000" strokeOpacity="0.13" strokeWidth="2.2" strokeLinecap="round">
        <path d="M70 76 C80 73 92 75 101 80" />
        <path d="M68 95 C80 93 92 95 102 99" />
        <path d="M69 114 C80 113 92 116 101 120" />
      </g>
      {/* Pulgar sobre la página */}
      <path
        d="M98 128 C80 126 50 118 28 112 C14 108 10 96 22 92 C36 88 62 96 84 104 C96 108 104 116 98 128 Z"
        fill={`url(#skin${id})`}
      />
      <path d="M98 128 C80 126 50 118 28 112 C40 112 70 116 98 122 Z" fill="#000" opacity="0.08" />
      <ellipse cx="24" cy="99.5" rx="8" ry="4.6" fill="#fff" opacity="0.38" transform="rotate(-12 24 99.5)" />
      {/* Manga */}
      <path d="M196 146 C212 150 228 153 240 155 L240 200 L178 200 C184 182 190 164 196 146 Z" fill={look.sleeve} />
      <path d="M196 146 C190 164 184 182 178 200 L186 200 C192 182 198 164 204 148 Z" fill="#000" opacity="0.18" />
    </svg>
  );
}

interface Props {
  mode: FlipMode;
  pageWidth: number;
  pageHeight: number;
  /** Páginas visibles a izquierda y derecha. */
  hasLeft: boolean;
  hasRight: boolean;
  /** Hoja en movimiento: ángulo actual (0 → -180) y sentido. */
  turn: { angle: number; direction: 1 | -1 } | null;
  look: HandsLook;
}

export const ReaderHands = memo(function ReaderHands({ mode, pageWidth, pageHeight, hasLeft, hasRight, turn, look }: Props) {
  const scale = (pageWidth * (mode === 'double' ? 0.48 : 0.42)) / VB.w;
  const w = VB.w * scale;
  const h = VB.h * scale;
  const gripY = pageHeight * 0.66;
  const spine = mode === 'double' ? pageWidth : 0;
  const rightEdge = mode === 'double' ? pageWidth * 2 : pageWidth;

  /** Posición de una mano anclada a un borde vertical en `edgeX`. */
  const place = (edgeX: number, side: 'left' | 'right', lift = 0, tilt = 0): CSSProperties => {
    const anchorX = side === 'right' ? GRIP.x * scale : (VB.w - GRIP.x) * scale;
    return {
      width: w,
      height: h,
      left: edgeX - anchorX,
      top: gripY - GRIP.y * scale - lift,
      transform: `${side === 'left' ? 'scaleX(-1) ' : ''}rotate(${tilt}deg)`,
    };
  };

  // Mientras gira, la mano del lado que empuja sigue el borde libre de la hoja.
  let right: CSSProperties | null = hasRight ? place(rightEdge, 'right') : null;
  let left: CSSProperties | null = mode === 'double' && hasLeft ? place(0, 'left') : null;
  let following: 'left' | 'right' | null = null;

  if (turn) {
    const theta = (Math.abs(turn.angle) * Math.PI) / 180;
    const edgeX = spine + pageWidth * Math.cos(theta);
    const lift = Math.sin(theta) * pageHeight * 0.07;
    const progress = turn.direction === 1 ? Math.abs(turn.angle) / 180 : 1 - Math.abs(turn.angle) / 180;
    // La mano acompaña la hoja hasta casi el final y luego regresa a su lugar.
    if (progress < 0.82) {
      if (turn.direction === 1) {
        right = place(edgeX, 'right', lift, -Math.sin(theta) * 14);
        following = 'right';
      } else if (mode === 'double') {
        left = place(edgeX, 'left', lift, -Math.sin(theta) * 14);
        following = 'left';
      }
    }
  }

  return (
    <div className="fb-hands" aria-hidden="true">
      {left && (
        <div className={`fb-hand is-left${following === 'left' ? ' is-following' : ''}`} style={left}>
          <HandSvg look={look} />
        </div>
      )}
      {right && (
        <div className={`fb-hand is-right${following === 'right' ? ' is-following' : ''}`} style={right}>
          <HandSvg look={look} />
        </div>
      )}
    </div>
  );
});
