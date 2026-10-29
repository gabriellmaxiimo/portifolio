import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  LayoutGrid,
  List,
  LoaderCircle,
  LogIn,
  LogOut,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import {
  fetchAnilistCatalog,
  fetchMediaCatalogCache,
  fetchMediaRatings,
  fetchTmdbCatalog,
  formatMediaStorageError,
  isMediaAdmin,
  cacheMediaCatalog,
  removeMediaRating,
  saveMediaRating,
  signInWithGitHub,
  signOutFromSupabase,
  setMediaWatchlist,
  supabase,
  supabaseMissingSettings,
} from "../services/mediaService";
import { usePortfolio } from "../context/PortfolioContext";
import "./MediaLibrary.css";

const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";

const TEXT = {
  PT: {
    title: "Filmes, Séries e Animes", subtitle: "Ranking e avaliação pessoal de 0 a 100.",
    catalogType: "Tipo de catálogo", movies: "Filmes", series: "Séries", animes: "Animes",
    viewMode: "Modo de visualização", gridView: "Exibir em cards com capas", listView: "Exibir em lista sem capas",
    sortBy: "Ordenar:", popularity: "Popularidade", myScore: "Minha nota",
    editorSignedIn: "Editor autenticado pelo GitHub", signOut: "Sair",
    noEditPermission: "Conta GitHub conectada sem permissão de edição.", signInToEdit: "Entrar com GitHub para editar",
    topRated: "Meus melhores avaliados", topRatedHint: "Ordenados pela sua nota",
    myList: "Minha lista", myListHint: "Títulos salvos", results: "Resultados", trending: "Em alta",
    search: (kind) => `Buscar ${kind}...`, loadingCatalog: "Carregando catálogo...", loading: "Carregando...",
    loadMore: "Carregar mais", noResults: "Nenhum título encontrado.", providedBy: "Catálogo fornecido por",
    noImage: "Sem imagem", rankLabel: (rank) => `Posição ${rank} no Top 20`, details: "Ver detalhes",
    yourScore: "Sua nota", notRated: "Ainda não avaliado", scoreOf: (score) => `Nota ${score} de 100`,
    noScore: "Sem nota", scoreFor: (title) => `Nota de 0 a 100 para ${title}`,
    savingScore: "Salvando nota", saveScore: "Salvar nota",
    removeAll: "Remover a nota e o título das listas pessoais",
    removeFromList: "Remover da minha lista", addToList: "Adicionar à minha lista",
  },
  EN: {
    title: "Movies, TV & Anime", subtitle: "Personal ranking and ratings from 0 to 100.",
    catalogType: "Catalog type", movies: "Movies", series: "TV shows", animes: "Anime",
    viewMode: "View mode", gridView: "Show as cards with posters", listView: "Show as list without posters",
    sortBy: "Sort:", popularity: "Popularity", myScore: "My rating",
    editorSignedIn: "Editor signed in with GitHub", signOut: "Sign out",
    noEditPermission: "GitHub account connected without edit permission.", signInToEdit: "Sign in with GitHub to edit",
    topRated: "My top rated", topRatedHint: "Sorted by your rating",
    myList: "My list", myListHint: "Saved titles", results: "Results", trending: "Trending",
    search: (kind) => `Search ${kind}...`, loadingCatalog: "Loading catalog...", loading: "Loading...",
    loadMore: "Load more", noResults: "No titles found.", providedBy: "Catalog provided by",
    noImage: "No image", rankLabel: (rank) => `Rank ${rank} in the Top 20`, details: "View details",
    yourScore: "Your rating", notRated: "Not rated yet", scoreOf: (score) => `Rating ${score} out of 100`,
    noScore: "No rating", scoreFor: (title) => `Rating from 0 to 100 for ${title}`,
    savingScore: "Saving rating", saveScore: "Save rating",
    removeAll: "Remove the rating and the title from personal lists",
    removeFromList: "Remove from my list", addToList: "Add to my list",
  },
};

// Linha salva no Supabase → formato usado pelo MediaCard
function ratingToItem(rating) {
  return {
    ...rating,
    id: rating.catalog_id,
    posterUrl: rating.poster_url,
    year: rating.release_year,
    popularity: 0,
    rated: rating.score !== null,
    watchlistStatus: rating.watchlist_status,
    externalUrl: rating.provider === "anilist"
      ? `https://anilist.co/anime/${rating.catalog_id}`
      : `https://www.themoviedb.org/${rating.provider === "tmdb_movie" ? "movie" : "tv"}/${rating.catalog_id}`,
  };
}

function normalizeTmdb(item, type, savedRatings) {
  const provider = type === "movie" ? "tmdb_movie" : "tmdb_tv";
  const rating = savedRatings.find((entry) => entry.provider === provider && entry.catalog_id === String(item.id));
  const date = type === "movie" ? item.release_date : item.first_air_date;
  return {
    id: item.id,
    provider,
    title: item.title ?? item.name ?? "Sem título",
    overview: item.overview ?? "",
    posterUrl: item.posterUrl ?? item.poster_url ?? (item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : null),
    year: date ? Number(date.slice(0, 4)) || null : item.release_year ?? null,
    popularity: item.popularity ?? 0,
    score: rating?.score ?? 0,
    rated: Boolean(rating) && rating.score !== null,
    watchlistStatus: rating?.watchlist_status ?? null,
    externalUrl: `https://www.themoviedb.org/${type}/${item.id}`,
  };
}

function normalizeAnime(item, savedRatings) {
  const rating = savedRatings.find((entry) => entry.provider === "anilist" && entry.catalog_id === String(item.id));
  return {
    id: item.id,
    provider: "anilist",
    title: typeof item.title === "string"
      ? item.title
      : item.title?.english ?? item.title?.romaji ?? item.title?.native ?? "Sem título",
    overview: (item.description ?? item.overview ?? "").replace(/<[^>]*>/g, ""),
    posterUrl: item.coverImage?.large ?? item.posterUrl ?? item.poster_url ?? null,
    year: item.startDate?.year ?? item.year ?? item.release_year ?? null,
    popularity: item.popularity ?? 0,
    score: rating?.score ?? 0,
    rated: Boolean(rating) && rating.score !== null,
    watchlistStatus: rating?.watchlist_status ?? null,
    externalUrl: item.siteUrl,
  };
}

function restoreCachedItem(item) {
  if (item.provider === "anilist") {
    return {
      ...item,
      id: item.catalog_id,
      title: { english: item.title },
      description: item.overview,
      coverImage: { large: item.poster_url },
      startDate: { year: item.release_year },
      siteUrl: `https://anilist.co/anime/${item.catalog_id}`,
    };
  }
  return {
    ...item,
    id: item.catalog_id,
    title: item.title,
    name: item.title,
    poster_url: item.poster_url,
    release_year: item.release_year,
  };
}

function MediaCard({ t, item, rank, viewMode, canEdit, onRate, onRemove, onWatchlist, busyId }) {
  const [draftScore, setDraftScore] = useState(String(item.rated ? item.score : 0));
  const busy = busyId === `${item.provider}:${item.id}`;
  const numericDraftScore = Number(draftScore);
  const displayedScore = canEdit ? numericDraftScore : item.rated ? item.score : 0;
  const scoreBand = !item.rated && !canEdit
    ? "none"
    : displayedScore >= 75
      ? "high"
      : displayedScore >= 50
        ? "mixed"
        : "low";
  const hasUnsavedScore = !item.rated || numericDraftScore !== item.score;

  useEffect(() => {
    setDraftScore(String(item.rated ? item.score : 0));
  }, [item.id, item.provider, item.rated, item.score]);

  return (
    <article className={`media-card${viewMode === "list" ? " media-card--list" : ""}`}>
      {item.posterUrl ? (
        <img className="media-poster" src={item.posterUrl} alt="" loading="lazy" />
      ) : (
        <div className="media-poster media-poster-empty" aria-hidden="true">{t.noImage}</div>
      )}
      <div className="media-card-content">
        <div className={`media-card-heading${rank !== undefined ? " media-card-heading--ranked" : ""}`}>
          {rank !== undefined && (
            <span className="media-rank-badge" aria-label={t.rankLabel(rank)}>{rank}.</span>
          )}
          <h3>{item.title}</h3>
          {item.year && <span>{item.year}</span>}
        </div>
        <a className="media-external-link" href={item.externalUrl} target="_blank" rel="noopener noreferrer">
          {t.details}
        </a>
        <div className={`media-rating media-rating--${scoreBand}`} aria-label={item.rated ? t.scoreOf(item.score) : t.notRated}>
          <div className="media-rating-heading">
            <span className="media-rating-label">{canEdit || item.rated ? t.yourScore : t.notRated}</span>
            <strong className="media-score-value">
              {item.rated || canEdit ? displayedScore : "—"}
              <span>/100</span>
            </strong>
          </div>
          <div
            className="media-score-track"
            role="progressbar"
            aria-label={item.rated ? t.scoreOf(displayedScore) : t.noScore}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={displayedScore}
          >
            <span className="media-score-progress" style={{ width: `${displayedScore}%` }} />
          </div>
          {canEdit && (
            <>
              <label className="media-score-control">
                <span className="sr-only">{t.scoreFor(item.title)}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={draftScore}
                  disabled={busy}
                  onChange={(event) => setDraftScore(event.target.value)}
                />
              </label>
              <div className="media-rating-actions">
                <button
                  type="button"
                  className="media-save-rating"
                  disabled={busy || !hasUnsavedScore}
                  onClick={() => onRate(item, numericDraftScore)}
                  aria-label={busy ? t.savingScore : t.saveScore}
                  title={busy ? t.savingScore : t.saveScore}
                >
                  {busy
                    ? <LoaderCircle size={16} className="media-action-spinner" aria-hidden="true" />
                    : <Save size={16} aria-hidden="true" />}
                </button>
                {(item.rated || item.watchlistStatus) && (
                  <button
                    type="button"
                    className="media-clear-rating"
                    disabled={busy}
                    title={t.removeAll}
                    aria-label={t.removeAll}
                    onClick={() => onRemove(item)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  className={`media-watchlist-button${item.watchlistStatus === "watchlist" ? " active" : ""}`}
                  disabled={busy}
                  aria-pressed={item.watchlistStatus === "watchlist"}
                  aria-label={item.watchlistStatus === "watchlist" ? t.removeFromList : t.addToList}
                  title={item.watchlistStatus === "watchlist" ? t.removeFromList : t.addToList}
                  onClick={() => onWatchlist(item, item.watchlistStatus === "watchlist" ? null : "watchlist")}
                >
                  {item.watchlistStatus === "watchlist"
                    ? <BookmarkCheck size={16} aria-hidden="true" />
                    : <Bookmark size={16} aria-hidden="true" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default function MediaLibrary({ themeClasses, type, setType }) {
  const t = TEXT[usePortfolio().language];
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("rated");
  const [viewMode, setViewMode] = useState("grid");
  const [catalog, setCatalog] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [catalogNotice, setCatalogNotice] = useState("");
  const [ratingsError, setRatingsError] = useState("");
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(!supabase);
  const [busyId, setBusyId] = useState("");

  const isAnime = type === "anime";
  // Lidos dentro de buscas assíncronas: refs evitam refazer a busca quando o login de admin termina
  // e permitem descartar uma página que chegou depois de a busca mudar.
  const isAdminRef = useRef(isAdmin);
  isAdminRef.current = isAdmin;
  const catalogKey = `${type}:${query.trim()}`;
  const catalogKeyRef = useRef(catalogKey);
  catalogKeyRef.current = catalogKey;
  const providers = useMemo(() => isAnime
    ? ["anilist"]
    : type === "movie"
      ? ["tmdb_movie"]
      : ["tmdb_tv"], [isAnime, type]);

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;
    const resolveUser = async (session) => {
      if (!active) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setAuthReady(true);
      setAuthError("");
      if (!nextUser) {
        setIsAdmin(false);
        return;
      }
      try {
        setIsAdmin(await isMediaAdmin(nextUser.id));
      } catch (error) {
        setIsAdmin(false);
        setAuthError(formatMediaStorageError(error));
      }
    };

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        return resolveUser(data.session);
      })
      .catch((error) => {
        if (active) {
          setAuthError(formatMediaStorageError(error));
          setAuthReady(true);
        }
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => resolveUser(session), 0);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setCatalogError("");
      setCatalogNotice("");
      setPage(1);
      try {
        const result = isAnime
          ? await fetchAnilistCatalog({ query: query.trim(), page: 1, signal: controller.signal })
          : await fetchTmdbCatalog({ type, query: query.trim(), page: 1, signal: controller.signal });
        if (active) {
          setCatalog(result.results);
          setHasMore(isAnime ? result.hasNextPage : result.page < result.total_pages);
          if (isAdminRef.current) {
            const cachedItems = result.results.map((item) =>
              isAnime ? normalizeAnime(item, []) : normalizeTmdb(item, type, [])
            );
            cacheMediaCatalog(cachedItems).catch((error) => {
              if (active) setRatingsError(`Não foi possível atualizar o cache do catálogo: ${formatMediaStorageError(error)}`);
            });
          }
        }
      } catch (error) {
        if (active && error.name !== "AbortError") {
          try {
            const cached = await fetchMediaCatalogCache(providers, query.trim());
            if (cached.length) {
              setCatalog(cached.map(restoreCachedItem));
              setHasMore(false);
              setCatalogNotice(`${error.message} Exibindo os últimos dados salvos.`);
            } else {
              setCatalogError(error.message);
            }
          } catch (cacheError) {
            setCatalogError(`${error.message} Cache: ${formatMediaStorageError(cacheError)}`);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }, query.trim() ? 300 : 0);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [isAnime, providers, query, type]);

  useEffect(() => {
    let active = true;
    setRatingsError("");
    setRatings([]);
    if (!supabase) {
      setRatings([]);
      setRatingsError(`Configure ${supabaseMissingSettings.join(" e ")} para ativar as avaliações.`);
      return undefined;
    }

    fetchMediaRatings(providers)
      .then((data) => active && setRatings(data))
      .catch((error) => active && setRatingsError(formatMediaStorageError(error)));
    return () => {
      active = false;
    };
  }, [providers]);

  const rankedRatings = useMemo(
    () => [...ratings]
      .filter((item) => item.score !== null)
      .sort((a, b) => b.score - a.score || new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 20),
    [ratings]
  );
  const watchlistItems = useMemo(
    () => ratings
      .filter((item) => item.watchlist_status === "watchlist")
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)),
    [ratings]
  );
  const sortedCatalog = useMemo(() => {
    const items = catalog.map((item) => isAnime ? normalizeAnime(item, ratings) : normalizeTmdb(item, type, ratings));
    if (sort === "rated") {
      items.sort((a, b) => b.score - a.score || b.popularity - a.popularity);
    }
    return items;
  }, [catalog, isAnime, ratings, sort, type]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    const requestKey = catalogKey;
    const nextPage = page + 1;
    setLoadingMore(true);
    setCatalogError("");
    try {
      const result = isAnime
        ? await fetchAnilistCatalog({ query: query.trim(), page: nextPage })
        : await fetchTmdbCatalog({ type, query: query.trim(), page: nextPage });
      if (catalogKeyRef.current !== requestKey) return;
      setCatalog((current) => [...current, ...result.results]);
      setPage(nextPage);
      setHasMore(isAnime ? result.hasNextPage : nextPage < result.total_pages);
    } catch (error) {
      if (catalogKeyRef.current === requestKey) setCatalogError(error.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const rateMedia = async (item, score) => {
    if (!isAdmin) return;
    const itemKey = `${item.provider}:${item.id}`;
    setBusyId(itemKey);
    setRatingsError("");
    try {
      await saveMediaRating(item, score);
      const updatedRatings = await fetchMediaRatings(providers);
      setRatings(updatedRatings);
    } catch (error) {
      setRatingsError(formatMediaStorageError(error));
    } finally {
      setBusyId("");
    }
  };

  const updateWatchlist = async (item, watchlistStatus) => {
    if (!isAdmin) return;
    const itemKey = `${item.provider}:${item.id}`;
    setBusyId(itemKey);
    setRatingsError("");
    try {
      await setMediaWatchlist(item, watchlistStatus);
      setRatings(await fetchMediaRatings(providers));
    } catch (error) {
      setRatingsError(formatMediaStorageError(error));
    } finally {
      setBusyId("");
    }
  };

  const removeMedia = async (item) => {
    if (!isAdmin) return;
    const itemKey = `${item.provider}:${item.id}`;
    setBusyId(itemKey);
    setRatingsError("");
    try {
      await removeMediaRating(item);
      setRatings(await fetchMediaRatings(providers));
    } catch (error) {
      setRatingsError(formatMediaStorageError(error));
    } finally {
      setBusyId("");
    }
  };

  const login = async () => {
    setAuthError("");
    try {
      await signInWithGitHub();
    } catch (error) {
      setAuthError(formatMediaStorageError(error));
    }
  };

  const logout = async () => {
    setAuthError("");
    try {
      await signOutFromSupabase();
    } catch (error) {
      setAuthError(formatMediaStorageError(error));
    }
  };

  const ratedItems = rankedRatings.map(ratingToItem);

  return (
    <section className="media-library animate-fade-in w-full">
      <header className="media-library-header">
        <div>
          <h1 className={`text-3xl font-light tracking-tight ${themeClasses.accent}`}>{t.title}</h1>
          <p>{t.subtitle}</p>
          <div className="media-library-options">
            <div className="media-type-switch" role="group" aria-label={t.catalogType}>
              <button type="button" className={type === "movie" ? "active" : ""} aria-pressed={type === "movie"} onClick={() => setType("movie")}>{t.movies}</button>
              <button type="button" className={type === "tv" ? "active" : ""} aria-pressed={type === "tv"} onClick={() => setType("tv")}>{t.series}</button>
              <button type="button" className={type === "anime" ? "active" : ""} aria-pressed={type === "anime"} onClick={() => setType("anime")}>{t.animes}</button>
            </div>
            <div className="media-view-switch" role="group" aria-label={t.viewMode}>
              <button type="button" className={viewMode === "grid" ? "active" : ""} aria-label={t.gridView} aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")}>
                <LayoutGrid size={16} aria-hidden="true" />
              </button>
              <button type="button" className={viewMode === "list" ? "active" : ""} aria-label={t.listView} aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")}>
                <List size={16} aria-hidden="true" />
              </button>
            </div>
            <label className="media-sort">
              {t.sortBy}
              <select className="theme-select" value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="popular">{t.popularity}</option>
                <option value="rated">{t.myScore}</option>
              </select>
            </label>
          </div>
        </div>
        {authReady && (
          <div className="media-auth">
            {isAdmin ? (
              <>
                <span>{t.editorSignedIn}</span>
                <button type="button" onClick={logout}><LogOut size={15} /> {t.signOut}</button>
              </>
            ) : user ? (
              <span>{t.noEditPermission}</span>
            ) : supabase ? (
              <button type="button" onClick={login}><LogIn size={16} /> {t.signInToEdit}</button>
            ) : null}
          </div>
        )}
      </header>

      {ratingsError && <p className="media-notice" role="alert">{ratingsError}</p>}
      {authError && <p className="media-notice" role="alert">{authError}</p>}

      {ratedItems.length > 0 && (
        <section className="media-ranking">
          <div className="media-section-heading">
            <h2>{t.topRated}</h2>
            <span>{t.topRatedHint}</span>
          </div>
          <div className={`media-grid${viewMode === "list" ? " media-grid--list" : ""}`}>
            {ratedItems.map((item, index) => (
              <MediaCard key={`${item.provider}:${item.id}`} t={t} item={item} rank={index + 1} viewMode={viewMode} canEdit={isAdmin} onRate={rateMedia} onRemove={removeMedia} onWatchlist={updateWatchlist} busyId={busyId} />
            ))}
          </div>
        </section>
      )}

      {watchlistItems.length > 0 && (
        <section className="media-watchlist">
          <div className="media-section-heading">
            <h2>{t.myList}</h2>
            <span>{t.myListHint}</span>
          </div>
          <div className={`media-grid${viewMode === "list" ? " media-grid--list" : ""}`}>
            {watchlistItems.map(ratingToItem).map((item) => (
              <MediaCard key={`${item.provider}:${item.id}`} t={t} item={item} viewMode={viewMode} canEdit={isAdmin} onRate={rateMedia} onRemove={removeMedia} onWatchlist={updateWatchlist} busyId={busyId} />
            ))}
          </div>
        </section>
      )}

      <section className="media-catalog">
        <div className="media-section-heading">
          <h2>{query.trim() ? t.results : t.trending}</h2>
        </div>

        <div className="media-controls">
          <label className="media-search">
            <Search size={17} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search((isAnime ? t.animes : type === "movie" ? t.movies : t.series).toLowerCase())} />
          </label>
        </div>

        {catalogError && <p className="media-notice" role="alert">{catalogError}</p>}
        {catalogNotice && <p className="media-status" role="status">{catalogNotice}</p>}
        {loading ? (
          <p className="media-status" role="status">{t.loadingCatalog}</p>
        ) : sortedCatalog.length ? (
          <>
            <div className={`media-grid${viewMode === "list" ? " media-grid--list" : ""}`}>
              {sortedCatalog.map((item) => (
                <MediaCard key={`${item.provider}:${item.id}`} t={t} item={item} viewMode={viewMode} canEdit={isAdmin} onRate={rateMedia} onRemove={removeMedia} onWatchlist={updateWatchlist} busyId={busyId} />
              ))}
            </div>
            {hasMore && (
              <button type="button" className="media-load-more" disabled={loadingMore} onClick={loadMore}>
                {loadingMore ? t.loading : t.loadMore}
              </button>
            )}
          </>
        ) : !catalogError && (
          <p className="media-status">{t.noResults}</p>
        )}
      </section>
      <p className="media-attribution">
        {isAnime
          ? <>{t.providedBy} <a href="https://anilist.co/" target="_blank" rel="noopener noreferrer">AniList</a>.</>
          : <>{t.providedBy} <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">TMDB</a>.</>}
      </p>
    </section>
  );
}
