import ESPN_CONFIG from "../Config/espnConfig";

// Chamadas à API pública da ESPN + normalização das respostas.
//
// A ESPN manda MUITA coisa (links, odds, estatísticas...). Aqui cada resposta
// vira um objeto pequeno, só com o que a tela usa, e com o mesmo formato no
// futebol: os componentes não precisam saber de onde veio.
//
//   fetchSoccerTeams()          → times da liga (para o <select>)
//   fetchSoccerTeam(id)         → { team, next, results } de um time
//   fetchSoccerStandings()      → { season, rows } (classificação)

const { SOCCER, CACHE_MS } = ESPN_CONFIG;

const ESPN_CDN = "https://a.espncdn.com/i";

/* =====================================================================
   fetch com cache (rodar de novo dentro de CACHE_MS não repete a chamada)
   ===================================================================== */

export class EspnError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const cache = new Map();

function cached(key, load) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.request;

  const request = load().catch((error) => {
    cache.delete(key); // deu erro: a próxima chamada tenta de novo
    throw error;
  });
  cache.set(key, { request, at: Date.now() });
  return request;
}

async function getJson(url) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new EspnError("network", "Sem conexão com a ESPN.");
  }
  if (!response.ok) {
    throw new EspnError("http", `A ESPN respondeu ${response.status}.`);
  }
  return response.json();
}

/* =====================================================================
   Normalização
   ===================================================================== */

// O placar vem como texto ("2"), número ou objeto ({ value: 2, displayValue: "2" })
function toNumber(value) {
  const raw = typeof value === "object" && value !== null ? value.value : value;
  if (raw === undefined || raw === null || raw === "") return null;
  const number = Number(raw);
  return Number.isFinite(number) ? number : null;
}

// Escudo: o da lista "logos" (sem a versão cortada do placar) ou montado pelo id/sigla
function teamLogo(team = {}, sport) {
  const logos = team.logos ?? [];
  const find = (rel) =>
    logos.find((logo) => logo.rel?.includes(rel) && !logo.rel?.includes("scoreboard"))?.href;
  if (find("default")) return find("default");
  if (sport === "soccer" && team.id) return `${ESPN_CDN}/teamlogos/soccer/500/${team.id}.png`;
  return team.logo ?? null;
}

export function normalizeTeam(team, sport) {
  if (!team) return null;
  return {
    id: String(team.id),
    name: team.displayName ?? team.name ?? "?",
    short: team.shortDisplayName ?? team.name ?? team.displayName ?? "?",
    abbr: team.abbreviation ?? "",
    logo: teamLogo(team, sport),
    color: team.color ? `#${team.color}` : null,
    // "12-8-9" (V-E-D)
    record: team.recordSummary ?? null,
    // "7th in Brazilian Serie A" / "1st in Pacific Division" (traduzido na tela)
    standing: team.standingSummary ?? null,
  };
}

// Campanha que vem junto do jogo: "records" no placar, "record" no calendário
function competitorRecord(competitor) {
  const pick = (list) => list?.find((r) => r.type === "total") ?? list?.[0];
  const value =
    pick(competitor.records)?.summary ?? pick(competitor.record)?.displayValue ?? null;
  return value === "0-0" || value === "0-0-0" ? null : value;
}

function normalizeCompetitor(competitor = {}, sport) {
  const team = normalizeTeam({ id: competitor.id, ...competitor.team }, sport);
  return {
    ...team,
    home: competitor.homeAway === "home",
    winner: competitor.winner === true,
    score: toNumber(competitor.score),
    aggregate: toNumber(competitor.score?.aggregateScore),
    shootout: toNumber(competitor.shootoutScore ?? competitor.score?.shootoutScore),
    record: competitorRecord(competitor),
  };
}

// Transmissão: "broadcasts[].names" no placar, "broadcasts[].media" no calendário
function broadcastNames(competition) {
  const names = (competition.broadcasts ?? []).flatMap(
    (b) => b.names ?? (b.media?.shortName ? [b.media.shortName] : [])
  );
  return [...new Set(names)];
}

// Fase do campeonato ("Semifinals", "Round of 16"...). Nos pontos corridos a
// ESPN manda o nome da temporada ("2026 Brasileiro Serie A"), que não é fase.
function phaseName(seasonType) {
  const name = seasonType?.name?.trim();
  if (!name || /\d{4}/.test(name) || /regular season|preseason/i.test(name)) return null;
  return name;
}

export function normalizeEvent(event, sport) {
  const competition = event.competitions?.[0] ?? {};
  const status = competition.status ?? event.status ?? {};
  const competitors = (competition.competitors ?? []).map((c) => normalizeCompetitor(c, sport));
  const home = competitors.find((c) => c.home) ?? competitors[0] ?? null;
  const away = competitors.find((c) => c !== home) ?? null;
  const league = event.league ?? {};
  const leagueLogoId = league.alternateId ?? league.id;
  const venue = competition.venue ?? {};
  const link = (event.links ?? []).find(
    (l) => l.rel?.includes("desktop") && (l.rel.includes("summary") || l.rel.includes("live"))
  )?.href;

  return {
    id: String(event.id),
    sport,
    date: Date.parse(competition.date ?? event.date),
    // Sem horário confirmado a ESPN manda uma hora qualquer: só vale o dia
    timeValid: event.timeValid !== false && competition.timeValid !== false,
    state: status.type?.state ?? "pre", // pre | in | post
    statusName: status.type?.name ?? "",
    statusDetail: status.type?.shortDetail ?? "",
    clock: status.displayClock ?? "",
    period: status.period ?? 0,
    league: {
      name: league.name ?? "",
      slug: league.slug ?? "",
      logo: leagueLogoId ? `${ESPN_CDN}/leaguelogos/soccer/500/${leagueLogoId}.png` : null,
    },
    phase: phaseName(event.seasonType),
    leg: competition.leg?.value ?? null, // 1 = ida, 2 = volta (mata-mata)
    note: competition.notes?.find((n) => n.type === "event" || n.headline)?.headline ?? null,
    venue: venue.fullName ?? null,
    city: venue.address?.city ?? null,
    tv: broadcastNames(competition),
    link: link ?? null,
    home,
    away,
  };
}

/* =====================================================================
   Ponto de vista de um time: "nós" x adversário e o resultado (V/E/D)
   ===================================================================== */

function fromTeamSide(game, teamId) {
  const us = [game.home, game.away].find((side) => side?.id === teamId) ?? null;
  const them = [game.home, game.away].find((side) => side && side.id !== teamId) ?? null;
  let result = null;
  if (game.state === "post" && us && them && us.score !== null && them.score !== null) {
    if (us.winner || us.score > them.score) result = "W";
    else if (them.winner || them.score > us.score) result = "L";
    else result = "D";
    // Empate no tempo normal decidido nos pênaltis: vale o "winner" da ESPN
    if (us.score === them.score && (us.winner || them.winner)) result = us.winner ? "W" : "L";
  }
  return { ...game, us, them, result };
}

// Jogo ao vivo primeiro; depois por horário
const sortGames = (games) =>
  [...games].sort((a, b) => (b.state === "in") - (a.state === "in") || a.date - b.date);

/* =====================================================================
   FUTEBOL
   ===================================================================== */

export function fetchSoccerTeams() {
  return cached("soccer:teams", async () => {
    const body = await getJson(`${SOCCER.SITE_API}/${SOCCER.LEAGUE}/teams`);
    const teams = body.sports?.[0]?.leagues?.[0]?.teams ?? [];
    return teams
      .map(({ team }) => normalizeTeam(team, "soccer"))
      .sort((a, b) => a.short.localeCompare(b.short, "pt-BR"));
  });
}

// Calendário (?fixture=true) e resultados vêm de dois endereços diferentes
export function fetchSoccerTeam(teamId) {
  return cached(`soccer:team:${teamId}`, async () => {
    const base = `${SOCCER.SITE_API}/all/teams/${teamId}/schedule`;
    const [fixtures, results] = await Promise.allSettled([
      getJson(`${base}?fixture=true`),
      getJson(base),
    ]);
    if (fixtures.status === "rejected" && results.status === "rejected") throw fixtures.reason;

    const bodies = [fixtures, results].filter((r) => r.status === "fulfilled").map((r) => r.value);
    const games = new Map();
    for (const body of bodies) {
      for (const event of body.events ?? []) {
        const game = normalizeEvent(event, "soccer");
        // Jogo em andamento pode estar nas duas listas: fica o mais novo
        games.set(game.id, fromTeamSide(game, String(teamId)));
      }
    }
    const all = [...games.values()];

    return {
      team: normalizeTeam(bodies[0]?.team, "soccer"),
      next: sortGames(all.filter((g) => g.state !== "post")),
      results: all.filter((g) => g.state === "post").sort((a, b) => b.date - a.date),
    };
  });
}

// "entries[].stats" é uma lista de { name, value, displayValue }
const stat = (entry, name) => entry.stats?.find((s) => s.name === name);

export function fetchSoccerStandings() {
  return cached("soccer:standings", async () => {
    const body = await getJson(`${SOCCER.STANDINGS_API}/${SOCCER.LEAGUE}/standings`);
    const group = body.children?.[0]?.standings ?? body.standings ?? {};
    const rows = (group.entries ?? [])
      .map((entry) => ({
        rank: stat(entry, "rank")?.value ?? null,
        team: normalizeTeam(entry.team, "soccer"),
        played: stat(entry, "gamesPlayed")?.value ?? 0,
        wins: stat(entry, "wins")?.value ?? 0,
        draws: stat(entry, "ties")?.value ?? 0,
        losses: stat(entry, "losses")?.value ?? 0,
        goalsFor: stat(entry, "pointsFor")?.value ?? 0,
        goalsAgainst: stat(entry, "pointsAgainst")?.value ?? 0,
        goalDiff: stat(entry, "pointDifferential")?.value ?? 0,
        points: stat(entry, "points")?.value ?? 0,
      }))
      .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
      .map((row, i) => ({ ...row, rank: row.rank ?? i + 1 }));

    return { season: group.seasonDisplayName ?? body.name ?? "", rows };
  });
}
