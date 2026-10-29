import assert from "node:assert/strict";
import { test } from "node:test";

import { addMonths, buildEditChanges, expandRecurrence, extendFixed, findSeries, inferMonthly } from "../src/services/financeDates.js";
import { waitSeconds } from "../GeminiAPI/api/_gemini.js";

test("parcelas caem no mesmo dia ou no último dia do mês", () => {
  assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
  assert.equal(addMonths("2028-01-31", 1), "2028-02-29");
  assert.equal(addMonths("2026-11-15", 2), "2027-01-15");
});

test("parcelado e mensal fixo marcam a recorrência sem mudar a descrição", () => {
  const entry = { date: "2026-10-31", description: "TV", amount: 100 };
  assert.deepEqual(
    expandRecurrence(entry, "installments", 3).map((e) => `${e.date} ${e.description} ${e.recurrence}`),
    ["2026-10-31 TV Parcela 1/3", "2026-11-30 TV Parcela 2/3", "2026-12-31 TV Parcela 3/3"],
  );
  assert.deepEqual(expandRecurrence(entry, "monthly", 2).map((e) => `${e.date} ${e.recurrence}`), ["2026-10-31 Mensal"]);
  assert.deepEqual(expandRecurrence(entry, "none", 12), [entry]);
});

test("reconhece mensal fixo antigo só quando os meses seguem a sequência", () => {
  const base = { description: "Aluguel", category: "Moradia", type: "Saída", amount: 1200, recurrence: "" };
  const rows = [
    { ...base, row: 2, date: "2026-01-31" },
    { ...base, row: 3, date: "2026-02-28" },
    { ...base, row: 4, date: "2026-03-31" },
    { ...base, row: 5, date: "2026-06-15" }, // fora da sequência
    { ...base, row: 6, description: "Café", date: "2026-02-28" }, // outra descrição
    { ...base, row: 7, date: "2026-04-30", recurrence: "Parcela 1/2" }, // já marcado
  ];
  assert.deepEqual(
    inferMonthly(rows).map((e) => `${e.row}:${e.recurrence}`),
    ["2:Mensal 1/3", "3:Mensal 2/3", "4:Mensal 3/3", "5:", "6:", "7:Parcela 1/2"],
  );
});

test("encontra só as parcelas da mesma série", () => {
  const tv = { description: "TV", category: "Compras", type: "Saída", amount: 100 };
  const rows = [
    { ...tv, row: 2, date: "2026-01-05", recurrence: "Parcela 1/3" },
    { ...tv, row: 3, date: "2026-02-05", recurrence: "Parcela 2/3" },
    { ...tv, row: 4, date: "2026-01-05", recurrence: "Parcela 1/10" }, // outra compra (outro total)
    { ...tv, row: 5, date: "2026-03-05", amount: 90, recurrence: "Parcela 3/3" }, // outro valor
    { ...tv, row: 6, date: "2026-02-05", recurrence: "" },
    { ...tv, row: 7, date: "2027-01-05", recurrence: "Parcela 1/3" }, // mesma compra repetida um ano depois
    { ...tv, row: 8, date: "2027-02-05", recurrence: "Parcela 2/3" },
  ];
  assert.deepEqual(findSeries(rows, rows[1]).map((e) => e.row), [2, 3]);
  assert.deepEqual(findSeries(rows, rows[6]).map((e) => e.row), [7, 8]);
  assert.deepEqual(findSeries(rows, rows[4]).map((e) => e.row), [6]);
});

test("edição em série mantém os números e desloca as datas igual", () => {
  const base = { description: "TV", category: "Compras", type: "Saída", amount: 100 };
  const series = [1, 2, 3].map((n) => ({
    ...base, row: n + 1, date: `2026-0${n}-05`, recurrence: `Parcela ${n}/3`, raw: ["", "", "", "", "", `Parcela ${n}/3`],
  }));
  const entry = { ...base, date: "2026-02-07", amount: 120 };
  const changes = buildEditChanges({ editing: series[1], series, entry, applyAll: true, kind: "Parcela", position: 2, times: 3 });
  assert.deepEqual(
    changes.map(({ original, next }) => `${original.row}:${next.date}:${next.amount}:${next.recurrence}`),
    ["2:2026-01-07:120:Parcela 1/3", "3:2026-02-07:120:Parcela 2/3", "4:2026-03-07:120:Parcela 3/3"],
  );
});

test("editar um só grava as marcas deduzidas dos vizinhos", () => {
  const base = { description: "Internet", category: "Contas", type: "Saída", amount: 99.9, raw: ["", "", "", "", "", ""] };
  const series = [1, 2, 3].map((n) => ({ ...base, row: n + 1, date: `2026-0${n}-20`, recurrence: `Mensal ${n}/3` }));
  const changes = buildEditChanges({
    editing: series[1], series, entry: { ...base, date: "2026-02-20", amount: 120 }, applyAll: false, kind: "Mensal", position: 2, times: 3,
  });
  assert.deepEqual(
    changes.map(({ original, next }) => `${original.row}:${next.amount}:${next.recurrence}`),
    ["3:120:Mensal", "2:99.9:Mensal 1/3", "4:99.9:Mensal 3/3"],
  );
});

test("mensal fixo é completado até o horizonte, com o valor do último mês, e para quando encerrado", () => {
  const base = { description: "Academia", category: "Saúde", type: "Saída", amount: 100 };
  const rows = [
    { ...base, date: "2026-01-31", recurrence: "Mensal" },
    { ...base, date: "2026-02-28", amount: 120, recurrence: "Mensal" },
    { ...base, description: "Antiga", date: "2026-01-10", recurrence: "Mensal encerrado" },
    { ...base, description: "Inferida", date: "2026-01-10", recurrence: "Mensal 1/2", raw: ["", "", "", "", "", ""] }, // só deduzida: não cresce
  ];
  assert.deepEqual(
    extendFixed(rows, "2026-05").map((e) => `${e.date}:${e.amount}:${e.recurrence}`),
    ["2026-03-31:120:Mensal", "2026-04-30:120:Mensal", "2026-05-31:120:Mensal"],
  );
  assert.deepEqual(extendFixed(rows, "2026-02"), []);
  // Mudar o valor não separa a série.
  assert.equal(findSeries(rows, rows[0]).length, 2);
});

test("mensal antigo gravado na planilha também continua para sempre", () => {
  const base = { description: "Aluguel", category: "Moradia", type: "Saída", amount: 1200 };
  const rows = [1, 2].map((n) => ({ ...base, date: `2026-0${n}-10`, recurrence: `Mensal ${n}/2`, raw: ["", "", "", "", "", `Mensal ${n}/2`] }));
  assert.deepEqual(extendFixed(rows, "2026-04").map((e) => `${e.date}:${e.recurrence}`), ["2026-03-10:Mensal", "2026-04-10:Mensal"]);
});

test("fixo recriado após encerrar usa o dia da série nova", () => {
  const base = { description: "Academia", category: "Saúde", type: "Saída", amount: 100 };
  const rows = [
    { ...base, date: "2026-01-31", recurrence: "Mensal encerrado" },
    { ...base, date: "2026-04-10", recurrence: "Mensal" },
  ];
  assert.deepEqual(extendFixed(rows, "2026-06").map((e) => e.date), ["2026-05-10", "2026-06-10"]);
});

test("mês de fixo renomeado sozinho sai da série como encerrado", () => {
  const base = { description: "Academia", category: "Saúde", type: "Saída", amount: 100, raw: ["", "", "", "", "", "Mensal"] };
  const series = [{ ...base, row: 2, date: "2026-01-05", recurrence: "Mensal" }, { ...base, row: 3, date: "2026-02-05", recurrence: "Mensal" }];
  const rename = buildEditChanges({ editing: series[1], series, entry: { ...base, description: "Personal" }, applyAll: false, kind: "Mensal" });
  assert.equal(rename[0].next.recurrence, "Mensal encerrado");
  const price = buildEditChanges({ editing: series[1], series, entry: { ...base, amount: 120 }, applyAll: false, kind: "Mensal" });
  assert.equal(price[0].next.recurrence, "Mensal");
});

test("editar a série fixa não reabre um mês encerrado", () => {
  const base = { description: "Netflix", category: "Assinaturas", type: "Saída", amount: 40 };
  const series = [
    { ...base, row: 2, date: "2026-01-05", recurrence: "Mensal encerrado" },
    { ...base, row: 3, date: "2026-02-05", recurrence: "Mensal" },
  ];
  const changes = buildEditChanges({ editing: series[1], series, entry: { ...base, date: "2026-02-05", amount: 45 }, applyAll: true, kind: "Mensal" });
  assert.deepEqual(changes.map(({ next }) => `${next.date}:${next.amount}:${next.recurrence}`), ["2026-01-05:45:Mensal encerrado", "2026-02-05:45:Mensal"]);
});

test("chat bloqueia a 9ª pergunta no mesmo minuto e libera depois", () => {
  const ip = "teste-limite";
  const start = 1_000_000;
  for (let i = 0; i < 8; i += 1) assert.equal(waitSeconds(ip, start + i), 0);
  assert.ok(waitSeconds(ip, start + 8) > 0);
  assert.equal(waitSeconds(ip, start + 61_000), 0);
});
