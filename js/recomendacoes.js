/* Recomendações: lê o gosto da biblioteca e pontua os candidatos do TMDB. Não toca no DOM nem no banco. */
(function () {
  'use strict';

  var MAX_REFERENCIAS = 8;
  var MAX_GENEROS = 3;
  var PESO_SEM_NOTA = 0.3;
  var NOTA_NEUTRA = 6;
  var NOTA_MINIMA_TMDB = 5;
  var PESO_DESCOBERTA = 0.2;
  var PESO_GENERO = 0.4;
  var PESO_VOTO = 0.03;
  var VOTO_NEUTRO = 7;
  var QUEDA_POR_POSICAO = 40;

  /* O TMDB usa gêneros combinados nas séries e separados nos filmes. */
  var GENEROS_COMBINADOS = {
    'action & adventure': ['ação', 'aventura'],
    'sci-fi & fantasy': ['ficção científica', 'fantasia'],
    'war & politics': ['guerra', 'política']
  };

  function generosNormalizados(generos) {
    var saida = [];
    generos.forEach(function (genero) {
      var nome = genero.toLocaleLowerCase('pt-BR').trim();
      (GENEROS_COMBINADOS[nome] || [nome]).forEach(function (parte) {
        if (saida.indexOf(parte) < 0) saida.push(parte);
      });
    });
    return saida;
  }

  function chave(id, tipo) { return tipo + ':' + id; }

  function textoComparavel(texto) {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  /* Usa a nota do título ou, numa série sem nota, a média dos episódios avaliados. */
  function notaDe(item, vistas) {
    if (item.rating !== null) return item.rating;
    var notas = vistas.filter(function (v) { return v.titleId === item.id && v.rating !== null; });
    if (!notas.length) return null;
    return notas.reduce(function (soma, v) { return soma + v.rating; }, 0) / notas.length;
  }

  /* De -1 a 1. Títulos só na fila não dizem nada sobre o gosto. */
  function pesoDe(item, nota) {
    if (item.status === 'planned') return null;
    return nota === null ? PESO_SEM_NOTA : (nota - NOTA_NEUTRA) / (10 - NOTA_NEUTRA);
  }

  /* Monta o gosto: de onde partir, gêneros favoritos e afinidade com cada gênero. */
  function lerGosto(itens, vistas) {
    var considerados = [];
    var somaGenero = {};
    var contaGenero = {};
    itens.forEach(function (item) {
      var nota = notaDe(item, vistas);
      var peso = pesoDe(item, nota);
      if (peso === null) return;
      considerados.push({ item: item, nota: nota, peso: peso });
      generosNormalizados(item.genres).forEach(function (genero) {
        somaGenero[genero] = (somaGenero[genero] || 0) + peso;
        contaGenero[genero] = (contaGenero[genero] || 0) + 1;
      });
    });

    var afinidade = {};
    Object.keys(somaGenero).forEach(function (genero) {
      /* Soma 1 ao divisor para que um único título não defina o gênero sozinho. */
      afinidade[genero] = somaGenero[genero] / (contaGenero[genero] + 1);
    });

    var referencias = considerados.filter(function (c) {
      return c.item.tmdbId && c.peso > 0;
    }).sort(function (a, b) {
      return b.peso - a.peso || (a.item.updatedAt < b.item.updatedAt ? 1 : -1);
    }).slice(0, MAX_REFERENCIAS);

    var favoritos = Object.keys(somaGenero).filter(function (genero) {
      return somaGenero[genero] > 0;
    }).sort(function (a, b) {
      return somaGenero[b] - somaGenero[a] || a.localeCompare(b, 'pt-BR');
    }).slice(0, MAX_GENEROS);

    return {
      referencias: referencias,
      favoritos: favoritos,
      afinidade: afinidade,
      avaliados: considerados.filter(function (c) { return c.nota !== null; }).length,
      semTmdb: considerados.filter(function (c) { return !c.item.tmdbId; }).length
    };
  }

  function pedidoDe(gosto) {
    return {
      referencias: gosto.referencias.map(function (r) { return { id: r.item.tmdbId, type: r.item.type }; }),
      generos: gosto.favoritos
    };
  }

  function bonusGenero(generos, afinidade) {
    var nomes = generosNormalizados(generos);
    if (!nomes.length) return 0;
    return nomes.reduce(function (soma, nome) { return soma + (afinidade[nome] || 0); }, 0) / nomes.length;
  }

  function frasePara(referencia) {
    var nota = referencia.item.rating;
    if (nota !== null) {
      var estrelas = (nota / 2).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
      return 'Porque você deu ' + estrelas + (nota === 2 ? ' estrela a ' : ' estrelas a ') + referencia.item.title;
    }
    if (referencia.nota !== null) return 'Porque você gostou de ' + referencia.item.title;
    if (referencia.item.status === 'watching') return 'Porque você está vendo ' + referencia.item.title;
    return 'Porque você assistiu a ' + referencia.item.title;
  }

  function motivoDe(candidato) {
    var origens = candidato.origens.slice().sort(function (a, b) { return b.peso - a.peso; });
    if (origens.length > 1) return 'Porque você gostou de ' + origens[0].item.title + ' e ' + origens[1].item.title;
    if (origens.length) return frasePara(origens[0]);
    var genero = candidato.generoFavorito;
    return 'Porque você curte ' + genero.charAt(0).toLocaleUpperCase('pt-BR') + genero.slice(1);
  }

  /* Devolve os candidatos do melhor para o pior, sem o que já está na biblioteca ou foi dispensado. */
  function ordenar(resposta, gosto, itens, dispensados) {
    var fora = {};
    var foraPorNome = {};
    itens.forEach(function (item) {
      if (item.tmdbId) fora[chave(item.tmdbId, item.type)] = true;
      else foraPorNome[textoComparavel(item.title) + '|' + item.year] = true;
    });
    dispensados.forEach(function (d) { fora[chave(d.tmdbId, d.type)] = true; });

    var candidatos = {};
    function candidatoDe(resultado) {
      var id = chave(resultado.id, resultado.type);
      if (!candidatos[id]) candidatos[id] = { resultado: resultado, base: 0, origens: [], generoFavorito: null };
      return candidatos[id];
    }
    function decaimento(posicao) { return 1 - posicao / QUEDA_POR_POSICAO; }

    resposta.referencias.forEach(function (lista) {
      var referencia = gosto.referencias.filter(function (r) {
        return r.item.tmdbId === lista.id && r.item.type === lista.type;
      })[0];
      if (!referencia) return;
      lista.resultados.forEach(function (resultado, posicao) {
        var candidato = candidatoDe(resultado);
        candidato.base += referencia.peso * decaimento(posicao);
        candidato.origens.push(referencia);
      });
    });
    resposta.generos.forEach(function (lista) {
      lista.resultados.forEach(function (resultado, posicao) {
        var candidato = candidatoDe(resultado);
        candidato.base += PESO_DESCOBERTA * decaimento(posicao);
        if (!candidato.generoFavorito) candidato.generoFavorito = lista.nome;
      });
    });

    return Object.keys(candidatos).map(function (id) {
      return candidatos[id];
    }).filter(function (c) {
      var r = c.resultado;
      return !fora[chave(r.id, r.type)] &&
        !foraPorNome[textoComparavel(r.title) + '|' + r.year] &&
        r.vote !== null && r.vote >= NOTA_MINIMA_TMDB;
    }).map(function (c) {
      return {
        resultado: c.resultado,
        motivo: motivoDe(c),
        pontos: c.base + PESO_GENERO * bonusGenero(c.resultado.genres, gosto.afinidade) +
          PESO_VOTO * (c.resultado.vote - VOTO_NEUTRO)
      };
    }).sort(function (a, b) {
      return b.pontos - a.pontos || a.resultado.title.localeCompare(b.resultado.title, 'pt-BR');
    });
  }

  window.Recomendador = { lerGosto: lerGosto, pedidoDe: pedidoDe, ordenar: ordenar };
})();
