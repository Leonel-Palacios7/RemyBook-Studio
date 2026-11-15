import { describe, expect, it, vi } from 'vitest';
import { animateValue } from './animator';

describe('animateValue', () => {
  it('termina de inmediato cuando la duración es 0', () => {
    const frames: number[] = [];
    const done = vi.fn();
    animateValue(0, 1, 0, (v) => frames.push(v), done);
    expect(frames).toEqual([1]);
    expect(done).toHaveBeenCalledOnce();
  });

  it('anima con requestAnimationFrame y se puede cancelar', () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => callbacks.push(cb));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const frames: number[] = [];
    const done = vi.fn();
    animateValue(0, 10, 100, (v) => frames.push(v), done, (t) => t);
    callbacks.shift()!(0);
    callbacks.shift()!(50);
    expect(frames).toEqual([0, 5]);
    callbacks.shift()!(100);
    expect(frames.at(-1)).toBe(10);
    expect(done).toHaveBeenCalledOnce();

    const cancel = animateValue(0, 1, 100, (v) => frames.push(v), done);
    cancel();
    const before = frames.length;
    callbacks.shift()?.(0);
    expect(frames.length).toBe(before);
    vi.unstubAllGlobals();
  });
});
