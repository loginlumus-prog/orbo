/* =====================================================================
   ORBO v8 — Balanceamento (sobrescrita de HR.CONFIG).

   Carregado LOGO DEPOIS de js/config.js e antes de campaign.js: tudo que
   esta aqui vale para as 1.000 fases geradas por HR.Campaign.gen.

   Nada e editado em js/config.js: quem mexe em numero de jogo mexe aqui.

   Por que cada numero mudou (auditoria de progressao/economia):
   - SPEED.span 575 -> 300 ....... v0 maximo 545 px/s (era 820): com rampa e fluxo da ~650
   - SPEED.pow 1,15 -> 1,1 ....... curva mais linear; o meio do jogo para de saltar
   - SPEED.rampSpan 0,22 -> 0,12 . a rampa dentro da fase sobe +6..+18 % (era ate +28 %)
   - SPEED.flowSpan 0,15 -> 0,10 . a sequencia acelera menos: o erro deixa de ser em cascata
   - SPEED.bossMul 1,03 -> 1,0 ... o chefe ja e mais longo e tem ondas; nao precisa ser mais rapido
   - SPEED.galaxyBossMul 1,06 -> 1,0 . idem, e era o pico de velocidade do jogo inteiro
   - SPEED.tbSpan 0,62 -> 0,38 ... intervalo entre arcos nunca abaixo de 1,02 s de base
   - SPEED.tbMin 0,72 -> 0,92 .... o piso antigo nunca valia: tbMul derrubava para 0,49 s
   - SPEED.radiusSpan (novo) 0,15 . era 0,36 fixo em gen(): abertura minima real 63 px (era 45)
   - SPEED.tbMulSpan (novo) 0,10 . era 0,22 fixo em gen(): intervalo real minimo ~0,75 s
   - SPEED.yDeltaSpan (novo) 180 . era 280 fixo: deslocamento vertical maximo 360 px (era 460)
   - SPEED.maxMods (novo) 1 ...... duas mutacoes na mesma fase era o pior empilhamento do fim
   - SPEED.visSec (novo) 1,0 ..... nevoa/escuro passam a ser tempo de reacao, nao pixels
   - RUN.ringMinR 56 -> 66 ....... piso fisico da abertura: 66 - 12 = 54 px
   - PROGRESSION.regionRank ...... 63 no fim custava 1,48 M de XP; 56 chega sozinho jogando
   - PROGRESSION.regionStars ..... 170..240 subia enquanto a estrela ficava mais dificil; agora desce
   - PROGRESSION.systemStars ..... 14..23/30 travava dentro da galaxia; agora cabe na 1a passada
   - PROGRESSION.xpRunCap 1.200 .. chefes longos com Nucleo alto ja passavam de 900
   - PROGRESSION.dailyBonusRuns 12 . 20 min/dia dao ~12 partidas: o bonus cobre o dia inteiro
   - PROGRESSION.SAFETY (novo) ... o "vento a favor": ver js/safety-v8.js
   - ECONOMY.galaxyCoinMul (novo) 0,6 . a moeda valia 1 na G1 e 1 na G10; agora a renda acompanha
   - ECONOMY.comboEvery/Coins 4/8 . combo de 5 perfeitos seguidos quase nunca saia para o casual
   - ECONOMY.exchangeCoins 650 ... alinha a gema com ~65 moedas em toda a loja nova
   - PICKUP.coins 10 -> 10+3ri ... o saco de moedas acompanha a galaxia
   - CORE.cost 162 k -> 400 k .... o Nucleo era barato demais para ser ralo de moedas
   - CORE.coinMul 0,02 -> 0,025 .. paga o ralo de volta: Nucleo 30 = +75 % de moedas
   - ECONOMY.repeatDiv (novo) 5 .. repetir pagava 1/3 da primeira vez; com o GM novo isso virou
                                   1.062 moedas por replay na G10 (16x o que a partida rendia) e
                                   fechava a loja inteira no mes 23. Um quinto poe o 100 % no mes 26
   - levelRewards ................ 60+25l nao pagava nada; 80+60l faz subir de patente valer
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const C = HR.CONFIG;

  /* ---------------- curva de dificuldade ---------------- */
  Object.assign(C.SPEED, {
    span: 300, pow: 1.1,
    rampSpan: 0.12, flowSpan: 0.10,
    bossMul: 1.0, galaxyBossMul: 1.0,
    tbSpan: 0.38, tbMin: 0.92,
    // chaves novas, lidas por campaign.js gen()/applyMech() (com queda para os valores antigos)
    radiusSpan: 0.15, tbMulSpan: 0.10, yDeltaSpan: 180, maxMods: 1, visSec: 1.0
  });
  C.RUN.ringMinR = 66;

  /* ---------------- portoes ---------------- */
  Object.assign(C.PROGRESSION, {
    regionRank:  [1, 18, 24, 30, 35, 40, 44, 47, 51, 54, 56],
    regionStars: [0, 190, 190, 195, 195, 195, 190, 185, 185, 175, 170],
    systemStars: [18, 18, 17, 17, 17, 15, 13, 13, 11, 10],
    xpRunCap: 1200,
    dailyBonusRuns: 12,
    // modo de segurança: derrotas seguidas na mesma fase viram ajuda discreta
    SAFETY: { every: 3, radius: 0.04, passNeed: 0.05, shieldAt: 2, noObsAt: 3, max: 3 }
  });

  /* ---------------- economia ---------------- */
  Object.assign(C.ECONOMY, { galaxyCoinMul: 0.6, comboEvery: 4, comboCoins: 8, exchangeCoins: 650, repeatDiv: 5 });

  // galaxia de onde a renda deve vir: a fase em jogo, ou a galaxia aberta no menu
  function riAtual() {
    const g = HR.game || (HR.UI && HR.UI.game);
    if (g && g.run && g.run.level && g.run.level.ri != null) return g.run.level.ri;
    if (HR.Rifts && HR.Rifts.current && g && g.run && g.run.mode === 'endless') return HR.Rifts.current() - 1;
    return HR.Campaign && HR.Campaign.currentRegion ? HR.Campaign.currentRegion() : 0;
  }
  HR.riAtual = riAtual;

  // PICKUP.coins vira leitura viva: game.js collect() le K.coins sem saber disso
  Object.defineProperty(C.PICKUP, 'coins', {
    configurable: true,
    get() { return 10 + 3 * riAtual(); }
  });

  /* ---------------- Nucleo ---------------- */
  C.CORE.cost = function (n) { return 200 + 40 * n * n + 120 * n; };
  C.CORE.coinMul = 0.025;

  /* ---------------- patente ---------------- */
  // xpToNext mantem a formula: a patente 56 (1,04 M de XP) chega naturalmente na G10.
  C.levelRewards = function (level) {
    const r = { coins: 80 + level * 60 };
    if (level % 2 === 0) r.gems = 5 + Math.floor(level / 4) * 2;
    else r.gems = 2;                       // premio visivel em TODA subida, nao so nas pares
    return r;
  };

  /* ---------------- ligacoes de tempo de execucao ----------------
     Rodam depois que game.js existe; quem chama e js/safety-v8.js. */
  let ligado = false;
  HR.Balance = {
    riAtual,
    ligar() {
      if (ligado || !HR.Game || !HR.Game.prototype) return;
      ligado = true;
      // moedas da partida x (1 + 0,6·galaxia): entra pelo multiplicador do Nucleo,
      // que addCoins() ja le, entao vale para arcos, itens, combos e bonus de fim.
      const origPrep = HR.Game.prototype.prepareRun;
      HR.Game.prototype.prepareRun = function (opts) {
        const r = origPrep.apply(this, arguments);
        const run = this.run, k = HR.CONFIG.ECONOMY.galaxyCoinMul || 0;
        if (run && run.core && run.mode === 'campaign' && run.level && run.level.ri != null) run.core.coinMul *= 1 + k * run.level.ri;
        return r;
      };
      // a ficha da fase mostra "primeira vez / 3" direto no HTML (ui-galaxy.js);
      // com repeatDiv o numero exibido tem de acompanhar o que e pago de verdade
      if (HR.UI && HR.UI.openLevelDetail) {
        const origDet = HR.UI.openLevelDetail;
        HR.UI.openLevelDetail = function (id) {
          const out = origDet.apply(this, arguments);
          try {
            const div = HR.CONFIG.ECONOMY.repeatDiv || 3;
            if (div !== 3 && HR.Campaign.stars(id) > 0) {
              const box = HR.U.$('#item-detail .lv-reward-vals'), lv = HR.Campaign.level(id);
              if (box && lv) box.innerHTML = '<i class="ic-coin"></i>' + HR.U.fmt(Math.round(HR.Campaign.firstClearReward(lv).coins / div));
            }
          } catch (_) { /* nada */ }
          return out;
        };
      }
    }
  };
})();
