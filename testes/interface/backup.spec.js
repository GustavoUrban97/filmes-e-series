const fs = require('fs');
const { test, expect, semear, recarregar } = require('./auxiliares');

/* Tudo o que o backup precisa devolver. As datas de edição ficam de fora só dos episódios recriados. */
const lerDados = (page) => page.evaluate(() => {
  const ordenar = (lista, chave) => lista.slice().sort((a, b) => String(chave(a)).localeCompare(String(chave(b))));
  return {
    titulos: ordenar(window.Store.listar(), (i) => i.id),
    episodios: ordenar(window.Store.listarVistas(), (v) => v.season * 1000 + v.episode),
    dispensados: ordenar(window.Store.listarDispensados(), (d) => d.tmdbId).map((d) => [d.tmdbId, d.type])
  };
});

test('exportar o arquivo, apagar tudo e importar devolve os dados', async ({ page }, info) => {
  await semear(page, [
    {
      title: 'Série do backup',
      type: 'series',
      status: 'watching',
      year: 2010,
      genres: ['Drama'],
      anime: true,
      notes: 'Com anotação',
      posterUrl: 'https://image.tmdb.org/t/p/w92/exemplo.jpg',
      tmdbId: 123
    },
    { title: 'Filme do backup', type: 'movie', status: 'watched', rating: 7, watchedOn: '2026-01-15', runtime: 100 }
  ]);
  await page.evaluate(async () => {
    const serie = window.Store.listar().find((i) => i.type === 'series');
    await window.Store.marcarEpisodios(serie.id, [{ season: 1, episode: 1, watchedOn: '2026-02-01', runtime: 40 }]);
    const [vista] = window.Store.listarVistas(serie.id);
    await window.Store.atualizarVista(vista, { rating: 9 });
    await window.Store.dispensar(550, 'movie');
    await window.Store.carregar();
  });
  const antes = await lerDados(page);
  expect(antes.titulos).toHaveLength(2);
  expect(antes.episodios).toHaveLength(1);
  expect(antes.episodios[0].rating).toBe(9);
  expect(antes.dispensados).toEqual([[550, 'movie']]);

  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#botao-exportar')]);
  expect(download.suggestedFilename()).toMatch(/^filmes-e-series-\d{4}-\d{2}-\d{2}\.json$/);
  const caminho = info.outputPath('backup.json');
  await download.saveAs(caminho);

  await page.evaluate(async () => {
    for (const item of window.Store.listar()) await window.Store.remover(item.id);
    await window.Store.restaurarDispensados();
  });
  await recarregar(page);
  await expect(page.locator('#vazio')).toBeVisible();
  const vazio = await lerDados(page);
  expect(vazio.titulos).toHaveLength(0);
  expect(vazio.episodios).toHaveLength(0);

  await page.setInputFiles('#arquivo-importar', caminho);
  await expect(page.locator('#mensagem')).toContainText('Backup importado: 2 adicionados');
  await recarregar(page);

  /* Episódios e títulos voltam a partir do banco, campo por campo. */
  const depois = await lerDados(page);
  const semEdicao = (lista) => lista.map((v) => Object.assign({}, v, { updatedAt: null }));
  expect(depois.titulos.map((t) => Object.assign({}, t, { createdAt: null, updatedAt: null })))
    .toEqual(antes.titulos.map((t) => Object.assign({}, t, { createdAt: null, updatedAt: null })));
  expect(semEdicao(depois.episodios)).toEqual(semEdicao(antes.episodios));
  expect(depois.dispensados).toEqual(antes.dispensados);

  await page.setInputFiles('#arquivo-importar', caminho);
  await expect(page.locator('#mensagem')).toContainText('0 adicionados');
  await recarregar(page);
  await expect(page.locator('#aba-todos')).toHaveText('Todos (2)');
});

test('um arquivo inválido é recusado sem mudar a lista', async ({ page }, info) => {
  await semear(page, [{ title: 'Mantido', type: 'movie', status: 'planned' }]);
  const caminho = info.outputPath('invalido.json');
  fs.writeFileSync(caminho, '{"app":"outro","items":[]}');
  await page.setInputFiles('#arquivo-importar', caminho);
  await expect(page.locator('#mensagem')).toHaveText('Este arquivo não é um backup do Filmes e Séries.');
  await expect(page.locator('#aba-todos')).toHaveText('Todos (1)');
});
