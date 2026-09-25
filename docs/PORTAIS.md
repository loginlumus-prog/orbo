# ORBO nos portais — CrazyGames, itch.io e Newgrounds

## Gerar os arquivos

```
node tools/build.js
```

Saem três pacotes em `dist/`:

| arquivo | para onde | anúncio | loja paga |
|---|---|---|---|
| `orbo-crazygames.zip` | CrazyGames | só pelo SDK da CrazyGames | não |
| `orbo-itch.zip` | itch.io | nenhum | não (apoio na página) |
| `orbo-newgrounds.zip` | Newgrounds | nenhum dentro do jogo | não |

Cada zip tem 4 arquivos (~600 KB): `index.html`, `orbo.js`, `orbo.css` e o ícone.
O jogo inteiro vira um script só, porque o portal mede o tempo até o primeiro quadro.

O que muda em cada versão fica em `js/platform.js`. O site no GitHub Pages
continua igual, só que sem a loja de mentira (os pacotes pagos davam gema de
graça depois de um "confirmar").

Os links de apoio ficam em `tools/plataformas.json`. Depois que a página do jogo
existir no itch/Newgrounds, cole o link lá e rode o `build` de novo: o botão
"Apoiar o ORBO" só aparece quando há link.

---

## CrazyGames

1. Crie a conta de desenvolvedor em https://developer.crazygames.com
2. "Submit a game" → envie `orbo-crazygames.zip`.
3. Preencha:
   - **Orientação:** retrato (o jogo já se ajusta com faixas nas laterais no PC)
   - **Controles:** toque, mouse e teclado (setas/espaço)
   - **Progress Save:** LIGUE. O save vai para a conta CrazyGames do jogador e
     acompanha ele entre aparelhos. Desligado, o jogo usa o armazenamento do navegador.
   - **Categoria:** Arcade / Casual
   - **Idiomas:** português, inglês e espanhol
4. Use o **Preview** do portal antes de mandar para revisão.

O que já está feito no código:
- `loadingStart` / `loadingStop` (a carga termina quando o menu aparece)
- `gameplayStart` / `gameplayStop` (jogando x parado, conferido 2,5 vezes por segundo)
- anúncio recompensado (reviver, dobrar moedas, gemas grátis, trocar missão/poder)
- anúncio entre partidas (a cada 3 partidas, respeitando o intervalo deles)
- som mudo durante o anúncio
- no **Lançamento Básico** o portal não serve anúncio: os botões de "assistir"
  somem sozinhos no primeiro erro `adsDisabledBasicLaunch`
- nenhum link para fora, nenhum ranking de mentira, nenhuma compra

**Pagamento:** 60 % do anúncio para você. Mínimo de €100 para sacar. Paga por
PayPal ou transferência bancária internacional, pelo Tipalti. Não paga em Pix.

---

## itch.io

1. https://itch.io/game/new
2. **Kind of project:** HTML → envie `orbo-itch.zip` e marque
   "This file will be played in the browser".
3. **Viewport:** 400 × 760, com "Mobile friendly" e "Fullscreen button" ligados.
4. **Pricing:** "No payments" ou, melhor, **"Donate"** / "Pay what you want" com
   mínimo 0. É isso que coloca o botão de apoio na página.
5. Depois de publicado, cole o link da página em `tools/plataformas.json`
   (`itch.apoio`) e gere de novo.

**Pagamento:** o dinheiro cai no saldo do itch ("Collected by itch.io, paid
later") e você saca por **PayPal** ou **Payoneer**, a partir de US$ 5. Antes do
primeiro saque o itch pede o formulário de impostos (tax interview) — sem ele, o
itch retém 30 %.

---

## Newgrounds

1. https://www.newgrounds.com/projects/games → "Create a project"
2. Envie `orbo-newgrounds.zip` como HTML5.
3. Dimensões: 400 × 760.

**Pagamento:** o Newgrounds põe anúncio em volta da página (não dentro do jogo) e
divide a receita pelo programa de revenue share. Paga por **PayPal**, a partir
de US$ 50. É o que menos rende dos três: vale pela vitrine e pelos comentários.

---

## Pix, e onde o dinheiro realmente chega

Nenhum dos três paga direto em Pix. O caminho mais simples a partir do Brasil:

- **PayPal:** recebe do itch, do Newgrounds e da CrazyGames. Do PayPal você
  transfere para a sua conta no banco em reais (o PayPal converte, com taxa).
- **Wise** (opcional, costuma ter câmbio melhor): abre uma conta em euro com IBAN
  para receber a transferência da CrazyGames, e de lá manda para o banco ou Pix.

Não é preciso criar gateway de pagamento (Stripe, Mercado Pago) para nenhum dos
três: eles cobram o jogador e repassam para você. Gateway próprio só faria
sentido para vender gemas dentro do jogo no seu próprio site — e isso pede
servidor para validar a compra, o que ainda não existe.
