import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, RefreshCw } from 'lucide-react';
import { FaDatabase, FaJava, FaNetworkWired, FaTools, FaWindows } from 'react-icons/fa';
import { SiDocker, SiGit, SiPostman, SiReact, SiSpring } from 'react-icons/si';
import { FiMusic } from 'react-icons/fi';
import ESPN_CONFIG from '../../ESPN_API/src/Config/espnConfig';
import { fetchSoccerTeam } from '../../ESPN_API/src/Service/espnService';
import { useEspn } from '../../ESPN_API/src/components/ESPN/useEspn';
import { fetchNowPlaying } from '../../SpotifyAPI/src/services/spotifyService';
import { artistNames, formatAgo } from '../../SpotifyAPI/src/components/format';
import { fetchMediaRatings, formatMediaStorageError } from '../services/mediaService';
import GitHubProfile from '../components/GitHubProfile';

const CRUZEIRO_ESPN_ID = '2022';

const techIcons = {
  'Java (Core e POO)': FaJava,
  'Spring Boot': SiSpring,
  React: SiReact,
  Docker: SiDocker,
  Postman: SiPostman,
  SQL: FaDatabase,
  'Redes (TCP/IP, DNS, DHCP)': FaNetworkWired,
  'Sistemas Operacionais (Windows/Terminal)': FaWindows,
  'Hardware & Manutenção': FaTools,
  Git: SiGit,
};

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

export default function About({ currentT, themeClasses, stack, onOpenCruzeiro, onOpenSpotify, onOpenMedia }) {
  const matchRequest = useEspn(() => fetchSoccerTeam(CRUZEIRO_ESPN_ID), [CRUZEIRO_ESPN_ID]);
  const nextMatch = matchRequest.data?.next?.[0];
  const [musicRequest, setMusicRequest] = useState({ status: 'loading', data: null, error: null });
  const [topMedia, setTopMedia] = useState([]);
  const [mediaError, setMediaError] = useState('');

  const loadMusic = useCallback(async () => {
    setMusicRequest((previous) => ({ ...previous, status: 'loading', error: null }));
    try {
      const data = await fetchNowPlaying();
      setMusicRequest({ status: 'ready', data, error: null });
    } catch (error) {
      setMusicRequest({ status: 'error', data: null, error });
    }
  }, []);

  useEffect(() => {
    loadMusic();
  }, [loadMusic]);

  useEffect(() => {
    let active = true;
    fetchMediaRatings(['tmdb_movie', 'tmdb_tv', 'anilist'])
      .then((ratings) => {
        if (active) setTopMedia(ratings.filter((item) => item.score !== null));
      })
      .catch((error) => {
        if (active) setMediaError(formatMediaStorageError(error));
      });
    return () => {
      active = false;
    };
  }, []);

  const topPicks = ['tmdb_movie', 'tmdb_tv', 'anilist'].map((provider) => ({
    provider,
    type: provider === 'tmdb_movie' ? 'movie' : provider === 'tmdb_tv' ? 'tv' : 'anime',
    label: provider === 'tmdb_movie' ? 'Top 1 Filme' : provider === 'tmdb_tv' ? 'Top 1 Série' : 'Top 1 Anime',
    item: topMedia
      .filter((rating) => rating.provider === provider)
      .sort((a, b) => b.score - a.score || new Date(b.updated_at) - new Date(a.updated_at))[0],
  }));

  const lastTrack = musicRequest.data?.track;

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
          {stack.map((tech) => {
            const Icon = techIcons[tech];
            return (
              <span
                key={tech}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs tracking-wider cursor-default ${themeClasses.glass}`}
              >
                {Icon && <Icon size={16} aria-hidden="true" />}
                {tech}
              </span>
            );
          })}
        </div>
      </div>

      <GitHubProfile title={currentT.githubProfileTitle} />

      <section className="mb-10" aria-labelledby="top-media-heading">
        <h2 id="top-media-heading" className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mb-3">
          Meus favoritos
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3">
          {topPicks.map(({ provider, type, label, item }) => (
            <button
              key={provider}
              type="button"
              disabled={!item}
              onClick={() => item && onOpenMedia(type)}
              className={`min-w-0 rounded-2xl p-3 text-left flex items-center gap-3 ${themeClasses.glass} ${item ? themeClasses.hover : 'opacity-70 cursor-default'}`}
              aria-label={item ? `${label}: ${item.title}, nota ${item.score}. Abrir catálogo.` : `${label}: ainda sem avaliação`}
            >
              {item?.poster_url ? (
                <img src={item.poster_url} alt="" loading="lazy" className="w-14 h-20 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="w-14 h-20 shrink-0 rounded-lg flex items-center justify-center bg-current/10 text-xs font-bold">#1</span>
              )}
              <span className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider opacity-60">{label}</span>
                <span className="block mt-1 text-sm font-semibold truncate">{item?.title ?? 'Ainda sem avaliação'}</span>
                {item && <span className="block mt-1 text-xs opacity-70">Nota {item.score}/100</span>}
              </span>
            </button>
          ))}
        </div>
        {mediaError && <p className="mt-2 text-xs opacity-60" role="status">{mediaError}</p>}
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-start gap-4">
        <div className="flex flex-col order-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mb-3">
            {currentT.lastTrackTitle}
          </p>
          <button
            type="button"
            onClick={onOpenSpotify}
            className={`w-full min-h-28 text-left p-3 rounded-2xl flex items-center gap-3 ${themeClasses.glass} ${themeClasses.hover} transition-all`}
            aria-label={`${currentT.lastTrackTitle}. ${lastTrack ? `${lastTrack.name}, ${artistNames(lastTrack)}` : currentT.openSpotifyLabel}`}
          >
            {lastTrack?.album?.image ? (
              <img
                src={lastTrack.album.image}
                alt=""
                className="w-12 h-12 shrink-0 rounded-xl object-cover shadow-lg"
              />
            ) : (
              <span className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center bg-current/10">
                <FiMusic size={24} aria-hidden="true" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              {lastTrack ? (
                <>
                  <span className="block text-sm font-bold truncate">{lastTrack.name}</span>
                  <span className="block text-xs opacity-70 truncate">{artistNames(lastTrack)}</span>
                  <span className="block text-[10px] opacity-50 truncate">{lastTrack.album?.name}</span>
                  <span className="block text-[10px] uppercase tracking-wider opacity-50 mt-1">
                    {musicRequest.data.playing
                      ? currentT.trackPlaying
                      : formatAgo(musicRequest.data.playedAt)
                        ? `${currentT.trackPlayed} ${formatAgo(musicRequest.data.playedAt)}`
                        : currentT.lastTrackTitle}
                  </span>
                </>
              ) : (
                <span className="block text-sm opacity-70">
                  {musicRequest.status === 'loading'
                    ? currentT.trackLoading
                    : musicRequest.status === 'error'
                      ? musicRequest.error.message
                      : currentT.noRecentTrack}
                </span>
              )}
            </span>
            <FiMusic className="shrink-0 opacity-60" size={18} aria-hidden="true" />
          </button>
          {musicRequest.status === 'error' && (
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-red-300" role="alert">
              <span>{currentT.trackUnavailable}</span>
              <button
                type="button"
                onClick={loadMusic}
                className="inline-flex shrink-0 items-center gap-1 hover:underline"
              >
                <RefreshCw size={12} /> {currentT.retry}
              </button>
            </div>
          )}
        </div>

        {/* Bloco do Jogo */}
        <div className="flex flex-col order-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mb-3">
            {currentT.nextMatchTitle}
          </p>
          <button
            type="button"
            onClick={onOpenCruzeiro}
            className={`w-full h-28 overflow-hidden text-left p-2.5 rounded-2xl flex flex-col gap-1 ${themeClasses.glass} ${themeClasses.hover} transition-all`}
            aria-label="Ver informações do Cruzeiro"
          >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 border border-current/20 px-2 py-1 rounded">
              {nextMatch?.league?.name || 'Cruzeiro'}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] opacity-70">
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
          
          <div className="flex items-center justify-center gap-3">
            <div className="flex-1 text-right text-base font-bold">{nextMatch?.home?.short || '—'}</div>
            <div className="text-[10px] font-bold opacity-50 border border-current/20 px-2 py-1 rounded">
              {nextMatch?.state === 'in'
                ? `${nextMatch.home?.score ?? 0} x ${nextMatch.away?.score ?? 0}`
                : 'VS'}
            </div>
            <div className="flex-1 text-left text-base font-bold">{nextMatch?.away?.short || 'Cruzeiro'}</div>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-current/10">
            <div className="flex min-w-0 items-center gap-1.5 text-[10px] opacity-70">
              <MapPin size={12} />
              <span className="truncate">{nextMatch ? [nextMatch.venue, nextMatch.city].filter(Boolean).join(', ') || 'Local a definir' : 'Acompanhe os jogos'}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold">
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
    </div>
  );
}