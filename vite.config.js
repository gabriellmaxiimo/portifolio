import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// 1. Import do Gemini
import { handleGemini, GEMINI_PATH } from "./GeminiAPI/api/_gemini.js";

// 2. Import do Spotify (com o caminho correto na pasta SpotifyAPI)
import {
  CALLBACK_PATH,
  handleCallback,
  handleLogin,
  handleSpotify,
  LOGIN_PATH,
  SPOTIFY_PATH,
} from "./SpotifyAPI/api/_spotify.js";

// Middleware do Gemini
function geminiApi(env) {
  const middleware = (req, res, next) => {
    if (new URL(req.url, "http://127.0.0.1:5173").pathname !== GEMINI_PATH) return next();
    handleGemini(req, res, env).catch(next);
  };

  return {
    name: "gemini-api",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

// Middleware do Spotify
function spotifyApi(env) {
  const middleware = (req, res, next) => {
    const url = new URL(req.url, "http://127.0.0.1:5173");
    if (url.pathname === LOGIN_PATH) return handleLogin(req, res, env);
    if (url.pathname === CALLBACK_PATH) return handleCallback(req, res, env).catch(next);
    if (url.pathname !== SPOTIFY_PATH) return next();
    handleSpotify(req, res, env).catch(next);
  };

  return {
    name: "spotify-api",
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
    plugins: [react(), geminiApi(env), spotifyApi(env)],
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