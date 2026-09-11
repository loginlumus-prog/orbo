# HALO RUSH — Plano completo do jogo

> Bola flutuante. Arcos de luz. Um dedo. Até onde você vai?

Este documento é o plano-mestre: conceito, por que ele vicia, sistemas, progressão, escrita, estrutura técnica, métricas e roadmap. A monetização detalhada está em [MONETIZACAO.md](MONETIZACAO.md) e o passo a passo para publicar em [PUBLICACAO.md](PUBLICACAO.md).

---

## 1. Conceito

| | |
|---|---|
| **Nome** | Halo Rush (curto, pronunciável em qualquer idioma, domínio/marca fáceis) |
| **Gênero** | Hiper-casual arcade infinito (“endless”), sessões de 30 s a 3 min |
| **Plataformas** | Android e iOS (prioridade), web/PWA (aquisição e viral) |
| **Público** | 13+, global, jogadores casuais que jogam em filas, transporte, intervalos |
| **Controle** | Um dedo: arraste para cima/baixo. Sem toques repetidos (diferencial vs. Flappy Bird) |
| **Orientação** | Retrato, uma mão |
| **Idiomas** | PT-BR, EN, ES (estrutura pronta para mais) |

**Pitch em uma frase:** o Flappy Bird sem a frustração do toque: você *flutua* pela tela com o dedo enquanto arcos vêm cada vez mais rápido, em ângulos cada vez mais malucos.

---

## 2. Core loop (por que é viciante)

```
Tocar JOGAR → flutuar → passar arcos → PERFEITO/COMBO → nova FASE (cor, música, mecânica)
      ↑                                                                  ↓
   Recompensa (moedas, XP, missão)  ←  Resultado/Recorde  ←  Morte → CONTINUAR?
```

Elementos de retenção embutidos no minuto a minuto:

1. **Fricção zero para começar**: o menu é uma vitrine da bola equipada dentro de um arco girando (setas trocam a skin e mostram as bloqueadas, o que puxa para a loja); “JOGAR” é o botão maior da tela; a partida começa no primeiro toque. Regra de design do menu: nenhuma animação contínua em texto (evita tremor de renderização); só o brilho do botão e a vitrine no canvas se movem.
2. **Feedback em camadas**: cada arco dá som (nota que sobe com o combo), partícula, flash e número pulsando. PERFEITO (passar pelo centro) aumenta o combo e a cada 5 perfeitos solta “ÓTIMO! +5 moedas”.
3. **Fases a cada 10 arcos**: troca de cor de fundo, nome da fase (“Tempestade”, “Giro”, “Caos”), música mais intensa e uma mecânica nova (oscilação → inclinação → rotação → arcos estreitos → duplos). O jogador sempre vê “só mais uma fase”.
4. **Velocidade progressiva**: velocidade e intervalo entre arcos apertam a cada arco; após a fase 9 o ciclo recomeça mais rápido e com arcos menores (“loops”).
5. **Quase-acerto**: a borda perdoa 55 % do raio da bola, então mortes parecem culpa do jogador (“eu quase passei”), não do jogo.
6. **Morte em câmera lenta + CONTINUAR? com contagem de 5 s**: o momento de maior desejo é exatamente onde entra o vídeo recompensado ou as gemas.
7. **Recorde**: número gigante, faixa “NOVO RECORDE!”, som especial, botão de compartilhar.

---

## 3. Sistema de fases (dificuldade)

| Fase | Nome | Novidade | Raio do arco | Intervalo* |
|---|---|---|---|---|
| 1 | Aquecimento | arcos parados, grandes | 100 % | 1,55 s |
| 2 | Fluxo | alturas mais distantes | 96 % | ×0,96 |
| 3 | Ondas | arcos sobem e descem | 93 % | ×0,95 |
| 4 | Inclinação | arcos inclinados (±27°) — **abertura efetiva menor** | 91 % | ×0,94 |
| 5 | Tempestade | inclinados + oscilando | 89 % | ×0,93 |
| 6 | Giro | inclinação muda ao vivo; arcos duplos (15 %) | 87 % | ×0,92 |
| 7 | Estreito | arcos pequenos | 74 % | ×0,92 |
| 8 | Caos | tudo junto, duplos 30 % | 80 % | ×0,90 |
| 9 | Hiper | limite; depois volta à fase 4 com −4 % raio e −5 % intervalo por loop | 78 % | ×0,88 |

\*Intervalo base cai 0,0065 s por arco (mín. 0,80 s). Velocidade: 250 px/s + 5,5 por arco (máx. 800). Tudo em `js/config.js`.

Para um humano, recordes típicos ficam entre 8–25 (iniciante), 30–60 (regular) e 100+ (dedicado). Isso cria uma curva de habilidade longa: o teto é alto o suficiente para “mestria” virar motivo de retorno.

---

## 4. Meta-jogo (por que voltar amanhã)

| Sistema | O que faz | Gancho psicológico |
|---|---|---|
| **XP e níveis** | XP = 3/arco + 2/perfeito + 6/fase. Cada nível dá moedas, gemas (níveis pares) e desbloqueia itens na loja. Títulos: Novato → Aprendiz → Piloto → Acrobata → Ás dos Arcos → Mestre → Lenda → Mito → Halo Supremo | Progresso visível mesmo em partidas ruins |
| **Recompensa diária** | 7 dias: 50, 80, 120 moedas, 8 gemas, 180, 250, e dia 7 = 300 moedas + 25 gemas. Sequência quebra se faltar um dia | Hábito diário, aversão à perda |
| **Missões diárias** | 3 por dia sorteadas de 8 modelos em 3 dificuldades (pela faixa de nível). Troca de missão via vídeo | Objetivos de curto prazo, “só mais uma partida” |
| **Conquistas** | 21 marcos (pontuação, moedas, perfeitos, fases, combos, partidas, coleção) pagam gemas | Coleção e status |
| **Loja de cosméticos** | 11 bolas, 6 rastros, 6 temas de fundo — todos procedurais (sem assets) | Expressão pessoal; gera demanda por moedas/gemas |
| **Power-ups** | Escudo, Ímã, Moedas x2, Impulso (equipados antes da partida) | Sensação de vantagem; dreno de moedas |
| **Ranking** | Local (10 melhores) + global (demonstrativo; backend em PUBLICACAO.md) | Competição, selo VIP |
| **Compartilhar** | Web Share API com texto pronto e link | Aquisição orgânica |

---

## 5. Economia (moedas e gemas)

- **Moedas** (soft): dentro dos arcos (45–55 % deles), +5 a cada 5 perfeitos seguidos, bônus de fim = pontos ÷ 4, missões, diário, nível. Ganho médio por partida de um jogador regular: 15–40.
- **Gemas** (hard): conquistas, nível par, dia 4 e 7 do diário, 3 vídeos/dia (+10 cada), compras. Usos: continuar (20 e depois 50), itens premium (40–150), câmbio 10 gemas → 600 moedas.
- Preços dos cosméticos: 200–1 600 moedas ou 40–150 gemas, escalonados por nível para o jogador sempre ver o “próximo desbloqueio”.

Regras de ouro aplicadas: o jogador consegue tudo sem pagar (justiça), mas pagar acelera; nunca vender vantagem que estrague o ranking (o multiplicador x2 é de moedas, não de pontos).

---

## 6. Escrita (a “voz” do jogo)

Decisões sobre texto e tom, aplicadas em `js/i18n.js`:

- **Curto e em maiúsculas nos momentos de ação** (JOGAR, PERFEITO, NOVO RECORDE!, CONTINUAR?). Menus em caixa normal.
- **Segunda pessoa, direta, sem ironia**: “Mantenha sua pontuação e siga em frente.”
- **Nomes de fase evocativos de uma palavra**: Aquecimento, Fluxo, Ondas, Inclinação, Tempestade, Giro, Estreito, Caos, Hiper.
- **Nomes de itens curtos e concretos** (Lava, Gelo, Galáxia, Fantasma).
- **Nada de culpa na morte**: a tela de resultado só mostra ganhos (moedas, XP, perfeitos).
- Três idiomas desde o dia 1; adicionar um idioma = copiar um bloco de 200 chaves.

### Design visual
- Tema **“neon glass”** escuro: fundo azul-profundo, cartões translúcidos, acentos ciano/rosa/dourado/roxo.
- **Uma fonte** (Rubik, pesos 400–900), números grandes e pesados para a pontuação.
- Cada moeda/gema tem cor própria em todo o app (dourado = moeda, roxo = gema, verde = ação principal, amarelo = recompensa por vídeo).
- Tudo vetorial e procedural (canvas + CSS): app leve (< 200 KB), nítido em qualquer tela, carrega em 1 s.
- Safe areas (notch), retrato travado, modo desktop centralizado como “celular”.

---

## 7. Estrutura técnica

**Stack: HTML5 Canvas + JavaScript puro, empacotado com Capacitor.**

Por quê, e não Unity/Godot/Flutter:
- Um único código roda em Android, iOS, web e PWA; a versão web serve de aquisição viral e de vitrine (portais como Poki/CrazyGames pagam por licenciamento).
- Sem engine = build de 5 MB, sem taxa por instalação, sem splash de terceiros, iteração instantânea.
- Anúncios e compras via plugins maduros (AdMob, RevenueCat) com camada de abstração já pronta.
- Um jogo 2D desta complexidade não precisa de mais.

```
index.html          telas (DOM) + canvas
css/style.css       design system (tokens, componentes, animações)
js/config.js        TODO o balanceamento: fases, economia, loja, missões, conquistas, anúncios
js/i18n.js          textos PT/EN/ES
js/storage.js       save com versão e migração (localStorage; Capacitor Preferences opcional)
js/audio.js         SFX e música sintetizados (Web Audio) — zero arquivos de som
js/input.js         toque/mouse/teclado
js/services.js      Analytics, Ads (Mock/AdMob), IAP (Mock/RevenueCat), Ranking, Share
js/systems.js       Economia, Progressão, Missões, Diário, Conquistas, Power-ups, Desbloqueios
js/render.js        bola (skins), arcos, moedas, rastros, fundo, partículas
js/game.js          loop, física, dificuldade, colisão, eventos
js/ui.js            todas as telas e modais
js/main.js          boot
manifest.json/sw.js PWA
capacitor.config.json, package.json, src/native.js   empacotamento nativo
```

Estados do jogo: `idle` (demo no menu) → `ready` → `playing` → `dying` → `revive` → `over`, com `paused`.

---

## 8. Métricas e metas (o que medir desde o dia 1)

| Métrica | Meta hiper-casual saudável | Onde vem |
|---|---|---|
| Retenção D1 / D7 / D30 | 40 % / 15 % / 6 % | analytics `app_open` |
| Sessões por dia | 4–6 | `run_start` |
| Duração da partida | 45–90 s média | `run_end.duration` |
| Partidas por sessão | 5+ | `run_start` por sessão |
| Impressões de anúncio / DAU | 3–5 (intersticial) + 1–2 (recompensado) | `ad_*` |
| Taxa de vídeo recompensado aceito | 25–40 % no continuar | `revive_offer` vs `revive_ad` |
| Conversão de compra | 1–3 % dos usuários | `iap_success` |
| ARPDAU alvo | US$ 0,05–0,15 (mix global) | receita / DAU |
| CPI (custo por instalação) | < US$ 0,30 Android / < US$ 1,00 iOS | rede de UA |

**LTV = ARPDAU × dias de vida médios.** Só escalar compra de tráfego quando LTV(D7) ≥ 50 % do CPI e a curva de retenção projetar LTV > CPI.

Todos os eventos já são registrados por `HR.Analytics.log`; basta plugar o Firebase (ver PUBLICACAO.md).

---

## 9. Roadmap

**Fase 0 — Polimento (1–2 semanas)**
- Testar em 5+ aparelhos reais (toque relativo vs. seguir, sensibilidade).
- Ajustar `RUN.tbStart`, `speedPerRing` e `forgiveness` até a mediana de pontuação do 1º dia ficar em ~8–12 (frustração baixa, teto alto).
- Ícone e capturas de tela (o `assets/icon.svg` já dá o ícone 1024 px).

**Fase 1 — Soft launch (Brasil + Filipinas/Indonésia, 2–4 semanas)**
- Publicar Android com AdMob + RevenueCat, 3 idiomas.
- Medir D1/D7, tempo de sessão, taxa de vídeo. Meta: D1 ≥ 35 %.
- A/B: frequência do intersticial (a cada 3 vs. 4 partidas) e tempo do contador de continuar (5 s vs 7 s).

**Fase 2 — Lançamento global**
- iOS, ranking global real (Supabase), Firebase Analytics + Crashlytics.
- Campanhas UA (TikTok/Meta) com vídeos verticais da fase “Caos”.
- Web em portais (Poki, CrazyGames, Yandex Games) e PWA no site próprio.

**Fase 3 — Live-ops (contínuo)**
- Eventos semanais (tema + bola exclusiva por tempo limitado), passe de temporada, torneios com gemas, novas fases (arcos que se movem na horizontal, portais, gravidade invertida), modo “Zen” sem morte para relaxar (ótimo para retenção de casuais), skins de marcas/patrocínio.

---

## 10. O que ajustar sem mexer em lógica

Tudo abaixo está em `js/config.js`:
- Dificuldade: `RUN` e `PHASES`.
- Economia: `ECONOMY`, preços em `SKINS/TRAILS/THEMES/POWERUPS`, `DAILY`, `MISSIONS`, `ACHIEVEMENTS`, `xpToNext`, `levelRewards`.
- Anúncios: `ADS` (frequência, intervalo mínimo, partidas de graça no início, gemas por vídeo).
- Compras: `PRODUCTS` (ids, conteúdo, preços de exibição).
