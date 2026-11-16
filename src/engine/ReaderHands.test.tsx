import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ReaderHands } from './ReaderHands';

const xOf = (el: Element | null) => Number(/translate3d\(([-\d.]+)px/.exec((el as HTMLElement).style.transform)![1]);
const base = { mode: 'double' as const, pageWidth: 200, pageHeight: 280, canNext: true, canPrev: true };

describe('<ReaderHands /> (manito del cursor)', () => {
  it('en reposo señala la esquina de la página siguiente', () => {
    const { container } = render(<ReaderHands {...base} turn={null} />);
    const hand = container.querySelector('.fb-hand') as HTMLElement;
    expect(container.querySelectorAll('.fb-hand')).toHaveLength(1);
    expect(hand).toHaveClass('is-point');
    expect(xOf(hand)).toBeGreaterThan(300);
    expect(container.querySelector('.fb-hands')).toHaveAttribute('aria-hidden', 'true');
  });

  it('en la última página señala la esquina izquierda', () => {
    const { container } = render(<ReaderHands {...base} canNext={false} turn={null} />);
    expect(xOf(container.querySelector('.fb-hand'))).toBeLessThan(100);
  });

  it('se oculta si no hay hacia dónde pasar', () => {
    const { container } = render(<ReaderHands {...base} mode="single" canNext={false} canPrev={false} turn={null} />);
    expect((container.querySelector('.fb-hand') as HTMLElement).style.opacity).toBe('0');
  });

  it('al girar cambia a puño y arrastra el borde de la hoja sin saltos', () => {
    const at = (angle: number) => render(<ReaderHands {...base} turn={{ angle, direction: 1 }} />).container.querySelector('.fb-hand');
    expect(at(-90)).toHaveClass('is-grab');
    expect(at(-90)?.closest('.fb-hands')).toHaveClass('is-turning');
    let prev = xOf(at(0));
    for (let a = -2; a >= -180; a -= 2) {
      const x = xOf(at(a));
      expect(x).toBeLessThanOrEqual(prev + 0.01);
      expect(prev - x).toBeLessThan(12);
      prev = x;
    }
    expect(prev).toBeLessThan(40);
  });
});
