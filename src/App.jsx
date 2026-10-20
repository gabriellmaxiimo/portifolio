import React, { useState, useEffect, useMemo } from 'react';

// Componentes
import Header from './components/Header';
import Navigation from './components/Navigation';
import Chatbot from './components/Chatbot';
import CruzeiroLogo from './components/CruzeiroLogo';

// Páginas
import About from './pages/About';
import Projects from './pages/Projects';
import Experiences from './pages/Experiences';
import Resume from './pages/Resume';
import Contact from './pages/Contact';
import Cruzeiro from './pages/Cruzeiro';
import Spotify from './pages/Spotify';
import MediaLibrary from './pages/MediaLibrary';

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
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
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

  const t = {
    PT: {
      tabs: ['Sobre Mim', 'Projetos', 'Experiências', 'Currículo', 'Contato', 'Cruzeiro', 'Spotify', 'Filmes, Séries e Animes'],
      settings: 'Definições',
      lang: 'Idioma',
      theme: 'Tema',
      themes: ['Cyberpunk', 'Escuro', 'Claro', 'Cruzeiro', 'Original'],
      searchPlaceholder: 'Pesquisar...',
      aboutTitle: 'Sobre Mim',
      lastTrackTitle: 'Última música tocada',
      openSpotifyLabel: 'Abrir aba do Spotify',
      trackPlaying: 'Tocando agora',
      trackPlayed: 'Tocou',
      trackLoading: 'Carregando música...',
      noRecentTrack: 'Nenhuma música recente encontrada',
      trackUnavailable: 'Não foi possível carregar a música do Spotify.',
      retry: 'Tentar novamente',
      aboutText: 'Olá, sou o Gabriel Máximo de Castro. Graduando em Engenharia de Software na PUC Minas – Coração Eucarístico. Possuo forte foco em desenvolvimento de software com experiência em Java (Core e POO), Spring Boot, estruturas de dados, além de sólidos conhecimentos em redes, sistemas operacionais e hardware. Sou apaixonado por tecnologia, proativo, analítico e, claro, fanático pelo Cruzeiro Esporte Clube!',
      stackTitle: 'Foco (Stack & Tecnologias)',
      projectsTitle: 'Projetos de Destaque',
      projects: [
        { name: 'Microsserviço de Pagamentos', tech: 'Java, Spring Boot, Docker', desc: 'API resiliente para processamento de transações de alta disponibilidade.' },
        { name: 'Gestão Académica', tech: 'SQL, Java', desc: 'Sistema de suporte para análise e gestão de dados estudantis.' }
      ],
      expTitle: 'Experiências',
      exp: [
        { role: 'Auxiliar de Serviços Administrativos', company: 'PUC Minas - IFTDJ', period: 'Dez/2024 – Atual', desc: 'Gestão de processos académicos, organização e suporte administrativo.' }
      ],
      contactTitle: 'Contato',
      resumeTitle: 'Currículo',
      resumeDesc: 'Visualizador de PDF indisponível na pré-visualização.',
      profileRole: 'Engenharia de Software',
      quickLinks: 'Links Rápidos',
      aboutMeBtn: 'Ir para Sobre Mim',
      resumeBtn: 'Ver Currículo',
      nextMatchTitle: 'Próxima Batalha do Cabuloso',
      chatTitle: 'Assistente do Gabriel',
      clearChat: 'Limpar Conversa',
      chatPlaceholder: 'Pergunte algo sobre mim...',
      searchResultsTitle: 'Resultados da Pesquisa'
    },
    EN: {
      tabs: ['About Me', 'Projects', 'Experiences', 'Resume', 'Contact', 'Cruzeiro', 'Spotify', 'Movies, TV & Anime'],
      settings: 'Settings',
      lang: 'Language',
      theme: 'Theme',
      themes: ['Cyberpunk', 'Escuro', 'Claro', 'Cruzeiro', 'Original'],
      searchPlaceholder: 'Search...',
      aboutTitle: 'About Me',
      lastTrackTitle: 'Last played track',
      openSpotifyLabel: 'Open Spotify tab',
      trackPlaying: 'Playing now',
      trackPlayed: 'Played',
      trackLoading: 'Loading track...',
      noRecentTrack: 'No recent track found',
      trackUnavailable: 'Could not load the Spotify track.',
      retry: 'Try again',
      aboutText: 'Hello, I am Gabriel Máximo de Castro. Software Engineering undergraduate at PUC Minas. Focused on software development with expertise in Java (Core & OOP), Spring Boot, data structures, networks, operating systems, and hardware. Passionate about technology, analytical, proactive, and a huge fan of Cruzeiro Esporte Clube!',
      stackTitle: 'Focus (Stack & Technologies)',
      projectsTitle: 'Featured Projects',
      projects: [
        { name: 'Payment Microservice', tech: 'Java, Spring Boot, Docker', desc: 'Resilient API for high-availability transaction processing.' },
        { name: 'Academic Management', tech: 'SQL, Java', desc: 'Support system for student data analysis and management.' }
      ],
      expTitle: 'Experiences',
      exp: [
        { role: 'Administrative Services Assistant', company: 'PUC Minas - IFTDJ', period: 'Dec/2024 – Present', desc: 'Management of academic processes and administrative support.' }
      ],
      contactTitle: 'Contact',
      resumeTitle: 'Resume',
      resumeDesc: 'PDF viewer unavailable in preview mode.',
      profileRole: 'Software Engineering',
      quickLinks: 'Quick Links',
      aboutMeBtn: 'Go to About Me',
      resumeBtn: 'View Resume',
      nextMatchTitle: 'Next Cruzeiro Match',
      chatTitle: 'Gabriel\'s Assistant',
      clearChat: 'Clear Chat',
      chatPlaceholder: 'Ask something about me...',
      searchResultsTitle: 'Search Results'
    }
  };

  const currentT = t[language];
  const stack = ['Java (Core e POO)', 'Spring Boot', 'React', 'Docker', 'Postman', 'SQL', 'Redes (TCP/IP, DNS, DHCP)', 'Sistemas Operacionais (Windows/Terminal)', 'Hardware & Manutenção', 'Git'];

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { projects: [], exp: [], stack: [], about: false };
    const q = searchQuery.toLowerCase();

    const matchedProjects = currentT.projects.filter(p => 
      p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.tech.toLowerCase().includes(q)
    );

    const matchedExp = currentT.exp.filter(e => 
      e.role.toLowerCase().includes(q) || e.company.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q)
    );

    const matchedStack = stack.filter(s => s.toLowerCase().includes(q));
    const matchedAbout = currentT.aboutText.toLowerCase().includes(q) || currentT.aboutTitle.toLowerCase().includes(q);

    return { projects: matchedProjects, exp: matchedExp, stack: matchedStack, about: matchedAbout };
  }, [searchQuery, currentT]);

  const hasSearchResults = searchQuery.trim() !== '' && (
    searchResults.projects.length > 0 || searchResults.exp.length > 0 || searchResults.stack.length > 0 || searchResults.about
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
          activeLine: 'bg-white'
        };
      case 'Claro':
        return {
          bgClass: 'theme-claro text-gray-900',
          glass: 'bg-white/60 border border-gray-300/50 shadow-xl backdrop-blur-xl',
          solidBg: 'bg-white border-gray-300',
          accent: 'text-gray-800',
          hover: 'hover:border-gray-500 hover:bg-white/80 hover:scale-[1.02] transition-all',
          activeLine: 'bg-black'
        };
      case 'Cyberpunk':
        return {
          bgClass: 'theme-cyberpunk text-white',
          glass: 'bg-[#050505]/80 border border-[#ff00ff]/40 shadow-[0_0_15px_rgba(255,0,255,0.15)] backdrop-blur-xl',
          solidBg: 'bg-[#0a000a] border-[#ff00ff]/50',
          accent: 'text-[#fce300] drop-shadow-[0_0_8px_rgba(252,227,0,0.8)]',
          hover: 'hover:border-[#00f0ff] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:bg-[#050505] hover:scale-[1.02] transition-all duration-300',
          activeLine: 'bg-[#fce300] shadow-[0_0_10px_rgba(252,227,0,1)]'
        };
      case 'Cruzeiro':
        return {
          bgClass: 'theme-cruzeiro text-white',
          glass: 'bg-white/10 border border-white/20 shadow-lg backdrop-blur-xl',
          solidBg: 'bg-[#002255] border-blue-400/30',
          accent: 'text-blue-200',
          hover: 'hover:border-white/50 hover:bg-white/20 hover:scale-[1.02] transition-all',
          activeLine: 'bg-white'
        };
      case 'Original':
      default:
        return {
          bgClass: 'theme-original text-white',
          glass: 'bg-white/5 border border-white/10 shadow-lg backdrop-blur-2xl',
          solidBg: 'bg-[#1e1b4b] border-purple-500/30',
          accent: 'text-gray-200',
          hover: 'hover:border-white/30 hover:bg-white/10 hover:scale-[1.02] transition-all',
          activeLine: 'bg-white'
        };
    }
  }, [theme]);

  return (
    <div className={`h-screen w-full overflow-hidden flex flex-col font-sans relative ${themeClasses.bgClass} animated-bg`}>
      {theme === 'Cruzeiro' && (
        <div className="absolute -bottom-20 -right-20 opacity-10 blur-[2px] pointer-events-none z-0">
          <CruzeiroLogo className="w-[600px] h-[600px]" />
        </div>
      )}

      <Header
        theme={theme}
        themeClasses={themeClasses}
        currentT={currentT}
        time={time}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        hasSearchResults={hasSearchResults}
        setActiveTabIndex={navigateToTab}
        language={language}
        setLanguage={setLanguage}
        setTheme={setTheme}
      />

      <Navigation
        currentT={currentT}
        activeTabIndex={activeTabIndex}
        setActiveTabIndex={navigateToTab}
        themeClasses={themeClasses}
      />

      <main className="flex-1 overflow-y-auto px-6 lg:px-12 py-8 flex flex-col z-10 scrollbar-hide relative">
        <div className="w-full max-w-5xl mx-auto my-auto py-4">
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
        </div>
      </main>

      <Chatbot currentT={currentT} themeClasses={themeClasses} onContact={() => navigateToTab(4)} />
    </div>
  );
}