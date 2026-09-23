/* =====================================================================
   ORBO v5.3: HUD dos poderes com começo, "acabando" e fim bem claros.
   Recebe 'powerfx' do jogo (js/game-v53.js): aviso grande com ícone ao começar, aviso que
   pulsa com a contagem nos últimos segundos e aviso de fim. Chips mostram os segundos restantes.
   ===================================================================== */
(function () {
  const $ = (s, r) => HR.U.$(s, r);
  const SUB = { starT: 'pw_sub_star', ghostT: 'pw_sub_ghost', cometT: 'pw_sub_comet', autoT: 'pw_sub_auto', aegisT: 'pw_sub_aegis', phoenixT: 'pw_sub_phoenix', magnetT: 'pw_sub_magnet' };
  let call = null, hideT = null, endingK = null, game = null;

  function ensure() {
    if (call && call.isConnected) return call;
    const hud = $('#screen-hud'); if (!hud) return null;
    call = HR.U.el('div', 'pw-call', '<span class="pc-ic"></span><span class="pc-main"><b></b><small></small></span><span class="pc-sec"></span>');
    hud.appendChild(call);
    placeCall(call);
    return call;
  }
  // o aviso fica logo abaixo dos círculos de tempo (nunca por cima deles)
  function placeCall(el) {
    const host = $('#hud-powers'); if (!el || !host) return;
    el.style.top = '';
    const base = parseFloat(getComputedStyle(el).top) || 0;
    if (host.childElementCount) el.style.top = Math.max(base, host.offsetTop + host.offsetHeight + 12) + 'px';
  }

  // avisos rápidos durante a partida vão para o canto direito (não cobrem pontuação nem fase)
  const origToast = HR.UI.toast;
  HR.UI.toast = function () {
    const th = document.getElementById('toast-host');
    if (th) th.classList.toggle('ingame', this.current === 'hud');
    return origToast.apply(this, arguments);
  };

  function powerCall(info) {
    // v5.5: o cartão de texto saiu. O ícone com o tempo no canto, o anel na bola e a contagem
    // 3-2-1 já dizem tudo; deixe HR.POWER_CALL = true para trazer o cartão de volta.
    if (!HR.POWER_CALL) return;
    const d = info && info.def; if (!d) return;
    const el = ensure(); if (!el) return;
    const run = game && game.run;
    // um "acabando" importante não é tapado por aviso de poder secundário
    if (endingK && endingK !== d.k && run && run[endingK] > 0 && !d.warn) return;
    let sub;
    if (info.phase === 'start') sub = (SUB[d.k] ? HR.t(SUB[d.k]) + ' · ' : '') + Math.max(1, Math.round(info.T)) + ' s';
    else if (info.phase === 'ending') sub = HR.t('pw_ending');
    else sub = HR.t(d.k === 'autoT' ? 'pw_end_auto' : d.warn ? 'pw_end_careful' : 'pw_end');
    el.style.setProperty('--c', d.color);
    el.querySelector('.pc-ic').innerHTML = HR.icon(d.icon);
    el.querySelector('b').textContent = HR.t(d.name);
    el.querySelector('small').textContent = sub;
    el.querySelector('.pc-sec').textContent = info.phase === 'ending' ? String(Math.ceil(info.T)) : '';
    el.className = 'pw-call ' + info.phase + (d.warn ? ' warn' : '');
    void el.offsetWidth; el.classList.add('show');
    clearTimeout(hideT);
    if (info.phase === 'ending') endingK = d.k;
    else {
      if (endingK === d.k) endingK = null;
      hideT = setTimeout(() => { if (call && !call.classList.contains('ending')) call.classList.remove('show'); }, info.phase === 'end' ? 1600 : 1800);
    }
    // a Égide já avisava no centro da tela; fica só um aviso
    if (info.phase === 'end' && d.k === 'aegisT') { const bn = $('#hud-banner'); if (bn) bn.classList.remove('show'); }
  }

  const origInit = HR.UI.hudInit;
  HR.UI.hudInit = function (g) {
    const r = origInit.apply(this, arguments);
    game = g; g.on('powerfx', powerCall);
    return r;
  };

  // chips: ícone, nome, barra e segundos restantes; pulsam nos últimos 2,5 s
  // As referências de cada chip ficam guardadas em `chips`: procurar a barra e os
  // segundos por querySelector, por poder, a cada quadro, era metade do custo do HUD.
  let chips = [];
  HR.UI.hudPowers = function (run) {
    const host = $('#hud-powers'); if (!host) return;
    const active = this.POWERS.filter(p => run[p[0]] > 0 && !(p[0] === 'autoT' && (run.anomalyActive || run.autoT < 0.2)));
    const key = active.map(p => p[0]).join(',');
    if (host.dataset.key !== key) {
      host.dataset.key = key; host.innerHTML = ''; chips = [];
      active.forEach(p => {
        const el = HR.U.el('span', 'hud-power'); el.dataset.k = p[0]; el.style.setProperty('--c', p[2]);
        el.innerHTML = '<span class="hp-ic">' + HR.icon(p[1]) + '</span><span class="hp-name">' + HR.t(p[3]) + '</span><i class="hp-bar"><span></span></i><b class="hp-sec"></b>';
        host.appendChild(el); this.powerMax[p[0]] = run[p[0]];
        chips.push({ k: p[0], el, bar: el.querySelector('.hp-bar span'), sec: el.querySelector('.hp-sec') });
      });
      if (call) placeCall(call);
    }
    chips.forEach(c => {
      const v = run[c.k], mx = Math.max(this.powerMax[c.k] || 0, v); this.powerMax[c.k] = mx;
      const w = (v / mx * 100).toFixed(0) + '%';
      if (c.bar._w !== w) { c.bar._w = w; c.bar.style.width = w; }
      HR.UI.setVar(c.el, '--p', (v / mx).toFixed(3));
      const txt = String(Math.ceil(v)); if (c.sec.textContent !== txt) c.sec.textContent = txt;
      c.el.classList.toggle('ending', c.k === 'jetLeft' ? v <= 2 : v < 2.5);
    });
    // aviso "acabando": atualiza a contagem, volta se outro aviso o tapou, some quando acaba
    if (call && endingK) {
      const v = run[endingK] || 0;
      if (v <= 0) { if (call.classList.contains('ending')) call.classList.remove('show'); endingK = null; }
      else if (call.classList.contains('ending')) { const s = call.querySelector('.pc-sec'), tx = String(Math.ceil(v)); if (s.textContent !== tx) s.textContent = tx; }
      else if (!call.classList.contains('show')) { const d = HR.powerDefs().find(x => x.k === endingK); if (d) powerCall({ phase: 'ending', def: d, T: v }); }
    }
  };

  Object.assign(HR.I18N.pt, { pw_sub_star: 'Invencível', pw_sub_ghost: 'Intangível', pw_sub_comet: 'Invencível e veloz', pw_sub_auto: 'A bola se guia sozinha', pw_sub_aegis: 'Protegido', pw_sub_phoenix: 'Renasce se cair', pw_sub_magnet: 'Puxa as moedas', pw_ending: 'Acabando', pw_end: 'Acabou', pw_end_careful: 'Acabou · atenção', pw_end_auto: 'Acabou · o controle é seu' });
  Object.assign(HR.I18N.en, { pw_sub_star: 'Invincible', pw_sub_ghost: 'Intangible', pw_sub_comet: 'Invincible and fast', pw_sub_auto: 'The ball steers itself', pw_sub_aegis: 'Protected', pw_sub_phoenix: 'Revives if you fall', pw_sub_magnet: 'Pulls coins', pw_ending: 'Ending', pw_end: 'Over', pw_end_careful: 'Over · watch out', pw_end_auto: 'Over · you have control' });
  Object.assign(HR.I18N.es, { pw_sub_star: 'Invencible', pw_sub_ghost: 'Intangible', pw_sub_comet: 'Invencible y veloz', pw_sub_auto: 'La bola se guía sola', pw_sub_aegis: 'Protegido', pw_sub_phoenix: 'Renace si caes', pw_sub_magnet: 'Atrae monedas', pw_ending: 'Terminando', pw_end: 'Terminó', pw_end_careful: 'Terminó · atención', pw_end_auto: 'Terminó · el control es tuyo' });
})();
