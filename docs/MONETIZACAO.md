# HALO RUSH — Monetização

Objetivo: maximizar receita **sem** destruir retenção. Em hiper-casual, 70–85 % da receita vem de anúncios e 15–30 % de compras; o jogo foi construído para os dois, com uma camada de abstração (`js/services.js`) que hoje simula tudo no navegador e no app nativo usa AdMob e RevenueCat.

---

## 1. Todas as formas de monetizar (e o que já está implementado)

| # | Forma | Status | Onde | Observação |
|---|---|---|---|---|
| 1 | **Vídeo recompensado — Continuar** | ✅ | tela “CONTINUAR?” | Maior eCPM do jogo (US$ 10–40 CPM). Até 2 continuações por partida; a 2ª só com gemas |
| 2 | **Vídeo recompensado — Dobrar moedas** | ✅ | fim de partida | Só aparece se ganhou ≥ 4 moedas (evita botão inútil) |
| 3 | **Vídeo recompensado — Gemas grátis** | ✅ | loja > Gemas | 3×/dia, +10 gemas. Ensina o valor da gema |
| 4 | **Vídeo recompensado — Trocar missão** | ✅ | missões | Até 2×/dia |
| 5 | **Intersticial** | ✅ | ao sair da tela de resultado | A cada 3 partidas, mínimo 90 s entre eles, nunca nas 3 primeiras partidas da vida do jogador, nunca com Sem Anúncios/VIP |
| 6 | **Banner** | ✅ (slot) | menu principal | Só no menu, nunca durante o jogo. Adaptive banner do AdMob |
| 7 | **Remover anúncios** (compra única) | ✅ | loja > Gemas | R$ 12,90 / US$ 2,99. Remove intersticial e banner; vídeos recompensados continuam (o jogador quer) |
| 8 | **Pacote Iniciante** | ✅ | loja > Gemas | R$ 19,90: Sem anúncios + 300 gemas + bola Plasma exclusiva. Melhor conversão de 1ª compra do mercado |
| 9 | **Pacotes de gemas** (5 tamanhos) | ✅ | loja > Gemas | 100 (R$ 4,90) … 7 000 (R$ 189,90). “Melhor valor” marcado no de 550 |
| 10 | **Assinatura Clube VIP** | ✅ | loja > Gemas | R$ 14,90/mês: sem anúncios, +15 gemas e +150 moedas por dia, selo VIP no ranking. Receita recorrente |
| 11 | **Cosméticos por gemas** (premium) | ✅ | loja | Ouro, Fantasma, Arco-íris, rastros e temas premium |
| 12 | **Câmbio gemas → moedas** | ✅ | loja | Dreno de gemas para quem quer power-ups/skins de moeda |
| 13 | **Habilidades e melhorias** | ✅ | loja > Habilidades | Fantasma e Congelar custam gemas; as demais, moedas. Cada uma tem 3 níveis de melhoria (400 e 900 moedas): dreno de longo prazo |
| 13b | **Vídeo recompensado — Trocar perks** | ✅ | escolha de perk | 1 troca grátis por corrida; depois vídeo. Momento de alta intenção (o jogador quer a build certa) |
| 13c | **Campanha** | ✅ | fases | Chefes pagam gemas e itens exclusivos; a fase falhada oferece continuar por vídeo/gemas como no infinito |
| 14 | Passe de temporada | 🔜 | live-ops | 30 dias, trilha grátis + paga (R$ 19,90), skins exclusivas |
| 15 | Ofertas por tempo limitado | 🔜 | pop-up pós-partida | “Pacote do Recorde” quando bate recorde; desconto que expira em 24 h |
| 16 | Torneios/ligas | 🔜 | ranking | Entrada com gemas, prêmio em gemas; precisa backend |
| 17 | Licenciamento web | 🔜 | Poki / CrazyGames / Yandex Games | Portais pagam por exclusividade ou dividem receita de anúncios da versão web |
| 18 | Patrocínio / skins de marca | 🔜 | loja | Bola com logo de marca por campanha |
| 19 | Cross-promo | 🔜 | menu | Divulgar seu próximo jogo dentro deste (custo zero de UA) |

---

## 2. Regras de colocação (para não perder jogadores)

1. **Nunca interromper a partida.** Anúncio só em transições (fim de partida, loja).
2. **Primeiras 3 partidas sem intersticial** — o D1 depende disso.
3. **Intersticial ao sair da tela de resultado**, não na morte: o jogador já viu suas recompensas e escolheu “Jogar de novo”.
4. **Contador de 5 s no Continuar** cria urgência; o botão de vídeo é o mais chamativo (dourado); “Não, obrigado” é discreto.
5. **Sem Anúncios respeita o vídeo recompensado**: quem paga ainda pode assistir para ganhar; isso aumenta, não reduz, a receita.
6. **Preço-âncora**: o pacote de 7 000 gemas existe para o de 550 parecer barato.
7. Tudo isso é parâmetro em `CONFIG.ADS` e `CONFIG.PRODUCTS`.

---

## 3. Estimativa de receita (para planejar UA)

Premissas conservadoras, mix global com forte presença Brasil/LatAm:

| Fonte | Cálculo | Por DAU/dia |
|---|---|---|
| Intersticial | 1,8 impressões × eCPM US$ 3 | US$ 0,0054 |
| Recompensado | 1,2 impressões × eCPM US$ 12 | US$ 0,0144 |
| Banner | 8 min no menu ≈ 8 imp. × eCPM US$ 0,3 | US$ 0,0024 |
| Compras | 1,5 % conversão × ticket US$ 4 ÷ 30 dias de vida | US$ 0,002 |
| VIP | 0,3 % assinantes × US$ 4/30 | US$ 0,0004 |
| **ARPDAU** | | **≈ US$ 0,025 (LatAm) a 0,08 (EUA/UE)** |

Com D1 40 %, D7 15 %, D30 5 %, um usuário vive ~9 dias em média → **LTV ≈ US$ 0,22–0,70**. Comprar instalações Android abaixo de US$ 0,20 no Brasil é viável; iOS EUA exige LTV mais alto (ou orgânico/portais).

Alavancas para dobrar o ARPDAU: (a) 2ª oferta de continuar com vídeo em vez de gemas para não pagantes, (b) missão diária “assista 1 vídeo”, (c) passe de temporada, (d) ofertas por evento.

---

## 4. Integração técnica (resumo — passo a passo em PUBLICACAO.md)

- **Anúncios**: `HR.Ads` → `MockAdProvider` (navegador) ou `AdMobProvider` (`@capacitor-community/admob`). Trocar os IDs de teste em `js/services.js` pelos seus. Mediação (AppLovin MAX ou AdMob Mediation) quando passar de 10 k DAU: +20–40 % eCPM.
- **Compras**: `HR.IAP` → `MockIAPProvider` ou `RevenueCatProvider` (`@revenuecat/purchases-capacitor`). RevenueCat valida recibos, cuida de assinaturas e restore nas duas lojas. Entitlements: `no_ads`, `vip`.
- **Analytics**: `HR.Analytics.adapter = (ev, p) => FirebaseAnalytics.logEvent(...)`. Eventos já emitidos: `app_open`, `run_start`, `run_end`, `revive_offer/ad/gems`, `ad_*`, `iap_*`, `mission_claim`, `daily_claim`, `level_up`, `achievement`, `cosmetic_buy`, `share`, `setting`.
- **Consentimento (LGPD/GDPR)**: usar o UMP do AdMob (`AdMob.requestConsentInfo` + `showConsentForm`) antes do 1º anúncio na UE; no Brasil, política de privacidade no app e na loja.

---

## 5. Checklist de conformidade das lojas

- Política de privacidade pública (URL) — obrigatório para AdMob e para as lojas.
- Declarar “contém anúncios” e “compras no app”; classificação 13+ (evita COPPA/“família”, que restringe anúncios).
- Preços das compras vêm da loja (`RevenueCat.price`); os preços em `config.js` são só exibição de fallback.
- Botão **Restaurar compras** (obrigatório na Apple) — já existe em Configurações.
- Texto legal de assinatura (renovação automática, cancelar na loja) — já existe na aba Gemas.
