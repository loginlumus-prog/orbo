# ORBO v5.1 — plano

Pedido do usuário (2026-09-13), item por item:

| # | Pedido | Entrega planejada |
|---|---|---|
| 1 | Muito mais rastros, bem diferentes | +28 rastros com desenho próprio (fita, neon, hélice DNA, fumaça, tinta, notas, corações, folhas, fogos, pó estelar, pixel, glitch, laser, penas, gotas, clones, halos, runas, borboletas, meteoros, aurora, gelo, fogo azul, trepadeira, confete, ouro, zigue-zague, prisma) |
| 2 | Temas mudando mais o fundo, mostrando outras coisas além da galáxia | cenários em camadas com parallax (cidade, montanhas, deserto, praia, floresta, vulcão, recife, Marte, ártico, templo, céu com nuvens, doces, cemitério, fliperama, selva, base lunar, caverna, savana, porto com farol) em 12 temas novos e nos temas antigos |
| 3 | Mais variedade de Égide | +14 visuais de Égide |
| 4 | Mais variação da chama do Jato | estilos de chama (a chama deixa de ser só cor) + 12 visuais novos |
| 5 | Bolas mais caras: conquistar jogando | nova tabela de preços por raridade (bolas, rastros, temas, visuais de Égide/Jato), calibrada pela renda real por hora |
| 6 | Trocar o controle durante a partida | botão no HUD que alterna Analógico / Relativo / Seguir (tecla C) e seletor na pausa |
| 7 | Câmera lenta de adaptação | ao quebrar a Égide, quebrar a sequência, errar, escolher poder e trocar de direção: câmera lenta curta que volta à velocidade (opção nos ajustes) |
| 8 | Escolha automática de poderes de verdade | com a escolha automática ligada, todos os poderes são escolhidos na hora, sem pausar |
| 9 | Lugar de conquistas bonito e fácil de achar | botões "Conquistas" e "Coleção" no menu; Sala de Troféus com medalhas por nível (bronze → diamante), progresso geral, "quase lá", recentes, detalhe de cada troféu; aviso de troféu ao ganhar |
| 10 | Conquistas por comprar, vencer chefes e feitos especiais | novos troféus: compras, cada chefe de galáxia, chefes sem dano, feitos especiais; checagem logo após compras |
| 11 | 3 estrelas parecendo vazadas | estrelas ganhas sólidas e douradas |
| 12 | Espaço no computador mostrando o nome do último item | Espaço vira a tecla do jogo: começa, joga de novo, próxima fase; botões não guardam foco depois do clique |

| 13 | Efeitos do fundo seguindo a direção do voo | partículas (neve, poeira, pétalas, chuva, brasas...) andam com o movimento do mundo em qualquer direção; o cenário fica em pé e desce/sobe nas subidas |
| 14 | Mais efeitos por galáxia (água, fogo, raio, vento, tóxico, poder, linhas) | 16 efeitos novos; cada sistema combina um efeito principal e um segundo efeito do conjunto da galáxia; partículas ao passar pelo arco conforme o efeito |

## Estado v5.1 (2026-09-14)

Implementado e verificado no navegador (console limpo):

- Rastros: 39 (28 novos, desenho próprio em `js/render-trails.js`).
- Temas: 35 (12 novos); 29 com cenário em camadas (`js/render-scenes.js`, 19 cenários).
- Efeitos de fundo: 17 novos/refeitos em `HR.Render.FX`; conjuntos por galáxia em `HR.REGION_FX` e `HR.systemFx(ri, si)` (`js/cosmetics-v51.js`).
- Égide: 24 visuais (14 novos). Jato: 17 visuais, cada um com estilo de chama (`js/render-gear-v51.js`).
- Preços por raridade (`HR.SKIN_PRICE`, `HR.TRAIL_PRICE`, `HR.THEME_PRICE`, `HR.GEAR_PRICE`): bola comum 2.500, rara 9.000, épica 32.000, lendária 140.000, mítica 550.000; TON 618 continua 1,5 mi.
- Controle na partida: botão no HUD (tecla C) e seletor na pausa (`HR.UI.setControl`).
- Câmera lenta de adaptação: `CONFIG.ADAPT` (Égide, dano, erro, sequência, poder, curva), opção nos Ajustes.
- Escolha automática: `AUTOPERK.afterOffers = 0` (todos os poderes na hora).
- Conquistas: 198 troféus (44 novos em Compras, Chefes e Feitos), Sala de Troféus com medalhas bronze → diamante (`js/ui-trophies.js`), aviso de troféu, botões Conquistas e Coleção no menu, aba Itens na coleção.
- Estrelas ganhas sólidas; Espaço começa, continua, joga de novo e segue para a próxima fase.

Ajustes pedidos depois (2026-09-14):
- Menu: órbita em dois arcos (4 botões de cada lado) distribuídos pela altura da tela, botões menores em telas baixas e nomes em etiquetas que ficam sempre por cima (`HR.UI.layoutOrbit`).
- Mapa da Galáxia: TON 618 com lente de bordas suaves (sem cortes), matéria espiralando no plano do disco (no lugar dos traços retos), galáxia-mãe girando devagar, nebulosas que derivam e respiram, poeira orbitando, estrelas cadentes e brilho pulsando nas galáxias abertas; fundo um pouco mais claro.

## Revisão geral (2026-09-14)

- **Fase presa depois de bater (corrigido):** um arco normal batido era marcado como resolvido mas não contava para o fim da fase; com escudo, Égide, vida ou continuar, a fase nunca terminava. Agora todo arco conta uma única vez (`ringResolved` com `r.counted`), arcos que saem da tela sem resolução (ex.: durante a animação de morte) contam como erro, e uma rede de segurança encerra a fase se não houver arco pendente (`level_watchdog` no Analytics).
- **Teste automático:** robô jogando com erros, batidas, mortes, continuações e recusas em 39 partidas (fases normais, chefes de sistema e de galáxia, passagens e Provas da Singularidade, Infinito, Treino, perfil novo): todas terminaram, rede de segurança nunca precisou agir, console limpo.
- **Rodar liso em qualquer aparelho:** qualidade gráfica automática (`js/perf.js`): começa pela memória/núcleos do aparelho, baixa a resolução e desliga o segundo efeito se a partida travar; opção Auto/Alta/Leve nos Ajustes; teto de partículas por nível.
- **Compatibilidade:** `:focus-visible` protegido em navegadores antigos; fundos simples onde `color-mix()` não existe; nenhum recurso de JavaScript recente sem proteção.

## v5.2: menu vivo e loja organizada (2026-09-14)

- **Aviso vazando no mapa (corrigido):** o selo vermelho do Diário (z-index 6) aparecia por cima dos painéis, que têm z-index 5. A cena do menu agora isola as camadas (`.scene { isolation: isolate }`).
- **Botões da órbita com vida:** cada botão tem cor própria (Loja rosa, Missões laranja, Diário vermelho com laço dourado, Coleção violeta, Ranking ciano, Galáxia azul, Poderes verde, Conquistas dourado), disco em degradê, anel girando com uma lua e glifo vetorial animado (sacola com estrela piscando, bandeira tremulando, tampa do presente pulando, orbes pulsando, pódio subindo, espiral girando, raio faiscando, brilho passando na taça). Arquivos: `js/ui-v52.js`, `css/v52.css`.
- **Órbita:** dois cometas de luz percorrendo a elipse e poeira de estrelas colorida piscando. Nada anima quando o menu está coberto; no modo gráfico Leve e com "reduzir movimento" fica tudo parado.
- **Menos texto:** a frase do modo ("10 galáxias, 100 sistemas, 1.000 fases") virou dica dos botões de modo (toque longo / hover); MELHOR / RANKING / estrelas viraram chips com ícone (toque mostra o nome). No mapa da Galáxia os rótulos mostram só o nome da galáxia e o progresso com ícone; nome da região e categoria foram para a dica; rodapé com ícones (fases, estrelas, portal).
- **Loja organizada:** abas com ícone; filtro Todos / À venda / Meus; Bolas, Rastros e Temas em seções por raridade (Comum → Singular), cada uma com cor, barra de coleção, faixa de preço e contagem; dentro da seção, do mais barato ao mais caro e por nível; exclusivos (prêmios, Arcontes, pacotes, compra) no fim. Visuais de Égide e Jato também em seções por raridade.

## v5.3: analógico preciso e poderes bem sinalizados (2026-09-14)

- **Analógico direto:** a inclinação vira a velocidade da bola na hora (antes a bola seguia um alvo preso a uma mola, que ficava até ~200 px à frente). Tempo até 90% da velocidade: 250 ms → 83 ms; inverter a direção: 283 ms → 100 ms; parar ao soltar: 150 ms → 117 ms. Zona morta 0,12 → 0,07 e curva 1,35 → 1,12 (resposta mais linear). `CONFIG.BALL.stickResponse`.
- **Poderes com começo, meio e fim** (`js/game-v53.js`, `js/ui-v53.js`, `css/v53.css`): aviso grande com ícone ao começar (nome, efeito e duração); anel de tempo em volta da bola para estrela, fantasma, cometa, piloto automático, Égide (últimos 6 s) e fênix; nos últimos 2,5 s o anel pisca cada vez mais rápido, aparece a contagem 3-2-1 junto da bola e um aviso "Acabando" com os segundos; ao acabar, aviso "Acabou" com ícone riscado ("o controle é seu" no piloto automático) e câmera lenta curta (`ADAPT.powerEnd`). Chips do HUD mostram os segundos restantes e pulsam no fim.

## v5.4: rota entre mundos na tela do sistema (2026-09-20)

- A lista de fases deixou de ser o mesmo caminho de círculos da tela de sistemas. Agora é uma rota desenhada em canvas (`js/ui-system-v54.js`, `css/v54.css`), que envolve `HR.UI.renderSystem` e troca só o bloco `.lv-path`.
- Cada fase é um mundo: arte das bolas das coleções planetas, nebulosas e buracos negros, escolhida de forma fixa por id da fase (mesma fase, mesmo mundo). Cada planeta é desenhado uma vez num canvas próprio e depois só gira, para não pesar.
- Vida na tela: céu com nebulosas na cor da galáxia e estrelas, trilha de voo com o trecho vencido brilhando e um pulso de luz percorrendo, luas em órbita, aro de luz nas fases vencidas, halo na fase atual com a bola equipada orbitando, e o chefe como mundo maior com aura pulsando.
- Botões continuam em DOM por cima (número, estrelas, cadeado, aviso de evento), então toque, dicas e o tratamento de fase bloqueada seguem iguais.
- Respeita o modo gráfico Leve (menos estrelas, sem brilho nem luas) e "reduzir movimento" (desenha parado). Medido em 60 quadros por segundo, média de 16,7 ms por quadro.

## v5.5: menos texto, mais simbolo (2026-09-20)

- O cartao de texto dos poderes (comecou / acabando / acabou) saiu: ficam o chip com icone e segundos, o anel de tempo na bola e a contagem 3-2-1. Para trazer de volta: HR.POWER_CALL = true.
- Fim de fase: os rotulos (Arcos, Perfeitos, Erros, Moedas, Recompensas) viraram icones; o nome aparece ao tocar.
- Ficha da fase: "como ganhar estrelas" virou tres selos curtos com icone (60 % dos arcos, 40 % perfeitos, sem dano).
- Explicacoes longas (notas de ajuda, descricao de mecanica e de chefe) sairam da tela e viraram um "i" ao lado do titulo, com o texto completo no toque. Arquivos: js/ui-lean-v55.js, css/v55.css.

## v5.6: ficha de talentos, HUD enxuto e atalhos (2026-09-20)

- Escolher talento nao mostra mais texto na partida: a fileira de icones embaixo pisca e vira botao.
- Ficha da partida (js/ui-perks-v56.js, css/v56.css): status no estilo RPG (vidas, escudos, tamanho do arco, zona do perfeito, velocidade, moedas, recarga, duracao, pontos) e cinco arvores (Protecao, Mira, Voo, Riqueza, Ascensao) com o que foi pego aceso. Abre pausando o jogo.
- HUD menor: pontuacao 64 -> 40 px, combo e nome da fase menores, barra de progresso mais estreita.
- Conquista durante a partida vira um selo discreto no canto; o cartao completo aparece ao sair da partida. Item novo do album segue a mesma regra.
- Atalhos: Espaco pausa e despausa no computador; toque duplo (ou clique duplo) usa a Egide.

## v5.7: um controle so (2026-09-20)

- O analogico e o "seguir o dedo" foram removidos: no computador e no celular o jogo usa so o relativo (arrastar). game.controlMode() devolve sempre relative.
- Saem o botao de troca no HUD, o seletor na pausa, o analogico desenhado na tela e a linha de controle nos Ajustes (a sensibilidade continua).
- Atalhos seguem: Espaco pausa no computador, toque duplo ou clique duplo usa a Egide.

## v5.8: icones vivos e talentos com cor de arvore (2026-09-20)

- HR.glyph(nome) (js/ui-glyph-v58.js): o mesmo desenho do HR.icon com uma animacao curta (g-pop, g-turn, g-spin, g-beat, g-bob, g-left/right, g-rise, g-breathe, g-flick, g-flip, g-shake, g-twinkle) e cor propria por assunto (HR.glyphColor). Os oito icones do menu reaproveitam os glifos ricos do v5.2 (HR.GLYPH52).
- Botoes do jogo (pausa, fim de fase, fim de jogo, paineis, voltar, modos, ajustes) ganham a placa colorida com anel fino girando, no estilo dos botoes da orbita. Botoes de cor forte (jogar, anuncio, gema) recebem so a animacao.
- Comeco da partida: os jatos viraram fichas pequenas (simbolo + quantidade + tecla J no computador), abaixo do "toque para comecar" e centralizadas. O nome e a descricao ficam na dica.
- Talentos: cada arvore tem cor, glifo e barra de progresso; o talento apagado mantem um tom da arvore, entao da para ver a categoria de relance. Na pausa cada selo da faixa usa a cor da sua arvore e os cartoes de escolha ganham o selo da arvore no canto.
- Correcao: as regras .perk-card do v5.6 estavam pegando tambem os cartoes de escolha da partida (alinhavam a esquerda e esticavam). Agora sao .perk-modal .perk-card.
- Arquivos: js/ui-glyph-v58.js, css/v58.css. Ajustes em js/ui.js, js/ui-galaxy.js, js/ui-singularity.js (data-icon nos botoes), js/ui-lean-v55.js, js/ui-perks-v56.js, js/ui-v52.js.

## v5.8 a v6.2 (2026-09-21)

- **v5.8** icones vivos: HR.glyph (animacao curta + cor por assunto), placas nos botoes, talentos com cor de arvore.
- **v5.9** a historia entra no jogo: js/story.js (eixo U/Q/F, marcas, cartas), js/ui-story.js, texto por galaxia (g1 a g5), o Ninho (3-7-7) e a bola Poeira. Economia da campanha escalonada por galaxia.
- **v6.0** icones redondos vazados, loja com palco por colecao, "Bolas" virou "Skins", revisao de arte (Terra, Biscoito, Rocha, Europa, Mercurio, Ceres, gude, anel de Saturno e Urano) e +12 bolas, +10 temas, +4 rastros, +10 visuais de Egide e Jato.
- **v6.1** as Fendas: um buraco negro por galaxia no Infinito, com ouro crescente (x1,00 a x2,98) e recorde separado. Sem cadeado: a fenda 1 esta sempre aberta.
- **v6.2** quatro niveis de grafico (0 baixo, 1 normal, 2 bom, 3 muito bom) com tabela unica em js/perf.js, classes perf-N no <html>, vigia que desce o nivel sozinho no automatico (ou sugere no manual) e css/perf.css desligando animacao de icone, desfoque e brilho nos niveis baixos.

Medido no navegador (fase 9-9-9, 255 quadros): render 0,83 ms no muito bom e 0,44 ms no baixo; quadros acima de 22 ms cairam de 30 para 4.
Revisao completa (tools/audit.js): 0 erros e 0 avisos — 151 bolas, 43 rastros, 45 temas, 1.000 fases, 60 cenas de historia, 199 conquistas e 2.808 chaves de texto com PT/EN/ES iguais.

## v6.3 (2026-09-22) — o que o teste no iPhone 7 revelou

Quatro defeitos reais, achados a partir do relato de quem jogou:

1. **O clique que sumia.** A dica de toque longo (js/tips.js) marcava `suppress = true` para
   engolir o clique que o navegador manda depois do toque longo — e so desmarcava QUANDO
   esse clique chegava. Toque longo que termina sem clique (o caso comum) deixava a marca
   ligada para sempre, engolindo o proximo clique da tela, qualquer que fosse ele. Dai o
   "so funciona no segundo clique". Agora a marca vale um clique e cai sozinha em 400 ms,
   e todo gesto novo comeca limpando o que sobrou do anterior.
2. **A tela que subia (iPhone).** `wrap.scrollIntoView` no mapa das fases rola TODO ancestral
   rolavel, e a pagina e rolavel por codigo mesmo com `overflow: hidden`. No iPhone isso
   levantava o jogo inteiro: o topo saia da tela e o toque passava a cair fora do botao.
   Agora o mapa rola so o proprio painel, o `#app` e `position: fixed` (nao acompanha rolagem
   nenhuma) e um guarda devolve a janela para o zero se algo tentar rolar.
3. **O topo cortado na tela de inicio.** Em PWA no iOS a barra de status fica POR CIMA do jogo e
   aparelho sem entalhe devolve `safe-area-inset-top: 0`. `html.ios-app` garante 26 px de
   respiro no topo: fase, pausa e vidas nao caem mais em cima da hora e da bateria.
4. **O painel que parava de abrir.** `HR.UI.open` desiste em silencio se o painel ja esta na
   pilha. Quando pilha e tela saiam de sincronia o botao ficava morto ate trocar de tela.
   `HR.UI.syncStack()` confere a pilha contra o que esta na tela antes de decidir.

Navegacao leve nos niveis Normal e Baixo (`HR.Perf.lite()`): mapa da galaxia, mapa do sistema,
destaque dos paineis, pre-visualizacoes da loja, fendas e singularidade desenham UM quadro
parado em vez de um laco a 60 fps; a camera que aproxima o sistema tambem e pulada e todos
esses canvas passam a respeitar `HR.Perf.dprCap()`.

Medido no navegador, parado no mapa da galaxia 1: 156 chamadas de quadro por segundo no muito
bom contra 60 no baixo (so o laco do proprio jogo). Na loja, bolas desenhadas por segundo:
168 no muito bom contra 60 no baixo. Revisao (tools/audit.js): 0 erros, 0 avisos.

## v6.3.1 (2026-09-22) — a engrenagem que nao abria

Causa achada com `document.elementFromPoint` no centro do botao: quem estava ali era o
**botao de pausa do HUD**. `.screen.hud button { pointer-events: auto }` valia mesmo com o
HUD escondido, entao a pausa (invisivel, no mesmo canto) recebia o clique da engrenagem do
menu. O mesmo valia para Egide, Jatos, habilidades e talentos do HUD.

Correcao de uma linha, valendo para qualquer tela: `.screen:not(.visible), .screen:not(.visible) *`
tem `pointer-events: none !important`. Tela escondida nao recebe toque nenhum, nem nos filhos.
Conferido: durante a partida os cinco botoes do HUD continuam clicaveis e o HUD segue deixando
o toque passar para o jogo; com o menu na frente, nenhum dos botoes das cinco telas escondidas
recebe toque.

## v6.4 (2026-09-22) — otimizacao de verdade

Medicao antes de mexer (fase 1-1-1, no Muito bom): o JS do jogo custava **1,2 ms** por
quadro (update 0,30 + render 0,95) e sobravam **19,5 ms fora dele**. Ou seja, o problema
nunca foi o desenho do jogo.

**O culpado: animacao de tela escondida.** `opacity: 0` nao para animacao CSS. Os aneis
girando do menu, a poeira, os cometas e os aneis conicos dos oito botoes continuavam sendo
repintados durante a partida inteira, atras do HUD. Provado por A/B no mesmo aparelho:

| caso | fps | p95 |
|---|---|---|
| Muito bom como estava | 50,3 | 30,9 ms |
| so desligando animacao de tela escondida | **60,2** | **18,5 ms** |
| com `display: none` nas escondidas (referencia) | 60,2 | 17,2 ms |
| tambem sem animacao no HUD | 60,3 | 18,6 ms (nao muda nada) |

A correcao e uma regra de CSS: `.screen:not(.visible)` e `.modal:not(.visible)`, e tudo
dentro delas, ficam com `animation: none`.

**Fundo base guardado numa camada.** O degrade de tela cheia e a tonalidade da fase eram
dois preenchimentos de tela inteira por quadro — em retina, 3 milhoes de pixels vezes dois.
Nenhum dos dois muda de um quadro para o outro (a tonalidade entra a 2% por quadro). Agora
vao para uma camada refeita so quando a cor anda mais de 2 tons, e o quadro faz uma copia.
Por quadro: `fillRect` caiu de 3 para 1 e os dois degrades de tela cheia sumiram.

**HUD:** as variaveis de estilo (`--p`, `--m`, `--flow`) eram reescritas a cada quadro mesmo
sem mudar de valor, o que invalida o estilo da arvore inteira do HUD. Agora so escreve quando
o valor muda.

**Niveis recalibrados.** Como o desenho custa entre 0,3 ms e 0,6 ms em qualquer nivel, o que
ainda pesa em celular e a quantidade de pixel. A resolucao volta a ser o degrau principal e
os efeitos param de ser cortados cedo demais:

| nivel | resolucao | particulas | efeitos |
|---|---|---|---|
| Muito bom | 2,00x | 1200 | tudo |
| Bom | 2,00x | 700 | tudo |
| Normal | 1,50x | 300 | sem cenario, sem 2o efeito |
| Baixo | 1,00x | 80 | so o essencial |

**Chute inicial otimista.** Antes qualquer aparelho com 4 nucleos caia no Normal. Agora:
2 nucleos ou 2 GB = Baixo; 3 nucleos ou 3 GB = Normal; 6 nucleos ou mais (com 6 GB, ou iOS,
que nao informa memoria) = Muito bom; o resto = Bom. Comecar alto custa pouco porque o vigia
desce em 3 segundos se travar — comecar baixo deixaria aparelho bom feio para sempre.

Depois de tudo, na fase 1-1-1: Muito bom 59,6 fps (p95 17,8 ms); em retina simulada,
Muito bom 57,1 e Bom 56,1; Normal e Baixo 60 fps cravados, zero quadro lento.

**v6.4.1** — o automatico guarda o nivel em que se acomodou (`qualityAuto2`). Quem jogou a
versao lenta ficou com "Baixo" gravado e continuaria no Baixo mesmo depois da otimizacao.
`HR.Perf.GEN` zera essa memoria uma vez quando o motor muda, para o aparelho ser avaliado
de novo. A escolha manual de quem mexeu no seletor e respeitada e nao e tocada.

## v6.5 (2026-09-23) — etapas 1 e 2

**Etapa 1 — o que estava sem efeito.**
- Quatro jatos (Violeta, Menta, Poente e Espectro) entraram na v6.0 sem o campo `style`,
  entao caiam no desenho generico e ficavam iguais entre si. Ganharam desenho proprio:
  fitas cruzadas, folhas que giram, leque de raios e sopros translucidos. Conferido pixel a
  pixel: 21 jatos, 21 assinaturas diferentes.
- O rastro voltava ao desenho simples no nivel Baixo (trava que eu mesmo pus na v6.2). Custa
  menos de 0,05 ms por quadro e e justamente o item que a pessoa comprou. A trava saiu:
  os 43 rastros agora desenham igual no Baixo e no Muito bom.

**Etapa 2 — o Corredor do Jato.** O jato nao atravessa mais arcos. Enquanto esta ligado nao
existe arco nenhum: abre um corredor de tres faixas (alta, do meio, baixa) e a pessoa escolhe
por onde voar. Uma faixa e sempre a rica e vai trocando, entao ha uma decisao a cada poucos
segundos. Quando o corredor fecha, a fase comeca INTEIRA — nenhum arco e gasto.

Cinco graus, subindo a cada ~8 s e parando no 5:

| grau | nome | troca de faixa | moeda comum | moeda rica | caminho |
|---|---|---|---|---|---|
| 1 | Subida | 8 passos | 2 | 5 | simples |
| 2 | Corrente | 6 | 3 | 8 | + rampas entre faixas |
| 3 | Enxame | 4 | 4 | 12 | + colunas inteiras |
| 4 | Turbilhao | 3 | 6 | 18 | rampas e colunas |
| 5 | Chuva de Ouro | 2 | 9 | 26 | as tres faixas cheias |

Da para empilhar ate **cinco** jatos no mesmo corredor. Empilhar nao acelera a subida: compra
tempo no topo. Um Jato sozinho percorre os graus 1 a 3 (~20 s); cinco Jatos dao ~1min40;
cinco Mega Jatos dao ~3min45, com quase tres minutos no grau 5.

Tecnico: `run.jetLeft` deixou de ser "arcos restantes" e passou a ser "passos de corredor
restantes", descontado por distancia — todo o resto do jogo, que so pergunta `jetLeft > 0`,
continua valendo, e a barra do HUD anda liso. Arquivos: js/fx-v65.js e js/jet-lanes.js.

**v6.5.1** — dois erros do corredor, achados no primeiro teste:

1. **A bola ficava travada.** O jato liga o piloto automatico, e o piloto mira no proximo
   arco — como o corredor nao tem arco nenhum, a mira nao existia e a bola parava. O corredor
   passou a ter controle proprio: `W`/`S` (ou as setas) trocam de faixa, e no celular um
   toquinho do analogico para cima ou para baixo faz o mesmo. A bola desliza ate a faixa com
   a mesma fisica de sempre, com um estalo e uma faisca a cada troca.
2. **Nao dava para empilhar.** O HUD escondia os botoes de jato assim que o primeiro era
   usado (`!run.jetUsed`), entao era impossivel usar o segundo. Agora eles ficam na tela
   enquanto o corredor estiver aberto, em destaque, com o selo da pilha (1/5, 2/5...) e o
   tempo que cada um acrescenta. No limite o botao fica apagado e o toque avisa.

**v6.5.2** — o corredor precisava valer a pena e precisava ser sentido:

- **Ponto, nao so moeda.** Cada moeda do corredor soma pontos conforme o grau (0,35 / 0,5 /
  0,8 / 1,2 / 2,0 por moeda rica; a comum vale um quarto). Ficar na faixa rica encadeia uma
  sequencia que multiplica ate x3, e sair dela zera — entao a escolha da faixa decide o
  dinheiro E a pontuacao. Um arco normal vale 1 ponto, entao um corredor de grau 1 a 3 rende
  mais ou menos o dobro de uma fase curta. Ao fechar, um aviso diz quanto rendeu.
- **Impulso de verdade.** Cada jato usado (inclusive o primeiro) da onda de choque, tremida,
  leque de faiscas para tras, riscos de velocidade e um ganho real de velocidade que vai
  baixando em ~1,2 s. Medido: 245 -> 956 -> 686 unidades por segundo.

**v6.5.3 a v6.5.6** — o corredor ficou jogavel de verdade:

- **W/S nao trocavam de faixa.** O caminho antigo lia `HR.Input.keys` com deteccao de borda.
  Basta um `keyup` se perder (a janela perde o foco com a tecla apertada) para a tecla ficar
  "segurada" para sempre — e a borda nunca mais dispara. Duas correcoes: o corredor passou a
  ouvir o teclado DIRETO (uma tecla, um passo, sem intermediario, aceitando `code` ou `key`),
  e `js/input.js` agora zera as teclas quando a janela perde o foco ou a aba e escondida.
- **Controle autoritativo.** Se o piloto automatico piscasse para zero por um quadro, o
  controle normal voltava e uma tecla presa ou um arrasto antigo mexiam na bola por fora,
  deixando faixa e posicao em desacordo. Dentro do corredor a faixa e a palavra final: o
  alvo e reafirmado depois que toda a fisica roda.
- **A TRILHA.** A faixa rica deixou de ser "umas moedas douradas soltas" e virou um caminho
  desenhado: uma fita de luz em tres camadas costura todas as moedas ricas a frente, com
  setinhas correndo no sentido do voo, e passa por cima dos poderes que estao chegando —
  cada um com um farol pulsando na cor dele. A pessoa ve o melhor caminho antes de chegar.
  Os poderes tambem ficaram mais frequentes (de 24/18/14/11/9 passos para 14/12/10/8/7),
  porque agora eles sao o destino da trilha, nao um bonus solto.

## v6.6 (2026-09-23) — direcao das fases e A/D no corredor

**Todo sistema comecava no mesmo eixo.** O indice de partida em `dirsFor` era
`(ri*3 + si*5 + li*2) % 4`. Com passo 2 em `li` num baralho de 4 direcoes, so dois indices
sao alcancados — e sempre do mesmo par. Cada sistema ficava preso num eixo: a galaxia 3
comecava as dez fases do sistema 1 na horizontal, a 4 comecava todas na vertical. Trocando
o passo para 1, as fases seguidas percorrem as quatro direcoes e toda sequencia de quatro
tem duas comecando de cima ou de baixo. As primeiras quatro fases de cada galaxia passaram
de (por exemplo, galaxia 3) `left, right, left, right` para `left, bottom, right, top`.
O sistema 1 da galaxia 1 continua sendo a rampa de ensino de sempre.

**A e D no corredor.** Quando a fase corre na vertical, as tres faixas ficam lado a lado na
tela — entao quem troca de faixa e A/D, nao W/S. Em vez de tratar o caso a parte, a tecla e
projetada no eixo das faixas: cada tecla vale no eixo em que ela realmente aponta, nas quatro
direcoes de fase, e a tecla do outro eixo simplesmente nao faz nada. Conferido: em fase
horizontal W/S mandam e D e ignorado; em fase vertical A/D e as setas laterais mandam e W e
ignorado.
