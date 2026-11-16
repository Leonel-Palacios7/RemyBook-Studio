/**
 * Sonido de paso de página sintetizado con Web Audio API: no usa archivos
 * de audio (sin descargas, sin derechos de terceros y compatible con la CSP).
 *
 * Hay tres estilos (papel suave, brisa y clásico). Todos usan ruido rosado
 * filtrado con envolventes suaves, paneo estéreo que sigue a la hoja y un
 * compresor que evita picos. Cada giro varía un poco para no sonar mecánico.
 */

type AudioCtor = typeof AudioContext;

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor: AudioCtor | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  // Los navegadores suspenden el audio hasta una interacción del usuario.
  if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  return ctx;
}

function noiseBuffer(ac: BaseAudioContext): AudioBuffer {
  if (noise && noise.sampleRate === ac.sampleRate) return noise;
  const length = Math.floor(ac.sampleRate * 1.2);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  // Ruido "rosado" aproximado: más cálido que el ruido blanco, suena a papel.
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.2;
  }
  noise = buffer;
  return buffer;
}

export type SoundStyle = 'suave' | 'brisa' | 'clasico';

export const SOUND_STYLES: { value: SoundStyle; label: string; description: string }[] = [
  { value: 'suave', label: 'Papel suave', description: 'Roce cálido y amortiguado que viaja de un lado al otro.' },
  { value: 'brisa', label: 'Brisa y campanita', description: 'Soplo de aire con una nota de campana muy suave.' },
  { value: 'clasico', label: 'Papel clásico', description: 'Roce más brillante, como una revista.' },
];

export interface PageTurnSoundOptions {
  /** Volumen 0–1. */
  volume?: number;
  /** Duración del giro en ms: el sonido se ajusta a ella. */
  duration?: number;
  style?: SoundStyle;
  /** 1 = hacia adelante (el sonido viaja de derecha a izquierda), -1 = hacia atrás. */
  direction?: 1 | -1;
}

interface Voice {
  ac: BaseAudioContext;
  out: AudioNode;
  now: number;
  len: number;
  jitter: number;
  buffer: AudioBuffer;
}

/** Ruido filtrado con envolvente: base de todos los estilos. */
function rustle(
  v: Voice,
  o: { from: number; to: number; type: BiquadFilterType; q: number; peak: number; attack: number; offset?: number; length?: number },
) {
  const { ac, out, now, jitter } = v;
  const start = now + (o.offset ?? 0);
  const len = o.length ?? v.len;
  const src = ac.createBufferSource();
  src.buffer = v.buffer;
  const filter = ac.createBiquadFilter();
  filter.type = o.type;
  filter.Q.value = o.q;
  filter.frequency.setValueAtTime(o.from * jitter, start);
  filter.frequency.exponentialRampToValueAtTime(o.to * jitter, start + len);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(o.peak, start + o.attack);
  gain.gain.exponentialRampToValueAtTime(o.peak * 0.45, start + len * 0.55);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + len);
  src.connect(filter).connect(gain).connect(out);
  src.start(start, Math.random() * 0.2, len + 0.05);
}

/** Tono senoidal con caída suave (cuerpo grave o campanita). */
function tone(v: Voice, o: { freq: number; to?: number; at: number; peak: number; decay: number }) {
  const { ac, out } = v;
  const start = v.now + o.at;
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(o.freq, start);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, start + o.decay);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(o.peak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + o.decay);
  osc.connect(gain).connect(out);
  osc.start(start);
  osc.stop(start + o.decay + 0.05);
}

/** Reproduce el sonido de pasar una hoja. Devuelve `false` si no hay audio disponible. */
export function playPageTurn(options: PageTurnSoundOptions = {}): boolean {
  const ac = getContext();
  if (!ac || (options.volume ?? 0.6) <= 0) return false;
  return schedulePageTurn(ac, options);
}

/**
 * Programa el sonido en cualquier contexto de audio (también en un
 * OfflineAudioContext, útil para exportar muestras o probar).
 */
export function schedulePageTurn(
  ac: BaseAudioContext,
  { volume = 0.6, duration = 800, style = 'suave', direction = 1 }: PageTurnSoundOptions = {},
): boolean {
  try {
    const now = ac.currentTime;
    const len = Math.min(1.1, Math.max(0.3, (duration / 1000) * 0.8));
    const master = ac.createGain();
    master.gain.value = volume;
    // Paneo estéreo: el sonido acompaña a la hoja de un lado al otro.
    let out: AudioNode = master;
    if (typeof ac.createStereoPanner === 'function') {
      const pan = ac.createStereoPanner();
      pan.pan.setValueAtTime(0.45 * direction, now);
      pan.pan.linearRampToValueAtTime(-0.45 * direction, now + len);
      pan.connect(master);
      out = pan;
    }
    // Compresor suave: evita picos molestos en parlantes pequeños.
    const comp = ac.createDynamicsCompressor?.();
    if (comp) {
      master.connect(comp).connect(ac.destination);
    } else {
      master.connect(ac.destination);
    }
    const v: Voice = { ac, out, now, len, jitter: 0.9 + Math.random() * 0.2, buffer: noiseBuffer(ac) };

    if (style === 'clasico') {
      rustle(v, { from: 4200, to: 900, type: 'bandpass', q: 0.7, peak: 0.9, attack: 0.035 });
      rustle(v, { from: 420, to: 380, type: 'lowpass', q: 0.5, peak: 0.7, attack: 0.012, offset: len * 0.82, length: 0.15 });
    } else if (style === 'brisa') {
      rustle(v, { from: 1600, to: 600, type: 'lowpass', q: 0.3, peak: 0.75, attack: len * 0.35 });
      // Campanita: quinta justa (La5 + Mi6) muy baja de volumen.
      tone(v, { freq: 880, at: len * 0.78, peak: 0.16, decay: 0.9 });
      tone(v, { freq: 1318.5, at: len * 0.8, peak: 0.06, decay: 0.7 });
    } else {
      // Papel suave: roce cálido, sin agudos ásperos, con cuerpo grave al asentarse.
      rustle(v, { from: 2600, to: 1100, type: 'lowpass', q: 0.4, peak: 0.55, attack: 0.08 });
      rustle(v, { from: 1400, to: 900, type: 'bandpass', q: 0.9, peak: 0.25, attack: 0.05, offset: len * 0.15, length: len * 0.6 });
      tone(v, { freq: 140, to: 70, at: len * 0.84, peak: 0.22, decay: 0.22 });
    }
    return true;
  } catch {
    return false;
  }
}

/** Solo para pruebas: reinicia el contexto en memoria. */
export function __resetSoundForTests(): void {
  ctx = null;
  noise = null;
}
