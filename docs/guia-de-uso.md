# Guia de uso

## Entrar e sair

Entre com o seu e-mail e a sua senha. O login continua ativo neste aparelho até você clicar em **Sair**.

## Adicionar um título

1. Clique em **Adicionar** e digite o nome do filme ou da série.
2. Escolha na lista. A prévia à direita mostra sinopse, direção e elenco.
3. Clique em uma das opções:
   - **Já assisti:** salva e abre a página do título, para você dar a nota.
   - **Estou assistindo:** aparece apenas em séries.
   - **Quero assistir:** salva na sua fila.

Se o título já estiver na biblioteca, o site oferece abri-lo, sem criar uma cópia.

Se ele não aparecer na lista, clique em **Não achou? Preencher manualmente**. Só o título é obrigatório.

## Encontrar um título

- **Biblioteca** mostra tudo, e **Quero assistir** mostra só a sua fila.
- As abas separam filmes e séries.
- O filtro procura no título, na direção, nos gêneros e nas anotações, e `Ctrl+K` leva até ele. Acentos não fazem diferença.
- Também é possível filtrar por gênero, ano, nota e situação, ordenar e alternar entre grade e lista.

As métricas no fim da página sempre consideram a biblioteca inteira, sem aplicar os filtros.

## Página do título

Clique em um cartaz para abrir a página do título. Nela você pode:

- mudar o status entre **Quero ver**, **Vendo** e **Visto**;
- dar a nota e informar a data, se já assistiu;
- escrever anotações, cuja primeira linha aparece no cartaz;
- clicar em **Salvar avaliação** para gravar tudo isso.

> Ao mudar um título de **Visto** para outro status, a nota e a data são apagadas ao salvar.

### Dar uma nota

A nota vai de meia a 5 estrelas. Clique ou arraste sobre as estrelas: a metade esquerda de cada uma vale meia estrela. No teclado, use as setas. O botão **Limpar** remove a nota.

### Títulos sem dados do TMDB

Títulos antigos ou preenchidos à mão não têm sinopse, direção e elenco. Clique em **Buscar dados no TMDB** e escolha o título. Status, nota e anotações são mantidos.

### Editar ou remover

- **Editar dados do título** troca o título no TMDB ou corrige os dados manualmente. No preenchimento manual, também é possível remover a imagem.
- **Remover da biblioteca** pede confirmação e não pode ser desfeito.

## Acompanhar uma série

Na página da série, preencha **Temporada** e **Último episódio** e salve. Com o título ligado ao TMDB, uma barra mostra o progresso na temporada.

Nas séries com o status **Vendo**, o botão **+1 episódio** avança o número com um clique, tanto no cartaz quanto na página. Para mudar de temporada, ajuste os dois campos.

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

Se este navegador ainda tiver títulos da primeira versão do site, um aviso aparece depois do login. Escolha **Enviar para o banco** para levá-los à sua conta ou **Apagar do navegador** para descartá-los. O aviso só aparece no mesmo endereço em que a lista foi salva.

## Usar em mais de um aparelho

Entre com a mesma conta. Se a lista estiver aberta em dois aparelhos, recarregue a página para ver o que foi alterado no outro.
