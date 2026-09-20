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
