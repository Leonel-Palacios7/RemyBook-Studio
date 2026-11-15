import type { PageFormat } from '@/domain/types';

/**
 * Configuración general de la aplicación. Cambie aquí los textos de la
 * interfaz, la paleta y los formatos sin tocar los componentes.
 */
export const APP_CONFIG = {
  name: 'SENA Flipbook Studio',
  shortName: 'Flipbook Studio',
  storageKey: 'sena-flipbook-studio:book',
  historyLimit: 200,
  zoom: { min: 0.5, max: 3, step: 0.25 },
  /** Ancho (px) por debajo del cual el lector usa una sola página. */
  singlePageBreakpoint: 820,
} as const;

/** Relación ancho/alto de cada formato de página. */
export const PAGE_FORMATS: Record<PageFormat, { label: string; ratio: number; css: string }> = {
  'a4-portrait': { label: 'A4 vertical', ratio: 210 / 297, css: 'A4 portrait' },
  'a4-landscape': { label: 'A4 horizontal', ratio: 297 / 210, css: 'A4 landscape' },
  'letter-portrait': { label: 'Carta vertical', ratio: 216 / 279, css: 'letter portrait' },
  square: { label: 'Cuadrado', ratio: 1, css: '210mm 210mm' },
  widescreen: { label: 'Panorámico 16:9', ratio: 16 / 9, css: '297mm 167mm' },
};

/**
 * Paleta institucional. El verde #39A900 es el color principal de la marca
 * SENA. Las demás tonalidades son derivaciones (tintes y sombras) del verde y
 * neutros; valídelas con el Manual de Identidad vigente antes de producción.
 */
export const SENA_PALETTE = {
  green: '#39A900',
  greenDark: '#2B7F00',
  greenDeep: '#1D5600',
  greenLight: '#E6F5DB',
  greenSoft: '#B9E29A',
  white: '#FFFFFF',
  ink: '#1A2416',
  gray: '#5F6B5A',
  grayLight: '#F2F5F0',
} as const;

/** Colores ofrecidos en el selector rápido del editor (además del selector libre). */
export const SWATCHES: string[] = [
  ...Object.values(SENA_PALETTE),
  '#000000',
  'transparent',
];

export const FONT_FAMILIES = [
  { label: 'Work Sans', value: "'Work Sans Variable', 'Work Sans', system-ui, sans-serif" },
  { label: 'Sistema', value: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' },
  { label: 'Serif', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Monoespaciada', value: "ui-monospace, 'Cascadia Code', Consolas, monospace" },
] as const;
