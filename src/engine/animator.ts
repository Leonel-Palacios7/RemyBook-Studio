import { easeInOutCubic } from './layout';

export type Cancel = () => void;

/**
 * Anima un valor numérico con requestAnimationFrame. Si la duración es 0
 * (o el usuario prefiere movimiento reducido) termina de inmediato.
 */
export function animateValue(
  from: number,
  to: number,
  duration: number,
  onFrame: (value: number) => void,
  onDone: () => void,
  easing: (t: number) => number = easeInOutCubic,
): Cancel {
  if (duration <= 0 || typeof requestAnimationFrame === 'undefined') {
    onFrame(to);
    onDone();
    return () => undefined;
  }
  let raf = 0;
  let start: number | null = null;
  let cancelled = false;
  const step = (now: number) => {
    if (cancelled) return;
    if (start === null) start = now;
    const t = Math.min(1, (now - start) / duration);
    onFrame(from + (to - from) * easing(t));
    if (t < 1) raf = requestAnimationFrame(step);
    else onDone();
  };
  raf = requestAnimationFrame(step);
  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
  };
}
