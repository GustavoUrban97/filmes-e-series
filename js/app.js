/* Interface: filtros, lista, formulário e backup. Texto do usuário só entra via textContent. */
(function () {
  'use strict';

  var ROTULO_TIPO = { movie: 'Filme', series: 'Série' };
  var ROTULO_SITUACAO = { watched: 'Assistido', watching: 'Assistindo', planned: 'Quero ver' };

  function el(id) { return document.getElementById(id); }

  var lista = el('lista');
  var dialogo = el('dialogo');
  var formulario = el('formulario');
  var erroFormulario = el('formulario-erro');
  var busca = el('filtro-busca');
  var filtroTipo = el('filtro-tipo');
  var filtroSituacao = el('filtro-situacao');
  var filtroOrdem = el('filtro-ordem');
  var mensagem = el('mensagem');

  var idEmEdicao = null;
  var temporizadorMensagem = null;

  function criar(tag, classe, texto) {
    var no = document.createElement(tag);
    if (classe) no.className = classe;
    if (texto !== undefined) no.textContent = texto;
    return no;
  }

  function avisar(texto) {
    mensagem.textContent = texto;
    mensagem.hidden = false;
    clearTimeout(temporizadorMensagem);
    temporizadorMensagem = setTimeout(function () { mensagem.hidden = true; }, 4000);
  }

  function mostrarTela(tela) {
    el('carregando').hidden = tela !== 'carregando';
    el('tela-login').hidden = tela !== 'login';
    el('tela-app').hidden = tela !== 'app';
    el('rodape').hidden = tela !== 'app';
    el('topo-acoes').hidden = tela !== 'app';
  }

  function mostrarAvisoGeral(texto, comRepeticao) {
    el('aviso-geral-texto').textContent = texto || '';
    el('aviso-geral').hidden = !texto;
    el('aviso-geral-acao').hidden = !comRepeticao;
  }

  function semAcento(texto) {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function formatarData(iso) {
    var partes = iso.split('-');
    return partes[2] + '/' + partes[1] + '/' + partes[0];
  }

  function formatarDecimal(numero) {
    return numero.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  function plural(n, singular, pluralTexto) {
    return n + ' ' + (n === 1 ? singular : pluralTexto);
  }

  function renderizarResumo(itens) {
    function conta(condicao) { return itens.filter(condicao).length; }
    var notas = itens.filter(function (i) { return i.rating !== null; });
    var media = notas.length
      ? formatarDecimal(notas.reduce(function (s, i) { return s + i.rating; }, 0) / notas.length)
      : '–';

    var dados = [
      ['Filmes assistidos', conta(function (i) { return i.type === 'movie' && i.status === 'watched'; })],
      ['Séries assistidas', conta(function (i) { return i.type === 'series' && i.status === 'watched'; })],
      ['Assistindo', conta(function (i) { return i.status === 'watching'; })],
      ['Quero ver', conta(function (i) { return i.status === 'planned'; })],
      ['Nota média', media]
    ];

    var resumo = el('resumo');
    resumo.textContent = '';
    dados.forEach(function (d) {
      var bloco = criar('div');
      bloco.appendChild(criar('dt', '', d[0]));
      bloco.appendChild(criar('dd', '', String(d[1])));
      resumo.appendChild(bloco);
    });
  }

  function filtrar(itens) {
    var termo = semAcento(busca.value.trim());
    return itens.filter(function (i) {
      if (filtroTipo.value && i.type !== filtroTipo.value) return false;
      if (filtroSituacao.value && i.status !== filtroSituacao.value) return false;
      if (!termo) return true;
      return semAcento([i.title, i.genres.join(' '), i.notes].join(' ')).indexOf(termo) >= 0;
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

  function renderizarItem(item) {
    var li = criar('li', 'item');

    li.appendChild(criar('h3', '', item.title));

    if (item.rating !== null) {
      var nota = criar('div', 'item-nota', String(item.rating));
      nota.setAttribute('aria-label', 'Nota ' + item.rating + ' de 10');
      nota.appendChild(criar('small', '', '/10'));
      li.appendChild(nota);
    } else {
      li.appendChild(criar('div'));
    }

    var meta = criar('div', 'item-meta');
    var tipo = criar('span', 'item-tipo', ROTULO_TIPO[item.type]);
    tipo.dataset.tipo = item.type;
    meta.appendChild(tipo);
    meta.appendChild(criar('span', '', ROTULO_SITUACAO[item.status]));
    if (item.year !== null) meta.appendChild(criar('span', '', String(item.year)));
    if (item.seasons !== null) meta.appendChild(criar('span', '', plural(item.seasons, 'temporada', 'temporadas')));
    if (item.watchedOn) meta.appendChild(criar('span', '', 'Visto em ' + formatarData(item.watchedOn)));
    if (item.genres.length) meta.appendChild(criar('span', '', item.genres.join(', ')));
    li.appendChild(meta);

    if (item.notes) li.appendChild(criar('p', 'item-notas', item.notes));

    var acoes = criar('div', 'item-acoes');
    var editar = criar('button', 'botao', 'Editar');
    editar.type = 'button';
    editar.setAttribute('aria-label', 'Editar ' + item.title);
    editar.addEventListener('click', function () { abrirFormulario(item); });
    var excluir = criar('button', 'botao', 'Excluir');
    excluir.type = 'button';
    excluir.setAttribute('aria-label', 'Excluir ' + item.title);
    excluir.addEventListener('click', function () { excluirItem(item); });
    acoes.appendChild(editar);
    acoes.appendChild(excluir);
    li.appendChild(acoes);

    return li;
  }

  function filtrosAtivos() {
    return Boolean(busca.value.trim() || filtroTipo.value || filtroSituacao.value);
  }

  function limparFiltros() {
    busca.value = '';
    filtroTipo.value = '';
    filtroSituacao.value = '';
    renderizar();
  }

  function renderizar() {
    var todos = Store.listar();
    var visiveis = ordenar(filtrar(todos));

    renderizarResumo(todos);

    lista.textContent = '';
    visiveis.forEach(function (item) { lista.appendChild(renderizarItem(item)); });

    el('contagem').textContent = visiveis.length
      ? plural(visiveis.length, 'título', 'títulos') + (visiveis.length < todos.length ? ' de ' + todos.length : '')
      : '';

    var vazio = el('vazio');
    vazio.hidden = visiveis.length > 0;
    if (!visiveis.length) {
      var comFiltro = todos.length > 0 && filtrosAtivos();
      el('vazio-texto').textContent = comFiltro
        ? 'Nenhum título corresponde a estes filtros.'
        : 'Sua lista está vazia. Comece pelo último filme ou série que você assistiu.';
      var acao = el('vazio-acao');
      acao.textContent = comFiltro ? 'Limpar filtros' : 'Adicionar título';
      acao.onclick = comFiltro ? limparFiltros : function () { abrirFormulario(null); };
    }
  }

  function atualizarCamposCondicionais() {
    var tipo = formulario.elements.type.value;
    var situacao = formulario.elements.status.value;
    formulario.querySelectorAll('[data-somente]').forEach(function (bloco) {
      var alvo = bloco.dataset.somente;
      bloco.hidden = !(alvo === tipo || alvo === situacao);
    });
  }

  function mostrarErro(texto) {
    erroFormulario.textContent = texto;
    erroFormulario.hidden = !texto;
  }

  function abrirFormulario(item) {
    idEmEdicao = item ? item.id : null;
    formulario.reset();
    mostrarErro('');
    el('dialogo-titulo').textContent = item ? 'Editar título' : 'Adicionar título';

    if (item) {
      var campos = formulario.elements;
      campos.title.value = item.title;
      campos.type.value = item.type;
      campos.status.value = item.status;
      campos.year.value = item.year === null ? '' : item.year;
      campos.seasons.value = item.seasons === null ? '' : item.seasons;
      campos.watchedOn.value = item.watchedOn || '';
      campos.rating.value = item.rating === null ? '' : String(item.rating);
      campos.genres.value = item.genres.join(', ');
      campos.notes.value = item.notes;
    }

    atualizarCamposCondicionais();
    dialogo.showModal();
    formulario.elements.title.focus();
  }

  async function aoEnviar(evento) {
    evento.preventDefault();
    var campos = formulario.elements;
    var botao = formulario.querySelector('[type="submit"]');
    botao.disabled = true;
    var resultado = await Store.salvar({
      id: idEmEdicao,
      title: campos.title.value,
      type: campos.type.value,
      status: campos.status.value,
      year: campos.year.value,
      seasons: campos.seasons.value,
      watchedOn: campos.watchedOn.value,
      rating: campos.rating.value,
      genres: campos.genres.value,
      notes: campos.notes.value
    });
    botao.disabled = false;

    if (resultado.erro) {
      mostrarErro(resultado.erro);
      return;
    }

    dialogo.close();
    renderizar();
    avisar('Salvo: ' + resultado.item.title);
  }

  async function excluirItem(item) {
    if (!window.confirm('Excluir "' + item.title + '"? Esta ação não pode ser desfeita.')) return;
    var resultado = await Store.remover(item.id);
    if (resultado.erro) {
      avisar(resultado.erro);
      return;
    }
    renderizar();
    avisar('Excluído: ' + item.title);
  }

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
      renderizar();
      avisar(resultado.erro || 'Backup importado: ' + resumoImportacao(resultado) + '.');
    };
    leitor.readAsText(arquivo);
  }

  function resumoImportacao(resultado) {
    var partes = [
      plural(resultado.adicionados, 'adicionado', 'adicionados'),
      plural(resultado.atualizados, 'atualizado', 'atualizados')
    ];
    if (resultado.ignorados) partes.push(plural(resultado.ignorados, 'inválido ignorado', 'inválidos ignorados'));
    return partes.join(', ');
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
    renderizar();
    avisar(resultado.erro || 'Lista enviada: ' + resumoImportacao(resultado) + '.');
  }

  function apagarListaAntiga() {
    if (!window.confirm('Apagar a lista antiga deste navegador sem enviá-la ao banco? Esta ação não pode ser desfeita.')) return;
    Store.apagarListaAntiga();
    mostrarAvisoListaAntiga();
  }

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

  async function carregarLista() {
    mostrarAvisoGeral('');
    mostrarTela('carregando');
    var resultado = await Store.carregar();
    if (resultado.erro) {
      mostrarTela('nenhuma');
      el('topo-acoes').hidden = false;
      el('botao-adicionar').hidden = true;
      mostrarAvisoGeral(resultado.erro, true);
      return;
    }
    el('botao-adicionar').hidden = false;
    mostrarTela('app');
    mostrarAvisoListaAntiga();
    renderizar();
  }

  /* O Supabase repete o aviso de sessão ao voltar para a aba; só recarrega se a conta mudou. */
  var idUsuarioAtual = null;

  function aoMudarUsuario(usuario) {
    var id = usuario ? usuario.id : null;
    if (id === idUsuarioAtual) return;
    idUsuarioAtual = id;

    if (id) {
      carregarLista();
    } else {
      if (dialogo.open) dialogo.close();
      lista.textContent = '';
      mostrarAvisoGeral('');
      mostrarTela('login');
    }
  }

  async function iniciar() {
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

  el('formulario-login').addEventListener('submit', aoEntrar);
  el('botao-sair').addEventListener('click', function () { Store.sair(); });
  el('aviso-geral-acao').addEventListener('click', carregarLista);
  el('antiga-enviar').addEventListener('click', enviarListaAntiga);
  el('antiga-apagar').addEventListener('click', apagarListaAntiga);
  el('botao-adicionar').addEventListener('click', function () { abrirFormulario(null); });
  el('botao-cancelar').addEventListener('click', function () { dialogo.close(); });
  el('botao-exportar').addEventListener('click', exportarBackup);
  el('botao-importar').addEventListener('click', function () { el('arquivo-importar').click(); });
  el('arquivo-importar').addEventListener('change', importarBackup);
  formulario.addEventListener('submit', aoEnviar);
  formulario.elements.type.addEventListener('change', atualizarCamposCondicionais);
  formulario.elements.status.addEventListener('change', atualizarCamposCondicionais);
  busca.addEventListener('input', renderizar);
  [filtroTipo, filtroSituacao, filtroOrdem].forEach(function (filtro) {
    filtro.addEventListener('change', renderizar);
  });

  iniciar();
})();
