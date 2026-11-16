import { memo, type CSSProperties } from 'react';
import type { FlipMode } from './layout';

/**
 * Manito de cursor (dibujo vectorial original al estilo del puntero clásico):
 * en reposo señala la esquina de la hoja que se puede pasar y, al girar, cambia
 * a puño y arrastra el borde de la hoja; al terminar vuelve a su lugar.
 * Es decorativa: no recibe eventos ni se anuncia a lectores de pantalla.
 */

/** Dibujo en una cuadrícula de 24 × 28 y punto de anclaje de cada pose. */
const VB = { w: 24, h: 28 };
const ANCHOR = { point: { x: 11.2, y: 1 }, grab: { x: 12.4, y: 10.6 } };

function PointHand() {
  return (
    <>
      <path
        d="M9.5 2.3c0-1 .8-1.8 1.75-1.8S13 1.3 13 2.3V11l.45-.1c.35-1.15 2-1.3 2.45-.15l.2.5c.6-.95 2.15-.75 2.45.4l.1.4c.75-.6 2.05-.3 2.25.85.3 1.7.3 4.1-.1 6.3-.4 2.1-1.3 3.6-2.2 4.8V27h-8.3v-2.4c-1.5-1.3-3.7-4-5.1-6.3-.9-1.4-.8-2.7.2-3.3.9-.6 2.1-.2 2.9.8l1.2 1.4Z"
        fill="#fff"
        stroke="#111"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <g stroke="#111" strokeWidth="1" strokeLinecap="round">
        <path d="M13.4 11.4v4.2M15.9 11.6v4M18.4 12v3.6" />
      </g>
    </>
  );
}

function GrabHand() {
  return (
    <>
      <path
        d="M6.2 12.4c0-1.25 1.05-2.05 2.15-1.85.55-1.25 2.45-1.45 3.05 0 .65-1.05 2.55-1.05 3.05.3.7-.85 2.55-.65 2.95.7.95-.4 2.35.1 2.35 1.45V18c0 2.6-1 4.3-2.2 5.6V27H9.8v-2.6c-2.2-1.8-3.6-4.4-3.6-7.2Z"
        fill="#fff"
        stroke="#111"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <g stroke="#111" strokeWidth="1" strokeLinecap="round">
        <path d="M10.4 11v3.2M14.4 11.2v3.1M18.3 11.6v2.9" />
      </g>
    </>
  );
}

interface Props {
  mode: FlipMode;
  pageWidth: number;
  pageHeight: number;
  /** Se puede avanzar (esquina derecha) o retroceder (esquina izquierda). */
  canNext: boolean;
  canPrev: boolean;
  /** Hoja en movimiento: ángulo actual (0 → -180) y sentido. */
  turn: { angle: number; direction: 1 | -1 } | null;
}

export const ReaderHands = memo(function ReaderHands({ mode, pageWidth, pageHeight, canNext, canPrev, turn }: Props) {
  const h = Math.min(92, Math.max(36, pageWidth * 0.15));
  const scale = h / VB.h;
  const w = VB.w * scale;
  const spine = mode === 'double' ? pageWidth : 0;
  const rightEdge = mode === 'double' ? pageWidth * 2 : pageWidth;
  const inset = Math.min(pageWidth, pageHeight) * 0.05;
  const cornerY = pageHeight - inset;

  let pose: 'point' | 'grab' = 'point';
  let x: number;
  let y = cornerY;
  let tilt = -14;
  let visible = true;

  if (turn) {
    // Arrastra el borde libre de la hoja, levantándolo un poco a mitad del giro.
    const theta = (Math.abs(turn.angle) * Math.PI) / 180;
    pose = 'grab';
    x = spine + pageWidth * Math.cos(theta) - inset * turn.direction * Math.abs(Math.cos(theta));
    y = cornerY - Math.sin(theta) * pageHeight * 0.06;
    tilt = 0;
  } else if (canNext) {
    x = rightEdge - inset;
  } else if (canPrev && mode === 'double') {
    x = inset;
    tilt = 14;
  } else {
    x = rightEdge - inset;
    visible = false;
  }

  const anchor = ANCHOR[pose];
  const style: CSSProperties = {
    width: w,
    height: h,
    transform: `translate3d(${(x - anchor.x * scale).toFixed(2)}px, ${(y - anchor.y * scale).toFixed(2)}px, 0) rotate(${tilt}deg)`,
    transformOrigin: `${(anchor.x / VB.w) * 100}% ${(anchor.y / VB.h) * 100}%`,
    opacity: visible ? 1 : 0,
  };

  return (
    <div className={`fb-hands${turn ? ' is-turning' : ''}`} aria-hidden="true">
      <div className={`fb-hand is-${pose}`} style={style}>
        <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width="100%" height="100%" aria-hidden="true" focusable="false">
          {pose === 'point' ? <PointHand /> : <GrabHand />}
        </svg>
      </div>
    </div>
  );
});
