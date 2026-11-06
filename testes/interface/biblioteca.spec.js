const { test, expect, semear, recarregar, esperarSinopse } = require('./auxiliares');

const FILME = { title: 'Filme comum', type: 'movie', status: 'watched', year: 2000, genres: ['Drama'], anime: false };
const SERIE = { title: 'Série comum', type: 'series', status: 'watching', year: 2010, genres: ['Drama'], anime: false };
const FILME_ANIME = { title: 'Filme de anime', type: 'movie', status: 'watched', year: 2001, genres: ['Animação'], anime: true };
const SERIE_ANIME = { title: 'Série de anime', type: 'series', status: 'watching', year: 2013, genres: ['Animação'], anime: true };

const titulosNaGrade = (page) => page.locator('#lista .cartaz-titulo');
const titulosEmAndamento = (page) => page.locator('#continuar-lista .continuar-titulo');

test('adicionar pelo TMDB, dar nota e salvar volta à biblioteca e persiste', async ({ page }) => {
  await page.click('#botao-adicionar');
  await page.fill('#modal-busca', 'Breaking Bad');
  await expect(page.locator('#previa-titulo')).toHaveText('Breaking Bad');
  await esperarSinopse(page);
  await page.click('#acao-visto');
  await expect(page).toHaveURL(/#\/titulo\//);

  await page.locator('#seletor-nota').focus();
  await page.keyboard.press('End');
  await page.fill('#det-notas', 'Anotação de teste');
  await page.click('#det-salvar');

  await expect(page).toHaveURL(/#\/$/);
  await expect(page.locator('#tela-biblioteca')).toBeVisible();
  await recarregar(page);
  const cartaz = page.locator('#lista .cartaz').filter({ hasText: 'Breaking Bad' });
  await expect(cartaz.locator('.selo-nota')).toContainText('5,0');
  await expect(cartaz.locator('.cartaz-citacao')).toContainText('Anotação de teste');
});

test('título já na biblioteca oferece abrir, sem criar cópia', async ({ page }) => {
  await page.click('#botao-adicionar');
  await page.fill('#modal-busca', 'Breaking Bad');
  await expect(page.locator('#previa-titulo')).toHaveText('Breaking Bad');
  await page.click('#acao-quero');
  await expect(titulosNaGrade(page)).toHaveCount(1);

  await page.click('#botao-adicionar');
  await page.fill('#modal-busca', 'Breaking Bad');
  await expect(page.locator('#acao-abrir')).toBeVisible();
  await expect(page.locator('#acao-quero')).toBeHidden();
});

test('as abas separam filmes, séries e animes', async ({ page }) => {
  await semear(page, [FILME, SERIE, FILME_ANIME, SERIE_ANIME]);
  await expect(page.locator('#aba-todos')).toHaveText('Todos (4)');
  await expect(page.locator('#aba-filmes')).toHaveText('Filmes (2)');
  await expect(page.locator('#aba-series')).toHaveText('Séries (1)');
  await expect(page.locator('#aba-animes')).toHaveText('Animes (2)');

  const nomesOrdenados = async () => (await titulosNaGrade(page).allInnerTexts()).sort();

  await page.click('#aba-filmes');
  await expect(titulosNaGrade(page)).toHaveCount(2);
  expect(await nomesOrdenados()).toEqual(['Filme comum', 'Filme de anime']);

  await page.click('#aba-series');
  await expect(titulosNaGrade(page)).toHaveText(['Série comum']);

  await page.click('#aba-animes');
  await expect(titulosNaGrade(page)).toHaveCount(2);
  expect(await nomesOrdenados()).toEqual(['Filme de anime', 'Série de anime']);
  const selos = await page.locator('#lista .selo-tipo').allTextContents();
  expect(selos.sort()).toEqual(['Anime', 'Filme de anime']);
});

test('Continue assistindo segue as abas e some durante a busca', async ({ page }) => {
  await semear(page, [FILME, SERIE, SERIE_ANIME]);
  await expect(titulosEmAndamento(page)).toHaveCount(2);

  await page.click('#aba-animes');
  await expect(titulosEmAndamento(page)).toHaveText(['Série de anime']);
  await page.click('#aba-filmes');
  await expect(page.locator('#continuar')).toBeHidden();
  await page.click('#aba-todos');
  await page.fill('#filtro-busca', 'série');
  await expect(page.locator('#continuar')).toBeHidden();
});

test('+1 episódio avança, grava e aparece no Diário', async ({ page }) => {
  await semear(page, [SERIE]);
  const item = page.locator('.continuar-item');
  await expect(item.locator('.continuar-progresso')).toHaveText('Nenhum episódio marcado');

  await item.getByRole('button', { name: /mais um episódio/i }).click();
  await expect(item.locator('.continuar-progresso')).toHaveText('Visto até T1 · E1');
  await item.getByRole('button', { name: /mais um episódio/i }).click();
  await expect(item.locator('.continuar-progresso')).toHaveText('Visto até T1 · E2');

  await recarregar(page);
  await expect(page.locator('.continuar-progresso')).toHaveText('Visto até T1 · E2');

  await page.click('#nav-diario');
  await expect(page.locator('#diario-total')).toHaveText('2');
  await expect(page.locator('#diario-lista')).toContainText('Temporada 1, episódio 2');
});

test('dois cliques em botões +1 do mesmo título contam um episódio', async ({ page }) => {
  await semear(page, [SERIE]);
  const botoes = page.getByRole('button', { name: /mais um episódio/i });
  await expect(botoes).toHaveCount(2);

  /* O banco ignora gravações repetidas, então só a contagem de pedidos revela um clique duplo. */
  let gravacoes = 0;
  page.on('request', (pedido) => {
    if (pedido.method() === 'POST' && pedido.url().includes('/rest/v1/episode_views')) gravacoes++;
  });
  await page.evaluate(() => {
    document.querySelectorAll('[data-mais-um]').forEach((botao) => botao.click());
  });
  await expect(page.locator('.continuar-progresso')).toHaveText('Visto até T1 · E1');
  await expect(page.locator('#mensagem')).toContainText('E1 marcado');
  expect(gravacoes).toBe(1);
  const total = await page.evaluate(() => window.Store.listarVistas().length);
  expect(total).toBe(1);
});

test('salvar um título aberto pelo Diário volta ao Diário', async ({ page }) => {
  await semear(page, [Object.assign({}, FILME, { watchedOn: '2026-01-15' })]);
  await page.click('#nav-diario');
  await page.click('.sessao-titulo');
  await expect(page).toHaveURL(/#\/titulo\//);
  await page.click('#det-salvar');
  await expect(page).toHaveURL(/#\/diario$/);
  await expect(page.locator('#tela-diario')).toBeVisible();

  await page.goBack();
  await expect(page).not.toHaveURL(/#\/titulo\//);
});

test('a caixa É anime é mantida depois de salvar', async ({ page }) => {
  await semear(page, [SERIE]);
  await page.click('#lista .cartaz-titulo');
  await expect(page.locator('#det-tipo')).toHaveText('Série');
  await page.check('#det-anime');
  await page.click('#det-salvar');
  await expect(page.locator('#aba-animes')).toHaveText('Animes (1)');
  await recarregar(page);
  await expect(page.locator('#aba-series')).toHaveText('Séries (0)');
});

test('excluir um título pede confirmação e o remove', async ({ page }) => {
  await semear(page, [FILME]);
  await page.click('#lista .cartaz-titulo');

  /* Recusar mantém o título. */
  let pedidos = 0;
  page.once('dialog', (dialogo) => {
    pedidos++;
    dialogo.dismiss();
  });
  await page.click('#det-remover');
  await expect.poll(() => pedidos).toBe(1);
  await expect(page).toHaveURL(/#\/titulo\//);

  page.once('dialog', (dialogo) => {
    pedidos++;
    dialogo.accept();
  });
  await page.click('#det-remover');
  await expect(page.locator('#vazio')).toBeVisible();
  expect(pedidos).toBe(2);

  await recarregar(page);
  await expect(page.locator('#vazio')).toBeVisible();
  await expect(titulosNaGrade(page)).toHaveCount(0);
});
