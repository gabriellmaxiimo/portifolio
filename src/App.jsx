import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';

import Header from './components/Header';
import Navigation from './components/Navigation';
import Chatbot from './components/Chatbot';
import CruzeiroLogo from './components/CruzeiroLogo';
import { PortfolioProvider } from './context/PortfolioContext';
import { getSearchResults, portfolioContent, stack } from './content/portfolioContent';

const About = lazy(() => import('./pages/About'));
const Projects = lazy(() => import('./pages/Projects'));
const Experiences = lazy(() => import('./pages/Experiences'));
const Resume = lazy(() => import('./pages/Resume'));
const Contact = lazy(() => import('./pages/Contact'));
const Cruzeiro = lazy(() => import('./pages/Cruzeiro'));
const Spotify = lazy(() => import('./pages/Spotify'));
const MediaLibrary = lazy(() => import('./pages/MediaLibrary'));

const TAB_PATHS = [
  '/sobre-mim',
  '/projetos',
  '/experiencias',
  '/curriculo',
  '/contato',
  '/cruzeiro',
  '/spotify',
  '/filmes-series-animes',
];

function LoadingPanel() {
  return (
    <div className="flex min-h-[22rem] items-center justify-center rounded-2xl border border-current/10 bg-current/5 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
      Carregando...
    </div>
  );
}

function getTabIndexFromPath(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const tabIndex = TAB_PATHS.indexOf(normalizedPath);
  return tabIndex === -1 ? 0 : tabIndex;
}

export default function App() {
  const [time, setTime] = useState('');
  const [language, setLanguage] = useState('PT');
  const [theme, setTheme] = useState('Cyberpunk');
  const [activeTabIndex, setActiveTabIndex] = useState(() => getTabIndexFromPath(window.location.pathname));
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaType, setMediaType] = useState('movie');

  const navigateToTab = (tabIndex) => {
    const nextTabIndex = Number.isInteger(tabIndex) && TAB_PATHS[tabIndex] ? tabIndex : 0;
    const nextPath = TAB_PATHS[nextTabIndex];
    setActiveTabIndex(nextTabIndex);

    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, '', `${nextPath}${window.location.search}${window.location.hash}`);
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handlePopState = () => setActiveTabIndex(getTabIndexFromPath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const currentT = portfolioContent[language];
  const searchResults = useMemo(
    () => getSearchResults(searchQuery, currentT, stack),
    [searchQuery, currentT]
  );

  const hasSearchResults = searchQuery.trim() !== '' && (
    searchResults.projects.length > 0
    || searchResults.exp.length > 0
    || searchResults.stack.length > 0
    || searchResults.about
  );

  const themeClasses = useMemo(() => {
    switch (theme) {
      case 'Escuro':
        return {
          bgClass: 'theme-escuro text-gray-100',
          glass: 'bg-black/50 border border-gray-700/50 shadow-lg backdrop-blur-xl',
          solidBg: 'bg-[#151515] border-gray-700/50',
          accent: 'text-gray-300',
          hover: 'hover:border-gray-500 hover:bg-black/70 hover:scale-[1.02] transition-all',
          activeLine: 'bg-white',
        };
      case 'Claro':
        return {
          bgClass: 'theme-claro text-gray-900',
          glass: 'bg-white/60 border border-gray-300/50 shadow-xl backdrop-blur-xl',
          solidBg: 'bg-white border-gray-300',
          accent: 'text-gray-800',
          hover: 'hover:border-gray-500 hover:bg-white/80 hover:scale-[1.02] transition-all',
          activeLine: 'bg-black',
        };
      case 'Cyberpunk':
        return {
          bgClass: 'theme-cyberpunk text-white',
          glass: 'bg-[#0b0b2b]/70 border border-[#00e6ff]/30 shadow-[0_0_25px_rgba(0,230,255,0.25)] backdrop-blur-2xl',
          solidBg: 'bg-[#0a000a] border-[#ff00ff]/50',
          accent: 'text-[#fce300] drop-shadow-[0_0_8px_rgba(252,227,0,0.8)]',
          hover: 'hover:border-[#00f0ff] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:bg-[#050505] hover:scale-[1.02] transition-all duration-300',
          activeLine: 'bg-[#fce300] shadow-[0_0_10px_rgba(252,227,0,1)]',
        };
      case 'Cruzeiro':
        return {
          bgClass: 'theme-cruzeiro text-white',
          glass: 'bg-white/10 border border-white/20 shadow-lg backdrop-blur-xl',
          solidBg: 'bg-[#002255] border-blue-400/30',
          accent: 'text-blue-200',
          hover: 'hover:border-white/50 hover:bg-white/20 hover:scale-[1.02] transition-all',
          activeLine: 'bg-white',
        };
      case 'Original':
      default:
        return {
          bgClass: 'theme-original text-white',
          glass: 'bg-white/5 border border-white/10 shadow-lg backdrop-blur-2xl',
          solidBg: 'bg-[#1e1b4b] border-purple-500/30',
          accent: 'text-gray-200',
          hover: 'hover:border-white/30 hover:bg-white/10 hover:scale-[1.02] transition-all',
          activeLine: 'bg-white',
        };
    }
  }, [theme]);

  const portfolioValue = useMemo(() => ({
    theme,
    setTheme,
    language,
    setLanguage,
    activeTabIndex,
    setActiveTabIndex: navigateToTab,
    searchQuery,
    setSearchQuery,
    mediaType,
    setMediaType,
    currentT,
    searchResults,
    hasSearchResults,
    themeClasses,
    time,
  }), [activeTabIndex, currentT, hasSearchResults, language, mediaType, searchQuery, searchResults, theme, themeClasses, time]);

  return (
    <PortfolioProvider value={portfolioValue}>
      <div className={`h-screen w-full overflow-hidden flex flex-col font-sans relative ${themeClasses.bgClass} animated-bg`}>
        {theme === 'Cruzeiro' && (
          <div className="absolute -bottom-20 -right-20 opacity-10 blur-[2px] pointer-events-none z-0">
            <CruzeiroLogo className="w-[600px] h-[600px]" />
          </div>
        )}

        <Header />
        <Navigation />

        <main className="flex-1 overflow-y-auto px-6 lg:px-12 py-8 flex flex-col z-10 scrollbar-hide relative">
          <div className="w-full max-w-5xl mx-auto my-auto py-4">
            <Suspense fallback={<LoadingPanel />}>
              {activeTabIndex === 0 && (
                <About
                  currentT={currentT}
                  themeClasses={themeClasses}
                  stack={stack}
                  onOpenCruzeiro={() => navigateToTab(5)}
                  onOpenSpotify={() => navigateToTab(6)}
                  onOpenMedia={(type) => {
                    setMediaType(type);
                    navigateToTab(7);
                  }}
                />
              )}
              {activeTabIndex === 1 && <Projects currentT={currentT} themeClasses={themeClasses} />}
              {activeTabIndex === 2 && <Experiences currentT={currentT} themeClasses={themeClasses} />}
              {activeTabIndex === 3 && <Resume currentT={currentT} themeClasses={themeClasses} />}
              {activeTabIndex === 4 && <Contact currentT={currentT} themeClasses={themeClasses} />}
              {activeTabIndex === 5 && <Cruzeiro theme={theme} themeClasses={themeClasses} />}
              {activeTabIndex === 6 && <Spotify theme={theme} themeClasses={themeClasses} />}
              {activeTabIndex === 7 && <MediaLibrary themeClasses={themeClasses} type={mediaType} setType={setMediaType} />}
            </Suspense>
          </div>
        </main>

        <Chatbot currentT={currentT} themeClasses={themeClasses} onContact={() => navigateToTab(4)} />
      </div>
    </PortfolioProvider>
  );
}
