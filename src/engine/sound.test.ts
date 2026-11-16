import { afterEach, describe, expect, it, vi } from 'vitest';
import { __resetSoundForTests, playPageTurn } from './sound';

function fakeParam() {
  return { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
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

  it('respeta el volumen cero', () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    expect(playPageTurn({ volume: 0 })).toBe(false);
  });
});
