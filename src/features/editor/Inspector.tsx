import { useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  BringToFront,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FilePlus2,
  ImageUp,
  Italic,
  Lock,
  Play,
  SendToBack,
  Trash2,
  Underline,
  Unlock,
  Upload,
} from 'lucide-react';
import type { Book, ImageElement, ImageMask, Page, PageElement, PageFormat, ShapeElement, ShapeType, TextElement } from '@/domain/types';
import { FONT_FAMILIES, PAGE_FORMATS } from '@/config/app.config';
import { createDefaultBook } from '@/content/factories';
import { parseBookJson } from '@/content/schema';
import { downloadText, readFileAsText, readImageAsDataUrl, slugify } from '@/lib/browser';
import { safeImageUrl } from '@/lib/sanitize';
import type { BookAction } from '@/store/bookReducer';
import { DEFAULT_HANDS } from '@/engine/hands';
import { DEFAULT_SOUND_STYLE, playPageTurn, SOUND_STYLES, type SoundStyle } from '@/engine/sound';
import { ColorField, NumberField, RangeField, Section, Segmented } from './fields';

type Tab = 'element' | 'page' | 'book';

const SHAPE_OPTIONS: [ShapeType, string][] = [
  ['rect', 'Rectángulo'],
  ['ellipse', 'Elipse'],
  ['arch', 'Arco'],
  ['wave', 'Onda'],
  ['blob', 'Forma orgánica'],
  ['leaf', 'Hoja'],
  ['triangle', 'Triángulo'],
  ['hexagon', 'Hexágono'],
  ['diamond', 'Rombo'],
  ['star', 'Estrella'],
  ['arrow', 'Flecha'],
  ['line', 'Línea'],
];

const IMAGE_MASKS: [ImageMask, string][] = [
  ['none', 'Rectángulo (usa el radio)'],
  ['arch', 'Arco'],
  ['circle', 'Círculo'],
  ['pill', 'Píldora'],
  ['blob', 'Orgánica'],
  ['leaf', 'Hoja'],
  ['hexagon', 'Hexágono'],
  ['diamond', 'Rombo'],
];

interface Props {
  book: Book;
  page: Page;
  element: PageElement | null;
  dispatch: (action: BookAction) => void;
  onDeselect: () => void;
  notify: (msg: string) => void;
}

export function Inspector({ book, page, element, dispatch, onDeselect, notify }: Props) {
  const [tab, setTab] = useState<Tab>(element ? 'element' : 'page');
  const lastElement = useRef<string | null>(null);
  useEffect(() => {
    if (element && element.id !== lastElement.current) setTab('element');
    if (!element && tab === 'element') setTab('page');
    lastElement.current = element?.id ?? null;
  }, [element, tab]);

  return (
    <aside className="inspector card" aria-label="Propiedades">
      <div className="insp-tabs" role="tablist" aria-label="Propiedades">
        {(
          [
            ['element', 'Elemento'],
            ['page', 'Página'],
            ['book', 'Publicación'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'is-active' : ''}
            disabled={key === 'element' && !element}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="insp-scroll" role="tabpanel">
        {tab === 'element' && element && (
          <ElementPanel page={page} el={element} dispatch={dispatch} onDeselect={onDeselect} notify={notify} />
        )}
        {tab === 'page' && <PagePanel page={page} dispatch={dispatch} notify={notify} />}
        {tab === 'book' && <BookPanel book={book} dispatch={dispatch} notify={notify} />}
      </div>
    </aside>
  );
}

/* ---------------- Elemento ---------------- */

function ElementPanel({
  page,
  el,
  dispatch,
  onDeselect,
  notify,
}: {
  page: Page;
  el: PageElement;
  dispatch: Props['dispatch'];
  onDeselect: () => void;
  notify: (m: string) => void;
}) {
  const update = (patch: Partial<PageElement>) => dispatch({ type: 'element/update', pageId: page.id, elementId: el.id, patch });
  const order = (direction: 'forward' | 'backward' | 'front' | 'back') =>
    dispatch({ type: 'element/order', pageId: page.id, elementId: el.id, direction });

  return (
    <>
      <Section
        title={el.kind === 'text' ? 'Texto' : el.kind === 'image' ? 'Imagen' : 'Forma'}
        actions={
          <div className="row">
            <button type="button" className="icon-btn sm" onClick={() => update({ locked: !el.locked })} aria-label={el.locked ? 'Desbloquear' : 'Bloquear'} title={el.locked ? 'Desbloquear' : 'Bloquear'} aria-pressed={!!el.locked}>
              {el.locked ? <Lock size={15} /> : <Unlock size={15} />}
            </button>
            <button type="button" className="icon-btn sm" onClick={() => dispatch({ type: 'element/duplicate', pageId: page.id, elementId: el.id })} aria-label="Duplicar elemento" title="Duplicar (Ctrl+D)">
              <Copy size={15} />
            </button>
            <button
              type="button"
              className="icon-btn sm btn-danger"
              onClick={() => {
                dispatch({ type: 'element/remove', pageId: page.id, elementId: el.id });
                onDeselect();
              }}
              aria-label="Eliminar elemento"
              title="Eliminar (Supr)"
            >
              <Trash2 size={15} />
            </button>
          </div>
        }
      >
        {el.kind === 'text' && <TextProps el={el} update={update} />}
        {el.kind === 'image' && <ImageProps key={el.id} el={el} update={update} notify={notify} />}
        {el.kind === 'shape' && <ShapeProps el={el} update={update} />}
      </Section>

      <Section title="Posición y tamaño">
        <div className="grid-2">
          <NumberField label="X" suffix="%" value={el.x} step={0.5} onChange={(x) => update({ x })} />
          <NumberField label="Y" suffix="%" value={el.y} step={0.5} onChange={(y) => update({ y })} />
          <NumberField label="Ancho" suffix="%" value={el.w} min={0.5} step={0.5} onChange={(w) => update({ w })} />
          <NumberField label="Alto" suffix="%" value={el.h} min={0.5} step={0.5} onChange={(h) => update({ h })} />
        </div>
        <RangeField label="Rotación" value={el.rotation} min={-180} max={180} onChange={(rotation) => update({ rotation })} format={(v) => `${Math.round(v)}°`} />
        <RangeField label="Opacidad" value={el.opacity} min={0} max={1} step={0.05} onChange={(opacity) => update({ opacity })} format={(v) => `${Math.round(v * 100)} %`} />
        <div className="field">
          <span>Capas</span>
          <div className="row wrap">
            <button type="button" className="btn btn-sm" onClick={() => order('front')}>
              <BringToFront size={15} /> Al frente
            </button>
            <button type="button" className="btn btn-sm" onClick={() => order('back')}>
              <SendToBack size={15} /> Al fondo
            </button>
            <button type="button" className="icon-btn sm" onClick={() => order('forward')} aria-label="Subir una capa" title="Subir una capa">
              <ChevronUp size={15} />
            </button>
            <button type="button" className="icon-btn sm" onClick={() => order('backward')} aria-label="Bajar una capa" title="Bajar una capa">
              <ChevronDown size={15} />
            </button>
          </div>
        </div>
      </Section>
    </>
  );
}

function TextProps({ el, update }: { el: TextElement; update: (p: Partial<TextElement>) => void }) {
  return (
    <>
      <label className="field">
        <span>Contenido</span>
        <textarea className="textarea" value={el.text} onChange={(e) => update({ text: e.target.value })} />
      </label>
      <label className="field">
        <span>Fuente</span>
        <select className="select" value={el.fontFamily} onChange={(e) => update({ fontFamily: e.target.value })}>
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid-2">
        <NumberField label="Tamaño" value={el.fontSize} min={0.5} max={100} step={0.1} onChange={(fontSize) => update({ fontSize })} />
        <label className="field">
          <span>Grosor</span>
          <select className="select" value={el.fontWeight} onChange={(e) => update({ fontWeight: Number(e.target.value) })}>
            {[300, 400, 500, 600, 700, 800, 900].map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="row">
        <button type="button" className={`icon-btn sm${el.italic ? ' is-active' : ''}`} onClick={() => update({ italic: !el.italic })} aria-pressed={el.italic} aria-label="Cursiva" title="Cursiva">
          <Italic size={15} />
        </button>
        <button type="button" className={`icon-btn sm${el.underline ? ' is-active' : ''}`} onClick={() => update({ underline: !el.underline })} aria-pressed={el.underline} aria-label="Subrayado" title="Subrayado">
          <Underline size={15} />
        </button>
        <Segmented
          label=""
          value={el.align}
          onChange={(align) => update({ align })}
          options={[
            { value: 'left', label: <AlignLeft size={15} />, title: 'Alinear a la izquierda' },
            { value: 'center', label: <AlignCenter size={15} />, title: 'Centrar' },
            { value: 'right', label: <AlignRight size={15} />, title: 'Alinear a la derecha' },
            { value: 'justify', label: <AlignJustify size={15} />, title: 'Justificar' },
          ]}
        />
      </div>
      <ColorField label="Color del texto" value={el.color} onChange={(color) => update({ color })} />
      <ColorField label="Fondo" value={el.background} onChange={(background) => update({ background })} />
      <div className="grid-2">
        <NumberField label="Interlineado" value={el.lineHeight} min={0.5} max={4} step={0.05} onChange={(lineHeight) => update({ lineHeight })} />
        <NumberField label="Relleno" value={el.padding} min={0} max={50} step={0.5} onChange={(padding) => update({ padding })} />
        <NumberField label="Espaciado (em)" value={el.letterSpacing ?? 0} min={-1} max={2} step={0.01} onChange={(letterSpacing) => update({ letterSpacing })} />
        <label className="check check-sm">
          <input type="checkbox" checked={!!el.uppercase} onChange={(e) => update({ uppercase: e.target.checked })} />
          MAYÚSCULAS
        </label>
      </div>
      <NumberField label="Radio de esquinas" value={el.radius} min={0} max={50} step={0.5} onChange={(radius) => update({ radius })} />
    </>
  );
}

function ImageProps({ el, update, notify }: { el: ImageElement; update: (p: Partial<ImageElement>) => void; notify: (m: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(el.src.startsWith('data:') ? '' : el.src);
  return (
    <>
      <div className="insp-preview">{safeImageUrl(el.src) ? <img src={safeImageUrl(el.src)} alt="" /> : <span className="muted">Sin imagen</span>}</div>
      <button type="button" className="btn btn-sm btn-block" onClick={() => fileRef.current?.click()}>
        <ImageUp size={15} /> Reemplazar imagen
      </button>
      <input
        ref={fileRef}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/gif,image/webp,image/avif,image/svg+xml"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          try {
            update({ src: await readImageAsDataUrl(file) });
          } catch (err) {
            notify((err as Error).message);
          }
        }}
      />
      <form
        className="field"
        onSubmit={(e) => {
          e.preventDefault();
          const safe = safeImageUrl(url);
          if (safe) update({ src: safe });
          else notify('Usa una URL https:// válida');
        }}
      >
        <span>O desde una URL (https)</span>
        <div className="row">
          <input className="input" value={url} placeholder="https://…" onChange={(e) => setUrl(e.target.value)} aria-label="URL de la imagen" />
          <button type="submit" className="btn btn-sm">
            Usar
          </button>
        </div>
      </form>
      <label className="field">
        <span>Texto alternativo (accesibilidad)</span>
        <input className="input" value={el.alt} onChange={(e) => update({ alt: e.target.value })} placeholder="Describe la imagen" />
      </label>
      <label className="field">
        <span>Forma del marco</span>
        <select className="select" value={el.mask ?? 'none'} onChange={(e) => update({ mask: e.target.value as ImageMask })}>
          {IMAGE_MASKS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Ajuste</span>
        <select className="select" value={el.fit} onChange={(e) => update({ fit: e.target.value as ImageElement['fit'] })}>
          <option value="cover">Cubrir</option>
          <option value="contain">Contener</option>
          <option value="fill">Estirar</option>
        </select>
      </label>
      <NumberField label="Radio de esquinas" value={el.radius} min={0} max={50} step={0.5} onChange={(radius) => update({ radius })} />
    </>
  );
}

function ShapeProps({ el, update }: { el: ShapeElement; update: (p: Partial<ShapeElement>) => void }) {
  return (
    <>
      <label className="field">
        <span>Tipo</span>
        <select className="select" value={el.shape} onChange={(e) => update({ shape: e.target.value as ShapeElement['shape'] })}>
          {SHAPE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <ColorField label={el.fillTo ? 'Color inicial' : 'Relleno'} value={el.fill} onChange={(fill) => update({ fill })} />
      <label className="check check-sm">
        <input
          type="checkbox"
          checked={!!el.fillTo}
          onChange={(e) => update({ fillTo: e.target.checked ? '#FFFFFF' : undefined, gradientAngle: el.gradientAngle ?? 180 })}
        />
        Degradado
      </label>
      {el.fillTo && (
        <>
          <ColorField label="Color final" value={el.fillTo} onChange={(fillTo) => update({ fillTo })} />
          <RangeField label="Dirección" value={el.gradientAngle ?? 180} min={0} max={360} step={5} onChange={(gradientAngle) => update({ gradientAngle })} format={(v) => `${v}°`} />
        </>
      )}
      {el.shape !== 'line' && (
        <>
          <ColorField label="Borde" value={el.stroke} onChange={(stroke) => update({ stroke })} />
          <div className="grid-2">
            <NumberField label="Grosor del borde" value={el.strokeWidth} min={0} max={50} step={0.1} onChange={(strokeWidth) => update({ strokeWidth })} />
            <NumberField label="Radio" value={el.radius} min={0} max={50} step={0.5} onChange={(radius) => update({ radius })} />
          </div>
        </>
      )}
    </>
  );
}

/* ---------------- Página ---------------- */

function PagePanel({ page, dispatch, notify }: { page: Page; dispatch: Props['dispatch']; notify: (m: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const update = (patch: Partial<Omit<Page, 'id' | 'elements'>>) => dispatch({ type: 'page/update', pageId: page.id, patch });
  return (
    <>
      <Section title="Página">
        <label className="field">
          <span>Título (aparece en el índice y la búsqueda)</span>
          <input className="input" value={page.title} onChange={(e) => update({ title: e.target.value })} placeholder="Sin título" />
        </label>
        <ColorField label="Color de fondo" value={page.background} onChange={(background) => update({ background })} />
        <div className="field">
          <span>Imagen de fondo</span>
          <div className="row wrap">
            <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
              <ImageUp size={15} /> {page.backgroundImage ? 'Cambiar' : 'Subir imagen'}
            </button>
            {page.backgroundImage && (
              <button type="button" className="btn btn-sm btn-danger" onClick={() => update({ backgroundImage: undefined })}>
                <Trash2 size={15} /> Quitar
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            hidden
            accept="image/png,image/jpeg,image/gif,image/webp,image/avif,image/svg+xml"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              try {
                update({ backgroundImage: await readImageAsDataUrl(file) });
              } catch (err) {
                notify((err as Error).message);
              }
            }}
          />
        </div>
      </Section>
      <Section title="Elementos de la página">
        <p className="muted small">
          {page.elements.length === 0
            ? 'Esta página está en blanco.'
            : `${page.elements.length} elemento${page.elements.length === 1 ? '' : 's'}. Selecciona uno en el lienzo para editarlo.`}
        </p>
        <p className="muted small">
          Atajos: <kbd>Supr</kbd> eliminar · <kbd>Ctrl</kbd>+<kbd>D</kbd> duplicar · <kbd>Ctrl</kbd>+<kbd>C</kbd>/<kbd>V</kbd> copiar y pegar ·
          flechas mover (<kbd>Mayús</kbd> = 5 %) · <kbd>Enter</kbd> o doble clic para escribir.
        </p>
      </Section>
    </>
  );
}

/* ---------------- Publicación ---------------- */

function BookPanel({ book, dispatch, notify }: { book: Book; dispatch: Props['dispatch']; notify: (m: string) => void }) {
  const hands = book.settings.hands ?? DEFAULT_HANDS;
  const setHands = (patch: Partial<typeof hands>) => dispatch({ type: 'book/settings', patch: { hands: { ...hands, ...patch } } });
  const importRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <>
      <Section title="Datos de la publicación">
        <label className="field">
          <span>Título</span>
          <input className="input" value={book.title} onChange={(e) => dispatch({ type: 'book/meta', patch: { title: e.target.value } })} />
        </label>
        <label className="field">
          <span>Autoría</span>
          <input className="input" value={book.author} onChange={(e) => dispatch({ type: 'book/meta', patch: { author: e.target.value } })} placeholder="Nombre del autor o dependencia" />
        </label>
        <label className="field">
          <span>Descripción</span>
          <textarea className="textarea" value={book.description} onChange={(e) => dispatch({ type: 'book/meta', patch: { description: e.target.value } })} />
        </label>
      </Section>
      <Section title="Formato y lectura">
        <label className="field">
          <span>Formato de página</span>
          <select className="select" value={book.settings.format} onChange={(e) => dispatch({ type: 'book/settings', patch: { format: e.target.value as PageFormat } })}>
            {Object.entries(PAGE_FORMATS).map(([key, f]) => (
              <option key={key} value={key}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={book.settings.showPageNumbers} onChange={(e) => dispatch({ type: 'book/settings', patch: { showPageNumbers: e.target.checked } })} />
          Mostrar números de página
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={book.settings.pageSound !== false}
            onChange={(e) => dispatch({ type: 'book/settings', patch: { pageSound: e.target.checked } })}
          />
          Sonido al pasar página
        </label>
        {book.settings.pageSound !== false && (
          <div className="field">
            <span>Tipo de sonido</span>
            <div className="row">
              <select
                className="select"
                aria-label="Tipo de sonido"
                value={book.settings.pageSoundStyle ?? DEFAULT_SOUND_STYLE}
                onChange={(e) => dispatch({ type: 'book/settings', patch: { pageSoundStyle: e.target.value as SoundStyle } })}
              >
                {SOUND_STYLES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => playPageTurn({ wait: true, style: book.settings.pageSoundStyle ?? DEFAULT_SOUND_STYLE, duration: book.settings.flipDuration })}
              >
                <Play size={14} /> Probar
              </button>
            </div>
            <small className="muted">{SOUND_STYLES.find((st) => st.value === (book.settings.pageSoundStyle ?? DEFAULT_SOUND_STYLE))?.description}</small>
          </div>
        )}
        <label className="check">
          <input type="checkbox" checked={hands.enabled} onChange={(e) => setHands({ enabled: e.target.checked })} />
          Mostrar manito del cursor al pasar página
        </label>
        <RangeField
          label="Velocidad del giro"
          value={book.settings.flipDuration}
          min={200}
          max={2000}
          step={50}
          onChange={(flipDuration) => dispatch({ type: 'book/settings', patch: { flipDuration } })}
          format={(v) => `${(v / 1000).toFixed(2)} s`}
        />
      </Section>
      <Section title="Archivo">
        <p className="muted small">Todo se guarda automáticamente en este navegador. Exporta un respaldo para llevarlo a otro equipo o publicarlo.</p>
        <div className="row wrap">
          <button type="button" className="btn btn-sm" onClick={() => downloadText(`${slugify(book.title)}.json`, JSON.stringify(book, null, 2))}>
            <Download size={15} /> Exportar JSON
          </button>
          <button type="button" className="btn btn-sm" onClick={() => importRef.current?.click()}>
            <Upload size={15} /> Importar JSON
          </button>
        </div>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          hidden
          data-testid="import-input"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            const result = parseBookJson(await readFileAsText(file));
            if (result.ok) {
              dispatch({ type: 'book/replace', book: result.book });
              notify('Publicación importada');
            } else notify(result.error);
          }}
        />
        {confirmReset ? (
          <div className="confirm">
            <span>¿Reemplazar por una publicación en blanco? Podrás deshacerlo.</span>
            <div className="row">
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => {
                  dispatch({ type: 'book/replace', book: createDefaultBook() });
                  setConfirmReset(false);
                  notify('Nueva publicación en blanco');
                }}
              >
                Sí, empezar de nuevo
              </button>
              <button type="button" className="btn btn-sm" onClick={() => setConfirmReset(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-sm btn-block" onClick={() => setConfirmReset(true)}>
            <FilePlus2 size={15} /> Nueva publicación en blanco
          </button>
        )}
      </Section>
    </>
  );
}
