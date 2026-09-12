# ORBO v4 — Plano: ritmo, eventos, biomas, progressão longa e conteúdo

Data: 2026-09-12. Base: v3.1 + analógico (docs/PLANO_V3.md). Regra de ouro mantida: tudo SOMA ao layout e à jogabilidade aprovados; nada é refeito, nenhum efeito "feio".

## 0. Diagnóstico (o que o jogo tem e o que falta)

| Área | Hoje | Problema apontado | v4 |
|---|---|---|---|
| Fundo | gradiente + estrelas com parallax 1–4 % | estático; sensação de "os arcos vêm em cima de mim" | 3 camadas de parallax (poeira, estrias, estrelas) que aceleram com o **Fluxo** (sequência) e voltam ao normal quando o ritmo quebra |
| Itens | sempre fora da linha | raramente no centro | 40 % dos itens nascem **no centro do arco** (sem moeda) |
| Galáxia | mapa pré-renderizado, buraco negro simples | "dá pra melhorar" | buraco negro com **lente gravitacional**, disco de acreção com Doppler, anel de fótons, partículas caindo |
| Progressão | 100 fases em 1–2 h; região abre com chefe OU 18 estrelas | rápido demais | **Portal** por região: chefe + estrelas + patente (XP) + Núcleo (moedas) + 3 contratos; ~3 dias/região p/ quem joga muito, 7–9 dias casual |
| Dificuldade | curva suave (velocidade ×0,90→×1,42) | fácil, regiões parecidas | curva mais forte (×0,90→×1,52), arcos até 36 % menores, **modificadores** de fase a partir da região 3, eventos nas fases e nos chefes |
| Dinâmica na run | só passar/desviar | monotonia | **5 eventos**: Asteroides, Dobra, Sentinela, Bonança, Guardião; chefes ganham um evento entre ondas |
| Biomas | água e brasas | só 2 regiões "vivas" | 10 biomas (fundo + estilo de arco) e o infinito passa por todos, fase a fase |
| Conteúdo | 11 bolas, 6 rastros, 6 temas, 6 poderes, 21 perks, 53 missões, 58 conquistas | pouco para meses | +12 bolas (2 pagas, 4 sazonais), +4 rastros, +5 temas, +3 poderes, +6 perks, +22 missões, +24 conquistas, Núcleo com 30 níveis, 50 contratos |
| Sazonal | nada | pedido | **Temporadas** por data: Halloween, Natal, Carnaval, Festa Junina, Verão — itens exclusivos, missão extra, enfeites no menu |

## 1. Fluxo (ritmo) e paralaxe

- `run.flow` 0..1: +0,045 por arco passado (+0,07 se PERFEITO); **zera** em erro (fora), dano, escudo consumido e anomalia perdida. `run.flowV` é a versão suavizada (sobe em ~1,5 s, cai em ~0,4 s: "quebrou o ritmo").
- Fundo: velocidade do parallax = velocidade do mundo × (0,6 + 2,6·flowV). Camadas novas em `render.js`:
  - **poeira** (40 pontos, parallax 0,22) — vira traço curto quando acelera;
  - **estrias** (18 linhas finas, parallax 0,6) — só aparecem com flow > 0,25, alfa cresce até 0,35 (efeito "dobra");
  - orbes/nebulosas e estrelas antigas ganham parallax ×(1 + 2·flowV).
- Jogabilidade: velocidade dos arcos +8 % no fluxo máximo (`RUN.flowSpeedMul`). Ao quebrar, volta — funciona como "elástico" a favor de quem errou.
- Música: intensidade ganha +0,2·flowV. HUD: `--flow` no `#screen-hud` (combo esquenta).
- Estatísticas novas: `flowMax` (melhor sequência de fluxo), `flowTime` (segundos em fluxo máximo).

## 2. Itens no centro do arco

`PICKUP.centerChance = 0.4`: quando o arco sorteado não tem moeda, o item nasce no centro e acompanha a oscilação do arco. Chance geral sobe de 0,16 para 0,20. Contadores `centerPickups` (missões/conquistas).

## 3. Buraco negro (mapa)

Desenho por quadro sobre a imagem cacheada: 3 anéis de lente (a própria imagem redesenhada com zoom 1,06/1,14/1,25 e rotação lenta, recortada em coroas), disco de acreção em dois planos (atrás/frente da sombra) com gradiente branco→laranja→vermelho e **beaming Doppler** (lado que vem na nossa direção mais brilhante), 5 manchas quentes girando, anel de fótons fino, sombra com borda azulada, 26 partículas em espiral caindo, brilho externo pulsando. Nós das regiões continuam iguais.

## 4. Progressão longa (Portal)

### 4.1 Portas da região `ri` (todas precisam estar abertas)

| Porta | Regra | Fonte de tempo |
|---|---|---|
| Chefe | chefe da região anterior vencido | habilidade |
| Estrelas | região anterior com ≥ `REGION_STARS[ri]` (14, 16, 18, 20, 20, 22, 22, 24, 24) | repetir fases com precisão |
| Patente | nível do jogador ≥ `REGION_RANK[ri]` (1, 3, 6, 10, 14, 18, 22, 26, 30, 34) | XP acumulado (limitado a 900 por partida) |
| Núcleo | nível do Núcleo ≥ `REGION_CORE[ri]` (0, 2, 4, 6, 9, 12, 15, 18, 22, 26) | moedas |
| Contratos | ≥ 3 dos 5 contratos da região anterior | objetivos de replay |

Calibração (XP por partida ≈ 200–600; 900 no máximo): patente 34 ≈ 230 mil XP → quem joga ~40 partidas/dia chega em ~23 dias; 10 partidas/dia em ~75 dias. Núcleo 26 ≈ 100 mil moedas com a renda crescendo com o próprio Núcleo (+2 %/nível). As portas correm em paralelo, então o gargalo real é a patente; ajuste fino em `CONFIG.PROGRESSION`.

### 4.2 Núcleo da bola (30 níveis, moedas)

Custo `120 + 16·n² + 50·n`. Bônus por nível: +2 % moedas, +0,8 % perdão de borda, +0,5 % zona de PERFEITO, +1 % XP; marcos: nível 5/15/25 = +1 escudo máximo; nível 10 = começa com 1 escudo; nível 20 = 1 vida extra por partida; nível 30 = itens +50 %. Tela: seção "Núcleo" no topo de Poderes; também no detalhe da fase quando falta Núcleo.

### 4.3 Contratos (5 por região, gerados)

Modelos: perfeitos na região, fases concluídas na região, moedas na região, itens na região, fases sem dano, eventos vencidos, arcos sem erro, chefe sem dano. Alvos escalam com a região. Prêmio: moedas + gemas + 250 XP cada, entregues automaticamente ao fim da partida (toast). Listados na ficha da região com barra de progresso. Estatísticas por região em `campaign.rstats[ri]`.

### 4.4 Dificuldade das fases

`gen()`: velocidade `0,90 + g·0,62`, raio `1 − g·0,36`, tempo entre arcos `1 − g·0,22`, salto vertical `180 + g·280`, mistura de tipos `0,35 + g·0,55`, obstáculos `0,15 + g·0,45`. **Modificadores** (a partir da região 3, determinísticos por fase): Estreito (raio ×0,9), Denso (tempo ×0,9), Vento (inclinação +0,25), Pares (arcos duplos +0,15), Rajadas (velocidade em surtos). Aparecem como chips na ficha da fase.

## 5. Eventos na partida

`CONFIG.EVENTS`. No infinito: primeiro no arco 18, depois a cada 22–30 arcos (nunca repete o anterior, nunca junto com anomalia). Na Galáxia: gerados em `gen()` (fases 3, 6, 9 de cada região a partir da 2ª; duas por fase da região 4 em diante). Chefes: um evento **entre as ondas** (pulse→Asteroides, tide→Dobra, swarm→Asteroides, shrink→Guardião, blink→Sentinela, spin→Dobra, storm→Asteroides, eclipse→Sentinela, cyclone→Guardião, singularity→Sentinela/Asteroides/Dobra/Guardião).

| Evento | O que muda | Vitória |
|---|---|---|
| **Asteroides** (9 s) | sem arcos; rochas cruzam a tela com deriva; moedas soltas | sobreviver: +15 moedas, +3 pontos |
| **Dobra** (8 s) | velocidade ×1,65, arcos 35 % maiores, moedas ×2, sem obstáculos, fluxo no máximo | arcos passados valem normal |
| **Sentinela** (14 s) | uma sentinela persegue a altura da bola e atira a cada 1,4 s; os arcos continuam | sobreviver: +20 moedas, +5 pontos |
| **Bonança** (7 s) | sem arcos; chuva de moedas em ondas; ímã ampliado | tudo que pegar |
| **Guardião** | 3 arcos gigantes que encolhem (×2,0 → ×1,6 → ×1,25) e oscilam | passar os 3: +30 moedas, +10 pontos |

Aviso antes ("ASTEROIDES À FRENTE"), faixa no HUD durante, resumo ao fim. Nas fases da Galáxia os arcos de evento não contam para o total da fase.

## 6. Biomas (10) — fundo + estilo de arco

| Região | fx | Fundo | Arco |
|---|---|---|---|
| Berço | aurora | fitas de aurora | brilho duplo suave |
| Maré | water | feixes + cáusticas (v3.1) | bolha |
| Jardim | garden | pólen/folhas subindo | folhas nas bordas |
| Forja | ember | brasas (v3.1) | metal incandescente com rachaduras |
| Névoa | mist | bancos de névoa deslizando | contorno difuso |
| Cristal | crystal | estilhaços facetados girando | arco facetado |
| Tempestade | storm | chuva diagonal + relâmpago discreto | contorno elétrico tremido |
| Abismo | abyss | pontos bioluminescentes | anel pontilhado que pulsa |
| Vórtice | vortex | faixas espirais lentas | traços girando |
| Horizonte | horizon | estrelas convergindo ao centro | anel duplo (lente) |

O infinito (Singularidade) atravessa todos: cada fase usa um bioma (`PHASES[i].fx`).

## 7. Conteúdo

- **Bolas** (+12): Lua, Sol, Abelha, Bola 8, Saturno, Vazio, Pérola, Tóxica; sazonais Abóbora (Halloween), Bengala (Natal), Balão (Junina), Confete (Carnaval); **pagas** Cometa e Dragão (R$ 4,90 / US$ 0,99 cada) e Pacote Cometa+Dragão+200 gemas (R$ 9,90). Novos padrões em `render.js`.
- **Rastros** (+4): Cometa, Pétalas, Relâmpago, Neve (sazonal).
- **Temas** (+5): Floresta, Inferno, Prisma, Halloween, Natal.
- **Poderes** (+3): Pulso (onda que destrói obstáculos/tiros e puxa itens), Lente (arcos 40 % maiores por 5 s), Eco (pontos e moedas ×2 por 6 s).
- **Perks** (+6): Guardião do Fluxo (raro), Catador (comum), Núcleo de Dobra (épico), Casco (comum), Sortudo (raro), Tempo (épico).
- **Missões** (+22): fluxo, itens no centro, eventos, guardiões, asteroides destruídos, contratos, Núcleo, sentinelas, dobras, biomas.
- **Conquistas** (+24): mesmas famílias + temporadas + regiões visitadas + Núcleo.
- **Preço mínimo real**: App Store tier 1 ≈ R$ 4,90–5,90; Google Play permite ~R$ 1,00 mas para manter o mesmo preço nas duas lojas fica R$ 4,90. Líquido ≈ R$ 3,40 (30 %) ou R$ 4,16 (15 % no programa de pequenas empresas). Custos fixos: Google US$ 25 uma vez, Apple US$ 99/ano.

## 8. Temporadas

`HR.SEASONS` com janelas por data (mês-dia): Halloween 15/10–02/11, Natal 08/12–06/01, Carnaval 10/02–25/02, Junina 10/06–30/06, Verão 01/01–31/01 (praia). Cada uma: cor, itens exclusivos (`cur: 'season'`, compra com moedas/gemas só na janela; o que foi comprado fica), 1 missão diária extra, enfeites no menu (neve, morcegos, confete, balões) e faixa "Temporada até dd/mm". `HR.SEASON_FORCE = 'natal'` para testar.

## 9. Outros pontos (não pedidos, mas melhoram)

- Dicas/tutorial atualizados (regra do Portal, eventos, fluxo).
- Fim de fase mostra contratos avançados; ficha da fase mostra modificadores e evento.
- Save v4 com migração (Núcleo, contratos, rstats, temporadas, fluxo).
- Ranking real continua pendente de backend (docs/PUBLICACAO.md).
- Sugestão futura: Passe da Galáxia (trilha grátis + paga por temporada) e "Desafio diário" (fase gerada do dia com ranking).

## 10. Ordem de execução

1. Fluxo + parallax + itens no centro + biomas por fase no infinito (config, game, render).
2. Buraco negro (ui-galaxy).
3. Biomas (render fundo/arcos, modes).
4. Progressão: Portal, Núcleo, contratos, curva, modificadores (modes, systems, storage, ui-galaxy, ui-shop, i18n).
5. Eventos + chefes (game, render, ui-hud, config).
6. Conteúdo (config, render, perks, content).
7. Temporadas (seasons.js, ui, shop, render).
8. Verificação por simulação, capturas, docs, publicação.

## Estado v4 (2026-09-12) — implementado e verificado

- **Feito**: fluxo + parallax em 3 camadas (poeira, estrias, orbes/estrelas aceleradas) com quebra de ritmo; itens no centro do arco (40 %); mapa refeito em tela inteira (TON 618 com lente/disco/partículas, 10 galáxias reais como mini espirais ligadas por um caminho serpenteante até o centro; rótulos com nome real + tema + estrelas/Portal); ficha da galáxia com cabeçalho animado (motor de fundo do jogo + galáxia + arco + bola), curiosidade astronômica, Portal (5 portas), contratos, caminho de fases com ligações curvas; Núcleo (30 níveis) na tela de Poderes; curva de dificuldade mais forte + modificadores; 5 eventos (Asteroides, Dobra, Sentinela, Bonança, Guardião) no infinito e nas fases; chefes com evento entre ondas; 10 biomas (fundo + arco) e o infinito passando por eles; sinalização de poderes (arcos se despedaçam com estrela/fantasma, orbes girando por poder, chips com barra no HUD, piscar + ticks no fim); +15 bolas (2 pagas R$ 4,90, pacote R$ 9,90, 5 sazonais), +5 rastros, +5 temas, +3 poderes (Pulso, Lente, Eco), +6 perks, +22 missões (uma sazonal), +30 conquistas com 7 títulos novos; temporadas (Verão, Carnaval, Junina, Halloween, Natal) com chip no menu, enfeites no fundo, seção na loja e missão extra.
- **Verificado por simulação**: fluxo sobe a 1,0 e zera ao errar; item no centro pego; 4 eventos no infinito e nas fases 7-9, 2-10 e 10-10 (Sentinela, Asteroides, Dobra, Guardião) com a fase terminando corretamente e arcos de evento fora da contagem; Portal bloqueando Maré com 4/5 (faltando contratos); contratos concluídos automaticamente; Núcleo 26 com bônus; Pulso destrói e puxa, Lente cresce arcos ×1,4, Eco dobra pontos; 26 bolas e 11 rastros desenham sem erro; temporada forçada (`HR.SEASON_FORCE = 'halloween'`) mostra chip, missão extra e seção da loja. Zero erros de console na versão final.
- **Ajustes recomendados após teste humano**: `CONFIG.PROGRESSION` (patentes/estrelas/Núcleo por região), `CONFIG.CORE.cost`, `EVENTS.sentinel.shot/fire`, `EVENT.every`, `FLOW.perPass`, `PICKUP.centerChance`.
