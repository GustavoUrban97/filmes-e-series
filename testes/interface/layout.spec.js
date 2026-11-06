const { test, expect, semear, simularRecomendacoes } = require('./auxiliares');

/* Cada tela tem um sinal de que terminou de desenhar: só depois dele a largura vale. */
const TELAS = [
  { rota: '#/', pronta: '#lista .cartaz' },
  { rota: '#/quero-assistir', pronta: '#lista .cartaz' },
  { rota: '#/para-voce', pronta: '#rec-lista .cartaz' },
  { rota: '#/diario', pronta: '#diario-lista .sessao' },
  { rota: '#/estatisticas', pronta: '#grafico-generos .barra-h' }
];
const LARGURAS = [375, 860, 1280];

for (const largura of LARGURAS) {
  test(`sem rolagem lateral em ${largura} px`, async ({ page }) => {
    await simularRecomendacoes(page);
    await semear(page, [
      { title: 'Um título com o nome bem comprido para testar', type: 'series', status: 'watching', genres: ['Drama'], anime: true },
      { title: 'Na fila com um nome também bem comprido', type: 'movie', status: 'planned', genres: ['Drama'] },
      { title: 'Attack on Titan', type: 'series', status: 'watched', rating: 10, tmdbId: 1429, watchedOn: '2026-01-15', genres: ['Drama'], anime: true }
    ]);
    await page.setViewportSize({ width: largura, height: 800 });
    for (const tela of TELAS) {
      await page.evaluate((hash) => { location.hash = hash; }, tela.rota);
      await expect(page.locator(tela.pronta).first()).toBeVisible();
      const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(sobra, tela.rota).toBeLessThanOrEqual(0);
    }
  });
}

test('no celular, menu e abas ficam em uma linha', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  const linhas = (seletor) => page.$$eval(seletor, (nos) => new Set(nos.map((n) => n.offsetTop)).size);
  expect(await linhas('.navegacao a')).toBe(1);
  expect(await linhas('#tela-biblioteca .aba')).toBe(1);
});

test('o selo do filme de anime não encosta na nota no celular', async ({ page }) => {
  await semear(page, [{ title: 'Filme', type: 'movie', status: 'watched', rating: 8, anime: true }]);
  await page.setViewportSize({ width: 375, height: 800 });
  const selo = await page.locator('#lista .selo-tipo').boundingBox();
  const nota = await page.locator('#lista .selo-nota').boundingBox();
  const sobrepostos = selo.x < nota.x + nota.width && nota.x < selo.x + selo.width &&
    selo.y < nota.y + nota.height && nota.y < selo.y + selo.height;
  expect(sobrepostos).toBe(false);
});
