import React, { useEffect, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, ExternalLink, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { addEntries, deleteEntries, getSpreadsheet, listEntries, updateEntries } from '../services/googleService';
import { buildEditChanges, expandRecurrence, findSeries, parseMark, persistMarks } from '../services/financeDates';
import { usePortfolio } from '../context/PortfolioContext';

const CATEGORIES = {
  Saída: ['Alimentação', 'Moradia', 'Contas', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Compras', 'Assinaturas', 'Outros'],
  Entrada: ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Reembolso', 'Outros'],
};

// Textos da tela. Tipos e categorias ficam em português porque são gravados assim na planilha.
const TEXT = {
  PT: {
    locale: 'pt-BR', title: 'Controle Financeiro', openSheet: 'Abrir no Google Planilhas',
    prevMonth: 'Mês anterior', nextMonth: 'Próximo mês', backToday: 'Voltar para o mês atual',
    income: 'Entradas', expenses: 'Saídas', balance: 'Saldo do mês', editing: 'Editando lançamento',
    type: 'Tipo', typeLabels: { Saída: 'Saída', Entrada: 'Entrada' }, date: 'Data', description: 'Descrição',
    category: 'Categoria', amount: 'Valor', recurrence: 'Recorrência', noRepeat: 'Não repete',
    installments: 'Parcelado (valor de cada parcela)', monthly: 'Mensal fixo (salário, aluguel, assinatura...)',
    installmentCount: 'Nº de parcelas', monthCount: 'Repetir por (meses)',
    saving: 'Salvando...', saveChanges: 'Salvar alterações', add: 'Adicionar', cancel: 'Cancelar',
    loading: 'Carregando planilha...', empty: (month) => `Nenhum lançamento em ${month}.`, actions: 'Ações',
    edit: 'Editar', remove: 'Excluir', confirmRemove: (what) => `Excluir ${what}?`,
    recurrenceKinds: { Parcela: 'Parcela', Mensal: 'Mensal' },
    invalidEntry: 'Informe uma descrição e um valor maior que zero.',
    invalidTimes: 'O número de meses deve ser entre 2 e 120.',
    position: 'Nº', of: 'de',
    invalidPosition: 'O número deve ficar entre 1 e o total (máximo 120).',
    applyAll: (count) => `Aplicar a toda a recorrência (${count} lançamentos)`,
    deleteWhich: (what) => `Excluir ${what}?`, deleteOne: 'Só este', deleteSeries: (count) => `Toda a recorrência (${count})`,
    invalidSeriesTotal: (max) => `O total precisa ser pelo menos ${max}, a maior parcela da série (máximo 120).`,
  },
  EN: {
    locale: 'en-US', title: 'Finance Tracker', openSheet: 'Open in Google Sheets',
    prevMonth: 'Previous month', nextMonth: 'Next month', backToday: 'Back to current month',
    income: 'Income', expenses: 'Expenses', balance: 'Monthly balance', editing: 'Editing entry',
    type: 'Type', typeLabels: { Saída: 'Expense', Entrada: 'Income' }, date: 'Date', description: 'Description',
    category: 'Category', amount: 'Amount', recurrence: 'Recurrence', noRepeat: 'One-time',
    installments: 'Installments (amount per installment)', monthly: 'Fixed monthly (salary, rent, subscription...)',
    installmentCount: 'Installments', monthCount: 'Repeat for (months)',
    saving: 'Saving...', saveChanges: 'Save changes', add: 'Add', cancel: 'Cancel',
    loading: 'Loading spreadsheet...', empty: (month) => `No entries in ${month}.`, actions: 'Actions',
    edit: 'Edit', remove: 'Delete', confirmRemove: (what) => `Delete ${what}?`,
    recurrenceKinds: { Parcela: 'Installment', Mensal: 'Monthly' },
    invalidEntry: 'Enter a description and an amount greater than zero.',
    invalidTimes: 'The number of months must be between 2 and 120.',
    position: 'No.', of: 'of',
    invalidPosition: 'The number must be between 1 and the total (max 120).',
    applyAll: (count) => `Apply to the whole series (${count} entries)`,
    deleteWhich: (what) => `Delete ${what}?`, deleteOne: 'Only this one', deleteSeries: (count) => `Whole series (${count})`,
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

function monthLabel(month, locale) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

function formatDate(date) {
  const [year, month, day] = date.split('-');
  return day ? `${day}/${month}/${year}` : date;
}

// "Parcela 2/12" → "Installment 2/12" em inglês
function recurrenceText(recurrence, t) {
  const mark = parseMark(recurrence);
  return mark ? `${t.recurrenceKinds[mark.kind]} ${mark.position}/${mark.total}` : recurrence;
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

  const reload = async (spreadsheetId) => {
    const rows = await listEntries(session.accessToken, spreadsheetId);
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
    if (err.status === 409) reload(sheet.spreadsheetId).catch((reloadError) => setError(reloadError.message));
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const found = await getSpreadsheet(session.accessToken);
        const rows = await listEntries(session.accessToken, found.spreadsheetId);
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
  };

  const cancelEdit = () => {
    setEditing(null);
    setApplyAll(false);
    setForm(emptyForm(month));
  };

  // "Parcela 2/12" → campos do formulário
  const parseRecurrence = (recurrence) => {
    const mark = parseMark(recurrence);
    return mark
      ? { repeat: REPEAT_BY_KIND[mark.kind], position: String(mark.position), times: String(mark.total) }
      : { repeat: 'none', position: '1', times: '12' };
  };

  const startEdit = (entry) => {
    const type = entry.type === 'Entrada' ? 'Entrada' : 'Saída';
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
    if (!editing && form.repeat !== 'none' && !(Number.isInteger(times) && times >= 2 && times <= 120)) {
      setError(t.invalidTimes);
      return;
    }
    const targets = editing && applyAll ? series : [editing];
    const maxPosition = Math.max(...targets.map((target) => parseMark(target?.recurrence)?.position ?? 1));
    if (editing && !applyAll && form.repeat !== 'none' && !(Number.isInteger(position) && Number.isInteger(times) && position >= 1 && position <= times && times <= 120)) {
      setError(t.invalidPosition);
      return;
    }
    if (editing && applyAll && form.repeat !== 'none' && !(Number.isInteger(times) && times >= maxPosition && times <= 120)) {
      setError(t.invalidSeriesTotal(maxPosition));
      return;
    }

    // Na criação, expandRecurrence gera uma linha por mês; na edição, buildEditChanges monta as gravações.
    const entry = { date: form.date, description: form.description.trim(), category: form.category, type: form.type, amount };
    const changes = editing
      ? buildEditChanges({ editing, series, entry, applyAll, kind: KIND_BY_REPEAT[form.repeat] ?? '', position, times })
      : [];
    setSaving(true);
    setError('');
    try {
      if (editing) await updateEntries(session.accessToken, sheet.spreadsheetId, changes);
      else await addEntries(session.accessToken, sheet.spreadsheetId, expandRecurrence(entry, form.repeat, times));
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
  const income = monthEntries.filter((e) => e.type === 'Entrada').reduce((sum, e) => sum + e.amount, 0);
  const expenses = monthEntries.filter((e) => e.type === 'Saída').reduce((sum, e) => sum + e.amount, 0);
  const categoryOptions = CATEGORIES[form.type].includes(form.category)
    ? CATEGORIES[form.type]
    : [form.category, ...CATEGORIES[form.type]];

  return (
    <div className="animate-fade-in w-full flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className={`text-3xl font-light tracking-tight ${themeClasses.accent}`}>{t.title}</h2>
        {sheet && (
          <a href={`https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs opacity-70 hover:opacity-100">
            {t.openSheet} <ExternalLink size={12} />
          </a>
        )}
      </div>

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[[t.income, income, 'text-[var(--success-text)]'], [t.expenses, expenses, 'text-[var(--error-text)]'], [t.balance, income - expenses, '']].map(([label, value, color]) => (
          <div key={label} className={`p-4 rounded-2xl ${themeClasses.glass}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">{label}</p>
            <p className={`text-xl font-semibold mt-1 ${color}`}>{currency.format(value)}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className={`p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-6 gap-3 ${themeClasses.glass}`}>
        {editing && (
          <p className="sm:col-span-6 text-[10px] font-bold uppercase tracking-widest opacity-60">{t.editing}</p>
        )}
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category: CATEGORIES[e.target.value][0] })} className={`${inputClass} theme-select sm:col-span-1`} aria-label={t.type}>
          <option value="Saída">{t.typeLabels.Saída}</option>
          <option value="Entrada">{t.typeLabels.Entrada}</option>
        </select>
        <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={`${inputClass} sm:col-span-1`} aria-label={t.date} />
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
        {form.repeat !== 'none' && (editing ? (
          <div className="sm:col-span-3 flex items-center gap-2 text-xs">
            <span className="opacity-70">{t.position}</span>
            <input type="number" min="1" max="120" step="1" required disabled={applyAll} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={`${inputClass} w-full disabled:opacity-40`} aria-label={t.position} />
            <span className="opacity-70">{t.of}</span>
            <input type="number" min="1" max="120" step="1" required value={form.times} onChange={(e) => setForm({ ...form, times: e.target.value })} className={`${inputClass} w-full`} aria-label="Total" />
          </div>
        ) : (
          <label className="sm:col-span-3 flex items-center gap-2 text-xs">
            <span className="opacity-70 whitespace-nowrap">{form.repeat === 'installments' ? t.installmentCount : t.monthCount}</span>
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
        <div role="alertdialog" aria-label={t.deleteWhich(describe(pendingDelete))} className={`flex flex-wrap items-center gap-3 p-4 rounded-2xl text-xs ${themeClasses.glass}`}>
          <span className="flex-1 min-w-[12rem] font-semibold">{t.deleteWhich(describe(pendingDelete))}</span>
          <button type="button" onClick={() => removeEntries([pendingDelete], persistMarks(findSeries(entries, pendingDelete), pendingDelete.row))} className="px-3 py-2 rounded-lg border border-current/20 hover:bg-current/10">
            {t.deleteOne}
          </button>
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
                <th className="p-3">{t.date}</th><th className="p-3">{t.description}</th><th className="p-3">{t.category}</th><th className="p-3 text-right">{t.amount}</th><th className="p-3"><span className="sr-only">{t.actions}</span></th>
              </tr>
            </thead>
            <tbody>
              {monthEntries.map((entry) => (
                <tr key={entry.row} className={`border-t border-current/10 ${editing?.row === entry.row ? 'bg-current/10' : ''}`}>
                  <td className="p-3 whitespace-nowrap">{formatDate(entry.date)}</td>
                  <td className="p-3">
                    {entry.description}
                    {entry.recurrence && (
                      <span className="ml-2 inline-block rounded-full border border-current/20 bg-current/5 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap opacity-80">
                        {recurrenceText(entry.recurrence, t)}
                      </span>
                    )}
                  </td>
                  <td className="p-3 opacity-70">{entry.category}</td>
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
    </div>
  );
}
