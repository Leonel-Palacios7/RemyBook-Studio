/**
 * Utilidades de seguridad para contenido aportado por el usuario.
 * Nunca se inserta HTML: el texto se renderiza como texto plano y las
 * URLs de imágenes se restringen a esquemas seguros.
 */

const SAFE_DATA_IMAGE = /^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml);base64,[a-z0-9+/=\s]+$/i;

/** Devuelve la URL si es segura para usar como fuente de imagen; si no, cadena vacía. */
export function safeImageUrl(raw: string | undefined | null): string {
  if (!raw) return '';
  const value = raw.trim();
  if (SAFE_DATA_IMAGE.test(value)) return value;
  if (value.startsWith('blob:')) return value;
  try {
    const url = new URL(value, 'https://local.invalid/');
    if (url.protocol === 'https:' && url.host !== 'local.invalid') return url.href;
    // Rutas relativas a la propia aplicación (p. ej. ./assets/foto.webp).
    if (url.host === 'local.invalid' && /^(\.\/|\/|[a-z0-9_-])/i.test(value) && !value.includes(':')) {
      return value;
    }
  } catch {
    return '';
  }
  return '';
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FUNC = /^(rgb|rgba|hsl|hsla)\(\s*[-\d.%\s,/]+\)$/i;

/** Acepta colores hexadecimales, rgb()/hsl() o `transparent`. */
export function safeColor(raw: string | undefined | null, fallback = 'transparent'): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (value === 'transparent' || HEX.test(value) || FUNC.test(value)) return value;
  return fallback;
}

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
