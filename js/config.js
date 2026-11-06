/*
 * Conexão com o Supabase. A chave publishable foi feita para ficar em código de navegador:
 * quem protege os dados é o login e o Row Level Security (supabase/schema.sql).
 * Nunca coloque aqui a chave secreta (secret ou service_role).
 */
window.APP_CONFIG = {
  supabaseUrl: 'https://djbouioeghjzzgmsveiu.supabase.co',
  supabasePublishableKey: 'sb_publishable_MMtYza03S6QUqz0tqsHzug_C8w89oWw'
};
