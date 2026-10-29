// A ESPN manda nomes de campeonatos, fases e situações em inglês.
// Aqui eles viram português. O que não estiver na lista aparece como veio.

const LEAGUES = {
  "Brazilian Serie A": "Brasileirão Série A",
  "Brazilian Serie B": "Brasileirão Série B",
  "Copa do Brasil": "Copa do Brasil",
  "CONMEBOL Libertadores": "Libertadores",
  "CONMEBOL Sudamericana": "Copa Sul-Americana",
  "CONMEBOL Recopa": "Recopa Sul-Americana",
  "Brazilian Campeonato Mineiro": "Campeonato Mineiro",
  "Brazilian Campeonato Paulista": "Campeonato Paulista",
  "Brazilian Campeonato Carioca": "Campeonato Carioca",
  "Brazilian Campeonato Gaucho": "Campeonato Gaúcho",
  "FIFA Club World Cup": "Mundial de Clubes",
  "Club Friendly": "Amistoso",
};

export const leagueName = (name) => LEAGUES[name?.trim()] ?? name ?? "";

const PHASES = [
  [/^final$/i, "Final"],
  [/semi-?finals?/i, "Semifinal"],
  [/quarter-?finals?/i, "Quartas de final"],
  [/round of 16/i, "Oitavas de final"],
  [/round of 32/i, "16 avos de final"],
  [/knockout round playoffs?/i, "Playoffs"],
  [/group stage|league stage/i, "Fase de grupos"],
  [/(\d)(st|nd|rd|th) round/i, (m) => `${m[1]}ª fase`],
  [/preliminary/i, "Fase preliminar"],
];

export function phaseName(phase) {
  if (!phase) return null;
  for (const [regex, label] of PHASES) {
    const match = regex.exec(phase);
    if (match) return typeof label === "function" ? label(match) : label;
  }
  return phase;
}

// "1st Leg" / "2nd Leg"
export const legName = (leg) => ({ 1: "Jogo de ida", 2: "Jogo de volta" })[leg] ?? null;

// "2nd Leg - Atlético-MG win 3-2 on aggregate"
// "2nd Leg - Tied on aggregate - CAM win 3-1 on penalties"
export function noteText(note) {
  if (!note) return null;
  const parts = note.split(/\s+-\s+/).filter((part) => !/^\d(st|nd) leg$/i.test(part));
  if (!parts.length) return null;
  return parts
    .map((part) =>
      part
        .replace(/^(.+) win (\d+)-(\d+) on aggregate$/i, "$1 avançou no agregado ($2 x $3)")
        .replace(/^tied on aggregate$/i, "Empate no agregado")
        .replace(/^(.+) win (\d+)-(\d+) on penalties$/i, "$1 venceu nos pênaltis ($2 x $3)")
        .replace(/^(east|west) /i, (m) => (/east/i.test(m) ? "Leste · " : "Oeste · "))
        .replace(/1st round/i, "1ª rodada dos playoffs")
        .replace(/conf(erence)? semifinals?/i, "semifinal de conferência")
        .replace(/conf(erence)? finals?/i, "final de conferência")
        .replace(/game (\d+)/i, "jogo $1")
    )
    .join(" · ");
}

// "7th in Brazilian Serie A" → "7º no Brasileirão Série A"
export function standingText(summary) {
  const match = /^(\d+)\w*\s+in\s+(.+)$/i.exec(summary ?? "");
  if (!match) return summary ?? null;
  const [, position, group] = match;
  return `${position}º no ${leagueName(group)}`;
}

// Situação de um jogo ao vivo ou que não vai acontecer
export function liveStatus(game) {
  const name = game.statusName;
  if (/HALFTIME/.test(name)) return "Intervalo";
  if (/POSTPONED/.test(name)) return "Adiado";
  if (/CANCELED|CANCELLED/.test(name)) return "Cancelado";
  if (/SUSPENDED|DELAYED/.test(name)) return "Interrompido";
  if (game.state !== "in") return null;
  return game.clock || "Em andamento";
}

// Resultado do ponto de vista do time
export const resultLabel = (result) => ({ W: "V", D: "E", L: "D" })[result] ?? "–";
export const resultTitle = (result) =>
  ({ W: "Vitória", D: "Empate", L: "Derrota" })[result] ?? "Sem resultado";
