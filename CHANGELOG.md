# Histórico de mudanças

## 6.0.0 - 2026-11-06

- Nova tela **Para você**, com filmes e séries recomendados a partir das suas notas e dos seus gêneros
- Cada sugestão explica o motivo e pode ir para a fila ou ser dispensada
- Títulos dispensados incluídos no backup, agora na versão 4 do formato
- Exige executar `supabase/migracoes/005-recomendacoes.sql` e atualizar a função de busca em projetos existentes

## 5.0.0 - 2026-11-06

- Lista de episódios por temporada, com marcação, data e nota individuais
- **+1 episódio** registra o episódio e passa para a temporada seguinte
- Diário com as sessões por mês
- Estatísticas com tempo assistido, sessões por mês, gêneros e notas
- Tempo acumulado de volta à biblioteca
- Episódios incluídos no backup, agora na versão 3 do formato
- Exige executar `supabase/migracoes/004-episodios.sql` e atualizar a função de busca em projetos existentes

## 4.0.0 - 2026-11-06

- O site passa a se chamar Claquete, com a identidade Cinematic Amber
- Biblioteca em grade de pôsteres, com abas, filtros, exibição em lista, paginação e métricas
- Nova tela de login e novo modal de adicionar, com prévia do título
- Página de detalhes com sinopse, direção, elenco, status, avaliação e progresso da temporada
- Exige executar `supabase/migracoes/003-dados-tmdb.sql` e atualizar a função de busca em projetos existentes

## 3.0.0 - 2026-11-06

- Nova identidade visual, Sala escura, com tema único escuro
- Pôster em destaque nos cards, em uma grade de duas colunas em telas largas
- Fontes Fraunces e Inter servidas pelo próprio site, e novo ícone

## 2.3.0 - 2026-11-06

- Botão **+1 episódio** nas séries com a situação Assistindo

## 2.2.0 - 2026-11-06

- Imagem do título salva e exibida na lista
- Temporada e último episódio visto em séries, no lugar de "temporadas vistas"
- Exige executar `supabase/migracoes/002-poster-e-episodio.sql` em projetos existentes

## 2.1.0 - 2026-11-06

- Nota com seletor de até 5 estrelas, com meia estrela
- Busca de filmes e séries pelo TMDB, com preenchimento de título, tipo, ano e gêneros

## 2.0.0 - 2026-11-06

- Login com e-mail e senha, com cadastro fechado
- Títulos salvos em banco de dados no Supabase, em vez do navegador
- Regras de acesso no banco, para cada conta alcançar só os próprios títulos
- Aviso para enviar ao banco a lista salva no navegador pela versão anterior

## 1.0.0 - 2026-11-05

Primeira versão.

- Cadastro, edição e exclusão de filmes e séries
- Busca, filtros, ordenação e resumo
- Armazenamento no navegador e backup em JSON
- Tema claro e escuro e layout para celular
