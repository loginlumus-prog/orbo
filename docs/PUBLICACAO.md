# ORBO — Guia de publicação

Do arquivo local até Google Play, App Store e web. Siga na ordem.

---

## 0. Rodar agora

- **Duplo clique em `index.html`** funciona (scripts clássicos, sem servidor).
- Servidor local (recomendado para testar PWA e áudio):

```bash
python -m http.server 8090
```

Abra http://localhost:8090. No celular na mesma rede, use o IP do PC.

Atalhos de desenvolvimento no console do navegador:
- `HR.Store.data` — o save inteiro; `HR.Store.reset()` — zera.
- `HR.Economy.addGems(500)` — testar loja. `HR.Analytics.DEBUG = true` — ver eventos.
- `HR.CONFIG` — mudar balanceamento ao vivo (ex.: `HR.CONFIG.RUN.tbStart = 1.8`).

---

## 1. Web / PWA (grátis, hoje)

1. Suba a pasta inteira em qualquer hospedagem estática: Vercel, Netlify, GitHub Pages, Cloudflare Pages.
2. Troque `SHARE_URL` em `js/config.js` pelo seu domínio.
3. O `manifest.json` + `sw.js` fazem o jogo ser “instalável” e funcionar offline. Ao publicar uma versão nova, mude `CACHE` em `sw.js` (ex.: `orbo-v1.0.1`).
4. Monetizar na web: anúncios de vídeo para jogos HTML5 (Google AdSense for Games/H5, Adinplay) ou publicar em portais (Poki, CrazyGames, Yandex Games, Game Distribution) — eles exigem o SDK deles no lugar do `MockAdProvider`; a estrutura `HR.Ads.provider` aceita qualquer implementação com `showRewarded/showInterstitial`.

---

## 2. Android e iOS com Capacitor

Pré-requisitos: Node 18+, Android Studio (Android), Xcode em um Mac (iOS).

```bash
npm install
npx cap init "ORBO" com.lumus.orbo --web-dir .
npx cap add android
npx cap add ios        # só no Mac
```

### 2.1 Plugins nativos sem bundler
O jogo não usa bundler. Para os plugins do Capacitor ficarem acessíveis, gere um único arquivo a partir de `src/native.js`:

```bash
npm install -D esbuild
npx esbuild src/native.js --bundle --format=iife --minify --outfile=js/native.js
```

Depois inclua **antes** de `js/services.js` no `index.html`:

```html
<script src="js/native.js"></script>
```

`src/native.js` expõe `window.AdMob`, `window.Purchases`, `window.Capacitor` e trava a orientação em retrato. Os provedores `AdMobProvider` e `RevenueCatProvider` em `js/services.js` são escolhidos automaticamente quando esses objetos existem.

### 2.2 Sincronizar e abrir
```bash
npx cap sync
npx cap open android   # ou ios
```
Gere o APK/AAB pelo Android Studio (Build > Generate Signed Bundle) e o IPA pelo Xcode (Product > Archive).

### 2.3 Ajustes nativos
- **Android** `android/app/src/main/AndroidManifest.xml`: dentro de `<application>` adicione
  `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-XXXX~YYYY"/>` e em `<activity>` `android:screenOrientation="portrait"`.
- **iOS** `ios/App/App/Info.plist`: `GADApplicationIdentifier` (string com o App ID), `NSUserTrackingUsageDescription`, lista `SKAdNetworkItems` (copie da doc do AdMob) e `UISupportedInterfaceOrientations` só retrato.
- Ícone: exporte `assets/icon.svg` em 1024×1024 PNG e gere os tamanhos com `npx @capacitor/assets generate`.
- Splash: fundo `#070b1a` já configurado em `capacitor.config.json`.

---

## 3. AdMob

1. Crie a conta em admob.google.com, adicione os apps (Android e iOS) e crie 3 blocos por app: **Intersticial**, **Recompensado**, **Banner adaptável**.
2. Substitua em `js/services.js` (classe `AdMobProvider`) os IDs de teste (`ca-app-pub-3940256099942544/...`) pelos seus e em `capacitor.config.json` o `AdMob.appId`.
3. Desligue `initializeForTesting: true` antes de publicar.
4. Consentimento (UE/LGPD): antes do primeiro anúncio chame `AdMob.requestConsentInfo()` e, se `isConsentFormAvailable`, `AdMob.showConsentForm()`. Configure a mensagem UMP no painel do AdMob (Privacidade e mensagens).
5. Quando passar de ~10 mil DAU, ative mediação (AppLovin, Unity Ads, ironSource) no painel do AdMob para subir o eCPM.

Frequência, intervalo e regras dos anúncios: `CONFIG.ADS` em `js/config.js`.

---

## 4. Compras (RevenueCat)

1. Crie os produtos nas lojas com **os mesmos ids** de `CONFIG.PRODUCTS`:
   `starter_pack`, `no_ads` (não consumíveis), `gems_100`, `gems_550`, `gems_1200`, `gems_2600`, `gems_7000` (consumíveis), `vip` (assinatura mensal).
2. Em app.revenuecat.com: crie o projeto, conecte Play Console (conta de serviço) e App Store Connect (chave), cadastre os produtos, crie os **entitlements** `no_ads` e `vip` e uma **offering** “default” com todos os pacotes.
3. Coloque a chave pública do RevenueCat em `RevenueCatProvider.init()` (`js/services.js`).
4. Teste com contas de teste (Play: “testadores de licença”; iOS: Sandbox).
5. O botão “Restaurar compras” e a gestão de assinatura já chamam o provedor.

---

## 5. Ranking global real (Supabase, opcional)

Tabela mínima:

```sql
create table scores (
  id bigint generated always as identity primary key,
  device_id text not null,
  name text not null,
  score int not null check (score between 0 and 5000),
  country text,
  created_at timestamptz default now()
);
create index on scores (score desc);
alter table scores enable row level security;
create policy "insert own" on scores for insert with check (true);
create policy "read top" on scores for select using (true);
```

No `HR.Leaderboard.submit`, após salvar localmente, envie `fetch(SUPABASE_URL + '/rest/v1/scores', { method: 'POST', headers: { apikey, 'Content-Type': 'application/json' }, body: JSON.stringify({ device_id, name, score }) })`, e em `global()` leia `?select=name,score,country&order=score.desc&limit=100`. Adicione um nome de jogador em Configurações (campo `HR.Store.data.name` já existe). Para evitar trapaça, valide no servidor via Edge Function um token assinado com o resumo da partida (duração × arcos coerentes com `CONFIG.RUN`).

---

## 6. Analytics e crashes (Firebase)

```bash
npm i @capacitor-firebase/analytics @capacitor-firebase/crashlytics
```
Em `src/native.js` importe `FirebaseAnalytics` e, no `main.js` após o boot:
```js
HR.Analytics.adapter = (ev, p) => window.FirebaseAnalytics && window.FirebaseAnalytics.logEvent({ name: ev, params: p });
```
Painéis essenciais: retenção D1/D7/D30, funil `run_start → run_end → revive_offer → revive_ad`, receita por `iap_success` e `ad_rewarded_done`.

---

## 7. Ficha da loja (copie e adapte)

**Título:** ORBO — Bola e Arcos
**Curta (80):** Flutue com a bola e atravesse os arcos de luz. Até onde você vai?
**Descrição:**
> Um dedo. Uma bola. Infinitos arcos.
> Arraste para flutuar e atravesse arcos que ficam mais rápidos, mais inclinados e mais malucos a cada fase. Faça PERFEITOS, emende combos e bata seu recorde.
> • Controle simples: só arrastar, sem toques repetidos
> • 9 fases com mecânicas novas e visual que muda de cor
> • 11 bolas, rastros e temas para colecionar
> • Missões diárias, recompensa diária e conquistas
> • Ranking global e níveis com títulos
> • Leve, rápido e funciona offline
> Quantos arcos você consegue?

Palavras-chave: arcade, bola, arcos, flappy, reflexo, casual, infinito, viciante, um toque, offline.
Capturas: 1) fase Caos com combo, 2) NOVO RECORDE, 3) loja de bolas, 4) missões, 5) ranking. Vídeo de 15 s vertical mostrando a troca de fase.

Classificação: 12+/Teen (anúncios e compras). Segurança de dados (Play): coleta de identificadores para anúncios e analytics; sem contas; dados não compartilhados fora de anúncios.

---

## 8. Legal

- **Política de privacidade** (obrigatória): hospede em `SHARE_URL/privacidade` (link já existe em Configurações). Deve citar AdMob, RevenueCat, Firebase, dados coletados, LGPD/GDPR, contato.
- **Termos de uso**: `SHARE_URL/termos` (gemas sem reembolso após uso, assinatura renovável, etc.).
- Não direcionar a crianças (< 13); não usar personagens ou músicas de terceiros (tudo aqui é original e procedural).

---

## 9. Checklist final antes de enviar

- [ ] IDs reais de AdMob e `initializeForTesting` desligado
- [ ] Chave RevenueCat e produtos criados nas duas lojas
- [ ] `SHARE_URL`, política de privacidade e termos publicados
- [ ] `VERSION` em `config.js`, `CACHE` em `sw.js` e `versionCode/build` nativos incrementados
- [ ] Testado em aparelho real: toque, áudio após primeiro toque, safe area, rotação travada
- [ ] Testado: continuar por vídeo, dobrar moedas, compra e restauração em sandbox
- [ ] Ícone 1024, capturas, vídeo, ficha em PT/EN/ES
