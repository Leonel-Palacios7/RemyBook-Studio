import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { DEFAULT_HANDS } from './hands';
import { ReaderHands } from './ReaderHands';

const look = { tone: DEFAULT_HANDS.tone, sleeve: DEFAULT_HANDS.sleeve };

describe('<ReaderHands />', () => {
  it('sostiene el libro con dos manos en doble página', () => {
    const { container } = render(
      <ReaderHands mode="double" pageWidth={200} pageHeight={280} hasLeft hasRight turn={null} look={look} />,
    );
    expect(container.querySelectorAll('.fb-hand')).toHaveLength(2);
    expect(container.querySelector('.fb-hands')).toHaveAttribute('aria-hidden', 'true');
  });

  it('usa una sola mano en móvil', () => {
    const { container } = render(
      <ReaderHands mode="single" pageWidth={200} pageHeight={280} hasLeft hasRight turn={null} look={look} />,
    );
    expect(container.querySelectorAll('.fb-hand')).toHaveLength(1);
    expect(container.querySelector('.fb-hand.is-right')).not.toBeNull();
  });

  it('la mano derecha acompaña la hoja al avanzar', () => {
    const { container } = render(
      <ReaderHands mode="double" pageWidth={200} pageHeight={280} hasLeft hasRight turn={{ angle: -90, direction: 1 }} look={look} />,
    );
    const right = container.querySelector('.fb-hand.is-right') as HTMLElement;
    expect(container.querySelector('.fb-hands')).toHaveClass('is-turning');
    const rest = render(
      <ReaderHands mode="double" pageWidth={200} pageHeight={280} hasLeft hasRight turn={null} look={look} />,
    ).container.querySelector('.fb-hand.is-right') as HTMLElement;
    // A 90° el borde de la hoja está en el lomo: la mano se ha movido hacia el centro.
    expect(parseFloat(right.style.left)).toBeLessThan(parseFloat(rest.style.left));
  });

  it('se mueve sin saltos: al terminar el giro vuelve exactamente al reposo', () => {
    const at = (angle: number) =>
      parseFloat(
        (
          render(
            <ReaderHands mode="double" pageWidth={200} pageHeight={280} hasLeft hasRight turn={{ angle, direction: 1 }} look={look} />,
          ).container.querySelector('.fb-hand.is-right') as HTMLElement
        ).style.left,
      );
    const rest = at(0);
    let prev = rest;
    for (let a = -2; a >= -180; a -= 2) {
      const x = at(a);
      expect(Math.abs(x - prev)).toBeLessThan(12);
      prev = x;
    }
    expect(prev).toBeCloseTo(rest, 5);
  });

  it('oculta con transparencia la mano del lado sin página', () => {
    const { container } = render(
      <ReaderHands mode="double" pageWidth={200} pageHeight={280} hasLeft={false} hasRight turn={null} look={look} />,
    );
    expect((container.querySelector('.fb-hand.is-left') as HTMLElement).style.opacity).toBe('0');
  });

  it('pinta la manga con el color elegido', () => {
    const { container } = render(
      <ReaderHands mode="single" pageWidth={200} pageHeight={280} hasLeft={false} hasRight turn={null} look={{ ...look, sleeve: '#123456' }} />,
    );
    expect(container.querySelector('path[fill="#123456"]')).not.toBeNull();
  });
});
