/* Interface: rotas, biblioteca, detalhes, modal e backup. Texto do usuário só entra via textContent. */
(function () {
  'use strict';

  var ROTULO_TIPO = { movie: 'Filme', series: 'Série' };
  var ROTULO_SITUACAO = { watched: 'Assistido', watching: 'Assistindo', planned: 'Quero ver' };
  var POR_PAGINA = 24;
  var CHAVE_VISTA = 'claquete:vista';
  var ATRASO_BUSCA = 300;
  var MINIMO_BUSCA = 2;

  function el(id) { return document.getElementById(id); }

  var lista = el('lista');
  var dialogo = el('dialogo');
  var busca = el('filtro-busca');
  var filtroGenero = el('filtro-genero');
  var filtroAno = el('filtro-ano');
  var filtroNota = el('filtro-nota');
  var filtroSituacao = el('filtro-situacao');
  var filtroOrdem = el('filtro-ordem');
  var mensagem = el('mensagem');

  var tipoAtivo = '';
  var paginaAtual = 1;
  var temporizadorMensagem = null;

  function criar(tag, classe, texto) {
    var no = document.createElement(tag);
    if (classe) no.className = classe;
    if (texto !== undefined) no.textContent = texto;
    return no;
  }

  function icone(nome) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    var uso = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    uso.setAttribute('href', '#i-' + nome);
    svg.appendChild(uso);
    return svg;
  }

  function avisar(texto) {
    mensagem.textContent = texto;
    mensagem.hidden = false;
    clearTimeout(temporizadorMensagem);
    temporizadorMensagem = setTimeout(function () { mensagem.hidden = true; }, 4000);
  }

  function lerPreferencia(chave) {
    try { return localStorage.getItem(chave); } catch (e) { return null; }
  }

  function gravarPreferencia(chave, valor) {
    try { localStorage.setItem(chave, valor); } catch (e) { /* A preferência vale só até recarregar. */ }
  }

  function mostrarAvisoGeral(texto, comRepeticao) {
    el('aviso-geral-texto').textContent = texto || '';
    el('aviso-geral').hidden = !texto;
    el('aviso-geral-acao').hidden = !comRepeticao;
  }

  /* tela: carregando, login, biblioteca, titulo, diario, estatisticas ou nenhuma. */
  function mostrarTela(tela) {
    var dentro = ['biblioteca', 'titulo', 'diario', 'estatisticas'].indexOf(tela) >= 0;
    el('carregando').hidden = tela !== 'carregando';
    el('tela-login').hidden = tela !== 'login';
    el('tela-biblioteca').hidden = tela !== 'biblioteca';
    el('tela-titulo').hidden = tela !== 'titulo';
    el('tela-diario').hidden = tela !== 'diario';
    el('tela-estatisticas').hidden = tela !== 'estatisticas';
    el('topo').hidden = !dentro;
    el('rodape').hidden = !dentro;
  }

  function semAcento(texto) {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function plural(n, singular, pluralTexto) {
    return n + ' ' + (n === 1 ? singular : pluralTexto);
  }

  /* A nota é guardada de 1 a 10: cada ponto equivale a meia estrela. */
  function formatarEstrelas(nota) {
    return (nota / 2).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  function textoEstrelas(nota) {
    return formatarEstrelas(nota) + (nota === 2 ? ' estrela' : ' estrelas');
  }

  function hojeLocal() {
    var hoje = new Date();
    return hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' +
      String(hoje.getDate()).padStart(2, '0');
  }

  function formatarTempo(minutos) {
    if (minutos < 60) return minutos + ' min';
    return Math.round(minutos / 60).toLocaleString('pt-BR') + ' h';
  }

  /* Soma a duração dos filmes assistidos e dos episódios marcados. */
  function calcularTempo() {
    var minutos = 0;
    var semDuracao = 0;
    Store.listar().forEach(function (i) {
      if (i.type !== 'movie' || i.status !== 'watched') return;
      if (i.runtime) minutos += i.runtime;
      else semDuracao++;
    });
    Store.listarVistas().forEach(function (v) {
      if (v.runtime) minutos += v.runtime;
      else semDuracao++;
    });
    return { minutos: minutos, semDuracao: semDuracao };
  }

  function progressoCurto(item) {
    var partes = [];
    if (item.season !== null) partes.push('T' + item.season);
    if (item.episode !== null) partes.push('E' + item.episode);
    return partes.join(' · ');
  }

  function posterMaior(url, tamanho) {
    return url.replace('/w92/', '/' + tamanho + '/');
  }

  function inicialDe(titulo) {
    return Array.from(titulo)[0].toLocaleUpperCase('pt-BR');
  }

  /* Preenche um contêiner com o pôster ou, sem imagem, com a inicial do título. */
  function preencherPoster(destino, url, titulo, tamanho) {
    destino.textContent = '';
    function inicial() {
      var vazio = criar('span', 'cartaz-inicial', inicialDe(titulo));
      vazio.setAttribute('aria-hidden', 'true');
      return vazio;
    }
    if (!url) {
      destino.appendChild(inicial());
      return;
    }
    var imagem = criar('img');
    imagem.src = posterMaior(url, tamanho);
    imagem.alt = '';
    imagem.loading = 'lazy';
    imagem.addEventListener('error', function () { imagem.replaceWith(inicial()); });
    destino.appendChild(imagem);
  }

  function preencherGeneros(destino, generos) {
    destino.textContent = '';
    generos.forEach(function (genero) { destino.appendChild(criar('span', '', genero)); });
  }

  /* Rotas */

  function rotaAtual() {
    var hash = location.hash.replace(/^#\/?/, '');
    if (hash === 'quero-assistir') return { nome: 'quero' };
    if (hash === 'diario') return { nome: 'diario' };
    if (hash === 'estatisticas') return { nome: 'estatisticas' };
    if (hash.indexOf('titulo/') === 0) return { nome: 'titulo', id: hash.slice(7) };
    return { nome: 'biblioteca' };
  }

  function aplicarRota() {
    if (!idUsuarioAtual || !listaCarregada) return;
    var rota = rotaAtual();
    var navegacao = {
      biblioteca: el('nav-biblioteca'),
      quero: el('nav-quero'),
      diario: el('nav-diario'),
      estatisticas: el('nav-estatisticas')
    };
    Object.keys(navegacao).forEach(function (nome) {
      if (nome === rota.nome) navegacao[nome].setAttribute('aria-current', 'page');
      else navegacao[nome].removeAttribute('aria-current');
    });

    if (rota.nome === 'diario') {
      diarioLimite = DIARIO_POR_VEZ;
      mostrarTela('diario');
      renderizarDiario();
      window.scrollTo(0, 0);
    } else if (rota.nome === 'estatisticas') {
      mostrarTela('estatisticas');
      renderizarEstatisticas();
      window.scrollTo(0, 0);
    } else if (rota.nome === 'titulo') {
      var item = Store.obter(rota.id);
      if (!item) {
        location.hash = '#/';
        return;
      }
      mostrarTela('titulo');
      renderizarDetalhe(item);
      window.scrollTo(0, 0);
    } else {
      paginaAtual = 1;
      mostrarTela('biblioteca');
      renderizarBiblioteca();
    }
    renderizarContadores();
  }

  /* Biblioteca */

  function renderizarContadores() {
    var todos = Store.listar();
    function conta(condicao) { return todos.filter(condicao).length; }
    el('nav-total').textContent = String(todos.length);
    el('nav-fila').textContent = String(conta(function (i) { return i.status === 'planned'; }));
    el('rodape-contagem').textContent = [
      plural(conta(function (i) { return i.type === 'movie' && i.status === 'watched'; }), 'filme assistido', 'filmes assistidos'),
      plural(conta(function (i) { return i.type === 'series' && i.status === 'watched'; }), 'série assistida', 'séries assistidas')
    ].join(' · ');
  }

  function renderizarMetricas(todos) {
    var notas = todos.filter(function (i) { return i.rating !== null; });
    el('metrica-media').textContent = notas.length
      ? (notas.reduce(function (s, i) { return s + i.rating; }, 0) / notas.length / 2)
        .toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      : '–';

    el('metrica-tempo').textContent = formatarTempo(calcularTempo().minutos);

    var assistidos = todos.filter(function (i) { return i.status === 'watched'; });
    var contagem = {};
    assistidos.forEach(function (i) {
      i.genres.forEach(function (g) { contagem[g] = (contagem[g] || 0) + 1; });
    });
    var generos = Object.keys(contagem).sort(function (a, b) {
      return contagem[b] - contagem[a] || a.localeCompare(b, 'pt-BR');
    });
    el('metrica-genero').textContent = generos[0] || '–';
    el('metrica-genero-detalhe').textContent = generos[0]
      ? Math.round((contagem[generos[0]] / assistidos.length) * 100) + '% dos títulos assistidos'
      : 'Aparece quando você registrar um título assistido';
  }

  /* Recria as opções a partir da biblioteca, preservando a seleção. */
  function preencherOpcoes(select, primeira, valores) {
    var atual = select.value;
    select.textContent = '';
    var opcaoVazia = criar('option', '', primeira);
    opcaoVazia.value = '';
    select.appendChild(opcaoVazia);
    valores.forEach(function (valor) {
      var opcao = criar('option', '', String(valor));
      opcao.value = String(valor);
      select.appendChild(opcao);
    });
    select.value = valores.map(String).indexOf(atual) >= 0 ? atual : '';
  }

  function atualizarFiltrosDinamicos(todos) {
    var generos = {};
    var anos = {};
    todos.forEach(function (i) {
      i.genres.forEach(function (g) { generos[g] = true; });
      if (i.year !== null) anos[i.year] = true;
    });
    preencherOpcoes(filtroGenero, 'Todos os gêneros', Object.keys(generos).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR');
    }));
    preencherOpcoes(filtroAno, 'Todos os anos', Object.keys(anos).sort(function (a, b) { return b - a; }));
  }

  function filtrar(itens, rota) {
    var termo = semAcento(busca.value.trim());
    var situacao = rota.nome === 'quero' ? 'planned' : filtroSituacao.value;
    return itens.filter(function (i) {
      if (tipoAtivo && i.type !== tipoAtivo) return false;
      if (situacao && i.status !== situacao) return false;
      if (filtroGenero.value && i.genres.indexOf(filtroGenero.value) < 0) return false;
      if (filtroAno.value && String(i.year) !== filtroAno.value) return false;
      if (filtroNota.value === 'sem' && i.rating !== null) return false;
      if (filtroNota.value && filtroNota.value !== 'sem' && !(i.rating >= Number(filtroNota.value))) return false;
      if (!termo) return true;
      return semAcento([i.title, i.director || '', i.genres.join(' '), i.notes].join(' ')).indexOf(termo) >= 0;
    });
  }

  /* Campos vazios sempre vão para o fim da lista, seja qual for a ordenação. */
  function porCampoDesc(campo) {
    return function (a, b) {
      if (a[campo] === null && b[campo] === null) return 0;
      if (a[campo] === null) return 1;
      if (b[campo] === null) return -1;
      if (a[campo] === b[campo]) return 0;
      return a[campo] < b[campo] ? 1 : -1;
    };
  }

  function porTitulo(a, b) { return a.title.localeCompare(b.title, 'pt-BR'); }

  function ordenar(itens) {
    var comparadores = {
      recent: porCampoDesc('createdAt'),
      watchedOn: porCampoDesc('watchedOn'),
      rating: porCampoDesc('rating'),
      year: porCampoDesc('year'),
      title: porTitulo
    };
    var comparar = comparadores[filtroOrdem.value] || comparadores.recent;
    return itens.sort(function (a, b) { return comparar(a, b) || porTitulo(a, b); });
  }

  function renderizarCartaz(item) {
    var cartaz = criar('li', 'cartaz');

    var imagem = criar('div', 'cartaz-imagem');
    preencherPoster(imagem, item.posterUrl, item.title, 'w342');
    imagem.appendChild(criar('span', 'selo-tipo', ROTULO_TIPO[item.type]));
    if (item.rating !== null) {
      var nota = criar('span', 'selo-nota');
      nota.appendChild(icone('estrela'));
      nota.appendChild(document.createTextNode(formatarEstrelas(item.rating)));
      nota.setAttribute('role', 'img');
      nota.setAttribute('aria-label', 'Nota: ' + textoEstrelas(item.rating) + ' de 5');
      imagem.appendChild(nota);
    }
    var progresso = item.type === 'series' ? progressoCurto(item) : '';
    if (progresso || item.status !== 'watched') {
      var selo = criar('span', 'selo-progresso');
      selo.appendChild(criar('strong', '', progresso));
      selo.appendChild(criar('span', '', ROTULO_SITUACAO[item.status]));
      imagem.appendChild(selo);
    }
    cartaz.appendChild(imagem);

    var texto = criar('div', 'cartaz-texto');
    var link = criar('a', 'cartaz-titulo', item.title);
    link.href = '#/titulo/' + item.id;
    texto.appendChild(link);

    var meta = [];
    if (item.year !== null) meta.push(item.year);
    if (item.director) meta.push(item.director);
    else if (item.genres.length) meta.push(item.genres[0]);
    texto.appendChild(criar('p', 'cartaz-meta', meta.join(' • ') || ROTULO_TIPO[item.type]));

    if (item.notes) {
      texto.appendChild(criar('p', 'cartaz-citacao', '“' + item.notes.split('\n')[0] + '”'));
    }

    if (item.type === 'series' && item.status === 'watching') {
      var maisUm = criar('button', 'botao cartaz-mais', '+1 episódio');
      maisUm.type = 'button';
      maisUm.dataset.maisUm = item.id;
      maisUm.setAttribute('aria-label', 'Marcar mais um episódio de ' + item.title);
      maisUm.addEventListener('click', function () { marcarEpisodio(item, maisUm); });
      texto.appendChild(maisUm);
    }

    cartaz.appendChild(texto);
    return cartaz;
  }

  function filtrosAtivos() {
    return Boolean(busca.value.trim() || tipoAtivo || filtroGenero.value || filtroAno.value ||
      filtroNota.value || filtroSituacao.value);
  }

  function limparFiltros() {
    busca.value = '';
    tipoAtivo = '';
    [filtroGenero, filtroAno, filtroNota, filtroSituacao].forEach(function (f) { f.value = ''; });
    paginaAtual = 1;
    renderizarBiblioteca();
  }

  function renderizarAbas(base) {
    function conta(tipo) { return base.filter(function (i) { return i.type === tipo; }).length; }
    el('aba-todos').textContent = 'Todos (' + base.length + ')';
    el('aba-filmes').textContent = 'Filmes (' + conta('movie') + ')';
    el('aba-series').textContent = 'Séries (' + conta('series') + ')';
    document.querySelectorAll('.aba').forEach(function (aba) {
      aba.setAttribute('aria-pressed', String(aba.dataset.tipo === tipoAtivo));
    });
  }

  function renderizarPaginacao(total, totalPaginas) {
    var inicio = total ? (paginaAtual - 1) * POR_PAGINA + 1 : 0;
    var fim = Math.min(paginaAtual * POR_PAGINA, total);
    var texto = el('paginacao-texto');
    texto.textContent = '';
    texto.appendChild(document.createTextNode('Exibindo ' + inicio + '–' + fim + ' de '));
    texto.appendChild(criar('strong', '', plural(total, 'título', 'títulos')));

    var botoes = el('paginacao-botoes');
    botoes.textContent = '';
    el('paginacao').hidden = total === 0;
    if (totalPaginas < 2) return;

    function botao(rotulo, pagina, desabilitado, atual, nomeAcessivel) {
      var b = criar('button', '', rotulo);
      b.type = 'button';
      b.disabled = desabilitado;
      if (nomeAcessivel) b.setAttribute('aria-label', nomeAcessivel);
      if (atual) b.setAttribute('aria-current', 'page');
      b.addEventListener('click', function () {
        paginaAtual = pagina;
        renderizarBiblioteca();
        window.scrollTo(0, 0);
      });
      botoes.appendChild(b);
    }

    botao('‹', paginaAtual - 1, paginaAtual === 1, false, 'Página anterior');
    for (var p = 1; p <= totalPaginas; p++) botao(String(p), p, false, p === paginaAtual);
    botao('›', paginaAtual + 1, paginaAtual === totalPaginas, false, 'Próxima página');
  }

  function renderizarBiblioteca() {
    var rota = rotaAtual();
    var quero = rota.nome === 'quero';
    var todos = Store.listar();
    var base = quero ? todos.filter(function (i) { return i.status === 'planned'; }) : todos;

    el('biblioteca-titulo').textContent = quero ? 'Quero assistir' : 'Minha Biblioteca';
    el('filtro-situacao-campo').hidden = quero;
    if (quero) filtroSituacao.value = '';
    atualizarFiltrosDinamicos(base);
    renderizarAbas(base);
    renderizarMetricas(todos);
    renderizarContadores();

    el('biblioteca-total').textContent = String(base.length);
    el('biblioteca-total-rotulo').textContent = base.length === 1 ? 'título catalogado' : 'títulos catalogados';

    var visiveis = ordenar(filtrar(base, rota));
    var totalPaginas = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA));
    paginaAtual = Math.min(paginaAtual, totalPaginas);

    lista.textContent = '';
    visiveis.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA).forEach(function (item) {
      lista.appendChild(renderizarCartaz(item));
    });
    renderizarPaginacao(visiveis.length, totalPaginas);

    var vazio = el('vazio');
    vazio.hidden = visiveis.length > 0;
    if (!visiveis.length) {
      var comFiltro = base.length > 0 && filtrosAtivos();
      el('vazio-texto').textContent = comFiltro
        ? 'Nenhum título corresponde a estes filtros.'
        : quero
          ? 'Sua fila está vazia. Adicione o próximo título que quer ver.'
          : 'Sua biblioteca está vazia. Comece pelo último filme ou série que você assistiu.';
      var acao = el('vazio-acao');
      acao.textContent = comFiltro ? 'Limpar filtros' : 'Adicionar título';
      acao.onclick = comFiltro ? limparFiltros : function () { abrirModal(null); };
    }
  }

  function aoMudarFiltro() {
    paginaAtual = 1;
    renderizarBiblioteca();
  }

  function definirVista(vista) {
    var emLista = vista === 'lista';
    lista.classList.toggle('vista-lista', emLista);
    el('vista-lista').setAttribute('aria-pressed', String(emLista));
    el('vista-grade').setAttribute('aria-pressed', String(!emLista));
    gravarPreferencia(CHAVE_VISTA, emLista ? 'lista' : 'grade');
  }

  /* Define o próximo episódio; em título ligado ao TMDB, passa de temporada quando esta termina. */
  async function proximoEpisodio(item) {
    var episodio = (item.episode || 0) + 1;
    if (!item.tmdbId) return { season: item.season === null ? 1 : item.season, episode: episodio, runtime: null };

    var resposta = await Store.buscarDetalhes(item.tmdbId, item.type);
    if (resposta.erro) return { erro: resposta.erro };
    var temporadas = resposta.detalhes.seasons;
    var numero = item.season !== null ? item.season : temporadas.length ? temporadas[0].number : 1;
    var atual = temporadas.filter(function (s) { return s.number === numero; })[0];
    if (atual && episodio > atual.episodes) {
      var seguinte = temporadas.filter(function (s) { return s.number > numero; })[0];
      if (!seguinte) return { erro: 'Você já marcou o último episódio disponível.' };
      numero = seguinte.number;
      episodio = 1;
    }

    var duracao = resposta.detalhes.runtime;
    var temporada = await Store.buscarTemporada(item.tmdbId, numero);
    if (temporada.temporada) {
      var dados = temporada.temporada.episodes.filter(function (e) { return e.number === episodio; })[0];
      if (dados && dados.runtime) duracao = dados.runtime;
    }
    return { season: numero, episode: episodio, runtime: duracao };
  }

  async function marcarEpisodio(item, botao) {
    var atual = Store.obter(item.id);
    botao.disabled = true;
    var proximo = await proximoEpisodio(atual);
    if (proximo.erro) {
      botao.disabled = false;
      avisar(proximo.erro);
      return;
    }
    var episodio = proximo.episode;
    var resultado = await Store.marcarEpisodios(atual.id, [{
      season: proximo.season,
      episode: episodio,
      watchedOn: hojeLocal(),
      runtime: proximo.runtime
    }]);
    botao.disabled = false;
    if (resultado.erro) {
      avisar(resultado.erro);
      return;
    }
    if (rotaAtual().nome === 'titulo') {
      renderizarProgresso(resultado.item);
      renderizarEpisodios(resultado.item, proximo.season);
    } else {
      renderizarBiblioteca();
      /* A lista é redesenhada: devolve o foco ao botão para quem usa o teclado. */
      var novoBotao = lista.querySelector('[data-mais-um="' + item.id + '"]');
      if (novoBotao) novoBotao.focus();
    }
    avisar(item.title + ': T' + proximo.season + ' · E' + episodio + ' marcado');
  }

  /* Página de detalhes */

  var detalheId = null;
  var detalheStatus = null;
  var detalheTemporadas = [];
  var numeroDetalhe = 0;

  function definirNota(nota) {
    el('det-form').dataset.nota = nota ? String(nota) : '';
    el('seletor-nota-cheias').style.width = (nota * 10) + '%';
    el('nota-valor').textContent = nota ? formatarEstrelas(nota) : '–';
    el('limpar-nota').hidden = !nota;
    var seletor = el('seletor-nota');
    seletor.setAttribute('aria-valuenow', String(nota / 2));
    seletor.setAttribute('aria-valuetext', nota ? textoEstrelas(nota) : 'Sem nota');
  }

  function notaAtual() {
    return Number(el('det-form').dataset.nota) || 0;
  }

  /* A metade esquerda de cada estrela vale meia estrela. */
  function notaDoPonteiro(evento) {
    var area = el('seletor-nota').getBoundingClientRect();
    var nota = Math.ceil(((evento.clientX - area.left) / area.width) * 10);
    return Math.min(10, Math.max(1, nota));
  }

  function aoPressionarNota(evento) {
    var seletor = el('seletor-nota');
    seletor.focus();
    seletor.setPointerCapture(evento.pointerId);
    definirNota(notaDoPonteiro(evento));
  }

  function aoMoverNota(evento) {
    if (el('seletor-nota').hasPointerCapture(evento.pointerId)) definirNota(notaDoPonteiro(evento));
  }

  function aoTeclarNota(evento) {
    var novas = {
      ArrowRight: notaAtual() + 1,
      ArrowUp: notaAtual() + 1,
      ArrowLeft: notaAtual() - 1,
      ArrowDown: notaAtual() - 1,
      Home: 0,
      End: 10
    };
    if (!(evento.key in novas)) return;
    evento.preventDefault();
    definirNota(Math.min(10, Math.max(0, novas[evento.key])));
  }

  function definirStatusDetalhe(status) {
    detalheStatus = status;
    el('det-status').querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.status === status));
    });
    var assistido = status === 'watched';
    el('det-nota-bloco').hidden = !assistido;
    el('det-data-campo').hidden = !assistido;
  }

  function renderizarProgresso(item) {
    var serie = item.type === 'series';
    el('det-progresso').hidden = !serie;
    /* Em título ligado ao TMDB, o progresso vem da lista de episódios marcados. */
    el('det-progresso-campos').hidden = !serie || Boolean(item.tmdbId);
    el('det-temporada').value = item.season === null ? '' : item.season;
    el('det-episodio').value = item.episode === null ? '' : item.episode;
    if (!serie) return;

    var texto = [];
    if (item.season !== null) texto.push('Temporada ' + item.season);
    if (item.episode !== null) texto.push((texto.length ? 'episódio ' : 'Episódio ') + item.episode);
    el('det-progresso-texto').textContent = texto.join(', ') || 'Nenhum episódio registrado ainda.';
    el('det-mais-um').hidden = item.status !== 'watching';

    var temporada = detalheTemporadas.filter(function (s) { return s.number === item.season; })[0];
    var comBarra = Boolean(temporada && temporada.episodes && item.episode !== null);
    el('det-barra').hidden = !comBarra;
    el('det-barra-texto').hidden = !comBarra;
    if (comBarra) {
      var marcados = Store.listarVistas(item.id).filter(function (v) { return v.season === item.season; }).length;
      var vistos = Math.min(marcados || item.episode, temporada.episodes);
      el('det-barra-valor').style.width = Math.round((vistos / temporada.episodes) * 100) + '%';
      el('det-barra-texto').textContent = vistos + ' de ' + temporada.episodes + ' episódios da temporada';
    }
  }

  /* Lista de episódios */

  var temporadaAberta = null;
  var episodiosAbertos = [];
  var numeroEpisodios = 0;

  function renderizarEpisodios(item, temporadaPedida) {
    var bloco = el('det-episodios');
    bloco.hidden = item.type !== 'series' || !item.tmdbId || !detalheTemporadas.length;
    if (bloco.hidden) return;

    function existe(numero) { return detalheTemporadas.some(function (s) { return s.number === numero; }); }
    if (existe(temporadaPedida)) temporadaAberta = temporadaPedida;
    else if (!existe(temporadaAberta)) temporadaAberta = existe(item.season) ? item.season : detalheTemporadas[0].number;

    var botoes = el('det-temporadas');
    botoes.textContent = '';
    detalheTemporadas.forEach(function (temporada) {
      var botao = criar('button', '', 'Temporada ' + temporada.number);
      botao.type = 'button';
      botao.setAttribute('aria-pressed', String(temporada.number === temporadaAberta));
      botao.addEventListener('click', function () { renderizarEpisodios(Store.obter(item.id), temporada.number); });
      botoes.appendChild(botao);
    });
    carregarEpisodios(item);
  }

  async function carregarEpisodios(item) {
    var numero = ++numeroEpisodios;
    var temporada = temporadaAberta;
    var resposta = await Store.buscarTemporada(item.tmdbId, temporada);
    if (numero !== numeroEpisodios) return;
    var estado = el('det-episodios-estado');
    if (resposta.erro) {
      estado.textContent = resposta.erro;
      el('det-lista-episodios').textContent = '';
      el('det-marcar-temporada').hidden = true;
      return;
    }
    episodiosAbertos = resposta.temporada.episodes;
    estado.textContent = episodiosAbertos.length ? '' : 'O TMDB ainda não tem episódios nesta temporada.';
    desenharEpisodios(item.id);
  }

  function vistaDe(idTitulo, episodio) {
    return Store.listarVistas(idTitulo).filter(function (v) {
      return v.season === temporadaAberta && v.episode === episodio;
    })[0];
  }

  function desenharEpisodios(idTitulo, focoEpisodio) {
    var lista2 = el('det-lista-episodios');
    lista2.textContent = '';
    episodiosAbertos.forEach(function (ep) { lista2.appendChild(criarLinhaEpisodio(idTitulo, ep)); });
    el('det-marcar-temporada').hidden = !episodiosAbertos.length ||
      episodiosAbertos.every(function (ep) { return vistaDe(idTitulo, ep.number); });
    if (focoEpisodio !== undefined) {
      var alvo = lista2.querySelector('[data-episodio="' + focoEpisodio + '"]');
      if (alvo) alvo.focus();
    }
  }

  function aposMudarEpisodios(item, focoEpisodio) {
    renderizarProgresso(item);
    definirStatusDetalhe(item.status);
    renderizarContadores();
    desenharEpisodios(item.id, focoEpisodio);
  }

  function criarOpcoesNota(selecionada) {
    var select = criar('select');
    var vazia = criar('option', '', 'Sem nota');
    vazia.value = '';
    select.appendChild(vazia);
    for (var nota = 10; nota >= 1; nota--) {
      var opcao = criar('option', '', '★ ' + formatarEstrelas(nota));
      opcao.value = String(nota);
      select.appendChild(opcao);
    }
    select.value = selecionada ? String(selecionada) : '';
    return select;
  }

  function criarLinhaEpisodio(idTitulo, ep) {
    var vista = vistaDe(idTitulo, ep.number);
    var temporada = temporadaAberta;
    var linha = criar('li', 'episodio');
    var nome = 'E' + ep.number + (ep.name ? ' • ' + ep.name : '');

    var marca = criar('label', 'ep-marca');
    var caixa = criar('input');
    caixa.type = 'checkbox';
    caixa.checked = Boolean(vista);
    caixa.dataset.episodio = ep.number;
    caixa.setAttribute('aria-label', 'Marcar como visto: ' + nome);
    var desenho = criar('span', 'ep-caixa');
    desenho.appendChild(icone('check'));
    marca.appendChild(caixa);
    marca.appendChild(desenho);
    linha.appendChild(marca);

    caixa.addEventListener('change', async function () {
      caixa.disabled = true;
      var resultado = caixa.checked
        ? await Store.marcarEpisodios(idTitulo, [{
          season: temporada,
          episode: ep.number,
          watchedOn: hojeLocal(),
          runtime: ep.runtime
        }])
        : await Store.desmarcarEpisodio(idTitulo, temporada, ep.number);
      caixa.disabled = false;
      if (resultado.erro) {
        caixa.checked = !caixa.checked;
        avisar(resultado.erro);
        return;
      }
      aposMudarEpisodios(resultado.item, ep.number);
    });

    var texto = criar('div');
    var titulo = criar('p', 'ep-titulo', nome);
    if (ep.runtime) titulo.appendChild(criar('span', 'ep-duracao', ep.runtime + ' min'));
    texto.appendChild(titulo);
    if (ep.overview) texto.appendChild(criar('p', 'ep-sinopse', ep.overview));
    linha.appendChild(texto);

    if (vista) {
      var registro = criar('div', 'ep-registro');
      var data = criar('input');
      data.type = 'date';
      data.value = vista.watchedOn;
      data.setAttribute('aria-label', 'Data em que viu ' + nome);
      data.addEventListener('change', async function () {
        if (!data.value) {
          data.value = vistaDe(idTitulo, ep.number).watchedOn;
          return;
        }
        var resultado = await Store.atualizarVista(vistaDe(idTitulo, ep.number), { watchedOn: data.value });
        if (resultado.erro) {
          data.value = vistaDe(idTitulo, ep.number).watchedOn;
          avisar(resultado.erro);
        }
      });
      var nota = criarOpcoesNota(vista.rating);
      nota.setAttribute('aria-label', 'Nota de ' + nome);
      nota.addEventListener('change', async function () {
        var resultado = await Store.atualizarVista(vistaDe(idTitulo, ep.number), { rating: nota.value || null });
        if (resultado.erro) {
          nota.value = vistaDe(idTitulo, ep.number).rating || '';
          avisar(resultado.erro);
        }
      });
      registro.appendChild(data);
      registro.appendChild(nota);
      linha.appendChild(registro);
    }
    return linha;
  }

  async function marcarTemporadaInteira() {
    var botao = el('det-marcar-temporada');
    var idTitulo = detalheId;
    var hoje = hojeLocal();
    var entradas = episodiosAbertos.filter(function (ep) { return !vistaDe(idTitulo, ep.number); }).map(function (ep) {
      return { season: temporadaAberta, episode: ep.number, watchedOn: hoje, runtime: ep.runtime };
    });
    if (!entradas.length) return;
    botao.disabled = true;
    var resultado = await Store.marcarEpisodios(idTitulo, entradas);
    botao.disabled = false;
    if (resultado.erro) {
      avisar(resultado.erro);
      return;
    }
    aposMudarEpisodios(resultado.item);
    avisar(plural(entradas.length, 'episódio marcado', 'episódios marcados') + ' com a data de hoje');
  }

  function preencherTmdb(item, detalhes) {
    var direcao = detalhes.directors || [];
    var elenco = detalhes.cast || [];
    el('det-fundo').hidden = !detalhes.backdrop;
    if (detalhes.backdrop) el('det-fundo').src = detalhes.backdrop;

    if (detalhes.originalTitle && detalhes.originalTitle !== item.title) {
      el('det-original').textContent = 'Título original: ' + detalhes.originalTitle;
      el('det-original').hidden = false;
    }
    if (detalhes.runtime) {
      el('det-duracao').textContent = detalhes.runtime + ' min' + (item.type === 'series' ? ' / ep' : '');
      el('det-duracao').hidden = false;
    }
    if (detalhes.vote) {
      el('det-voto').textContent = '';
      el('det-voto').appendChild(icone('estrela'));
      el('det-voto').appendChild(document.createTextNode(detalhes.vote.toLocaleString('pt-BR') + ' no TMDB'));
      el('det-voto').hidden = false;
    }

    el('det-sinopse').textContent = detalhes.overview || 'O TMDB não tem sinopse em português para este título.';
    el('det-direcao-rotulo').textContent = item.type === 'series' ? 'Criação' : 'Direção';
    el('det-direcao').textContent = direcao.join(', ') || 'Não informado';
    el('det-elenco').textContent = elenco.join(', ') || 'Não informado';
    el('det-creditos').hidden = false;

    detalheTemporadas = detalhes.seasons || [];
    renderizarProgresso(item);
    renderizarEpisodios(item);

    /* Filmes ligados ao TMDB antes de a duração ser guardada passam a contar nas estatísticas. */
    if (item.type === 'movie' && !item.runtime && detalhes.runtime) {
      Store.salvar(Object.assign({}, item, { runtime: detalhes.runtime }));
    }
  }

  async function carregarDadosTmdb(item) {
    var numero = ++numeroDetalhe;
    el('det-sinopse').textContent = 'Carregando dados do TMDB…';
    var resultado = await Store.buscarDetalhes(item.tmdbId, item.type);
    if (numero !== numeroDetalhe) return;
    if (resultado.erro) {
      el('det-sinopse').textContent = resultado.erro;
      return;
    }
    preencherTmdb(item, resultado.detalhes);
  }

  function renderizarDetalhe(item) {
    detalheId = item.id;
    detalheTemporadas = [];
    temporadaAberta = null;
    episodiosAbertos = [];
    numeroEpisodios++;
    el('det-episodios').hidden = true;
    numeroDetalhe++;
    document.title = item.title + ' · Claquete';

    el('det-fundo').hidden = true;
    el('det-fundo').removeAttribute('src');
    preencherPoster(el('det-poster'), item.posterUrl, item.title, 'w500');
    el('det-tipo').textContent = ROTULO_TIPO[item.type];
    el('det-ano').textContent = item.year === null ? '' : String(item.year);
    el('det-ano').hidden = item.year === null;
    el('det-duracao').hidden = true;
    el('det-voto').hidden = true;
    el('det-titulo').textContent = item.title;
    el('det-original').hidden = true;
    preencherGeneros(el('det-generos'), item.genres);
    el('det-creditos').hidden = true;

    el('det-erro').hidden = true;
    el('det-notas').value = item.notes;
    el('det-data').value = item.watchedOn || '';
    el('det-temporada').value = item.season === null ? '' : item.season;
    el('det-episodio').value = item.episode === null ? '' : item.episode;
    definirNota(item.rating || 0);
    definirStatusDetalhe(item.status);
    renderizarProgresso(item);

    el('det-vincular').hidden = Boolean(item.tmdbId);
    if (item.tmdbId) {
      carregarDadosTmdb(item);
    } else {
      el('det-sinopse').textContent = 'Este título ainda não está ligado ao TMDB. Busque-o para trazer sinopse, direção e elenco.';
    }
  }

  async function aoSalvarDetalhe(evento) {
    evento.preventDefault();
    var item = Store.obter(detalheId);
    if (!item) return;
    var botao = el('det-salvar');
    botao.disabled = true;
    var resultado = await Store.salvar(Object.assign({}, item, {
      status: detalheStatus,
      rating: notaAtual() || null,
      watchedOn: el('det-data').value,
      notes: el('det-notas').value,
      season: el('det-temporada').value,
      episode: el('det-episodio').value
    }));
    botao.disabled = false;
    if (resultado.erro) {
      el('det-erro').textContent = resultado.erro;
      el('det-erro').hidden = false;
      return;
    }
    el('det-erro').hidden = true;
    renderizarDetalhe(resultado.item);
    renderizarContadores();
    avisar('Avaliação salva');
  }

  async function removerDetalhe() {
    var item = Store.obter(detalheId);
    if (!item) return;
    if (!window.confirm('Remover "' + item.title + '" da biblioteca? Esta ação não pode ser desfeita.')) return;
    var resultado = await Store.remover(item.id);
    if (resultado.erro) {
      avisar(resultado.erro);
      return;
    }
    location.hash = '#/';
    avisar('Removido: ' + item.title);
  }

  /* Modal: adicionar um título ou, com um título em edição, trocar os dados dele. */

  var modalItem = null;
  var resultados = [];
  var indiceAtivo = -1;
  var escolhido = null;
  var detalhesEscolhido = null;
  var numeroBusca = 0;
  var numeroPrevia = 0;
  var temporizadorBusca = null;
  var modoManual = false;
  var buscaModal = el('modal-busca');

  function mostrarErroModal(texto) {
    el('modal-erro').textContent = texto || '';
    el('modal-erro').hidden = !texto;
  }

  function atualizarAcoes() {
    var edicao = Boolean(modalItem);
    var tipo = modoManual ? el('manual-tipo').value : escolhido && escolhido.type;
    var existente = !edicao && !modoManual && escolhido
      ? Store.listar().filter(function (i) { return i.tmdbId === escolhido.id && i.type === escolhido.type; })[0]
      : null;
    var pronto = modoManual || Boolean(escolhido);

    el('modal-acoes').hidden = !pronto;
    el('acao-usar').hidden = !edicao;
    el('acao-abrir').hidden = !existente;
    if (existente) el('acao-abrir').href = '#/titulo/' + existente.id;
    el('acao-visto').hidden = edicao || Boolean(existente);
    el('acao-quero').hidden = edicao || Boolean(existente);
    el('acao-vendo').hidden = edicao || Boolean(existente) || tipo !== 'series';
  }

  function limparResultados() {
    resultados = [];
    indiceAtivo = -1;
    el('sugestoes').textContent = '';
    buscaModal.setAttribute('aria-expanded', 'false');
    buscaModal.removeAttribute('aria-activedescendant');
    el('modal-resultados-rotulo').textContent = 'Resultados';
  }

  function definirModoManual(ativo) {
    modoManual = ativo;
    el('modal-manual').hidden = !ativo;
    el('modal-previa').hidden = ativo || !escolhido;
    if (ativo) {
      el('manual-erro').hidden = true;
      el('manual-titulo').focus();
    }
    atualizarAcoes();
  }

  function criarResultado(resultado, indice) {
    var opcao = criar('li', 'sugestao');
    opcao.id = 'sugestao-' + indice;
    opcao.setAttribute('role', 'option');
    opcao.setAttribute('aria-selected', 'false');

    if (resultado.poster) {
      var poster = criar('img');
      poster.src = resultado.poster;
      poster.alt = '';
      poster.loading = 'lazy';
      opcao.appendChild(poster);
    } else {
      opcao.appendChild(criar('span', 'sugestao-sem-poster'));
    }

    var textos = criar('span');
    textos.appendChild(criar('span', 'sugestao-titulo', resultado.title));
    var meta = [];
    if (resultado.year) meta.push(resultado.year);
    meta.push(ROTULO_TIPO[resultado.type]);
    if (resultado.genres.length) meta.push(resultado.genres.slice(0, 2).join(' / '));
    textos.appendChild(criar('span', 'sugestao-meta', meta.join(' • ')));
    opcao.appendChild(textos);

    if (resultado.vote) {
      var voto = criar('span', 'sugestao-voto');
      voto.appendChild(icone('estrela'));
      voto.appendChild(document.createTextNode(resultado.vote.toLocaleString('pt-BR')));
      opcao.appendChild(voto);
    } else {
      opcao.appendChild(criar('span'));
    }

    opcao.addEventListener('mousedown', function (evento) { evento.preventDefault(); });
    opcao.addEventListener('click', function () { selecionarResultado(indice); });
    return opcao;
  }

  function preencherEtiquetasPrevia(resultado, detalhes) {
    var etiquetas = el('previa-etiquetas');
    etiquetas.textContent = '';
    etiquetas.appendChild(criar('span', 'etiqueta etiqueta-ambar', ROTULO_TIPO[resultado.type]));
    if (resultado.year) etiquetas.appendChild(criar('span', 'etiqueta', String(resultado.year)));
    if (detalhes && detalhes.runtime) {
      etiquetas.appendChild(criar('span', 'etiqueta', detalhes.runtime + ' min' + (resultado.type === 'series' ? ' / ep' : '')));
    }
    if (resultado.vote) {
      var voto = criar('span', 'etiqueta');
      voto.appendChild(icone('estrela'));
      voto.appendChild(document.createTextNode(resultado.vote.toLocaleString('pt-BR') + ' no TMDB'));
      etiquetas.appendChild(voto);
    }
  }

  async function mostrarPrevia(resultado) {
    var numero = ++numeroPrevia;
    detalhesEscolhido = null;
    el('modal-previa').hidden = modoManual;
    preencherPoster(el('previa-poster'), resultado.poster, resultado.title, 'w342');
    preencherEtiquetasPrevia(resultado, null);
    el('previa-titulo').textContent = resultado.title;
    el('previa-original').hidden = true;
    preencherGeneros(el('previa-generos'), resultado.genres);
    el('previa-sinopse').textContent = 'Carregando sinopse…';
    el('previa-credito').hidden = true;

    var resposta = await Store.buscarDetalhes(resultado.id, resultado.type);
    if (numero !== numeroPrevia) return;
    if (resposta.erro) {
      el('previa-sinopse').textContent = resposta.erro;
      return;
    }
    var detalhes = resposta.detalhes;
    detalhesEscolhido = detalhes;
    preencherEtiquetasPrevia(resultado, detalhes);
    if (detalhes.originalTitle && detalhes.originalTitle !== resultado.title) {
      el('previa-original').textContent = 'Título original: ' + detalhes.originalTitle;
      el('previa-original').hidden = false;
    }
    el('previa-sinopse').textContent = detalhes.overview || 'O TMDB não tem sinopse em português para este título.';
    var creditos = [];
    if (detalhes.directors.length) {
      creditos.push((resultado.type === 'series' ? 'Criação: ' : 'Direção: ') + detalhes.directors.join(', '));
    }
    if (detalhes.cast.length) creditos.push('Elenco: ' + detalhes.cast.join(', '));
    el('previa-credito').textContent = creditos.join(' · ');
    el('previa-credito').hidden = creditos.length === 0;
  }

  function selecionarResultado(indice) {
    var opcoes = el('sugestoes').children;
    if (opcoes[indiceAtivo]) opcoes[indiceAtivo].setAttribute('aria-selected', 'false');
    indiceAtivo = indice;
    opcoes[indice].setAttribute('aria-selected', 'true');
    opcoes[indice].scrollIntoView({ block: 'nearest' });
    buscaModal.setAttribute('aria-activedescendant', opcoes[indice].id);
    escolhido = resultados[indice];
    mostrarErroModal('');
    if (modoManual) definirModoManual(false);
    mostrarPrevia(escolhido);
    atualizarAcoes();
  }

  async function buscarNoModal(consulta, numero) {
    var resposta = await Store.buscarTitulos(consulta);
    if (numero !== numeroBusca) return;
    if (resposta.erro) {
      el('sugestoes-estado').textContent = resposta.erro;
      return;
    }
    resultados = resposta.resultados;
    var lista2 = el('sugestoes');
    lista2.textContent = '';
    resultados.forEach(function (r, i) { lista2.appendChild(criarResultado(r, i)); });
    buscaModal.setAttribute('aria-expanded', String(resultados.length > 0));
    el('modal-resultados-rotulo').textContent = 'Resultados encontrados (' + resultados.length + ')';
    el('sugestoes-estado').textContent = resultados.length ? '' : 'Nada encontrado. Você pode preencher manualmente.';
    if (resultados.length) selecionarResultado(0);
  }

  function aoDigitarBusca() {
    clearTimeout(temporizadorBusca);
    numeroBusca++;
    var numero = numeroBusca;
    var consulta = buscaModal.value.trim();
    limparResultados();
    escolhido = null;
    numeroPrevia++;
    el('modal-previa').hidden = true;
    atualizarAcoes();
    if (consulta.length < MINIMO_BUSCA) {
      el('sugestoes-estado').textContent = '';
      return;
    }
    el('sugestoes-estado').textContent = 'Buscando…';
    temporizadorBusca = setTimeout(function () { buscarNoModal(consulta, numero); }, ATRASO_BUSCA);
  }

  function aoTeclarBusca(evento) {
    var total = resultados.length;
    if (!total) return;
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      selecionarResultado((indiceAtivo + 1) % total);
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      selecionarResultado((indiceAtivo - 1 + total) % total);
    }
  }

  function renderizarRecentes() {
    var recentes = Store.listar().sort(porCampoDesc('createdAt')).slice(0, 3).map(function (i) { return i.title; });
    el('modal-recentes').textContent = recentes.length ? 'Adicionados recentemente: ' + recentes.join(', ') : '';
    el('modal-recentes').hidden = recentes.length === 0 || Boolean(modalItem);
  }

  /* posterRemovido marca que o usuário pediu para tirar a imagem no preenchimento manual. */
  var posterRemovido = false;

  function abrirModal(item) {
    modalItem = item;
    clearTimeout(temporizadorBusca);
    numeroBusca++;
    numeroPrevia++;
    limparResultados();
    escolhido = null;
    detalhesEscolhido = null;
    posterRemovido = false;
    mostrarErroModal('');
    el('sugestoes-estado').textContent = '';
    el('modal-previa').hidden = true;
    el('dialogo-titulo').textContent = item ? 'Editar dados do título' : 'Adicionar à Claquete';
    el('dialogo-apoio').textContent = item
      ? 'Escolha o título no TMDB ou corrija os dados manualmente. Sua avaliação é mantida.'
      : 'Busque pelo nome do filme ou série para registrar na sua coleção pessoal';

    buscaModal.value = item ? item.title : '';
    el('manual-titulo').value = item ? item.title : '';
    el('manual-tipo').value = item ? item.type : 'movie';
    el('manual-ano').value = item && item.year !== null ? item.year : '';
    el('manual-generos').value = item ? item.genres.join(', ') : '';
    el('manual-remover-poster').hidden = !(item && item.posterUrl);
    el('modal-manual').hidden = true;
    modoManual = false;

    renderizarRecentes();
    atualizarAcoes();
    dialogo.showModal();
    buscaModal.focus();
    buscaModal.select();
    if (item) aoDigitarBusca();
  }

  /* Dados do título vindos da escolha no TMDB ou do preenchimento manual. */
  function dadosDoModal() {
    if (modoManual) {
      var manual = {
        title: el('manual-titulo').value,
        type: el('manual-tipo').value,
        year: el('manual-ano').value,
        genres: el('manual-generos').value
      };
      if (posterRemovido) {
        manual.posterUrl = null;
        manual.tmdbId = null;
        manual.director = null;
        manual.runtime = null;
      }
      return manual;
    }
    return {
      title: escolhido.title,
      type: escolhido.type,
      year: escolhido.year,
      genres: escolhido.genres,
      posterUrl: escolhido.poster,
      tmdbId: escolhido.id,
      director: detalhesEscolhido ? detalhesEscolhido.directors.join(', ') : null,
      runtime: detalhesEscolhido && escolhido.type === 'movie' ? detalhesEscolhido.runtime : null
    };
  }

  function exibirErroSalvar(texto) {
    if (modoManual) {
      el('manual-erro').textContent = texto;
      el('manual-erro').hidden = false;
    } else {
      mostrarErroModal(texto);
    }
  }

  async function salvarDoModal(status, botao) {
    botao.disabled = true;
    /* Garante a direção no cartaz mesmo se a pessoa salvar antes de a prévia terminar. */
    if (!modoManual && escolhido && !detalhesEscolhido) {
      var resposta = await Store.buscarDetalhes(escolhido.id, escolhido.type);
      if (resposta.detalhes) detalhesEscolhido = resposta.detalhes;
    }
    var entrada = modalItem
      ? Object.assign({}, modalItem, dadosDoModal())
      : Object.assign(dadosDoModal(), { status: status });
    var resultado = await Store.salvar(entrada);
    botao.disabled = false;
    if (resultado.erro) {
      exibirErroSalvar(resultado.erro);
      return;
    }

    var edicao = Boolean(modalItem);
    dialogo.close();
    avisar('Salvo: ' + resultado.item.title);

    if (edicao || status === 'watched') {
      var destino = '#/titulo/' + resultado.item.id;
      if (location.hash === destino) aplicarRota();
      else location.hash = destino;
    } else {
      aplicarRota();
    }
  }

  /* Diário */

  var DIARIO_POR_VEZ = 60;
  var diarioLimite = DIARIO_POR_VEZ;

  function lerData(iso) {
    var partes = iso.split('-').map(Number);
    return new Date(partes[0], partes[1] - 1, partes[2]);
  }

  /* Reúne títulos concluídos com data e episódios marcados, do mais recente ao mais antigo. */
  function listarSessoes() {
    var sessoes = [];
    Store.listar().forEach(function (item) {
      if (item.status !== 'watched' || !item.watchedOn) return;
      sessoes.push({
        data: item.watchedOn,
        item: item,
        apoio: item.type === 'series' ? 'Série concluída' : 'Filme',
        nota: item.rating
      });
    });
    Store.listarVistas().forEach(function (vista) {
      var item = Store.obter(vista.titleId);
      if (!item) return;
      sessoes.push({
        data: vista.watchedOn,
        item: item,
        apoio: 'Temporada ' + vista.season + ', episódio ' + vista.episode,
        nota: vista.rating,
        ordem: vista.season * 10000 + vista.episode
      });
    });
    return sessoes.sort(function (a, b) {
      if (a.data !== b.data) return a.data < b.data ? 1 : -1;
      return porTitulo(a.item, b.item) || (b.ordem || 0) - (a.ordem || 0);
    });
  }

  function criarSessao(sessao) {
    var linha = criar('li', 'sessao');
    var dia = lerData(sessao.data);

    var quando = criar('time', 'sessao-data');
    quando.dateTime = sessao.data;
    quando.appendChild(criar('span', 'sessao-dia', String(dia.getDate()).padStart(2, '0')));
    quando.appendChild(criar('span', 'sessao-semana', dia.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')));
    linha.appendChild(quando);

    var poster = criar('div', 'sessao-poster');
    preencherPoster(poster, sessao.item.posterUrl, sessao.item.title, 'w92');
    linha.appendChild(poster);

    var texto = criar('div');
    var link = criar('a', 'sessao-titulo', sessao.item.title);
    link.href = '#/titulo/' + sessao.item.id;
    texto.appendChild(link);
    texto.appendChild(criar('p', 'sessao-apoio', sessao.apoio));
    linha.appendChild(texto);

    if (sessao.nota) {
      var nota = criar('span', 'sessao-nota');
      nota.appendChild(icone('estrela'));
      nota.appendChild(document.createTextNode(formatarEstrelas(sessao.nota)));
      nota.setAttribute('role', 'img');
      nota.setAttribute('aria-label', 'Nota: ' + textoEstrelas(sessao.nota) + ' de 5');
      linha.appendChild(nota);
    } else {
      linha.appendChild(criar('span'));
    }
    return linha;
  }

  function renderizarDiario() {
    var sessoes = listarSessoes();
    el('diario-total').textContent = String(sessoes.length);
    el('diario-total-rotulo').textContent = sessoes.length === 1 ? 'sessão registrada' : 'sessões registradas';
    el('diario-vazio').hidden = sessoes.length > 0;

    var semData = Store.listar().filter(function (i) { return i.status === 'watched' && !i.watchedOn; }).length;
    el('diario-sem-data').hidden = semData === 0;
    el('diario-sem-data').textContent = plural(semData, 'título assistido não aparece', 'títulos assistidos não aparecem') +
      ' aqui por falta de data. Informe a data na página do título.';

    var destino = el('diario-lista');
    destino.textContent = '';
    var mesAtual = null;
    var grupo = null;
    sessoes.slice(0, diarioLimite).forEach(function (sessao) {
      var mes = sessao.data.slice(0, 7);
      if (mes !== mesAtual) {
        mesAtual = mes;
        destino.appendChild(criar('h2', 'diario-mes',
          lerData(sessao.data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })));
        grupo = criar('ul', 'diario-grupo');
        destino.appendChild(grupo);
      }
      grupo.appendChild(criarSessao(sessao));
    });
    el('diario-mais').hidden = sessoes.length <= diarioLimite;
  }

  /* Estatísticas */

  function criarTabelaAcessivel(legenda, cabecalho, dados) {
    var tabela = criar('table', 'sr');
    tabela.appendChild(criar('caption', '', legenda));
    var topo = criar('tr');
    cabecalho.forEach(function (texto) { topo.appendChild(criar('th', '', texto)); });
    tabela.appendChild(topo);
    dados.forEach(function (dado) {
      var linha = criar('tr');
      linha.appendChild(criar('td', '', dado.nome));
      linha.appendChild(criar('td', '', String(dado.valor)));
      tabela.appendChild(linha);
    });
    return tabela;
  }

  /* Uma só série em âmbar: só o maior valor leva rótulo; os demais aparecem na dica. */
  function desenharColunas(destino, legenda, cabecalho, dados, textoVazio) {
    destino.textContent = '';
    var maior = dados.reduce(function (m, d) { return Math.max(m, d.valor); }, 0);
    if (!maior) {
      destino.appendChild(criar('p', 'grafico-vazio', textoVazio));
      return;
    }
    var colunas = criar('div', 'colunas');
    var rotulos = criar('div', 'colunas-rotulos');
    var picoMarcado = false;
    colunas.setAttribute('aria-hidden', 'true');
    rotulos.setAttribute('aria-hidden', 'true');
    dados.forEach(function (dado) {
      var coluna = criar('div', 'coluna');
      coluna.dataset.dica = dado.nome + ': ' + dado.valor;
      if (dado.valor === maior && !picoMarcado) {
        coluna.appendChild(criar('span', 'coluna-pico', String(dado.valor)));
        picoMarcado = true;
      }
      if (dado.valor) {
        var barra = criar('span', 'coluna-barra');
        barra.style.height = Math.max(2, Math.round((dado.valor / maior) * 86)) + '%';
        coluna.appendChild(barra);
      }
      colunas.appendChild(coluna);
      rotulos.appendChild(criar('span', '', dado.curto));
    });
    destino.appendChild(colunas);
    destino.appendChild(rotulos);
    destino.appendChild(criarTabelaAcessivel(legenda, cabecalho, dados));
  }

  function desenharGeneros(destino, dados) {
    destino.textContent = '';
    if (!dados.length) {
      destino.appendChild(criar('p', 'grafico-vazio', 'Aparece quando você assistir a títulos com gênero informado.'));
      return;
    }
    var maior = dados[0].valor;
    var lista2 = criar('ul', 'barras-h');
    dados.forEach(function (dado) {
      var linha = criar('li', 'barra-h');
      linha.appendChild(criar('span', 'barra-h-nome', dado.nome));
      var trilho = criar('span', 'barra-h-trilho');
      var valor = criar('span', 'barra-h-valor');
      valor.style.width = Math.round((dado.valor / maior) * 100) + '%';
      trilho.appendChild(valor);
      linha.appendChild(trilho);
      linha.appendChild(criar('span', 'barra-h-numero', String(dado.valor)));
      lista2.appendChild(linha);
    });
    destino.appendChild(lista2);
  }

  function renderizarEstatisticas() {
    var todos = Store.listar();
    var vistas = Store.listarVistas();
    var tempo = calcularTempo();

    el('est-tempo').textContent = formatarTempo(tempo.minutos);
    el('est-filmes').textContent = String(todos.filter(function (i) { return i.type === 'movie' && i.status === 'watched'; }).length);
    el('est-episodios').textContent = String(vistas.length);
    var notas = todos.filter(function (i) { return i.rating !== null; });
    el('est-media').textContent = notas.length
      ? (notas.reduce(function (s, i) { return s + i.rating; }, 0) / notas.length / 2)
        .toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' ★'
      : '–';
    el('est-sem-duracao').hidden = tempo.semDuracao === 0;
    el('est-sem-duracao').textContent = plural(tempo.semDuracao, 'sessão sem duração conhecida fica', 'sessões sem duração conhecida ficam') +
      ' fora do tempo assistido. Em títulos antigos, use Buscar dados no TMDB ou abra a página do título.';

    var sessoes = listarSessoes();
    var meses = [];
    var agora = new Date();
    for (var i = 11; i >= 0; i--) {
      var mes = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      var chave = mes.getFullYear() + '-' + String(mes.getMonth() + 1).padStart(2, '0');
      meses.push({
        nome: mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        curto: mes.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        valor: sessoes.filter(function (s) { return s.data.indexOf(chave) === 0; }).length
      });
    }
    desenharColunas(el('grafico-meses'), 'Sessões por mês', ['Mês', 'Sessões'], meses,
      'Aparece quando você registrar sessões com data nos últimos 12 meses.');

    var comEpisodios = {};
    vistas.forEach(function (v) { comEpisodios[v.titleId] = true; });
    var contagem = {};
    todos.forEach(function (item) {
      if (item.status !== 'watched' && !comEpisodios[item.id]) return;
      item.genres.forEach(function (g) { contagem[g] = (contagem[g] || 0) + 1; });
    });
    desenharGeneros(el('grafico-generos'), Object.keys(contagem).map(function (nome) {
      return { nome: nome, valor: contagem[nome] };
    }).sort(function (a, b) {
      return b.valor - a.valor || a.nome.localeCompare(b.nome, 'pt-BR');
    }).slice(0, 8));

    var faixas = [];
    for (var nota = 1; nota <= 10; nota++) {
      faixas.push({
        nome: textoEstrelas(nota),
        curto: formatarEstrelas(nota),
        valor: notas.filter(function (t) { return t.rating === nota; }).length
      });
    }
    desenharColunas(el('grafico-notas'), 'Títulos por nota', ['Nota', 'Títulos'], faixas,
      'Aparece quando você der nota a um título.');
  }

  /* Backup */

  function exportarBackup() {
    var hoje = new Date();
    var nome = 'filmes-e-series-' + hoje.getFullYear() + '-' +
      String(hoje.getMonth() + 1).padStart(2, '0') + '-' +
      String(hoje.getDate()).padStart(2, '0') + '.json';
    var url = URL.createObjectURL(new Blob([Store.exportar()], { type: 'application/json' }));
    var link = criar('a');
    link.href = url;
    link.download = nome;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    avisar('Backup exportado: ' + nome);
  }

  function resumoImportacao(resultado) {
    var partes = [
      plural(resultado.adicionados, 'adicionado', 'adicionados'),
      plural(resultado.atualizados, 'atualizado', 'atualizados')
    ];
    if (resultado.episodios) partes.push(plural(resultado.episodios, 'episódio', 'episódios'));
    if (resultado.ignorados) partes.push(plural(resultado.ignorados, 'inválido ignorado', 'inválidos ignorados'));
    return partes.join(', ');
  }

  function importarBackup(evento) {
    var arquivo = evento.target.files[0];
    evento.target.value = '';
    if (!arquivo) return;

    var leitor = new FileReader();
    leitor.onerror = function () { avisar('Não foi possível ler o arquivo.'); };
    leitor.onload = async function () {
      var botao = el('botao-importar');
      botao.disabled = true;
      var resultado = await Store.importar(String(leitor.result));
      botao.disabled = false;
      aplicarRota();
      avisar(resultado.erro || 'Backup importado: ' + resumoImportacao(resultado) + '.');
    };
    leitor.readAsText(arquivo);
  }

  function mostrarAvisoListaAntiga() {
    var total = Store.lerListaAntiga().length;
    el('aviso-antiga').hidden = total === 0;
    el('aviso-antiga-texto').textContent = 'Encontramos ' + plural(total, 'título salvo', 'títulos salvos') +
      ' neste navegador pela versão anterior do site. Enviar para o banco de dados?';
  }

  async function enviarListaAntiga() {
    var botao = el('antiga-enviar');
    botao.disabled = true;
    var resultado = await Store.enviarListaAntiga();
    botao.disabled = false;
    mostrarAvisoListaAntiga();
    aplicarRota();
    avisar(resultado.erro || 'Lista enviada: ' + resumoImportacao(resultado) + '.');
  }

  function apagarListaAntiga() {
    if (!window.confirm('Apagar a lista antiga deste navegador sem enviá-la ao banco? Esta ação não pode ser desfeita.')) return;
    Store.apagarListaAntiga();
    mostrarAvisoListaAntiga();
  }

  /* Login e sessão */

  async function aoEntrar(evento) {
    evento.preventDefault();
    var campos = el('formulario-login').elements;
    var erro = el('login-erro');
    var email = campos.email.value.trim();
    if (!email || !campos.senha.value) {
      erro.textContent = 'Informe o e-mail e a senha.';
      erro.hidden = false;
      return;
    }

    var botao = el('botao-entrar');
    botao.disabled = true;
    erro.hidden = true;
    var resultado = await Store.entrar(email, campos.senha.value);
    botao.disabled = false;
    if (resultado.erro) {
      erro.textContent = resultado.erro;
      erro.hidden = false;
      return;
    }
    campos.senha.value = '';
    /* A troca de tela acontece em aoMudarUsuario, avisado pelo próprio Supabase. */
  }

  function alternarSenha() {
    var senha = el('login-senha');
    var mostrar = senha.type === 'password';
    senha.type = mostrar ? 'text' : 'password';
    el('mostrar-senha').setAttribute('aria-pressed', String(mostrar));
    el('mostrar-senha').setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
  }

  var idUsuarioAtual = null;
  var listaCarregada = false;

  async function carregarLista() {
    listaCarregada = false;
    mostrarAvisoGeral('');
    mostrarTela('carregando');
    var resultado = await Store.carregar();
    if (resultado.erro) {
      mostrarTela('nenhuma');
      el('topo').hidden = false;
      el('botao-adicionar').hidden = true;
      mostrarAvisoGeral(resultado.erro, true);
      return;
    }
    listaCarregada = true;
    el('botao-adicionar').hidden = false;
    mostrarAvisoListaAntiga();
    aplicarRota();
  }

  /* O Supabase repete o aviso de sessão ao voltar para a aba; só recarrega se a conta mudou. */
  function aoMudarUsuario(usuario) {
    var id = usuario ? usuario.id : null;
    if (id === idUsuarioAtual) return;
    idUsuarioAtual = id;
    el('usuario-email').textContent = usuario ? usuario.email || '' : '';

    if (id) {
      carregarLista();
    } else {
      listaCarregada = false;
      if (dialogo.open) dialogo.close();
      lista.textContent = '';
      document.title = 'Claquete';
      mostrarAvisoGeral('');
      mostrarTela('login');
    }
  }

  async function iniciar() {
    definirVista(lerPreferencia(CHAVE_VISTA) === 'lista' ? 'lista' : 'grade');
    if (!Store.iniciar()) {
      mostrarTela('nenhuma');
      mostrarAvisoGeral(Store.configurado()
        ? 'Não foi possível carregar o site. Verifique a internet e recarregue a página.'
        : 'O site ainda não foi conectado ao banco de dados. Preencha js/config.js.');
      return;
    }

    Store.aoMudarSessao(aoMudarUsuario);
    try {
      var usuario = await Store.usuarioAtual();
      if (!usuario) mostrarTela('login');
      aoMudarUsuario(usuario);
    } catch (e) {
      mostrarTela('login');
    }
  }

  window.addEventListener('hashchange', function () {
    if (rotaAtual().nome !== 'titulo') document.title = 'Claquete';
    if (dialogo.open) dialogo.close();
    aplicarRota();
  });

  document.addEventListener('keydown', function (evento) {
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k' && !el('tela-biblioteca').hidden && !dialogo.open) {
      evento.preventDefault();
      busca.focus();
    }
  });

  el('formulario-login').addEventListener('submit', aoEntrar);
  el('mostrar-senha').addEventListener('click', alternarSenha);
  el('botao-sair').addEventListener('click', function () { Store.sair(); });
  el('aviso-geral-acao').addEventListener('click', carregarLista);
  el('antiga-enviar').addEventListener('click', enviarListaAntiga);
  el('antiga-apagar').addEventListener('click', apagarListaAntiga);
  el('botao-exportar').addEventListener('click', exportarBackup);
  el('botao-importar').addEventListener('click', function () { el('arquivo-importar').click(); });
  el('arquivo-importar').addEventListener('change', importarBackup);

  el('botao-adicionar').addEventListener('click', function () { abrirModal(null); });
  el('dialogo-fechar').addEventListener('click', function () { dialogo.close(); });
  buscaModal.addEventListener('input', aoDigitarBusca);
  buscaModal.addEventListener('keydown', aoTeclarBusca);
  el('modal-manual-abrir').addEventListener('click', function () {
    if (!modalItem) el('manual-titulo').value = buscaModal.value.trim();
    definirModoManual(true);
  });
  el('modal-manual').addEventListener('submit', function (evento) { evento.preventDefault(); });
  el('manual-tipo').addEventListener('change', atualizarAcoes);
  el('manual-remover-poster').addEventListener('click', function () {
    posterRemovido = true;
    el('manual-remover-poster').hidden = true;
    avisar('A imagem será removida ao salvar');
  });
  el('acao-visto').addEventListener('click', function () { salvarDoModal('watched', el('acao-visto')); });
  el('acao-vendo').addEventListener('click', function () { salvarDoModal('watching', el('acao-vendo')); });
  el('acao-quero').addEventListener('click', function () { salvarDoModal('planned', el('acao-quero')); });
  el('acao-usar').addEventListener('click', function () { salvarDoModal(null, el('acao-usar')); });

  busca.addEventListener('input', aoMudarFiltro);
  [filtroGenero, filtroAno, filtroNota, filtroSituacao, filtroOrdem].forEach(function (filtro) {
    filtro.addEventListener('change', aoMudarFiltro);
  });
  document.querySelectorAll('.aba').forEach(function (aba) {
    aba.addEventListener('click', function () {
      tipoAtivo = aba.dataset.tipo;
      aoMudarFiltro();
    });
  });
  el('vista-grade').addEventListener('click', function () { definirVista('grade'); });
  el('vista-lista').addEventListener('click', function () { definirVista('lista'); });

  el('det-status').querySelectorAll('button').forEach(function (botao) {
    botao.addEventListener('click', function () { definirStatusDetalhe(botao.dataset.status); });
  });
  el('seletor-nota').addEventListener('pointerdown', aoPressionarNota);
  el('seletor-nota').addEventListener('pointermove', aoMoverNota);
  el('seletor-nota').addEventListener('keydown', aoTeclarNota);
  el('limpar-nota').addEventListener('click', function () {
    definirNota(0);
    el('seletor-nota').focus();
  });
  el('det-form').addEventListener('submit', aoSalvarDetalhe);
  el('det-remover').addEventListener('click', removerDetalhe);
  el('det-editar').addEventListener('click', function () { abrirModal(Store.obter(detalheId)); });
  el('det-vincular').addEventListener('click', function () { abrirModal(Store.obter(detalheId)); });
  el('det-marcar-temporada').addEventListener('click', marcarTemporadaInteira);
  el('diario-mais').addEventListener('click', function () {
    diarioLimite += DIARIO_POR_VEZ;
    renderizarDiario();
  });
  el('det-mais-um').addEventListener('click', function () {
    marcarEpisodio(Store.obter(detalheId), el('det-mais-um'));
  });

  iniciar();
})();
