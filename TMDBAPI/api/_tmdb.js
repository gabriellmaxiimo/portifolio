const API = "https://api.themoviedb.org/3";
export const TMDB_PATH = "/api/tmdb";

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", status === 200 ? "public, max-age=300, s-maxage=300" : "no-store");
  res.end(JSON.stringify(body));
}

export async function handleTmdb(req, res, env = {}) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { error: "method_not_allowed", message: "Use GET." });
  }

  const token = env.TMDB_API_READ_ACCESS_TOKEN?.trim();
  if (!token) {
    return send(res, 503, {
      error: "missing_config",
      message: "Configure TMDB_API_READ_ACCESS_TOKEN nas variáveis de ambiente do servidor.",
    });
  }

  const url = new URL(req.url, "http://localhost");
  const type = url.searchParams.get("type");
  const query = url.searchParams.get("query")?.trim() ?? "";
  const page = Number(url.searchParams.get("page") ?? 1);

  if (!["movie", "tv"].includes(type)) {
    return send(res, 400, { error: "invalid_type", message: "Use type=movie ou type=tv." });
  }
  if (!Number.isInteger(page) || page < 1 || page > 500) {
    return send(res, 400, { error: "invalid_page", message: "A página deve ser um número entre 1 e 500." });
  }

  const endpoint = query ? `/search/${type}` : `/trending/${type}/week`;
  const params = new URLSearchParams({ language: "pt-BR", page: String(page) });
  if (query) params.set("query", query);

  let response;
  try {
    response = await fetch(`${API}${endpoint}?${params}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return send(res, 502, { error: "tmdb_unavailable", message: "Não foi possível conectar ao TMDB." });
  }

  if (!response.ok) {
    console.error(`[tmdb] API respondeu HTTP ${response.status}.`);
    if (response.status === 401) {
      return send(res, 502, {
        error: "invalid_tmdb_token",
        message: "O token do TMDB é inválido ou não autorizado. Configure um Read Access Token válido em TMDB_API_READ_ACCESS_TOKEN.",
      });
    }
    return send(res, response.status === 429 ? 429 : 502, {
      error: response.status === 429 ? "rate_limit" : "tmdb_error",
      message: response.status === 429
        ? "Limite de consultas ao TMDB atingido. Tente novamente em instantes."
        : "O TMDB não conseguiu carregar o catálogo.",
    });
  }

  const body = await response.json();
  return send(res, 200, {
    results: body.results ?? [],
    page: body.page ?? page,
    total_pages: body.total_pages ?? 1,
  });
}
