/**
 * Sonido de paso de página sintetizado con Web Audio API: no usa archivos
 * de audio (sin descargas, sin derechos de terceros y compatible con la CSP).
 *
 * Se compone de un roce de papel (ruido filtrado con barrido de frecuencia)
 * y un golpe suave al asentarse la hoja. Cada giro varía un poco para que
 * no suene mecánico.
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

function noiseBuffer(ac: AudioContext): AudioBuffer {
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

export interface PageTurnSoundOptions {
  /** Volumen 0–1. */
  volume?: number;
  /** Duración del giro en ms: el sonido se ajusta a ella. */
  duration?: number;
}

/** Reproduce el sonido de pasar una hoja. Devuelve `false` si no hay audio disponible. */
export function playPageTurn({ volume = 0.6, duration = 800 }: PageTurnSoundOptions = {}): boolean {
  const ac = getContext();
  if (!ac || volume <= 0) return false;
  try {
    const now = ac.currentTime;
    const len = Math.min(1.1, Math.max(0.25, (duration / 1000) * 0.75));
    const jitter = 0.85 + Math.random() * 0.3;
    const buffer = noiseBuffer(ac);
    const out = ac.createGain();
    out.gain.value = volume;
    out.connect(ac.destination);

    // 1) Roce del papel: barrido de agudos a medios.
    const swish = ac.createBufferSource();
    swish.buffer = buffer;
    const band = ac.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 0.7;
    band.frequency.setValueAtTime(4200 * jitter, now);
    band.frequency.exponentialRampToValueAtTime(900 * jitter, now + len);
    const high = ac.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.value = 350;
    const swishGain = ac.createGain();
    swishGain.gain.setValueAtTime(0.0001, now);
    swishGain.gain.exponentialRampToValueAtTime(0.9, now + 0.035);
    swishGain.gain.exponentialRampToValueAtTime(0.35, now + len * 0.45);
    swishGain.gain.exponentialRampToValueAtTime(0.0001, now + len);
    swish.connect(band).connect(high).connect(swishGain).connect(out);
    swish.start(now, Math.random() * 0.1, len + 0.05);

    // 2) Hoja que se asienta: golpe grave y corto al final.
    const landAt = now + len * 0.82;
    const thud = ac.createBufferSource();
    thud.buffer = buffer;
    const low = ac.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 420;
    const thudGain = ac.createGain();
    thudGain.gain.setValueAtTime(0.0001, landAt);
    thudGain.gain.exponentialRampToValueAtTime(0.8, landAt + 0.012);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, landAt + 0.14);
    thud.connect(low).connect(thudGain).connect(out);
    thud.start(landAt, 0.3, 0.16);
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
