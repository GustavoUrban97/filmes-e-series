const { test, expect, semear } = require('./auxiliares');

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

test('sem histórico, a tela orienta a registrar títulos', async ({ page }) => {
  await page.click('#nav-recomendacoes');
  await expect(page.locator('#rec-estado-texto')).toContainText('As recomendações aparecem');
  await expect(page.locator('#rec-ir-biblioteca')).toBeVisible();
});

test('recomenda com motivo e não repete o que está na biblioteca', async ({ page }) => {
  await semear(page, [REFERENCIA]);
  await page.click('#nav-recomendacoes');
  await expect(cartazes(page).first()).toBeVisible();
  await expect(page.locator('#rec-lista .rec-motivo').first()).toContainText('Porque você');
  await expect(page.locator('#rec-lista .rec-titulo', { hasText: /^Attack on Titan$/ })).toHaveCount(0);
});

test('Quero assistir leva à fila e tira a sugestão da tela', async ({ page }) => {
  await semear(page, [REFERENCIA]);
  await page.click('#nav-recomendacoes');
  const primeiro = cartazes(page).first();
  const nome = await primeiro.locator('.rec-titulo').innerText();
  await primeiro.getByRole('button', { name: /^Quero assistir/ }).click();

  await expect(page.locator('#nav-fila')).toHaveText('1');
  await expect(page.locator('#rec-lista .rec-titulo').getByText(nome, { exact: true })).toHaveCount(0);
  const salvo = await page.evaluate((titulo) => window.Store.listar().find((i) => i.title === titulo), nome);
  expect(salvo.status).toBe('planned');
  expect(salvo.tmdbId).toBeGreaterThan(0);
});

test('Não me interessa esconde, persiste e Mostrar de novo traz de volta', async ({ page }) => {
  await semear(page, [REFERENCIA]);
  await page.click('#nav-recomendacoes');
  const primeiro = cartazes(page).first();
  const nome = await primeiro.locator('.rec-titulo').innerText();
  await primeiro.getByRole('button', { name: /^Não me interessa/ }).click();

  const mesmoNome = page.locator('#rec-lista .rec-titulo').getByText(nome, { exact: true });
  await expect(mesmoNome).toHaveCount(0);
  await expect(page.locator('#rec-restaurar-texto')).toHaveText('1 título dispensado.');
  await page.reload();
  await expect(cartazes(page).first()).toBeVisible();
  await expect(mesmoNome).toHaveCount(0);

  await page.click('#rec-restaurar-acao');
  await expect(page.locator('#rec-restaurar')).toBeHidden();
  await expect(mesmoNome).toHaveCount(1);
});

test('as abas de Para você separam os tipos', async ({ page }) => {
  await semear(page, [REFERENCIA]);
  await page.click('#nav-recomendacoes');
  await expect(cartazes(page).first()).toBeVisible();

  await page.locator('#tela-recomendacoes .aba[data-rec-tipo="anime"]').click();
  const selos = page.locator('#rec-lista .selo-tipo');
  await expect(selos.first()).toBeVisible();
  for (const texto of await selos.allInnerTexts()) expect(texto.toLowerCase()).toContain('anime');

  await page.locator('#tela-recomendacoes .aba[data-rec-tipo="movie"]').click();
  await expect(selos.first()).toBeVisible();
  for (const texto of await selos.allInnerTexts()) expect(texto.toLowerCase()).toContain('filme');
});

test('clicar no nome abre a prévia com a sinopse', async ({ page }) => {
  await semear(page, [REFERENCIA]);
  await page.click('#nav-recomendacoes');
  await cartazes(page).first().locator('.rec-titulo').click();
  await expect(page.locator('#dialogo')).toBeVisible();
  await expect(page.locator('#previa-sinopse')).not.toHaveText('Carregando sinopse…');
  await expect(page.locator('#acao-visto')).toBeVisible();
});
