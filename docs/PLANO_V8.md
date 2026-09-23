# ORBO v8 — "A revisão geral"

Plano da revisão completa pedida em 2026-09-22: tudo revisado, testado e melhorado antes
do lançamento. `docs/HISTORIA_V7.md` continua mandando na história; `docs/PLANO_V7.md`
fica como registro das etapas anteriores.

---

## 0. O pedido, em itens

1. Revisão geral e completa do jogo, tela por tela, como um desenvolvedor profissional.
2. Mais leve: manter tudo e rodar bem até nos celulares mais fracos (iPhone 7 é o piso).
3. Bolas novas no tema "visitantes de fora": 3I/ATLAS, ʻOumuamua, Borisov e parentes.
4. Muito mais rastros (há 152 bolas e 43 rastros), mais jatos, mais égides.
5. A história revisada com rigor por um crítico: envolvente, coerente com a premissa,
   personagens com voz própria. E as galáxias 6 a 10 escritas.
6. Fragmentos com arte vetorial customizada, com bordinha, bonitos de colecionar.
7. (Retirado pelo autor: o visual do jogo em si não muda; só os cards dos fragmentos.)
8. Mais poderes e "builds" (conjuntos de perks que se combinam).
9. Dificuldade: casual consegue zerar, mas leva de 12 a 24 meses; 100% leva de 24 a 36.
10. Mais easter eggs, cada um testado de verdade.
11. Caça a bugs em todas as páginas; panorama de tudo que precisa melhorar; aplicar.

---

## 1. Como o trabalho foi dividido

Cada frente tem dono e arquivos próprios — nenhum arquivo com dois donos ao mesmo tempo.

| frente | o que | arquivos | estado |
|---|---|---|---|
| A. Crítica da história | leitura rigorosa de g1–g5, correções cirúrgicas, beat sheet de g6–g10 | relatório | em curso |
| B. Desempenho e arquitetura | pontos quentes por quadro, código morto, carga, sw.js | relatório → render*.js, perf.js, main.js, sw.js | em curso |
| C. Progressão e economia | modelo de tempo para zerar/100 %, números novos, ajuda discreta, perks e builds | relatório → config.js, campaign.js, modes.js, perks.js | em curso |
| D. Caça a bugs | revisão estática de UI, save, i18n, iOS 15, rede | relatório → ui*.js, storage.js, online.js | em curso |
| E. Cosméticos novos | coleção Visitantes (+10 bolas), +12 rastros, +8 jatos, +6 égides | js/cosmetics-v8.js, js/render-cosmetics-v8.js | em curso |
| F. Arte dos fragmentos | 33 cards em vetor com moldura por ato | frag-scenes.js, render-frag.js, ui-fragments.js, fragments.css | em curso |
| G. Galáxias 6–10 | cenas novas nos três idiomas seguindo a bíblia | js/story-g6.js … story-g10.js | a fazer |
| H. Perks e builds | +15 perks, 6 builds com bônus, detecção e vitrine | perks.js, js/perks-v8.js, ui-perks | a fazer |
| I. Easter eggs | A Contemplação e mais 8, todos com teste | js/easter-v8.js, content-v8.js | a fazer |
| J. Integração e QA | index.html, sw.js, versão, auditoria, teste tela a tela, publicação | — | a fazer |

O gráfico do jogo em si (bola, arcos, fundo) **não muda de estilo**: o autor pediu o visual
"vetor com bordinha" só para os cards dos fragmentos (frente F).

---

## 2. O que já se sabe antes dos relatórios

- **sw.js não lista** `js/ui-menu-v7.js`, `js/ui-dock-v7.js` nem `css/menu-v7.css`: a primeira
  abertura offline do PWA falha nesses três. Corrigir na integração.
- 1,5 MB de JS sem minificar, tudo carregado antes do primeiro quadro. Os cinco
  `story-g*.js` (98 KB), `frag-scenes.js` (57 KB) e `singularity.js` (73 KB) só servem depois
  que a pessoa abre a tela correspondente.
- Conteúdo atual: 152 bolas, 43 rastros, 45 temas, 30 égides, 21 jatos, 17 habilidades,
  37 perks, 199 conquistas, 125 missões, 33 fragmentos, 60 cenas de história (g1–g5),
  1.000 fases. Auditoria: 0 erros, 0 avisos, 3.075 chaves iguais nos três idiomas.

---

## 3. O panorama: o que a revisão encontrou

Quatro auditorias independentes, cada uma lendo o código de verdade e medindo.

### 3.1 Desempenho (relatório completo, 52 KB)

Medido com o contexto 2D instrumentado, contando chamadas por quadro:

| situação | por quadro |
|---|---|
| partida pesada (bola Terra + rastro Prisma + 4 poderes) | 34 gradientes radiais, 316 strokes, 380 strings de cor, 69 save/restore |
| a mesma partida no nível **Baixo** | ainda 29 gradientes, 290 strokes, 380 strings |
| menu com a Galáxia aberta por cima | 41 gradientes, 722 arcos, 738 fills |
| HUD (DOM) | 24 querySelector, 23 toggles, 1 layout forçado |

O achado central: **o nível Baixo não é baixo**. Ele corta fundo, DPR e partículas, mas
nada do que é desenhado por objeto — bola, arco, rastro, orbes e moedas custam igual em
qualquer nível. Mais três coisas caras: o laço do canvas nunca dorme (continua a 60 fps
por baixo de painéis opacos com desfoque de 18 px), o HUD força um layout por quadro, e
`hexToRgb`/`rgba` montam 380 strings por quadro.

Peso: 1,79 MB brutos (≈ 480 KB comprimidos) em 87 pedidos, dos quais **248 KB são texto
em inglês e espanhol** carregados para quem joga em português.

### 3.2 Progressão (simulação das 1.000 fases)

As fases foram geradas pela própria `HR.Campaign.gen` e jogadas por um modelo de jogador
casual. O resultado:

| galáxia | chance de vencer uma fase | tentativas por fase |
|---|---|---|
| 1 a 4 | 91 % a 100 % | ~1,1 |
| 5 e 6 | 76 % e 52 % | 1,5 e 2,2 |
| 7 | 27 % | 5,4 |
| 8 a 10 | 8 %, 1 %, ~0 % | 26, 46, 50+ |

**O jogo não fecha.** Da galáxia 8 em diante um casual não passa, e o chefe final não é
vencível pelo modelo. Somando as repetições inúteis: 20 meses. Somando a moagem dos
portões de patente: mais 3,4 anos. E não é a velocidade: é o empilhamento (raio ×0,64 ×0,92
×0,9 = 45 px de abertura, dois modificadores, névoa com 0,3 s de reação — menos que o tempo
de reação humano). A Singularidade é mais difícil que o fim da campanha, em qualquer caminho.

Do outro lado, a loja custa 12,8 M de moedas contra uma renda de 2,5–8 k por dia: 4,5 anos
**depois** de zerar.

### 3.3 Bugs (23 achados, com arquivo e linha)

1 crítico, 3 altos, 10 médios, 9 baixos. Os que importam:

- **Progresso só em localStorage**, sem backup: no Safari em aba (não instalado), o sistema
  apaga dados depois de 7 dias sem uso — e o jogo grava valores novos por cima.
- **"Reiniciar" na pausa reinicia a fase errada** (usa o resumo da partida anterior); vindo
  do Infinito, joga a pessoa de volta no Infinito.
- **A ficha da fase perdeu os selos e os glifos**: `ui-galaxy.js` chama a função local, então
  os acréscimos de duas versões nunca rodam. Falha silenciosa.
- **`color-mix()` em 96 declarações e `:has()` em 2 regras** — nenhum dos dois existe no
  iOS 15, o piso do projeto.
- Áudio pode ficar mudo no menu; ranking sem tempo limite; dois ouvintes no voltar das Fendas.

Auditoria automática limpa no resto: nenhum id inexistente, 3.075 chaves iguais nos três
idiomas, nenhuma API fora do iOS 15 no JS.

### 3.4 História (crítica cena a cena, 1.235 linhas)

A v7.4 resolveu o essencial, e a voz continua sendo o ponto mais forte. O que ficou:

- **A fórmula do chefe de galáxia continua nas cinco**: "então vá" + "ninguém nunca me disse
  isso" + "vá perguntar por mim". A bíblia já condenava, e a frase condenada está literal.
- **Os chefes de sistema são onde a história para**: em 42 das 45 conversas, nada acontece.
- **Ela nunca diz o que quer**, nem depois de descobrir a palavra "mãe".
- **O Eco responde perguntas** (7 de 9) e duas vezes entrega a própria fraqueza de graça.
- Furos reais: a confissão do Casco se contradiz; o Cardume vai embora duas vezes; o degrau
  da galáxia 2 é dito duas vezes seguidas e o da 4 cai no chão.
- Tiques do autor, não das personagens: "ninguém" 30 vezes, "todo mundo diz isso" 6 vezes,
  "Boa menina" em duas bocas diferentes.
- Erro de tradução que inverte o sentido em espanhol (`st_g5b9_rQ`) e o Casco com dois nomes
  em inglês.

E um achado que amarra o jogo inteiro: **o Guardião da galáxia 1 perdeu onze. A Singularidade
tem onze Arcontes "que chegaram na porta antes dela".** São os mesmos — e isso paga a promessa
"diga que eu esperei" em qualquer um dos quatro finais.

Saíram 35 correções exatas nos três idiomas e o roteiro completo das galáxias 6 a 10:
75 cenas com as falas escritas.

---

## 4. Diário de execução

**v8 (2026-09-22/23) — em andamento.**

Feito até aqui:
- `sw.js` passou a listar os 87 arquivos que o `index.html` carrega (faltavam
  `css/menu-v7.css`, `js/ui-menu-v7.js` e `js/ui-dock-v7.js`: o PWA offline falhava neles).
- `js/ui.js` — o JOGAR do menu entra direto na fase atual. Eram quatro toques até a primeira
  partida (menu, mapa da galáxia, mapa do sistema, ficha da fase). O mapa continua no ícone
  da Galáxia e no selo do rodapé, e a cena de entrada da galáxia, que era disparada ao abrir
  o mapa, passou a entrar antes da fase.
- `js/cosmetics-v8.js` + `js/render-cosmetics-v8.js` — a coleção **Visitantes**: 3I/ATLAS,
  ʻOumuamua, Borisov, Halley, Hale-Bopp, NEOWISE, Tsuchinshan, Bennu, Ryugu e o planeta
  Errante; mais 12 rastros, 8 jatos e 6 égides, com desenho próprio e texto nos três idiomas.
- **Os 33 fragmentos em vetor** (`render-frag.js`, `frag-scenes.js`, `ui-fragments.js`,
  `fragments.css`): contorno, sombra chapada em dois tons, luz de borda, e uma moldura
  própria com canto por ato e um selo numerado de 01 a 33. Um card desenha em 0,2 ms
  (o teto era 6 ms) e o mural inteiro em 60 ms (teto 150 ms).
- **Dez easter eggs** (`js/easter-v8.js`), cada um provocado e conferido: A Contemplação
  (15 s parada na fase quieta da Via Láctea, que dá a bola Ponto Azul), a bola que dorme
  depois de 90 s no menu, sete toques no último "O", 03:33 no relógio, terminar com
  exatamente 33 arcos, o nome do perfil igual ao de um personagem, um minuto parado na
  pausa, um ano depois do primeiro dia, terminar com tudo mudo, e o código de setas.
- **As galáxias 6 a 10** (`story-g6.js` … `story-g10.js`): 78 cenas novas nos três idiomas,
  772 chaves por idioma, escritas a partir do roteiro da crítica e conferidas por um
  verificador próprio (`scratchpad/check-story.js`): fala com até duas linhas, resposta
  com até sete palavras, "culpa" só na boca do Eco, nenhuma palavra proibida, todo falante
  existente e toda pergunta com as seis chaves.
- **Os quatro finais** (`docs/FINAIS.md`): A Passagem, A Pergunta, A Porta Quebrada e
  Muitas Mãos. A resposta dada na porta manda; quem pulou cai no eixo que somou mais; e as
  três bandeiras secretas passam na frente de tudo. A porta **fica aberta**: voltar à
  10-10-10 mostra a cena de novo e dá outro final. Cinco conquistas novas.
- **A Costura** (`js/costura-v8.js`) — o terceiro segredo, que não existia e sem o qual
  Muitas Mãos era inalcançável. Uma fase por galáxia (a 7-7 de cada uma), sem perigo, com
  um fio que atravessa a tela em curva: seguir o fio por 20 segundos fecha a costura.
- **A galáxia 6 virou a Via Láctea** (`js/milkyway-v8.js`), e o bioma Cristal virou Espiral.
  Nenhum id interno mudou: a mecânica continua sendo o giro.
- **Desempenho.** Medido chamada por chamada, antes e depois, no mesmo protocolo:

  | situação | gradientes | strokes | arcos | strings de cor | querySelector |
  |---|---|---|---|---|---|
  | Loja aberta, nível 3 | 35 → **15** | 38 → 46 | 360 → **80** | 96 → **25** | — |
  | Loja aberta, nível 0 | 5,3 → **0,9** | 12 → **2,3** | 30 → **7,6** | 10 → **1,2** | — |
  | partida, nível 3 | 30 → **17** | 270 → 256 | 234 → 248 | 162 → **124** | 49 → **1,5** |
  | partida, nível 0 | 24 → **6,2** | 179 → **55** | 159 → **139** | 168 → **90** | 52 → **1,4** |

  O layout forçado por quadro acabou (`clientWidth` 1 → 0), o canvas passou a dormir a
  10 Hz quando há painel opaco por cima, o nível Baixo ganhou um eixo próprio de qualidade
  de objeto (`HR.Perf.obj`) que a bola, o arco, o rastro, as orbes, o jato e a égide leem,
  e `hexToRgb` caiu de 171 para 1 chamada por quadro. O save deixou de acontecer no quadro
  do toque (gema, égide, jato) e passa a ser gravado no `visibilitychange`.
- **Bugs — os 23 corrigidos.** Fase 1: o "Reiniciar" da pausa reiniciava a fase errada; a
  ficha da fase tinha perdido os selos e os glifos; o áudio podia ficar mudo; o ranking
  travava sem tempo limite; o voltar das Fendas disparava duas vezes; o chip do ranking do
  menu mostrava outra posição; o cartão de nível novo sumia se a pessoa saísse da partida.
  E todo `color-mix()` saiu do CSS (eram 96 declarações que sumiam no iOS 15), com as cores
  calculadas em JS — a equivalência foi conferida em 125 combinações, com no máximo 1 a 2
  de diferença em 255 num canal.
  Fase 2: o backup colado agora completa os campos que faltam antes de gravar; fechar a
  ficha da partida volta com o aviso "Toque para começar"; os avisos de fim de partida não
  caem mais por cima da partida seguinte; as missões do dia pararam de zerar quando uma
  temporada começa; e a contagem de engasgo, que nunca disparava porque o tempo chegava
  limitado, voltou a funcionar.
- **O progresso agora tem cópia.** Nos Ajustes há "Copiar código de backup" e "Colar código
  de backup". Era o defeito mais grave achado: quem joga pelo Safari em aba, sem instalar,
  perde tudo depois de sete dias sem abrir — e o jogo ainda gravava dados novos por cima.
