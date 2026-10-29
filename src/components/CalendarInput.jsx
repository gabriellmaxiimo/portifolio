import React, { useCallback, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useClickOutside } from './useClickOutside';

const pad = (number) => String(number).padStart(2, '0');
const toMonth = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
const toDay = (date) => `${toMonth(date)}-${pad(date.getDate())}`;
// "2026-10" ou "2026-10-29" → Date local (sem o desvio de fuso do new Date("2026-10-29")).
const parse = (value) => {
  const [year, month, day = 1] = (value || '').split('-').map(Number);
  return year && month ? new Date(year, month - 1, day) : new Date();
};

// Calendário no estilo do site, no lugar do seletor nativo (que só fica claro ou escuro, sem seguir o tema).
// mode 'date' → value "2026-10-29"; mode 'month' → value "2026-10".
// prevLabel/nextLabel: nome das setas (mês anterior/próximo no modo date, ano no modo month).
export default function CalendarInput({ mode = 'date', value, onChange, locale, label, prevLabel, nextLabel, className = '' }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  // Primeiro dia do mês (date) ou de janeiro (month) mostrado no painel.
  const [view, setView] = useState(() => parse(value));
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  const isMonth = mode === 'month';
  const selected = parse(value);
  const today = new Date();
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const shift = (delta) => setView(new Date(view.getFullYear() + (isMonth ? delta : 0), view.getMonth() + (isMonth ? 0 : delta), 1));
  const pick = (date) => {
    onChange(isMonth ? toMonth(date) : toDay(date));
    setOpen(false);
  };

  const text = value
    ? selected.toLocaleDateString(locale, isMonth ? { month: 'long', year: 'numeric' } : undefined)
    : '';
  const cell = 'rounded-lg text-xs transition-colors hover:bg-current/10 focus-visible:outline focus-visible:outline-1 focus-visible:outline-current';
  const state = (isSelected, isToday) => (isSelected ? 'bg-current/20 font-bold' : isToday ? 'ring-1 ring-current/40' : '');

  let cells;
  if (isMonth) {
    cells = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(view.getFullYear(), index, 1);
      return (
        <button key={index} type="button" onClick={() => pick(date)} aria-pressed={value === toMonth(date)}
          className={`${cell} py-2.5 capitalize ${state(value === toMonth(date), toMonth(date) === toMonth(today))}`}>
          {date.toLocaleDateString(locale, { month: 'short' }).replace('.', '')}
        </button>
      );
    });
  } else {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    cells = [
      // Iniciais dos dias da semana a partir de domingo (2026-11-01 é um domingo).
      ...Array.from({ length: 7 }, (_, index) => (
        <span key={`w${index}`} className="py-1 text-center text-[10px] font-bold uppercase opacity-50">
          {new Date(2026, 10, 1 + index).toLocaleDateString(locale, { weekday: 'narrow' })}
        </span>
      )),
      ...Array.from({ length: first.getDay() }, (_, index) => <span key={`b${index}`} />),
      ...Array.from({ length: days }, (_, index) => {
        const date = new Date(view.getFullYear(), view.getMonth(), index + 1);
        return (
          <button key={index} type="button" onClick={() => pick(date)} aria-pressed={value === toDay(date)}
            aria-label={date.toLocaleDateString(locale, { dateStyle: 'full' })}
            className={`${cell} h-8 tabular-nums ${state(value === toDay(date), toDay(date) === toDay(today))}`}>
            {index + 1}
          </button>
        );
      }),
    ];
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!open) setView(parse(value));
          setOpen(!open);
        }}
        className={`${className} w-full flex items-center justify-between gap-2 text-left`}
      >
        <span className={`truncate first-letter:uppercase ${text ? '' : 'opacity-50'}`}>{text || label}</span>
        <Calendar size={14} className="shrink-0 opacity-60" />
      </button>
      {open && (
        <div role="dialog" aria-label={label}
          className="absolute left-0 top-full z-50 mt-1.5 w-64 max-w-[calc(100vw-2rem)] p-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[0_20px_40px_rgb(0_0_0/35%)] normal-case tracking-normal font-normal">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => shift(-1)} aria-label={prevLabel} className="p-1.5 rounded-full hover:bg-current/10"><ChevronLeft size={16} /></button>
            <span className="text-sm font-semibold first-letter:uppercase">
              {isMonth ? view.getFullYear() : view.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
            </span>
            <button type="button" onClick={() => shift(1)} aria-label={nextLabel} className="p-1.5 rounded-full hover:bg-current/10"><ChevronRight size={16} /></button>
          </div>
          <div className={`grid gap-1 ${isMonth ? 'grid-cols-3' : 'grid-cols-7'}`}>{cells}</div>
          <button type="button" onClick={() => pick(today)} className="mt-2 w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest opacity-70 hover:opacity-100 hover:bg-current/10">
            {relative.format(0, isMonth ? 'month' : 'day')}
          </button>
        </div>
      )}
    </div>
  );
}
