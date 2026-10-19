import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

export const supabaseMissingSettings = [
  !supabaseUrl && "VITE_SUPABASE_URL",
  !supabaseAnonKey && "VITE_SUPABASE_ANON_KEY",
].filter(Boolean);

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function formatMediaStorageError(error) {
  const message = error?.message ?? "Erro desconhecido ao acessar o Supabase.";
  if (
    message.includes("schema cache")
    && ["media_ratings", "media_admins", "media_catalog_cache"].some((table) => message.includes(table))
  ) {
    return "As tabelas do Supabase ainda não foram criadas ou atualizadas. No SQL Editor do projeto Supabase conectado, execute supabase/migrations/202610190001_media_ratings.sql. Depois, cadastre seu usuário GitHub como administrador seguindo supabase/README.md e recarregue esta página.";
  }
  return message;
}

export async function fetchTmdbCatalog({ type, query = "", page = 1, signal }) {
  const params = new URLSearchParams({ type, page: String(page) });
  if (query) params.set("query", query);
  const response = await fetch(`/api/tmdb?${params}`, { signal });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? `TMDB respondeu HTTP ${response.status}.`);
  return body;
}

const ANILIST_QUERY = `
  query ($page: Int!, $search: String) {
    Page(page: $page, perPage: 24) {
      pageInfo { currentPage hasNextPage }
      media(type: ANIME, sort: TRENDING_DESC, search: $search) {
        id
        title { romaji english native }
        description(asHtml: false)
        coverImage { large }
        startDate { year }
        averageScore
        popularity
        siteUrl
      }
    }
  }
`;

export async function fetchAnilistCatalog({ query = "", page = 1, signal }) {
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query: ANILIST_QUERY,
      variables: { page, search: query || undefined },
    }),
    signal,
  });
  const body = await response.json();
  if (!response.ok || body.errors?.length) {
    throw new Error(body.errors?.[0]?.message ?? `AniList respondeu HTTP ${response.status}.`);
  }
  return {
    results: body.data.Page.media,
    page: body.data.Page.pageInfo.currentPage,
    hasNextPage: body.data.Page.pageInfo.hasNextPage,
  };
}

export async function fetchMediaRatings(providers) {
  if (!supabase) throw new Error(`Configure ${supabaseMissingSettings.join(" e ")} para ativar as avaliações.`);
  const { data, error } = await supabase
    .from("media_ratings")
    .select("provider, catalog_id, title, poster_url, release_year, overview, score, watchlist_status, updated_at")
    .in("provider", providers)
    .order("score", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveMediaRating(media, score) {
  if (!supabase) throw new Error(`Configure ${supabaseMissingSettings.join(" e ")} para ativar as avaliações.`);
  if (score !== null && (!Number.isInteger(score) || score < 0 || score > 100)) {
    throw new Error("A nota deve ser um número inteiro entre 0 e 100.");
  }
  const identity = { provider: media.provider, catalog_id: String(media.id) };
  const { error } = await supabase.from("media_ratings").upsert({
    ...identity,
    title: media.title,
    poster_url: media.posterUrl,
    release_year: media.year,
    overview: media.overview,
    score,
    updated_at: new Date().toISOString(),
  }, { onConflict: "provider,catalog_id" });
  if (error) throw error;
}

export async function removeMediaRating(media) {
  if (!supabase) throw new Error(`Configure ${supabaseMissingSettings.join(" e ")} para ativar as avaliações.`);
  const { error } = await supabase
    .from("media_ratings")
    .delete()
    .match({ provider: media.provider, catalog_id: String(media.id) });
  if (error) throw error;
}

export async function setMediaWatchlist(media, watchlistStatus) {
  if (!supabase) throw new Error(`Configure ${supabaseMissingSettings.join(" e ")} para ativar a lista pessoal.`);
  if (watchlistStatus !== null && watchlistStatus !== "watchlist") {
    throw new Error("Estado da lista inválido.");
  }
  const identity = { provider: media.provider, catalog_id: String(media.id) };
  if (watchlistStatus === null && !media.rated) {
    const { error } = await supabase.from("media_ratings").delete().match(identity);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("media_ratings").upsert({
    ...identity,
    title: media.title,
    poster_url: media.posterUrl,
    release_year: media.year,
    overview: media.overview,
    score: media.rated ? media.score : null,
    watchlist_status: watchlistStatus,
    updated_at: new Date().toISOString(),
  }, { onConflict: "provider,catalog_id" });
  if (error) throw error;
}

export async function fetchMediaCatalogCache(providers, query = "") {
  if (!supabase) throw new Error(`Configure ${supabaseMissingSettings.join(" e ")} para ativar o cache.`);
  let request = supabase
    .from("media_catalog_cache")
    .select("provider, catalog_id, title, poster_url, release_year, overview, popularity")
    .in("provider", providers)
    .order("popularity", { ascending: false })
    .limit(48);
  if (query) request = request.ilike("title", `%${query}%`);
  const { data, error } = await request;
  if (error) throw error;
  return data;
}

export async function cacheMediaCatalog(items) {
  if (!supabase || !items.length) return;
  const { error } = await supabase.from("media_catalog_cache").upsert(items.map((item) => ({
    provider: item.provider,
    catalog_id: String(item.id),
    title: item.title,
    poster_url: item.posterUrl,
    release_year: item.year,
    overview: item.overview,
    popularity: item.popularity,
    cached_at: new Date().toISOString(),
  })), { onConflict: "provider,catalog_id" });
  if (error) throw error;
}

export async function signInWithGitHub() {
  if (!supabase) throw new Error(`Configure ${supabaseMissingSettings.join(" e ")} para ativar o login.`);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOutFromSupabase() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function isMediaAdmin(userId) {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("media_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
