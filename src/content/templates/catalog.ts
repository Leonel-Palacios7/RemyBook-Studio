import type { Book, Page } from '@/domain/types';
import { createId } from '@/lib/id';
import { img, pg, pill, s, sq, t, SANS, SERIF, type Theme } from './kit';
import { contactPage, destinationsPage, galleryPage, introPage, itineraryPage } from './layouts';

/**
 * Catálogo de plantillas de turismo tipo brochure. Cada una combina una
 * portada única con páginas interiores tematizadas. Todo el texto es de
 * ejemplo y todas las fotos son marcos vacíos listos para reemplazar.
 */

export interface TemplateDefinition {
  theme: Theme;
  cover: (theme: Theme) => Page;
}

const base = { format: 'a4-portrait' as const, headingFont: SANS, headingWeight: 800, accentFont: SERIF };

export const TEMPLATES: TemplateDefinition[] = [
  // 1 ─────────────────────────────────────────────────────────────
  {
    theme: {
      ...base,
      id: 'caribe-en-arcos',
      name: 'Caribe en arcos',
      description: 'Arcos mediterráneos, tonos turquesa y coral. Ideal para playas e islas.',
      tags: ['Playa', 'Arcos', 'Cálido'],
      palette: { paper: '#FBF4EA', ink: '#0B3C49', muted: '#4F6B72', primary: '#0E7C86', secondary: '#7FD1C7', accent: '#FF6F59', soft: '#F3E3CF', light: '#FFFFFF', photo: '#BFE3DD' },
      layout: { intro: 0, destinations: 0, gallery: 1 },
      frame: 'arch',
      motif: 'arch',
      headingFont: SERIF,
      headingWeight: 700,
    },
    cover: ({ palette: p }) =>
      pg('Portada', '#F7EBDD', [
        s('ellipse', 70, 4, 22, sq(22), p.accent),
        s('arch', 16, 12, 76, 58, p.secondary),
        img('Foto de portada: playa o isla', 10, 9, 76, 58, 'arch'),
        t('Escapada al mar', 10, 70, 80, 3, { fontSize: 2.4, fontWeight: 700, color: p.primary, uppercase: true, letterSpacing: 0.3 }),
        t('Caribe\nsin prisa', 10, 73.5, 80, 18, { fontSize: 12, fontFamily: SERIF, italic: true, fontWeight: 700, color: p.ink, lineHeight: 0.95 }),
        s('wave', 0, 90, 100, 10, p.primary, { fillTo: p.secondary, gradientAngle: 90 }),
        t('TU AGENCIA DE VIAJES', 10, 95, 80, 3, { fontSize: 2, fontWeight: 700, color: p.light, letterSpacing: 0.3 }),
      ]),
  },
  // 2 ─────────────────────────────────────────────────────────────
  {
    theme: {
      ...base,
      id: 'andes-vertical',
      name: 'Andes vertical',
      description: 'Montañas en capas y tipografía monumental para turismo de aventura.',
      tags: ['Montaña', 'Aventura', 'Oscuro'],
      palette: { paper: '#F4EFE6', ink: '#14281F', muted: '#56645B', primary: '#1F4E3D', secondary: '#3E7C5A', accent: '#F28C28', soft: '#E6E0D2', light: '#FFFFFF', photo: '#9FB8A6' },
      layout: { intro: 1, destinations: 1, gallery: 2 },
      frame: 'diamond',
      motif: 'triangle',
    },
    cover: ({ palette: p }) =>
      pg('Portada', '#10241B', [
        s('ellipse', 58, 8, 30, sq(30), p.accent, { fillTo: '#FFC46B', gradientAngle: 0 }),
        t('EXPEDICIÓN 2027', 8, 7, 60, 3, { fontSize: 2.2, fontWeight: 700, color: p.accent, letterSpacing: 0.35 }),
        t('ALTURA', 6, 12, 92, 14, { fontSize: 19, fontWeight: 900, color: p.light, letterSpacing: -0.02, lineHeight: 1 }),
        t('Rutas de montaña para quienes buscan el horizonte', 8, 27, 52, 8, { fontSize: 3.2, color: '#CFE3D6', lineHeight: 1.35 }),
        img('Foto: cumbre o sendero', 50, 34, 44, 31, 'diamond'),
        s('triangle', -20, 55, 80, 35, p.secondary, { fillTo: p.primary, gradientAngle: 180 }),
        s('triangle', 30, 60, 90, 30, '#2E6B4C', { fillTo: '#163A2B', gradientAngle: 180 }),
        s('triangle', -10, 70, 70, 22, '#0C1F16'),
        s('rect', 0, 88, 100, 12, '#0C1F16'),
        ...pill('RESERVA TU CUPO', 8, 91, 34, 4.6, p.accent, p.light, 2.3),
        t('tuagencia.com', 60, 92.2, 32, 3, { fontSize: 2.3, color: '#CFE3D6', align: 'right' }),
      ]),
  },
  // 3 ─────────────────────────────────────────────────────────────
  {
    theme: {
      ...base,
      id: 'aroma-de-cafe',
      name: 'Aroma de café',
      description: 'Círculos, tonos tierra y serif elegante para rutas rurales y de café.',
      tags: ['Rural', 'Café', 'Elegante'],
      palette: { paper: '#FBF3E6', ink: '#3A2219', muted: '#6E574C', primary: '#5B3A29', secondary: '#C68B59', accent: '#5B8C51', soft: '#F1E2CC', light: '#FFFFFF', photo: '#E3C9A8' },
      layout: { intro: 2, destinations: 2, gallery: 0 },
      frame: 'circle',
      motif: 'ellipse',
      headingFont: SERIF,
      headingWeight: 700,
    },
    cover: ({ palette: p }) =>
      pg('Portada', p.paper, [
        s('ellipse', 38, -8, 78, sq(78), p.secondary, { opacity: 0.35 }),
        img('Foto: cafetal o finca', 44, -4, 66, sq(66), 'circle'),
        img('Foto: taza de café', 8, 38, 30, sq(30), 'circle'),
        s('ellipse', 30, 52, 9, sq(9), p.accent),
        t('Ruta del', 8, 60, 84, 6, { fontSize: 5, fontFamily: SERIF, italic: true, color: p.secondary }),
        t('Café de\nOrigen', 8, 65, 84, 20, { fontSize: 12.5, fontFamily: SERIF, fontWeight: 700, color: p.primary, lineHeight: 0.95 }),
        s('line', 8, 88, 20, 0.35, p.primary),
        t('Fincas · Catas · Paisajes', 8, 90, 84, 3, { fontSize: 2.4, color: p.muted, letterSpacing: 0.12 }),
      ]),
  },
  // 4 ─────────────────────────────────────────────────────────────
  {
    theme: {
      ...base,
      id: 'calles-coloniales',
      name: 'Calles coloniales',
      description: 'Mosaico de baldosas, terracota y azul cobalto para centros históricos.',
      tags: ['Ciudad', 'Historia', 'Colorido'],
      palette: { paper: '#FFF8EE', ink: '#2A1C14', muted: '#6A5A4E', primary: '#C4532D', secondary: '#1F4E8C', accent: '#E8B53A', soft: '#F6E6D3', light: '#FFFFFF', photo: '#E9C9A6' },
      layout: { intro: 0, destinations: 1, gallery: 1 },
      frame: 'pill',
      motif: 'diamond',
    },
    cover: ({ palette: p }) => {
      const tiles = Array.from({ length: 12 }, (_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const colors = [p.primary, p.secondary, p.accent];
        return s('diamond', 52 + col * 12, 4 + row * 8.5, 11, sq(11), colors[(col + row) % 3]!, { opacity: 0.95 });
      });
      return pg('Portada', p.paper, [
        ...tiles,
        img('Foto: calle o fachada colonial', 8, 8, 38, 62, 'pill'),
        s('ellipse', 38, 60, 14, sq(14), p.accent),
        t('Centro histórico', 52, 36, 42, 3, { fontSize: 2.3, fontWeight: 700, color: p.secondary, uppercase: true, letterSpacing: 0.2 }),
        t('Calles\nque\ncuentan\nhistorias', 52, 40, 46, 34, { fontSize: 8.6, fontWeight: 900, color: p.primary, lineHeight: 0.98 }),
        s('rect', 0, 80, 100, 20, p.secondary),
        t('Recorridos a pie · Arquitectura · Museos', 8, 85, 84, 3, { fontSize: 2.6, fontWeight: 600, color: p.light }),
        t('TU AGENCIA', 8, 91, 40, 3, { fontSize: 2.2, fontWeight: 800, color: p.accent, letterSpacing: 0.3 }),
      ]);
    },
  },
  // 5 ─────────────────────────────────────────────────────────────
  {
    theme: {
      ...base,
      id: 'selva-viva',
      name: 'Selva viva',
      description: 'Formas orgánicas y hojas sobre verdes profundos para naturaleza y selva.',
      tags: ['Naturaleza', 'Orgánico', 'Verde'],
      palette: { paper: '#EEF5E6', ink: '#0F2A20', muted: '#4D6457', primary: '#0F3D2E', secondary: '#1C7C6C', accent: '#8DBB1E', soft: '#DCEBCF', light: '#FFFFFF', photo: '#7FA88F' },
      layout: { intro: 1, destinations: 2, gallery: 2 },
      frame: 'blob',
      motif: 'leaf',
    },
    cover: ({ palette: p }) =>
      pg('Portada', p.primary, [
        s('leaf', -10, -4, 46, sq(46), p.secondary, { rotation: -20 }),
        s('leaf', 72, 20, 34, sq(34), p.accent, { rotation: 35, opacity: 0.85 }),
        s('blob', 18, 14, 70, 48, p.accent, { fillTo: p.secondary, gradientAngle: 140 }),
        img('Foto: selva, río o fauna', 22, 16, 62, 44, 'blob'),
        s('leaf', 74, 52, 18, sq(18), '#B8E05A', { rotation: 10 }),
        t('Expedición', 8, 66, 84, 6, { fontSize: 5, fontFamily: SERIF, italic: true, color: '#B8E05A' }),
        t('SELVA\nVIVA', 8, 71, 84, 22, { fontSize: 14, fontWeight: 900, color: p.light, lineHeight: 0.92, letterSpacing: 0.02 }),
        ...pill('Naturaleza · Ríos · Fauna', 8, 92, 46, 4.2, p.accent, p.primary, 2.2),
      ]),
  },
  // 6 ─────────────────────────────────────────────────────────────
  {
    theme: {
      ...base,
      id: 'desierto-dorado',
      name: 'Desierto dorado',
      description: 'Atardecer en degradado, sol y dunas onduladas para destinos desérticos.',
      tags: ['Desierto', 'Degradado', 'Atardecer'],
      palette: { paper: '#FFF4E6', ink: '#2D1638', muted: '#6B5470', primary: '#5B2A6E', secondary: '#E07A3F', accent: '#F2A93B', soft: '#F8E3CC', light: '#FFFFFF', photo: '#F3C38E' },
      layout: { intro: 2, destinations: 0, gallery: 0 },
      frame: 'arch',
      motif: 'wave',
      headingFont: SERIF,
      headingWeight: 700,
    },
    cover: ({ palette: p }) =>
      pg('Portada', '#3B1E54', [
        s('rect', 0, 0, 100, 100, '#3B1E54', { fillTo: '#F29E4C', gradientAngle: 180 }),
        s('ellipse', 22, 18, 56, sq(56), '#FFD27A', { fillTo: '#F07B3F', gradientAngle: 180 }),
        img('Foto: dunas o viajero', 32, 26, 36, 32, 'arch'),
        s('wave', -10, 56, 120, 18, '#E8935A', { fillTo: '#C7643A', gradientAngle: 180 }),
        s('wave', -20, 66, 130, 18, '#B9542F', { fillTo: '#8E3B22', gradientAngle: 180, rotation: 180 }),
        s('rect', 0, 78, 100, 22, '#6E2B1A'),
        t('Bajo el sol de', 8, 4, 84, 5, { fontSize: 4.4, fontFamily: SERIF, italic: true, color: '#FFE3B8', align: 'center' }),
        t('DESIERTO DORADO', 4, 9, 92, 7, { fontSize: 7.6, fontWeight: 900, color: p.light, align: 'center', letterSpacing: 0.06 }),
        t('Noches de estrellas · Dunas · Oasis', 8, 82, 84, 3, { fontSize: 2.6, color: '#FFE3B8', align: 'center', letterSpacing: 0.1 }),
        ...pill('DESCUBRE MÁS', 34, 89, 32, 4.6, p.accent, '#3B1E54', 2.3),
      ]),
  },
  // 7 ─────────────────────────────────────────────────────────────
  {
    theme: {
      ...base,
      id: 'islas-y-arrecifes',
      name: 'Islas y arrecifes',
      description: 'Burbujas, olas en capas y azules profundos para buceo y vida marina.',
      tags: ['Mar', 'Buceo', 'Fresco'],
      palette: { paper: '#ECF8F6', ink: '#0A2342', muted: '#47607A', primary: '#0A2342', secondary: '#2EC4B6', accent: '#FFBF46', soft: '#D6F0EC', light: '#FFFFFF', photo: '#A9DDD6' },
      layout: { intro: 1, destinations: 1, gallery: 0 },
      frame: 'circle',
      motif: 'ellipse',
    },
    cover: ({ palette: p }) =>
      pg('Portada', '#E8F7F5', [
        s('rect', 0, 0, 100, 58, '#BDEBE4', { fillTo: '#E8F7F5', gradientAngle: 180 }),
        t('Bajo el agua', 8, 6, 60, 3, { fontSize: 2.4, fontWeight: 700, color: p.secondary, uppercase: true, letterSpacing: 0.3 }),
        t('Islas &\nArrecifes', 8, 10, 84, 20, { fontSize: 11, fontWeight: 900, color: p.primary, lineHeight: 0.95 }),
        img('Foto: arrecife o buceo', 40, 24, 54, sq(54), 'circle'),
        s('ellipse', 30, 36, 8, sq(8), p.secondary, { opacity: 0.7 }),
        s('ellipse', 22, 46, 5, sq(5), p.secondary, { opacity: 0.5 }),
        s('ellipse', 33, 52, 3, sq(3), p.secondary, { opacity: 0.4 }),
        s('ellipse', 84, 22, 6, sq(6), p.accent),
        s('wave', 0, 62, 100, 14, p.secondary, { fillTo: '#1B9AAA', gradientAngle: 90 }),
        s('wave', 0, 70, 100, 30, p.primary, { fillTo: '#123B66', gradientAngle: 180 }),
        t('Buceo · Snorkel · Playas vírgenes', 8, 84, 84, 3, { fontSize: 2.8, fontWeight: 600, color: p.light }),
        ...pill('Planes desde $000', 8, 90, 34, 4.4, p.accent, p.primary, 2.2),
      ]),
  },
  // 8 ─────────────────────────────────────────────────────────────
  {
    theme: {
      ...base,
      id: 'ruta-de-sabores',
      name: 'Ruta de sabores',
      description: 'Etiquetas en píldora, estrellas y rojo tomate para turismo gastronómico.',
      tags: ['Gastronomía', 'Audaz', 'Píldoras'],
      palette: { paper: '#FFF4E0', ink: '#2B2B2B', muted: '#5E5A52', primary: '#D7263D', secondary: '#6B8F3E', accent: '#F4A259', soft: '#F7E2C3', light: '#FFFFFF', photo: '#F2C9A0' },
      layout: { intro: 2, destinations: 2, gallery: 1 },
      frame: 'pill',
      motif: 'star',
    },
    cover: ({ palette: p }) =>
      pg('Portada', p.paper, [
        s('rect', 0, 0, 100, 46, p.primary),
        t('SABO\nRES', 6, 3, 60, 40, { fontSize: 22, fontWeight: 900, color: p.light, lineHeight: 0.85, letterSpacing: -0.03 }),
        s('star', 74, 6, 20, sq(20), p.accent, { rotation: 12 }),
        img('Foto: plato típico', 56, 24, 38, 46, 'pill'),
        img('Foto: mercado', 8, 50, 22, 30, 'pill'),
        img('Foto: cocinera o cocinero', 32, 56, 22, 30, 'pill'),
        t('Una ruta para comer\ncon los cinco sentidos', 56, 73, 40, 8, { fontSize: 3, fontWeight: 600, color: p.ink, lineHeight: 1.3 }),
        ...pill('Mercados', 8, 89, 20, 4, p.secondary, p.light, 2),
        ...pill('Cocina local', 30, 89, 24, 4, p.ink, p.light, 2),
        ...pill('Catas', 56, 89, 16, 4, p.accent, p.ink, 2),
        s('star', 82, 84, 10, sq(10), p.primary),
      ]),
  },
  // 9 ─────────────────────────────────────────────────────────────
  {
    theme: {
      ...base,
      id: 'ecoturismo-verde',
      name: 'Ecoturismo verde',
      description: 'Hojas y verdes de la paleta institucional para turismo sostenible.',
      tags: ['Sostenible', 'Verde', 'Hojas'],
      palette: { paper: '#F4FAEF', ink: '#14290A', muted: '#4D5E45', primary: '#2B7F00', secondary: '#39A900', accent: '#1D5600', soft: '#E6F5DB', light: '#FFFFFF', photo: '#C8E6B4' },
      layout: { intro: 0, destinations: 1, gallery: 2 },
      frame: 'leaf',
      motif: 'leaf',
    },
    cover: ({ palette: p }) =>
      pg('Portada', p.light, [
        s('rect', 0, 0, 44, 100, p.soft),
        s('leaf', 6, 6, 40, sq(40) * 1.4, p.secondary, { fillTo: p.accent, gradientAngle: 135 }),
        img('Foto: bosque o reserva', 10, 9, 40, sq(40) * 1.4, 'leaf'),
        s('leaf', 60, 6, 12, sq(12), p.secondary, { rotation: 90 }),
        s('leaf', 74, 6, 12, sq(12), p.soft, { rotation: 90 }),
        t('Turismo\nsostenible', 52, 30, 44, 8, { fontSize: 3.4, fontWeight: 700, color: p.secondary, uppercase: true, letterSpacing: 0.12, lineHeight: 1.2 }),
        t('Viajar\ncuidando\nel planeta', 52, 40, 46, 30, { fontSize: 8.2, fontWeight: 800, color: p.accent, lineHeight: 1 }),
        img('Foto: comunidad local', 10, 66, 30, sq(30), 'circle'),
        t('Reservas naturales · Comunidades · Senderos', 52, 72, 42, 8, { fontSize: 2.6, color: p.muted, lineHeight: 1.4 }),
        ...pill('CONOCE LOS PLANES', 52, 86, 40, 4.6, p.secondary, p.light, 2.2),
      ]),
  },
  // 10 ────────────────────────────────────────────────────────────
  {
    theme: {
      ...base,
      id: 'noches-de-festival',
      name: 'Noches de festival',
      description: 'Contraste nocturno, estrellas y rombos neón para ferias, carnavales y eventos.',
      tags: ['Eventos', 'Nocturno', 'Neón'],
      palette: { paper: '#F6F1FF', ink: '#1B1035', muted: '#5A4E73', primary: '#3A1F7A', secondary: '#E2367B', accent: '#FFC94A', soft: '#E9E0FA', light: '#FFFFFF', photo: '#B9A6E0' },
      layout: { intro: 1, destinations: 0, gallery: 1 },
      frame: 'hexagon',
      motif: 'diamond',
    },
    cover: ({ palette: p }) =>
      pg('Portada', '#1B1035', [
        s('ellipse', -20, -10, 80, sq(80), '#3A1F7A', { opacity: 0.8 }),
        s('ellipse', 50, 50, 70, sq(70), p.secondary, { opacity: 0.35 }),
        s('star', 82, 6, 8, sq(8), p.accent),
        s('star', 10, 34, 5, sq(5), p.accent),
        s('star', 88, 46, 4, sq(4), '#FFFFFF'),
        img('Foto: escenario o desfile', 34, 6, 46, 40, 'hexagon'),
        s('diamond', 18, 40, 16, sq(16), p.secondary),
        t('NOCHES DE', 8, 54, 84, 6, { fontSize: 5, fontWeight: 300, color: p.accent, letterSpacing: 0.4 }),
        t('FESTI\nVAL', 8, 60, 84, 28, { fontSize: 17, fontWeight: 900, color: p.light, lineHeight: 0.88 }),
        s('rect', 64, 66, 30, 0.6, p.secondary),
        t('Música · Danza\nGastronomía · Color', 64, 68, 32, 10, { fontSize: 2.6, color: '#D7CCF2', lineHeight: 1.5 }),
        ...pill('FECHAS · 00 — 00 MES', 8, 90, 46, 4.6, p.secondary, p.light, 2.2),
      ]),
  },
];

/** Crea una publicación completa (6 páginas) a partir de una plantilla. */
export function buildTemplateBook(def: TemplateDefinition): Book {
  const { theme } = def;
  const mirrored = TEMPLATES.indexOf(def) % 2 === 1;
  const pages: Page[] = [
    def.cover(theme),
    introPage(theme, mirrored),
    destinationsPage(theme),
    galleryPage(theme),
    itineraryPage(theme),
    contactPage(theme),
  ];
  // Los marcos vacíos toman el tono de la plantilla.
  for (const page of pages) {
    for (const el of page.elements) {
      if (el.kind === 'image' && !el.placeholder) el.placeholder = theme.palette.photo;
    }
  }
  return {
    schemaVersion: 1,
    id: createId(theme.id),
    title: theme.name,
    description: theme.description,
    author: '',
    updatedAt: new Date().toISOString(),
    settings: { format: theme.format, showPageNumbers: false, flipDuration: 800 },
    pages,
  };
}

export function findTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find((tpl) => tpl.theme.id === id);
}
