# Guia de uso

## Entrar e sair

Entre com o seu e-mail e a sua senha. O login continua ativo neste aparelho até você clicar em **Sair**.

## Adicionar um título

1. Clique em **Adicionar título** e comece a digitar o nome.
2. Escolha o filme ou a série na lista. Título, tipo, ano, gêneros e imagem são preenchidos automaticamente, e você ainda pode alterá-los.
3. Ajuste a situação e, se já assistiu, a data e a nota.
4. Clique em **Salvar**.

Se o título não aparecer na lista, preencha os campos manualmente. Só o título é obrigatório.

Para colocar a imagem em um título já salvo, clique em **Editar**, digite o nome de novo e escolha na lista. O botão **Remover**, ao lado da imagem no formulário, tira a imagem sem alterar o resto.

## Acompanhar uma série

Em uma série, preencha **Temporada** e **Último episódio visto**. O progresso aparece na lista, por exemplo `Temporada 2, episódio 5`. Quando assistir a outro episódio, clique em **Editar** e atualize o número.

## Dar uma nota

A nota vai de meia a 5 estrelas. Clique ou arraste sobre as estrelas: a metade esquerda de cada uma vale meia estrela. No teclado, use as setas. O botão **Limpar** remove a nota.

Alguns campos dependem do que você escolheu:

| Campo | Aparece quando |
| --- | --- |
| Temporada e Último episódio visto | o tipo é **Série** |
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

A lista fica no banco de dados, e o backup é uma cópia extra sob o seu controle.

**Exportar:** clique em **Exportar backup**, no fim da página, e guarde o arquivo `.json` em um lugar seguro.

**Importar:** clique em **Importar backup** e escolha o arquivo. A importação junta o backup com a lista atual:

- títulos que ainda não estão na lista são adicionados;
- se um título existe nos dois, fica a versão editada por último;
- títulos que existem só na lista atual são mantidos;
- registros inválidos no arquivo são ignorados, e o site informa quantos foram.

Por causa dessa junção, **um título excluído volta** se você importar um backup antigo que ainda o contém.

## Lista salva na versão anterior

Se este navegador ainda tiver títulos da versão anterior do site, um aviso aparece depois do login. Escolha **Enviar para o banco** para levá-los à sua conta ou **Apagar do navegador** para descartá-los. O aviso só aparece no mesmo endereço em que a lista foi salva.

## Usar em mais de um aparelho

Entre com a mesma conta. Se a lista estiver aberta em dois aparelhos, recarregue a página para ver o que foi alterado no outro.
