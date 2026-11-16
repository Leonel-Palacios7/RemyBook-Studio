import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { FlipBook } from './FlipBook';

function Harness({ initial = 0, onChange, onTurnStart }: { initial?: number; onChange?: (v: number) => void; onTurnStart?: (d: 1 | -1) => void }) {
  const [view, setView] = useState(initial);
  return (
    <>
      <button onClick={() => setView((v) => v + 1)}>siguiente</button>
      <FlipBook
        pageCount={6}
        mode="double"
        view={view}
        onViewChange={(v) => {
          setView(v);
          onChange?.(v);
        }}
        pageWidth={200}
        pageHeight={280}
        duration={0}
        onTurnStart={onTurnStart}
        renderPage={(i) => <div data-testid={`page-${i}`}>Página {i + 1}</div>}
      />
    </>
  );
}

describe('<FlipBook />', () => {
  it('renderiza la portada y las hojas cercanas', () => {
    render(<Harness />);
    expect(screen.getByTestId('flipbook')).toHaveAttribute('data-view', '0');
    expect(screen.getByTestId('page-0')).toBeInTheDocument();
  });

  it('gira cuando cambia la vista controlada', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('siguiente'));
    const book = screen.getByTestId('flipbook');
    expect(book).toHaveAttribute('data-view', '1');
    expect(book).toHaveAttribute('data-turning', 'false');
    const leaf0 = book.querySelector('[data-leaf="0"]') as HTMLElement;
    expect(leaf0.style.transform).toContain('rotateY(-180deg)');
  });

  it('pasa la página con un clic en la mitad derecha', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const book = screen.getByTestId('flipbook');
    book.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 280, right: 400, bottom: 280, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.pointerDown(book, { clientX: 350, clientY: 100, pointerId: 1, button: 0 });
    fireEvent.pointerUp(book, { clientX: 350, clientY: 100, pointerId: 1 });
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('completa el giro al arrastrar más de un tercio', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const book = screen.getByTestId('flipbook');
    book.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 280, right: 400, bottom: 280, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.pointerDown(book, { clientX: 390, clientY: 100, pointerId: 2, button: 0 });
    fireEvent.pointerMove(book, { clientX: 300, clientY: 100, pointerId: 2 });
    fireEvent.pointerMove(book, { clientX: 200, clientY: 100, pointerId: 2 });
    expect(book).toHaveAttribute('data-turning', 'true');
    fireEvent.pointerUp(book, { clientX: 200, clientY: 100, pointerId: 2 });
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('cancela el giro si el arrastre es corto', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const book = screen.getByTestId('flipbook');
    book.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 280, right: 400, bottom: 280, x: 0, y: 0, toJSON: () => ({}) });
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    fireEvent.pointerDown(book, { clientX: 390, clientY: 100, pointerId: 3, button: 0 });
    vi.spyOn(performance, 'now').mockReturnValue(2000);
    fireEvent.pointerMove(book, { clientX: 370, clientY: 100, pointerId: 3 });
    fireEvent.pointerUp(book, { clientX: 370, clientY: 100, pointerId: 3 });
    expect(onChange).not.toHaveBeenCalled();
    expect(book).toHaveAttribute('data-view', '0');
    vi.restoreAllMocks();
  });

  it('avisa el inicio de cada giro (para el sonido)', () => {
    const onTurnStart = vi.fn();
    render(<Harness onTurnStart={onTurnStart} />);
    fireEvent.click(screen.getByText('siguiente'));
    expect(onTurnStart).toHaveBeenCalledWith(1);
    const book = screen.getByTestId('flipbook');
    book.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 280, right: 400, bottom: 280, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.pointerDown(book, { clientX: 10, clientY: 100, pointerId: 9, button: 0 });
    fireEvent.pointerMove(book, { clientX: 120, clientY: 100, pointerId: 9 });
    expect(onTurnStart).toHaveBeenLastCalledWith(-1);
  });
});
