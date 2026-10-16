import { FiMusic } from 'react-icons/fi';
import SpotifyDashboard from '../../SpotifyAPI/src/components/SpotifyDashboard';
import './Spotify.css';

export default function Spotify({ theme, themeClasses }) {
  return (
    <section className="animate-fade-in w-full">
      <header className="flex items-center gap-4 mb-8">
        <span className="spotify-page-icon" aria-hidden="true">
          <FiMusic />
        </span>
        <div>
          <h2 className={`text-3xl font-light tracking-tight ${themeClasses.accent}`}>Spotify</h2>
          <p className="text-xs md:text-sm opacity-70">O que estou ouvindo, minhas músicas e artistas favoritos</p>
        </div>
      </header>

      <div className="spotify-page" data-theme={theme}>
        <SpotifyDashboard />
      </div>
    </section>
  );
}
