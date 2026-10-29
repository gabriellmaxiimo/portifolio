import ESPN_CONFIG from "../../Config/espnConfig";
import { formatSigned } from "./format";
import { TeamLogo } from "./Shared";

/* =====================================================================
   Futebol: tabela do campeonato com as faixas (Libertadores, Z4...)
   ===================================================================== */

const zoneOf = (rank) =>
  ESPN_CONFIG.SOCCER.ZONES.find((zone) => rank >= zone.from && rank <= zone.to) ?? null;

export function SoccerStandings({ rows, highlight, onSelect }) {
  if (!rows.length) return <p className="espn-empty">Classificação indisponível.</p>;

  return (
    <>
      <div className="espn-table-wrap">
        <table className="espn-table">
          <thead>
            <tr>
              <th scope="col" className="num">#</th>
              <th scope="col" className="team">Time</th>
              <th scope="col" title="Pontos">P</th>
              <th scope="col" title="Jogos">J</th>
              <th scope="col" title="Vitórias">V</th>
              <th scope="col" title="Empates">E</th>
              <th scope="col" title="Derrotas">D</th>
              <th scope="col" title="Gols pró" className="hide-sm">GP</th>
              <th scope="col" title="Gols contra" className="hide-sm">GC</th>
              <th scope="col" title="Saldo de gols">SG</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const zone = zoneOf(row.rank);
              const mine = row.team.id === highlight;
              return (
                <tr
                  key={row.team.id}
                  className={`${zone ? `zone-${zone.key}` : ""} ${mine ? "is-mine" : ""}`}
                  aria-current={mine ? "true" : undefined}
                >
                  <td className="num">
                    <span className="espn-rank">{row.rank}</span>
                  </td>
                  <td className="team">
                    <button
                      type="button"
                      className="espn-team-btn"
                      onClick={() => onSelect?.(row.team.id)}
                      title={`Ver jogos do ${row.team.name}`}
                    >
                      <TeamLogo team={row.team} size={22} />
                      <span>{row.team.short}</span>
                    </button>
                  </td>
                  <td>
                    <strong>{row.points}</strong>
                  </td>
                  <td>{row.played}</td>
                  <td>{row.wins}</td>
                  <td>{row.draws}</td>
                  <td>{row.losses}</td>
                  <td className="hide-sm">{row.goalsFor}</td>
                  <td className="hide-sm">{row.goalsAgainst}</td>
                  <td>{formatSigned(row.goalDiff)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="espn-legend">
        {ESPN_CONFIG.SOCCER.ZONES.map((zone) => (
          <li key={zone.key} className={`zone-${zone.key}`}>
            <span aria-hidden="true" />
            {zone.label} ({zone.from}º{zone.to !== zone.from ? `–${zone.to}º` : ""})
          </li>
        ))}
      </ul>
    </>
  );
}
