// Mesmo dia nos meses seguintes; 31/01 + 1 mês vira 28/02 (ou 29).
export function addMonths(date, count) {
  const [year, month, day] = date.split('-').map(Number);
  const lastDay = new Date(year, month + count, 0).getDate();
  return new Date(year, month - 1 + count, Math.min(day, lastDay)).toLocaleDateString('sv-SE');
}

// Meses de a até b ("2026-01-31" → "2026-03-01" = 2).
function monthDiff(a, b) {
  const [ya, ma] = a.split('-').map(Number);
  const [yb, mb] = b.split('-').map(Number);
  return (yb - ya) * 12 + (mb - ma);
}

// Mensal fixo não tem número nem fim; "encerrado" marca uma série que não deve mais ser completada.
export const FIXED = 'Mensal';
export const FIXED_ENDED = 'Mensal encerrado';

// Cada mês vira uma linha; "recurrence" vai para a coluna Recorrência ("Parcela 2/12", "Mensal").
export function expandRecurrence(entry, repeat, times) {
  if (repeat === 'none') return [entry];
  // Mensal fixo grava o primeiro mês; extendFixed completa os seguintes.
  if (repeat === 'monthly') return [{ ...entry, recurrence: FIXED }];
  return Array.from({ length: times }, (_, index) => ({
    ...entry,
    date: addMonths(entry.date, index),
    recurrence: `Parcela ${index + 1}/${times}`,
  }));
}

// Fixo que continua: "Mensal" ou o formato antigo "Mensal 2/12" gravado na planilha.
// Marcas só deduzidas (coluna F vazia) ficam de fora: podem ser duas compras iguais por acaso.
export function isLiveFixed(entry) {
  return entry.recurrence === FIXED || (/^Mensal \d+\/\d+$/.test(entry.recurrence ?? '') && entry.raw?.[5] === entry.recurrence);
}

// Linhas que faltam para cada série fixa não encerrada chegar até untilMonth ("2027-10"), após o último mês lançado.
// O valor segue o do último mês, então mudar o preço do último lançamento muda os próximos.
// Série = mesma descrição, categoria e tipo; a tela impede criar um segundo fixo ativo igual.
export function extendFixed(entries, untilMonth) {
  const groups = new Map();
  for (const entry of entries) {
    const live = isLiveFixed(entry);
    if (!live && entry.recurrence !== FIXED_ENDED) continue;
    const key = [entry.description, entry.category, entry.type].join('|');
    const group = groups.get(key) ?? { first: null, last: entry };
    // O dia vem do primeiro mês ativo, não de uma série antiga já encerrada com o mesmo nome.
    if (live && !(group.first && group.first.date <= entry.date)) group.first = entry;
    if (entry.date >= group.last.date) group.last = entry;
    groups.set(key, group);
  }
  const missing = [];
  for (const { first, last } of groups.values()) {
    if (!isLiveFixed(last)) continue;
    for (let n = monthDiff(first.date, last.date) + 1; addMonths(first.date, n).slice(0, 7) <= untilMonth; n++) {
      const { description, category, type, amount } = last;
      missing.push({ date: addMonths(first.date, n), description, category, type, amount, recurrence: FIXED });
    }
  }
  return missing;
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

// "Parcela 2/12" → { kind: 'Parcela', position: 2, total: 12 }; "Mensal" → { kind: 'Mensal', fixed: true }.
// "Mensal 2/12" é o formato antigo; se estiver gravado na planilha, também é completado (ver isLiveFixed).
export function parseMark(recurrence) {
  if (recurrence === FIXED || recurrence === FIXED_ENDED) return { kind: 'Mensal', fixed: true };
  const match = /^(Parcela|Mensal) (\d+)\/(\d+)$/.exec(recurrence ?? '');
  return match ? { kind: match[1], position: Number(match[2]), total: Number(match[3]) } : null;
}

// Lançamentos da mesma série: mesma marca (tipo e total), mesmos dados e no mês certo da sequência.
// O mês separa duas compras iguais feitas em épocas diferentes (ex.: a mesma academia renovada no ano seguinte).
export function findSeries(entries, entry) {
  const mark = parseMark(entry.recurrence);
  if (!mark) return [entry];
  // Mensal não tem fim nem número: a série é tudo com a mesma descrição, categoria e tipo (o valor pode mudar).
  if (mark.kind === 'Mensal') {
    return entries.filter((other) => parseMark(other.recurrence)?.kind === 'Mensal'
      && other.description === entry.description && other.category === entry.category && other.type === entry.type);
  }
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
  // Fixo encerrado continua encerrado, senão a série voltaria a ser completada. Um mês de fixo renomeado
  // sozinho sai da série como encerrado, senão viraria uma série nova e duplicaria os meses seguintes.
  const leavesSeries = !applyAll && parseMark(editing.recurrence)?.kind === 'Mensal'
    && [entry.description, entry.category, entry.type].join('|') !== [editing.description, editing.category, editing.type].join('|');
  const mark = (original, own) => {
    if (kind === 'Mensal') return original.recurrence === FIXED_ENDED || leavesSeries ? FIXED_ENDED : FIXED;
    return kind ? `${kind} ${own}/${times}` : '';
  };
  if (!applyAll) {
    return [{ original: editing, next: { ...entry, recurrence: mark(editing, position) } }, ...persistMarks(series, editing.row)];
  }
  const ordered = [...series].sort((a, b) => a.date.localeCompare(b.date));
  return series.map((original) => {
    const own = parseMark(original.recurrence)?.position ?? ordered.indexOf(original) + 1;
    const date = entry.date === editing.date ? original.date : addMonths(entry.date, monthDiff(editing.date, original.date));
    return { original, next: { ...entry, date, recurrence: mark(original, own) } };
  });
}
