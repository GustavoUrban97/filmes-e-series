const { test, expect, semear } = require('./auxiliares');

const ROTAS = ['#/', '#/quero-assistir', '#/para-voce', '#/diario', '#/estatisticas'];
const LARGURAS = [375, 860, 1280];

for (const largura of LARGURAS) {
  test(`sem rolagem lateral em ${largura} px`, async ({ page }) => {
    await semear(page, [
      { title: 'Um título com o nome bem comprido para testar', type: 'series', status: 'watching', genres: ['Drama'], anime: true },
      { title: 'Filme', type: 'movie', status: 'watched', rating: 8, watchedOn: '2026-01-15', genres: ['Drama'] }
    ]);
    await page.setViewportSize({ width: largura, height: 800 });
    for (const rota of ROTAS) {
      await page.evaluate((hash) => { location.hash = hash; }, rota);
      await page.waitForTimeout(300);
      const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(sobra, rota).toBeLessThanOrEqual(0);
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
