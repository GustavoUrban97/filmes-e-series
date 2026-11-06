const { test, expect, semear, recarregar, esperarSinopse } = require('./auxiliares');

const REFERENCIA = {
  title: 'Attack on Titan',
  type: 'series',
  status: 'watched',
  rating: 10,
  tmdbId: 1429,
  year: 2013,
  genres: ['Animação', 'Action & Adventure'],
  anime: true
};

const cartazes = (page) => page.locator('#rec-lista .cartaz');

function candidato(id, title, type, anime) {
  return { id, title, type, year: 2020, genres: ['Drama'], poster: null, vote: 8, anime };
}

/* Respostas fixas: os filtros são testados sem depender do que o TMDB devolve hoje. */
async function simularRecomendacoes(page) {
  await page.route('**/functions/v1/swift-handler', async (rota) => {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    if (rota.request().method() === 'OPTIONS') {
      await rota.fulfill({ status: 204, headers: cors });
      return;
    }
    await rota.fulfill({
      status: 200,
      headers: cors,
      contentType: 'application/json',
      body: JSON.stringify({
        recomendacoes: {
          referencias: [{
            id: 1429,
            type: 'series',
            resultados: [
              candidato(1429, 'Nome traduzido da própria referência', 'series', true),
              candidato(11, 'Série sugerida', 'series', false),
              candidato(12, 'Anime sugerido', 'series', true),
              candidato(13, 'Filme de anime sugerido', 'movie', true),
              candidato(14, 'Filme sugerido', 'movie', false)
            ]
          }],
          generos: []
        }
      })
    });
  });
}

const nomes = async (page) => (await page.locator('#rec-lista .rec-titulo').allInnerTexts()).sort();

test('sem histórico, a tela orienta a registrar títulos', async ({ page }) => {
  await page.click('#nav-recomendacoes');
  await expect(page.locator('#rec-estado-texto')).toContainText('As recomendações aparecem');
  await expect(page.locator('#rec-ir-biblioteca')).toBeVisible();
});

test('não repete o que está na biblioteca, mesmo com outro nome', async ({ page }) => {
  await simularRecomendacoes(page);
  await semear(page, [REFERENCIA]);
  await page.click('#nav-recomendacoes');
  await expect(cartazes(page)).toHaveCount(4);
  expect(await nomes(page)).toEqual(['Anime sugerido', 'Filme de anime sugerido', 'Filme sugerido', 'Série sugerida']);
  await expect(page.locator('#rec-lista .rec-motivo').first()).toHaveText('Porque você deu 5 estrelas a Attack on Titan');
});

test('as abas de Para você separam os tipos', async ({ page }) => {
  await simularRecomendacoes(page);
  await semear(page, [REFERENCIA]);
  await page.click('#nav-recomendacoes');
  await expect(cartazes(page)).toHaveCount(4);

  await page.locator('#tela-recomendacoes .aba[data-rec-tipo="movie"]').click();
  expect(await nomes(page)).toEqual(['Filme de anime sugerido', 'Filme sugerido']);
  await page.locator('#tela-recomendacoes .aba[data-rec-tipo="series"]').click();
  expect(await nomes(page)).toEqual(['Série sugerida']);
  await page.locator('#tela-recomendacoes .aba[data-rec-tipo="anime"]').click();
  expect(await nomes(page)).toEqual(['Anime sugerido', 'Filme de anime sugerido']);
});

test('Quero assistir leva à fila e tira a sugestão da tela', async ({ page }) => {
  await simularRecomendacoes(page);
  await semear(page, [REFERENCIA]);
  await page.click('#nav-recomendacoes');
  await cartazes(page).filter({ hasText: 'Filme sugerido' }).getByRole('button', { name: /^Quero assistir/ }).click();

  await expect(page.locator('#nav-fila')).toHaveText('1');
  await expect(cartazes(page)).toHaveCount(3);
  const salvo = await page.evaluate(() => window.Store.listar().find((i) => i.title === 'Filme sugerido'));
  expect(salvo.status).toBe('planned');
  expect(salvo.tmdbId).toBe(14);
});

test('Não me interessa esconde, persiste e Mostrar de novo traz de volta', async ({ page }) => {
  await simularRecomendacoes(page);
  await semear(page, [REFERENCIA]);
  await page.click('#nav-recomendacoes');
  await cartazes(page).filter({ hasText: 'Série sugerida' }).getByRole('button', { name: /^Não me interessa/ }).click();

  await expect(cartazes(page)).toHaveCount(3);
  await expect(page.locator('#rec-restaurar-texto')).toHaveText('1 título dispensado.');
  await recarregar(page);
  await expect(cartazes(page)).toHaveCount(3);
  expect(await nomes(page)).not.toContain('Série sugerida');

  await page.click('#rec-restaurar-acao');
  await expect(page.locator('#rec-restaurar')).toBeHidden();
  await expect(cartazes(page)).toHaveCount(4);
});

test('com o TMDB real, recomenda e explica o motivo', async ({ page }) => {
  await semear(page, [REFERENCIA]);
  await page.click('#nav-recomendacoes');
  await expect(cartazes(page).first()).toBeVisible();
  await expect(page.locator('#rec-lista .rec-motivo').first()).toContainText('Porque você');
});

test('clicar no nome abre a prévia com a sinopse', async ({ page }) => {
  await semear(page, [REFERENCIA]);
  await page.click('#nav-recomendacoes');
  await cartazes(page).first().locator('.rec-titulo').click();
  await expect(page.locator('#dialogo')).toBeVisible();
  await esperarSinopse(page);
  await expect(page.locator('#acao-visto')).toBeVisible();
});
