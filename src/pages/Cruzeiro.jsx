import CruzeiroLogo from '../components/CruzeiroLogo';
import Futebol from '../../ESPN_API/src/components/ESPN/Futebol';
import '../../ESPN_API/src/components/ESPN/ESPN.css';
import './Cruzeiro.css';

const CRUZEIRO_ESPN_ID = '2022';

export default function Cruzeiro({ theme, themeClasses }) {
  return (
    <section className="animate-fade-in w-full">
      <header className="flex items-center gap-4 mb-8">
        <CruzeiroLogo className="w-14 h-14 md:w-16 md:h-16" />
        <div>
          <h2 className={`text-3xl font-light tracking-tight ${themeClasses.accent}`}>Cruzeiro</h2>
          <p className="text-xs md:text-sm opacity-70">Jogos, resultados e classificação do Brasileirão</p>
        </div>
      </header>

      <div className="cruzeiro-espn" data-theme={theme}>
        <div className="espn">
          <Futebol initialTeam={CRUZEIRO_ESPN_ID} showStandings showTeamSelect={false} />
        </div>
      </div>
    </section>
  );
}
