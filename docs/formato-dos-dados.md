# Formato dos dados

Os dados são gravados na tabela `titles` do Supabase, definida em [`supabase/schema.sql`](../supabase/schema.sql). Lá, os campos usam nomes como `watched_on` e `created_at`, além de `user_id` para indicar a conta dona de cada linha. O arquivo de backup usa o formato abaixo, sem `user_id`.

```json
{
  "app": "filmes-e-series",
  "version": 4,
  "exportedAt": "2026-11-05T18:30:00.000Z",
  "items": [
    {
      "id": "6f1c2a7e-0b1d-4c55-9a33-2f8e4d1b7c90",
      "title": "Exemplo",
      "type": "series",
      "status": "watched",
      "year": 2022,
      "season": 2,
      "episode": 5,
      "posterUrl": "https://image.tmdb.org/t/p/w92/exemplo.jpg",
      "tmdbId": 603,
      "director": "Nome da direção",
      "rating": 9,
      "watchedOn": "2026-10-01",
      "genres": ["drama", "suspense"],
      "notes": "",
      "createdAt": "2026-10-01T21:00:00.000Z",
      "updatedAt": "2026-10-01T21:00:00.000Z"
    }
  ],
  "episodeViews": [
    {
      "titleId": "6f1c2a7e-0b1d-4c55-9a33-2f8e4d1b7c90",
      "season": 2,
      "episode": 5,
      "watchedOn": "2026-10-01",
      "rating": 8,
      "runtime": 47,
      "updatedAt": "2026-10-01T22:00:00.000Z"
    }
  ],
  "dismissed": [
    {
      "tmdbId": 550,
      "type": "movie",
      "createdAt": "2026-10-02T20:00:00.000Z"
    }
  ]
}
```

## Campos de cada título

| Campo | Tipo | Regras |
| --- | --- | --- |
| `id` | UUID | Identificador único, gerado automaticamente; um valor que não seja UUID é trocado na importação |
| `title` | texto | Obrigatório |
| `type` | texto | `movie` ou `series` |
| `status` | texto | `watched`, `watching` ou `planned` |
| `year` | inteiro ou `null` | De 1888 até o ano atual mais 5 |
| `season` | inteiro ou `null` | Temporada atual, maior ou igual a 0; apenas em séries. Backups da versão 1 usam `seasons`, que é aceito na importação |
| `episode` | inteiro ou `null` | Último episódio visto, maior ou igual a 0; apenas em séries |
| `posterUrl` | texto ou `null` | Endereço da imagem no TMDB; outros endereços são descartados |
| `tmdbId` | inteiro ou `null` | Identificador no TMDB, usado para buscar sinopse e créditos; opcional em backups antigos |
| `director` | texto ou `null` | Direção do filme ou criação da série, mostrada no cartaz; opcional em backups antigos |
| `rating` | inteiro ou `null` | De 1 a 10, em que cada ponto vale meia estrela (7 = 3,5 estrelas); apenas com `status` igual a `watched` |
| `watchedOn` | texto ou `null` | Data `AAAA-MM-DD`; apenas com `status` igual a `watched` |
| `genres` | lista de textos | Sem repetição, ignorando maiúsculas e minúsculas |
| `notes` | texto | Pode ser vazio |
| `createdAt` | texto | Data e hora ISO 8601 da criação |
| `updatedAt` | texto | Data e hora ISO 8601 da última edição; decide conflitos na importação |

O título também aceita `runtime`, a duração do filme em minutos, ou `null`.

## Episódios vistos

Ficam na tabela `episode_views` e em `episodeViews` no backup, que é opcional em backups antigos. Cada combinação de título, temporada e episódio aparece uma vez.

| Campo | Tipo | Regras |
| --- | --- | --- |
| `titleId` | UUID | Título da biblioteca; se ele não existir, o registro é ignorado |
| `season` e `episode` | inteiro | Maiores ou iguais a 0 |
| `watchedOn` | texto | Data `AAAA-MM-DD` |
| `rating` | inteiro ou `null` | De 1 a 10, em que cada ponto vale meia estrela |
| `runtime` | inteiro ou `null` | Duração em minutos |
| `updatedAt` | texto | Decide conflitos na importação |

## Títulos dispensados

Ficam na tabela `dismissed_titles` e em `dismissed` no backup, que é opcional em backups antigos. A importação só acrescenta registros.

| Campo | Tipo | Regras |
| --- | --- | --- |
| `tmdbId` | inteiro | Identificador no TMDB, maior que 0 |
| `type` | texto | `movie` ou `series` |
| `createdAt` | texto | Data e hora ISO 8601; é informativa, e a importação não a preserva |

## Regras de importação

Um arquivo é recusado por inteiro se:

- não for um JSON válido;
- `app` for diferente de `filmes-e-series` ou `items` não for uma lista;
- `version` for maior que a versão suportada pelo site.

Em um arquivo aceito, cada registro é validado individualmente, e os inválidos são ignorados e contados.

## Mudanças no formato

Ao alterar o formato de forma incompatível, aumente `VERSAO` em `js/store.js`, adicione a conversão dos dados antigos e atualize este documento.
