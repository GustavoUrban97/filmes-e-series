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
- As abas separam filmes, séries e animes. Um filme de anime aparece em **Filmes** e em **Animes**, e uma série de anime aparece só em **Animes**.
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

### Marcar como anime

O site identifica anime pelos dados do TMDB: gênero Animação e idioma original japonês. Se a identificação errar, ou se o título não estiver ligado ao TMDB, use **É anime** na página do título e clique em **Salvar avaliação**. Sua escolha não é substituída depois, a menos que você troque o título no TMDB.

## Acompanhar uma série

Na página de uma série ligada ao TMDB, escolha a temporada e marque cada episódio visto. Um episódio marcado recebe a data de hoje, e você pode alterar a data e dar uma nota só para ele. O progresso acompanha o episódio marcado mais adiantado. **Marcar temporada inteira** marca os que faltam, com a data de hoje.

Marcar um episódio de uma série em **Quero ver** muda o status para **Vendo**. Marcar todos não muda o status para **Visto** sozinho.

Nas séries com o status **Vendo**, o botão **+1 episódio** marca o próximo, tanto no cartaz quanto na página, e passa para a temporada seguinte quando a atual termina.

Em séries sem ligação com o TMDB, preencha **Temporada** e **Último episódio** e salve. Nelas, o **+1 episódio** apenas avança o número.

## Para você

A tela **Para você** sugere filmes e séries a partir do que você já viu. Títulos com nota alta pesam mais, e os gêneros que você avalia mal perdem espaço. Títulos em **Quero ver** não contam.

Cada cartaz mostra o motivo da sugestão e a nota do título no TMDB. Nele você pode:

- clicar no nome para ver a sinopse e marcar **Já assisti**;
- clicar em **Quero assistir** para colocá-lo na sua fila;
- clicar no **X** (**Não me interessa**) para escondê-lo. **Mostrar de novo**, no fim da página, traz de volta todos os dispensados.

As recomendações do TMDB para um filme costumam ser filmes, e as de uma série, séries. O outro tipo entra pelos seus gêneros favoritos. Títulos sem ligação com o TMDB contam só pelos gêneros.

## Diário

O **Diário** mostra suas sessões por mês, da mais recente para a mais antiga: cada episódio marcado e cada título com status **Visto** e data. Títulos assistidos sem data não aparecem, e a página avisa quantos são.

## Estatísticas

**Estatísticas** reúne tempo assistido, filmes, episódios, nota média, sessões nos últimos 12 meses, gêneros mais vistos e distribuição das notas.

O tempo soma filmes com status **Visto** e episódios marcados. Sessões sem duração conhecida ficam de fora, e a página avisa quantas são. Em filmes ligados ao TMDB, abrir a página do título já completa a duração.

## Backup

A lista fica no banco de dados, e o backup é uma cópia extra sob o seu controle.

**Exportar:** clique em **Exportar backup**, no fim da página, e guarde o arquivo `.json` em um lugar seguro.

**Importar:** clique em **Importar backup** e escolha o arquivo. A importação junta o backup com a lista atual:

- títulos que ainda não estão na lista são adicionados;
- se um título existe nos dois, fica a versão editada por último;
- títulos que existem só na lista atual são mantidos;
- os episódios marcados seguem as mesmas regras e também fazem parte do backup;
- os títulos dispensados das recomendações também fazem parte do backup e continuam dispensados depois de importar;
- registros inválidos no arquivo são ignorados, e o site informa quantos foram.

Por causa dessa junção, **um título excluído volta** se você importar um backup antigo que ainda o contém.

## Lista salva na versão anterior

Se este navegador ainda tiver títulos da primeira versão do site, um aviso aparece depois do login. Escolha **Enviar para o banco** para levá-los à sua conta ou **Apagar do navegador** para descartá-los. O aviso só aparece no mesmo endereço em que a lista foi salva.

## Usar em mais de um aparelho

Entre com a mesma conta. Se a lista estiver aberta em dois aparelhos, recarregue a página para ver o que foi alterado no outro.
