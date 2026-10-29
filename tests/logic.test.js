import assert from "node:assert/strict";
import { test } from "node:test";

import { addMonths, buildEditChanges, expandRecurrence, findSeries, inferMonthly } from "../src/services/financeDates.js";
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
  assert.deepEqual(expandRecurrence(entry, "monthly", 2).map((e) => e.recurrence), ["Mensal 1/2", "Mensal 2/2"]);
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
    ["3:120:Mensal 2/3", "2:99.9:Mensal 1/3", "4:99.9:Mensal 3/3"],
  );
});

test("chat bloqueia a 9ª pergunta no mesmo minuto e libera depois", () => {
  const ip = "teste-limite";
  const start = 1_000_000;
  for (let i = 0; i < 8; i += 1) assert.equal(waitSeconds(ip, start + i), 0);
  assert.ok(waitSeconds(ip, start + 8) > 0);
  assert.equal(waitSeconds(ip, start + 61_000), 0);
});
