# ORBO v3 — Plano e arquitetura ("do esboço ao jogo")

Data: 2026-09-09. Este documento é a referência da versão 3. O que existe hoje (v2) é tratado como **esboço**: a jogabilidade fica, o design de cores fica, e todo o resto (marca, layout, telas, conteúdo, música, mapa) é refeito com a intenção de parecer **feito à mão, com carinho** — cada tela com um motivo próprio, nada genérico.

---

## 1. Diagnóstico do esboço (o que estava amador)

| Problema visto | Causa | Solução v3 |
|---|---|---|
| Palavras saindo das caixas (abas da loja cortadas, títulos apertados, rótulos dos trilhos) | tamanhos fixos, sem `min-width: 0`, abas sem rolagem visível, fontes grandes demais em 390 px | tipografia com `clamp()`, abas roláveis com máscara de degradê, rótulos curtos, teste automático de vazamento (script que procura `scrollWidth > clientWidth`) |
| Layout "de kit": caixas de vidro arredondadas iguais em todas as telas | um único componente (`.card` com borda 1,5 px) repetido | sistema de componentes v4 com **silhuetas próprias** (botão com base/"degrau", cabeçalho em fita, cartões com barra de cor, nós de fase em forma de anel) e textura de grão |
| Botão JOGAR sem personalidade | pílula com gradiente | botão "artesanal": corpo em duas camadas (topo + base 5 px), brilho estático em diagonal, ícone em medalhão, pressionar afunda 3 px |
| Nome e logo em texto simples | `<h1>` com gradiente | marca **ORBO**: letreiro em que o primeiro O é um arco e o último O é a bola atravessando o arco (SVG + fonte display) |
| Mapa de fases = lista de 3 mundos com zigue-zague | pouco conteúdo (18 fases) | **Mapa da Galáxia**: 10 regiões em espiral, 100 fases, Singularidade (infinito) no centro |
| 21 conquistas, 8 modelos de missão, 1 música | conteúdo mínimo | 50 conquistas em 8 categorias, 50 missões (diárias + semanais), 12 temas musicais procedurais (1 por região + menu + singularidade) |
| Menus que não "fecham o ciclo" (habilidades só dentro da loja, conquistas escondidas em Missões) | navegação improvisada | telas dedicadas: Galáxia, Habilidades (com loadout), Missões (Diárias · Semanais), Conquistas (por categoria), Loja, Ranking, Diário, Configurações |

---

## 2. Marca

### Nome: **ORBO**
- 4 letras, pronunciável em PT/EN/ES, sem tradução, lembra "orbe" (a bola) e "órbita" (a galáxia). Fácil de digitar na loja e de lembrar.
- Evita conflito com a marca registrada "Halo" (Microsoft) — motivo prático para trocar.
- Alternativas consideradas: *Lumo* (ocupado por jogo de 2016), *Órbita* (genérico), *Halo Drift* (conflito de marca).
- Tagline: PT "Atravesse a galáxia." · EN "Cross the galaxy." · ES "Cruza la galaxia."
- Identificador do app: `com.lumus.orbo`. Save migra automaticamente do `halorush.save.v1`.

### Logotipo
- **Letreiro**: O·R·B·O em fonte display arredondada (Fredoka). O 1º "O" é um **arco inclinado** (o anel do jogo) e o último "O" é **a bola dentro de um arco** — o gesto do jogo dentro do nome. Duas cores: branco-gelo nas letras, accent na bola.
- **Ícone do app**: fundo azul-noite, arco em perspectiva (elipse) e a bola no centro com reflexo — o mesmo desenho do último "O". Máscara segura de 20 %.
- **Regra**: a bola é o logotipo. Ela aparece no ícone, no loading (quicando por 3 arcos), no cursor do mapa e no letreiro.

---

## 3. Estrutura do jogo: a Galáxia

```
                    ┌────────────── Região 1 · Berço (fora da espiral)
   espiral ────────►│  … 10 regiões, cada uma com 10 fases (a 10ª é o chefe)
                    └────────────── Região 10 · Horizonte (borda do buraco negro)
                                 ● SINGULARIDADE (centro) = modo Infinito
```

- **10 regiões × 10 fases = 100 fases.** Cada região tem cor, música, textura de fundo, mecânica principal e chefe.
- **Singularidade** (centro): o modo infinito. Sempre acessível. Ao vencer o chefe da Região 10 (Horizonte de Eventos), a Singularidade ganha o estado "dominada": +25 % de moedas no infinito e uma coroa no nó.
- **Desbloqueio**: sequencial dentro da região; a região seguinte abre ao vencer o chefe **ou** com 60 % das estrelas da região anterior (18/30) — dá motivo para voltar em fases antigas.
- **Estrelas** (por fase): ★ concluir · ★★ ≥ 40 % de perfeitos · ★★★ sem dano e todas as moedas.
- **Recompensas**: 1ª vitória = moedas + gemas; chefe = cosmético exclusivo da região; 30/30 estrelas na região = título de jogador.

### As 10 regiões

| # | Região | Cor | Mecânica que apresenta | Chefe (fase 10) | Música (tema procedural) |
|---|---|---|---|---|---|
| 1 | **Berço** | ciano `#4cf0ff` | o básico; 1ª troca de direção (cima) na fase 7 | **Guardião Pulsante** — arcos expandem/contraem | lídio calmo, 96 bpm, pads + pluck suave |
| 2 | **Maré** | azul `#5aa9ff` | oscilação vertical dos arcos | **Leviatã** — ondas sincronizadas + rajadas | dórico, 100 bpm, arpejo lento, baixo senoidal |
| 3 | **Jardim** | verde `#7cff6b` | arcos duplos, moedas, inclinação leve | **Colmeia** — enxame de arcos em pares/trios | pentatônica maior, 112 bpm, marimba |
| 4 | **Forja** | laranja `#ff9f43` | arcos menores, velocidade | **Fornalha** — arcos encolhem ao se aproximar | menor, 124 bpm, baixo serra, chimbal industrial |
| 5 | **Névoa** | lilás `#a29bfe` | névoa: arcos aparecem tarde | **Espectro** — arcos invisíveis até chegar perto | frígio, 90 bpm, pads aéreos, esparso |
| 6 | **Cristal** | rosa `#ff7ad9` | rotação/inclinação dos arcos | **Prisma** — arcos giram sem parar | lídio, 118 bpm, sinos em arpejo |
| 7 | **Tempestade** | amarelo `#ffd93d` | trocas de direção frequentes + rajadas | **Tempestade** — direção a cada 4 arcos + rajadas | menor harmônica, 132 bpm, batida forte |
| 8 | **Abismo** | índigo `#5b6cff` | escuridão: só se vê perto da bola; saltos verticais grandes | **Eclipse** — a luz pulsa; arcos somem em ciclos | eólio grave, 84 bpm, sub-baixo, drones |
| 9 | **Vórtice** | magenta `#ff5ecf` | tudo junto: oscilação + rotação + trocas | **Ciclone** — direção a cada 3 arcos + oscilação | frígio dominante, 140 bpm, arpejos rápidos |
| 10 | **Horizonte** | branco/dourado `#ffcf4a` | hipervelocidade, arcos mínimos | **Singularidade** — 5 ondas, uma por chefe anterior, e a última com tudo + escuridão | maior épico, 128 bpm, coro sintético |

### Geração das 100 fases
As fases são **geradas por função determinística** (`HR.Campaign.level('7-3')`) a partir de curvas por região: quantidade de arcos (15 → 45), velocidade (0,9× → 1,35×), raio (1,0 → 0,72), direções (padrões por fase), parâmetros da mecânica da região (oscilação, rotação, névoa, escuridão, encolhimento, duplos) e ordem de introdução. Ajustes finos ficam em `js/modes.js` (`REGIONS[i].curve`), sem editar 100 entradas à mão. Os ids continuam `r-f` (ex.: `3-7`), então as estrelas do save v2 (`1-1`…`3-6`) continuam válidas.

---

## 4. Música e som

- Motor `js/music.js` (Web Audio, 100 % sintetizado, zero arquivos): sequenciador de semicolcheias com *lookahead*, **12 temas** descritos como dados (bpm, tônica, escala, progressão, padrão de baixo, arpejo, motivo, bateria, timbres, eco). Cada região toca o seu; o menu toca o tema-assinatura; a Singularidade toca o tema adaptativo que sobe de intensidade com a fase.
- **Motivo ORBO** (4 notas: 5ª–6ª–8ª–3ª) aparece no menu, no fim de fase e no ícone sonoro de recorde — assinatura sonora.
- **Camadas por intensidade** (0–1): pad → baixo → arpejo → chimbal → caixa → oitava do motivo. No infinito a intensidade segue a fase; nas regiões segue o progresso da fase e o chefe.
- **Transições**: dois barramentos com *crossfade* de 1,5 s (menu → região, região → resultado). Ao abrir uma região no mapa, o tema dela entra baixo (prévia).
- **Configurações**: volume de música e de efeitos separados (0–100), além de ligar/desligar.

---

## 5. Sistema visual v4 ("feito à mão")

Mantém a paleta (o usuário aprovou) e troca a construção:

- **Fontes**: *Fredoka* (display: títulos, números, botões) + *Rubik* (texto). Algarismos tabulares.
- **Textura**: grão sutil (SVG `feTurbulence` em data URI, 6 % de opacidade) sobre painéis e botões — tira o aspecto "plástico de kit".
- **Botões**: duas camadas (topo + base escura de 5 px = "degrau"), borda interna clara de 1 px, brilho diagonal estático, ícone em medalhão à esquerda. Pressionar: desce 3 px. Variantes: primário (accent), jogar (verde), recompensa (dourado), gema (roxo), fantasma (contorno), ícone.
- **Painéis**: cabeçalho em **fita** (barra com recorte em chanfro nas pontas e linha-motivo de arcos), título em display, corpo com cartões de barra lateral colorida. Tudo com `min-width: 0` e ellipsis; abas roláveis com máscara.
- **Menu v4 "órbita"**: a bola no centro; 6 botões redondos **em órbita** ao redor dela (Loja, Missões, Diário à esquerda; Ranking, Galáxia, Habilidades à direita) sobre uma linha de órbita tracejada; letreiro ORBO no topo; seletor de modo + slots + JOGAR no dock inferior. Nada anima texto; a única animação é o mundo vivo no canvas.
- **Mapa da Galáxia**: canvas com braços espirais desenhados proceduralmente (cada braço na cor da região), 10 nós-nebulosa com nome, estrelas e estado (bloqueada/atual/concluída), buraco negro central com disco de acreção (Singularidade). Tocar numa região abre a **ficha da região** (arte do cabeçalho, mecânica, chefe, música em prévia, 10 nós em caminho curvo). Tocar num nó abre a ficha da fase (critérios, direções, prêmio, JOGAR).
- **HUD**: mesma estrutura v2 (aprovada), com fonte display nos números, chips com chanfro e cor da região.
- **Telas de resultado**: número grande em display, cartão de estatísticas com barra lateral, estrelas que "caem", botões artesanais.
- **Teste obrigatório**: 360×640, 390×844, 430×932 e desktop largo; script de vazamento de texto sem ocorrências.

---

## 6. Conteúdo

### 50 conquistas (8 categorias, `js/content.js`)
Voo (pontuação no infinito) · Precisão (perfeitos, combos) · Riqueza (moedas, compras) · Galáxia (fases, estrelas, chefes, regiões) · Poder (habilidades, perks, builds) · Coleção (bolas, rastros, temas) · Dedicação (partidas, dias, sequência) · Segredos (ocultas até desbloquear). Recompensa em gemas; 6 delas dão título de jogador. Tela própria com progresso por categoria e contador "12/50".

### 50 missões (`js/content.js`)
Modelos com 3 níveis de dificuldade cada, sorteados como **3 diárias** (renovam à meia-noite) e **3 semanais** (renovam na segunda, recompensa maior). Tipos: por partida (arcos, perfeitos, combo, moedas, fase, tempo, trocas de direção, sem dano, perks, habilidades) e acumuladas (totais, fases, estrelas, chefes, regiões, compras, resgates, treino). Troca de missão por vídeo (2 por dia).

### Estatísticas novas no save
`dirChanges, nearMisses, timePlayed, distance, bossesBeaten, regionsCleared, itemsBought, coinsSpent, gemsSpent, dailyClaims, bestStreak, flawlessLevels, shieldsAbsorbed, perfectRuns, weeklyDone`.

### Habilidades e perks
Ficam as 6 habilidades e 16 perks (a jogabilidade foi aprovada). Tela de Habilidades ganha o **loadout** no topo (slots grandes) e os cartões com comprar/melhorar/equipar. Ajustes de balanceamento continuam em `js/perks.js`.

---

## 7. Arquitetura de arquivos (v3)

```
index.html          telas: splash, menu (órbita), hud, pause, revive, over, levelend,
                    galaxy (mapa), region (ficha), shop, abilities, missions, achievements,
                    daily, leaderboard, settings; modais (perks, picker, levelup, ad, confirm, item)
css/style.css       tokens + sistema v4 (fontes, textura, botões, fitas, cartões, menu órbita, telas)
css/hud.css         HUD, perks, fim de fase (ajustes v4)
css/shop.css        loja (ajustes v4)
css/galaxy.css      mapa da galáxia, ficha da região, ficha da fase, conquistas, missões, habilidades
js/config.js        balanceamento (marca ORBO, economia, cosméticos, produtos, diário)
js/content.js       50 conquistas, 50 missões, títulos (dados + textos PT/EN/ES)
js/modes.js         10 regiões, gerador das 100 fases, 10 chefes, HR.Campaign
js/music.js         12 temas procedurais, camadas, crossfade
js/audio.js         efeitos sonoros + barramentos (a música sai daqui)
js/game.js          motor (parâmetros por fase, mecânicas: névoa, escuridão, encolher, enxame, eclipse, ciclone, singularidade)
js/systems.js       economia, XP, missões diárias/semanais, diário, conquistas, desbloqueios, estatísticas
js/ui.js            navegação, menu órbita, fluxo, pausa, resultado, diário, ranking, configurações
js/ui-hud.js        HUD, perks, fim de fase
js/ui-shop.js       loja
js/ui-galaxy.js     mapa da galáxia (canvas), ficha da região, ficha da fase, tela de habilidades,
                    missões e conquistas
js/brand.js         letreiro ORBO (SVG) e ícone de loading
```

---

## 8. Ordem de execução (cada passo verificado no navegador)

1. Plano (este arquivo). ✔
2. Marca ORBO: nome, letreiro, ícone, manifest/capacitor, migração do save.
3. Sistema visual v4: fontes, tokens, textura, botões, fitas, abas, cartões; menu órbita; correção de vazamento.
4. Galáxia: regiões, gerador de fases, chefes novos no motor, mapa em canvas, fichas.
5. Música: motor de temas, 12 temas, crossfade, volumes.
6. Conteúdo: 50 conquistas, 50 missões (diárias + semanais), estatísticas, telas de Conquistas/Missões/Habilidades.
7. Resultado, pausa, loading, HUD no padrão v4.
8. QA nos 4 tamanhos + script de vazamento + partida completa simulada em 3 regiões + chefe final.
9. Documentação (README, PUBLICACAO com o nome novo) e memória.

## 9. Estado

Ver seção "Estado" ao fim deste arquivo (atualizada a cada etapa concluída).

---

## Estado (2026-09-09) — implementado e verificado no navegador

Tudo o que está nas seções 2–6 foi implementado nesta rodada e testado com simulação automática (motor avançado a 60 Hz por script, piloto automático), capturas em 360×640, 390×844, 430×932 e desktop largo, e um verificador de vazamento de texto (nenhuma ocorrência fora da faixa rolável de abas das conquistas, que é mascarada de propósito).

- **Marca**: ORBO em todas as telas, ícone novo (`assets/icon.svg`), manifest/package/capacitor com `com.lumus.orbo`; save antigo do Halo Rush migra sozinho.
- **Sistema visual v4**: Fredoka + Rubik, grão, botões com degrau, fitas nos cabeçalhos, abas que cabem (loja) ou rolam com máscara (conquistas), cartões com barra lateral, menu órbita com a bola no centro e 6 botões ao redor.
- **Galáxia**: 10 regiões, 100 fases geradas (`HR.Campaign.gen`), 10 chefes com ondas (pulse, tide, swarm, shrink, blink, spin, storm, eclipse, cyclone, singularity), mecânicas de região no motor (névoa, escuridão, encolher, enxame, rajadas, oscilação sincronizada), mapa em canvas com espiral e buraco negro, ficha da região (mecânica, chefe, prêmio, música em prévia, caminho de 10 nós), ficha da fase, ficha da Singularidade; abertura de região por chefe ou 18 estrelas. Simulações: 1-1, 1-10 (3 ondas), 5-5 (névoa), 7-3 (trocas), 8-4 (escuridão) e 10-10 (5 ondas, 10 trocas de direção, Singularidade dominada, prêmio Olho + 200 gemas) sem erros.
- **Música**: `js/music.js` com 12 temas, camadas por intensidade, eco por tema, crossfade de 1,5 s, assinatura ORBO no fim de fase; volumes separados nos Ajustes.
- **Conteúdo**: 52 conquistas em 8 categorias (4 secretas, 6 dão título), 50 modelos de missão em 3 diárias + 3 semanais (alvos ×3, prêmios ×4), estatísticas novas no save, telas de Conquistas, Missões, Habilidades (loadout) funcionando.
- **Correções**: sair da pausa numa fase volta ao menu; toasts limitados a 3; dicas de loading sem repetição.

### Próximos ajustes sugeridos (após teste com pessoas)
- Sensação da bola: `BALL.spring/damping` em `js/config.js` (o usuário vai indicar ajustes de jogabilidade).
- Curvas das regiões em `js/modes.js` (`gen`): arcos por fase, velocidade, raio, intensidade das mecânicas.
- Pesos de raridade e recargas em `js/perks.js`; missões/alvos em `js/content.js`.
- Exportar `assets/icon.svg` para PNG 512/1024 (lojas) e gerar capturas de tela promocionais.

---

## v3.1 — Rodada de ideias do usuário e dos amigos (2026-09-11)

Tudo aplicado sobre o layout e o visual aprovados; nada foi refeito, só acrescentado.

1. **Linguagem de cores dos arcos** — a cor diz o que o arco faz, para o jogador antecipar: azul = reto · verde = sobe e desce (onda) · amarelo = inclinado (diagonal) · vermelho = gira · roxo = pulsa/encolhe · branco = aparece tarde · dourado = bônus de moedas · vermelho-escuro = Anomalia (imune a poderes). Cada arco recebe **um** comportamento (sorteado entre os que a fase/região liberam, com probabilidade `mix` que cresce com a dificuldade); o marcador central também muda por tipo (ponto, barra, traço diagonal, arco girando, alvo). Os tipos descobertos entram no Álbum.
2. **Errar não mata** — passar por fora do arco vira "ERROU": sem moeda, sem bônus, combo zerado. Só a **borda** mata (ou obstáculo). Para compensar: arcos mais densos (`tbStart` 1,4 s → `tbEnd` 0,7 s), curva de velocidade mais alta (265 → 880 px/s; fases 0,9× → 1,42×), **obstáculos** (detritos pequenos que giram no vazio entre arcos, sempre longe do centro dos arcos, a partir da 3ª fase do infinito e da 2ª região) e, na Galáxia, a fase só é vencida passando por **60 % dos arcos**; a 3ª estrela exige zero dano, zero erros e todas as moedas.
3. **Itens especiais no campo** — aparecem fora da linha dos arcos (o jogador sai, pega e volta): moedas ×10, escudo, ímã, câmera lenta, **estrela** (invencível 6 s: atravessa bordas e destrói obstáculos), **vida extra** e gema (raro). Ímã Turbo também atrai itens.
4. **Juice do combo** — rastro cresce e esquenta (ciano → dourado → branco), aura ao redor da bola a partir de 5 perfeitos, onda de choque e flash dourado suave nos marcos 5/10/20/35. Nada pisca texto.
5. **Infinito com build "para o infinito"** — a partir do arco 100 no modo Singularidade, entram perks **Míticos** (laranja) com 3 níveis que levam a build ao automático: *Fluxo* (piloto automático em pulsos → permanente), *Regeneração* (escudo a cada 12/8/5 arcos, limite sobe), *Intangível* (fantasma 40 % → 70 % → permanente), *Overclock* (recarga −40/−65/−90 %), *Momento* (+1/+2/+3 pontos por arco). **Escolha automática de perks** (ligável no seletor de perks ou na pausa) a partir da 4ª oferta, para não parar a cada 10 arcos. **Anomalias**: do arco 60 em diante, a cada ~75 s um arco vermelho-escuro maior aparece com aviso e vinheta; ele ignora piloto, fantasma, estrela e escudo, nasce longe da bola, e passar por fora conta como dano — exige uma ação humana a cada minuto e pouco, mas é fácil para quem está olhando. Passar dá +5 pontos e +25 moedas.
6. **Região de água (Maré)** — fundo com feixes de luz e cáusticas, bolhas subindo, arcos em estilo bolha (translúcidos, com brilho e respiração) e bolhas ao atravessar. Forja ganhou brasas subindo.
7. **Álbum** — a tela de conquistas virou um livro de coleção: Conquistas · Arcos · Itens · Chefes · Bolas · Rastros · Temas · Títulos, com silhuetas e "???" no que ainda não foi descoberto e contador geral.
8. **Galáxia mais bonita** — mapa pré-renderizado uma vez por tamanho: dois braços espirais com milhares de estrelas espalhadas, faixas de poeira, nuvens coloridas por região, bojo brilhante no centro e o buraco negro com disco de acreção girando; nós com anel de órbita e rótulos em pílula.

### Estado v3.1 (2026-09-11) — implementado e verificado
- Simulação de fase 3-6: arcos azuis/amarelos/verdes misturados, obstáculos e itens gerados, 3 estrelas. Simulação de 7 min na Singularidade com piloto: 520 arcos, 4 anomalias vencidas (a bola precisou ir até elas), perks míticos tomados (Momento, Overclock, Fluxo, Intangível, Regeneração → 6 escudos), 14 itens pegos, 1 erro, zero dano de obstáculo (o piloto segue o centro dos arcos e os obstáculos nunca nascem ali). Sem erros de console.
- Capturas: HUD com obstáculos, itens (escudo, vida), anomalia e rastro quente; região Maré com água; pausa com "Escolha automática"; mapa da galáxia pré-renderizado; Álbum (Arcos, Itens, Bolas) sem vazamento de texto.
- Ajustes futuros sugeridos: probabilidade de obstáculos (`OBSTACLE`/`obs`), frequência das anomalias (`ANOMALY.every`), chance de itens (`PICKUP.chance`), curva de velocidade (`RUN.baseSpeed/speedPerRing/maxSpeed`) e `passNeed` (60 %).

## Analógico e publicação web (2026-09-11)

- **Analógico virtual** no centro de baixo do HUD, entre as duas habilidades. É o controle padrão no celular; no computador com mouse continua "Seguir".
- O toque pode começar em qualquer ponto da tela. A origem do analógico fica onde o dedo encostou e é arrastada junto quando o dedo passa do raio, então não há salto ao encostar.
- A inclinação vira velocidade da bola, com zona morta e curva de resposta. Ao soltar, a bola para quase na hora.
- Ajustes: `CONFIG.BALL.stickSpeed`, `stickDead`, `stickCurve`, `stickLead`. A sensibilidade dos Ajustes multiplica a velocidade.
- Ajustes > Controle tem três opções: Analógico, Relativo e Seguir.
- **No ar:** https://loginlumus-prog.github.io/orbo/ (repositório público `loginlumus-prog/orbo`, GitHub Pages na branch `main`). Para atualizar: subir `?v=` no index.html e `CACHE` no sw.js, commit e push. Para tirar do ar: desligar o Pages ou apagar o repositório.
