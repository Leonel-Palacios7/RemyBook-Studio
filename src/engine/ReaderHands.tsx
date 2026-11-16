import { memo, useId, type CSSProperties } from 'react';
import type { FlipMode } from './layout';
import type { HandsLook } from './hands';

/**
 * Manos del lector (ilustración vectorial original) vistas desde arriba, como
 * cuando alguien sostiene un libro abierto: el pulgar descansa sobre la hoja,
 * los demás dedos quedan por detrás del borde y el antebrazo entra desde abajo.
 * Al pasar página, la mano levanta la esquina, acompaña la hoja y la suelta
 * con un movimiento continuo; la otra mano la recibe con una leve presión.
 * Son decorativas: no reciben eventos ni se anuncian a lectores de pantalla.
 */

/** Tamaño del dibujo y punto de agarre (borde exterior de la página) en sus coordenadas. */
const VB = { w: 220, h: 320 };
const GRIP = { x: 70, y: 150 };

/** Mezcla un color hexadecimal con blanco (t > 0) o negro (t < 0). */
function shade(hex: string, t: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = Number.parseInt(m[1]!, 16);
  const target = t > 0 ? 255 : 0;
  const k = Math.abs(t);
  const ch = (v: number) => Math.round(v + (target - v) * k);
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function HandSvg({ look }: { look: HandsLook }) {
  const id = useId().replace(/:/g, '');
  const skin = look.tone;
  const light = shade(skin, 0.22);
  const dark = shade(skin, -0.28);
  const deep = shade(skin, -0.45);
  const crease = shade(skin, -0.5);
  const nail = shade(skin, 0.45);
  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width="100%" height="100%" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`back${id}`} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor={light} />
          <stop offset="0.45" stopColor={skin} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient id={`thumb${id}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="0.55" stopColor={skin} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient id={`behind${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={dark} />
          <stop offset="0.5" stopColor={skin} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
        <radialGradient id={`glow${id}`} cx="0.35" cy="0.3" r="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`fadeG${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.8" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`fade${id}`}>
          <rect width={VB.w} height={VB.h} fill={`url(#fadeG${id})`} />
        </mask>
        <filter id={`soft${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <g mask={`url(#fade${id})`}>
        {/* Sombra suave de la mano sobre la página y la mesa */}
        <path
          d="M130 220 C110 198 84 172 58 150 C42 136 24 124 20 112 C16 98 28 90 42 94 C60 100 84 120 104 138 C150 140 196 178 196 228 C196 268 186 300 182 320 L118 320 Z"
          fill="#000"
          opacity="0.28"
          filter={`url(#soft${id})`}
          transform="translate(6 9)"
        />
        {/* Dedos doblados por detrás del borde de la hoja: solo asoman los nudillos */}
        <path d="M130 156 C130 138 134 126 145 125 C156 124 160 136 160 150 L160 168 Z" fill={`url(#behind${id})`} />
        <path d="M106 148 C104 128 108 112 119 110 C130 108 136 119 136 134 L138 152 Z" fill={`url(#behind${id})`} />
        <path d="M82 150 C78 128 76 108 78 94 C80 82 94 80 98 92 C102 108 106 130 110 152 Z" fill={`url(#back${id})`} />
        <path d="M84 100 C88 97 93 97 97 100" fill="none" stroke={crease} strokeOpacity="0.4" strokeWidth="1.6" strokeLinecap="round" />
        {/* Dorso de la mano, muñeca y antebrazo */}
        <path
          d="M82 146 C94 134 134 134 158 142 C180 152 190 182 188 214 C186 248 176 278 172 320 L106 320 C104 280 96 248 88 212 C82 190 79 166 82 146 Z"
          fill={`url(#back${id})`}
        />
        <path d="M82 146 C94 134 134 134 158 142 C180 152 190 182 188 214 C170 192 140 180 110 186 C96 188 86 170 82 146 Z" fill={`url(#glow${id})`} />
        {/* Tendones y nudillos, muy sutiles */}
        <g fill="none" stroke={deep} strokeOpacity="0.22" strokeWidth="2.2" strokeLinecap="round">
          <path d="M118 150 C126 180 134 210 140 240" />
          <path d="M140 150 C148 178 154 206 158 236" />
          <path d="M104 152 C110 156 118 156 124 152" />
          <path d="M132 146 C138 150 146 150 152 146" />
        </g>
        {/* Pulgar apoyado sobre la página */}
        <path
          d="M128 216 C108 194 82 168 56 146 C40 132 22 120 18 108 C14 94 26 86 40 90 C58 96 82 116 102 134 C118 148 132 164 142 184 Z"
          fill={`url(#thumb${id})`}
        />
        <path d="M128 216 C108 194 82 168 56 146 C70 162 98 192 118 214 Z" fill={deep} opacity="0.22" filter={`url(#soft${id})`} />
        {/* Uña */}
        <path d="M21 104 C21 95 31 92 40 97 C48 101 49 110 43 114 C36 118 24 113 21 104 Z" fill={nail} />
        <path d="M23 101 C27 96 35 96 41 99" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M41 114 C46 112 48 107 47 102" fill="none" stroke={crease} strokeOpacity="0.4" strokeWidth="1.4" strokeLinecap="round" />
        {/* Pliegues de la articulación del pulgar */}
        <g fill="none" stroke={crease} strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round">
          <path d="M66 132 C70 130 76 132 78 138" />
          <path d="M62 137 C66 136 71 138 73 143" />
          <path d="M69 128 C72 127 75 128 77 131" />
        </g>
        {/* Manga */}
        <path d="M96 288 C126 280 160 278 192 284 L198 320 L92 320 Z" fill={look.sleeve} />
        <path d="M96 288 C126 280 160 278 192 284 L193 294 C160 288 126 290 97 298 Z" fill="#000" opacity="0.2" />
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

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Curva suave (0 → 1) entre `a` y `b`. */
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export const ReaderHands = memo(function ReaderHands({ mode, pageWidth, pageHeight, hasLeft, hasRight, turn, look }: Props) {
  const scale = (pageWidth * (mode === 'double' ? 0.44 : 0.42)) / VB.w;
  const w = VB.w * scale;
  const h = VB.h * scale;
  const gripY = pageHeight * 0.84;
  const spine = mode === 'double' ? pageWidth : 0;
  const rightEdge = mode === 'double' ? pageWidth * 2 : pageWidth;

  /** Posición de una mano anclada a un borde vertical en `edgeX`. */
  const place = (edgeX: number, side: 'left' | 'right', lift: number, tilt: number, visible: boolean): CSSProperties => {
    const anchorX = side === 'right' ? GRIP.x * scale : (VB.w - GRIP.x) * scale;
    const sign = side === 'right' ? 1 : -1;
    return {
      width: w,
      height: h,
      left: edgeX - anchorX,
      top: gripY - GRIP.y * scale - lift,
      transform: `${side === 'left' ? 'scaleX(-1) ' : ''}rotate(${tilt * sign}deg)`,
      opacity: visible ? 1 : 0,
    };
  };

  let rightX = rightEdge;
  let leftX = 0;
  let rightLift = 0;
  let leftLift = 0;
  let rightTilt = 0;
  let leftTilt = 0;

  if (turn) {
    const theta = (Math.abs(turn.angle) * Math.PI) / 180;
    const edgeX = spine + pageWidth * Math.cos(theta);
    const progress = turn.direction === 1 ? Math.abs(turn.angle) / 180 : 1 - Math.abs(turn.angle) / 180;
    // La mano que pasa la hoja la acompaña al inicio y la suelta poco a poco:
    // la posición es una mezcla continua entre el borde de la hoja y el reposo.
    const follow = 1 - smooth(0.3, 0.92, progress);
    const lift = Math.sin(theta) * pageHeight * 0.06 * follow;
    const tilt = -Math.sin(theta) * 12 * follow;
    // La otra mano recibe la hoja con una leve presión hacia el lomo.
    const press = Math.sin(Math.PI * smooth(0.55, 1, progress)) * pageWidth * 0.035;
    if (turn.direction === 1) {
      rightX = rightEdge + (edgeX - rightEdge) * follow;
      rightLift = lift;
      rightTilt = tilt;
      leftX = press;
      leftLift = -press * 0.4;
    } else if (mode === 'double') {
      leftX = edgeX * follow;
      leftLift = lift;
      leftTilt = tilt;
      rightX = rightEdge - press;
      rightLift = -press * 0.4;
    }
  }

  return (
    <div className={`fb-hands${turn ? ' is-turning' : ''}`} aria-hidden="true">
      {mode === 'double' && (
        <div className="fb-hand is-left" style={place(leftX, 'left', leftLift, leftTilt, hasLeft)}>
          <HandSvg look={look} />
        </div>
      )}
      <div className="fb-hand is-right" style={place(rightX, 'right', rightLift, rightTilt, hasRight)}>
        <HandSvg look={look} />
      </div>
    </div>
  );
});
