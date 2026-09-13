# ORBO

Jogo arcade hiper-casual: uma bola flutuante atravessa arcos de luz e cruza **10 galáxias reais** — cada uma com **10 sistemas** de **10 fases** (1.000 fases, 100 chefes) — até **TON 618**, onde a **Singularidade** guarda **11 camadas** com um Arconte cada: passagem com Ecos da história, conversa (a resposta muda a dificuldade) e a Prova. Velocidade que cresce fase a fase, fluxo e parallax, eventos, biomas, **Égide** (proteção consumível com recarga) e **Jato** (arranque no início), 17 habilidades, 37 perks, **138 bolas** em 15 coleções (planetas, estrelas em forma de estrela, buracos negros, nebulosas…), 23 temas, 125 modelos de missão, 151 conquistas, rankings **Jornada %** e **Infinito**, temporadas. HTML5 + Canvas + JavaScript puro, pronto para web/PWA e Android/iOS via Capacitor, com anúncios (AdMob) e compras (RevenueCat). Pago é só cosmético: tudo que muda a jogabilidade se compra com moedas do jogo.

## Jogar online

https://loginlumus-prog.github.io/orbo/

## Rodar

Duplo clique em `index.html`, ou:

```bash
python -m http.server 8090
```

e abra http://localhost:8090.

## Documentos

- [docs/PLANO_V5.md](docs/PLANO_V5.md) — **versão atual (v5)**: velocidade sentida, Galáxia 10×10×10, Singularidade dos 11 Arcontes, ORBO Glyphs e dicas, 138 bolas, Égide e Jato, economia sem pagar para ganhar, rankings
- [docs/BACKEND_RANKING.md](docs/BACKEND_RANKING.md) — como ligar o ranking online (Supabase: SQL, regras, chave)
- [docs/PLANO_V4.md](docs/PLANO_V4.md) — v4: fluxo e parallax, mapa TON 618, Portal/Núcleo/contratos, eventos, biomas, temporadas
- [docs/PLANO_V3.md](docs/PLANO_V3.md) — v3/v3.1: marca ORBO, galáxia, música, sistema visual, arquitetura
- [docs/PLANO_V2.md](docs/PLANO_V2.md) — direções, perks, habilidades, controle da bola
- [docs/REFERENCIAS_DESIGN.md](docs/REFERENCIAS_DESIGN.md) — pesquisa de referências de HUD, loja, menu, mapa e feedback
- [docs/PLANO.md](docs/PLANO.md) — conceito original, core loop, economia
- [docs/MONETIZACAO.md](docs/MONETIZACAO.md) — formas de monetizar, regras de colocação, estimativas
- [docs/PUBLICACAO.md](docs/PUBLICACAO.md) — passo a passo: web, Capacitor, AdMob, RevenueCat, Firebase, ficha da loja, legal

## Estrutura

| Arquivo | Função |
|---|---|
| `index.html` | telas (menu órbita, HUD, galáxia, galáxia/sistema, Singularidade, habilidades, missões, álbum, loja, diário, ranking, ajustes) e canvas |
| `css/style.css` · `css/hud.css` · `css/shop.css` · `css/galaxy.css` · `css/v5.css` | sistema visual · HUD · loja · mapa e fichas · v5 (placas de ícone, dicas, sistemas, Égide/Jato, Singularidade, coleções, ranking) |
| `js/config.js` | balanceamento: velocidade (`SPEED`), progressão (`PROGRESSION`), economia, temas, produtos |
| `js/campaign.js` | Galáxia v5: 10 × 10 × 10 fases geradas, portas (Portal e selo do sistema), contratos, velocidade por fase |
| `js/singularity.js` | as 11 camadas: passagens com Ecos, conversa com o Arconte (caminho oculto), Provas, história PT/EN/ES |
| `js/gear.js` · `js/render-gear.js` | Égide e Jato (consumíveis e visuais) · desenho da bolha e da chama |
| `js/skins.js` · `js/render-skins.js` | 138 bolas em 15 coleções, preço duplo (moedas ou gemas) · desenho por família (planetas, estrelas, buracos negros…) |
| `js/online.js` | rankings online (Supabase REST + login anônimo) com modo demonstração |
| `js/content.js` · `js/content-v5.js` | conquistas e missões (v4 + v5), títulos |
| `js/modes.js` | as 10 galáxias (dados, chefes, textos) |
| `js/music.js` · `js/audio.js` | temas musicais procedurais · efeitos sonoros |
| `js/game.js` | motor: direções, perks, habilidades, Égide/Jato, eventos, chefes por ondas, Provas dos Arcontes |
| `js/render.js` | bola, arcos, rastros, fundo com biomas, partículas |
| `js/systems.js` · `js/perks.js` | economia, XP, missões, diário, conquistas, desbloqueios · habilidades e perks |
| `js/ui.js` · `js/ui-hud.js` · `js/ui-shop.js` · `js/ui-galaxy.js` · `js/ui-singularity.js` | navegação e ranking · HUD e fim de fase · loja · mapa, fichas e álbum · tela da Singularidade e diálogo |
| `js/icons.js` · `js/tips.js` | ORBO Glyphs (ícones duotom próprios) · dicas por hover/toque longo |
| `js/seasons.js` · `js/brand.js` · `js/i18n.js` · `js/storage.js` · `js/services.js` · `js/input.js` · `js/main.js` | temporadas · letreiro · textos base · save (migra v1→v5) · anúncios/compras · entrada · boot |

## Controles

- Celular: analógico no centro de baixo (padrão), ou arrastar de qualquer lugar (Relativo) ou "Seguir" o dedo, nos Ajustes. Égide e Jato têm botões próprios no HUD.
- Desktop: mouse segue automaticamente; setas ou WASD; Q/E habilidades; F Égide; J Jato (antes do 1º arco); Espaço/Enter começa; Esc pausa.

## Licença

Todo o código, arte procedural e áudio são originais. Uso livre pelo dono do projeto.
