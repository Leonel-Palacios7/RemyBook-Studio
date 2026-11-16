import { afterEach, describe, expect, it, vi } from 'vitest';
import { __resetSoundForTests, playPageTurn, schedulePageTurn, SOUND_STYLES } from './sound';

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
    const node = Object.assign(new FakeNode(), { buffer: null, start: vi.fn((t: number) => this.started.push(t)) });
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
    expect(playPageTurn({ duration: 800 })).toBe(true);
    expect(playPageTurn({ duration: 400 })).toBe(true);
    expect(FakeAudioContext.instances).toBe(1);
  });

  it.each(SOUND_STYLES.map((s) => s.value))('programa el estilo «%s»', (style) => {
    const ac = new FakeAudioContext();
    expect(schedulePageTurn(ac as unknown as BaseAudioContext, { style, direction: -1 })).toBe(true);
    expect(ac.started.length).toBeGreaterThan(0);
    if (style !== 'clasico') expect(ac.oscillators).toBeGreaterThan(0);
  });

  it('respeta el volumen cero', () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    expect(playPageTurn({ volume: 0 })).toBe(false);
  });
});
