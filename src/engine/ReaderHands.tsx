import { memo, type CSSProperties } from 'react';
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

/** Tinta del contorno: café muy oscuro, más amable que el negro puro. */
const INK = '#2B1D12';

/**
 * Mano en estilo caricatura: colores planos, contorno grueso, tres dedos
 * gorditos que abrazan el borde de la hoja y el pulgar arriba. Dibujo original.
 */
function HandSvg({ look }: { look: HandsLook }) {
  const skin = look.tone;
  const finger = (y: number, w: number, tilt: number) => (
    <g transform={`rotate(${tilt} 92 ${y + 12.5})`}>
      <rect x={62} y={y} width={w} height={25} rx={12.5} fill={skin} />
      <path d={`M${72} ${y + 6} h${w * 0.38}`} stroke="#fff" strokeOpacity="0.55" strokeWidth="3.5" />
      <path d={`M${88} ${y + 7} q-3 6 0 12`} fill="none" strokeWidth="2.6" strokeOpacity="0.55" />
    </g>
  );
  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width="100%" height="100%" aria-hidden="true" focusable="false">
      <g stroke={INK} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        {/* Sombra plana de los dedos sobre la página */}
        <path d="M58 76 h18 v76 h-18 q-10 -38 0 -76 Z" fill="#000" opacity="0.12" stroke="none" />
        {/* Antebrazo */}
        <path d="M146 88 C172 96 194 108 214 120 L200 186 C178 174 156 160 134 146 Z" fill={skin} />
        {/* Manga con puño */}
        <path d="M204 108 Q224 100 244 98 L244 206 L184 206 Q188 152 204 108 Z" fill={look.sleeve} />
        <path d="M204 108 Q214 104 222 102 Q206 150 202 206 L184 206 Q188 152 204 108 Z" fill="#fff" opacity="0.28" stroke="none" />
        <path d="M222 102 Q206 150 202 206" fill="none" strokeWidth="3.5" />
        {/* Dorso de la mano */}
        <path d="M96 68 C108 50 144 48 162 68 C178 88 176 122 160 142 C144 158 110 156 98 140 Z" fill={skin} />
        <path d="M150 62 C164 74 170 92 168 110" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="4" />
        {/* Tres dedos que abrazan el borde de la hoja (de abajo hacia arriba) */}
        {finger(116, 54, 4)}
        {finger(91, 60, 0)}
        {finger(66, 58, -4)}
        {/* Pulgar arriba */}
        <g transform="rotate(-24 112 58)">
          <rect x={84} y={46} width={58} height={25} rx={12.5} fill={skin} />
          <path d="M94 52 h20" stroke="#fff" strokeOpacity="0.55" strokeWidth="3.5" />
        </g>
      </g>
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
