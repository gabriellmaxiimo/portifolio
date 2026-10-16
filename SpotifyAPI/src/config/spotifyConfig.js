// spotifyConfig.js
// Configurações do painel <SpotifyDashboard />.
//
// As chaves do Spotify NÃO ficam aqui: elas são lidas só no servidor
// (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET e SPOTIFY_REFRESH_TOKEN), pela
// Vercel Function api/spotify.js e pelo vite.config.js no npm run dev.
const SPOTIFY_CONFIG = {
  API_PATH: "/api/spotify",
  LOCALE: "pt-BR",

  // Período do "mais ouvidas" ao abrir (value = time_range da API do Spotify)
  DEFAULT_RANGE: "short_term",
  RANGES: [
    { value: "short_term", label: "4 semanas" },
    { value: "medium_term", label: "6 meses" },
    { value: "long_term", label: "1 ano" },
  ],

  // De quanto em quanto tempo o "tocando agora" pergunta de novo (segundos)
  NOW_REFRESH_SECONDS: 30,

};

export default SPOTIFY_CONFIG;
