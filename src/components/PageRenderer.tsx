import { memo } from 'react';
import type { ImageElement, Page, PageElement, ShapeElement, TextElement } from '@/domain/types';
import { safeColor, safeImageUrl } from '@/lib/sanitize';
import { elementBoxStyle, textStyle } from './elementStyles';
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
  if (!src) {
    return (
      <div className="pr-image-empty" role="img" aria-label={el.alt || 'Imagen sin fuente'}>
        Imagen
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
      style={{ objectFit: el.fit, borderRadius: `${el.radius}cqw` }}
    />
  );
}

const POLYGONS: Partial<Record<ShapeElement['shape'], string>> = {
  triangle: '50,0 100,100 0,100',
  star: '50,2 61,37 98,37 68,59 79,95 50,73 21,95 32,59 2,37 39,37',
  arrow: '0,30 62,30 62,5 100,50 62,95 62,70 0,70',
};

function ShapeContent({ el }: { el: ShapeElement }) {
  const fill = safeColor(el.fill);
  const stroke = safeColor(el.stroke);
  if (el.shape === 'line') {
    return <div className="pr-shape" style={{ background: fill, borderRadius: `${el.radius}cqw` }} />;
  }
  const polygon = POLYGONS[el.shape];
  if (polygon) {
    return (
      <svg className="pr-shape" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon
          points={polygon}
          fill={fill}
          stroke={stroke}
          vectorEffect="non-scaling-stroke"
          style={{ strokeWidth: `${el.strokeWidth}cqw` }}
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <div
      className="pr-shape"
      style={{
        background: fill,
        border: el.strokeWidth > 0 ? `${el.strokeWidth}cqw solid ${stroke}` : undefined,
        borderRadius: el.shape === 'ellipse' ? '50%' : `${el.radius}cqw`,
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
