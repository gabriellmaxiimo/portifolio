import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, ChevronLeft, ChevronRight, ExternalLink, FileDown, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { addEntries, deleteEntries, getSpreadsheet, listEntries, updateEntries } from '../services/googleService';
import { FIXED, FIXED_ENDED, buildEditChanges, expandRecurrence, extendFixed, findSeries, isLiveFixed, parseMark, persistMarks } from '../services/financeDates';
import { usePortfolio } from '../context/PortfolioContext';
import FinanceCharts from '../components/FinanceCharts';
import CalendarInput from '../components/CalendarInput';

const CATEGORIES = {
  Saída: ['Alimentação', 'Moradia', 'Contas', 'Cartão de crédito', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Compras', 'Assinaturas', 'Outros'],
  Entrada: ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Reembolso', 'Outros'],
};

const MAX_REPORT_MONTHS = 36;

// Textos da tela. Tipos e categorias ficam em português porque são gravados assim na planilha.
const TEXT = {
  PT: {
    locale: 'pt-BR', title: 'Controle Financeiro', openSheet: 'Abrir no Google Planilhas',
    pdf: 'Relatório PDF', reportTitle: 'Relatório financeiro', generatedAt: (date) => `Gerado em ${date}`,
    rangeFrom: 'De', rangeTo: 'a', rangeUntil: 'Até', generate: 'Gerar PDF', periodBalance: 'Saldo do período', reportHistory: 'Entradas e saídas por mês',
    invalidRange: `Escolha dois meses válidos, com no máximo ${MAX_REPORT_MONTHS} meses entre eles.`,
    prevMonth: 'Mês anterior', nextMonth: 'Próximo mês', prevYear: 'Ano anterior', nextYear: 'Próximo ano', backToday: 'Voltar para o mês atual',
    income: 'Entradas', expenses: 'Saídas', balance: 'Saldo do mês', editing: 'Editando lançamento',
    chartHistory: 'Últimos 6 meses', chartCategories: 'Saídas por categoria', noExpenses: 'Nenhuma saída neste mês.', noHistory: 'Sem lançamentos nesses 6 meses.',
    type: 'Tipo', typeLabels: { Saída: 'Saída', Entrada: 'Entrada' }, date: 'Data', description: 'Descrição',
    category: 'Categoria', amount: 'Valor', recurrence: 'Recorrência', noRepeat: 'Não repete',
    installments: 'Parcelado', monthly: 'Mensal fixo',
    installmentCount: 'Nº de parcelas',
    saving: 'Salvando...', saveChanges: 'Salvar alterações', add: 'Adicionar', cancel: 'Cancelar',
    loading: 'Carregando planilha...', empty: (month) => `Nenhum lançamento em ${month}.`, actions: 'Ações',
    edit: 'Editar', remove: 'Excluir', confirmRemove: (what) => `Excluir ${what}?`,
    recurrenceKinds: { Parcela: 'Parcela', Mensal: 'Mensal' },
    invalidEntry: 'Informe uma descrição e um valor maior que zero.',
    invalidTimes: 'O número de meses deve ser entre 2 e 120.',
    position: 'Nº', of: 'de',
    invalidPosition: 'O número deve ficar entre 1 e o total (máximo 120).',
    applyAll: (count) => `Aplicar a toda a recorrência (${count} lançamentos)`,
    duplicateFixed: (name) => `Já existe um mensal fixo "${name}". Edite o existente ou encerre-o antes.`,
    deleteWhich: (what) => `Excluir ${what}?`, deleteOne: 'Só este', deleteFromHere: 'Este e os próximos (encerrar)', deleteSeries: (count) => `Toda a recorrência (${count})`,
    invalidSeriesTotal: (max) => `O total precisa ser pelo menos ${max}, a maior parcela da série (máximo 120).`,
  },
  EN: {
    locale: 'en-US', title: 'Finance Tracker', openSheet: 'Open in Google Sheets',
    pdf: 'PDF report', reportTitle: 'Financial report', generatedAt: (date) => `Generated on ${date}`,
    rangeFrom: 'From', rangeTo: 'to', rangeUntil: 'To', generate: 'Generate PDF', periodBalance: 'Period balance', reportHistory: 'Income and expenses by month',
    invalidRange: `Pick two valid months, at most ${MAX_REPORT_MONTHS} months apart.`,
    prevMonth: 'Previous month', nextMonth: 'Next month', prevYear: 'Previous year', nextYear: 'Next year', backToday: 'Back to current month',
    income: 'Income', expenses: 'Expenses', balance: 'Monthly balance', editing: 'Editing entry',
    chartHistory: 'Last 6 months', chartCategories: 'Expenses by category', noExpenses: 'No expenses this month.', noHistory: 'No entries in these 6 months.',
    type: 'Type', typeLabels: { Saída: 'Expense', Entrada: 'Income' }, date: 'Date', description: 'Description',
    category: 'Category', amount: 'Amount', recurrence: 'Recurrence', noRepeat: 'One-time',
    installments: 'Installments', monthly: 'Fixed monthly',
    installmentCount: 'Installments',
    saving: 'Saving...', saveChanges: 'Save changes', add: 'Add', cancel: 'Cancel',
    loading: 'Loading spreadsheet...', empty: (month) => `No entries in ${month}.`, actions: 'Actions',
    edit: 'Edit', remove: 'Delete', confirmRemove: (what) => `Delete ${what}?`,
    recurrenceKinds: { Parcela: 'Installment', Mensal: 'Monthly' },
    invalidEntry: 'Enter a description and an amount greater than zero.',
    invalidTimes: 'The number of months must be between 2 and 120.',
    position: 'No.', of: 'of',
    invalidPosition: 'The number must be between 1 and the total (max 120).',
    applyAll: (count) => `Apply to the whole series (${count} entries)`,
    duplicateFixed: (name) => `There is already a fixed monthly "${name}". Edit it or stop it first.`,
    deleteWhich: (what) => `Delete ${what}?`, deleteOne: 'Only this one', deleteFromHere: 'This and the next ones (stop)', deleteSeries: (count) => `Whole series (${count})`,
    invalidSeriesTotal: (max) => `The total must be at least ${max}, the highest number in the series (max 120).`,
  },
};

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const today = () => new Date().toLocaleDateString('sv-SE');
const currentMonth = () => today().slice(0, 7);
const inputClass = 'px-3 py-2 rounded-lg bg-current/5 border border-current/10 outline-none text-sm focus:border-current/30 transition-all';

function shiftMonth(month, delta) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Mensal fixo fica sempre lançado até 12 meses depois do mês atual.
const fixedHorizon = () => shiftMonth(currentMonth(), 12);

// Uma carga por vez, entre abas também (e no StrictMode, que monta o efeito duas vezes):
// duas cargas juntas completariam os mesmos meses duas vezes.
// viewedMonth: ao navegar além do horizonte, os fixos também são lançados até o mês aberto.
function loadEntries(accessToken, spreadsheetId, viewedMonth = '') {
  // navigator.locks só existe em https/localhost; pelo IP da rede (celular no `vite --host`) roda sem trava.
  const withLock = (task) => (navigator.locks ? navigator.locks.request(`finance-${spreadsheetId}`, task) : task());
  return withLock(async () => {
    const rows = await listEntries(accessToken, spreadsheetId);
    const horizon = fixedHorizon();
    const missing = extendFixed(rows, viewedMonth > horizon ? viewedMonth : horizon);
    if (!missing.length) return rows;
    const added = await addEntries(accessToken, spreadsheetId, missing);
    return added ? [...rows, ...added] : listEntries(accessToken, spreadsheetId);
  });
}

function monthLabel(month, locale) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

const sumByType = (list, type) => list.filter((entry) => entry.type === type).reduce((sum, entry) => sum + entry.amount, 0);

// "2026-11" → "2027-01" = ['2026-11', '2026-12', '2027-01']
function monthRange(from, to) {
  const months = [];
  for (let item = from; item <= to; item = shiftMonth(item, 1)) months.push(item);
  return months;
}

// Entradas e saídas de cada mês, para o gráfico de barras. Período que cruza o ano leva o ano no rótulo ("dez/26").
function monthTotals(months, entries, locale) {
  const withYear = months[0].slice(0, 4) !== months[months.length - 1].slice(0, 4);
  return months.map((item) => {
    const [year, monthNumber] = item.split('-').map(Number);
    const short = new Date(year, monthNumber - 1, 1).toLocaleDateString(locale, { month: 'short' }).replace('.', '');
    const list = entries.filter((entry) => entry.date.startsWith(item));
    return { month: item, label: withYear ? `${short}/${item.slice(2, 4)}` : short, income: sumByType(list, 'Entrada'), expenses: sumByType(list, 'Saída') };
  });
}

// [[categoria, total das saídas]] do maior para o menor.
function expenseCategories(list) {
  const totals = new Map();
  for (const entry of list) {
    if (entry.type === 'Saída') totals.set(entry.category || 'Outros', (totals.get(entry.category || 'Outros') ?? 0) + entry.amount);
  }
  return [...totals].sort((a, b) => b[1] - a[1]);
}

function formatDate(date) {
  const [year, month, day] = date.split('-');
  return day ? `${day}/${month}/${year}` : date;
}

// "Parcela 2/12" → "Installment 2/12" em inglês; mensal não mostra número, porque não tem fim.
function recurrenceText(recurrence, t) {
  const mark = parseMark(recurrence);
  if (!mark) return recurrence;
  return mark.kind === 'Mensal' ? t.recurrenceKinds.Mensal : `${t.recurrenceKinds[mark.kind]} ${mark.position}/${mark.total}`;
}

const REPEAT_BY_KIND = { Parcela: 'installments', Mensal: 'monthly' };
const KIND_BY_REPEAT = { installments: 'Parcela', monthly: 'Mensal' };

function emptyForm(month) {
  return {
    date: month === currentMonth() ? today() : `${month}-01`,
    description: '',
    type: 'Saída',
    category: CATEGORIES.Saída[0],
    cents: '',
    repeat: 'none',
    position: '1',
    times: '12',
  };
}

export default function Finance({ themeClasses, session, onSessionExpired }) {
  const t = TEXT[usePortfolio().language];
  const [sheet, setSheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [month, setMonth] = useState(currentMonth);
  const [form, setForm] = useState(() => emptyForm(currentMonth()));
  const [editing, setEditing] = useState(null);
  const [applyAll, setApplyAll] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reportForm, setReportForm] = useState(null); // { from, to } digitados no painel do relatório
  const [reportPeriod, setReportPeriod] = useState(null); // período validado, impresso no efeito abaixo

  const reload = async (spreadsheetId, viewedMonth = month) => {
    const rows = await loadEntries(session.accessToken, spreadsheetId, viewedMonth);
    setEntries(rows);
    // A edição aberta guarda o número da linha, que muda quando outra linha é apagada:
    // reencontra o lançamento pelo conteúdo; se ele sumiu ou mudou na planilha, fecha a edição.
    if (editing) {
      const same = rows.find((row) => row.raw.join('|') === editing.raw.join('|'));
      if (same) setEditing(same);
      else cancelEdit();
    }
  };

  const handleError = (err) => {
    if (err.status === 401) return onSessionExpired();
    setError(err.message);
    if (err.status === 409 && sheet) reload(sheet.spreadsheetId).catch((reloadError) => setError(reloadError.message));
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const found = await getSpreadsheet(session.accessToken);
        const rows = await loadEntries(session.accessToken, found.spreadsheetId);
        if (active) {
          setSheet(found);
          setEntries(rows);
        }
      } catch (err) {
        if (active) handleError(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.accessToken]);

  const goToMonth = (next) => {
    setMonth(next);
    if (!editing) setForm((current) => ({ ...current, date: emptyForm(next).date }));
    // Só vai ao Google se faltar algum fixo até o mês aberto (o Sheets limita a 60 leituras por minuto).
    if (sheet && next > fixedHorizon() && extendFixed(entries, next).length) reload(sheet.spreadsheetId, next).catch(handleError);
  };

  // Editar/excluir leva a tela até o formulário ou a pergunta; Esc fecha os dois.
  const formRef = useRef(null);
  const deleteRef = useRef(null);
  useEffect(() => {
    if (pendingDelete) deleteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [pendingDelete]);
  useEffect(() => {
    if (!editing && !pendingDelete) return undefined;
    const onKey = (event) => {
      // Esc com um calendário aberto só fecha o calendário (ver CalendarInput), sem cancelar a edição.
      if (event.key !== 'Escape' || document.querySelector('[aria-haspopup="dialog"][aria-expanded="true"]')) return;
      setPendingDelete(null);
      if (editing) cancelEdit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const cancelEdit = () => {
    setEditing(null);
    setApplyAll(false);
    setForm(emptyForm(month));
  };

  // "Parcela 2/12" → campos do formulário
  const parseRecurrence = (recurrence) => {
    const mark = parseMark(recurrence);
    return mark
      ? { repeat: REPEAT_BY_KIND[mark.kind], position: String(mark.position ?? 1), times: String(mark.total ?? 12) }
      : { repeat: 'none', position: '1', times: '12' };
  };

  const startEdit = (entry) => {
    const type = entry.type === 'Entrada' ? 'Entrada' : 'Saída';
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setPendingDelete(null);
    setEditing(entry);
    setApplyAll(false);
    setError('');
    setForm({
      date: entry.date,
      description: entry.description,
      type,
      category: entry.category || CATEGORIES[type][0],
      cents: String(Math.round(entry.amount * 100)),
      ...parseRecurrence(entry.recurrence),
    });
  };

  const describe = (entry) => `"${entry.description}" (${currency.format(entry.amount)})`;

  // Lançamento de uma série: pergunta se apaga só ele ou a recorrência inteira.
  const askDelete = (entry) => {
    if (findSeries(entries, entry).length > 1) return setPendingDelete(entry);
    if (window.confirm(t.confirmRemove(describe(entry)))) removeEntries([entry]);
  };

  // keepMarks: grava antes as marcas deduzidas dos outros da série, que senão sumiriam junto.
  const removeEntries = async (toDelete, keepMarks = []) => {
    setPendingDelete(null);
    setSaving(true);
    setError('');
    try {
      if (keepMarks.length) await updateEntries(session.accessToken, sheet.spreadsheetId, keepMarks);
      await deleteEntries(session.accessToken, sheet, toDelete);
      await reload(sheet.spreadsheetId);
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  // Encerra o fixo: apaga deste em diante e marca os anteriores como encerrados, para não serem completados de novo.
  const stopFixed = (entry) => {
    const all = findSeries(entries, entry);
    const kept = all.filter((other) => other.date < entry.date && other.recurrence !== FIXED_ENDED);
    removeEntries(all.filter((other) => other.date >= entry.date), kept.map((original) => ({ original, next: { ...original, recurrence: FIXED_ENDED } })));
  };

  const series = editing ? findSeries(entries, editing) : [];

  const handleSubmit = async (event) => {
    event.preventDefault();
    const amount = Number(form.cents) / 100;
    if (!form.description.trim() || !(amount > 0)) {
      setError(t.invalidEntry);
      return;
    }
    const times = Number(form.times);
    const position = Number(form.position);
    if (!editing && form.repeat === 'installments' && !(Number.isInteger(times) && times >= 2 && times <= 120)) {
      setError(t.invalidTimes);
      return;
    }
    const targets = editing && applyAll ? series : [editing];
    const maxPosition = Math.max(...targets.map((target) => parseMark(target?.recurrence)?.position ?? 1));
    if (editing && !applyAll && form.repeat === 'installments' &&!(Number.isInteger(position) && Number.isInteger(times) && position >= 1 && position <= times && times <= 120)) {
      setError(t.invalidPosition);
      return;
    }
    if (editing && applyAll && form.repeat === 'installments' &&!(Number.isInteger(times) && times >= maxPosition && times <= 120)) {
      setError(t.invalidSeriesTotal(maxPosition));
      return;
    }

    // Na criação, expandRecurrence gera uma linha por mês; na edição, buildEditChanges monta as gravações.
    const entry = { date: form.date, description: form.description.trim(), category: form.category, type: form.type, amount };
    // Dois fixos ativos iguais viram uma série só (extendFixed agrupa por descrição, categoria e tipo).
    if (!editing && form.repeat === 'monthly' && findSeries(entries, { ...entry, recurrence: FIXED }).some(isLiveFixed)) {
      setError(t.duplicateFixed(entry.description));
      return;
    }
    const changes = editing
      ? buildEditChanges({ editing, series, entry, applyAll, kind: KIND_BY_REPEAT[form.repeat] ?? '', position, times })
      : [];
    setSaving(true);
    setError('');
    try {
      if (editing) await updateEntries(session.accessToken, sheet.spreadsheetId, changes);
      else {
        const created = expandRecurrence(entry, form.repeat, times);
        await addEntries(session.accessToken, sheet.spreadsheetId, [...created, ...extendFixed(created, fixedHorizon())]);
      }
      await reload(sheet.spreadsheetId);
      const entryMonth = entry.date.slice(0, 7);
      setMonth(entryMonth);
      setEditing(null);
      setApplyAll(false);
      setForm(emptyForm(entryMonth));
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const monthEntries = entries
    .filter((entry) => entry.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date) || b.row - a.row);
  const income = sumByType(monthEntries, 'Entrada');
  const expenses = sumByType(monthEntries, 'Saída');
  const balance = income - expenses;
  const history = monthTotals(monthRange(shiftMonth(month, -5), month), entries, t.locale);
  const categories = expenseCategories(monthEntries);

  // Relatório: período validado pelo painel; sem ele (Ctrl+P), o mês da tela.
  const period = reportPeriod ?? { from: month, to: month };
  const reportEntries = entries
    .filter((entry) => entry.date.slice(0, 7) >= period.from && entry.date.slice(0, 7) <= period.to)
    .sort((a, b) => a.date.localeCompare(b.date) || a.row - b.row);
  const reportIncome = sumByType(reportEntries, 'Entrada');
  const reportExpenses = sumByType(reportEntries, 'Saída');
  const periodLabel = period.from === period.to
    ? monthLabel(period.from, t.locale)
    : `${monthLabel(period.from, t.locale)} ${t.rangeTo} ${monthLabel(period.to, t.locale)}`;

  // O PDF sai do "Salvar como PDF" da impressão do navegador; o título vira o nome sugerido do arquivo.
  // Imprime depois do render, para o relatório já estar com o período novo.
  useEffect(() => {
    if (!reportPeriod) return;
    const previous = document.title;
    document.title = `${t.reportTitle} - ${periodLabel}`;
    window.addEventListener('afterprint', () => {
      document.title = previous;
      setReportPeriod(null);
      setReportForm(null);
    }, { once: true });
    window.print();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportPeriod]);
  const generateReport = async (event) => {
    event.preventDefault();
    const valid = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!valid.test(reportForm.from) || !valid.test(reportForm.to)) return setError(t.invalidRange);
    const [from, to] = [reportForm.from, reportForm.to].sort();
    if (monthRange(from, to).length > MAX_REPORT_MONTHS) return setError(t.invalidRange);
    setError('');
    try {
      // Fixos além do horizonte ainda não estão na planilha: completa antes, para entrarem no relatório.
      if (to > fixedHorizon() && extendFixed(entries, to).length) await reload(sheet.spreadsheetId, to);
    } catch (err) {
      return handleError(err);
    }
    setReportPeriod({ from, to });
  };

  const categoryOptions = CATEGORIES[form.type].includes(form.category)
    ? CATEGORIES[form.type]
    : [form.category, ...CATEGORIES[form.type]];

  return (
    <div className="animate-fade-in w-full flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className={`text-3xl font-light tracking-tight ${themeClasses.accent}`}>{t.title}</h2>
        {sheet && (
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => setReportForm(reportForm ? null : { from: month, to: month })} disabled={loading} aria-expanded={Boolean(reportForm)} className="inline-flex items-center gap-1.5 text-xs opacity-70 hover:opacity-100 disabled:opacity-30">
              <FileDown size={12} /> {t.pdf}
            </button>
            <a href={`https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs opacity-70 hover:opacity-100">
              {t.openSheet} <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>

      {reportForm && (
        <form onSubmit={generateReport} className={`relative z-20 flex flex-wrap items-end gap-3 p-4 rounded-2xl ${themeClasses.glass}`}>
          {[['from', t.rangeFrom], ['to', t.rangeUntil]].map(([key, label]) => (
            <div key={key} className="flex flex-col gap-1 flex-1 min-w-[10rem]">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</span>
              <CalendarInput mode="month" value={reportForm[key]} onChange={(value) => setReportForm({ ...reportForm, [key]: value })} locale={t.locale} label={label} prevLabel={t.prevYear} nextLabel={t.nextYear} className={inputClass} />
            </div>
          ))}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-xs font-bold tracking-[0.2em] uppercase border border-current/20 hover:bg-current/10 disabled:opacity-40 flex items-center gap-2">
              <FileDown size={14} /> {t.generate}
            </button>
            <button type="button" onClick={() => setReportForm(null)} aria-label={t.cancel} className="px-3 py-2 rounded-lg border border-current/20 hover:bg-current/10">
              <X size={14} />
            </button>
          </div>
        </form>
      )}

      <div className={`flex items-center justify-between gap-2 p-2 rounded-2xl ${themeClasses.glass}`}>
        <button type="button" onClick={() => goToMonth(shiftMonth(month, -1))} aria-label={t.prevMonth} className="p-2 rounded-full hover:bg-current/10">
          <ChevronLeft size={18} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold uppercase tracking-[0.15em] capitalize">{monthLabel(month, t.locale)}</span>
          {month !== currentMonth() && (
            <button type="button" onClick={() => goToMonth(currentMonth())} className="text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100">
              {t.backToday}
            </button>
          )}
        </div>
        <button type="button" onClick={() => goToMonth(shiftMonth(month, 1))} aria-label={t.nextMonth} className="p-2 rounded-full hover:bg-current/10">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        {[
          [t.income, income, 'text-[var(--success-text)]'],
          [t.expenses, expenses, 'text-[var(--error-text)]'],
          [t.balance, balance, balance < 0 ? 'text-[var(--error-text)]' : balance > 0 ? 'text-[var(--success-text)]' : ''],
        ].map(([label, value, color]) => (
          // No celular cada total vira uma linha (rótulo à esquerda, valor à direita), para não ocupar a tela toda.
          <div key={label} className={`flex items-center justify-between gap-3 px-4 py-3 sm:block sm:p-4 rounded-2xl ${themeClasses.glass}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">{label}</p>
            <p className={`text-lg sm:text-xl font-semibold sm:mt-1 tabular-nums ${color}`}>{currency.format(value)}</p>
          </div>
        ))}
      </div>

      {!loading && (
        <FinanceCharts history={history} categories={categories} selectedMonth={month} onSelectMonth={goToMonth} t={t} themeClasses={themeClasses} />
      )}

      {/* z-10: o calendário aberto fica por cima dos cartões seguintes (o backdrop-blur deles cria outra camada). */}
      <form ref={formRef} onSubmit={handleSubmit} className={`relative z-10 p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-6 gap-3 ${themeClasses.glass}`}>
        {editing && (
          <p className="sm:col-span-6 text-[10px] font-bold uppercase tracking-widest opacity-60">{t.editing}</p>
        )}
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category: CATEGORIES[e.target.value][0] })} className={`${inputClass} theme-select sm:col-span-1`} aria-label={t.type}>
          <option value="Saída">{t.typeLabels.Saída}</option>
          <option value="Entrada">{t.typeLabels.Entrada}</option>
        </select>
        <div className="sm:col-span-1">
          <CalendarInput value={form.date} onChange={(date) => setForm({ ...form, date })} locale={t.locale} label={t.date} prevLabel={t.prevMonth} nextLabel={t.nextMonth} className={inputClass} />
        </div>
        <input type="text" required placeholder={t.description} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} sm:col-span-2`} />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={`${inputClass} theme-select sm:col-span-1`} aria-label={t.category}>
          {categoryOptions.map((category) => <option key={category}>{category}</option>)}
        </select>
        <input
          type="text"
          inputMode="numeric"
          required
          placeholder="R$ 0,00"
          aria-label={t.amount}
          value={form.cents ? currency.format(Number(form.cents) / 100) : ''}
          onChange={(e) => setForm({ ...form, cents: e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11) })}
          className={`${inputClass} sm:col-span-1 text-right`}
        />
        <select value={form.repeat} onChange={(e) => setForm({ ...form, repeat: e.target.value })} className={`${inputClass} theme-select sm:col-span-3`} aria-label={t.recurrence}>
          <option value="none">{t.noRepeat}</option>
          <option value="installments">{editing ? t.recurrenceKinds.Parcela : t.installments}</option>
          <option value="monthly">{editing ? t.recurrenceKinds.Mensal : t.monthly}</option>
        </select>
        {form.repeat === 'installments' && (editing ? (
          <div className="sm:col-span-3 flex items-center gap-2 text-xs">
            <span className="opacity-70">{t.position}</span>
            <input type="number" min="1" max="120" step="1" required disabled={applyAll} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={`${inputClass} w-full disabled:opacity-40`} aria-label={t.position} />
            <span className="opacity-70">{t.of}</span>
            <input type="number" min="1" max="120" step="1" required value={form.times} onChange={(e) => setForm({ ...form, times: e.target.value })} className={`${inputClass} w-full`} aria-label="Total" />
          </div>
        ) : (
          <label className="sm:col-span-3 flex items-center gap-2 text-xs">
            <span className="opacity-70 whitespace-nowrap">{t.installmentCount}</span>
            <input type="number" min="2" max="120" step="1" required value={form.times} onChange={(e) => setForm({ ...form, times: e.target.value })} className={`${inputClass} w-full`} />
          </label>
        ))}
        {editing && series.length > 1 && (
          <label className="sm:col-span-6 flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} className="h-4 w-4 accent-current" />
            {t.applyAll(series.length)}
          </label>
        )}
        <div className="sm:col-span-6 flex gap-3">
          <button type="submit" disabled={saving || !sheet} className="flex-1 px-6 py-2.5 rounded-lg text-xs font-bold tracking-[0.2em] uppercase border border-current/20 hover:bg-current/10 disabled:opacity-40 flex items-center justify-center gap-2">
            {editing ? <Save size={14} /> : <Plus size={14} />}
            {saving ? t.saving : editing ? t.saveChanges : t.add}
          </button>
          {editing && (
            <button type="button" onClick={cancelEdit} className="px-4 py-2.5 rounded-lg text-xs font-bold tracking-[0.2em] uppercase border border-current/20 hover:bg-current/10 flex items-center gap-2">
              <X size={14} /> {t.cancel}
            </button>
          )}
        </div>
      </form>

      {pendingDelete && (
        <div ref={deleteRef} role="alertdialog" aria-label={t.deleteWhich(describe(pendingDelete))} className={`flex flex-wrap items-center gap-3 p-4 rounded-2xl text-xs ${themeClasses.glass}`}>
          <span className="flex-1 min-w-[12rem] font-semibold">{t.deleteWhich(describe(pendingDelete))}</span>
          {/* O último mês de um fixo ativo voltaria a ser criado na próxima carga: aí só vale encerrar. */}
          {!(isLiveFixed(pendingDelete) && !findSeries(entries, pendingDelete).some((other) => other.date > pendingDelete.date)) && (
            <button type="button" onClick={() => removeEntries([pendingDelete], persistMarks(findSeries(entries, pendingDelete), pendingDelete.row))} className="px-3 py-2 rounded-lg border border-current/20 hover:bg-current/10">
              {t.deleteOne}
            </button>
          )}
          {parseMark(pendingDelete.recurrence)?.kind === 'Mensal' && (
            <button type="button" onClick={() => stopFixed(pendingDelete)} className="px-3 py-2 rounded-lg border border-current/20 hover:bg-current/10">
              {t.deleteFromHere}
            </button>
          )}
          <button type="button" onClick={() => removeEntries(findSeries(entries, pendingDelete))} className="px-3 py-2 rounded-lg border border-current/20 hover:bg-current/10 text-[var(--error-text)]">
            {t.deleteSeries(findSeries(entries, pendingDelete).length)}
          </button>
          <button type="button" onClick={() => setPendingDelete(null)} className="px-3 py-2 rounded-lg opacity-70 hover:opacity-100">
            {t.cancel}
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-[var(--error-text)]">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className={`rounded-2xl overflow-x-auto ${themeClasses.glass}`}>
        {loading ? (
          <p className="p-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">{t.loading}</p>
        ) : monthEntries.length === 0 ? (
          <p className="p-6 text-center text-xs opacity-60">{t.empty(monthLabel(month, t.locale))}</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest opacity-50">
                <th className="p-3 hidden sm:table-cell">{t.date}</th><th className="p-3">{t.description}</th><th className="p-3 hidden sm:table-cell">{t.category}</th><th className="p-3 text-right">{t.amount}</th><th className="p-3"><span className="sr-only">{t.actions}</span></th>
              </tr>
            </thead>
            <tbody>
              {monthEntries.map((entry) => (
                <tr key={entry.row} className={`border-t border-current/10 ${editing?.row === entry.row ? 'bg-current/10' : ''}`}>
                  <td className="p-3 whitespace-nowrap hidden sm:table-cell">{formatDate(entry.date)}</td>
                  <td className="p-3">
                    {entry.description}
                    {/* No celular data e categoria vêm aqui embaixo, para valor e botões caberem sem rolar de lado. */}
                    <span className="block sm:hidden mt-0.5 text-[10px] opacity-60">{formatDate(entry.date)} · {entry.category}</span>
                    {entry.recurrence && (
                      <span className="ml-2 inline-block rounded-full border border-current/20 bg-current/5 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap opacity-80">
                        {recurrenceText(entry.recurrence, t)}
                      </span>
                    )}
                  </td>
                  <td className="p-3 opacity-70 hidden sm:table-cell">{entry.category}</td>
                  <td className={`p-3 text-right whitespace-nowrap ${entry.type === 'Entrada' ? 'text-[var(--success-text)]' : 'text-[var(--error-text)]'}`}>
                    {entry.type === 'Entrada' ? '+' : '-'} {currency.format(entry.amount)}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => startEdit(entry)} disabled={saving} aria-label={`${t.edit} ${entry.description}`} className="p-1.5 rounded hover:bg-current/10 opacity-70 hover:opacity-100 disabled:opacity-30">
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => askDelete(entry)} disabled={saving} aria-label={`${t.remove} ${entry.description}`} className="p-1.5 rounded hover:bg-current/10 opacity-70 hover:opacity-100 text-[var(--error-text)] disabled:opacity-30">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Só aparece na impressão (ver .print-report no index.css): sempre claro, sem botões nem formulário. */}
      {!loading && createPortal(
        <div className="print-report theme-claro text-gray-900 flex-col gap-5">
          <header className="flex items-end justify-between border-b border-gray-300 pb-3">
            <div>
              <h1 className="text-2xl font-semibold">{t.reportTitle}</h1>
              <p className="text-sm first-letter:uppercase">{periodLabel}</p>
            </div>
            <p className="text-xs text-gray-500">{t.generatedAt(new Date().toLocaleDateString(t.locale))}</p>
          </header>
          <div className="grid grid-cols-3 gap-3">
            {[[t.income, reportIncome], [t.expenses, reportExpenses], [period.from === period.to ? t.balance : t.periodBalance, reportIncome - reportExpenses]].map(([label, value]) => (
              <div key={label} className="p-3 rounded-xl border border-gray-300">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
                <p className={`text-lg font-semibold ${value < 0 || label === t.expenses ? 'text-[var(--error-text)]' : 'text-[var(--success-text)]'}`}>{currency.format(value)}</p>
              </div>
            ))}
          </div>
          {/* Período de um mês só mostra os 6 meses até ele, como na tela; período maior mostra exatamente os meses escolhidos. */}
          <FinanceCharts
            history={period.from === period.to ? history : monthTotals(monthRange(period.from, period.to), entries, t.locale)}
            categories={expenseCategories(reportEntries)}
            selectedMonth={period.from === period.to ? period.from : ''}
            onSelectMonth={() => {}}
            t={period.from === period.to ? t : { ...t, chartHistory: t.reportHistory }}
            themeClasses={{ solidBg: 'bg-white border-gray-300' }}
          />
          {reportEntries.length === 0 ? (
            <p className="text-sm text-gray-500">{t.empty(periodLabel)}</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-gray-500 border-b border-gray-300">
                  <th className="py-2 pr-2">{t.date}</th><th className="py-2 pr-2">{t.description}</th><th className="py-2 pr-2">{t.category}</th><th className="py-2 text-right">{t.amount}</th>
                </tr>
              </thead>
              <tbody>
                {reportEntries.map((entry) => (
                  <tr key={entry.row} className="border-b border-gray-200 break-inside-avoid">
                    <td className="py-1.5 pr-2 whitespace-nowrap">{formatDate(entry.date)}</td>
                    <td className="py-1.5 pr-2">{entry.description}{entry.recurrence && <span className="text-gray-500"> · {recurrenceText(entry.recurrence, t)}</span>}</td>
                    <td className="py-1.5 pr-2">{entry.category}</td>
                    <td className={`py-1.5 text-right whitespace-nowrap ${entry.type === 'Entrada' ? 'text-[var(--success-text)]' : 'text-[var(--error-text)]'}`}>
                      {entry.type === 'Entrada' ? '+' : '-'} {currency.format(entry.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
