import { inferMonthly } from './financeDates';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// drive.file só dá acesso às planilhas criadas pelo próprio app, não ao Drive inteiro.
const SCOPES = 'openid email profile https://www.googleapis.com/auth/drive.file';
const SPREADSHEET_TITLE = 'Controle Financeiro - Portfólio';
const SHEET = 'Lançamentos';
export const ENTRY_COLUMNS = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Recorrência'];

export class GoogleError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'GoogleError';
    this.status = status;
  }
}

let gisPromise;
function loadGoogleIdentity() {
  gisPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = resolve;
    script.onerror = () => {
      gisPromise = null;
      reject(new GoogleError('Não foi possível carregar o login do Google.'));
    };
    document.head.appendChild(script);
  });
  return gisPromise;
}

async function googleFetch(accessToken, url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...init.headers },
  });
  if (response.status === 401) throw new GoogleError('Sessão do Google expirada. Entre novamente.', 401);
  if (response.status === 429) throw new GoogleError('Muitas requisições ao Google em pouco tempo. Espere 1 minuto e tente de novo.', 429);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new GoogleError(data.error?.message || `Google respondeu HTTP ${response.status}.`, response.status);
  return data;
}

export async function signInWithGoogle() {
  if (!CLIENT_ID) throw new GoogleError('Defina VITE_GOOGLE_CLIENT_ID no .env.local.');
  await loadGoogleIdentity();

  const token = await new Promise((resolve, reject) => {
    window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (result) => (result.error ? reject(new GoogleError(result.error_description || result.error)) : resolve(result)),
      error_callback: (error) => reject(new GoogleError(error.message || 'Login com Google cancelado.')),
    }).requestAccessToken();
  });

  const user = await googleFetch(token.access_token, 'https://www.googleapis.com/oauth2/v3/userinfo');
  return {
    accessToken: token.access_token,
    expiresAt: Date.now() + Number(token.expires_in) * 1000,
    name: user.name,
    email: user.email,
    picture: user.picture,
  };
}

export function signOutGoogle(session) {
  window.google?.accounts.oauth2.revoke(session.accessToken);
}

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const toRow = ({ date, description, category, type, amount, recurrence = '' }) => [date, description, category, type, amount, recurrence];
const rowRange = (row) => encodeURIComponent(`${SHEET}!A${row}:F${row}`);

export async function getSpreadsheet(accessToken) {
  const q = `name='${SPREADSHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
  const found = await googleFetch(accessToken, `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`);
  if (found.files?.length) {
    const spreadsheetId = found.files[0].id;
    const meta = await googleFetch(accessToken, `${SHEETS_API}/${spreadsheetId}?fields=sheets.properties(sheetId,title)`);
    const sheet = meta.sheets?.find((item) => item.properties.title === SHEET);
    if (!sheet) throw new GoogleError(`A planilha "${SPREADSHEET_TITLE}" não tem a guia "${SHEET}".`);
    // Planilhas criadas antes da coluna "Recorrência" só tinham A:E no cabeçalho.
    await googleFetch(accessToken, `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(`${SHEET}!F1`)}?valueInputOption=RAW`, {
      method: 'PUT',
      body: JSON.stringify({ values: [[ENTRY_COLUMNS[5]]] }),
    });
    return { spreadsheetId, sheetId: sheet.properties.sheetId };
  }

  const created = await googleFetch(accessToken, SHEETS_API, {
    method: 'POST',
    body: JSON.stringify({ properties: { title: SPREADSHEET_TITLE }, sheets: [{ properties: { title: SHEET } }] }),
  });
  await appendRows(accessToken, created.spreadsheetId, [ENTRY_COLUMNS]);
  return { spreadsheetId: created.spreadsheetId, sheetId: created.sheets[0].properties.sheetId };
}

function appendRows(accessToken, spreadsheetId, rows) {
  const range = encodeURIComponent(`${SHEET}!A:F`);
  // RAW evita que um texto começando com "=" vire fórmula na planilha.
  return googleFetch(accessToken, `${SHEETS_API}/${spreadsheetId}/values/${range}:append?valueInputOption=RAW`, {
    method: 'POST',
    body: JSON.stringify({ values: rows }),
  });
}

export async function listEntries(accessToken, spreadsheetId) {
  return inferMonthly(await readEntries(accessToken, spreadsheetId));
}

async function readEntries(accessToken, spreadsheetId) {
  const range = encodeURIComponent(`${SHEET}!A2:F`);
  const data = await googleFetch(accessToken, `${SHEETS_API}/${spreadsheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`);
  return (data.values || []).map((values, index) => {
    // Números digitados à mão na planilha chegam como number; o resto do app espera texto.
    const raw = Array.from({ length: ENTRY_COLUMNS.length }, (_, i) => String(values[i] ?? ''));
    const [rawDate, description, category, type, amount, recurrence] = raw;
    // Data digitada direto na planilha vem como número de dias desde 30/12/1899 (o site grava "2026-10-29").
    const date = /^\d+(\.\d+)?$/.test(rawDate) ? new Date(Date.UTC(1899, 11, 30) + Math.floor(rawDate) * 864e5).toISOString().slice(0, 10) : rawDate;
    // Parcelas antigas guardavam "(2/12)" no fim da descrição, sem a coluna Recorrência.
    const legacy = !recurrence && /\s*\((\d+\/\d+)\)$/.exec(description);
    return {
      row: index + 2,
      raw,
      date,
      description: legacy ? description.slice(0, legacy.index) : description,
      category,
      type,
      amount: Number(amount) || 0,
      recurrence: legacy ? `Parcela ${legacy[1]}` : recurrence,
    };
  });
}

// Devolve os lançamentos criados já com o número da linha, para não precisar reler a planilha.
// null se o Google não informar onde gravou.
export async function addEntries(accessToken, spreadsheetId, entries) {
  const result = await appendRows(accessToken, spreadsheetId, entries.map(toRow));
  // "Lançamentos!A15:F17" → a primeira linha criada é a 15.
  const first = Number(/!A(\d+):/.exec(result.updates?.updatedRange ?? '')?.[1]);
  if (!first) return null;
  return entries.map((entry, index) => ({ ...entry, recurrence: entry.recurrence ?? '', row: first + index, raw: toRow(entry).map(String) }));
}

// Edição/exclusão usam o número da linha; se a planilha foi alterada por fora, a linha pode ser outra.
function assertSameRow(entry, current = []) {
  if (entry.raw.some((value, index) => value !== String(current[index] ?? ''))) {
    throw new GoogleError('A planilha foi alterada fora do site. Os dados foram recarregados, tente de novo.', 409);
  }
}

// Lê as linhas numa chamada só e confere se ainda são as que a tela mostra.
async function assertRowsUnchanged(accessToken, spreadsheetId, entries) {
  const ranges = entries.map((entry) => `ranges=${rowRange(entry.row)}`).join('&');
  const data = await googleFetch(accessToken, `${SHEETS_API}/${spreadsheetId}/values:batchGet?${ranges}&valueRenderOption=UNFORMATTED_VALUE`);
  entries.forEach((entry, i) => assertSameRow(entry, data.valueRanges?.[i]?.values?.[0]));
}

// changes: [{ original, next }]. Confere todas as linhas numa leitura e grava todas numa escrita.
export async function updateEntries(accessToken, spreadsheetId, changes) {
  await assertRowsUnchanged(accessToken, spreadsheetId, changes.map(({ original }) => original));
  return googleFetch(accessToken, `${SHEETS_API}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data: changes.map(({ original, next }) => ({ range: `${SHEET}!A${original.row}:F${original.row}`, values: [toRow(next)] })),
    }),
  });
}

export async function deleteEntries(accessToken, { spreadsheetId, sheetId }, entries) {
  await assertRowsUnchanged(accessToken, spreadsheetId, entries);
  // De baixo para cima: apagar uma linha não muda o número das que ainda vão ser apagadas.
  const rows = entries.map((entry) => entry.row).sort((a, b) => b - a);
  return googleFetch(accessToken, `${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: rows.map((row) => ({ deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex: row - 1, endIndex: row } } })),
    }),
  });
}
