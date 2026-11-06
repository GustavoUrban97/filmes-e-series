# Formato dos dados

Os dados são gravados no `localStorage`, na chave `filmes-e-series:v1`. O arquivo de backup usa o formato abaixo.

```json
{
  "app": "filmes-e-series",
  "version": 1,
  "exportedAt": "2026-11-05T18:30:00.000Z",
  "items": [
    {
      "id": "6f1c2a7e-0b1d-4c55-9a33-2f8e4d1b7c90",
      "title": "Exemplo",
      "type": "series",
      "status": "watched",
      "year": 2022,
      "seasons": 2,
      "rating": 9,
      "watchedOn": "2026-10-01",
      "genres": ["drama", "suspense"],
      "notes": "",
      "createdAt": "2026-10-01T21:00:00.000Z",
      "updatedAt": "2026-10-01T21:00:00.000Z"
    }
  ]
}
```

## Campos de cada título

| Campo | Tipo | Regras |
| --- | --- | --- |
| `id` | texto | Identificador único, gerado automaticamente |
| `title` | texto | Obrigatório |
| `type` | texto | `movie` ou `series` |
| `status` | texto | `watched`, `watching` ou `planned` |
| `year` | inteiro ou `null` | De 1888 até o ano atual mais 5 |
| `seasons` | inteiro ou `null` | Maior ou igual a 0; apenas em séries |
| `rating` | inteiro ou `null` | De 1 a 10; apenas com `status` igual a `watched` |
| `watchedOn` | texto ou `null` | Data `AAAA-MM-DD`; apenas com `status` igual a `watched` |
| `genres` | lista de textos | Sem repetição, ignorando maiúsculas e minúsculas |
| `notes` | texto | Pode ser vazio |
| `createdAt` | texto | Data e hora ISO 8601 da criação |
| `updatedAt` | texto | Data e hora ISO 8601 da última edição; decide conflitos na importação |

## Regras de importação

Um arquivo é recusado por inteiro se:

- não for um JSON válido;
- `app` for diferente de `filmes-e-series` ou `items` não for uma lista;
- `version` for maior que a versão suportada pelo site.

Em um arquivo aceito, cada registro é validado individualmente, e os inválidos são ignorados e contados.

## Mudanças no formato

Ao alterar o formato de forma incompatível, aumente `VERSAO` em `js/store.js`, adicione a conversão dos dados antigos e atualize este documento.
