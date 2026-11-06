# Guia de uso

## Adicionar um título

1. Clique em **Adicionar título**.
2. Preencha o título, o único campo obrigatório, e escolha o tipo e a situação.
3. Clique em **Salvar**.

Alguns campos dependem do que você escolheu:

| Campo | Aparece quando |
| --- | --- |
| Temporadas vistas | o tipo é **Série** |
| Visto em e Nota | a situação é **Assistido** |

> Ao mudar um título de **Assistido** para outra situação, a nota e a data são apagadas ao salvar.

## Encontrar um título

- **Buscar** procura no título, nos gêneros e nas anotações. Acentos não fazem diferença: `serie` encontra `Série`.
- **Tipo** e **Situação** restringem a lista.
- **Ordenar por** muda a ordem. Títulos sem o dado usado na ordenação, como a nota, ficam no fim.

O resumo no topo sempre considera a lista inteira, sem aplicar os filtros. A nota média considera apenas os títulos com nota.

## Editar ou excluir

Use os botões **Editar** e **Excluir** de cada título. A exclusão pede confirmação e não pode ser desfeita.

## Backup

A lista fica salva apenas no navegador que você está usando. Ela é perdida se você limpar os dados do site, e navegação anônima não a mantém depois de fechar a janela.

**Exportar:** clique em **Exportar backup**, no fim da página, e guarde o arquivo `.json` em um lugar seguro.

**Importar:** clique em **Importar backup** e escolha o arquivo. A importação junta o backup com a lista atual:

- títulos que ainda não estão na lista são adicionados;
- se um título existe nos dois, fica a versão editada por último;
- títulos que existem só na lista atual são mantidos;
- registros inválidos no arquivo são ignorados, e o site informa quantos foram.

Por causa dessa junção, **um título excluído volta** se você importar um backup antigo que ainda o contém.

## Usar em mais de um aparelho

Não há sincronização automática. Para levar a lista a outro aparelho, exporte o backup em um e importe no outro.
