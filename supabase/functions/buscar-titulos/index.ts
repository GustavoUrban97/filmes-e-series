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
const GENERO_ANIMACAO = 16;
const MAX_REFERENCIAS = 8;
const MAX_GENEROS_PEDIDOS = 3;
const MAX_NOME_GENERO = 40;
const MIN_VOTOS_FILME = 500;
const MIN_VOTOS_SERIE = 200;

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

// O TMDB não tem categoria de anime: a regra é gênero Animação e idioma original japonês.
function ehAnime(generos: number[], idioma: unknown) {
  return generos.includes(GENERO_ANIMACAO) && idioma === "ja";
}

// deno-lint-ignore no-explicit-any
function paraResultado(r: any, midia: "movie" | "tv", mapas: Record<string, Record<number, string>>) {
  const data = r.release_date || r.first_air_date || "";
  return {
    id: r.id,
    type: midia === "movie" ? "movie" : "series",
    title: r.title || r.name,
    year: data ? Number(data.slice(0, 4)) : null,
    genres: (r.genre_ids || []).map((id: number) => mapas[midia][id]).filter(Boolean),
    poster: r.poster_path ? POSTER + r.poster_path : null,
    vote: r.vote_average ? Math.round(r.vote_average * 10) / 10 : null,
    anime: ehAnime(r.genre_ids || [], r.original_language),
  };
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
    .map((r: any) => paraResultado(r, r.media_type, mapas));
}

// O TMDB usa um gênero combinado nas séries onde os filmes têm dois separados.
const GENERO_SERIE_DO_FILME: Record<number, number> = { 28: 10759, 12: 10759, 878: 10765, 14: 10765, 10752: 10768 };
const GENEROS_FILME_DA_SERIE: Record<number, number[]> = { 10759: [28, 12], 10765: [878, 14], 10768: [10752] };

function idsDoGenero(nome: string, mapas: Record<string, Record<number, string>>) {
  const procurado = nome.toLowerCase();
  const achar = (mapa: Record<number, string>) =>
    Object.keys(mapa).map(Number).filter((id) => mapa[id].toLowerCase() === procurado);
  const filmes = achar(mapas.movie);
  const series = achar(mapas.tv);
  for (const id of filmes) {
    const serie = GENERO_SERIE_DO_FILME[id];
    if (serie) series.push(serie);
  }
  for (const id of series) filmes.push(...(GENEROS_FILME_DA_SERIE[id] || []));
  return { movie: [...new Set(filmes)], tv: [...new Set(series)] };
}

async function bemAvaliados(midia: "movie" | "tv", ids: number[], mapas: Record<string, Record<number, string>>) {
  const resposta = await tmdb(`/discover/${midia}`, {
    with_genres: ids.join("|"),
    sort_by: "vote_average.desc",
    "vote_count.gte": String(midia === "movie" ? MIN_VOTOS_FILME : MIN_VOTOS_SERIE),
    include_adult: "false",
  });
  // deno-lint-ignore no-explicit-any
  return resposta.results.map((r: any) => paraResultado(r, midia, mapas));
}

// Uma referência que falhe não derruba as demais; só é erro se todas falharem.
async function recomendar(referencias: { id: number; type: string }[], nomesGeneros: string[]) {
  const mapas = await carregarGeneros();

  const pedidosReferencias = referencias.map(async (referencia) => {
    const midia = referencia.type === "movie" ? "movie" : "tv";
    const resposta = await tmdb(`/${midia}/${referencia.id}/recommendations`, {});
    return {
      id: referencia.id,
      type: referencia.type,
      // deno-lint-ignore no-explicit-any
      resultados: resposta.results.map((r: any) => paraResultado(r, midia, mapas)),
    };
  });

  const pedidosGeneros = nomesGeneros.map(async (nome) => {
    const ids = idsDoGenero(nome, mapas);
    const listas = await Promise.all([
      ids.movie.length ? bemAvaliados("movie", ids.movie, mapas) : [],
      ids.tv.length ? bemAvaliados("tv", ids.tv, mapas) : [],
    ]);
    return { nome, resultados: listas.flat() };
  });

  const [porReferencia, porGenero] = await Promise.all([
    Promise.allSettled(pedidosReferencias),
    Promise.allSettled(pedidosGeneros),
  ]);
  const cumpridos = <T>(lista: PromiseSettledResult<T>[]) =>
    lista.flatMap((r) => r.status === "fulfilled" ? [r.value] : []);
  const falhas = [...porReferencia, ...porGenero].filter((r) => r.status === "rejected");
  falhas.forEach((falha) => console.error(String((falha as PromiseRejectedResult).reason)));
  if (falhas.length && falhas.length === porReferencia.length + porGenero.length) {
    throw new Error("Todas as consultas falharam");
  }
  return { referencias: cumpridos(porReferencia), generos: cumpridos(porGenero) };
}

function pedidoValido(pedido: unknown): pedido is { referencias: { id: number; type: string }[]; generos: string[] } {
  if (!pedido || typeof pedido !== "object") return false;
  const { referencias, generos } = pedido as { referencias: unknown; generos: unknown };
  return Array.isArray(referencias) && referencias.length <= MAX_REFERENCIAS &&
    referencias.every((r) => Number.isInteger(r?.id) && r.id > 0 && (r.type === "movie" || r.type === "series")) &&
    Array.isArray(generos) && generos.length <= MAX_GENEROS_PEDIDOS &&
    generos.every((g) => typeof g === "string" && g.length <= MAX_NOME_GENERO);
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
    anime: ehAnime((r.genres || []).map((g: any) => g.id), r.original_language),
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
  let pedidoRecomendacao: unknown;
  try {
    const corpo = await requisicao.json();
    consulta = typeof corpo.q === "string" ? corpo.q.trim().slice(0, MAX_CONSULTA) : "";
    id = corpo.id;
    tipo = corpo.type;
    temporada = corpo.season;
    pedidoRecomendacao = corpo.recomendar;
  } catch {
    return responder({ erro: "Requisição inválida." }, 400);
  }

  if (pedidoRecomendacao !== undefined) {
    if (!pedidoValido(pedidoRecomendacao)) return responder({ erro: "Requisição inválida." }, 400);
    try {
      return responder({
        recomendacoes: await recomendar(pedidoRecomendacao.referencias, pedidoRecomendacao.generos),
      });
    } catch (erro) {
      console.error(String(erro));
      return responder({ erro: "Falha ao consultar o TMDB." }, 502);
    }
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
