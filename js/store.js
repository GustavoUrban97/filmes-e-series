/* Dados: validação, persistência no localStorage e backup em JSON. Não toca no DOM. */
(function () {
  'use strict';

  var CHAVE = 'filmes-e-series:v1';
  var APP = 'filmes-e-series';
  var VERSAO = 1;
  var ANO_MINIMO = 1888;

  var TIPOS = ['movie', 'series'];
  var SITUACOES = ['watched', 'watching', 'planned'];

  function novoId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

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

    var temporadas = entrada.type === 'series' ? inteiroOuNulo(entrada.seasons) : null;
    if (temporadas !== null && !(temporadas >= 0)) {
      return { erro: 'As temporadas devem ser um número inteiro.' };
    }

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
        id: entrada.id ? String(entrada.id) : novoId(),
        title: titulo,
        type: entrada.type,
        status: entrada.status,
        year: ano,
        seasons: temporadas,
        rating: nota,
        watchedOn: vistoEm,
        genres: generos,
        notes: String(entrada.notes || '').trim(),
        createdAt: entrada.createdAt || agora,
        updatedAt: entrada.updatedAt || agora
      }
    };
  }

  function validarLista(lista) {
    var itens = [];
    var ignorados = 0;
    (Array.isArray(lista) ? lista : []).forEach(function (entrada) {
      var resultado = normalizar(entrada);
      if (resultado.item) itens.push(resultado.item);
      else ignorados++;
    });
    return { itens: itens, ignorados: ignorados };
  }

  var itens = [];
  var armazenamentoDisponivel = true;

  function carregar() {
    try {
      var bruto = localStorage.getItem(CHAVE);
      itens = bruto ? validarLista(JSON.parse(bruto).items).itens : [];
      localStorage.setItem(CHAVE + ':teste', '1');
      localStorage.removeItem(CHAVE + ':teste');
      armazenamentoDisponivel = true;
    } catch (e) {
      armazenamentoDisponivel = false;
    }
    return armazenamentoDisponivel;
  }

  function persistir() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify({ version: VERSAO, items: itens }));
      armazenamentoDisponivel = true;
      return true;
    } catch (e) {
      armazenamentoDisponivel = false;
      return false;
    }
  }

  function salvar(entrada) {
    var existente = entrada.id ? obter(entrada.id) : null;
    var resultado = normalizar(Object.assign({}, entrada, {
      createdAt: existente ? existente.createdAt : undefined,
      updatedAt: new Date().toISOString()
    }));
    if (resultado.erro) return resultado;

    if (existente) itens[itens.indexOf(existente)] = resultado.item;
    else itens.push(resultado.item);
    resultado.persistido = persistir();
    return resultado;
  }

  function remover(id) {
    itens = itens.filter(function (item) { return item.id !== id; });
    return persistir();
  }

  function obter(id) {
    return itens.filter(function (item) { return item.id === id; })[0] || null;
  }

  function exportar() {
    return JSON.stringify({
      app: APP,
      version: VERSAO,
      exportedAt: new Date().toISOString(),
      items: itens
    }, null, 2);
  }

  /* Mescla pelo id: registros novos entram e, em conflito, vale o editado por último. */
  function importar(texto) {
    var dados;
    try {
      dados = JSON.parse(texto);
    } catch (e) {
      return { erro: 'O arquivo não é um JSON válido.' };
    }
    if (!dados || dados.app !== APP || !Array.isArray(dados.items)) {
      return { erro: 'Este arquivo não é um backup do Filmes e Séries.' };
    }
    if (dados.version > VERSAO) {
      return { erro: 'Este backup foi criado por uma versão mais nova do site.' };
    }

    var validados = validarLista(dados.items);
    var adicionados = 0;
    var atualizados = 0;
    validados.itens.forEach(function (novo) {
      var atual = obter(novo.id);
      if (!atual) {
        itens.push(novo);
        adicionados++;
      } else if (new Date(novo.updatedAt) > new Date(atual.updatedAt)) {
        itens[itens.indexOf(atual)] = novo;
        atualizados++;
      }
    });

    return {
      adicionados: adicionados,
      atualizados: atualizados,
      ignorados: validados.ignorados,
      persistido: persistir()
    };
  }

  window.Store = {
    carregar: carregar,
    salvar: salvar,
    remover: remover,
    obter: obter,
    exportar: exportar,
    importar: importar,
    listar: function () { return itens.slice(); },
    disponivel: function () { return armazenamentoDisponivel; }
  };
})();
