const { defineConfig } = require('@playwright/test');

/* Os testes dividem a mesma conta, então rodam um por vez. O rastreamento fica desligado
 * porque ele gravaria a senha de teste, e os resultados do Actions podem ser baixados. */
module.exports = defineConfig({
  testDir: 'testes/interface',
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: 'http://localhost:8123',
    screenshot: 'only-on-failure',
    trace: 'off',
    video: 'off'
  },
  webServer: {
    command: 'powershell -NoProfile -ExecutionPolicy Bypass -File scripts/servidor-local.ps1',
    url: 'http://localhost:8123',
    reuseExistingServer: true
  }
});
