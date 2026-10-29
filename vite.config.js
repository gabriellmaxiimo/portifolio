import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

import { handleGemini, GEMINI_PATH } from "./GeminiAPI/api/_gemini.js";
import {
  CALLBACK_PATH,
  handleCallback,
  handleLogin,
  handleSpotify,
  LOGIN_PATH,
  SPOTIFY_PATH,
} from "./SpotifyAPI/api/_spotify.js";
import { handleTmdb, TMDB_PATH } from "./TMDBAPI/api/_tmdb.js";
import { GITHUB_PATH, handleGitHub } from "./GitHubAPI/api/_github.js";
import GITHUB_CONFIG from "./GitHubAPI/src/config/githubConfig.js";

// No npm run dev / preview, estas rotas fazem o papel das Vercel Functions da pasta api/.
function apiRoutes(env) {
  const routes = {
    [GEMINI_PATH]: handleGemini,
    [SPOTIFY_PATH]: handleSpotify,
    [LOGIN_PATH]: handleLogin,
    [CALLBACK_PATH]: handleCallback,
    [TMDB_PATH]: handleTmdb,
    [GITHUB_PATH]: (req, res) => handleGitHub(req, res, env, { onlyUser: GITHUB_CONFIG.USERNAME }),
  };

  const middleware = (req, res, next) => {
    const handler = routes[new URL(req.url, "http://127.0.0.1").pathname];
    if (!handler) return next();
    Promise.resolve(handler(req, res, env)).catch(next);
  };

  return {
    name: "api-routes",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), apiRoutes(env)],
    server: {
      host: "127.0.0.1",
      port: 5173,
    },
    preview: {
      host: "127.0.0.1",
      port: 5173,
    },
  };
});
