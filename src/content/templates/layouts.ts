import type { Page, PageElement } from '@/domain/types';
import { img, pg, pill, s, sq, t, SERIF, type Theme } from './kit';

/**
 * Páginas interiores reutilizables. Cada plantilla las combina con su propia
 * paleta, silueta de fotos y motivo decorativo, y aporta su portada única.
 * Los textos son marcadores para reemplazar: no contienen datos reales.
 */

function heading(theme: Theme, kicker: string, title: string, x = 8, y = 6, w = 84, color = theme.palette.ink): PageElement[] {
  return [
    t(kicker, x, y, w, 3, { fontSize: 2.2, fontWeight: 700, color: theme.palette.primary, uppercase: true, letterSpacing: 0.22 }),
    t(title, x, y + 3.6, w, 12, {
      fontSize: 7.4,
      fontWeight: theme.headingWeight,
      fontFamily: theme.headingFont,
      color,
      lineHeight: 1.05,
    }),
  ];
}

/** Página de bienvenida: título, texto, foto con silueta y tres razones. */
export function introPage(theme: Theme, mirrored = false): Page {
  if (theme.layout.intro === 1) return introBand(theme);
  if (theme.layout.intro === 2) return introColumn(theme);
  const p = theme.palette;
  const photoX = mirrored ? 6 : 56;
  const textX = mirrored ? 48 : 8;
  const reasons = [
    ['01', 'Experiencias auténticas', 'Describe aquí qué hace especial este viaje.'],
    ['02', 'Guías locales', 'Presenta a las personas que acompañan el recorrido.'],
    ['03', 'Viaje a tu ritmo', 'Explica la flexibilidad de horarios y actividades.'],
  ];
  return pg('Bienvenida', p.paper, [
    s(theme.motif, mirrored ? 70 : -8, -4, 40, sq(40), p.soft, { opacity: 0.9 }),
    ...heading(theme, 'Bienvenida', 'Descubre un\ndestino único', textX, 7, 46),
    t(
      'Escribe aquí una introducción breve y cercana. Cuenta qué vivirá el viajero, qué lo hace diferente y por qué debería elegir esta experiencia.',
      textX,
      29,
      44,
      16,
      { fontSize: 2.7, color: p.muted, lineHeight: 1.55 },
    ),
    s(theme.motif, photoX + 4, 9, 38, 40, p.secondary, { opacity: 0.85 }),
    img('Foto principal del destino', photoX, 6, 38, 40, theme.frame),
    ...reasons.flatMap(([n, title, body], i) => {
      const y = 54 + i * 13.5;
      return [
        s('ellipse', 8, y, 11, sq(11), i === 1 ? p.accent : p.primary),
        t(n!, 8, y + 2.4, 11, 5, { fontSize: 3.6, fontWeight: 800, color: p.light, align: 'center' }),
        t(title!, 23, y + 0.6, 66, 4, { fontSize: 3.4, fontWeight: 700, color: p.ink }),
        t(body!, 23, y + 4.6, 66, 6, { fontSize: 2.5, color: p.muted }),
      ];
    }),
    s('wave', 0, 94, 100, 6, p.primary, { fillTo: p.secondary, gradientAngle: 90 }),
  ]);
}

/** Tres destinos en tarjetas con foto, descripción y precio. */
export function destinationsPage(theme: Theme): Page {
  if (theme.layout.destinations === 1) return destinationsGrid(theme);
  if (theme.layout.destinations === 2) return destinationsZigzag(theme);
  const p = theme.palette;
  const cards = ['Destino uno', 'Destino dos', 'Destino tres'];
  return pg('Destinos', p.paper, [
    ...heading(theme, 'Destinos', 'Lugares que\nte esperan'),
    s(theme.motif, 74, 4, 20, sq(20), p.accent, { opacity: 0.9 }),
    ...cards.flatMap((name, i) => {
      const y = 25 + i * 24;
      const left = i % 2 === 0;
      return [
        s('rect', 6, y, 88, 21, p.soft, { radius: 4 }),
        img(`Foto: ${name.toLowerCase()}`, left ? 9 : 63, y + 2, 28, 17, theme.frame === 'arch' ? 'pill' : theme.frame),
        t(name, left ? 41 : 11, y + 3, 48, 4, { fontSize: 3.8, fontWeight: 800, color: p.ink, fontFamily: theme.headingFont }),
        t('Duración · Temporada · Tipo de plan', left ? 41 : 11, y + 7.6, 48, 3, { fontSize: 2.1, color: p.primary, fontWeight: 600 }),
        t('Escribe dos líneas sobre qué incluye este destino y por qué vale la pena.', left ? 41 : 11, y + 10.6, 48, 6, {
          fontSize: 2.3,
          color: p.muted,
        }),
        ...pill('Desde $000', left ? 41 : 11, y + 16, 20, 3.4, p.accent, p.light, 2),
      ];
    }),
  ]);
}

/** Mosaico de fotos con una cita destacada. */
export function galleryPage(theme: Theme): Page {
  if (theme.layout.gallery === 1) return galleryPolaroids(theme);
  if (theme.layout.gallery === 2) return galleryQuoteBand(theme);
  const p = theme.palette;
  return pg('Galería', p.paper, [
    img('Foto panorámica', 6, 6, 56, 44, theme.frame),
    img('Foto de detalle', 65, 6, 29, 21, 'none', { radius: 3 }),
    img('Foto de personas', 65, 29, 29, 21, 'circle'),
    s(theme.motif, 4, 55, 40, 38, p.primary, { fillTo: p.secondary, gradientAngle: 135 }),
    img('Foto del ambiente', 8, 58, 32, 32, theme.frame === 'circle' ? 'blob' : 'circle'),
    t('“', 48, 52, 20, 12, { fontSize: 18, fontFamily: SERIF, color: p.accent, lineHeight: 1 }),
    t('Escribe aquí una frase inspiradora o el testimonio de un viajero.', 48, 63, 46, 18, {
      fontSize: 4.2,
      fontFamily: theme.accentFont,
      italic: true,
      color: p.ink,
      lineHeight: 1.3,
    }),
    t('— Nombre del viajero', 48, 84, 46, 4, { fontSize: 2.4, fontWeight: 700, color: p.primary }),
  ]);
}

/** Itinerario por días sobre fondo de color. */
export function itineraryPage(theme: Theme): Page {
  const p = theme.palette;
  const days = ['Llegada y bienvenida', 'Recorrido principal', 'Actividad especial', 'Día libre', 'Regreso'];
  return pg('Itinerario', p.primary, [
    s(theme.motif, 62, -6, 50, sq(50), p.secondary, { opacity: 0.55 }),
    t('Itinerario', 8, 6, 60, 3, { fontSize: 2.2, fontWeight: 700, color: p.accent, uppercase: true, letterSpacing: 0.22 }),
    t('Tu viaje\ndía a día', 8, 9.6, 60, 14, { fontSize: 7.4, fontWeight: theme.headingWeight, fontFamily: theme.headingFont, color: p.light, lineHeight: 1.05 }),
    s('line', 14.5, 30, 0.6, 58, p.light, { opacity: 0.4 }),
    ...days.flatMap((title, i) => {
      const y = 28 + i * 12;
      return [
        s('ellipse', 9, y, 12, sq(12), i === 0 ? p.accent : p.light),
        t(`DÍA\n${i + 1}`, 9, y + 1.6, 12, 6, { fontSize: 2.2, fontWeight: 800, color: i === 0 ? p.light : p.primary, align: 'center', lineHeight: 1.05 }),
        t(title, 26, y + 0.8, 46, 4, { fontSize: 3.3, fontWeight: 700, color: p.light }),
        t('Describe brevemente las actividades de este día.', 26, y + 4.8, 46, 5, { fontSize: 2.3, color: p.light, opacity: 0.8 }),
      ];
    }),
    img('Foto del itinerario', 74, 52, 22, 34, theme.frame === 'none' ? 'pill' : theme.frame),
  ]);
}

/** Contacto, mapa, código QR y llamado a la acción. */
export function contactPage(theme: Theme): Page {
  const p = theme.palette;
  return pg('Contacto y reservas', p.paper, [
    s('wave', 0, 0, 100, 22, p.primary, { rotation: 180, fillTo: p.secondary, gradientAngle: 90 }),
    ...heading(theme, 'Reservas', '¿Listo para\nviajar?', 8, 22),
    img('Mapa o foto de la ubicación', 8, 42, 50, 30, 'none', { radius: 4 }),
    s('rect', 64, 42, 28, sq(28), p.light, { radius: 3, stroke: p.ink, strokeWidth: 0.4 }),
    t('Código QR', 64, 48, 28, 6, { fontSize: 2.6, fontWeight: 700, color: p.muted, align: 'center' }),
    t('Escanea para reservar', 62, 64, 32, 4, { fontSize: 2.2, color: p.muted, align: 'center' }),
    t('Teléfono: +00 000 000 0000\nCorreo: hola@tuagencia.com\nDirección de la oficina\nRedes: @tuagencia', 8, 76, 52, 14, {
      fontSize: 2.6,
      color: p.ink,
      lineHeight: 1.6,
    }),
    ...pill('RESERVA AHORA', 62, 76, 32, 5, p.accent, p.light, 2.6),
    t('www.tuagencia.com', 62, 84, 32, 4, { fontSize: 2.3, fontWeight: 700, color: p.primary, align: 'center' }),
    s(theme.motif, 84, 90, 14, sq(14), p.secondary, { opacity: 0.8 }),
  ]);
}

/* ───────────── Variantes ───────────── */

const REASONS = [
  ['Experiencias auténticas', 'Describe aquí qué hace especial este viaje.'],
  ['Guías locales', 'Presenta a quienes acompañan el recorrido.'],
  ['A tu ritmo', 'Explica la flexibilidad del plan.'],
] as const;

/** Bienvenida con foto a sangre y bloque de color superpuesto. */
function introBand(theme: Theme): Page {
  const p = theme.palette;
  return pg('Bienvenida', p.paper, [
    img('Foto panorámica del destino', 0, 0, 100, 42, 'none', { radius: 0 }),
    s('rect', 8, 33, 62, 21, p.primary, { radius: 3, fillTo: p.secondary, gradientAngle: 120 }),
    t('Bienvenida', 12, 36, 54, 3, { fontSize: 2.2, fontWeight: 700, color: p.accent, uppercase: true, letterSpacing: 0.22 }),
    t('Descubre un\ndestino único', 12, 39.6, 54, 12, { fontSize: 6.6, fontWeight: theme.headingWeight, fontFamily: theme.headingFont, color: p.light, lineHeight: 1.05 }),
    s(theme.motif, 76, 38, 16, sq(16), p.accent),
    t('Escribe aquí una introducción breve y cercana. Cuenta qué vivirá el viajero, qué lo hace diferente y por qué debería elegir esta experiencia.', 8, 58, 84, 12, {
      fontSize: 2.8,
      color: p.muted,
      lineHeight: 1.55,
    }),
    ...REASONS.flatMap(([title, body], i) => {
      const x = 8 + i * 29;
      return [
        s(theme.motif, x, 73, 9, sq(9), i === 1 ? p.accent : p.secondary),
        t(title, x, 80.5, 26, 6, { fontSize: 2.8, fontWeight: 700, color: p.ink, lineHeight: 1.15 }),
        t(body, x, 87, 26, 8, { fontSize: 2.3, color: p.muted }),
      ];
    }),
  ]);
}

/** Bienvenida con columna de color y numeración grande. */
function introColumn(theme: Theme): Page {
  const p = theme.palette;
  return pg('Bienvenida', p.paper, [
    s('rect', 0, 0, 38, 100, p.primary, { fillTo: p.secondary, gradientAngle: 180 }),
    t('Bienvenida', 6, 8, 28, 3, { fontSize: 2.2, fontWeight: 700, color: p.accent, uppercase: true, letterSpacing: 0.22 }),
    t('Un viaje\npara\nrecordar', 6, 12, 30, 24, { fontSize: 6.2, fontWeight: theme.headingWeight, fontFamily: theme.headingFont, color: p.light, lineHeight: 1.02 }),
    t('Escribe aquí una introducción breve sobre el destino y la experiencia.', 6, 40, 28, 16, { fontSize: 2.6, color: p.light, opacity: 0.85, lineHeight: 1.5 }),
    s(theme.motif, 4, 76, 30, sq(30), p.accent, { opacity: 0.9 }),
    img('Foto principal del destino', 44, 6, 50, 38, theme.frame),
    ...REASONS.flatMap(([title, body], i) => {
      const y = 50 + i * 15;
      return [
        t(String(i + 1).padStart(2, '0'), 44, y - 1, 14, 10, { fontSize: 9, fontFamily: SERIF, italic: true, color: p.accent, lineHeight: 1 }),
        t(title, 60, y, 34, 4, { fontSize: 3.2, fontWeight: 700, color: p.ink }),
        t(body, 60, y + 4.2, 34, 8, { fontSize: 2.4, color: p.muted }),
      ];
    }),
  ]);
}

/** Cuatro destinos en cuadrícula. */
function destinationsGrid(theme: Theme): Page {
  const p = theme.palette;
  const names = ['Destino uno', 'Destino dos', 'Destino tres', 'Destino cuatro'];
  return pg('Destinos', p.paper, [
    ...heading(theme, 'Destinos', 'Elige tu\npróxima parada'),
    s(theme.motif, 70, 3, 24, sq(24), p.secondary, { opacity: 0.8 }),
    ...names.flatMap((name, i) => {
      const x = 8 + (i % 2) * 44;
      const y = 26 + Math.floor(i / 2) * 36;
      return [
        img(`Foto: ${name.toLowerCase()}`, x, y, 40, 22, theme.frame === 'arch' || theme.frame === 'leaf' ? theme.frame : 'none', { radius: 3 }),
        ...pill('Desde $000', x + 24, y + 18, 15, 3.2, p.accent, p.light, 1.8),
        t(name, x, y + 23.5, 40, 4, { fontSize: 3.5, fontWeight: 800, color: p.ink, fontFamily: theme.headingFont }),
        t('Dos líneas sobre qué incluye y para quién es ideal.', x, y + 27.5, 40, 6, { fontSize: 2.3, color: p.muted }),
      ];
    }),
  ]);
}

/** Tres destinos en zigzag con fotos circulares y números grandes. */
function destinationsZigzag(theme: Theme): Page {
  const p = theme.palette;
  const names = ['Destino uno', 'Destino dos', 'Destino tres'];
  return pg('Destinos', p.soft, [
    ...heading(theme, 'Destinos', 'Tres paradas\nimperdibles'),
    ...names.flatMap((name, i) => {
      const y = 26 + i * 24;
      const left = i % 2 === 0;
      const imgX = left ? 8 : 58;
      const txtX = left ? 46 : 8;
      return [
        s(theme.motif, imgX - 2, y - 1, 38, sq(38) * 0.75, i === 1 ? p.accent : p.secondary, { opacity: 0.7 }),
        img(`Foto: ${name.toLowerCase()}`, imgX, y, 34, sq(34) * 0.75, theme.frame === 'none' ? 'circle' : theme.frame),
        t(String(i + 1).padStart(2, '0'), txtX, y, 20, 8, { fontSize: 8, fontWeight: 900, color: p.primary, lineHeight: 1, opacity: 0.35 }),
        t(name, txtX, y + 7, 44, 4, { fontSize: 3.8, fontWeight: 800, color: p.ink, fontFamily: theme.headingFont }),
        t('Describe en pocas palabras la experiencia que ofrece este lugar.', txtX, y + 11.5, 44, 6, { fontSize: 2.4, color: p.muted }),
        ...pill('Desde $000', txtX, y + 17.5, 18, 3.4, p.primary, p.light, 1.9),
      ];
    }),
  ]);
}

/** Fotos tipo polaroid inclinadas. */
function galleryPolaroids(theme: Theme): Page {
  const p = theme.palette;
  const shots: [number, number, number, string][] = [
    [8, 8, -6, 'Momento uno'],
    [52, 12, 5, 'Momento dos'],
    [24, 42, -2, 'Momento tres'],
  ];
  return pg('Galería', p.paper, [
    s(theme.motif, 60, 46, 40, sq(40), p.soft),
    s(theme.motif, -6, 30, 20, sq(20), p.accent, { opacity: 0.8 }),
    ...shots.flatMap(([x, y, r, caption]) => [
      s('rect', x, y, 40, 34, '#FFFFFF', { rotation: r, radius: 1, stroke: 'rgb(0, 0, 0, 0.08)', strokeWidth: 0.2 }),
      img(`Foto: ${caption.toLowerCase()}`, x + 2.5, y + 2, 35, 25, 'none', { rotation: r, radius: 0.5 }),
      t(caption, x + 2.5, y + 28, 35, 4, { rotation: r, fontSize: 3, fontFamily: SERIF, italic: true, color: p.muted, align: 'center' }),
    ]),
    t('Escribe aquí una frase que invite a vivir estos momentos.', 8, 82, 70, 8, { fontSize: 4, fontFamily: theme.accentFont, italic: true, color: p.ink }),
    t('#TuDestino', 8, 91, 40, 4, { fontSize: 2.6, fontWeight: 800, color: p.primary }),
  ]);
}

/** Cita grande sobre franja de color y fila de fotos. */
function galleryQuoteBand(theme: Theme): Page {
  const p = theme.palette;
  return pg('Galería', p.paper, [
    s('rect', 0, 0, 100, 32, p.primary, { fillTo: p.secondary, gradientAngle: 135 }),
    s(theme.motif, 78, 4, 18, sq(18), p.accent, { opacity: 0.9 }),
    t('“Escribe aquí una frase que resuma el espíritu del viaje.”', 8, 7, 66, 18, {
      fontSize: 5,
      fontFamily: theme.accentFont,
      italic: true,
      color: p.light,
      lineHeight: 1.25,
    }),
    t('— Nombre del viajero', 8, 25, 60, 4, { fontSize: 2.4, fontWeight: 700, color: p.accent }),
    ...[0, 1, 2].map((i) => img(`Foto ${i + 1}`, 8 + i * 29, 37, 26, 26, theme.frame === 'none' ? 'pill' : theme.frame)),
    img('Foto panorámica', 8, 67, 84, 26, 'none', { radius: 3 }),
    ...pill('Comparte tu viaje', 62, 89, 28, 4, p.accent, p.light, 2),
  ]);
}
