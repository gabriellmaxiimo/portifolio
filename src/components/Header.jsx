import React, { useEffect, useState } from 'react';
import {
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Search,
  Settings,
  Sun,
  User,
  Gamepad2,
  ChevronRight,
  X,
} from 'lucide-react';
import CruzeiroLogo from './CruzeiroLogo';
import { usePortfolio } from '../context/PortfolioContext';

function weatherPresentation(code) {
  if (code === 0) return { Icon: Sun, label: 'Céu limpo' };
  if (code === 1 || code === 2) return { Icon: CloudSun, label: 'Parcialmente nublado' };
  if (code === 3) return { Icon: Cloud, label: 'Nublado' };
  if ([45, 48].includes(code)) return { Icon: Cloud, label: 'Neblina' };
  if ([51, 53, 55, 56, 57].includes(code)) return { Icon: CloudRain, label: 'Garoa' };
  if ([61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86].includes(code)) {
    return { Icon: CloudRain, label: 'Precipitação' };
  }
  if ([95, 96, 99].includes(code)) return { Icon: CloudLightning, label: 'Tempestade' };
  return { Icon: Cloud, label: 'Condição do tempo' };
}

function SearchResultsPanel({ currentT, searchResults, themeClasses, onSelect }) {
  return (
    <div className={`absolute top-full right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] max-h-96 overflow-y-auto rounded-2xl ${themeClasses.solidBg} border shadow-2xl z-50 p-3 flex flex-col gap-3 animate-fade-in custom-scrollbar`}>
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-2">{currentT.searchResultsTitle}</span>

      {searchResults.about && (
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onSelect(0)} className="w-full text-left p-2.5 rounded-xl hover:bg-current/10 transition-colors">
          <span className="block text-xs font-bold">{currentT.aboutTitle}</span>
          <span className="block text-[11px] opacity-70 truncate">{currentT.aboutText}</span>
        </button>
      )}

      {searchResults.stack.length > 0 && (
        <div className="p-2.5 rounded-xl bg-current/5">
          <p className="text-[10px] uppercase font-bold opacity-50 mb-1">{currentT.stackTitle}</p>
          <div className="flex flex-wrap gap-1">
            {searchResults.stack.map((item) => (
              <button key={item} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onSelect(0)} className="text-[11px] px-2 py-0.5 rounded bg-current/10 hover:bg-current/20">
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {searchResults.projects.map((project, index) => (
        <button key={index} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onSelect(1)} className="w-full text-left p-2.5 rounded-xl hover:bg-current/10 transition-colors">
          <span className="block text-xs font-bold">{project.name}</span>
          <span className="block text-[11px] opacity-70 truncate">{project.desc}</span>
        </button>
      ))}

      {searchResults.exp.map((experience, index) => (
        <button key={index} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onSelect(2)} className="w-full text-left p-2.5 rounded-xl hover:bg-current/10 transition-colors">
          <span className="block text-xs font-bold">{experience.role} {experience.company}</span>
          <span className="block text-[11px] opacity-70 truncate">{experience.desc}</span>
        </button>
      ))}
    </div>
  );
}

export default function Header() {
  const {
    theme,
    themeClasses,
    currentT,
    time,
    searchQuery,
    setSearchQuery,
    searchResults,
    hasSearchResults,
    setActiveTabIndex,
    language,
    setLanguage,
    setTheme,
  } = usePortfolio();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState('');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const loadWeather = async () => {
      try {
        const params = new URLSearchParams({
          latitude: '-19.9167',
          longitude: '-43.9345',
          current: 'temperature_2m,weather_code',
          temperature_unit: 'celsius',
          timezone: 'America/Sao_Paulo',
        });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Serviço meteorológico respondeu HTTP ${response.status}.`);
        const data = await response.json();
        if (!Number.isFinite(data.current?.temperature_2m) || !Number.isInteger(data.current?.weather_code)) {
          throw new Error('O serviço meteorológico retornou dados inválidos.');
        }
        if (active) {
          setWeather({ temperature: Math.round(data.current.temperature_2m), code: data.current.weather_code });
          setWeatherError('');
        }
      } catch (error) {
        if (active && error.name !== 'AbortError') setWeatherError(error.message);
      }
    };

    loadWeather();
    const interval = setInterval(loadWeather, 10 * 60 * 1000);
    return () => {
      active = false;
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const selectSearchResult = (tabIndex) => {
    setActiveTabIndex(tabIndex);
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
  };

  return (
    <header className="flex-none px-4 sm:px-6 lg:px-12 py-4 sm:py-6 flex justify-between items-center gap-3 z-40 relative">
      <button
        type="button"
        onClick={() => setActiveTabIndex(0)}
        aria-label="Voltar para Sobre Mim"
        className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4 text-left"
      >
        {theme === 'Cruzeiro' ? (
          <CruzeiroLogo className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 drop-shadow-lg" />
        ) : (
          <Gamepad2 className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 ${themeClasses.accent}`} />
        )}
        <span className="truncate text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.12em] sm:tracking-[0.2em] uppercase">GABRIEL MÁXIMO</span>
      </button>

      <div className="hidden sm:block relative shrink">
        <div className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full ${themeClasses.glass} focus-within:ring-1 ring-current/50 transition-all`}>
            <Search className="w-4 h-4 opacity-60" />
            <input
              type="text"
              placeholder={currentT.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="min-w-0 bg-transparent border-none outline-none text-xs w-24 md:w-40 focus:w-52 transition-all placeholder:opacity-50"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Limpar busca"
                className="flex h-5 w-5 items-center justify-center rounded-full opacity-50 hover:opacity-100"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {isSearchFocused && hasSearchResults && (
            <SearchResultsPanel currentT={currentT} searchResults={searchResults} themeClasses={themeClasses} onSelect={selectSearchResult} />
          )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-2 text-sm relative">
        <div className="relative sm:hidden">
          <button
            type="button"
            aria-label={currentT.searchPlaceholder}
            aria-expanded={isMobileSearchOpen}
            className="p-2 rounded-full opacity-70 hover:opacity-100 hover:bg-current/10 transition-colors"
            onClick={() => {
              setIsMobileSearchOpen((open) => !open);
              setIsSearchFocused(true);
            }}
          >
            {isMobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>
          {isMobileSearchOpen && (
            <div className="absolute top-full right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] z-50">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${themeClasses.glass} focus-within:ring-1 ring-current/50 transition-all`}>
                <Search className="w-4 h-4 shrink-0 opacity-60" />
                <input
                  autoFocus
                  type="text"
                  placeholder={currentT.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="min-w-0 flex-1 bg-transparent border-none outline-none text-xs placeholder:opacity-50"
                />
                {searchQuery && (
                  <button type="button" aria-label={currentT.searchPlaceholder} onClick={() => setSearchQuery('')} className="p-1 opacity-60 hover:opacity-100">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {isSearchFocused && hasSearchResults && (
                <SearchResultsPanel currentT={currentT} searchResults={searchResults} themeClasses={themeClasses} onSelect={selectSearchResult} />
              )}
            </div>
          )}
        </div>

        <button type="button" aria-label={currentT.quickLinks} title={currentT.quickLinks} className="p-2 rounded-full opacity-70 hover:opacity-100 hover:bg-current/10 transition-colors" onClick={() => { setIsProfileOpen(!isProfileOpen); setIsSettingsOpen(false); }}>
          <User className="w-5 h-5" />
        </button>
        <button type="button" aria-label={currentT.settings} title={currentT.settings} className="p-2 rounded-full opacity-70 hover:opacity-100 hover:bg-current/10 transition-colors" onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsProfileOpen(false); }}>
          <Settings className="w-5 h-5" />
        </button>

          <div className="hidden md:flex items-center gap-3 ml-1 border-l border-current/20 pl-3">
            <span className="font-mono text-xs tracking-widest opacity-90">{time}</span>
            {weather ? (() => {
              const { Icon, label } = weatherPresentation(weather.code);
              return (
                <span
                  className="inline-flex items-center gap-1.5 text-xs opacity-80"
                  title={weatherError
                    ? `Belo Horizonte: ${label}, ${weather.temperature}°C. Não foi possível atualizar: ${weatherError}`
                    : `Belo Horizonte: ${label}, ${weather.temperature}°C`}
                  aria-label={`Clima em Belo Horizonte: ${label}, ${weather.temperature} graus Celsius`}
                >
                  <Icon size={15} aria-hidden="true" />
                  <span>BH {weather.temperature}°C</span>
                </span>
              );
            })() : (
              <span
                className="inline-flex items-center gap-1.5 text-xs opacity-60"
                title={weatherError || 'Carregando clima de Belo Horizonte'}
                aria-label={weatherError ? `Clima de Belo Horizonte indisponível: ${weatherError}` : 'Carregando clima de Belo Horizonte'}
              >
                <Cloud size={15} aria-hidden="true" />
                <span>BH --°C</span>
              </span>
            )}
          </div>

          {isSettingsOpen && (
            <div className={`absolute top-10 right-0 mt-2 p-5 rounded-2xl ${themeClasses.solidBg} border shadow-2xl min-w-[220px] z-50 flex flex-col gap-4 animate-fade-in`}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2">{currentT.lang}</p>
                <div className="flex gap-2">
                  {['PT', 'EN'].map(l => (
                    <button key={l} onClick={() => setLanguage(l)} className={`flex-1 py-1.5 rounded text-xs font-medium border transition-all ${language === l ? 'border-current/50 bg-current/10' : 'border-transparent opacity-50 hover:opacity-100 hover:bg-current/5'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2">{currentT.theme}</p>
                <div className="flex flex-col gap-1">
                  {['Cyberpunk', 'Escuro', 'Claro', 'Cruzeiro', 'Original'].map((tName, i) => (
                    <button key={tName} onClick={() => { setTheme(tName); setIsSettingsOpen(false); }} className={`text-left text-xs px-3 py-2 rounded transition-all ${theme === tName ? 'bg-current/10 font-bold' : 'opacity-60 hover:opacity-100 hover:bg-current/5'}`}>
                      {currentT.themes[i]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isProfileOpen && (
            <div className={`absolute top-10 right-8 mt-2 p-6 rounded-2xl ${themeClasses.solidBg} border shadow-2xl min-w-[260px] z-50 flex flex-col items-center gap-4 animate-fade-in`}>
              <div className="w-16 h-16 rounded-full overflow-hidden border border-current/20 flex items-center justify-center mb-2 shadow-md">
                <img 
                  src="/minha-foto.jpg" 
                  alt="Gabriel M. Castro" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-sm tracking-wide">Gabriel M. Castro</h3>
                <p className="text-[10px] uppercase tracking-widest opacity-60 mt-1">{currentT.profileRole}</p>
              </div>
              <div className="w-full border-t border-current/10 my-2"></div>
              <div className="w-full flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">{currentT.quickLinks}</p>
                <button onClick={() => { setActiveTabIndex(0); setIsProfileOpen(false); }} className="flex items-center justify-between px-3 py-2 text-xs rounded hover:bg-current/5 transition-colors">
                  <span>{currentT.aboutMeBtn}</span>
                  <ChevronRight size={14} className="opacity-50" />
                </button>
                <button onClick={() => { setActiveTabIndex(3); setIsProfileOpen(false); }} className="flex items-center justify-between px-3 py-2 text-xs rounded hover:bg-current/5 transition-colors">
                  <span>{currentT.resumeBtn}</span>
                  <ChevronRight size={14} className="opacity-50" />
                </button>
              </div>
            </div>
          )}
        </div>
    </header>
  );
}