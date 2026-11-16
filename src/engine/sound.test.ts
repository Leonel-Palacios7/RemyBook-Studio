import { afterEach, describe, expect, it, vi } from 'vitest';
import { __resetSoundForTests, __setSampleForTests, isSampleStyle, playPageTurn, schedulePageTurn, SOUND_STYLES } from './sound';

const fakeBuffer = { duration: 0.9 } as unknown as AudioBuffer;

function fakeParam() {
  return { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
}

class FakeNode {
  connect = vi.fn((next: unknown) => next);
}

class FakeAudioContext {
  static instances = 0;
  state = 'suspended';
  currentTime = 0;
  sampleRate = 8000;
  destination = {};
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  started: number[] = [];
  constructor() {
    FakeAudioContext.instances++;
  }
  createBuffer(_c: number, length: number, sampleRate: number) {
    const data = new Float32Array(length);
    return { sampleRate, getChannelData: () => data };
  }
  createBufferSource() {
    const node = Object.assign(new FakeNode(), { buffer: null, playbackRate: fakeParam(), start: vi.fn((t: number) => this.started.push(t)) });
    return node;
  }
  createBiquadFilter() {
    return Object.assign(new FakeNode(), { type: '', Q: fakeParam(), frequency: fakeParam() });
  }
  oscillators = 0;
  createOscillator() {
    this.oscillators++;
    return Object.assign(new FakeNode(), { type: '', frequency: fakeParam(), start: vi.fn(), stop: vi.fn() });
  }
  createStereoPanner() {
    return Object.assign(new FakeNode(), { pan: fakeParam() });
  }
  decodeAudioData = vi.fn(async () => fakeBuffer);
  createGain() {
    return Object.assign(new FakeNode(), { gain: fakeParam() });
  }
}

describe('sonido de paso de página', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    __resetSoundForTests();
  });

  it('no falla cuando el navegador no tiene audio', () => {
    vi.stubGlobal('AudioContext', undefined);
    expect(playPageTurn()).toBe(false);
  });

  it('sintetiza el roce y el golpe final, y reutiliza el contexto', () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    FakeAudioContext.instances = 0;
    expect(playPageTurn({ duration: 800, style: 'suave' })).toBe(true);
    expect(playPageTurn({ duration: 400, style: 'brisa' })).toBe(true);
    expect(FakeAudioContext.instances).toBe(1);
  });

  it.each(SOUND_STYLES.map((s) => s.value))('programa el estilo «%s»', (style) => {
    const ac = new FakeAudioContext();
    if (isSampleStyle(style)) {
      expect(schedulePageTurn(ac as unknown as BaseAudioContext, { style })).toBe(false);
      __setSampleForTests(style, fakeBuffer);
    }
    expect(schedulePageTurn(ac as unknown as BaseAudioContext, { style, direction: -1 })).toBe(true);
    expect(ac.started.length).toBeGreaterThan(0);
    if (style === 'suave' || style === 'brisa') expect(ac.oscillators).toBeGreaterThan(0);
  });

  it('respeta el volumen cero', () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    expect(playPageTurn({ volume: 0 })).toBe(false);
  });

  it('descarga la grabación la primera vez y luego la reproduce', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const fetchMock = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }));
    vi.stubGlobal('fetch', fetchMock);
    expect(playPageTurn({ style: 'hojas', wait: true })).toBe(true);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await new Promise((r) => setTimeout(r, 0));
    expect(playPageTurn({ style: 'hojas' })).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('usa el papel sintetizado si la grabación no carga', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
    expect(playPageTurn({ style: 'libro' })).toBe(true);
    await new Promise((r) => setTimeout(r, 0));
  });
});
