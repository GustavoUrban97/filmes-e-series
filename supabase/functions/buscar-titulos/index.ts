// Busca filmes e séries no TMDB sem expor o token no site.
// Só atende contas conectadas: a verificação da plataforma também aceita a chave
// pública, que está no código do site, então a função confere o login por conta própria.

const ORIGENS_PERMITIDAS = [
  "https://gustavourban97.github.io",
  "http://localhost:8123",
];
const TMDB = "https://api.themoviedb.org/3";
const POSTER = "https://image.tmdb.org/t/p/w92";
const FUNDO = "https://image.tmdb.org/t/p/w1280";
const MAX_ELENCO = 4;
const IDIOMA = "pt-BR";
const MAX_RESULTADOS = 8;
const MAX_CONSULTA = 100;

const token = Deno.env.get("TMDB_TOKEN");

function cabecalhosCors(origem: string | null): Record<string, string> {
  const cabecalhos: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (origem && ORIGENS_PERMITIDAS.includes(origem)) {
    cabecalhos["Access-Control-Allow-Origin"] = origem;
  }
  return cabecalhos;
}

async function usuarioConectado(requisicao: Request): Promise<boolean> {
  const autorizacao = requisicao.headers.get("Authorization");
  const chave = requisicao.headers.get("apikey");
  if (!autorizacao || !chave) return false;
  const resposta = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
    headers: { Authorization: autorizacao, apikey: chave },
  });
  return resposta.ok;
}

async function tmdb(caminho: string, parametros: Record<string, string>) {
  const url = new URL(TMDB + caminho);
  url.search = new URLSearchParams({ language: IDIOMA, ...parametros }).toString();
  const resposta = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resposta.ok) throw new Error(`TMDB respondeu ${resposta.status}`);
  return await resposta.json();
}

// Os nomes dos gêneros quase nunca mudam: ficam em memória enquanto a função estiver ativa.
let generos: Record<string, Record<number, string>> | null = null;

async function carregarGeneros() {
  if (generos) return generos;
  const [filmes, series] = await Promise.all([tmdb("/genre/movie/list", {}), tmdb("/genre/tv/list", {})]);
  const paraMapa = (lista: { genres: { id: number; name: string }[] }) =>
    Object.fromEntries(lista.genres.map((g) => [g.id, g.name]));
  generos = { movie: paraMapa(filmes), tv: paraMapa(series) };
  return generos;
}

async function buscar(consulta: string) {
  const [resposta, mapas] = await Promise.all([
    tmdb("/search/multi", { query: consulta, include_adult: "false" }),
    carregarGeneros(),
  ]);

  // deno-lint-ignore no-explicit-any
  return resposta.results.filter((r: any) => r.media_type === "movie" || r.media_type === "tv")
    .slice(0, MAX_RESULTADOS)
    // deno-lint-ignore no-explicit-any
    .map((r: any) => {
      const data = r.release_date || r.first_air_date || "";
      return {
        id: r.id,
        type: r.media_type === "movie" ? "movie" : "series",
        title: r.title || r.name,
        year: data ? Number(data.slice(0, 4)) : null,
        genres: (r.genre_ids || []).map((id: number) => mapas[r.media_type][id]).filter(Boolean),
        poster: r.poster_path ? POSTER + r.poster_path : null,
        vote: r.vote_average ? Math.round(r.vote_average * 10) / 10 : null,
      };
    });
}

async function detalhar(id: number, tipo: string) {
  const filme = tipo === "movie";
  const r = await tmdb(`/${filme ? "movie" : "tv"}/${id}`, { append_to_response: "credits" });
  const creditos = r.credits || { cast: [], crew: [] };
  // deno-lint-ignore no-explicit-any
  const nomes = (lista: any[]) => lista.map((p) => p.name).filter(Boolean);

  return {
    id: r.id,
    originalTitle: r.original_title || r.original_name || null,
    overview: r.overview || null,
    runtime: filme ? r.runtime || null : (r.episode_run_time || [])[0] || null,
    vote: r.vote_average ? Math.round(r.vote_average * 10) / 10 : null,
    backdrop: r.backdrop_path ? FUNDO + r.backdrop_path : null,
    // deno-lint-ignore no-explicit-any
    directors: filme ? nomes(creditos.crew.filter((p: any) => p.job === "Director")) : nomes(r.created_by || []),
    cast: nomes(creditos.cast).slice(0, MAX_ELENCO),
    // deno-lint-ignore no-explicit-any
    seasons: filme ? [] : (r.seasons || []).filter((s: any) => s.season_number > 0)
      // deno-lint-ignore no-explicit-any
      .map((s: any) => ({ number: s.season_number, episodes: s.episode_count })),
  };
}

async function detalharTemporada(id: number, numero: number) {
  const r = await tmdb(`/tv/${id}/season/${numero}`, {});
  return {
    number: numero,
    // deno-lint-ignore no-explicit-any
    episodes: (r.episodes || []).map((e: any) => ({
      number: e.episode_number,
      name: e.name || null,
      overview: e.overview || null,
      runtime: e.runtime || null,
    })),
  };
}

Deno.serve(async (requisicao) => {
  const cors = cabecalhosCors(requisicao.headers.get("Origin"));
  const responder = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  if (requisicao.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (requisicao.method !== "POST") return responder({ erro: "Método não permitido." }, 405);
  if (!token) return responder({ erro: "TMDB_TOKEN não configurado." }, 500);

  try {
    if (!(await usuarioConectado(requisicao))) return responder({ erro: "Login necessário." }, 401);
  } catch (erro) {
    console.error(String(erro));
    return responder({ erro: "Não foi possível verificar o login." }, 502);
  }

  let consulta = "";
  let id: unknown;
  let tipo: unknown;
  let temporada: unknown;
  try {
    const corpo = await requisicao.json();
    consulta = typeof corpo.q === "string" ? corpo.q.trim().slice(0, MAX_CONSULTA) : "";
    id = corpo.id;
    tipo = corpo.type;
    temporada = corpo.season;
  } catch {
    return responder({ erro: "Requisição inválida." }, 400);
  }

  const pedeDetalhes = id !== undefined;
  if (pedeDetalhes && !(Number.isInteger(id) && (id as number) > 0 && (tipo === "movie" || tipo === "series"))) {
    return responder({ erro: "Requisição inválida." }, 400);
  }
  const pedeTemporada = temporada !== undefined;
  if (pedeTemporada && !(pedeDetalhes && tipo === "series" && Number.isInteger(temporada) && (temporada as number) >= 0)) {
    return responder({ erro: "Requisição inválida." }, 400);
  }
  if (!pedeDetalhes && consulta.length < 2) return responder({ resultados: [] });

  try {
    if (pedeTemporada) return responder({ temporada: await detalharTemporada(id as number, temporada as number) });
    if (pedeDetalhes) return responder({ detalhes: await detalhar(id as number, tipo as string) });
    return responder({ resultados: await buscar(consulta) });
  } catch (erro) {
    console.error(String(erro));
    return responder({ erro: "Falha ao consultar o TMDB." }, 502);
  }
});
