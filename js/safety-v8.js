/* =====================================================================
   ORBO v8 — Modo de segurança ("vento a favor").

   Quem perde a mesma fase muitas vezes seguidas recebe ajuda, em degraus,
   sem popup, sem pedir nada e sem perder estrela nenhuma:

     3 derrotas  -> arcos +4 %  · passar 55 % dos arcos ja vence
     6 derrotas  -> arcos +8 %  · 50 % · +1 escudo no comeco
     9 derrotas  -> arcos +12 % · 45 % · +1 escudo · a fase fica sem obstaculos

   A vitoria zera a conta (HR.Store.data.campaign.fails, em campaign.js).
   Nao vale para a Singularidade: la o Arconte e o Arconte.

   Tudo por EMBRULHO, no padrao de js/story-nest.js e js/costura-v8.js:
   game.js, ui.js e ui-hud.js nao sao tocados.
   Carregar DEPOIS de js/game.js e js/ui-hud.js.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const G = HR.Game && HR.Game.prototype;
  if (!G || !HR.Campaign) return;

  // as ligacoes de tempo de execucao do js/balance-v8.js (moedas por galaxia)
  // precisam de HR.Game pronto; este e o primeiro arquivo depois de game.js
  if (HR.Balance && HR.Balance.ligar) HR.Balance.ligar();

  // durante prepareRun o objeto run e recriado do zero (resetRun), e o proprio
  // prepareRun ja enche a tela de arcos e avisa o HUD. Por isso o vento e
  // calculado ANTES e fica em _helpNext ate run.help existir.
  const ajuda = g => (g && ((g.run && g.run.help) || g._helpNext)) || null;

  /* ---------------- a partida comeca sabendo do vento ---------------- */
  const origPrepare = G.prepareRun;
  G.prepareRun = function (opts) {
    opts = opts || {};
    const L = opts.level;
    let h = null;
    if ((opts.mode || 'endless') === 'campaign' && L && !L.sg && L.id) h = HR.Campaign.help(L.id);
    this._helpNext = h;
    let r;
    try { r = origPrepare.apply(this, arguments); }
    finally { this._helpNext = null; }
    const run = this.run;
    run.help = h;
    if (h) {
      if (h.shield) run.shields = Math.min(this.shieldCap(), run.shields + h.shield);
      HR.Analytics.log('safety_on', { id: L.id, step: h.step });
      // o HUD ja foi desenhado dentro de prepareRun: refaz o nome da fase e os escudos
      if (HR.UI && HR.UI.current === 'hud') { if (HR.UI.hudPhaseLabel) HR.UI.hudPhaseLabel(); if (HR.UI.hudStatus) HR.UI.hudStatus(run); }
    }
    return r;
  };

  /* ---------------- arcos maiores ----------------
     spawnRing ja multiplica o raio por (1 + mods.ringRadius). Em vez de refazer
     a conta, o vento entra e sai desse mesmo numero durante a chamada: assim o
     piso de ringMinR, o recorte da tela e o clamp do y continuam valendo, e
     recompute() (que zera mods a cada perk) nao apaga a ajuda. */
  const origSpawnRing = G.spawnRing;
  G.spawnRing = function () {
    const h = ajuda(this);
    if (!h || !h.radius || !this.run.mods) return origSpawnRing.apply(this, arguments);
    const antes = this.run.mods.ringRadius;
    this.run.mods.ringRadius = antes + h.radius;
    try { return origSpawnRing.apply(this, arguments); }
    finally { this.run.mods.ringRadius = antes; }
  };

  /* ---------------- no 3º degrau a fase fica limpa ---------------- */
  const origSpawnObstacles = G.spawnObstacles;
  G.spawnObstacles = function () {
    const h = ajuda(this);
    if (h && h.noObs) return;
    return origSpawnObstacles.apply(this, arguments);
  };

  /* ---------------- quantos arcos bastam ----------------
     game.js chama HR.Campaign.passNeed(L) sem o segundo parametro; o embrulho
     entrega o vento da partida em curso. Quem passa `help` explicito (a ficha
     da fase, por exemplo) continua mandando. */
  const origPassNeed = HR.Campaign.passNeed;
  HR.Campaign.passNeed = function (level, help) {
    if (help === undefined) {
      const g = HR.game || (HR.UI && HR.UI.game);
      const run = g && g.run;
      if (run && run.level && level && run.level.id === level.id) help = run.help || undefined;
    }
    return origPassNeed.call(this, level, help);
  };

  /* ---------------- contar derrota / zerar na vitoria ---------------- */
  if (HR.UI && HR.UI.onLevelEnd) {
    const origEnd = HR.UI.onLevelEnd;
    HR.UI.onLevelEnd = function (s) {
      try {
        if (s && s.mode === 'campaign' && s.levelId && !HR.Singularity.isLevel(s.levelId)) HR.Campaign.noteResult(s.levelId, !!s.success);
      } catch (_) { /* nada */ }
      return origEnd.apply(this, arguments);
    };
  }

  /* ---------------- o glifo no HUD ----------------
     Um simbolo pequeno ao lado do nome da fase. Sem animacao: ele so esta la. */
  if (HR.UI && HR.UI.hudPhaseLabel) {
    const origLabel = HR.UI.hudPhaseLabel;
    HR.UI.hudPhaseLabel = function () {
      const r = origLabel.apply(this, arguments);
      try {
        const lbl = HR.U.$('[data-bind="phase"]'); if (!lbl) return r;
        const h = ajuda(this.game);
        if (!h || !h.radius) return r;
        const el = HR.U.el('span', 'hud-wind', HR.icon('wind'));
        el.setAttribute('data-tip', HR.t('safety_wind'));
        el.setAttribute('data-tip-d', HR.t('safety_wind_d'));
        el.style.cssText = 'margin-left:.4em;opacity:.75;vertical-align:middle';
        lbl.appendChild(el);
      } catch (_) { /* nada */ }
      return r;
    };
  }

  /* ---------------- a linha na ficha da fase ---------------- */
  if (HR.UI && HR.UI.openLevelDetail) {
    const origDetail = HR.UI.openLevelDetail;
    HR.UI.openLevelDetail = function (id) {
      const r = origDetail.apply(this, arguments);
      try {
        const h = HR.Campaign.help(id); if (!h || !h.radius) return r;
        const host = HR.U.$('#item-detail'); if (!host) return r;
        const chips = HR.U.$('.lv-chips', host); if (!chips) return r;
        const box = HR.U.el('div', 'lv-safety');
        box.style.cssText = 'display:flex;gap:.5em;align-items:center;margin:.6em 0;opacity:.85;font-size:.92em';
        box.innerHTML = HR.icon('wind') + '<span><b>' + HR.t('safety_wind') + '</b> · ' + HR.t('safety_wind_d') + '</span>';
        chips.parentNode.insertBefore(box, chips.nextSibling);
      } catch (_) { /* nada */ }
      return r;
    };
  }
})();

/* ---------------- textos ---------------- */
Object.assign(HR.I18N.pt, {
  safety_wind: 'Vento a favor',
  safety_wind_d: 'Os arcos desta fase estão maiores e bastam menos deles para vencer.'
});
Object.assign(HR.I18N.en, {
  safety_wind: 'Tailwind',
  safety_wind_d: 'The rings in this level are bigger and fewer of them are needed to win.'
});
Object.assign(HR.I18N.es, {
  safety_wind: 'Viento a favor',
  safety_wind_d: 'Los aros de este nivel son más grandes y hacen falta menos para ganar.'
});
