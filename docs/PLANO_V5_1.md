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
