# Publicação

O site é publicado pelo GitHub Pages diretamente da raiz da branch `main`. Não há build: cada push na `main` atualiza o site em poucos minutos.

## Publicar uma alteração

```bash
git add .
git commit -m "Descreva a alteração"
git push
```

Para acompanhar a publicação, abra a aba **Actions** do repositório.

## Configuração do Pages

Em **Settings > Pages** do repositório:

- **Source:** Deploy from a branch
- **Branch:** `main`, pasta `/ (root)`

O arquivo `.nojekyll` faz o GitHub servir os arquivos como estão, sem processá-los com o Jekyll.

## Depois de uma atualização

Os dados ficam no navegador e não são afetados por uma nova publicação. Eles dependem do endereço do site: mudar o nome do repositório ou o nome de usuário muda o endereço, e a lista salva não acompanha. Antes de uma mudança assim, exporte um backup para importá-lo no novo endereço.
