import { useId, type ReactNode } from 'react';
import { SWATCHES } from '@/config/app.config';
import { safeColor } from '@/lib/sanitize';

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <span className="num-input">
        <input
          id={id}
          className="input"
          type="number"
          value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = e.target.valueAsNumber;
            if (Number.isFinite(n)) onChange(min !== undefined || max !== undefined ? Math.min(max ?? n, Math.max(min ?? n, n)) : n);
          }}
        />
        {suffix && <em>{suffix}</em>}
      </span>
    </label>
  );
}

export function RangeField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format = (v) => String(v),
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
}) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span className="field-row">
        {label} <output htmlFor={id}>{format(value)}</output>
      </span>
      <input id={id} className="range" type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(e.target.valueAsNumber)} />
    </label>
  );
}

function toHex(color: string): string {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  if (/^#[0-9a-f]{3}$/i.test(color)) return `#${[...color.slice(1)].map((c) => c + c).join('')}`;
  return '#ffffff';
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  const safe = safeColor(value);
  return (
    <div className="field color-field" role="group" aria-labelledby={`${id}-l`}>
      <span id={`${id}-l`}>{label}</span>
      <div className="color-row">
        <input
          type="color"
          className="color-input"
          value={toHex(safe)}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label}: selector de color`}
        />
        <input
          className="input"
          value={value}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onChange(safeColor(e.target.value, safe))}
          aria-label={`${label}: código de color`}
        />
      </div>
      <div className="swatches">
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            className={`swatch${c === 'transparent' ? ' is-none' : ''}${safe.toLowerCase() === c.toLowerCase() ? ' is-active' : ''}`}
            style={{ background: c === 'transparent' ? undefined : c }}
            onClick={() => onChange(c)}
            aria-label={c === 'transparent' ? 'Sin color' : `Color ${c}`}
            title={c === 'transparent' ? 'Sin color' : c}
          />
        ))}
      </div>
    </div>
  );
}

export function Section({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="insp-section">
      <header>
        <h3>{title}</h3>
        {actions}
      </header>
      <div className="insp-body">{children}</div>
    </section>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: ReactNode; title: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className={value === o.value ? 'is-active' : ''}
            onClick={() => onChange(o.value)}
            title={o.title}
            aria-label={o.title}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
