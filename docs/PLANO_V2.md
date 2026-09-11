# HALO RUSH v2 — Plano de evolução "AAA"

Objetivo desta versão: transformar um arcade simples em um jogo **premium, imersivo e profundo**, mantendo o controle de um dedo. Este plano é a referência de tudo que será construído; cada item vira um módulo separado e é verificado antes do próximo.

---

## 1. Pilares

1. **Sensação premium**: loading com identidade, HUD limpo em camadas, transições com propósito, zero elementos sobrepostos, nada animando texto.
2. **Profundidade roguelike**: cada partida é diferente — habilidades ativas com recarga + perks passivos escolhidos durante a corrida = *builds*.
3. **Variedade espacial**: os arcos mudam de direção (direita, cima, esquerda, baixo). O mundo inteiro gira na tela; o jogador precisa adaptar o gesto.
4. **Dois jeitos de jogar**: **Infinito** (farmar pontos/moedas, ranking) e **Fases** (campanha com mundos, estrelas e chefes), mais **Treino** (sem morte).
5. **Loja que vende**: apresentação de item como produto — preview grande animado, raridade, descrição, destaque do dia.

---

## 2. Modos (mapas)

| Modo | O que é | Recompensa | Ranking |
|---|---|---|---|
| **Infinito** | Corrida sem fim com fases a cada 10 arcos, mudanças de direção e ofertas de perks | Moedas, XP, missões | Sim |
| **Fases** (campanha) | 3 mundos × 6 fases. Cada fase tem número fixo de arcos, direções definidas e uma mecânica. A 6ª fase de cada mundo é um **chefe** com mecânica exclusiva e barra de vida | Estrelas (1–3), moedas, gemas, item exclusivo por mundo | Não |
| **Treino** | Infinito sem morte: passar por fora só reinicia o combo. Para aprender direções e habilidades | Metade das moedas, sem XP | Não |

### Campanha
- **Mundo 1 — Aurora**: direita, cima, baixo; chefe **Guardião Pulsante** (arcos que expandem e contraem).
- **Mundo 2 — Tempestade**: inclinação e oscilação, esquerda; chefe **Espectro** (arcos invisíveis que só aparecem perto).
- **Mundo 3 — Vazio**: tudo junto; chefe **Tempestade Final** (direção trocando a cada 4 arcos + rajadas de velocidade).
- Estrelas: 1 = concluir; 2 = ≥ 40 % de perfeitos; 3 = sem levar dano (escudo não conta) e todas as moedas.
- Desbloqueio linear; chefe libera o próximo mundo e um cosmético.

---

## 2b. Controle da bola (2026-09-05)

- **Movimento livre em 2D**: o dedo/mouse define um alvo no frame local; a bola pode ir para cima/baixo (eixo v) e para frente/trás (eixo u, entre 10 % e 62 % do comprimento de viagem). Teclado: setas ou WASD nos dois eixos.
- **Física solta**: mola + amortecimento levemente abaixo do crítico (`BALL.spring` 110, `BALL.damping` 15 em `config.js`) → a bola flutua e balança um pouco ao parar, em vez de seguir rígida. Ajuste esses dois números para mudar a sensação.
- **Troca de direção sem parar**: o mundo gira em 0,9 s enquanto o jogador continua controlando; a posição relativa da bola é preservada e o jogo segue direto, com o primeiro arco novo a 300 px de distância.
- **Fundo**: parallax bem sutil (estrelas 1–4 % da velocidade, orbes 3–7 %) e acompanhando a direção do movimento (para baixo quando os arcos vêm de cima, etc.). No menu o fundo anda a 10 px/s e arcos fantasmas passam a 30 px/s.

## 3. Direções

O mundo tem um eixo de viagem (u) e um eixo livre (v). O jogo inteiro roda nesse sistema; a tela só aplica uma rotação:

| Direção | Arcos vêm de | Bola fica | Gesto |
|---|---|---|---|
| direita | direita → esquerda | 30 % da largura | vertical |
| cima | cima → baixo | 70 % da altura | horizontal |
| esquerda | esquerda → direita | 70 % da largura | vertical |
| baixo | baixo → cima | 30 % da altura | horizontal |

Troca de direção: os arcos atuais terminam, aparece o aviso "DIREÇÃO ↓", o mundo gira suavemente 90° (0,8 s) e os próximos arcos já vêm do novo lado. No Infinito a direção muda em fases definidas; no chefe "Tempestade" muda a cada 4 arcos.

---

## 4. Habilidades ativas (botões com recarga)

Botões redondos nos cantos inferiores (polegar), com recarga radial; teclas Q/E no desktop. 1 slot no início, 2º slot no nível 6.

| Habilidade | Efeito | Duração | Recarga | Desbloqueio |
|---|---|---|---|---|
| ⏳ Câmera Lenta | tempo a 45 % | 4 s | 18 s | grátis |
| 🧲 Ímã Turbo | atrai moedas + moedas ×2 | 8 s | 20 s | 500 moedas |
| 🛡️ Pulso de Escudo | +1 escudo (máx. 3) | — | 25 s | 700 moedas, nível 2 |
| 🤖 Piloto Automático | bola segue o centro dos arcos | 3,5 s | 28 s | 900 moedas, nível 3 |
| 👻 Fantasma | atravessa a borda dos arcos | 3 s | 24 s | 60 gemas, nível 5 |
| ❄️ Congelar | arcos param de oscilar/girar | 4 s | 22 s | 80 gemas, nível 7 |

Cada habilidade pode ser **melhorada** na loja (3 níveis: −10 % recarga / +15 % duração por nível) — dreno de moedas de longo prazo.

---

## 5. Perks (roguelike, por corrida)

A cada 10 arcos o jogo pausa e oferece **3 perks** (escolha 1). Raridades: comum 60 %, raro 28 %, épico 10 %, lendário 2 % (a partir do arco 30). Reroll: 1 grátis por corrida, depois vídeo. Pular dá +15 moedas.

| Perk | Raridade | Máx. | Efeito |
|---|---|---|---|
| Escudo | comum | 3 | +1 escudo (absorve um erro) |
| Anéis Maiores | comum | 3 | +8 % raio dos arcos |
| Olho de Águia | comum | 2 | +35 % zona de perfeito |
| Recarga Rápida | comum | 3 | −20 % recarga das habilidades |
| Fôlego | comum | 2 | +35 % duração das habilidades |
| Calmaria | comum | 2 | −7 % velocidade |
| Ímã | comum | 1 | moedas atraídas |
| Vida Extra | raro | 2 | continua automaticamente ao morrer |
| Moedas Duplas | raro | 1 | ×2 moedas |
| Combo Curto | raro | 1 | bônus de combo a cada 3 perfeitos |
| Reflexo | raro | 1 | câmera lenta automática de 0,6 s perto da borda |
| Escudo de Sequência | raro | 1 | a cada 8 perfeitos seguidos, +1 escudo |
| Ganancioso | épico | 1 | +50 % moedas, −10 % raio |
| Arriscado | épico | 1 | −12 % raio, +1 ponto por arco |
| Anel Dourado | épico | 1 | a cada 10º arco vale +5 moedas |
| Segunda Chance | lendário | 1 | uma vez por corrida: o erro é desfeito |

Arquétipos que emergem: **Tanque** (escudos, vidas), **Ganancioso** (moedas), **Preciso** (zona de perfeito + combo curto), **Arriscado** (pontos), **Controle** (recarga + duração das habilidades).

---

## 6. HUD (referências: Alto's Odyssey, Subway Surfers, Archero, Vampire Survivors)

- **Topo**: pontuação central grande; abaixo, barra da fase segmentada (10 segmentos = arcos até o próximo perk); esquerda: moedas, vidas (corações) e escudos (ícones); direita: pausa.
- **Chefe**: barra de vida com nome no lugar da barra de fase.
- **Combo**: contador ao lado da pontuação com chama que cresce.
- **Inferior**: botões de habilidade nos cantos com anel de recarga, ícone e tecla; perks ativos como ícones pequenos no centro.
- **Avisos**: faixa central para "FASE 3 · ONDAS", "DIREÇÃO ↑", "ONDA 2", "VIDA −1"; vinheta azul na câmera lenta; branco no congelar; roxo no fantasma.
- **Regra**: HUD nunca cobre a zona do jogo; nada anima texto continuamente.

---

## 7. Loja

- Cabeçalho com **destaque do dia** (item grande, animado, preço).
- Abas com ícone: Bolas · Rastros · Temas · Habilidades · Gemas.
- Cartão: moldura pela raridade (comum cinza, raro azul, épico roxo, lendário dourado), preview animado grande, nome, etiqueta (NOVO, PREMIUM, NÍVEL X), botão de preço com ícone da moeda.
- Toque no cartão abre **detalhe**: preview maior, descrição, raridade, "vem com" e botão de compra/equipar.
- Habilidades: mostram duração, recarga, nível de melhoria e botão de melhorar.

---

## 8. Loading e menu

### Menu v3 (2026-09-04) — padrão "cena + trilhos"
Refeito com base em `docs/REFERENCIAS_DESIGN.md` (Alto's, Brawl Stars, Subway Surfers, Stack): o mundo do jogo vivo ao fundo (bola em idle, arcos fantasmas passando), poucas caixas, JOGAR grande sempre no mesmo lugar, funções secundárias em trilhos laterais de ícones.
- Topo: anel de nível com progresso de XP (toque abre conquistas), moedas e gemas, configurações.
- Marca em uma linha (HALO RUSH) com o título do jogador embaixo.
- Cena: trilho esquerdo (Loja, Missões, Diário), bola grande com setas de skin, trilho direito (Ranking, Fases, Habilidades). Tocar na bola = jogar.
- Linha de estatísticas sem caixa (melhor, ranking, estrelas), seletor de modo, slots de habilidade + JOGAR.
- **Regra de arte: zero emoji.** Todos os ícones vêm de `js/icons.js` (traço 2 px, cantos redondos, `currentColor`), em todas as telas: menu, HUD, perks, loja, campanha, missões, toasts. Emoji varia por sistema e entrega amadorismo.
- O canvas confere o próprio tamanho a cada quadro (`frame_` em game.js): corrige a bola deslocada em janelas largas.

- **Loading**: fundo do tema, logo estático, bola e arco desenhados no canvas com progresso real (fontes, áudio, save), dica rotativa, versão. Sem transformações 3D em CSS.
- **Menu**: vitrine (já feita) + seletor de modo (Infinito · Fases · Treino) + slots de habilidade (toque para trocar) + JOGAR. Posição da vitrine recalculada com `ResizeObserver` (corrige a bola fora do centro).

---

## 9. Arquitetura dos módulos

```
js/perks.js        habilidades ativas, perks, modificadores da corrida (dados + regras)
js/modes.js        mundos, fases e chefes (dados)
js/game.js         motor v2: sistema de direção (u,v), modos, perks, habilidades, vidas, chefes
js/ui-hud.js       HUD v2, seleção de perk, fim de fase, avisos
js/ui-shop.js      loja v2 (subagente)      css/shop.css
js/ui-campaign.js  seleção de fases (subagente)  css/campaign.css
js/ui.js           menu, telas gerais (ajustes)
```
Cada módulo novo registra seus próprios textos com `Object.assign(HR.I18N.pt, {...})` para não haver conflito.

---

## 10. Estado (2026-09-03)

Implementado e verificado no navegador com simulação automática:
- Motor v2 com direções (direita, cima, esquerda, baixo) e transição animada; perks a cada 10 arcos com raridade, reroll e pular; 6 habilidades com recarga, melhoria e 2º slot no nível 6; escudos, vidas, segunda chance, reflexo, anel dourado.
- Modos Infinito, Treino (sem morte, metade das moedas) e Campanha (3 mundos × 6 fases, 3 chefes com ondas, estrelas, recompensas e item de mundo).
- HUD v2, escolha de perk, fim de fase, loading com progresso e dicas, menu com seletor de modo e slots, loja v2 (destaque, raridade, detalhe, habilidades), seleção de fases com caminho e detalhe.
- Referências de design pesquisadas em `docs/REFERENCIAS_DESIGN.md`.

Ajustes de balanceamento recomendados após teste com pessoas reais: `perkEvery` (hoje 10), pesos de raridade em `HR.RARITY`, recargas em `HR.ABILITIES`, `rings`/`speed` das fases em `js/modes.js`.

## 11. Ordem de execução e verificação (histórico)

1. Plano (este arquivo) + pesquisa de referências (subagente) → `docs/REFERENCIAS_DESIGN.md`.
2. Dados: `perks.js`, `modes.js`, save v2.
3. Motor v2 (direções, modos, perks, habilidades, vidas, chefes) — testado com piloto automático no navegador.
4. HUD v2 + seleção de perk + fim de fase.
5. Loja v2 e seleção de fases (subagentes em paralelo) → integração.
6. Loading v2, menu (modo + slots), correção da vitrine.
7. QA em 600/700/860 px e desktop; documentação.
