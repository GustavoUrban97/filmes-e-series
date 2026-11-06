const { test, expect } = require('@playwright/test');

const SITE = 'http://localhost:8123';
const PROJETO_TESTES = 'https://xjcfkdbrmxsnyhrtshva.supabase.co';
const EMAIL = process.env.TESTE_A_EMAIL;
const SENHA = process.env.TESTE_A_SENHA;

/* Limpa a conta pela camada de dados. Recusa rodar fora do projeto de testes, porque apaga tudo. */
async function apagarTudo(page) {
  const restantes = await page.evaluate(async (projeto) => {
    if (window.APP_CONFIG.supabaseUrl !== projeto) throw new Error('Este teste só roda no projeto de testes.');
    for (const item of window.Store.listar()) {
      const remocao = await window.Store.remover(item.id);
      if (remocao.erro) throw new Error(remocao.erro);
    }
    const restauracao = await window.Store.restaurarDispensados();
    if (restauracao.erro) throw new Error(restauracao.erro);
    const recarga = await window.Store.carregar();
    if (recarga.erro) throw new Error(recarga.erro);
    return window.Store.listar().length + window.Store.listarDispensados().length;
  }, PROJETO_TESTES);
  expect(restantes).toBe(0);
}

async function recarregar(page) {
  await page.reload();
  await expect(page.locator('#carregando')).toBeHidden();
  await expect(page.locator('#topo')).toBeVisible();
}

/* Grava direto pela camada de dados, para o teste começar do estado que precisa. */
async function semear(page, titulos) {
  await page.evaluate(async (lista) => {
    for (const titulo of lista) {
      const resultado = await window.Store.salvar(titulo);
      if (resultado.erro) throw new Error(resultado.erro);
    }
  }, titulos);
  await recarregar(page);
}

/* Um único login por execução, porque o Supabase limita as tentativas por endereço.
 * Todo teste começa conectado, com a biblioteca vazia e sem erros de script. */
const testeComConta = test.extend({
  sessao: [async ({ browser }, usar) => {
    const contexto = await browser.newContext();
    const pagina = await contexto.newPage();
    await pagina.goto(SITE);
    await pagina.fill('#formulario-login input[name="email"]', EMAIL);
    await pagina.fill('#login-senha', SENHA);
    await pagina.click('#botao-entrar');
    await expect(pagina.locator('#topo')).toBeVisible();
    const estado = await contexto.storageState();
    await contexto.close();
    await usar(estado);
  }, { scope: 'worker' }],
  storageState: async ({ sessao }, usar) => {
    await usar(sessao);
  },
  page: async ({ page }, usar) => {
    const erros = [];
    page.on('pageerror', (erro) => erros.push(erro.message));
    /* A captura de tela só mostra a mensagem genérica: o motivo real fica no registro da execução. */
    page.on('response', async (resposta) => {
      if (!resposta.url().includes('/functions/v1/') || resposta.ok()) return;
      const corpo = await resposta.text().catch(() => '');
      console.log(`Função respondeu ${resposta.status()}: ${corpo.slice(0, 300)}`);
    });
    page.on('requestfailed', (pedido) => {
      if (pedido.url().includes('/functions/v1/')) console.log(`Pedido à função falhou: ${pedido.failure().errorText}`);
    });
    await page.goto('/');
    await expect(page.locator('#carregando')).toBeHidden();
    await expect(page.locator('#topo')).toBeVisible();
    await apagarTudo(page);
    await recarregar(page);
    await usar(page);
    expect(erros).toEqual([]);
  }
});

/* A busca e a prévia terminaram com um texto de verdade, não com carregamento ou erro. */
async function esperarSinopse(page) {
  await expect(page.locator('#previa-sinopse')).not.toHaveText(/^$|Carregando|Não foi possível|não tem sinopse/);
}

function candidato(id, title, type, anime) {
  return { id, title, type, year: 2020, genres: ['Drama'], poster: null, vote: 8, anime };
}

/* Respostas fixas para a referência 1429: filtros e layout são testados sem depender do TMDB. */
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

module.exports = {
  test: testeComConta,
  testeSemConta: test,
  expect,
  semear,
  recarregar,
  esperarSinopse,
  simularRecomendacoes,
  EMAIL
};
