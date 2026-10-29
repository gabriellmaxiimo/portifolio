import React from 'react';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const compact = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 });

// Topo do eixo em 1, 2 ou 5 × 10ⁿ, para as linhas de grade caírem em valores redondos.
function niceMax(value) {
  if (!(value > 0)) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 5, 10].map((step) => step * power).find((step) => step >= value);
}

const percent = (value, max) => `${(value / max) * 100}%`;
// Valor pequeno mas diferente de zero continua visível.
const barHeight = (value, max) => (value > 0 ? `max(2px, ${percent(value, max)})` : '0');

// history: [{ month: '2026-10', label: 'out', income, expenses }]; categories: [[nome, valor]] já em ordem decrescente.
// Fundo sólido (solidBg) em vez do vidro: no Cruzeiro o gradiente azul por trás do vidro apagava as barras azuis.
export default function FinanceCharts({ history, categories, selectedMonth, onSelectMonth, t, themeClasses }) {
  const peak = Math.max(...history.flatMap((item) => [item.income, item.expenses]));
  const max = niceMax(peak);
  const totalExpenses = categories.reduce((sum, [, value]) => sum + value, 0);
  // Até 12 rótulos no eixo; com mais meses (relatório de um período longo) mostra um a cada N.
  const labelStep = Math.ceil(history.length / 12);
  const panel = `p-4 sm:p-5 rounded-2xl border min-w-0 ${themeClasses.solidBg}`;
  const title = 'text-[10px] font-bold uppercase tracking-widest opacity-60';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-4">
          <h3 className={title}>{t.chartHistory}</h3>
          <div className="flex gap-3 text-[10px] opacity-80">
            {[[t.income, 'var(--series-income)'], [t.expenses, 'var(--series-expense)']].map(([label, color]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} /> {label}
              </span>
            ))}
          </div>
        </div>
        {peak > 0 ? (
          <>
            <div className="relative h-40 sm:h-48 ml-12 sm:ml-14">
              {[1, 0.5, 0].map((fraction) => (
                <div key={fraction} className={`absolute inset-x-0 border-t ${fraction ? 'border-dashed border-current/10' : 'border-current/25'}`} style={{ bottom: `${fraction * 100}%` }}>
                  <span className="absolute right-full mr-2 -translate-y-1/2 whitespace-nowrap text-[10px] opacity-50">{compact.format(max * fraction)}</span>
                </div>
              ))}
              <div className="absolute inset-0 flex items-end">
                {history.map((item) => (
                  <button
                    key={item.month}
                    type="button"
                    onClick={() => onSelectMonth(item.month)}
                    title={`${item.label}\n${t.income}: ${currency.format(item.income)}\n${t.expenses}: ${currency.format(item.expenses)}\n${t.balance}: ${currency.format(item.income - item.expenses)}`}
                    aria-label={`${item.label}: ${t.income} ${currency.format(item.income)}, ${t.expenses} ${currency.format(item.expenses)}`}
                    aria-pressed={item.month === selectedMonth}
                    className={`flex-1 h-full flex items-end justify-center gap-[2px] rounded-t-md transition-colors hover:bg-current/5 ${item.month === selectedMonth ? 'bg-current/10' : ''}`}
                  >
                    <span className="w-[30%] max-w-4 rounded-t transition-[height] duration-500" style={{ height: barHeight(item.income, max), background: 'var(--series-income)' }} />
                    <span className="w-[30%] max-w-4 rounded-t transition-[height] duration-500" style={{ height: barHeight(item.expenses, max), background: 'var(--series-expense)' }} />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex ml-12 sm:ml-14 mt-1.5">
              {history.map((item, index) => (
                <span key={item.month} className={`flex-1 min-w-0 text-center text-[10px] capitalize whitespace-nowrap ${item.month === selectedMonth ? 'font-bold' : 'opacity-60'}`}>
                  {index % labelStep === 0 ? item.label : ''}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs opacity-60">{t.noHistory}</p>
        )}
      </section>

      <section className={panel}>
        <h3 className={`${title} mb-4`}>{t.chartCategories}</h3>
        {categories.length === 0 ? (
          <p className="text-xs opacity-60">{t.noExpenses}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {categories.map(([name, value]) => (
              <li key={name} title={`${name}: ${currency.format(value)}`}>
                <div className="flex items-baseline justify-between gap-3 text-xs mb-1.5">
                  <span className="truncate">{name}</span>
                  <span className="shrink-0 tabular-nums opacity-70">{currency.format(value)} · {Math.round((value / totalExpenses) * 100)}%</span>
                </div>
                <div className="h-2 rounded bg-current/10">
                  <div className="h-full rounded transition-[width] duration-500" style={{ width: percent(value, categories[0][1]), background: 'var(--series-expense)' }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
