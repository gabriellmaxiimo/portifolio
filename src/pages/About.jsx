import React from 'react';
import { Calendar, Clock, MapPin, RefreshCw } from 'lucide-react';
import ESPN_CONFIG from '../../ESPN_API/src/Config/espnConfig';
import { fetchSoccerTeam } from '../../ESPN_API/src/Service/espnService';
import { useEspn } from '../../ESPN_API/src/components/ESPN/useEspn';

const CRUZEIRO_ESPN_ID = '2022';

const matchDate = new Intl.DateTimeFormat('pt-BR', {
  timeZone: ESPN_CONFIG.TIMEZONE,
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
});

const matchTime = new Intl.DateTimeFormat('pt-BR', {
  timeZone: ESPN_CONFIG.TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export default function About({ currentT, themeClasses, stack, onOpenCruzeiro }) {
  const matchRequest = useEspn(() => fetchSoccerTeam(CRUZEIRO_ESPN_ID), [CRUZEIRO_ESPN_ID]);
  const nextMatch = matchRequest.data?.next?.[0];

  return (
    <div className="animate-fade-in">
      {/* Bloco principal com a foto e a apresentação */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
        
        {/* Foto de Perfil */}
        <div className="shrink-0">
          <img 
            src="/minha-foto.jpg" 
            alt="Gabriel Máximo" 
            className="w-36 h-36 md:w-44 md:h-44 object-cover rounded-2xl shadow-2xl border border-current/20"
          />
        </div>

        {/* Título e Texto */}
        <div className="flex-1 text-center md:text-left">
          <h1 className={`text-4xl md:text-6xl font-light mb-4 tracking-tighter ${themeClasses.accent}`}>
            {currentT.aboutTitle}
          </h1>
          <p className="text-sm md:text-base leading-relaxed font-light opacity-90">
            {currentT.aboutText}
          </p>
        </div>

      </div>
      
      {/* Secção de Tecnologias / Focos (movida para cima do jogo) */}
      <div className="space-y-4 mb-10">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">
          {currentT.stackTitle}
        </h3>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {stack.map((tech) => (
            <span key={tech} className={`px-4 py-2 rounded-full text-xs tracking-wider cursor-default ${themeClasses.glass}`}>
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Bloco do Jogo (movido para baixo) */}
      <div className="max-w-md">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mb-3">
          {currentT.nextMatchTitle}
        </p>
        <button
          type="button"
          onClick={onOpenCruzeiro}
          className={`w-full text-left p-5 rounded-2xl flex flex-col gap-3 ${themeClasses.glass} ${themeClasses.hover} transition-all`}
          aria-label="Ver informações do Cruzeiro"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 border border-current/20 px-2 py-1 rounded">
              {nextMatch?.league?.name || 'Cruzeiro'}
            </span>
            <div className="flex items-center gap-2 text-xs opacity-70">
              <Calendar size={12} />
              {matchRequest.status === 'loading' && !matchRequest.data
                ? 'Carregando jogo...'
                : nextMatch
                  ? matchDate.format(nextMatch.date)
                  : matchRequest.status === 'error'
                    ? 'Dados indisponíveis'
                    : 'Sem jogo marcado'}
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="flex-1 text-right text-lg font-bold">{nextMatch?.home?.short || '—'}</div>
            <div className="text-xs font-bold opacity-50 border border-current/20 px-2 py-1 rounded">
              {nextMatch?.state === 'in'
                ? `${nextMatch.home?.score ?? 0} x ${nextMatch.away?.score ?? 0}`
                : 'VS'}
            </div>
            <div className="flex-1 text-left text-lg font-bold">{nextMatch?.away?.short || 'Cruzeiro'}</div>
          </div>

          <div className="flex justify-between items-center mt-2 pt-3 border-t border-current/10">
            <div className="flex items-center gap-2 text-xs opacity-70">
              <MapPin size={12} />
              {nextMatch ? [nextMatch.venue, nextMatch.city].filter(Boolean).join(', ') || 'Local a definir' : 'Acompanhe os jogos'}
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <Clock size={12} />
              {nextMatch?.state === 'in'
                ? 'Ao vivo'
                : nextMatch?.timeValid
                  ? matchTime.format(nextMatch.date)
                  : 'Horário a definir'}
            </div>
          </div>
        </button>
        {matchRequest.status === 'error' && (
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-red-300" role="alert">
            <span>{matchRequest.error.message}</span>
            <button
              type="button"
              onClick={matchRequest.reload}
              className="inline-flex shrink-0 items-center gap-1 hover:underline"
            >
              <RefreshCw size={12} /> Tentar novamente
            </button>
          </div>
        )}
      </div>

    </div>
  );
}