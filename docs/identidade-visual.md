# Identidade visual: Cinematic Amber

O Claquete lembra uma sala de cinema: ambiente escuro, luz âmbar e clareza editorial. A interface fica em segundo plano para que os pôsteres chamem a atenção. Esta identidade substitui a Sala escura e segue as telas de referência criadas para o projeto.

O site tem apenas o tema escuro. Os valores abaixo ficam em `css/styles.css`, como variáveis em `:root`.

## Princípios

1. **O pôster vem primeiro.** A biblioteca é uma grade de cartazes na proporção 2:3.
2. **O âmbar é a luz da sala.** Ele marca ações principais, itens ativos, estrelas e foco.
3. **Só dados reais.** Sem números de exemplo: uma métrica ou informação só aparece se vier da biblioteca ou do TMDB.
4. **Profundidade por camadas.** As superfícies clareiam conforme sobem, com brilho âmbar apenas nas ações principais.

## Cores

| Variável | Valor | Uso |
| --- | --- | --- |
| `--fundo` | `#131316` | Fundo da página |
| `--fundo-baixo` | `#0E0E11` | Rodapé, selos sobre o pôster e faixas internas |
| `--superficie` | `#1F1F22` | Cartões e painéis |
| `--superficie-alta` | `#2A2A2D` | Campos e botões secundários |
| `--superficie-maxima` | `#353438` | Destaques e seleção |
| `--texto` | `#E4E1E6` | Texto principal |
| `--texto-suave` | `#D4C5AC` | Texto de apoio |
| `--texto-apagado` | `#A89B84` | Texto de exemplo e créditos |
| `--ambar` | `#F5B700` | Ação principal, aba ativa e estrelas |
| `--ambar-claro` | `#FFD88A` | Marca, item ativo e destaques em texto |
| `--sobre-ambar` | `#261A00` | Texto sobre o âmbar |
| `--estrela-vazia` | `#6B6358` | Estrelas não preenchidas |
| `--erro` | `#FFB4AB` | Texto de erro, sobre `--erro-fundo` (`#3F1214`) ou superfícies |

As telas de referência usam `#6A6A75` para textos de exemplo. O site usa `--texto-apagado`, porque aquele tom não atinge o contraste mínimo.

### Contraste

| Combinação | Contraste |
| --- | --- |
| Texto principal sobre o fundo | 14,32:1 |
| Texto suave sobre a superfície | 9,69:1 |
| Texto de exemplo sobre o campo | 5,24:1 |
| Âmbar claro sobre a superfície | 12,09:1 |
| Texto sobre o botão âmbar | 9,48:1 |
| Erro sobre o fundo de erro | 9,46:1 |
| Estrela vazia sobre o fundo baixo (elemento gráfico) | 3,26:1 |

## Tipografia

Toda a interface usa **Inter**, servida pelo próprio site a partir de `fonts/`, com a licença SIL Open Font License. Títulos são compactados com espaçamento negativo, e etiquetas curtas podem usar caixa alta com espaçamento maior.

## Formas

- Cartazes e painéis: cantos de 12 a 16 px.
- Botões e campos: cantos de 8 px.
- Abas, gêneros e etiquetas de tipo: formato de pílula.

## Componentes

- **Cartaz:** pôster 2:3 com selo de tipo, nota e progresso, seguido de título, ano, direção e o início da anotação. Sem imagem, mostra a inicial do título.
- **Botões:** um botão âmbar por contexto. Os demais são discretos.
- **Estrelas:** âmbar quando preenchidas, com meia estrela, sempre acompanhadas do número.
- **Modal de adicionar:** resultados à esquerda e prévia à direita, com faixa âmbar no topo.
- **Status:** controle segmentado entre Quero ver, Vendo e Visto.

## Ícone

`img/icone.svg`: uma claquete âmbar sobre fundo escuro.
