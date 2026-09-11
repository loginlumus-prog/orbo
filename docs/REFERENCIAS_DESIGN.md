# Referências de Design e UX — Jogo da Bola e dos Arcos

> Hiper-casual premium, **retrato**, controle de **um dedo**, roguelike leve (perks + habilidades com recarga), modos **Infinito** e **Campanha com chefes**.
> Documento de direção de arte/UX. Pesquisa feita em set/2026 com referências reais; todas as diretrizes são acionáveis e numéricas.

**Convenções de medida usadas aqui**

- Canvas de referência: **1080 × 2340 px** (19.5:9), fator **3×** → **360 × 780 dp**. Todas as medidas abaixo estão em **dp** (multiplique por 3 para px no canvas base). `%L` = porcentagem da largura da tela, `%A` = da altura.
- Tempos em **ms**. Curvas: `ease-out` = cubic-bezier(0.2, 0, 0, 1) (Material "emphasized decelerate"); `ease-in` = (0.3, 0, 0.8, 0.15); `back` = overshoot de 10–15 %.
- Durações padrão (Material 3): **50/100 ms** micro (hover, press), **250/300 ms** médio (cards, popups), **450/500 ms** longo (transição de tela). Nunca use uma duração fora dessa escala sem motivo.

---

## 0. Resumo executivo — 10 regras de ouro

1. **O terço central da tela é sagrado.** Entre 30 %A e 75 %A não existe HUD persistente: só a bola, os arcos e feedback efêmero. Informação passiva vai para o topo; interação vai para a base (zona do polegar).
2. **Um dedo manda.** Todo toque que não começa dentro de um botão é controle da bola. Botões de habilidade ficam nos cantos inferiores com hit-area exclusiva de 72 dp; qualquer overlay (perk, pausa, loja) trava o input por **300 ms** ao aparecer para evitar toque acidental.
3. **Toque mínimo 48 dp, espaçamento 8 dp, respeitar safe area** (topo 47–59 pt no iPhone com notch/Dynamic Island, base 34 pt; Android status 24 dp + navegação por gesto 48 dp). Nunca ancorar em coordenada absoluta.
4. **Feedback em < 100 ms para toda ação.** Cada arco atravessado gera som + partícula + popup de pontos + micro-haptic no mesmo frame. Silêncio = ação "oca".
5. **Hit-stop de 40–80 ms** para acertos normais, **100–200 ms** só para golpes decisivos (chefe, morte). Screen shake com decaimento exponencial em ≤ 300 ms, amplitude ≤ 8 dp em retrato, sempre desligável.
6. **Escolha de perk = 3 cartões, 1 tela, 1 toque.** Descrição de no máximo 2 linhas com o número em destaque, raridade indicada por cor **e** rótulo, reroll/skip como botões secundários visíveis mas discretos.
7. **Raridade é um sistema, não uma cor.** Comum / Raro / Épico / Lendário sempre com a mesma paleta (seção 7) em cartões, loja, molduras, HUD e partículas; lendário é o único com movimento contínuo (brilho varrendo a cada 1,2 s).
8. **Loading honesto.** < 1 s: nada. 1–4 s: indicador indeterminado. > 4 s: barra de progresso **real** + dicas rotativas de até 90 caracteres a cada 4–5 s. Nunca barra falsa, nunca spoiler de chefe.
9. **Um botão primário por tela.** Cor de ação única (verde/teal do sistema), 56 dp de altura, na base da tela; fechar (X) 44 dp no canto superior direito; nunca vermelho para comprar.
10. **Acessibilidade é QA, não opcional.** ≤ 3 flashes/s e ≤ 20 % da tela; sem flash vermelho saturado; contraste 4,5:1 para texto e 3:1 para ícones sobre o pior fundo possível; toggles separados para shake, flash e haptics; respeitar "reduzir movimento" do sistema.

---

## 1. HUD durante a partida

### 1.1 Referências reais

| Jogo | O que faz bem (e serve como referência para nós) |
|---|---|
| **Alto's Odyssey** (Snowman) | HUD reduzido ao essencial: pontuação e distância em tipografia leve no topo, metas mostradas só no início da corrida e no fim. Fundo em paleta dessaturada para o primeiro plano "vencer". Haptics só em momentos que importam (aterrissar truque, quebrar pedra). Filosofia declarada pela equipe: "favorecer sinal sobre ruído". |
| **Subway Surfers** (SYBO) | Pontuação com multiplicador ao lado, alinhados à direita no topo; moedas logo abaixo; pausa no canto superior esquerdo. Multiplicador como estrela dourada sempre visível — o jogador entende instantaneamente por que a pontuação cresce mais rápido. Power-ups com barra de duração horizontal abaixo do HUD (2× multiplier dura 12 s e mostra o tempo restante). |
| **Geometry Dash** (RobTop) | Barra de progresso de fase **fina, no topo, com porcentagem** (0–100 %). É o modelo canônico de "quanto falta" para jogos de reflexo: sem números grandes, só a barra e o % (o jogador pode até ocultar a barra e manter só o %). Contador de tentativas no cenário, não no HUD. |
| **Archero** (Habby) | Barra de HP do jogador presa ao personagem; progresso da run como sequência de pontos/nós no topo (sala atual destacada, chefe com ícone diferente); barra de chefe larga no topo com nome quando o chefe entra. Escolha de 3 habilidades ao subir de nível com o jogo pausado. |
| **Vampire Survivors** (poncle) | Barra de XP ocupando **toda a largura do topo**; timer central logo abaixo; slots de armas/passivos em duas fileiras de 6 quadrados no canto superior esquerdo. Tudo o que importa cabe em uma faixa de ~60 dp no topo; o resto da tela é jogo. Chefes recebem barra própria. |
| **Stack** (Ketchapp) | Um único número gigante centralizado no topo (pontuação); nada mais. Inicia direto na tela de jogo — "toque em qualquer lugar" é o tutorial inteiro. O nível de dificuldade é comunicado pelo próprio cenário (plataformas ficam menores), não por texto. |
| **Color Switch** (Fortafy) | Pontuação centralizada acima da bola, aumenta em +1 com "pop" a cada obstáculo; paleta de 4 cores repetida em obstáculos, bola e UI — a identidade visual **é** o sistema de jogo. |

### 1.2 Mapa de zonas (retrato, 360 × 780 dp)

```
┌──────────────────────────────┐ 0 %A
│  safe-area (notch/DI) ~ 47–59 pt      │
│  [pausa 44dp]   PONTUAÇÃO   [moedas]  │  faixa A: 0–12 %A → informação passiva
│  ══════ barra de fase / chefe ═══════ │
│            x7 COMBO                   │  12–20 %A → combo / avisos centrais
│                                       │
│                                       │
│          ◯  arcos descendo            │  20–75 %A → ZONA DE JOGO (sem HUD)
│                                       │
│               ●  bola                 │
│                                       │
│                                       │  75–100 %A → zona do polegar
│ (hab.1)                       (hab.2) │  botões de habilidade 64–72 dp nos cantos
│  safe-area (home indicator) 34 pt     │
└──────────────────────────────┘ 100 %A
```

### 1.3 Diretrizes numéricas

**Pontuação (score)**
- Posição: **topo-centro**, base do texto a `safe-top + 12 dp`. No modo Infinito é o elemento mais importante da tela; na Campanha ele divide o topo com a barra de fase.
- Tipografia: **32 dp** (Infinito) / **24 dp** (Campanha), peso bold, **algarismos tabulares** (largura fixa) para não "dançar" ao incrementar. Cor branca `#FFFFFF` com sombra `0 2 dp / blur 6 dp / 40 %` ou contorno de 1,5 dp em `#0B0D12` para garantir leitura sobre qualquer fundo.
- Animação de incremento: "punch" de escala **1.0 → 1.12 → 1.0 em 120 ms** a cada arco; se o incremento for > 100 pontos (combo alto), 1.0 → 1.2 e cor pisca para o accent por 80 ms.
- Popup flutuante `+10`, `+25`: nasce na posição do arco atravessado, sobe **24 dp em 500 ms** (ease-out), esmaece nos últimos 40 %, tamanho 18 dp. Máximo de 4 popups simultâneos; o 5º substitui o mais antigo.
- Melhor pontuação: mostrar como linha discreta de **12 dp** abaixo do score ("MELHOR 1.240") apenas até o jogador ultrapassá-la; ao ultrapassar, um único aviso central "NOVO RECORDE" (ver Avisos).

**Barra de progresso de fase (Campanha)**
- Posição: abaixo do score, centralizada, **largura 60 %L**, altura **6 dp**, cantos totalmente arredondados, fundo `#FFFFFF` a 18 %, preenchimento na cor accent do mundo atual.
- Marcadores: pequeno ícone da fase à esquerda (`3-4`, 12 dp) e ícone de chefe (caveira/coroa, 16 dp) na extremidade direita quando a fase termina em chefe. Waves ou checkpoints como ticks de 1 dp a 25/50/75 %.
- Preenchimento animado: interpolar em **300 ms** ease-out, nunca saltar.
- Modo Infinito: não existe barra de fase; existe só um **marcador de "próximo marco"** discreto (ex.: "500 m" ou "próximo perk em 12 arcos") como texto de 12 dp abaixo do score.

**Indicador de combo**
- Posição: **topo-centro, entre 12 e 18 %A**, logo abaixo da barra. Nunca ao lado da bola (roubaria o foco do reflexo).
- Formato: `x7` em 28 dp + rótulo `COMBO` em 11 dp caps com letter-spacing 8 %. Aparece só a partir de **x2**.
- Janela de decaimento: **1,5 s** sem acerto zera o combo (referência de match/ritmo). Mostrar o decaimento como anel fino (2 dp) ao redor do número que se esvazia no sentido horário; quando restam < 0,5 s, o anel pisca a 2 Hz (não mais que 3 flashes/s).
- Escalada visual por faixa: `x2–x5` branco; `x6–x10` cor accent; `x11–x20` gradiente accent → lendário + 6–10 partículas por incremento; `x21+` adiciona vinheta sutil (10 % de opacidade) na cor do combo. A cada faixa, punch de escala 1.0 → 1.25 → 1.0 em 150 ms + haptic médio.
- Quebra de combo: número fica cinza `#8A8F98`, tremor de ±4 dp por 150 ms, cai 8 dp e some em 250 ms. Sem som agressivo — um "tick" seco de 60 ms.

**Botões de habilidade com recarga radial**
- Posição: **cantos inferiores**, centro do botão a `safe-bottom + 40 dp` e `24 dp` da borda lateral. Máximo de **2 habilidades** visíveis; uma terceira só se for automática (sem botão).
- Tamanho: visual **64 dp** (72 dp no botão "principal" se houver hierarquia); **hit-area 80 dp** (invisível). O controle de arrastar da bola **ignora toques que começam dentro da hit-area**, e o botão ignora toques que começam fora.
- Recarga: overlay escuro (`#000000` a 60 %) preenchido radialmente **a partir das 12 h, sentido horário**, que **encolhe** conforme a habilidade recarrega (o jogador vê a "luz" chegando). Anel externo de 3 dp na cor da habilidade acompanha. Mostrar segundos restantes (14 dp) apenas se a recarga total for > 3 s.
- Pronto: flash branco no ícone (100 ms, 70 % opacidade), punch 1.0 → 1.15 → 1.0 em 200 ms, anel pulsa 1×, haptic leve. Enquanto pronto, pulso lento e sutil de escala 1.0 → 1.04 em ciclo de 1,2 s — nunca mais que isso, ou vira ruído.
- Toque em recarga: "denied" — tremor horizontal ±4 dp em 150 ms, som curto grave, **sem** haptic (não recompense o erro).
- Uso: ícone some por 80 ms (flash), onda circular de 1 → 2,5× do raio esmaece em 300 ms, e o overlay de recarga aparece cheio imediatamente.
- Rótulo: nunca texto dentro do botão; ícone silhueta de 1 cor (branca) com 2 dp de contorno. Se precisar de nome, tooltip de 12 dp acima do botão somente na primeira vez em que a habilidade é obtida (3 s).

**Barra de chefe**
- Aparece **no lugar da barra de fase** (mesma posição, para não somar elementos): largura **72 %L**, altura **10 dp**, com nome do chefe em 14 dp caps acima (letter-spacing 6 %) e ícone de 20 dp à esquerda.
- Entrada: barra desliza de cima (−24 dp) com fade em 400 ms; preenchimento vai de 0 → 100 % em 600 ms (ease-out) enquanto o nome "digita" ou faz fade — é um ritual de 1 s que anuncia o chefe.
- Fases: dividir a barra em **segmentos** nos limiares de fase (ex.: 75/50/25 %, como o Grimm em Hollow Knight) com gaps de 2 dp. Ao cruzar um limiar: flash branco de 80 ms na barra + hit-stop 120 ms + shake 10 dp + mudança de cor do preenchimento (vermelho → laranja → amarelo).
- Dano: preenchimento cai imediatamente; uma **trilha "fantasma"** amarelo-clara (`#FFE9A6`) segue com atraso de 300 ms para mostrar quanto foi tirado.
- Saída: ao derrotar, barra esvazia com "shatter" (fragmentos de 4–6 pedaços caindo 200 ms) e some. Nunca deixar a barra vazia parada na tela.
- Não fazer: não usar barra de chefe na base da tela (colide com botões); não mostrar números de HP; não usar mais de 3 cores na barra.

**Avisos centrais ("ONDA 3", "CHEFE!", "NOVO RECORDE", "LEVEL UP")**
- Posição: **centro horizontal, a 30–35 %A** (acima da zona onde os arcos chegam à bola), nunca no centro geométrico.
- Duração total **1,2 s**: entrada 150 ms (escala 1.3 → 1.0 com `back`, fade 0 → 1), hold 700 ms, saída 250 ms (fade + desliza −12 dp).
- Tipografia 28–32 dp caps, letter-spacing 10 %, cor branca; subtítulo opcional 14 dp (`"Sobreviva 30 s"`). Máximo 2 linhas, 18 caracteres por linha.
- Nunca mais de **um aviso a cada 2 s**; se houver fila, descartar os de menor prioridade (recorde > chefe > onda > perk pronto).
- Opacidade do fundo: **nenhum** painel escuro atrás (o jogo não para). Se a leitura sofrer, usar só sombra e contorno.

**Regras de "não fazer" (HUD)**
- Não colocar nada interativo no topo além de **pausa** (44 dp, canto superior esquerdo). O topo é lido, não tocado.
- Não animar continuamente elementos passivos (moedas girando, barras brilhando) — só o botão pronto tem pulso, e é sutil.
- Não usar mais de **2 fontes** e **3 tamanhos** no HUD.
- Não escurecer a tela para avisos; não pausar para avisos que não exigem decisão.
- Não usar barras horizontais no rodapé (colide com o gesto de navegação do Android e com os polegares).

---

## 2. Seleção de upgrade / perk ("escolha 1 de 3")

### 2.1 Referências reais

| Jogo | O que faz bem |
|---|---|
| **Vampire Survivors** | Jogo pausa; 3 opções (4ª só com Sorte, `chance = 1 − 1/sorte`); cada opção mostra ícone, nome, nível atual → próximo e uma linha de efeito; **borda colorida por raridade**; indicadores de evolução ("evo") no item elegível. Botões de **Reroll / Skip / Banish** aparecem só quando desbloqueados, com contador de usos. Skip devolve parte da XP — nunca punir quem recusa. Após escolher, o jogador ganha alguns frames de invulnerabilidade. |
| **Archero** | 3 habilidades empilhadas verticalmente em retrato, cada uma com ícone grande à esquerda e texto curto à direita; escolha por toque direto no cartão (sem "confirmar"). Salas de **Anjo** (habilidade fraca *ou* cura) e **Demônio** (habilidade em troca de HP máximo) provam que escolhas de risco/recompensa cabem no mesmo layout de 3 cartões. |
| **Brotato** | 4 tiers com cores fixas: **Tier 1 branco, Tier 2 azul, Tier 3 roxo, Tier 4 vermelho**; tiers altos só aparecem a partir de certa onda (T2 ≥ onda 2, T3 ≥ onda 4, T4 ≥ onda 8) — a raridade escala com o progresso. Reroll com custo crescente e sem limite; **trava (lock)** para segurar um item para a próxima loja. |
| **Hades** (Supergiant) | Bênçãos em lista vertical de 3; raridade em texto e cor (**Comum branco, Raro azul, Épico roxo, Heroico vermelho**); valor numérico do efeito em destaque dentro da descrição; Duo/Lendário com moldura especial. Reroll é recurso finito (Fated Persuasion) mostrado como contador. |
| **20 Minutes Till Dawn** | Reroll virou padrão para todos os personagens após feedback; **sinergias** aparecem como uma escolha extra quando os pré-requisitos foram cumpridos (rótulo "Synergy"); há um compêndio de upgrades e uma tela de status atual acessível durante a run. |

### 2.2 Layout do cartão (retrato)

```
┌────────────────────────────────────────┐  largura 88 %L (≈ 316 dp)
│ ┌────┐  VELOCIDADE DE RECARGA    RARO  │  altura 112–128 dp
│ │ico │  Habilidades recarregam         │  raio 16 dp
│ │56dp│  +20 % mais rápido.       Nv 2→3│  borda 2–3 dp na cor da raridade
│ └────┘  ◆ combina com "Eco"            │  glow externo 12 dp @ 40 %
└────────────────────────────────────────┘
```

- **Pilha vertical de 3 cartões** centralizada entre 22 %A e 72 %A, gap **12 dp**. Nunca 3 colunas em retrato (cartões ficariam com < 110 dp de largura e texto ilegível).
- **Ícone**: 56 dp, silhueta em 1–2 cores sobre disco na cor da raridade a 20 %. Ícones **nunca repetidos** entre os 3 cartões.
- **Nome**: 18 dp bold, 1 linha, máx. 22 caracteres.
- **Descrição**: 14 dp regular, **máx. 2 linhas / ~60 caracteres**, com o **número** em bold e na cor da raridade (`+20 %`). Sem jargão: verbo + efeito + número.
- **Rótulo de raridade**: 11 dp caps no canto superior direito, na cor da raridade, **sempre presente** (não dependa só da cor — daltonismo).
- **Badge de estado**: `NOVO` (pílula 10 dp) ou `Nv 2→3` no canto inferior direito. `MAX` quando o próximo nível é o último.
- **Linha de sinergia** (opcional, 12 dp): "◆ combina com X" quando o jogador já possui X; se a sinergia for a escolha em si, o cartão inteiro recebe moldura dupla e rótulo `SINERGIA`.

### 2.3 Raridade visual no cartão

| Raridade | Borda | Glow externo | Tinta de fundo | Movimento |
|---|---|---|---|---|
| Comum | 2 dp `#B8C0CC` | nenhum | 6 % | nenhum |
| Raro | 2 dp `#3B9DFF` | 8 dp @ 30 % | 8 % | nenhum |
| Épico | 3 dp `#A855F7` | 12 dp @ 40 % | 10 % | 4–6 partículas lentas subindo |
| Lendário | 3 dp gradiente `#FFB020 → #FF6A00` | 16 dp @ 50 % | 12 % | brilho varrendo a 20° a cada **1,2 s** + partículas |

### 2.4 Fluxo e tempos

1. Gatilho (level up / marco): **slow-mo** timescale 1 → 0,1 em 200 ms (ease-in), som ascendente, então pausa total.
2. Backdrop: `#0B0D12` a **70 %** + blur de 8–12 dp (se o dispositivo aguentar; senão só o escurecimento). Fade em 200 ms.
3. Título "ESCOLHA 1" (20 dp caps) + subtítulo "Nível 4" (14 dp) no topo, a 14 %A.
4. Cartões entram em **cascata**: deslizam +24 dp → 0 e fade, 250 ms ease-out, atraso de **70 ms** entre cada um (total ~400 ms).
5. **Trava de input de 300–400 ms** desde o início da animação: o jogador estava tocando a tela para controlar a bola — sem trava ele escolhe sem querer.
6. Toque no cartão: escala 1.05 em 100 ms, os outros dois esmaecem para 30 % em 150 ms, o escolhido "voa" para o slot de perks no HUD em **300 ms** (ease-in) encolhendo até 24 dp. Haptic médio; se lendário, haptic pesado + flash branco de 60 ms.
7. Retorno: backdrop some em 200 ms; timescale volta 0,1 → 1 em 300 ms; **500 ms de invulnerabilidade** (a bola não perde por colisão nesse intervalo).

### 2.5 Reroll e Skip

- Linha inferior a **80 %A**, dois botões secundários de **44 dp de altura**, largura 40 %L cada, gap 12 dp: `↻ REROLAR (2)` e `PULAR +15 XP`. Estilo *ghost* (borda 1,5 dp, sem preenchimento) para não competir com os cartões.
- Reroll: contador entre parênteses ou custo em moeda; ao usar, cartões saem para a esquerda (−32 dp, 150 ms) e a nova cascata entra. Desabilitado = 40 % de opacidade + sem sombra.
- Skip: sempre dá algo pequeno (XP, moedas ou +1 vida temporária) e nunca abre confirmação.
- Banish (remover do pool) é avançado: só se o jogo tiver meta-progressão; ícone de 🚫 no canto do cartão com hold de 500 ms.

### 2.6 Não fazer

- Nunca **mais de 3 opções** por padrão (a 4ª só como bônus raro e visível como tal).
- Nunca duas opções com o mesmo efeito em raridades diferentes lado a lado (o jogador vê "pegadinha").
- Nunca descrever com percentuais sem base ("+20 % de poder") — diga o que muda (`+20 % raio do ímã`).
- Nunca fechar a tela por toque fora dos cartões.
- Nunca mostrar a tela em cima de um chefe no meio de um ataque; adie o level up até o próximo "respiro" (≤ 3 s).

---

## 3. Loja de cosméticos

### 3.1 Referências reais

| Jogo | O que faz bem |
|---|---|
| **Subway Surfers** | Abas claras (Personagens / Pranchas / Outfits); preview grande do item selecionado; preço sempre com o ícone da moeda; itens limitados com preço fixo e memorizável (95.000 moedas para personagens limitados, 50.000 para pranchas) e moeda secundária (chaves) como alternativa. |
| **Brawl Stars** (Supercell) | Rotação diária deliberada ("poucas opções por dia = decisão fácil + hábito de checar"); **Ofertas em destaque** grandes no topo, "Daily Deals" menores; bundles com "toque para revelar"; 6 raridades de skin com efeitos crescentes (Mítico tem efeito de abate, Lendário tem efeito de spawn); botão amarelo grande como ação principal. Alerta do próprio estudo de caso (Pratt): a home sofre de *featuritis* — cada seção nova compete pela atenção. |
| **Fortnite** (Epic) | Item Shop reorganizado em **seções temáticas** com tiles de tamanhos diferentes (destaque 2× maior que o diário); reset diário fixo (00:00 GMT) e **timer individual por item**; bundles com preço riscado e economia explícita; removeu as cores de raridade dos cosméticos (v29.20) e passou a usar "Séries" — lição: raridade em cosmético só funciona se significar algo visível no item. |
| **Alto's Odyssey** | "Workshop" com pouquíssimos itens, um por tela, ilustração grande e texto de 1 linha; a loja parece parte do mundo, não um catálogo. Prova que uma loja premium pode ter 6–10 itens e ser satisfatória. |
| **Stumble Guys** | 7 raridades (Comum → Especial); Épico/Lendário vêm com animação, som e **trail** próprios; bundle padrão = 1 skin em destaque + 2–3 itens complementares + bônus de moeda; ofertas diárias e rotação semanal de emotes. |

### 3.2 Estrutura da tela (retrato)

```
[←]            LOJA               [◎ 1.240] [◆ 35]     topo: safe + 12 dp, moedas à direita
┌──────────────────────────────────────┐
│   DESTAQUE DO DIA                     │  banner 100 %L−32 dp × 200 dp, raio 20 dp
│   [preview animado da bola + trilha]  │  termina em 12:34:05 (mono, 14 dp)
│   Nome · LENDÁRIO        [ 1.200 ◎ ] │  botão de preço 48 dp
└──────────────────────────────────────┘
  Bolas   Trilhas   Arcos   Efeitos              abas 40 dp, sublinhado 3 dp
┌──────────┐ ┌──────────┐
│  card    │ │  card    │   grade 2 colunas, 164 × 200 dp, gap 12 dp
│          │ │          │   3 colunas (100 × 132 dp) para itens pequenos (efeitos)
│ [ 300 ◎ ]│ │ EQUIPADO │
└──────────┘ └──────────┘
```

- **Acima da dobra** (primeira tela): 1 destaque + no máximo **4 cards**. Mais que isso vira feira.
- **Destaque do dia**: 1 item, rotação em horário UTC fixo, timer `hh:mm:ss` quando < 24 h, `Xd hh h` quando maior. Fundo do banner na cor da raridade a 15 % com vinheta.
- **Abas**: máx. 4; a ativa em cor accent com sublinhado de 3 dp; troca com slide horizontal de 200 ms.

### 3.3 Card de item

- Moldura **2 dp** na cor da raridade + glow (mesma tabela da seção 2.3). Rótulo de raridade 10 dp caps no canto superior esquerdo sobre pílula escura.
- Preview: **Comum/Raro** estático (render real do asset a 2×); **Épico** loop idle de 2–3 s (rotação, trilha curta); **Lendário** loop idle + partículas. Preview **sempre com o asset real** do jogo, nunca ilustração promocional diferente do que o jogador recebe.
- Tag `NOVO` (pílula accent, 10 dp) por 48 h após lançamento; `−30 %` em pílula vermelha só se o desconto for verdadeiro e o preço original aparecer riscado.
- Botão de preço: **largura total do card, 40 dp**, ícone da moeda + valor em algarismos tabulares. Estados: `Comprar` (accent), `Equipar` (ghost), `Equipado ✓` (cinza, sem sombra), `Saldo insuficiente` (accent a 50 %, ao tocar abre pacote de moedas — nunca bloqueie o toque em silêncio).
- Toque no card abre a tela de detalhe; toque **direto no botão** de um item barato (moeda soft) compra sem detalhe — atrito mínimo.

### 3.4 Tela de detalhe

- **Preview em 40 %A** no topo: a bola em um mini-cenário rodando a 15°/s, com a trilha real, atravessando um arco em loop de 3 s. Arrastar horizontalmente gira; soltar volta ao loop.
- Nome (24 dp), raridade (rótulo + cor), 1 linha de descrição (14 dp, máx. 80 caracteres), lista de 2–3 atributos visuais ("Trilha: brasa", "Efeito de arco: faíscas").
- **Botão principal de 56 dp**, largura 100 %L − 32 dp, fixo na base (`safe-bottom + 16 dp`), cor accent verde/teal; nunca vermelho (estudo de conversão do GameAnalytics: verde lê como positivo, vermelho como perigo). Um único glow/pulso lento (ciclo 2 s, 1.0 → 1.02) **só** nesse botão.
- Confirmação: **só para moeda premium ou dinheiro real** (modal de 1 pergunta, botão de confirmar à direita). Moeda soft compra em 1 toque com animação de moedas voando (300 ms) do contador para o item.
- Fechar: X de 44 dp no canto superior direito **ou** arrastar para baixo (sheet).

### 3.5 Não fazer

- Não usar padrões enganosos: contagens regressivas que reiniciam, descontos sobre preço inventado, "última chance" para itens que voltam. (Fortnite e Brawl Stars documentam publicamente a rotação — o jogador descobre.)
- Não misturar mais de **2 moedas** na mesma tela.
- Não animar todos os cards ao mesmo tempo (limite: destaque + lendários).
- Não esconder o botão de fechar atrás do timer ou do saldo.
- Não usar cor de raridade para itens que não têm diferença visível (lição da Epic ao remover raridades).

---

## 4. Loading, splash e menu principal

### 4.1 Referências reais

| Jogo / Plataforma | O que faz bem |
|---|---|
| **Alto's Odyssey** | Menu = o mundo do jogo vivo ao fundo (Alto parado, vento, dia/noite), logotipo pequeno, um único "toque para jogar". Metas do nível visíveis no menu para dar objetivo antes de começar. Sem loading perceptível entre menu e jogo. |
| **Monument Valley** (ustwo) | Título de capítulo em tela própria: numeral + nome em tipografia **ultraleve**, muito espaço vazio, paleta do capítulo — "fazer o oposto de amontoar elementos". O loading vira um momento de identidade. |
| **Brawl Stars** | Loading com **dicas de jogo curtas** (1–2 frases, ex.: "brawlers de curto alcance rendem mais em mapas com cobertura"); botão **JOGAR** grande, amarelo, sempre no mesmo lugar; maioria das telas carrega em < 1 s. |
| **Genshin Impact** (mobile) | Loading com arte do **destino** (o jogador sabe para onde vai), ícone dos elementos animando em sequência no canto inferior direito como indicador de atividade, fundo branco ou preto conforme a hora do dia no jogo — o loading segue o estado do mundo. |
| **Apple HIG — Launching** | Launch screen deve ser **quase idêntica à primeira tela**, **sem texto** (não é localizável), sem logotipo/"splash artístico". Função única: parecer instantâneo. |
| **Android 12 SplashScreen API** | Ícone dentro de **288 dp** (área visível de 192 dp), animação de no máximo **1.000 ms** (recomendado ≤ 166 ms para o ícone padrão). O sistema já desenha o splash; não fazer um segundo. |

### 4.2 Diretrizes numéricas

**Splash / launch**
- Launch screen estática (cor de fundo do menu + silhueta da bola) → logo animado **600–800 ms** (bola rola para dentro e "vira" o logotipo) → menu. **Total ≤ 1,5 s** (métrica de mercado: acima disso a desistência sobe).
- Logotipo ≤ **40 %L**; sem texto de estúdio além de uma linha de 12 dp a 40 % de opacidade na base. Sem "Powered by".
- Nunca tocar som antes que o jogador veja o menu (o app pode estar sendo aberto no silêncio de um transporte público).

**Loading (entre telas / mundos)**
- < **1 s**: sem tela de loading — segure a tela anterior e faça crossfade de 200 ms.
- **1–4 s**: indicador **indeterminado** (a bola quicando entre 3 arcos em loop de 900 ms) no centro-base (85 %A), sem barra.
- > **4 s**: **barra de progresso real** (nunca tween falso), 60 %L × 4 dp, a 82 %A, cantos arredondados, na cor accent do mundo; porcentagem opcional em 12 dp mono à direita. Progresso pode ter *smoothing* (interpolar em 200 ms) mas nunca "voltar".
- **Dicas rotativas**: 1 dica por vez, **≤ 90 caracteres**, 14 dp, centralizada a 70 %A, troca a cada **4–5 s** com fade de 200 ms. Banco de ≥ 30 dicas; nunca repetir a mesma dica em 2 loadings seguidos. Dicas não substituem tutorial (regra de Game Developer) — use-as para **lembretes e curiosidades**, não para ensinar controles.
- Conteúdo: arte do **mundo de destino** ao fundo (como Genshin), nunca do chefe ainda não enfrentado (regra "sem spoiler").
- Ao terminar: se o loading foi < 3 s, entrar automaticamente após 300 ms; se ≥ 3 s, mostrar "toque para continuar" pulsando (o jogador pode ter largado o celular) — nunca começar uma fase de reflexo sem o jogador estar pronto.

**Menu principal**
```
                 [◎ 1.240] [⚙]           topo direito: moedas + config 44 dp
        (logo — bola + nome, ≤ 40 %L)   a 18–22 %A
        mundo vivo ao fundo, bola em idle
        · · · · · · · · · · · · · · · ·
             TOQUE PARA JOGAR            a 58 %A, 20 dp caps, pulso 1.0→1.05 / 1,2 s
        Infinito   |   Campanha 3-4      seletor de modo 44 dp, 2 opções
   [Loja]      [Mapa]      [Perks]     rodapé a safe-bottom + 24 dp, ícones 56 dp
```
- **Máximo 5 elementos interativos** na primeira tela (jogar, modo, loja, mapa, config). Cada função extra vai para uma segunda camada — evite o *featuritis* apontado no Brawl Stars.
- Fundo: **o próprio jogo em idle** (bola rolando devagar, arcos passando sem colisão, paleta do mundo atual). Nada de tela estática.
- "Toque para jogar" aceita **toque em qualquer ponto** do terço central da tela, como Stack — não exija acertar um botão.
- Badges/notificações: **1 ponto** (8 dp, vermelho `#FF4D4D`) por ícone, no máximo 2 badges simultâneos na tela.
- Transição menu → jogo: o menu **não some** — logo e botões fazem fade (200 ms) e o jogo já está rodando (a bola que estava em idle é a bola do jogo). Zero loading.

**Identidade**
- 1 cor accent por mundo + 1 cor de ação global (verde/teal) + 4 cores de raridade (seção 7). Nada mais.
- 1 fonte display (títulos, score, geométrica bold) + 1 fonte de texto (UI, humanista). Algarismos tabulares obrigatórios na display.
- A **bola é o logotipo**: aparece no ícone do app, no launch, no indicador de loading e no cursor de seleção de fase.

**Não fazer**
- Barra de progresso falsa (que "anda" sem carregar) — o jogador percebe na segunda vez.
- Tela de loading para transições < 1 s.
- Vídeo/cutscene de estúdio não-pulável.
- Menu com carrossel automático de ofertas (rouba o foco de "jogar").

---

## 5. Seleção de fases / campanha (mundos, estrelas, chefes)

### 5.1 Referências reais

| Jogo | O que faz bem |
|---|---|
| **Angry Birds** (Rovio) | Episódios → grade de fases; sob cada fase **3 estrelas** (vazias/cheias) e cadeado nas bloqueadas; estrelas dependem de pontuação. A grade é rápida de escanear: em 1 tela o jogador vê onde falta estrela. |
| **Candy Crush Saga** (King) | **Caminho sinuoso** vertical com pinos numerados; **episódios de 15 fases** (os 2 primeiros com 10); avatar do jogador no pino atual; portão entre episódios; estrelas no pino. Mapa rola verticalmente — natural em retrato. |
| **Cut the Rope** (ZeptoLab) | **Caixas de 25 fases**; 3 estrelas por fase; a próxima caixa abre por **total de estrelas** (30 → 80 → 190 acumuladas), o que dá motivo para voltar em fases antigas. |
| **Two Dots** (Playdots) | Mundos **ilustrados** com identidade própria (mapas em vetor, biomas distintos); 1º mundo com 10 fases e os seguintes com 25+; desbloqueio estritamente sequencial; objetivos mostrados antes de cada fase. |

### 5.2 Layout (retrato, rolagem vertical)

```
│  MUNDO 3 · DESERTO DE VIDRO      ★ 24/30 │  cabeçalho fixo do mundo visível
│                                           │
│        (11)────(12)                       │  nós 56 dp, caminho 6 dp
│                    \                      │  espaçamento vertical 96–120 dp
│                    (13)   ← bloqueado     │  zigue-zague ±30 %L para não ser reto
│                   /                       │
│        (14)                               │
│           \                               │
│           (BOSS)  ← 84 dp, coroa/caveira  │  chefe fecha o mundo
│                                           │
│  ─────── portão do Mundo 4 ───────────    │  faixa de 64 dp com requisito "★ 18"
```

- **Mundo = 9 fases + 1 chefe** (10 nós; encaixa em 1,5 telas de rolagem). Chefe sempre o **último nó** do mundo, 1,5× o tamanho, forma diferente (hexágono ou escudo), anel vermelho `#FF4D4D` pulsando 1.0 → 1.15 a cada 1 s enquanto for o próximo.
- **Nó**: 56 dp, número em 18 dp bold. Caminho 6 dp tracejado até nós bloqueados, sólido até o atual.
- **Estados**:
  - *Bloqueado*: preenchimento `#2A2E38`, número a 40 %, cadeado 16 dp no centro. Toque: tremor ±3 dp + tooltip "Complete a fase 12".
  - *Atual*: preenchimento accent, anel pulsante (1.0 → 1.15 / 1 s), rótulo `JOGAR` em 11 dp acima, a bola do jogador "sentada" no nó (idle).
  - *Concluído*: preenchimento accent a 60 %, **3 estrelas de 14 dp** abaixo (cheias `#FFC63A`, vazias `#FFFFFF` a 25 %).
  - *Chefe derrotado*: mesmo que concluído, com coroa dourada no lugar da caveira.
- **Estrelas**: 3 por fase, critérios **fixos e visíveis** no popup (ex.: ★ terminar, ★★ ≥ 80 % dos arcos, ★★★ sem perder vida). Total do mundo no cabeçalho `★ 24/30`.
- **Portão de mundo**: faixa horizontal com requisito em estrelas (ex.: 60 % das estrelas do mundo anterior = 18/30) **ou** apenas o chefe derrotado. Escolha uma regra e mantenha; Cut the Rope usa estrelas acumuladas, Two Dots usa sequência pura.
- **Popup da fase** (ao tocar um nó jogável): sheet de 40 %A vinda de baixo em 250 ms: nome ("3-4 · Tempestade"), melhor pontuação, 3 critérios de estrela com estado, perks fixos da fase (ícones 24 dp), botão **JOGAR 56 dp** na base. Fecha por arrastar ou X.

### 5.3 Comportamentos

- Ao abrir o mapa: **auto-scroll até o nó atual** em 300 ms (ease-out), nó atual a ~45 %A.
- Ao completar uma fase: o mapa abre no nó recém-concluído, as estrelas "caem" uma a uma (100 ms de atraso, escala 1.4 → 1.0 com `back`, haptic leve em cada), o caminho até o próximo nó se desenha em 400 ms, a bola rola até ele em 500 ms. Só então o jogador recebe o controle.
- Ao desbloquear um mundo novo: câmera sobe até o portão (500 ms), portão se abre (300 ms), cabeçalho do novo mundo entra com a paleta nova (crossfade 400 ms). Um evento de 1,5 s, pulável por toque.
- Mundos visitáveis: rolagem livre para cima (revisitar) e limitada para baixo até o portão bloqueado + 1 tela (teaser do próximo mundo em silhueta).

### 5.4 Não fazer

- Não usar rolagem horizontal em retrato.
- Não deixar mais de **12 nós** sem quebra visual (mundo, portão, mudança de paleta).
- Não esconder o chefe: o jogador deve ver o nó do chefe desde o primeiro nó do mundo (motivo para avançar).
- Não usar estrelas por pontuação absoluta (não escala); use critérios relativos ou binários.
- Não abrir a fase direto no toque do nó sem o popup (o jogador precisa ver o critério da estrela que falta).

---

## 6. Feedback e "juice" para jogos de reflexo

### 6.1 Referências reais

| Fonte | O que ensina |
|---|---|
| **Jan Willem Nijman (Vlambeer), "The Art of Screenshake" (2013)** | ~30 truques empilhados: animação + som base → balas maiores/mais rápidas → efeitos de impacto → **permanência** (deixar destroços) → **camera lerp** → **screen shake** → **sleep/hit-stop** (pausa de alguns ms no impacto; 100–200 ms para golpe mortal) → knockback → mais grave no áudio. Filosofia: toda ação, por menor que seja, gera feedback desproporcional. |
| **Blue Tengu — experimentos com a palestra** | Nem tudo serve para todo gênero: em top-down preciso, hit-stop de 1 frame "pareceu bug" e kickback atrapalhou o controle; **screen shake foi o que mais funcionou**. Teste cada truque no seu controle de um dedo antes de adotar. |
| **Alto's Odyssey** | Haptics só em 3–4 momentos significativos (aterrissar truque, quebrar pedra, prender vinha) — o resto é silêncio tátil. Contraste é o que dá valor ao haptic. |
| **Brawl Stars** | Números de dano flutuantes + haptic + shake em cada impacto; toda ação tem 3 canais de feedback simultâneos (visual, áudio, tátil). |
| **Vampire Survivors** | Slow-mo → pausa no level up; invulnerabilidade curta após escolher; o jogo nunca pune o jogador por uma interrupção que ele mesmo não pediu. |
| **Android Haptics Principles / Apple UIFeedbackGenerator** | "Claro" > "rico" > nunca "buzzy"; clique ideal **10–20 ms**; intensidade proporcional à importância e inversamente proporcional à frequência; co-projetar haptic com animação e som (dessincronia parece "quebrado"). iOS: `.light / .medium / .heavy / .soft / .rigid` e `success / warning / error`. |
| **Xbox Accessibility Guideline 118 / Game Accessibility Guidelines** | Flash = variação de luminância ≥ 10 %; **≤ 3 flashes/s**; área ≤ **20–25 %** da tela; sem flash vermelho saturado; padrões listrados de alto contraste ≤ 8 estáticos / 5 em movimento; ofereça toggle nomeado pelo efeito ("efeitos de flash"), não "modo epilepsia". |

### 6.2 Tabela de eventos → feedback (valores de partida para tuning)

| Evento | Hit-stop | Timescale | Shake (amplitude / decaimento) | Flash / vinheta | Haptic (iOS / Android) | Som |
|---|---|---|---|---|---|---|
| Arco atravessado (normal) | 0 | 1.0 | 0 | partícula de anel 1 → 1.6× em 200 ms | `.light` / `CLICK` (10–20 ms) | tick curto, pitch sobe com o combo (+1 semitom a cada 5) |
| Arco perfeito (centro) | **40 ms** | 1.0 | 3 dp / 120 ms | flash branco no arco 60 ms @ 60 % | `.medium` / `TICK` | tick + harmônico |
| Marco de combo (x5, x10…) | 60 ms | 1.0 | 4 dp / 150 ms | vinheta accent 10 % por 300 ms | `.medium` / `CONFIRM` | acorde curto |
| Quase-erro (near miss ≤ 8 dp) | 0 | **0,3 por 150–250 ms** | 0 | linha de risco piscando 2× | `.soft` / `TICK` | "whoosh" |
| Golpe no chefe | **100–120 ms** | 1.0 | 8 dp / 200 ms | flash branco no chefe 80 ms | `.heavy` / `HEAVY_CLICK` | impacto com grave |
| Mudança de fase do chefe | **150 ms** | 0,5 por 300 ms | 10 dp / 300 ms | flash de tela **1×** 80 ms @ 50 % (não vermelho) | `.rigid` | riser + impacto |
| Habilidade pronta | 0 | 1.0 | 0 | flash no botão 100 ms | `.light` | "ping" |
| Habilidade usada | 30 ms | 1.0 | 4 dp / 120 ms | onda circular 300 ms | `.medium` | ataque da habilidade |
| Dano recebido (vida perdida) | 80 ms | 0,6 por 200 ms | 6 dp / 200 ms | vinheta vermelha dessaturada `#C0392B` 20 % por 250 ms | `.heavy` / `LONG_PRESS` | impacto seco |
| Morte / fim de run | **200 ms** | **0,2 por 500 ms** → 0 | 12 dp / 400 ms | dessaturar a tela para 30 % em 400 ms | `notification.error` | queda + silêncio de 300 ms |
| Level up / perk | 0 | 1 → 0,1 em 200 ms, então pausa | 0 | brilho subindo do chão 400 ms | `.medium` | riser ascendente |
| Novo recorde | 60 ms | 1.0 | 5 dp / 150 ms | confete 40–60 partículas | `notification.success` | fanfarra curta (≤ 1 s) |
| Compra | 0 | — | 0 | moedas voando 300 ms | `notification.success` | caixa registradora suave |

### 6.3 Regras de implementação

**Hit-stop**
- Implementar como timescale 0 por N ms, **não** como frame skip; a UI (popups, HUD) continua animando em tempo real durante o hit-stop.
- Nunca encadear dois hit-stops em < 100 ms; se dois eventos coincidirem, aplica-se o maior.
- Em jogo de um dedo, hit-stop > 80 ms em evento **frequente** vira lag percebido — reserve 100 ms+ para chefe e morte.

**Câmera lenta**
- Sempre com **ease** na entrada e saída do timescale (nunca degrau): 100–200 ms para entrar, 200–300 ms para sair.
- Áudio acompanha: pitch −20 % e filtro low-pass durante o slow-mo (o cérebro precisa do áudio para "acreditar").
- Slow-mo de morte: 0,2 por 500 ms, então fade para 0 e tela de resultado após 800 ms — dá tempo de "ver o erro", que é o que faz o jogador tentar de novo.

**Screen shake (modelo "trauma")**
- Guardar `trauma ∈ [0,1]`; amplitude = `trauma² × maxAmp` (maxAmp = **8 dp** em retrato; 12 dp só para morte); decaimento linear de trauma em 0,25–0,4 s.
- Deslocamento por ruído Perlin/simplex em X e Y + **rotação de até 1,5°** (rotação vende mais "peso" que translação).
- Em retrato, o shake **não pode mover o HUD**: aplicar só na câmera do mundo; HUD em canvas separado.
- Toggle "Tremor de tela" em Configurações (padrão ligado); respeitar *Reduce Motion* do sistema desligando shake e slow-mo visual (manter hit-stop, que não enjoa).

**Flash de fase e vinhetas**
- Flash de tela inteira: no máximo **1 por evento**, 60–80 ms de subida, 200 ms de queda, opacidade ≤ 60 %, cor branca ou da paleta do mundo — **nunca vermelho saturado** (falha de "red flash" do XAG 118).
- Nunca mais de **3 flashes por segundo** em qualquer combinação de efeitos (arcos rápidos + combo + habilidade podem somar — o sistema de feedback precisa de um *rate limiter* global).
- Vinheta: gradiente radial das bordas com 15–25 % de opacidade no pico, 200–300 ms; usar vermelho dessaturado (`#C0392B`) para dano, cor accent para combo, azul-escuro para slow-mo.
- Toggle "Efeitos de flash" separado do shake (padrão ligado; descrição honesta, sem prometer "seguro para epilepsia").

**Haptics**
- Um serviço central: `Haptics.play(evento)` consulta preferência (Ligado / Mínimo / Desligado), capacidade do device e sincroniza com o áudio (**< 16 ms** de diferença).
- Frequência × intensidade: arco normal é o evento mais frequente → o haptic mais leve; morte é o mais raro → o mais forte. Nunca haptic contínuo.
- Android: usar `HapticFeedbackConstants` / `VibrationEffect.Composition` (primitivas `CLICK`, `TICK`, `THUD`); **nunca** `vibrate(long)` legado (resulta "buzzy").
- iOS: `prepare()` o generator antes do evento previsível (ex.: quando o arco entra na zona de acerto) para eliminar latência.
- "Mínimo" = só chefe, morte, compra e level up.

**Squash & stretch e partículas**
- Bola: stretch 1.15/0.85 na direção do movimento quando rápida; squash 0.8/1.2 por 80–120 ms ao atravessar arco perfeito; retorno com `back`.
- Arco atravessado: 8–16 partículas, vida 300–500 ms, cor do arco; **permanência**: fragmentos do arco caem e ficam 2 s (Vlambeer) — o jogador "vê" o que já venceu.
- Chefe: 40–80 partículas por golpe, 150+ na derrota; screen-space, nunca em cima do HUD.
- Limite global: 300 partículas vivas; acima disso, encurtar vida das mais antigas.

**Não fazer**
- Shake em todo arco (vira ruído e enjoa em 30 s).
- Hit-stop em evento que ocorre > 2× por segundo.
- Haptic sem som correspondente, ou som sem visual.
- Slow-mo que o jogador não pode interromper com um toque (exceto morte).
- Efeitos que sobrepõem o HUD ou a zona de toque dos botões.

---

## 7. Paleta de raridades

Uma paleta única para cartões de perk, molduras de loja, partículas, texto de rótulo e HUD. Testada contra fundo escuro `#12141A` (padrão de overlay) — contrastes abaixo.

| Raridade | Cor base | Contraste sobre `#12141A` | Borda | Glow (blur / opacidade) | Fundo tintado | Texto sobre a cor | Uso em partículas |
|---|---|---|---|---|---|---|---|
| **Comum** | `#B8C0CC` | 10,0 : 1 | 2 dp | — | 6 % | `#12141A` | cinza-claro, poucas |
| **Raro** | `#3B9DFF` | 6,6 : 1 | 2 dp | 8 dp / 30 % | 8 % | `#FFFFFF` | azul + brancas |
| **Épico** | `#A855F7` | 4,7 : 1 | 3 dp | 12 dp / 40 % | 10 % | `#FFFFFF` | roxo + magenta |
| **Lendário** | `#FFB020` → `#FF6A00` (gradiente 135°) | 10,2 : 1 | 3 dp gradiente | 16 dp / 50 % | 12 % | `#12141A` | dourado + faíscas brancas |

- **Rótulo textual sempre** (COMUM / RARO / ÉPICO / LENDÁRIO) + **pips** (1–4 losangos de 6 dp) ao lado do rótulo: raridade legível por daltônicos e sem cor.
- Variantes para fundo claro (mapa/menus de mundo claro): escurecer 20 % (`#8E97A6`, `#1F7AD9`, `#8A3FD6`, `#D98A00`) e manter texto escuro.
- Nunca usar a cor de raridade para outro significado (ex.: azul de raridade ≠ azul de "informação"). O accent do mundo e o verde de ação **não podem** coincidir com nenhuma das 4.
- Convenções de mercado usadas como base (para o jogador reconhecer de cara): WoW `#FFFFFF / #1EFF00 / #0070DD / #A335EE / #FF8000`; Hades branco / azul / roxo / vermelho; Brotato branco / azul / roxo / vermelho; Archero cinza / verde / azul / roxo / dourado / vermelho; palete "Global Item Rarity" (Lospec) `#E3E3E3 / #36A90C / #1E7FB7 / #832EF7 / #FFB155`. Nossa escolha pula o verde "incomum" (4 níveis bastam para hiper-casual) e reserva o vermelho para dano/chefe.

---

## 8. Checklist final de QA visual

**Layout e toque**
- [ ] Testado em 16:9 (1080×1920), 19.5:9 (1080×2340), 20:9 (1080×2400) e 4:3 (iPad 1620×2160) — HUD ancorado por safe-area, nada cortado, zona de jogo ≥ 55 %A em todos.
- [ ] Nenhum elemento interativo sob a Dynamic Island / notch nem sobre a barra de gesto do Android.
- [ ] Todo alvo de toque ≥ 48 dp com ≥ 8 dp de folga; botões de habilidade com hit-area 80 dp e exclusão mútua com o controle da bola.
- [ ] Trava de input de 300 ms em todo overlay que aparece durante o jogo (perk, pausa, morte).
- [ ] Um único botão primário por tela; fechar (44 dp) sempre no canto superior direito ou por arrastar.

**Tipografia e cor**
- [ ] Texto do HUD com contraste ≥ 4,5:1 sobre o **pior** fundo do jogo (testar com o mundo mais claro e o mais escuro); ícones e barras ≥ 3:1.
- [ ] Algarismos tabulares em score, timer, preços e combo (nada "dança").
- [ ] Mínimos: 11 dp rótulos caps, 12 dp legendas, 14 dp corpo, 18 dp títulos de card.
- [ ] Raridade identificável **sem cor** (rótulo + pips); simulação de deuteranopia e protanopia aprovada.
- [ ] Apenas 2 famílias tipográficas e a paleta fechada (accent do mundo, verde de ação, 4 raridades, cinzas).

**Movimento e feedback**
- [ ] Todas as durações na escala 50/100/250/300/450/500 ms; sem animação linear.
- [ ] Shake máx. 8 dp (12 dp só na morte), decaimento ≤ 400 ms, HUD imóvel.
- [ ] Rate limiter global: ≤ 3 flashes/s; flash de tela ≤ 60 % opacidade, nunca vermelho saturado; nenhuma listra de alto contraste cobrindo > 20 % da tela.
- [ ] Toggles independentes: Tremor de tela, Efeitos de flash, Haptics (Ligado/Mínimo/Desligado); *Reduce Motion* do sistema respeitado.
- [ ] Haptic sincronizado com áudio (< 16 ms) e nunca contínuo; teste em pelo menos 1 iPhone e 2 Androids de faixas diferentes.
- [ ] Hit-stop nunca > 80 ms em eventos frequentes; UI continua animando durante o hit-stop.

**Telas**
- [ ] Perk: 3 cartões, descrição ≤ 2 linhas com número em destaque, ícones distintos, reroll/skip visíveis quando disponíveis, invulnerabilidade de 500 ms após escolher.
- [ ] Loja: preview com asset real; timers corretos no fuso do dispositivo; estado "saldo insuficiente" leva ao pacote de moedas; ≤ 1 destaque + 4 cards acima da dobra.
- [ ] Loading: sem tela para < 1 s; barra só com progresso real; dicas ≤ 90 caracteres, banco ≥ 30, sem spoiler de chefe; "toque para continuar" quando ≥ 3 s.
- [ ] Menu: ≤ 5 interativos, jogo vivo ao fundo, "toque para jogar" aceita toque na área central, transição sem loading.
- [ ] Mapa: auto-scroll ao nó atual; chefe visível desde o início do mundo; critérios de estrela no popup; portão com requisito legível.

**Conteúdo e localização**
- [ ] Strings com folga de +30 % (alemão/espanhol) sem quebrar cards de 2 linhas; nenhum texto rasterizado em imagem.
- [ ] Nenhum texto na launch screen; splash total ≤ 1,5 s.
- [ ] Ícones de habilidade e perk legíveis a 24 dp (versão HUD) e 56 dp (versão card).

**Performance**
- [ ] 60 fps estáveis com tela de perk aberta (blur pode ser substituído por escurecimento em GPUs fracas).
- [ ] ≤ 300 partículas vivas; ≤ 4 popups de pontos simultâneos.
- [ ] Nenhum spike > 16 ms ao abrir loja/mapa (pré-carregar previews).

---

## 9. Fontes consultadas

**HUD, layout e hiper-casual**
- [Mastering the Thumb Zone — Parachute Design](https://parachutedesign.ca/blog/thumb-zone-ux/)
- [Mobile Screen Resolution, Aspect Ratios and Safe Areas — Cursa](https://cursa.app/en/page/mobile-screen-resolution-aspect-ratios-and-safe-areas)
- [Designing for Mobile in Fortnite — Epic Developer Community](https://dev.epicgames.com/documentation/fortnite/designing-for-mobile-in-fortnite?lang=en-US)
- [HUD design in games — Sunstrike Studios](https://sunstrikestudios.com/en/blog/HUD_design_in_games/)
- [Hypercasual Games UI/UX Design Guide — Pixune](https://pixune.com/blog/hypercasual-games-ui-ux-design-guide/)
- [Admiring the Game Design in Hyper-Casuals — GameDev.net](https://www.gamedev.net/tutorials/game-design/game-design-and-theory/admiring-the-game-design-in-hyper-casuals-r5146/)
- [Subway Surfers — Score Multiplier (Help Center)](https://sybo.helpshift.com/hc/en/5-subway-surfers/faq/211-score-multiplier/)
- [Subway Surfers — Score (wiki)](https://subwaysurf.fandom.com/wiki/User_blog:Superwatery/Score)
- [Geometry Dash — progress bar discussion](https://steamcommunity.com/app/322170/discussions/0/1748980761804456166/)
- [Vampire Survivors — guia com layout do HUD (PSNProfiles)](https://psnprofiles.com/guide/20349-vampire-survivors-belpaeses-declassified-vampire-survival-guide)
- [Alto's Odyssey: How a Winning Mobile Game Is Made — Dice](https://www.dice.com/career-advice/altos-odyssey-winning-mobile-game)
- [Q&A with Team Alto — The Sweet Setup](https://thesweetsetup.com/quick-qa-team-alto-makers-altos-odyssey/)
- [Hollow Knight — boss thresholds discussion](https://steamcommunity.com/app/367520/discussions/0/3083268548817134424)
- [Cooldown Button — Godot Recipes](https://kidscancode.org/godot_recipes/3.x/ui/cooldown_button/index.html)
- [Game UI Database — Scoring & Combos](https://www.gameuidatabase.com/index.php?scrn=136)

**Seleção de perks**
- [Vampire Survivors — Level up (wiki)](https://vampire.survivors.wiki/w/Level_up)
- [Archero — Abilities (wiki)](https://archero.fandom.com/wiki/Category:Abilities) · [Angels](https://archero.fandom.com/wiki/Angels)
- [Archero — design notes (Scott Fine)](http://scottfinegamedesign.com/design-blog/tag/Archero)
- [Brotato — Items (wiki)](https://brotato.fandom.com/wiki/Items) · [Shop](https://brotato.wiki.spellsandguns.com/Shop)
- [Hades — Boons (wiki)](https://hades.fandom.com/wiki/Boons) · [Boon rarity guide — DBLTAP](https://www.dbltap.com/posts/hades-boon-rarity-guide-to-standard-and-special-boons-01ek30qqebzt)
- [20 Minutes Till Dawn — news (rerolls padrão)](https://steamcommunity.com/app/1966900/allnews/) · [Synergies guide — Game Rant](https://gamerant.com/20-minutes-till-dawn-synergies-upgrade-combinations/)

**Loja**
- [Changes to Bling, Shop and Cosmetics — Supercell](https://supercell.com/en/games/brawlstars/blog/news/changes-to-bling-shop-and-cosmetics/)
- [Brawl Stars — Catalog (wiki)](https://brawlstars.fandom.com/wiki/Catalog)
- [Design Critique: Brawl Stars — IXD@Pratt](https://ixd.prattsi.org/2025/02/design-critique-brawl-stars/)
- [Fortnite Item Shop (wiki)](https://fortnite.fandom.com/wiki/Item_Shop) · [Fortnite removed item rarities — TechRadar](https://www.techradar.com/gaming/consoles-pc/fortnite-has-removed-item-rarities-and-some-players-arent-happy) · [Rotation explained](https://alviran.net/blog/fortnite-item-shop-rotation-explained-2026/)
- [Subway Surfers — Characters](https://subwaysurf.fandom.com/wiki/Characters) · [Key](https://subwaysurf.fandom.com/wiki/Key)
- [Stumble Guys — Skins (wiki)](https://stumbleguys.fandom.com/wiki/Skins) · [Shop guide](https://www.playstumbleguys.com/stumble_guys_shop_2025/)
- [How to make your game UI shine & increase conversions — GameAnalytics](https://www.gameanalytics.com/blog/how-to-make-your-game-ui-shine-and-increase-conversions)

**Loading, splash e menu**
- [Game Design Rules: Loading Screens — Game Developer](https://www.gamedeveloper.com/design/game-design-rules-loading-screens)
- [Loading Bar Design: Do's and Don'ts — Amelia](https://wpamelia.com/loading-bar/)
- [Apple HIG — Launching](https://developers.apple.com/design/human-interface-guidelines/patterns/launching)
- [Android — Splash screens](https://developer.android.com/develop/ui/views/launch/splash-screen)
- [App Splash Screen Best Practices — Appy Pie](https://www.appypie.com/blog/app-splash-screen-best-practices)
- [Brawl Stars — Loading Screen Tips (wiki)](https://brawlstars.fandom.com/wiki/Loading_Screen_Tips)
- [Genshin Impact — Loading Screen (wiki)](https://genshin-impact.fandom.com/wiki/Loading_Screen)
- [Monument Valley II — análise de tipografia (Medium)](https://medium.com/@DarrenFong/monument-valley-ii-9ae5705409)
- [Material Design 3 — Easing and duration tokens](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)

**Seleção de fases**
- [Candy Crush Saga — Episode (wiki)](https://candycrush.fandom.com/wiki/Episode) · [Level](https://candycrush.fandom.com/wiki/Level)
- [Cut the Rope — walkthrough com requisitos de estrelas (Gamezebo)](https://www.gamezebo.com/walkthroughs/cut-the-rope-walkthrough/)
- [Cut the Rope vs Angry Birds — Medium](https://medium.com/game-design-fundamentals/cut-the-rope-vs-angry-birds-f661e815a69c)
- [Two Dots — Wikipedia](https://en.wikipedia.org/wiki/Two_Dots_(video_game)) · [Two Dots illustrated maps — Behance](https://www.behance.net/gallery/46734833/Two-Dots-Games-Illustrated-Maps)
- [Game UI Database — Level Select: World Map](https://www.gameuidatabase.com/index.php?scrn=6)

**Juice, haptics e acessibilidade**
- [The Art of Screenshake — resumo com lista de truques](https://theengineeringofconsciousexperience.com/jan-willem-nijman-vlambeer-the-art-of-screenshake/) · [palestra (YouTube)](https://www.youtube.com/watch?v=AJdEqssNZ-U)
- [Experimentos com a palestra — Blue Tengu](https://www.bluetengu.com/2014/12/12/art-of-screenshake-experiments/)
- [How to make your game feel good — Egmatic](https://egmatic.com/blog/how-to-make-your-game-feel-good)
- [Game feel tutorial — GameDev Academy](https://gamedevacademy.org/game-feel-tutorial/)
- [Haptics design principles — Android Developers](https://developer.android.com/develop/ui/views/haptics/haptics-principles)
- [UIImpactFeedbackGenerator — Apple](https://developer.apple.com/documentation/uikit/uiimpactfeedbackgenerator) · [Haptics for mobile best practices — WYVRN](https://www.wyvrn.com/blog/2021/05/13/haptics-for-mobile-the-best-practices-for-android-and-ios/)
- [Xbox Accessibility Guideline 118 — Microsoft](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/118)
- [Avoid flickering images — Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/avoid-flickering-images-and-repetitive-patterns/)
- [WCAG contrast — WebAIM](https://webaim.org/articles/contrast/)
- [Global Item Rarity Colors — Lospec](https://lospec.com/palette-list/global-item-rarity-colors) · [Color-Coded Item Tiers — TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Main/ColorCodedItemTiers)
