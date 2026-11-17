'use client';
import type { ReactNode } from 'react';

type Opt<T extends string> = { id: T; label: string; hint?: string };

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <div className="field-label"><span>{label}</span>{hint && <small>{hint}</small>}</div>
      {children}
    </div>
  );
}

export function Chips<T extends string>({ options, value, onChange, tall }: { options: Opt<T>[]; value: T; onChange: (v: T) => void; tall?: boolean }) {
  return (
    <div className="chips" role="radiogroup">
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id}
          className={`chip${value === o.id ? ' on' : ''}${tall ? ' tall' : ''}`} onClick={() => onChange(o.id)}>
          {o.label}{tall && o.hint && <small>{o.hint}</small>}
        </button>
      ))}
    </div>
  );
}

export function MultiChips<T extends string>({ options, value, onChange }: { options: Opt<T>[]; value: T[]; onChange: (v: T[]) => void }) {
  return (
    <div className="chips">
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button key={o.id} type="button" aria-pressed={on} className={`chip${on ? ' on' : ''}`}
            onClick={() => onChange(on ? value.filter((v) => v !== o.id) : [...value, o.id])}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Stepper({ value, min, max, unit, onChange }: { value: number; min: number; max: number; unit?: string; onChange: (n: number) => void }) {
  return (
    <span className="stepper">
      <button type="button" aria-label="줄이기" disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
      <b>{value}{unit}</b>
      <button type="button" aria-label="늘리기" disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </span>
  );
}

export function Seg<T extends string>({ options, value, onChange }: { options: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button key={o.id} type="button" role="tab" aria-selected={value === o.id} className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const demandBadge = (d: number) =>
  d >= 0.85 ? { text: '경쟁 매우 높음', cls: 'hot' } : d >= 0.65 ? { text: '경쟁 높음', cls: 'hot' } : d >= 0.4 ? { text: '경쟁 보통', cls: '' } : { text: '경쟁 낮음', cls: 'ok' };

/** 점수(0~1)를 좌석·구역 색으로 */
export function heat(t: number, power = 1.6) {
  const k = Math.max(0, Math.min(1, t)) ** power;
  const mix = (a: number, b: number) => Math.round(a + (b - a) * k);
  return `rgb(${mix(39, 55)},${mix(48, 211)},${mix(61, 155)})`;
}
export const PICK_COLORS = ['var(--pick-1)', 'var(--pick-2)', 'var(--pick-3)'];
