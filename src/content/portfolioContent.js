export const stack = [
  'Java (Core e POO)',
  'Spring Boot',
  'React',
  'Docker',
  'Postman',
  'SQL',
  'Redes (TCP/IP, DNS, DHCP)',
  'Sistemas Operacionais (Windows/Terminal)',
  'Hardware & Manutenção',
  'Git',
];

export const portfolioContent = {
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
      {
        name: 'Microsserviço de Pagamentos',
        tech: 'Java, Spring Boot, Docker',
        desc: 'API resiliente para processamento de transações de alta disponibilidade.',
      },
      {
        name: 'Gestão Académica',
        tech: 'SQL, Java',
        desc: 'Sistema de suporte para análise e gestão de dados estudantis.',
      },
    ],
    expTitle: 'Experiências',
    exp: [
      {
        role: 'Auxiliar de Serviços Administrativos',
        company: 'PUC Minas - IFTDJ',
        period: 'Dez/2024 – Atual',
        desc: 'Gestão de processos académicos, organização e suporte administrativo.',
      },
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
    searchResultsTitle: 'Resultados da Pesquisa',
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
      {
        name: 'Payment Microservice',
        tech: 'Java, Spring Boot, Docker',
        desc: 'Resilient API for high-availability transaction processing.',
      },
      {
        name: 'Academic Management',
        tech: 'SQL, Java',
        desc: 'Support system for student data analysis and management.',
      },
    ],
    expTitle: 'Experiences',
    exp: [
      {
        role: 'Administrative Services Assistant',
        company: 'PUC Minas - IFTDJ',
        period: 'Dec/2024 – Present',
        desc: 'Management of academic processes and administrative support.',
      },
    ],
    contactTitle: 'Contact',
    resumeTitle: 'Resume',
    resumeDesc: 'PDF viewer unavailable in preview mode.',
    profileRole: 'Software Engineering',
    quickLinks: 'Quick Links',
    aboutMeBtn: 'Go to About Me',
    resumeBtn: 'View Resume',
    nextMatchTitle: 'Next Cruzeiro Match',
    chatTitle: "Gabriel's Assistant",
    clearChat: 'Clear Chat',
    chatPlaceholder: 'Ask something about me...',
    searchResultsTitle: 'Search Results',
  },
};

export function getSearchResults(searchQuery, currentT, techStack = stack) {
  if (!searchQuery.trim()) {
    return { projects: [], exp: [], stack: [], about: false };
  }

  const normalizedQuery = searchQuery.toLowerCase();

  const matchedProjects = currentT.projects.filter((project) => {
    const haystack = [project.name, project.desc, project.tech].join(' ').toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const matchedExp = currentT.exp.filter((experience) => {
    const haystack = [experience.role, experience.company, experience.desc].join(' ').toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const matchedStack = techStack.filter((item) => item.toLowerCase().includes(normalizedQuery));
  const matchedAbout = currentT.aboutText.toLowerCase().includes(normalizedQuery)
    || currentT.aboutTitle.toLowerCase().includes(normalizedQuery);

  return {
    projects: matchedProjects,
    exp: matchedExp,
    stack: matchedStack,
    about: matchedAbout,
  };
}
