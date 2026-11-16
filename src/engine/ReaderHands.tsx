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

/**
 * Filtro de volumen: usa la silueta difuminada como mapa de relieve y la ilumina
 * (luz difusa + brillo especular) para que cada parte se vea redondeada, como
 * en 3D. Añade un grano muy fino que imita la textura de la piel.
 */
function VolumeFilter({ id, blur, depth, azimuth, gloss }: { id: string; blur: number; depth: number; azimuth: number; gloss: number }) {
  return (
    <filter id={id} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation={blur} result="bump" />
      <feDiffuseLighting in="bump" surfaceScale={depth} diffuseConstant="1.2" lightingColor="#ffffff" result="diffuse">
        <feDistantLight azimuth={azimuth} elevation="48" />
      </feDiffuseLighting>
      <feComposite in="SourceGraphic" in2="diffuse" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="lit" />
      <feSpecularLighting in="bump" surfaceScale={depth} specularConstant={gloss} specularExponent="24" lightingColor="#fff6ee" result="spec">
        <feDistantLight azimuth={azimuth} elevation="48" />
      </feSpecularLighting>
      <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn" />
      <feComposite in="lit" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.45" k4="0" result="shiny" />
      <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="7" result="noise" />
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.16  0 0 0 0 0.08  0 0 0 -0.5 0.3" result="grain" />
      <feComposite in="grain" in2="SourceAlpha" operator="in" result="grainIn" />
      <feBlend in="grainIn" in2="shiny" mode="multiply" />
    </filter>
  );
}

function HandSvg({ look, mirrored }: { look: HandsLook; mirrored: boolean }) {
  const id = useId().replace(/:/g, '');
  const skin = look.tone;
  const warm = shade(skin, 0.12);
  const dark = shade(skin, -0.22);
  const deep = shade(skin, -0.42);
  const crease = shade(skin, -0.55);
  const nail = shade(skin, 0.5);
  const nailBed = shade(skin, 0.3);
  // La mano izquierda se dibuja en espejo: se corrige la luz para que siempre venga de arriba a la izquierda.
  const az = mirrored ? 315 : 225;
  const f = (name: string) => `url(#${name}${id})`;
  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width="100%" height="100%" aria-hidden="true" focusable="false">
      <defs>
        <VolumeFilter id={`volS${id}`} blur={5} depth={6} azimuth={az} gloss={0.5} />
        <VolumeFilter id={`volL${id}`} blur={11} depth={9} azimuth={az} gloss={0.35} />
        <linearGradient id={`skin${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={warm} />
          <stop offset="1" stopColor={skin} />
        </linearGradient>
        <linearGradient id={`behind${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skin} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient id={`nail${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={nail} />
          <stop offset="1" stopColor={nailBed} />
        </linearGradient>
        <linearGradient id={`fadeG${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.8" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`fade${id}`}>
          <rect width={VB.w} height={VB.h} fill={f('fadeG')} />
        </mask>
        <filter id={`soft${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={`contact${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>
      <g mask={f('fade')}>
        {/* Sombra difusa sobre la página y sombra de contacto bajo la yema */}
        <path
          d="M130 220 C110 198 84 172 58 150 C42 136 24 124 20 112 C16 98 28 90 42 94 C60 100 84 120 104 138 C150 140 196 178 196 228 C196 268 186 300 182 320 L118 320 Z"
          fill="#000"
          opacity="0.3"
          filter={f('soft')}
          transform="translate(7 10)"
        />
        <ellipse cx="34" cy="112" rx="16" ry="7" transform="rotate(38 34 112)" fill="#000" opacity="0.35" filter={f('contact')} />

        {/* Dedos doblados por detrás del borde de la hoja */}
        <g filter={f('volS')}>
          <path d="M130 158 C129 140 133 126 145 125 C157 124 161 137 161 151 L161 170 Z" fill={f('behind')} />
        </g>
        <g filter={f('volS')}>
          <path d="M105 150 C103 129 107 112 119 110 C131 108 137 120 137 135 L139 154 Z" fill={f('behind')} />
        </g>
        <g filter={f('volS')}>
          <path d="M81 152 C77 129 75 108 77 94 C79 81 94 79 98 92 C102 108 106 131 111 154 Z" fill={f('skin')} />
        </g>
        <path d="M83 101 C87 98 93 98 97 101" fill="none" stroke={crease} strokeOpacity="0.45" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M82 106 C86 104 91 104 95 106" fill="none" stroke={crease} strokeOpacity="0.3" strokeWidth="1.1" strokeLinecap="round" />

        {/* Pulgar: falange proximal y distal sobre la página */}
        <g filter={f('volS')}>
          <path
            d="M120 224 C104 200 80 170 56 146 C40 132 22 120 18 108 C14 94 26 86 40 90 C58 96 82 116 102 134 C114 146 122 158 128 172 Z"
            fill={f('skin')}
          />
        </g>
        {/* Dorso, muñeca y antebrazo con volumen amplio */}
        <g filter={f('volL')}>
          <path
            d="M82 146 C94 134 134 134 158 142 C180 152 190 182 188 214 C186 248 176 278 172 320 L106 320 C104 280 96 248 88 212 C82 190 79 166 82 146 Z"
            fill={f('skin')}
          />
        </g>
        {/* Nudillos y tendones */}
        <g fill="none" stroke={deep} strokeOpacity="0.16" strokeWidth="6" strokeLinecap="round" filter={f('contact')}>
          <path d="M118 158 C126 186 134 212 140 240" />
          <path d="M142 158 C149 184 155 210 158 238" />
        </g>
        <g fill="none" stroke={crease} strokeOpacity="0.3" strokeWidth="1.2" strokeLinecap="round">
          <path d="M94 150 C98 147 104 147 108 150" />
          <path d="M117 145 C121 142 127 142 131 145" />
          <path d="M140 150 C144 147 150 147 153 150" />
        </g>

        {/* Pliegues de la articulación */}
        <g fill="none" stroke={crease} strokeLinecap="round">
          <path d="M64 128 C68 126 74 128 77 134" strokeOpacity="0.5" strokeWidth="1.5" />
          <path d="M60 133 C64 132 69 134 72 139" strokeOpacity="0.4" strokeWidth="1.3" />
          <path d="M68 124 C71 123 74 124 76 127" strokeOpacity="0.35" strokeWidth="1.1" />
        </g>
        {/* Uña con lúnula, cutícula y brillo */}
        <path d="M21 104 C21 95 31 92 40 97 C48 101 49 110 43 114 C36 118 24 113 21 104 Z" fill={f('nail')} />
        <path d="M40 97 C46 100 48 106 46 111 C44 106 42 101 37 98 Z" fill="#fff" opacity="0.35" />
        <path d="M43 114 C38 113 36 109 38 106 C41 107 44 110 45 113 Z" fill="#fff" opacity="0.4" />
        <path d="M21 104 C21 95 31 92 40 97 C48 101 49 110 43 114 C36 118 24 113 21 104 Z" fill="none" stroke={crease} strokeOpacity="0.45" strokeWidth="1.2" />
        <path d="M25 100 C29 96 35 96 40 99" fill="none" stroke="#fff" strokeOpacity="0.75" strokeWidth="1.6" strokeLinecap="round" />

        {/* Manga con pliegues */}
        <g filter={f('volL')}>
          <path d="M94 288 C126 280 160 278 194 284 L200 320 L90 320 Z" fill={look.sleeve} />
        </g>
        <g fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="2" strokeLinecap="round">
          <path d="M120 292 C124 302 126 312 126 320" />
          <path d="M162 290 C160 300 160 310 162 320" />
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
    const x = edgeX - anchorX;
    const y = gripY - GRIP.y * scale - lift;
    // Solo `transform` y `opacity`: la tarjeta gráfica mueve la mano sin volver a pintarla.
    return {
      width: w,
      height: h,
      transform: `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) ${side === 'left' ? 'scaleX(-1) ' : ''}rotate(${(tilt * sign).toFixed(2)}deg)`,
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
          <HandSvg look={look} mirrored />
        </div>
      )}
      <div className="fb-hand is-right" style={place(rightX, 'right', rightLift, rightTilt, hasRight)}>
        <HandSvg look={look} mirrored={false} />
      </div>
    </div>
  );
});
