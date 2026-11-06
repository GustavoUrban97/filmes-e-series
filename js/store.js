/* Dados: login, validação, leitura e gravação no Supabase e backup em JSON. Não toca no DOM. */
(function () {
  'use strict';

  var TABELA = 'titles';
  var TABELA_VISTAS = 'episode_views';
  var TABELA_DISPENSADOS = 'dismissed_titles';
  var CONFLITO_DISPENSADOS = 'user_id,tmdb_id,type';
  var CHAVE_LOCAL_ANTIGA = 'filmes-e-series:v1';
  var APP = 'filmes-e-series';
  var VERSAO = 4;
  var PREFIXO_POSTER = 'https://image.tmdb.org/t/p/';
  var ANO_MINIMO = 1888;
  var TAMANHO_PAGINA = 1000;
  var TAMANHO_LOTE = 500;
  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  var ERRO_CONEXAO = 'Não foi possível acessar o banco de dados. Verifique a internet. ' +
    'Se o site ficou dias sem uso, o projeto pode estar pausado no Supabase.';

  var TIPOS = ['movie', 'series'];
  var SITUACOES = ['watched', 'watching', 'planned'];

  var cliente = null;
  var itens = [];
  var vistas = [];
  var dispensados = [];

  function inteiroOuNulo(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    var numero = Number(valor);
    return Number.isInteger(numero) ? numero : NaN;
  }

  function dataValida(texto) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
    var data = new Date(texto + 'T00:00:00Z');
    return !isNaN(data) && data.toISOString().slice(0, 10) === texto;
  }

  /* Devolve { item } com os campos normalizados, ou { erro } com a mensagem para o usuário. */
  function normalizar(entrada) {
    if (!entrada || typeof entrada !== 'object') return { erro: 'Registro inválido.' };

    var titulo = String(entrada.title === undefined || entrada.title === null ? '' : entrada.title).trim();
    if (!titulo) return { erro: 'Informe o título.' };
    if (TIPOS.indexOf(entrada.type) < 0) return { erro: 'Tipo inválido.' };
    if (SITUACOES.indexOf(entrada.status) < 0) return { erro: 'Situação inválida.' };

    var ano = inteiroOuNulo(entrada.year);
    var anoMaximo = new Date().getFullYear() + 5;
    if (ano !== null && !(ano >= ANO_MINIMO && ano <= anoMaximo)) {
      return { erro: 'O ano deve estar entre ' + ANO_MINIMO + ' e ' + anoMaximo + '.' };
    }

    /* Backups da versão 1 chamam a temporada de "seasons". */
    var serie = entrada.type === 'series';
    var temporada = serie ? inteiroOuNulo(entrada.season !== undefined ? entrada.season : entrada.seasons) : null;
    if (temporada !== null && !(temporada >= 0)) {
      return { erro: 'A temporada deve ser um número inteiro.' };
    }
    var episodio = serie ? inteiroOuNulo(entrada.episode) : null;
    if (episodio !== null && !(episodio >= 0)) {
      return { erro: 'O episódio deve ser um número inteiro.' };
    }

    var poster = typeof entrada.posterUrl === 'string' && entrada.posterUrl.indexOf(PREFIXO_POSTER) === 0
      ? entrada.posterUrl
      : null;

    var idTmdb = inteiroOuNulo(entrada.tmdbId);
    if (idTmdb !== null && !(idTmdb > 0)) idTmdb = null;

    var duracao = inteiroOuNulo(entrada.runtime);
    if (duracao !== null && !(duracao > 0)) duracao = null;

    var assistido = entrada.status === 'watched';
    var nota = assistido ? inteiroOuNulo(entrada.rating) : null;
    if (nota !== null && !(nota >= 1 && nota <= 10)) return { erro: 'A nota deve ser de 1 a 10.' };

    var vistoEm = assistido && entrada.watchedOn ? String(entrada.watchedOn) : null;
    if (vistoEm !== null && !dataValida(vistoEm)) return { erro: 'A data informada é inválida.' };

    var generos = Array.isArray(entrada.genres) ? entrada.genres : String(entrada.genres || '').split(',');
    var vistos = {};
    generos = generos
      .map(function (g) { return String(g).trim(); })
      .filter(function (g) {
        var chave = g.toLocaleLowerCase('pt-BR');
        if (!g || vistos[chave]) return false;
        vistos[chave] = true;
        return true;
      });

    var agora = new Date().toISOString();
    return {
      item: {
        id: UUID.test(String(entrada.id)) ? String(entrada.id) : crypto.randomUUID(),
        title: titulo,
        type: entrada.type,
        status: entrada.status,
        year: ano,
        season: temporada,
        episode: episodio,
        posterUrl: poster,
        tmdbId: idTmdb,
        director: String(entrada.director || '').trim() || null,
        runtime: duracao,
        rating: nota,
        watchedOn: vistoEm,
        genres: generos,
        notes: String(entrada.notes || '').trim(),
        createdAt: entrada.createdAt || agora,
        updatedAt: entrada.updatedAt || agora
      }
    };
  }

  function paraLinha(item) {
    return {
      id: item.id,
      title: item.title,
      type: item.type,
      status: item.status,
      year: item.year,
      season: item.season,
      episode: item.episode,
      poster_url: item.posterUrl,
      tmdb_id: item.tmdbId,
      director: item.director,
      runtime: item.runtime,
      rating: item.rating,
      watched_on: item.watchedOn,
      genres: item.genres,
      notes: item.notes,
      created_at: item.createdAt,
      updated_at: item.updatedAt
    };
  }

  function daLinha(linha) {
    return {
      id: linha.id,
      title: linha.title,
      type: linha.type,
      status: linha.status,
      year: linha.year,
      season: linha.season,
      episode: linha.episode,
      posterUrl: linha.poster_url,
      tmdbId: linha.tmdb_id,
      director: linha.director,
      runtime: linha.runtime,
      rating: linha.rating,
      watchedOn: linha.watched_on,
      genres: linha.genres,
      notes: linha.notes,
      createdAt: linha.created_at,
      updatedAt: linha.updated_at
    };
  }

  function daLinhaVista(linha) {
    return {
      titleId: linha.title_id,
      season: linha.season,
      episode: linha.episode,
      watchedOn: linha.watched_on,
      rating: linha.rating,
      runtime: linha.runtime,
      updatedAt: linha.updated_at
    };
  }

  function paraLinhaVista(vista) {
    return {
      title_id: vista.titleId,
      season: vista.season,
      episode: vista.episode,
      watched_on: vista.watchedOn,
      rating: vista.rating,
      runtime: vista.runtime,
      updated_at: vista.updatedAt
    };
  }

  /* Devolve a vista normalizada, ou null se o registro for inválido. */
  function normalizarVista(entrada) {
    if (!entrada || !UUID.test(String(entrada.titleId))) return null;
    var temporada = inteiroOuNulo(entrada.season);
    var episodio = inteiroOuNulo(entrada.episode);
    if (!(temporada >= 0) || temporada === null || !(episodio >= 0) || episodio === null) return null;
    if (!dataValida(String(entrada.watchedOn))) return null;
    var nota = inteiroOuNulo(entrada.rating);
    if (nota !== null && !(nota >= 1 && nota <= 10)) return null;
    var duracao = inteiroOuNulo(entrada.runtime);
    return {
      titleId: entrada.titleId,
      season: temporada,
      episode: episodio,
      watchedOn: entrada.watchedOn,
      rating: nota,
      runtime: duracao > 0 ? duracao : null,
      updatedAt: entrada.updatedAt || new Date().toISOString()
    };
  }

  function configurado() {
    var c = window.APP_CONFIG || {};
    return Boolean(c.supabaseUrl && c.supabasePublishableKey);
  }

  function iniciar() {
    if (cliente) return true;
    if (!configurado() || !window.supabase) return false;
    cliente = window.supabase.createClient(window.APP_CONFIG.supabaseUrl, window.APP_CONFIG.supabasePublishableKey);
    return true;
  }

  async function usuarioAtual() {
    var resposta = await cliente.auth.getSession();
    return resposta.data.session ? resposta.data.session.user : null;
  }

  function aoMudarSessao(callback) {
    cliente.auth.onAuthStateChange(function (evento, sessao) {
      /* O setTimeout evita chamar o Supabase de dentro do próprio callback de autenticação. */
      setTimeout(function () { callback(sessao ? sessao.user : null); }, 0);
    });
  }

  async function entrar(email, senha) {
    try {
      var resposta = await cliente.auth.signInWithPassword({ email: email, password: senha });
      if (!resposta.error) return {};
      if (resposta.error.status === 400) return { erro: 'E-mail ou senha incorretos.' };
      if (resposta.error.status === 429) return { erro: 'Muitas tentativas. Aguarde um pouco e tente de novo.' };
      return { erro: ERRO_CONEXAO };
    } catch (e) {
      return { erro: ERRO_CONEXAO };
    }
  }

  async function sair() {
    itens = [];
    vistas = [];
    dispensados = [];
    /* Encerra só este aparelho, inclusive se o servidor estiver fora do ar. */
    await cliente.auth.signOut({ scope: 'local' });
  }

  /* Lê a tabela inteira em páginas, porque a API limita cada resposta. Devolve null se falhar. */
  async function lerTudo(tabela) {
    var todos = [];
    for (var inicio = 0; ; inicio += TAMANHO_PAGINA) {
      var resposta = await cliente.from(tabela).select('*')
        .order('id')
        .range(inicio, inicio + TAMANHO_PAGINA - 1);
      if (resposta.error) return null;
      todos = todos.concat(resposta.data);
      if (resposta.data.length < TAMANHO_PAGINA) return todos;
    }
  }

  async function carregar() {
    try {
      var linhas = await Promise.all([lerTudo(TABELA), lerTudo(TABELA_VISTAS), lerTudo(TABELA_DISPENSADOS)]);
      if (!linhas[0] || !linhas[1] || !linhas[2]) return { erro: ERRO_CONEXAO };
      itens = linhas[0].map(daLinha);
      vistas = linhas[1].map(daLinhaVista);
      dispensados = linhas[2].map(function (linha) {
        return { tmdbId: linha.tmdb_id, type: linha.type, createdAt: linha.created_at };
      });
      return {};
    } catch (e) {
      return { erro: ERRO_CONEXAO };
    }
  }

  async function salvar(entrada) {
    var existente = entrada.id ? obter(entrada.id) : null;
    var resultado = normalizar(Object.assign({}, entrada, {
      createdAt: existente ? existente.createdAt : undefined,
      updatedAt: new Date().toISOString()
    }));
    if (resultado.erro) return resultado;

    try {
      var resposta = await cliente.from(TABELA).upsert(paraLinha(resultado.item)).select().single();
      if (resposta.error) return { erro: 'Não foi possível salvar. ' + ERRO_CONEXAO };
      var salvo = daLinha(resposta.data);
      if (existente) itens[itens.indexOf(existente)] = salvo;
      else itens.push(salvo);
      return { item: salvo };
    } catch (e) {
      return { erro: 'Não foi possível salvar. ' + ERRO_CONEXAO };
    }
  }

  async function remover(id) {
    try {
      var resposta = await cliente.from(TABELA).delete().eq('id', id);
      if (resposta.error) return { erro: 'Não foi possível excluir. ' + ERRO_CONEXAO };
      itens = itens.filter(function (item) { return item.id !== id; });
      vistas = vistas.filter(function (vista) { return vista.titleId !== id; });
      return {};
    } catch (e) {
      return { erro: 'Não foi possível excluir. ' + ERRO_CONEXAO };
    }
  }

  /* A busca passa por uma função no Supabase, que guarda o token do TMDB fora do site. */
  async function buscarTitulos(consulta) {
    try {
      var resposta = await cliente.functions.invoke('swift-handler', { body: { q: consulta } });
      if (resposta.error || !resposta.data || !Array.isArray(resposta.data.resultados)) {
        return { erro: 'A busca não está disponível agora. Você pode preencher os campos manualmente.' };
      }
      return { resultados: resposta.data.resultados };
    } catch (e) {
      return { erro: 'A busca não está disponível agora. Você pode preencher os campos manualmente.' };
    }
  }

  function listarVistas(idTitulo) {
    return idTitulo
      ? vistas.filter(function (vista) { return vista.titleId === idTitulo; })
      : vistas.slice();
  }

  function mesmaVista(a, b) {
    return a.titleId === b.titleId && a.season === b.season && a.episode === b.episode;
  }

  function guardarVistaLocal(vista) {
    vistas = vistas.filter(function (v) { return !mesmaVista(v, vista); });
    vistas.push(vista);
  }

  /* O progresso do título acompanha o episódio visto mais adiantado. */
  async function sincronizarProgresso(idTitulo) {
    var item = obter(idTitulo);
    var ultimo = listarVistas(idTitulo).sort(function (a, b) {
      return b.season - a.season || b.episode - a.episode;
    })[0];
    var mudancas = {
      season: ultimo ? ultimo.season : null,
      episode: ultimo ? ultimo.episode : null
    };
    if (ultimo && item.status === 'planned') mudancas.status = 'watching';
    return salvar(Object.assign({}, item, mudancas));
  }

  /* Grava os episódios um pedido por vez: cliques rápidos não sobrescrevem uns aos outros. */
  var filaVistas = Promise.resolve();

  function enfileirar(tarefa) {
    var resultado = filaVistas.then(tarefa);
    filaVistas = resultado.catch(function () {});
    return resultado;
  }

  function marcarEpisodios(idTitulo, entradas) {
    return enfileirar(function () { return gravarEpisodios(idTitulo, entradas); });
  }

  function atualizarVista(vista, mudancas) {
    return enfileirar(function () { return gravarMudancaVista(vista, mudancas); });
  }

  function desmarcarEpisodio(idTitulo, temporada, episodio) {
    return enfileirar(function () { return apagarVista(idTitulo, temporada, episodio); });
  }

  /* Registra episódios de um título e atualiza o progresso. entradas: {season, episode, watchedOn, runtime}. */
  async function gravarEpisodios(idTitulo, entradas) {
    var novas = entradas.map(function (entrada) {
      return normalizarVista(Object.assign({ rating: null }, entrada, { titleId: idTitulo, updatedAt: null }));
    }).filter(Boolean);
    if (!novas.length) return { erro: 'Episódio inválido.' };
    try {
      for (var i = 0; i < novas.length; i += TAMANHO_LOTE) {
        var resposta = await cliente.from(TABELA_VISTAS)
          .upsert(novas.slice(i, i + TAMANHO_LOTE).map(paraLinhaVista), { onConflict: 'title_id,season,episode' });
        if (resposta.error) return { erro: 'Não foi possível marcar. ' + ERRO_CONEXAO };
      }
    } catch (e) {
      return { erro: 'Não foi possível marcar. ' + ERRO_CONEXAO };
    }
    novas.forEach(guardarVistaLocal);
    return sincronizarProgresso(idTitulo);
  }

  /* Altera a data ou a nota de um episódio já marcado, sempre a partir da versão mais recente. */
  async function gravarMudancaVista(vista, mudancas) {
    var atual = vistas.filter(function (v) { return mesmaVista(v, vista); })[0] || vista;
    var nova = normalizarVista(Object.assign({}, atual, mudancas, { updatedAt: new Date().toISOString() }));
    if (!nova) return { erro: 'Data ou nota inválida.' };
    try {
      var resposta = await cliente.from(TABELA_VISTAS)
        .upsert(paraLinhaVista(nova), { onConflict: 'title_id,season,episode' });
      if (resposta.error) return { erro: 'Não foi possível salvar. ' + ERRO_CONEXAO };
    } catch (e) {
      return { erro: 'Não foi possível salvar. ' + ERRO_CONEXAO };
    }
    guardarVistaLocal(nova);
    return { vista: nova };
  }

  async function apagarVista(idTitulo, temporada, episodio) {
    try {
      var resposta = await cliente.from(TABELA_VISTAS).delete()
        .eq('title_id', idTitulo).eq('season', temporada).eq('episode', episodio);
      if (resposta.error) return { erro: 'Não foi possível desmarcar. ' + ERRO_CONEXAO };
    } catch (e) {
      return { erro: 'Não foi possível desmarcar. ' + ERRO_CONEXAO };
    }
    vistas = vistas.filter(function (v) {
      return !(v.titleId === idTitulo && v.season === temporada && v.episode === episodio);
    });
    return sincronizarProgresso(idTitulo);
  }

  var temporadasEmCache = {};

  async function buscarTemporada(idTmdb, numero) {
    var chave = idTmdb + ':' + numero;
    if (temporadasEmCache[chave]) return { temporada: temporadasEmCache[chave] };
    try {
      var resposta = await cliente.functions.invoke('swift-handler', { body: { id: idTmdb, type: 'series', season: numero } });
      if (resposta.error || !resposta.data || !resposta.data.temporada) {
        return { erro: 'Não foi possível carregar os episódios agora.' };
      }
      temporadasEmCache[chave] = resposta.data.temporada;
      return { temporada: resposta.data.temporada };
    } catch (e) {
      return { erro: 'Não foi possível carregar os episódios agora.' };
    }
  }

  var detalhesEmCache = {};

  async function buscarDetalhes(idTmdb, tipo) {
    var chave = tipo + ':' + idTmdb;
    if (detalhesEmCache[chave]) return { detalhes: detalhesEmCache[chave] };
    try {
      var resposta = await cliente.functions.invoke('swift-handler', { body: { id: idTmdb, type: tipo } });
      if (resposta.error || !resposta.data || !resposta.data.detalhes) {
        return { erro: 'Não foi possível carregar os dados do TMDB agora.' };
      }
      detalhesEmCache[chave] = resposta.data.detalhes;
      return { detalhes: resposta.data.detalhes };
    } catch (e) {
      return { erro: 'Não foi possível carregar os dados do TMDB agora.' };
    }
  }

  var ERRO_RECOMENDACOES = 'Não foi possível buscar recomendações agora.';
  var recomendacoesEmCache = {};

  async function buscarRecomendacoes(pedido) {
    var chave = JSON.stringify(pedido);
    if (recomendacoesEmCache[chave]) return { recomendacoes: recomendacoesEmCache[chave] };
    try {
      var resposta = await cliente.functions.invoke('swift-handler', { body: { recomendar: pedido } });
      if (resposta.error || !resposta.data || !resposta.data.recomendacoes) return { erro: ERRO_RECOMENDACOES };
      recomendacoesEmCache[chave] = resposta.data.recomendacoes;
      return { recomendacoes: resposta.data.recomendacoes };
    } catch (e) {
      return { erro: ERRO_RECOMENDACOES };
    }
  }

  async function dispensar(idTmdb, tipo) {
    var erro = { erro: 'Não foi possível dispensar. ' + ERRO_CONEXAO };
    try {
      var resposta = await cliente.from(TABELA_DISPENSADOS)
        .upsert({ tmdb_id: idTmdb, type: tipo }, { onConflict: CONFLITO_DISPENSADOS, ignoreDuplicates: true });
      if (resposta.error) return erro;
    } catch (e) {
      return erro;
    }
    dispensados.push({ tmdbId: idTmdb, type: tipo, createdAt: new Date().toISOString() });
    return {};
  }

  async function restaurarDispensados() {
    var erro = { erro: 'Não foi possível restaurar. ' + ERRO_CONEXAO };
    try {
      /* A API exige um filtro; as regras do banco limitam a exclusão às linhas da conta. */
      var resposta = await cliente.from(TABELA_DISPENSADOS).delete().gt('tmdb_id', 0);
      if (resposta.error) return erro;
    } catch (e) {
      return erro;
    }
    dispensados = [];
    return {};
  }

  function obter(id) {
    return itens.filter(function (item) { return item.id === id; })[0] || null;
  }

  function exportar() {
    return JSON.stringify({
      app: APP,
      version: VERSAO,
      exportedAt: new Date().toISOString(),
      items: itens,
      episodeViews: vistas,
      dismissed: dispensados
    }, null, 2);
  }

  /* Só acrescenta: um título dispensado continua dispensado. Devolve quantos registros eram inválidos. */
  async function mesclarDispensados(lista) {
    var linhas = [];
    var ignorados = 0;
    (Array.isArray(lista) ? lista : []).forEach(function (entrada) {
      var id = entrada ? inteiroOuNulo(entrada.tmdbId) : null;
      if (id > 0 && TIPOS.indexOf(entrada.type) >= 0) linhas.push({ tmdb_id: id, type: entrada.type });
      else ignorados++;
    });
    for (var i = 0; i < linhas.length; i += TAMANHO_LOTE) {
      var resposta = await cliente.from(TABELA_DISPENSADOS).upsert(linhas.slice(i, i + TAMANHO_LOTE),
        { onConflict: CONFLITO_DISPENSADOS, ignoreDuplicates: true });
      if (resposta.error) return { erro: 'A importação dos dispensados foi interrompida. ' + ERRO_CONEXAO };
    }
    return { total: linhas.length, ignorados: ignorados };
  }

  /* Mescla pelo id: registros novos entram e, em conflito, vale o editado por último. */
  async function mesclarVistas(lista) {
    var linhas = [];
    var ignoradas = 0;
    (Array.isArray(lista) ? lista : []).forEach(function (entrada) {
      var vista = normalizarVista(entrada);
      if (!vista || !obter(vista.titleId)) {
        ignoradas++;
        return;
      }
      var atual = vistas.filter(function (v) { return mesmaVista(v, vista); })[0];
      if (!atual || new Date(vista.updatedAt) > new Date(atual.updatedAt)) linhas.push(paraLinhaVista(vista));
    });
    for (var i = 0; i < linhas.length; i += TAMANHO_LOTE) {
      var resposta = await cliente.from(TABELA_VISTAS)
        .upsert(linhas.slice(i, i + TAMANHO_LOTE), { onConflict: 'title_id,season,episode' });
      if (resposta.error) return { erro: 'A importação dos episódios foi interrompida. ' + ERRO_CONEXAO };
    }
    return { episodios: linhas.length, ignorados: ignoradas };
  }

  async function mesclar(lista, listaVistas, listaDispensados) {
    var adicionados = 0;
    var atualizados = 0;
    var ignorados = 0;
    var linhas = [];

    lista.forEach(function (entrada) {
      var resultado = normalizar(entrada);
      if (resultado.erro) {
        ignorados++;
        return;
      }
      var atual = obter(resultado.item.id);
      if (!atual) {
        adicionados++;
      } else if (new Date(resultado.item.updatedAt) > new Date(atual.updatedAt)) {
        atualizados++;
      } else {
        return;
      }
      linhas.push(paraLinha(resultado.item));
    });

    try {
      for (var i = 0; i < linhas.length; i += TAMANHO_LOTE) {
        var resposta = await cliente.from(TABELA).upsert(linhas.slice(i, i + TAMANHO_LOTE));
        if (resposta.error) {
          await carregar();
          return { erro: 'A importação foi interrompida. ' + ERRO_CONEXAO };
        }
      }
    } catch (e) {
      await carregar();
      return { erro: 'A importação foi interrompida. ' + ERRO_CONEXAO };
    }

    var recarga = await carregar();
    if (recarga.erro) return recarga;

    var episodios = 0;
    var novosDispensados = 0;
    try {
      var resultadoVistas = await mesclarVistas(listaVistas);
      if (resultadoVistas.erro) return resultadoVistas;
      episodios = resultadoVistas.episodios;
      ignorados += resultadoVistas.ignorados;
      var resultadoDispensados = await mesclarDispensados(listaDispensados);
      if (resultadoDispensados.erro) return resultadoDispensados;
      novosDispensados = resultadoDispensados.total;
      ignorados += resultadoDispensados.ignorados;
    } catch (e) {
      return { erro: 'A importação dos episódios foi interrompida. ' + ERRO_CONEXAO };
    }
    if (episodios || novosDispensados) {
      recarga = await carregar();
      if (recarga.erro) return recarga;
    }

    return { adicionados: adicionados, atualizados: atualizados, ignorados: ignorados, episodios: episodios };
  }

  function importar(texto) {
    var dados;
    try {
      dados = JSON.parse(texto);
    } catch (e) {
      return Promise.resolve({ erro: 'O arquivo não é um JSON válido.' });
    }
    if (!dados || dados.app !== APP || !Array.isArray(dados.items)) {
      return Promise.resolve({ erro: 'Este arquivo não é um backup do Filmes e Séries.' });
    }
    if (dados.version > VERSAO) {
      return Promise.resolve({ erro: 'Este backup foi criado por uma versão mais nova do site.' });
    }
    return mesclar(dados.items, dados.episodeViews, dados.dismissed);
  }

  /* Lista da versão anterior do site, que guardava os títulos no navegador. */
  function lerListaAntiga() {
    try {
      var dados = JSON.parse(localStorage.getItem(CHAVE_LOCAL_ANTIGA));
      return dados && Array.isArray(dados.items) ? dados.items : [];
    } catch (e) {
      return [];
    }
  }

  async function enviarListaAntiga() {
    var resultado = await mesclar(lerListaAntiga());
    if (!resultado.erro) apagarListaAntiga();
    return resultado;
  }

  function apagarListaAntiga() {
    try {
      localStorage.removeItem(CHAVE_LOCAL_ANTIGA);
    } catch (e) { /* Sem acesso ao armazenamento, não há o que apagar. */ }
  }

  window.Store = {
    configurado: configurado,
    iniciar: iniciar,
    usuarioAtual: usuarioAtual,
    aoMudarSessao: aoMudarSessao,
    entrar: entrar,
    sair: sair,
    carregar: carregar,
    salvar: salvar,
    remover: remover,
    buscarTitulos: buscarTitulos,
    buscarDetalhes: buscarDetalhes,
    buscarTemporada: buscarTemporada,
    buscarRecomendacoes: buscarRecomendacoes,
    dispensar: dispensar,
    restaurarDispensados: restaurarDispensados,
    listarDispensados: function () { return dispensados.slice(); },
    listarVistas: listarVistas,
    marcarEpisodios: marcarEpisodios,
    atualizarVista: atualizarVista,
    desmarcarEpisodio: desmarcarEpisodio,
    obter: obter,
    exportar: exportar,
    importar: importar,
    lerListaAntiga: lerListaAntiga,
    enviarListaAntiga: enviarListaAntiga,
    apagarListaAntiga: apagarListaAntiga,
    listar: function () { return itens.slice(); }
  };
})();
