/** Utilidades del navegador: pantalla completa, compartir, descargas, archivos. */

export function isFullscreen(): boolean {
  return Boolean(document.fullscreenElement);
}

export async function toggleFullscreen(el: HTMLElement = document.documentElement): Promise<void> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen?.();
  } catch {
    /* El navegador puede negar la pantalla completa; no es un error crítico. */
  }
}

export type ShareResult = 'shared' | 'copied' | 'failed';

export async function shareLink(data: { title: string; text?: string; url: string }): Promise<ShareResult> {
  try {
    if (navigator.share) {
      await navigator.share(data);
      return 'shared';
    }
  } catch (err) {
    if ((err as DOMException)?.name === 'AbortError') return 'failed';
  }
  try {
    await navigator.clipboard.writeText(data.url);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export function downloadText(filename: string, text: string, type = 'application/json'): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml'];

/** Lee una imagen local como data URL (solo formatos de imagen permitidos). */
export function readImageAsDataUrl(file: File): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) {
    return Promise.reject(new Error('Formato de imagen no permitido.'));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function slugify(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'publicacion'
  );
}
