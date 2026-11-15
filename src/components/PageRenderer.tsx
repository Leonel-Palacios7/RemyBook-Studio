import { memo, useId } from 'react';
import type { ImageElement, Page, PageElement, ShapeElement, TextElement } from '@/domain/types';
import { safeColor, safeImageUrl } from '@/lib/sanitize';
import { elementBoxStyle, maskStyle, shapeFill, textStyle } from './elementStyles';
import './page.css';

function TextContent({ el }: { el: TextElement }) {
  return (
    <div className="pr-text" style={textStyle(el)}>
      {el.text}
    </div>
  );
}

function ImageContent({ el }: { el: ImageElement }) {
  const src = safeImageUrl(el.src);
  const mask = maskStyle(el.mask, el.radius);
  if (!src) {
    return (
      <div
        className="pr-image-empty"
        style={{
          ...mask,
          ...(el.placeholder
            ? { background: `radial-gradient(circle at 30% 25%, rgb(255 255 255 / 0.45), transparent 60%), ${safeColor(el.placeholder, '#dfe7da')}` }
            : null),
        }}
        role="img" aria-label={el.alt || 'Espacio para imagen'}>
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
        </svg>
        {el.alt && <span>{el.alt}</span>}
      </div>
    );
  }
  return (
    <img
      className="pr-image"
      src={src}
      alt={el.alt}
      draggable={false}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      style={{ objectFit: el.fit, ...mask }}
    />
  );
}

/** Siluetas vectoriales en un lienzo de 100 × 100 (se estiran con la caja). */
const PATHS: Partial<Record<ShapeElement['shape'], string>> = {
  triangle: 'M50,0 L100,100 L0,100 Z',
  star: 'M50,2 L61,37 L98,37 L68,59 L79,95 L50,73 L21,95 L32,59 L2,37 L39,37 Z',
  arrow: 'M0,30 L62,30 L62,5 L100,50 L62,95 L62,70 L0,70 Z',
  wave: 'M0,35 C18,10 32,10 50,35 C68,60 82,60 100,35 L100,100 L0,100 Z',
  blob: 'M52,3 C76,1 97,19 97,46 C98,74 80,97 51,97 C24,98 3,80 3,53 C2,26 23,5 52,3 Z',
  hexagon: 'M25,3 L75,3 L100,50 L75,97 L25,97 L0,50 Z',
  diamond: 'M50,0 L100,50 L50,100 L0,50 Z',
  leaf: 'M0,100 C0,40 40,0 100,0 C100,60 60,100 0,100 Z',
};

function gradientVector(angle: number) {
  // Convierte el ángulo CSS (0° = hacia arriba) a coordenadas del degradado SVG.
  const rad = ((angle - 90) * Math.PI) / 180;
  const x = Math.cos(rad) / 2;
  const y = Math.sin(rad) / 2;
  return { x1: 0.5 - x, y1: 0.5 - y, x2: 0.5 + x, y2: 0.5 + y };
}

function ShapeContent({ el }: { el: ShapeElement }) {
  const fill = safeColor(el.fill);
  const stroke = safeColor(el.stroke);
  const uid = useId();
  const d = PATHS[el.shape];
  if (d) {
    const gradId = `g${uid.replace(/:/g, '')}`;
    const v = gradientVector(el.gradientAngle ?? 180);
    return (
      <svg className="pr-shape" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {el.fillTo && (
          <defs>
            <linearGradient id={gradId} {...v}>
              <stop offset="0" stopColor={fill} />
              <stop offset="1" stopColor={safeColor(el.fillTo)} />
            </linearGradient>
          </defs>
        )}
        <path
          d={d}
          fill={el.fillTo ? `url(#${gradId})` : fill}
          stroke={stroke}
          vectorEffect="non-scaling-stroke"
          style={{ strokeWidth: `${el.strokeWidth}cqw` }}
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  const radius =
    el.shape === 'ellipse' ? '50%' : el.shape === 'arch' ? '9999px 9999px 0 0' : `${el.radius}cqw`;
  return (
    <div
      className="pr-shape"
      style={{
        background: shapeFill(el),
        border: el.strokeWidth > 0 && el.shape !== 'line' ? `${el.strokeWidth}cqw solid ${stroke}` : undefined,
        borderRadius: radius,
      }}
    />
  );
}

/** Contenido visual de un elemento, sin posicionamiento. */
export function ElementContent({ el }: { el: PageElement }) {
  switch (el.kind) {
    case 'text':
      return <TextContent el={el} />;
    case 'image':
      return <ImageContent el={el} />;
    case 'shape':
      return <ShapeContent el={el} />;
  }
}

interface PageRendererProps {
  page: Page;
  pageNumber?: number;
  showNumber?: boolean;
  highlightText?: string;
  className?: string;
}

/** Renderiza una página completa. Se usa en el lector, miniaturas e impresión. */
export const PageRenderer = memo(function PageRenderer({
  page,
  pageNumber,
  showNumber = false,
  highlightText,
  className = '',
}: PageRendererProps) {
  const bg = safeImageUrl(page.backgroundImage);
  const needle = highlightText?.trim().toLowerCase();
  return (
    <div
      className={`pr-page ${className}`}
      style={{
        background: safeColor(page.background, '#fff'),
        backgroundImage: bg ? `url("${bg}")` : undefined,
      }}
      data-page-id={page.id}
      role="img"
      aria-label={`${page.title || 'Página'}${pageNumber ? ` ${pageNumber}` : ''}`}
    >
      {page.elements.map((el) => {
        const hit = needle && el.kind === 'text' && el.text.toLowerCase().includes(needle);
        return (
          <div key={el.id} className={`pr-el${hit ? ' is-hit' : ''}`} style={elementBoxStyle(el)}>
            <ElementContent el={el} />
          </div>
        );
      })}
      {showNumber && pageNumber !== undefined && (
        <span className={`pr-number ${pageNumber % 2 === 0 ? 'is-left' : 'is-right'}`}>{pageNumber}</span>
      )}
    </div>
  );
});
