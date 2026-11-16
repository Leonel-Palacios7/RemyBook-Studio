import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  window.location.hash = '';
  try {
    localStorage.clear();
  } catch {
    /* sin almacenamiento */
  }
});

// jsdom no implementa matchMedia ni ResizeObserver: se simulan para las pruebas.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

class ResizeObserverMock {
  private cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
  }
  observe() {
    this.cb([], this as unknown as ResizeObserver);
  }
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Tamaño simulado para que el lector y el lienzo calculen dimensiones.
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1280 });
Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 800 });

// jsdom no incluye PointerEvent: polyfill mínimo basado en MouseEvent.
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? 'mouse';
    }
  }
  window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}
