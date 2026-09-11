# ORBO

Jogo arcade hiper-casual: uma bola flutuante atravessa arcos de luz e cruza uma galáxia de 10 regiões (100 fases, 10 chefes) com a **Singularidade** (modo infinito) no centro. A cor de cada arco diz o que ele faz (azul reto, verde onda, amarelo inclinado, vermelho gira, roxo pulsa, branco aparece tarde, dourado bônus, anomalia imune a poderes); errar um arco não mata, só a borda e os obstáculos; itens no campo (estrela, vida, escudo, ímã, lenta, moedas, gema); no infinito, perks míticos de ascensão, escolha automática de perks e anomalias que exigem a mão do jogador. HTML5 + Canvas + JavaScript puro, pronto para web/PWA e para Android/iOS via Capacitor, com anúncios (AdMob), compras (RevenueCat), missões diárias e semanais, 52 conquistas, recompensa diária, loja, habilidades, perks roguelike, níveis, ranking e 12 temas musicais procedurais.

## Rodar

Duplo clique em `index.html`, ou:

```bash
python -m http.server 8090
```

e abra http://localhost:8090.

## Documentos

- [docs/PLANO_V3.md](docs/PLANO_V3.md) — **versão atual**: marca ORBO, galáxia (regiões, gerador de fases, chefes), música, sistema visual v4, conteúdo, arquitetura e estado
- [docs/PLANO_V2.md](docs/PLANO_V2.md) — direções, perks, habilidades, controle da bola (base da jogabilidade)
- [docs/REFERENCIAS_DESIGN.md](docs/REFERENCIAS_DESIGN.md) — pesquisa de referências de HUD, loja, menu, mapa e feedback
- [docs/PLANO.md](docs/PLANO.md) — conceito original, core loop, economia
- [docs/MONETIZACAO.md](docs/MONETIZACAO.md) — todas as formas de monetizar, regras de colocação, estimativas
- [docs/PUBLICACAO.md](docs/PUBLICACAO.md) — passo a passo: web, Capacitor, AdMob, RevenueCat, ranking real, Firebase, ficha da loja, legal

## Estrutura

| Arquivo | Função |
|---|---|
| `index.html` | telas (menu órbita, HUD, galáxia, região, habilidades, missões, conquistas, loja, diário, ranking, ajustes) e canvas |
| `css/style.css` | sistema visual v4: fontes, textura, botões com degrau, fitas, abas, cartões, menu órbita, resultado, modais |
| `css/hud.css` · `css/shop.css` · `css/galaxy.css` | HUD/perks/fim de fase · loja · mapa da galáxia, região, fase, habilidades, conquistas, missões |
| `js/config.js` | balanceamento do infinito, economia, loja, anúncios, cosméticos, produtos |
| `js/content.js` | 52 conquistas (8 categorias, com títulos) e 50 modelos de missão (diárias/semanais), textos PT/EN/ES |
| `js/modes.js` | 10 regiões, gerador determinístico das 100 fases, 10 chefes, `HR.Campaign` |
| `js/music.js` | 12 temas musicais procedurais (Web Audio), camadas por intensidade, crossfade, assinatura ORBO |
| `js/audio.js` | efeitos sonoros sintetizados e barramentos de volume |
| `js/game.js` | motor: frame de direção, modos, perks, habilidades, vidas, mecânicas de região (névoa, escuridão, encolher, enxame, rajadas) e chefes por ondas |
| `js/render.js` | bola (skins procedurais), arcos, moedas, rastros, fundo, partículas |
| `js/systems.js` | economia, XP/níveis/títulos, missões diárias e semanais, diário, conquistas, desbloqueios |
| `js/perks.js` | habilidades ativas (recarga, melhoria, slots) e perks roguelike |
| `js/ui.js` | navegação, menu órbita, fluxo de partida, pausa, continuar, resultado, missões, diário, ranking, ajustes |
| `js/ui-hud.js` | HUD, botões de habilidade, avisos, escolha de perk, fim de fase |
| `js/ui-shop.js` | loja (destaque, raridade, detalhe, habilidades, gemas) |
| `js/ui-galaxy.js` | mapa da galáxia (canvas), ficha da região, ficha da fase, Singularidade, habilidades (loadout), conquistas |
| `js/brand.js` · `js/icons.js` · `js/i18n.js` | letreiro ORBO · ícones vetoriais · textos base PT/EN/ES |
| `js/storage.js` · `js/services.js` · `js/input.js` · `js/main.js` | save (migra do Halo Rush v1) · analytics/anúncios/compras/ranking/compartilhar · toque, mouse e teclado · boot e loading |
| `src/native.js` | ponte para plugins Capacitor (gerar `js/native.js` com esbuild) |

## Controles

- Celular: arraste em qualquer direção (relativo) ou "Seguir" o dedo (Ajustes). A bola vai para cima, para baixo, para frente e para trás.
- Desktop: mouse segue automaticamente; setas ou WASD; Q/E usam as habilidades; Espaço/Enter começa; Esc pausa.

## Licença

Todo o código, arte procedural e áudio são originais. Uso livre pelo dono do projeto.
