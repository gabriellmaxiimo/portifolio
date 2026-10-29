// Mesmo dia nos meses seguintes; 31/01 + 1 mês vira 28/02 (ou 29).
export function addMonths(date, count) {
  const [year, month, day] = date.split('-').map(Number);
  const lastDay = new Date(year, month + count, 0).getDate();
  return new Date(year, month - 1 + count, Math.min(day, lastDay)).toLocaleDateString('sv-SE');
}

// Cada mês vira uma linha; "recurrence" vai para a coluna Recorrência ("Parcela 2/12", "Mensal 2/12").
export function expandRecurrence(entry, repeat, times) {
  if (repeat === 'none') return [entry];
  const kind = repeat === 'installments' ? 'Parcela' : 'Mensal';
  return Array.from({ length: times }, (_, index) => ({
    ...entry,
    date: addMonths(entry.date, index),
    recurrence: `${kind} ${index + 1}/${times}`,
  }));
}

// "Mensal fixo" antigos não gravavam a coluna Recorrência. Reconhece a sequência que expandRecurrence
// gerava: mesma descrição, categoria, tipo e valor, em meses seguidos e no mesmo dia (ou o último do mês).
export function inferMonthly(entries) {
  const groups = new Map();
  for (const entry of entries) {
    if (entry.recurrence) continue;
    const key = [entry.description, entry.category, entry.type, entry.amount].join('|');
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }

  const marks = new Map();
  for (const group of groups.values()) {
    group.sort((a, b) => a.date.localeCompare(b.date));
    let run = [];
    const flush = () => {
      if (run.length >= 2) run.forEach((entry, i) => marks.set(entry, `Mensal ${i + 1}/${run.length}`));
    };
    for (const entry of group) {
      if (run.length && entry.date === addMonths(run[0].date, run.length)) {
        run.push(entry);
      } else {
        flush();
        run = [entry];
      }
    }
    flush();
  }
  return entries.map((entry) => (marks.has(entry) ? { ...entry, recurrence: marks.get(entry) } : entry));
}

// "Parcela 2/12" → { kind: 'Parcela', position: 2, total: 12 }
export function parseMark(recurrence) {
  const match = /^(Parcela|Mensal) (\d+)\/(\d+)$/.exec(recurrence ?? '');
  return match ? { kind: match[1], position: Number(match[2]), total: Number(match[3]) } : null;
}

// Lançamentos da mesma série: mesma marca (tipo e total), mesmos dados e no mês certo da sequência.
// O mês separa duas compras iguais feitas em épocas diferentes (ex.: a mesma academia renovada no ano seguinte).
export function findSeries(entries, entry) {
  const mark = parseMark(entry.recurrence);
  if (!mark) return [entry];
  const firstOfMonth = `${entry.date.slice(0, 7)}-01`;
  return entries.filter((other) => {
    const otherMark = parseMark(other.recurrence);
    return otherMark?.kind === mark.kind && otherMark.total === mark.total
      && other.description === entry.description && other.category === entry.category
      && other.type === entry.type && other.amount === entry.amount
      && other.date.slice(0, 7) === addMonths(firstOfMonth, otherMark.position - mark.position).slice(0, 7);
  });
}

// Marcas só deduzidas (coluna F vazia: "Mensal" antigo ou "(2/12)" na descrição) são gravadas como estão,
// para a série continuar existindo depois que um dos lançamentos for editado ou excluído.
export function persistMarks(series, skipRow) {
  return series
    .filter((entry) => entry.row !== skipRow && entry.recurrence && !entry.raw[5])
    .map((entry) => ({ original: entry, next: entry }));
}

// Gravações de uma edição. Série inteira: cada lançamento mantém o seu número e a data só muda
// se a data do editado mudou (mesmo deslocamento de meses). kind: 'Parcela' | 'Mensal' | '' (sem marca).
export function buildEditChanges({ editing, series, entry, applyAll, kind, position, times }) {
  const mark = (own) => (kind ? `${kind} ${own}/${times}` : '');
  if (!applyAll) {
    return [{ original: editing, next: { ...entry, recurrence: mark(position) } }, ...persistMarks(series, editing.row)];
  }
  const editingPosition = parseMark(editing.recurrence).position;
  return series.map((original) => {
    const own = parseMark(original.recurrence).position;
    const date = entry.date === editing.date ? original.date : addMonths(entry.date, own - editingPosition);
    return { original, next: { ...entry, date, recurrence: mark(own) } };
  });
}
