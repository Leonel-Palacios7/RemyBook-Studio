import { describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { BookProvider } from '@/store/BookProvider';
import { createMemoryAdapter } from '@/store/persistence';
import { createDefaultBook, createText } from '@/content/factories';
import type { Book } from '@/domain/types';

async function renderApp(book?: Book) {
  const storage = createMemoryAdapter();
  const utils = render(
    <BookProvider storage={storage} initialBook={book} saveDelay={0}>
      <App />
    </BookProvider>,
  );
  // Espera la carga inicial asíncrona desde el almacenamiento.
  await act(async () => {});
  return { ...utils, storage };
}

const toolbar = () => screen.getByRole('toolbar', { name: 'Controles del lector' });

describe('integración: lector', () => {
  it('muestra la portada y navega con teclado y botones', async () => {
    await renderApp();
    expect(await screen.findByText('1 / 8')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('2–3 / 8')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'End' });
    expect(screen.getByText('8 / 8')).toBeInTheDocument();
    fireEvent.click(within(toolbar()).getByLabelText('Primera página'));
    expect(screen.getByText('1 / 8')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Página siguiente'));
    expect(screen.getByText('2–3 / 8')).toBeInTheDocument();
    await waitFor(() => expect(window.location.hash).toBe('#/leer?p=2'));
  });

  it('salta a una página escrita en la barra', async () => {
    await renderApp();
    const input = screen.getByLabelText('Ir a la página');
    await userEvent.clear(input);
    await userEvent.type(input, '6{Enter}');
    expect(screen.getByText('6–7 / 8')).toBeInTheDocument();
  });

  it('controla el zoom con botones y teclado', async () => {
    await renderApp();
    fireEvent.click(screen.getByLabelText('Acercar'));
    expect(screen.getByText('125%')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: '-' });
    fireEvent.keyDown(window, { key: '-' });
    expect(screen.getByText('75%')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: '0' });
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('busca texto y navega al resultado; muestra índice y miniaturas', async () => {
    const book = createDefaultBook();
    book.pages[4]!.elements.push(createText({ text: 'Aprendizaje por proyectos' }));
    book.pages[4]!.title = 'Metodología';
    await renderApp(book);

    fireEvent.click(screen.getByLabelText('Buscar'));
    await userEvent.type(screen.getByPlaceholderText('Buscar texto…'), 'proyectos');
    expect(screen.getByText('1 resultado')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Página 5'));
    expect(screen.getByText('4–5 / 8')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Índice'));
    const toc = screen.getByRole('complementary', { name: 'Índice' });
    expect(within(toc).getByText('Metodología')).toBeInTheDocument();
    fireEvent.click(within(toc).getByText('Portada'));
    expect(screen.getByText('1 / 8')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Miniaturas'));
    const thumbs = screen.getByRole('complementary', { name: 'Miniaturas' });
    fireEvent.click(within(thumbs).getByLabelText('Ir a la página 8: Contraportada'));
    expect(screen.getByText('8 / 8')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('complementary', { name: 'Miniaturas' })).not.toBeInTheDocument();
  });

  it('comparte copiando el enlace cuando no hay Web Share', async () => {
    const writes: string[] = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (t: string) => void writes.push(t) },
    });
    await renderApp();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Compartir'));
    });
    expect(await screen.findByText('Enlace copiado al portapapeles')).toBeInTheDocument();
    expect(writes[0]).toContain('#/leer?p=1');
  });
});

describe('integración: editor', () => {
  it('agrega texto y formas, deshace, y el lector refleja los cambios', async () => {
    const { storage } = await renderApp();
    fireEvent.click(screen.getByRole('button', { name: /Editor/ }));
    expect(await screen.findByTestId('canvas-page')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Texto/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Título' }));
    expect(screen.getAllByTestId('element-text')).toHaveLength(1);

    // El inspector permite editar el contenido.
    const content = screen.getByLabelText('Contenido');
    fireEvent.change(content, { target: { value: 'Mi primera publicación' } });
    expect(screen.getByTestId('canvas-page')).toHaveTextContent('Mi primera publicación');

    fireEvent.click(screen.getByRole('button', { name: /Formas/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Estrella/ }));
    expect(screen.getAllByTestId('element-shape')).toHaveLength(1);

    fireEvent.click(screen.getByLabelText('Deshacer'));
    expect(screen.queryAllByTestId('element-shape')).toHaveLength(0);
    fireEvent.click(screen.getByLabelText('Rehacer'));
    expect(screen.getAllByTestId('element-shape')).toHaveLength(1);

    // Eliminar con teclado.
    fireEvent.keyDown(window, { key: 'Delete' });
    expect(screen.queryAllByTestId('element-shape')).toHaveLength(0);

    // Guardado automático.
    await waitFor(async () => {
      const saved = await storage.load();
      expect(saved?.pages[0]?.elements).toHaveLength(1);
    });

    fireEvent.click(screen.getByRole('button', { name: /Vista previa/ }));
    expect(await screen.findByRole('toolbar', { name: 'Controles del lector' })).toBeInTheDocument();
    expect(screen.queryByText('Tu publicación está en blanco')).not.toBeInTheDocument();
  });

  it('gestiona páginas: agregar, duplicar, mover y eliminar', async () => {
    await renderApp();
    fireEvent.click(screen.getByRole('button', { name: /Editor/ }));
    await screen.findByTestId('canvas-page');
    const sidebar = screen.getByRole('complementary', { name: 'Páginas' });
    fireEvent.click(within(sidebar).getByRole('button', { name: /Agregar página/ }));
    expect(within(sidebar).getByText('9')).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 9')).toBeInTheDocument();

    fireEvent.click(within(sidebar).getByLabelText('Duplicar página 1'));
    expect(within(sidebar).getByText('10')).toBeInTheDocument();
    fireEvent.click(within(sidebar).getByLabelText('Eliminar página 2'));
    fireEvent.click(within(sidebar).getByLabelText('Eliminar página 2'));
    expect(within(sidebar).getByText('8')).toBeInTheDocument();
    fireEvent.click(within(sidebar).getByLabelText('Bajar página 1'));
    expect(within(sidebar).getByLabelText('Editar página 2: Portada')).toBeInTheDocument();
  });

  it('edita la página y los datos de la publicación', async () => {
    await renderApp();
    fireEvent.click(screen.getByRole('button', { name: /Editor/ }));
    await screen.findByTestId('canvas-page');
    fireEvent.click(screen.getByRole('tab', { name: 'Página' }));
    fireEvent.change(screen.getByLabelText('Título (aparece en el índice y la búsqueda)'), { target: { value: 'Introducción' } });
    expect(screen.getByLabelText('Editar página 1: Introducción')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Publicación' }));
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Guía de aprendizaje' } });
    expect(screen.getByText('Guía de aprendizaje')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Formato de página'), { target: { value: 'square' } });
    expect((screen.getByLabelText('Formato de página') as HTMLSelectElement).value).toBe('square');
  });

  it('rechaza importar un JSON inválido sin perder el contenido', async () => {
    await renderApp();
    fireEvent.click(screen.getByRole('button', { name: /Editor/ }));
    await screen.findByTestId('canvas-page');
    fireEvent.click(screen.getByRole('tab', { name: 'Publicación' }));
    const file = new File(['{"hola":1}'], 'malo.json', { type: 'application/json' });
    await act(async () => {
      fireEvent.change(screen.getByTestId('import-input'), { target: { files: [file] } });
    });
    expect(await screen.findByText(/Contenido inválido/)).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 8')).toBeInTheDocument();
  });
});

describe('integración: plantillas', () => {
  it('aplica una plantilla desde el editor y se puede deshacer', async () => {
    await renderApp();
    fireEvent.click(screen.getByRole('button', { name: /Editor/ }));
    await screen.findByTestId('canvas-page');
    fireEvent.click(screen.getByRole('button', { name: /Plantillas/ }));
    const dialog = screen.getByRole('dialog', { name: 'Plantillas de turismo' });
    expect(within(dialog).getAllByRole('button', { name: /Ver plantilla/ })).toHaveLength(10);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Ver plantilla Selva viva' }));
    fireEvent.click(within(dialog).getByRole('button', { name: /Usar esta plantilla/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Página 1 de 6')).toBeInTheDocument();
    expect(screen.getByText(/Plantilla «Selva viva» aplicada/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Deshacer'));
    expect(screen.getByText('Página 1 de 8')).toBeInTheDocument();
  });

  it('se abre desde el lector cuando la publicación está en blanco y se cierra con Escape', async () => {
    await renderApp();
    fireEvent.click(screen.getByRole('button', { name: /Elegir una plantilla/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('integración: sonido', () => {
  it('silencia y reactiva el sonido de páginas con botón y tecla M', async () => {
    await renderApp();
    fireEvent.click(screen.getByLabelText('Silenciar sonido de páginas'));
    expect(screen.getByLabelText('Activar sonido de páginas')).toBeInTheDocument();
    expect(localStorage.getItem('sena-flipbook-studio:muted')).toBe('1');
    fireEvent.keyDown(window, { key: 'm' });
    expect(screen.getByLabelText('Silenciar sonido de páginas')).toBeInTheDocument();
  });

  it('oculta el control si la publicación tiene el sonido desactivado', async () => {
    const book = createDefaultBook();
    book.settings.pageSound = false;
    await renderApp(book);
    expect(screen.queryByLabelText(/sonido de páginas/)).not.toBeInTheDocument();
  });

  it('muestra y oculta las manos del lector con botón y tecla H', async () => {
    const { container } = await renderApp();
    await screen.findByText('1 / 8');
    expect(container.querySelector('.fb-hands')).not.toBeNull();
    fireEvent.click(screen.getByLabelText('Ocultar manos del lector'));
    expect(container.querySelector('.fb-hands')).toBeNull();
    expect(localStorage.getItem('sena-flipbook-studio:hands-hidden')).toBe('1');
    fireEvent.keyDown(window, { key: 'h' });
    expect(container.querySelector('.fb-hands')).not.toBeNull();
    expect(screen.getByLabelText('Ocultar manos del lector')).toBeInTheDocument();
  });

  it('configura sonido y manos desde el editor', async () => {
    const { container } = await renderApp();
    fireEvent.click(screen.getByRole('button', { name: /Editor/ }));
    await screen.findByTestId('canvas-page');
    fireEvent.click(screen.getByRole('tab', { name: 'Publicación' }));
    fireEvent.change(screen.getByLabelText('Tipo de sonido'), { target: { value: 'brisa' } });
    expect((screen.getByLabelText('Tipo de sonido') as HTMLSelectElement).value).toBe('brisa');
    fireEvent.click(screen.getByRole('radio', { name: 'Oscuro' }));
    expect(screen.getByRole('radio', { name: 'Oscuro' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByLabelText('Mostrar manos del lector'));
    expect(screen.queryByRole('radio', { name: 'Oscuro' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Lector/ }));
    await screen.findByText('1 / 8');
    expect(container.querySelector('.fb-hands')).toBeNull();
    expect(screen.queryByLabelText(/manos del lector/)).not.toBeInTheDocument();
  });
});
