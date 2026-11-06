const { test, testeSemConta, expect, EMAIL } = require('./auxiliares');

testeSemConta('sem login, só a tela de entrada aparece', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#tela-login')).toBeVisible();
  await expect(page.locator('#topo')).toBeHidden();
});

testeSemConta('senha errada mostra o erro e não entra', async ({ page }) => {
  await page.goto('/');
  await page.fill('#formulario-login input[name="email"]', EMAIL);
  await page.fill('#login-senha', 'senha-errada');
  await page.click('#botao-entrar');
  await expect(page.locator('#login-erro')).toHaveText('E-mail ou senha incorretos.');
  await expect(page.locator('#topo')).toBeHidden();
});

test('em localhost, o site usa o ambiente de testes e avisa', async ({ page }) => {
  await expect(page.locator('#faixa-testes')).toBeVisible();
  const ambiente = await page.evaluate(() => window.APP_CONFIG.ambiente);
  expect(ambiente).toBe('testes');
});

test('sair volta à tela de entrada', async ({ page }) => {
  await page.click('#botao-sair');
  await expect(page.locator('#tela-login')).toBeVisible();
  await page.reload();
  await expect(page.locator('#tela-login')).toBeVisible();
});
