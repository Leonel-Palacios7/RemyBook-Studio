import { z } from 'zod';
import type { Book } from '@/domain/types';

/**
 * Esquema de validación de una publicación. Se aplica a todo contenido que
 * entra a la aplicación (archivo importado, almacenamiento local) para evitar
 * datos corruptos o maliciosos.
 */
const num = (min: number, max: number) => z.number().finite().min(min).max(max);
const str = (max: number) => z.string().max(max);

const base = {
  id: str(80).min(1),
  x: num(-500, 600),
  y: num(-500, 600),
  w: num(0, 1000),
  h: num(0, 1000),
  rotation: num(-360, 360),
  opacity: num(0, 1),
  locked: z.boolean().optional(),
};

const textSchema = z.object({
  ...base,
  kind: z.literal('text'),
  text: str(20000),
  fontSize: num(0.1, 100),
  fontFamily: str(200),
  fontWeight: num(100, 900),
  italic: z.boolean(),
  underline: z.boolean(),
  color: str(60),
  background: str(60),
  align: z.enum(['left', 'center', 'right', 'justify']),
  lineHeight: num(0.5, 4),
  padding: num(0, 50),
  radius: num(0, 50),
  letterSpacing: num(-1, 2).optional(),
  uppercase: z.boolean().optional(),
});

const imageSchema = z.object({
  ...base,
  kind: z.literal('image'),
  // Las imágenes embebidas (data:) pueden ser grandes; no se limita su uso.
  src: z.string(),
  alt: str(500),
  fit: z.enum(['cover', 'contain', 'fill']),
  radius: num(0, 50),
  mask: z.enum(['none', 'arch', 'circle', 'pill', 'blob', 'hexagon', 'diamond', 'leaf']).optional(),
  placeholder: str(60).optional(),
});

const shapeSchema = z.object({
  ...base,
  kind: z.literal('shape'),
  shape: z.enum(['rect', 'ellipse', 'triangle', 'line', 'star', 'arrow', 'arch', 'wave', 'blob', 'hexagon', 'diamond', 'leaf']),
  fill: str(60),
  stroke: str(60),
  strokeWidth: num(0, 50),
  radius: num(0, 50),
  fillTo: str(60).optional(),
  gradientAngle: num(-360, 360).optional(),
});

export const elementSchema = z.discriminatedUnion('kind', [textSchema, imageSchema, shapeSchema]);

export const pageSchema = z.object({
  id: str(80).min(1),
  title: str(300),
  background: str(60),
  backgroundImage: z.string().optional(),
  elements: z.array(elementSchema),
});

export const bookSchema = z.object({
  schemaVersion: z.literal(1),
  id: str(80).min(1),
  title: str(300),
  description: str(5000),
  author: str(300),
  updatedAt: str(40),
  settings: z
    .object({
      format: z.enum(['a4-portrait', 'a4-landscape', 'letter-portrait', 'square', 'widescreen']),
      showPageNumbers: z.boolean(),
      flipDuration: num(0, 5000),
      pageSound: z.boolean().optional(),
      pageSoundStyle: z.enum(['hojas', 'libro', 'suave', 'brisa', 'clasico']).optional(),
      hands: z
        .object({
          enabled: z.boolean(),
          tone: str(60),
          sleeve: str(60),
        })
        .optional(),
    })
    .loose(),
  pages: z.array(pageSchema).min(1),
});

export type ParseResult = { ok: true; book: Book } | { ok: false; error: string };

/** Valida un objeto desconocido y lo convierte en `Book`. */
export function parseBook(data: unknown): ParseResult {
  const result = bookSchema.safeParse(data);
  if (result.success) return { ok: true, book: result.data as Book };
  const issue = result.error.issues[0];
  const where = issue?.path.join('.') || 'raíz';
  return { ok: false, error: `Contenido inválido en «${where}»: ${issue?.message ?? 'error desconocido'}` };
}

/** Lee y valida un JSON en texto. */
export function parseBookJson(text: string): ParseResult {
  try {
    return parseBook(JSON.parse(text));
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' };
  }
}
