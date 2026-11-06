# Identidade visual: Sala escura

As luzes se apagam e o pôster vira a estrela. A interface fica no escuro, em tons quentes, para que as imagens dos títulos sejam o que mais chama a atenção.

O site tem apenas o tema escuro. Os valores abaixo ficam em `css/styles.css`, como variáveis em `:root`.

## Princípios

1. **O pôster vem primeiro.** Ele ocupa toda a altura do card, de ponta a ponta.
2. **O âmbar é a luz da sala.** Ele aparece só em ações principais, estrelas e foco. Se estiver em todo lugar, deixa de orientar.
3. **A cortina é um detalhe.** O bordô marca o topo da página, o topo de login e formulário e o espaço de um título sem pôster. Nunca é usado em textos.
4. **Formas retas e planas.** Cantos de 4 px, sem sombras nem degradês.

## Cores

| Variável | Valor | Uso |
| --- | --- | --- |
| `--fundo` | `#120D0E` | Fundo da página |
| `--superficie` | `#1E1517` | Cards, login e formulário |
| `--superficie-alta` | `#2A1A1D` | Destaque ao passar o ponteiro |
| `--campo` | `#171011` | Fundo de campos e sugestões |
| `--borda` | `#3D2B2E` | Linhas divisórias |
| `--borda-campo` | `#7A6266` | Borda de campos e botões |
| `--texto` | `#F4E9DC` | Texto principal |
| `--texto-suave` | `#C9B7A6` | Texto de apoio |
| `--texto-dica` | `#A08F83` | Texto de exemplo em campos |
| `--cortina` | `#7E1F2B` | Faixa do topo e pôster vazio |
| `--ambar` | `#E9B44C` | Ação principal, estrelas e foco |
| `--filme` | `#D9C7B2` | Etiqueta de filme |
| `--serie` | `#EFA2A8` | Etiqueta de série |
| `--erro` | `#FFB4A8` | Texto de erro, sobre `--erro-fundo` (`#3A1518`) |

### Contraste

Todas as combinações de texto superam o mínimo de 4,5:1 das diretrizes WCAG AA, e as bordas de campo e as estrelas vazias superam 3:1.

| Combinação | Contraste |
| --- | --- |
| Texto principal sobre o fundo | 16,09:1 |
| Texto suave sobre a superfície | 9,20:1 |
| Texto de exemplo sobre o campo | 6,04:1 |
| Texto do botão sobre o âmbar | 9,64:1 |
| Erro sobre o fundo de erro | 9,49:1 |
| Borda de campo sobre o campo | 3,37:1 |

## Tipografia

| Fonte | Uso |
| --- | --- |
| **Fraunces** | Nome do site, títulos de filmes e seções, e números do resumo |
| **Inter** | Textos de apoio, campos e botões |

As duas ficam na pasta `fonts/`, com as licenças SIL Open Font License, e são servidas pelo próprio site.

## Componentes

- **Card de título:** pôster à esquerda, sem borda, sobre `--superficie`. Sem imagem, mostra a inicial do título sobre o bordô.
- **Botões:** um único botão âmbar por contexto, para a ação principal. Os demais são contornados.
- **Estrelas:** âmbar quando preenchidas, sempre acompanhadas do número.
- **Resumo:** números grandes em Fraunces, separados por linhas finas, sem caixas.

## Ícone

`img/icone.svg`: uma estrela âmbar sobre um quadrado bordô.
