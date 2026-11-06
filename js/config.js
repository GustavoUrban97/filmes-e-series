/*
 * Conexão com o Supabase. A chave publishable foi feita para ficar em código de navegador:
 * quem protege os dados é o login e o Row Level Security (supabase/schema.sql).
 * Nunca coloque aqui a chave secreta (secret ou service_role).
 *
 * Só o endereço publicado usa o banco real. Em qualquer outro endereço, como localhost,
 * o site usa o projeto de testes e, se ele não estiver preenchido, não se conecta a nada.
 */
(function () {
  'use strict';

  var ENDERECO_PUBLICADO = 'gustavourban97.github.io';

  var PRODUCAO = {
    ambiente: 'producao',
    supabaseUrl: 'https://djbouioeghjzzgmsveiu.supabase.co',
    supabasePublishableKey: 'sb_publishable_MMtYza03S6QUqz0tqsHzug_C8w89oWw'
  };

  var TESTES = {
    ambiente: 'testes',
    supabaseUrl: 'https://xjcfkdbrmxsnyhrtshva.supabase.co',
    supabasePublishableKey: 'sb_publishable_6imWE9mz_VsTvJzhojzC6g_Qxd4GE8L'
  };

  window.APP_CONFIG = location.hostname === ENDERECO_PUBLICADO ? PRODUCAO : TESTES;
})();
