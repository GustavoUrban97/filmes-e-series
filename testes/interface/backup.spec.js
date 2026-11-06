const fs = require('fs');
const { test, expect, semear } = require('./auxiliares');

test('exportar o arquivo, apagar tudo e importar devolve os dados', async ({ page }, info) => {
  await semear(page, [
    { title: 'Série do backup', type: 'series', status: 'watching', year: 2010, genres: ['Drama'], anime: true, notes: 'Com anotação' }
  ]);
  await page.locator('.continuar-item').getByRole('button', { name: /mais um episódio/i }).click();
  await expect(page.locator('.continuar-progresso')).toHaveText('Visto até T1 · E1');
  await page.evaluate(() => window.Store.dispensar(550, 'movie'));

  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#botao-exportar')]);
  expect(download.suggestedFilename()).toMatch(/^filmes-e-series-\d{4}-\d{2}-\d{2}\.json$/);
  const caminho = info.outputPath('backup.json');
  await download.saveAs(caminho);
  const backup = JSON.parse(fs.readFileSync(caminho, 'utf8'));
  expect(backup.items).toHaveLength(1);
  expect(backup.episodeViews).toHaveLength(1);
  expect(backup.dismissed).toHaveLength(1);

  await page.evaluate(async () => {
    for (const item of window.Store.listar()) await window.Store.remover(item.id);
    await window.Store.restaurarDispensados();
  });
  await page.reload();
  await expect(page.locator('#vazio')).toBeVisible();

  await page.setInputFiles('#arquivo-importar', caminho);
  await expect(page.locator('#mensagem')).toContainText('Backup importado: 1 adicionado');
  await page.reload();
  await expect(page.locator('#aba-animes')).toHaveText('Animes (1)');
  await expect(page.locator('.continuar-progresso')).toHaveText('Visto até T1 · E1');
  await expect(page.locator('#lista .cartaz-citacao')).toContainText('Com anotação');
  const dispensados = await page.evaluate(() => window.Store.listarDispensados().length);
  expect(dispensados).toBe(1);

  await page.setInputFiles('#arquivo-importar', caminho);
  await expect(page.locator('#mensagem')).toContainText('0 adicionados');
  await expect(page.locator('#aba-todos')).toHaveText('Todos (1)');
});

test('um arquivo inválido é recusado sem mudar a lista', async ({ page }, info) => {
  await semear(page, [{ title: 'Mantido', type: 'movie', status: 'planned' }]);
  const caminho = info.outputPath('invalido.json');
  fs.writeFileSync(caminho, '{"app":"outro","items":[]}');
  await page.setInputFiles('#arquivo-importar', caminho);
  await expect(page.locator('#mensagem')).toHaveText('Este arquivo não é um backup do Filmes e Séries.');
  await expect(page.locator('#aba-todos')).toHaveText('Todos (1)');
});
