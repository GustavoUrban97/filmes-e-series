const { test, expect } = require('@playwright/test');

const EMAIL = process.env.TESTE_A_EMAIL;
const SENHA = process.env.TESTE_A_SENHA;

async function entrar(page) {
  await page.goto('/');
  await page.fill('#formulario-login input[name="email"]', EMAIL);
  await page.fill('#login-senha', SENHA);
  await page.click('#botao-entrar');
  await expect(page.locator('#topo')).toBeVisible();
}

/* Grava direto pela camada de dados, para o teste começar do estado que precisa. */
async function apagarTudo(page) {
  await page.evaluate(async () => {
    for (const item of window.Store.listar()) await window.Store.remover(item.id);
    await window.Store.restaurarDispensados();
  });
}

async function semear(page, titulos) {
  await page.evaluate(async (lista) => {
    for (const titulo of lista) {
      const resultado = await window.Store.salvar(titulo);
      if (resultado.erro) throw new Error(resultado.erro);
    }
  }, titulos);
  await page.reload();
  await expect(page.locator('#topo')).toBeVisible();
}

/* Todo teste começa conectado à conta de teste, com a biblioteca vazia e sem erros de script. */
const testeComConta = test.extend({
  page: async ({ page }, usar) => {
    const erros = [];
    page.on('pageerror', (erro) => erros.push(erro.message));
    await entrar(page);
    await apagarTudo(page);
    await page.reload();
    await expect(page.locator('#topo')).toBeVisible();
    await usar(page);
    expect(erros).toEqual([]);
  }
});

module.exports = { test: testeComConta, testeSemConta: test, expect, semear, EMAIL };
