import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, List, LogIn, LogOut, Search } from "lucide-react";
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
import "./MediaLibrary.css";

const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";

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

function MediaCard({ item, rank, viewMode, canEdit, onRate, onRemove, onWatchlist, busyId }) {
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
      {rank !== undefined && (
        <span className="media-rank-badge" aria-label={`Posição ${rank} no Top 20`}>{rank}</span>
      )}
      {item.posterUrl ? (
        <img className="media-poster" src={item.posterUrl} alt="" loading="lazy" />
      ) : (
        <div className="media-poster media-poster-empty" aria-hidden="true">Sem imagem</div>
      )}
      <div className="media-card-content">
        <div className="media-card-heading">
          <h3>{item.title}</h3>
          {item.year && <span>{item.year}</span>}
        </div>
        <p className="media-overview">{item.overview || "Sinopse indisponível."}</p>
        <a className="media-external-link" href={item.externalUrl} target="_blank" rel="noopener noreferrer">
          Ver detalhes
        </a>
        <div className={`media-rating media-rating--${scoreBand}`} aria-label={item.rated ? `Sua nota: ${item.score} de 100` : "Ainda não avaliado"}>
          <div className="media-rating-heading">
            <span className="media-rating-label">{canEdit ? "Sua nota" : item.rated ? "Sua nota" : "Ainda não avaliado"}</span>
            <strong className="media-score-value">
              {item.rated || canEdit ? displayedScore : "—"}
              <span>/100</span>
            </strong>
          </div>
          <div
            className="media-score-track"
            role="progressbar"
            aria-label={item.rated ? `Nota ${displayedScore} de 100` : "Sem nota"}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={displayedScore}
          >
            <span className="media-score-progress" style={{ width: `${displayedScore}%` }} />
          </div>
          {canEdit && (
            <>
              <label className="media-score-control">
                <span className="sr-only">Nota de 0 a 100 para {item.title}</span>
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
                >
                  {busy ? "Salvando..." : "Salvar nota"}
                </button>
                {(item.rated || item.watchlistStatus) && (
                  <button
                    type="button"
                    className="media-clear-rating"
                    disabled={busy}
                    title="Remover a nota e o título das listas pessoais"
                    onClick={() => onRemove(item)}
                  >
                    Remover
                  </button>
                )}
                <button
                  type="button"
                  className={`media-watchlist-button${item.watchlistStatus === "watchlist" ? " active" : ""}`}
                  disabled={busy}
                  aria-pressed={item.watchlistStatus === "watchlist"}
                  onClick={() => onWatchlist(item, item.watchlistStatus === "watchlist" ? null : "watchlist")}
                >
                  {item.watchlistStatus === "watchlist" && <span aria-hidden="true">✓ </span>}
                  Minha lista
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
  const providers = isAnime
    ? ["anilist"]
    : type === "movie"
      ? ["tmdb_movie"]
      : ["tmdb_tv"];

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
          if (isAdmin) {
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
  }, [isAdmin, isAnime, query, type, providers.join(",")]);

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
  }, [providers.join(",")]);

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
    const nextPage = page + 1;
    setLoadingMore(true);
    setCatalogError("");
    try {
      const result = isAnime
        ? await fetchAnilistCatalog({ query: query.trim(), page: nextPage })
        : await fetchTmdbCatalog({ type, query: query.trim(), page: nextPage });
      setCatalog((current) => [...current, ...result.results]);
      setPage(nextPage);
      setHasMore(isAnime ? result.hasNextPage : nextPage < result.total_pages);
    } catch (error) {
      setCatalogError(error.message);
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

  const heading = "Filmes, Séries e Animes";
  const ratedItems = rankedRatings.map((rating) => ({
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
  }));

  return (
    <section className="media-library animate-fade-in w-full">
      <header className="media-library-header">
        <div>
          <h1 className={`text-3xl font-light tracking-tight ${themeClasses.accent}`}>{heading}</h1>
          <p>Ranking e avaliação pessoal de 0 a 100.</p>
          <div className="media-library-options">
            <div className="media-type-switch" role="group" aria-label="Tipo de catálogo">
              <button type="button" className={type === "movie" ? "active" : ""} aria-pressed={type === "movie"} onClick={() => setType("movie")}>Filmes</button>
              <button type="button" className={type === "tv" ? "active" : ""} aria-pressed={type === "tv"} onClick={() => setType("tv")}>Séries</button>
              <button type="button" className={type === "anime" ? "active" : ""} aria-pressed={type === "anime"} onClick={() => setType("anime")}>Animes</button>
            </div>
            <div className="media-view-switch" role="group" aria-label="Modo de visualização">
              <button type="button" className={viewMode === "grid" ? "active" : ""} aria-label="Exibir em cards com capas" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")}>
                <LayoutGrid size={16} aria-hidden="true" />
              </button>
              <button type="button" className={viewMode === "list" ? "active" : ""} aria-label="Exibir em lista sem capas" aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")}>
                <List size={16} aria-hidden="true" />
              </button>
            </div>
            <label className="media-sort">
              Ordenar:
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="popular">Popularidade</option>
                <option value="rated">Minha nota</option>
              </select>
            </label>
          </div>
        </div>
        {authReady && (
          <div className="media-auth">
            {isAdmin ? (
              <>
                <span>Editor autenticado pelo GitHub</span>
                <button type="button" onClick={logout}><LogOut size={15} /> Sair</button>
              </>
            ) : user ? (
              <span>Conta GitHub conectada sem permissão de edição.</span>
            ) : supabase ? (
              <button type="button" onClick={login}><LogIn size={16} /> Entrar com GitHub para editar</button>
            ) : null}
          </div>
        )}
      </header>

      {ratingsError && <p className="media-notice" role="alert">{ratingsError}</p>}
      {authError && <p className="media-notice" role="alert">{authError}</p>}

      {ratedItems.length > 0 && (
        <section className="media-ranking">
          <div className="media-section-heading">
            <h2>Meus melhores avaliados</h2>
            <span>Ordenados pela sua nota</span>
          </div>
          <div className={`media-grid${viewMode === "list" ? " media-grid--list" : ""}`}>
            {ratedItems.map((item, index) => (
              <MediaCard key={`${item.provider}:${item.id}`} item={item} rank={index + 1} viewMode={viewMode} canEdit={isAdmin} onRate={rateMedia} onRemove={removeMedia} onWatchlist={updateWatchlist} busyId={busyId} />
            ))}
          </div>
        </section>
      )}

      {watchlistItems.length > 0 && (
        <section className="media-watchlist">
          <div className="media-section-heading">
            <h2>Minha lista</h2>
            <span>Títulos salvos</span>
          </div>
          <div className={`media-grid${viewMode === "list" ? " media-grid--list" : ""}`}>
            {watchlistItems.map((rating) => {
              const item = {
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
              return (
                <MediaCard key={`${item.provider}:${item.id}`} item={item} viewMode={viewMode} canEdit={isAdmin} onRate={rateMedia} onRemove={removeMedia} onWatchlist={updateWatchlist} busyId={busyId} />
              );
            })}
          </div>
        </section>
      )}

      <section className="media-catalog">
        <div className="media-section-heading">
          <h2>{query.trim() ? "Resultados" : "Em alta"}</h2>
        </div>

        <div className="media-controls">
          <label className="media-search">
            <Search size={17} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar ${isAnime ? "animes" : type === "movie" ? "filmes" : "séries"}...`} />
          </label>
        </div>

        {catalogError && <p className="media-notice" role="alert">{catalogError}</p>}
        {catalogNotice && <p className="media-status" role="status">{catalogNotice}</p>}
        {loading ? (
          <p className="media-status" role="status">Carregando catálogo...</p>
        ) : sortedCatalog.length ? (
          <>
            <div className={`media-grid${viewMode === "list" ? " media-grid--list" : ""}`}>
              {sortedCatalog.map((item) => (
                <MediaCard key={`${item.provider}:${item.id}`} item={item} viewMode={viewMode} canEdit={isAdmin} onRate={rateMedia} onRemove={removeMedia} onWatchlist={updateWatchlist} busyId={busyId} />
              ))}
            </div>
            {hasMore && (
              <button type="button" className="media-load-more" disabled={loadingMore} onClick={loadMore}>
                {loadingMore ? "Carregando..." : "Carregar mais"}
              </button>
            )}
          </>
        ) : !catalogError && (
          <p className="media-status">Nenhum título encontrado.</p>
        )}
      </section>
      <p className="media-attribution">
        {isAnime
          ? <>Catálogo fornecido por <a href="https://anilist.co/" target="_blank" rel="noopener noreferrer">AniList</a>.</>
          : <>Catálogo fornecido por <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">TMDB</a>.</>}
      </p>
    </section>
  );
}
