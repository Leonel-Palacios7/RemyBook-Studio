import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { animateValue, type Cancel } from './animator';
import {
  clampView,
  getLeaves,
  isLeafNear,
  leafAngle,
  leafZIndex,
  maxView,
  pagesInView,
  type FlipMode,
} from './layout';
import { ReaderHands } from './ReaderHands';
import type { HandsLook } from './hands';
import './flipbook.css';

export interface Turning {
  leaf: number;
  direction: 1 | -1;
  progress: number;
}

export interface FlipBookProps {
  pageCount: number;
  mode: FlipMode;
  /** Vista actual (controlada por el componente padre). */
  view: number;
  onViewChange: (view: number) => void;
  pageWidth: number;
  pageHeight: number;
  /** Duración del giro en ms (0 = sin animación). */
  duration: number;
  renderPage: (pageIndex: number) => ReactNode;
  /** Color del reverso cuando una hoja no tiene página. */
  paperColor?: string;
  /** Desactiva el arrastre (p. ej. con zoom activo). */
  dragDisabled?: boolean;
  /** Manos del lector (null = ocultas). */
  hands?: HandsLook | null;
  /** Se llama cuando una hoja empieza a moverse (para el sonido). */
  onTurnStart?: (direction: 1 | -1) => void;
}

interface DragState {
  pointerId: number;
  startX: number;
  lastX: number;
  lastT: number;
  velocity: number;
  direction: 1 | -1;
  from: number;
  started: boolean;
}

const DRAG_THRESHOLD = 6;

/**
 * Libro con giro de páginas 3D implementado con transformaciones CSS
 * (perspectiva + rotateY + backface-visibility) y animación por
 * requestAnimationFrame. Admite navegación programática, clic y arrastre.
 */
export function FlipBook({
  pageCount,
  mode,
  view,
  onViewChange,
  pageWidth,
  pageHeight,
  duration,
  renderPage,
  paperColor = '#ffffff',
  dragDisabled = false,
  onTurnStart,
  hands = null,
}: FlipBookProps) {
  const [displayView, setDisplayView] = useState(view);
  const [turning, setTurning] = useState<Turning | null>(null);
  const cancelRef = useRef<Cancel | null>(null);
  const drag = useRef<DragState | null>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const last = maxView(mode, pageCount);
  // Referencia estable para no reiniciar efectos cuando cambia la función del padre.
  const turnStartRef = useRef(onTurnStart);
  turnStartRef.current = onTurnStart;

  const stop = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
  }, []);

  const runTurn = useCallback(
    (t: Omit<Turning, 'progress'>, fromProgress: number, toProgress: number, onDone?: () => void) => {
      stop();
      const remaining = Math.abs(toProgress - fromProgress);
      cancelRef.current = animateValue(
        fromProgress,
        toProgress,
        duration * Math.max(0.35, remaining),
        (progress) => setTurning({ ...t, progress }),
        () => {
          cancelRef.current = null;
          setTurning(null);
          onDone?.();
        },
      );
    },
    [duration, stop],
  );

  // Sincroniza la vista controlada: anima el giro cuando el padre cambia `view`.
  useLayoutEffect(() => {
    const target = clampView(mode, pageCount, view);
    if (target === displayView) return;
    const direction: 1 | -1 = target > displayView ? 1 : -1;
    const leaf = direction === 1 ? target - 1 : target;
    setDisplayView(target);
    turnStartRef.current?.(direction);
    runTurn({ leaf, direction }, 0, 1);
    // displayView se omite a propósito: solo reaccionamos a cambios externos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, mode, pageCount, runTurn]);

  useEffect(() => stop, [stop]);

  // ---- Arrastre con puntero (ratón, lápiz o táctil) ----
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragDisabled || e.button !== 0 || !bookRef.current) return;
    if ((e.target as HTMLElement).closest('a,button,input,textarea,select')) return;
    const rect = bookRef.current.getBoundingClientRect();
    const rightHalf = mode === 'double' ? e.clientX > rect.left + rect.width / 2 : true;
    const direction: 1 | -1 = mode === 'double' ? (rightHalf ? 1 : -1) : 1;
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      lastX: e.clientX,
      lastT: performance.now(),
      velocity: 0,
      direction,
      from: displayView,
      started: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    if (!d.started) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      // En modo sencillo la dirección depende del sentido del gesto.
      if (mode === 'single') d.direction = dx < 0 ? 1 : -1;
      const target = d.from + d.direction;
      if (target < 0 || target > last) {
        drag.current = null;
        return;
      }
      stop();
      d.started = true;
      bookRef.current?.setPointerCapture?.(e.pointerId);
      setDisplayView(target);
      turnStartRef.current?.(d.direction);
    }
    const now = performance.now();
    d.velocity = (e.clientX - d.lastX) / Math.max(1, now - d.lastT);
    d.lastX = e.clientX;
    d.lastT = now;
    const span = pageWidth * (mode === 'double' ? 2 : 1.2);
    const progress = Math.max(0, Math.min(1, (d.direction === 1 ? -dx : dx) / span));
    const leaf = d.direction === 1 ? d.from : d.from - 1;
    setTurning({ leaf, direction: d.direction, progress });
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.pointerId !== e.pointerId) return;
    if (!d.started) {
      // Clic simple: girar según el lado pulsado.
      if (e.type !== 'pointerup') return;
      const target = d.from + d.direction;
      if (target >= 0 && target <= last) onViewChange(target);
      return;
    }
    const leaf = d.direction === 1 ? d.from : d.from - 1;
    const progress = turning?.progress ?? 0;
    const flick = (d.direction === 1 ? -d.velocity : d.velocity) > 0.5;
    const target = d.from + d.direction;
    if (progress > 0.3 || flick) {
      runTurn({ leaf, direction: d.direction }, progress, 1);
      onViewChange(target);
    } else {
      runTurn({ leaf, direction: d.direction }, progress, 0, () => setDisplayView(d.from));
    }
  };

  // ---- Render ----
  const leaves = getLeaves(mode, pageCount);
  const columns = mode === 'double' ? 2 : 1;
  const [leftPage, rightPage] = pagesInView(mode, pageCount, displayView);
  // Centra la portada y la contraportada cuando se muestran solas.
  let shift = 0;
  if (mode === 'double') {
    if (leftPage === null && !turning) shift = -pageWidth / 2;
    else if (rightPage === null && !turning) shift = pageWidth / 2;
  }

  const frameStyle: CSSProperties = {
    width: pageWidth * columns,
    height: pageHeight,
    transform: `translateX(${shift}px)`,
  };
  const bookStyle: CSSProperties = { width: pageWidth * columns, height: pageHeight };

  return (
    <div className="fb-stage" data-mode={mode}>
      <div className="fb-frame" style={frameStyle}>
      <div
        ref={bookRef}
        className="fb-book"
        style={bookStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        data-testid="flipbook"
        data-view={displayView}
        data-turning={turning ? 'true' : 'false'}
      >
        {mode === 'double' && <div className="fb-spine" aria-hidden="true" />}
        {leaves.map((leaf) => {
          const isTurning = turning?.leaf === leaf.index;
          if (!isTurning && !isLeafNear(leaf.index, displayView)) return null;
          const angle = leafAngle(leaf.index, displayView, turning);
          const flipped = angle <= -90;
          // En modo sencillo las hojas ya giradas se ocultan (salen de la vista).
          const hidden = mode === 'single' && !isTurning && leaf.index < displayView;
          const lift = Math.sin((Math.abs(angle) * Math.PI) / 180);
          const style: CSSProperties = {
            width: pageWidth,
            height: pageHeight,
            left: mode === 'double' ? pageWidth : 0,
            transform: `rotateY(${angle}deg) translateZ(${isTurning ? 1 + lift * 2 : 0}px)`,
            zIndex: leafZIndex(leaf.index, leaves.length, angle, isTurning),
            visibility: hidden ? 'hidden' : 'visible',
          };
          const frontShade = isTurning && !flipped ? lift * 0.55 : 0;
          const backShade = isTurning && flipped ? lift * 0.55 : 0;
          return (
            <div
              key={leaf.index}
              className={`fb-leaf${isTurning ? ' is-turning' : ''}${mode === 'single' ? ' is-single' : ''}`}
              style={style}
              data-leaf={leaf.index}
              aria-hidden={isTurning || (flipped ? leaf.back === null : false)}
            >
              <div className="fb-face fb-front">
                {leaf.front !== null && renderPage(leaf.front)}
                <div className="fb-gloss fb-gloss-front" />
                <div className="fb-shade fb-shade-front" style={{ opacity: frontShade }} />
              </div>
              <div className="fb-face fb-back" style={{ background: paperColor }}>
                {leaf.back !== null && renderPage(leaf.back)}
                <div className="fb-gloss fb-gloss-back" />
                <div className="fb-shade fb-shade-back" style={{ opacity: backShade }} />
              </div>
            </div>
          );
        })}
        {turning && (
          <div
            className={`fb-cast fb-cast-${leafAngle(turning.leaf, displayView, turning) > -90 ? 'right' : 'left'}`}
            style={{
              opacity: Math.sin((Math.abs(leafAngle(turning.leaf, displayView, turning)) * Math.PI) / 180) * 0.6,
              width: pageWidth,
              left: mode === 'single' ? 0 : leafAngle(turning.leaf, displayView, turning) > -90 ? pageWidth : 0,
            }}
            aria-hidden="true"
          />
        )}
        {mode === 'double' && displayView < last && !turning && (
          <div className="fb-corner fb-corner-right" aria-hidden="true" />
        )}
      </div>
      {hands && (
        <ReaderHands
          mode={mode}
          pageWidth={pageWidth}
          pageHeight={pageHeight}
          hasLeft={leftPage !== null || (turning !== null && turning.direction === -1)}
          hasRight={rightPage !== null || (turning !== null && turning.direction === 1)}
          turn={turning ? { angle: leafAngle(turning.leaf, displayView, turning), direction: turning.direction } : null}
          look={hands}
        />
      )}
      </div>
    </div>
  );
}
