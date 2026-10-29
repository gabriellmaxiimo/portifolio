// Aba oculta até o login com Google.
export const FINANCE_TAB_INDEX = 8;

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
    tabs: ['Sobre Mim', 'Projetos', 'Experiências', 'Currículo', 'Contato', 'Cruzeiro', 'Spotify', 'Filmes, Séries e Animes', 'Controle Financeiro'],
    settings: 'Configurações',
    lang: 'Idioma',
    theme: 'Tema',
    themes: ['Cyberpunk', 'Escuro', 'Claro', 'Cruzeiro', 'Original'],
    searchPlaceholder: 'Pesquisar...',
    aboutTitle: 'Sobre Mim',
    githubProfileTitle: 'Meu perfil no GitHub',
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
        name: 'WorkLink',
        tech: 'Plataforma web · Recrutamento',
        desc: 'Plataforma que conecta empresas e candidatos, permitindo publicar vagas, gerenciar candidaturas e buscar oportunidades.',
        url: 'https://github.com/gabriellmaxiimo/Worklink-2025-2',
      },
      {
        name: "SERV'IN",
        tech: 'React, TypeScript, Spring Boot, PostgreSQL',
        desc: 'Sistema para centralizar o credenciamento de trabalhadores em eventos, com gestão de funcionários, equipes e presença.',
        url: 'https://github.com/gabriellmaxiimo/Serv-in-2026-1',
      },
      {
        name: 'Van Connect',
        tech: 'Plataforma web · Transporte',
        desc: 'Plataforma que facilita o contato entre motoristas de vans escolares e universitárias e seus clientes.',
        url: 'https://github.com/gabriellmaxiimo/Van-Connect-2024-1',
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
    contactEmail: 'Seu e-mail',
    contactMessage: 'Escreva sua mensagem...',
    contactSend: 'Enviar',
    contactSending: 'Enviando...',
    contactSuccess: 'Mensagem enviada com sucesso!',
    contactError: 'Erro ao enviar. Tente novamente.',
    resumeTitle: 'Currículo',
    resumeDesc: 'Visualizador de PDF indisponível na pré-visualização.',
    profileRole: 'Engenharia de Software',
    quickLinks: 'Links Rápidos',
    aboutMeBtn: 'Ir para Sobre Mim',
    resumeBtn: 'Ver Currículo',
    googleSignIn: 'Entrar com Google',
    googleSignOut: 'Sair da conta Google',
    githubSignIn: 'Entrar com GitHub',
    githubSignOut: 'Sair do GitHub',
    accounts: 'Contas',
    financeBtn: 'Controle Financeiro',
    nextMatchTitle: 'Próxima Batalha do Cabuloso',
    matchOpen: 'Ver informações do Cruzeiro',
    matchLoading: 'Carregando jogo...',
    matchUnavailable: 'Dados indisponíveis',
    noMatch: 'Sem jogo marcado',
    venueTbd: 'Local a definir',
    followMatches: 'Acompanhe os jogos',
    live: 'Ao vivo',
    timeTbd: 'Horário a definir',
    favoritesTitle: 'Meus favoritos',
    topLabels: { tmdb_movie: 'Top 1 Filme', tmdb_tv: 'Top 1 Série', anilist: 'Top 1 Anime' },
    notRatedYet: 'Ainda sem avaliação',
    scoreText: (score) => `Nota ${score}/100`,
    openCatalog: 'Abrir catálogo',
    spotifySubtitle: 'O que estou ouvindo, minhas músicas e artistas favoritos',
    cruzeiroSubtitle: 'Jogos, resultados e classificação do Brasileirão',
    chatTitle: 'Assistente do Gabriel',
    clearChat: 'Limpar Conversa',
    chatPlaceholder: 'Pergunte algo sobre mim...',
    chatGreeting: 'Olá! Como posso ajudar?',
    chatError: 'Ocorreu um erro temporário ao falar com o assistente.',
    chatOpen: 'Abrir chat',
    chatClose: 'Fechar chat',
    contactShortcut: 'Ir para a guia de contato',
    searchResultsTitle: 'Resultados da Pesquisa',
  },
  EN: {
    tabs: ['About Me', 'Projects', 'Experiences', 'Resume', 'Contact', 'Cruzeiro', 'Spotify', 'Movies, TV & Anime', 'Finance Tracker'],
    settings: 'Settings',
    lang: 'Language',
    theme: 'Theme',
    themes: ['Cyberpunk', 'Dark', 'Light', 'Cruzeiro', 'Original'],
    searchPlaceholder: 'Search...',
    aboutTitle: 'About Me',
    githubProfileTitle: 'My GitHub profile',
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
        name: 'WorkLink',
        tech: 'Web platform · Recruitment',
        desc: 'A platform connecting companies and candidates, with tools to publish jobs, manage applications, and find opportunities.',
        url: 'https://github.com/gabriellmaxiimo/Worklink-2025-2',
      },
      {
        name: "SERV'IN",
        tech: 'React, TypeScript, Spring Boot, PostgreSQL',
        desc: 'A system for centralizing event worker check-in, including employee, team, and attendance management.',
        url: 'https://github.com/gabriellmaxiimo/Serv-in-2026-1',
      },
      {
        name: 'Van Connect',
        tech: 'Web platform · Transportation',
        desc: 'A platform that makes it easier for school and university van drivers to connect with their customers.',
        url: 'https://github.com/gabriellmaxiimo/Van-Connect-2024-1',
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
    contactEmail: 'Your email',
    contactMessage: 'Write your message...',
    contactSend: 'Send',
    contactSending: 'Sending...',
    contactSuccess: 'Message sent successfully!',
    contactError: 'Could not send. Please try again.',
    resumeTitle: 'Resume',
    resumeDesc: 'PDF viewer unavailable in preview mode.',
    profileRole: 'Software Engineering',
    quickLinks: 'Quick Links',
    aboutMeBtn: 'Go to About Me',
    resumeBtn: 'View Resume',
    googleSignIn: 'Sign in with Google',
    googleSignOut: 'Sign out of Google',
    githubSignIn: 'Sign in with GitHub',
    githubSignOut: 'Sign out of GitHub',
    accounts: 'Accounts',
    financeBtn: 'Finance Tracker',
    nextMatchTitle: 'Next Cruzeiro Match',
    matchOpen: 'See Cruzeiro details',
    matchLoading: 'Loading match...',
    matchUnavailable: 'Data unavailable',
    noMatch: 'No match scheduled',
    venueTbd: 'Venue to be defined',
    followMatches: 'Follow the matches',
    live: 'Live',
    timeTbd: 'Time to be defined',
    favoritesTitle: 'My favorites',
    topLabels: { tmdb_movie: 'Top 1 Movie', tmdb_tv: 'Top 1 TV show', anilist: 'Top 1 Anime' },
    notRatedYet: 'Not rated yet',
    scoreText: (score) => `Rating ${score}/100`,
    openCatalog: 'Open catalog',
    spotifySubtitle: 'What I am listening to, my favorite songs and artists',
    cruzeiroSubtitle: 'Matches, results and the Brasileirão table',
    chatTitle: "Gabriel's Assistant",
    clearChat: 'Clear Chat',
    chatPlaceholder: 'Ask something about me...',
    chatGreeting: 'Hi! How can I help?',
    chatError: 'A temporary error occurred while talking to the assistant.',
    chatOpen: 'Open chat',
    chatClose: 'Close chat',
    contactShortcut: 'Go to the contact tab',
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
