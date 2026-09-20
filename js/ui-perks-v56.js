/* =====================================================================
   ORBO v5.6: talentos em árvore, sem texto no meio da partida.
   - O aviso de talento escolhido sai da tela; a fileira de ícones embaixo vira botão.
   - Tocando nela abre a Ficha da partida: status (como RPG) e as cinco árvores de talentos,
     com o que você pegou aceso e o resto apagado. O jogo pausa enquanto a ficha está aberta.
   - Toque duplo (ou clique duplo) ativa a Égide.
   ===================================================================== */
(function () {
  const $ = (s, r) => HR.U.$(s, r), $$ = (s, r) => HR.U.$$(s, r);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const TREES = [
    { id: 'guard', icon: 'shield', color: '#4cf0ff', ids: ['shield', 'hull', 'bulwark', 'life', 'streakshield', 'secondchance', 'guardianangel'] },
    { id: 'aim', icon: 'target', color: '#35e29a', ids: ['bigrings', 'eagle', 'microball', 'risky', 'reflex', 'resonance', 'tempo'] },
    { id: 'flow', icon: 'wind', color: '#a78bfa', ids: ['calm', 'breath', 'flowkeeper', 'afterburner', 'warpcore', 'fastcd', 'aegischarge'] },
    { id: 'gold', icon: 'coins', color: '#ffcf4a', ids: ['magnet', 'magnetfield', 'coinsx2', 'coinstorm', 'stardust', 'scavenger', 'goldring', 'greedy', 'lucky', 'combo3', 'prismatic'] },
    { id: 'asc', icon: 'sparkle', color: '#ff8a3d', ids: ['autoflow', 'regen', 'intangible', 'overclock', 'momentum'] }
  ];
  // status no estilo ficha de RPG: só aparece o que mudou
  const STATS = [
    { k: 'lives', icon: 'heart', get: r => r.lives, always: true, fmt: v => String(v) },
    { k: 'shields', icon: 'shield', get: r => r.shields, always: true, fmt: v => String(v) },
    { k: 'ring', icon: 'ringBig', get: r => r.mods.ringRadius || 0, fmt: v => (v > 0 ? '+' : '') + Math.round(v * 100) + ' %' },
    { k: 'zone', icon: 'target', get: r => r.mods.perfectZone || 1, base: 1, fmt: v => '×' + v.toFixed(2).replace('.00', '') },
    { k: 'speed', icon: 'speed', get: r => r.mods.speedMul || 1, base: 1, fmt: v => (v < 1 ? '−' : '+') + Math.abs(Math.round((v - 1) * 100)) + ' %' },
    { k: 'coin', icon: 'coin', get: r => r.mods.coinMul || 1, base: 1, fmt: v => '×' + v.toFixed(2).replace('.00', '') },
    { k: 'cd', icon: 'cooldown', get: r => r.mods.cdMul || 1, base: 1, fmt: v => (v < 1 ? '−' : '+') + Math.abs(Math.round((v - 1) * 100)) + ' %' },
    { k: 'dur', icon: 'hourglass', get: r => r.mods.durMul || 1, base: 1, fmt: v => (v > 1 ? '+' : '−') + Math.abs(Math.round((v - 1) * 100)) + ' %' },
    { k: 'score', icon: 'star', get: r => r.mods.scorePerRing || 0, fmt: v => '+' + v }
  ];

  let host = null, openNow = false;

  function ensure() {
    if (host && host.isConnected) return host;
    host = HR.U.el('div', 'modal perk-modal');
    host.id = 'perk-sheet';
    host.innerHTML = '<div class="modal-card perk-card"><div class="perk-head"><span class="kicker" data-bind="perkKicker"></span>' +
      '<h3></h3></div><div class="perk-body"></div>' +
      '<button type="button" class="btn btn-ghost perk-close"><span class="btn-label"></span></button></div>';
    (document.getElementById('app') || document.body).appendChild(host);
    host.addEventListener('click', e => { if (e.target === host) close(); });
    host.querySelector('.perk-close').addEventListener('click', e => { e.stopPropagation(); close(); });
    return host;
  }

  // números da partida: ícone e valor, com o nome na dica
  const TILES = [
    { k: 'score', icon: 'star', get: r => r.score },
    { k: 'rings', icon: 'ring', get: r => r.ringsPassed },
    { k: 'perfects', icon: 'target', get: r => r.perfects },
    { k: 'combo', icon: 'flame', get: r => r.maxCombo },
    { k: 'coins', icon: 'coin', get: r => r.coins },
    { k: 'hits', icon: 'close', get: r => r.hits }
  ];
  const tilesHtml = run => '<div class="pz-tiles">' + TILES.map(t =>
    '<span class="pz-tile t-' + t.k + '" data-tip="' + esc(HR.t('pk_ti_' + t.k)) + '" data-tip-tap="1"><span class="pz-ic">' +
    HR.icon(t.icon, '', t.icon === 'star' || t.icon === 'coin') + '</span><b>' + HR.U.fmt(t.get(run) || 0) + '</b></span>').join('') + '</div>';

  const statsHtml = run => {
    let h = '<div class="perk-stats">';
    STATS.forEach(s => {
      const v = s.get(run), base = s.base != null ? s.base : 0;
      if (!s.always && Math.abs(v - base) < 0.001) return;
      h += '<span class="perk-stat" data-tip="' + esc(HR.t('pk_st_' + s.k)) + '" data-tip-tap="1">' +
        '<span class="ps-ic">' + HR.icon(s.icon, '', s.icon === 'star' || s.icon === 'coin') + '</span><b>' + esc(s.fmt(v)) + '</b></span>';
    });
    return h + '</div>';
  };

  function render() {
    const run = HR.game && HR.game.run; if (!run) return;
    const el = ensure();
    el.querySelector('.perk-head h3').textContent = HR.t('pk_sheet');
    el.querySelector('[data-bind="perkKicker"]').textContent = HR.t('pk_sheet_sub', { n: Object.keys(run.perks || {}).length });
    el.querySelector('.perk-close .btn-label').textContent = HR.t('close');
    let h = tilesHtml(run) + statsHtml(run);
    TREES.forEach(tree => {
      const taken = tree.ids.filter(id => run.perks && run.perks[id]).length;
      h += '<div class="perk-tree" style="--tc:' + tree.color + '">';
      h += '<div class="perk-tree-head"><span class="pt-ic">' + HR.icon(tree.icon) + '</span><b>' + esc(HR.t('pk_tree_' + tree.id)) + '</b><i>' + taken + '/' + tree.ids.length + '</i></div>';
      h += '<div class="perk-row">';
      tree.ids.forEach(id => {
        const def = HR.Perks.def(id); if (!def) return;
        const lv = (run.perks && run.perks[id]) || 0;
        h += '<button type="button" class="perk-node rar-' + def.rarity + (lv ? ' on' : '') + '" data-tip="' + esc(HR.Perks.name(id)) + '" data-tip-d="' + esc(HR.Perks.desc(id)) + '" data-tip-tap="1">' +
          '<span class="pn-ic">' + HR.icon(def.icon) + '</span>';
        if (def.max > 1) { h += '<span class="pn-pips">'; for (let k = 0; k < def.max; k++) h += '<i' + (k < lv ? ' class="on"' : '') + '></i>'; h += '</span>'; }
        else if (lv) h += '<span class="pn-check">' + HR.icon('check') + '</span>';
        h += '</button>';
      });
      h += '</div></div>';
    });
    el.querySelector('.perk-body').innerHTML = h;
  }

  const pausedNow = () => { const p = document.getElementById('screen-pause'); return !!(p && p.classList.contains('visible')); };
  let camePaused = false;
  function open() {
    if (openNow || !HR.game || !HR.game.run) return;
    const fromPause = pausedNow();
    if (HR.UI.current !== 'hud' && !fromPause) return;
    openNow = true; camePaused = fromPause;
    render();
    ensure().classList.add('visible');
    if (!fromPause && HR.game.pause) HR.game.pause();
    if (HR.Audio) HR.Audio.sfx('open');
  }
  function close() {
    if (!openNow) return;
    openNow = false;
    if (host) host.classList.remove('visible');
    if (!camePaused && HR.game && HR.game.resume) HR.game.resume();
    if (HR.Audio) HR.Audio.sfx('click');
  }
  HR.UI.openPerkSheet = open;
  HR.UI.closePerkSheet = close;

  /* ---------------- HUD: a fileira de talentos vira botão, sem aviso de texto ---------------- */
  const origHudPerks = HR.UI.hudPerks;
  HR.UI.hudPerks = function (run) {
    const r = origHudPerks.apply(this, arguments);
    const row = $('[data-bind="hudPerks"]');
    if (row && !row.dataset.v56) {
      row.dataset.v56 = '1';
      row.addEventListener('click', e => { e.stopPropagation(); open(); });
    }
    if (row) row.classList.toggle('has-perks', !!(run && run.perks && Object.keys(run.perks).length));
    return r;
  };

  // escolher talento não mostra mais texto no meio do jogo
  const origChoose = HR.UI.choosePerk;
  HR.UI.choosePerk = function (id) {
    const m = $('#modal-perks'); if (m) m.classList.remove('visible');
    if (this.game && this.game.choosePerk) this.game.choosePerk(id);
    const row = $('[data-bind="hudPerks"]'); if (row) { row.classList.remove('pop'); void row.offsetWidth; row.classList.add('pop'); }
    if (this.hudPerks && this.game) this.hudPerks(this.game.run);
  };

  /* ---------------- pausa: números da partida, status e talentos ---------------- */
  function renderPauseRun() {
    const card = document.querySelector('#screen-pause .card'), run = HR.game && HR.game.run;
    if (!card || !run) return;
    let box = card.querySelector('.pz-run');
    if (!box) {
      box = HR.U.el('div', 'pz-run');
      const rib = card.querySelector('.ribbon');
      if (rib && rib.parentNode) rib.parentNode.insertBefore(box, rib.nextSibling); else card.insertBefore(box, card.firstChild);
    }
    const ids = Object.keys(run.perks || {});
    let strip = '';
    ids.slice(0, 7).forEach(id => { const d = HR.Perks.def(id); if (d) strip += '<span class="pz-perk rar-' + d.rarity + '">' + HR.icon(d.icon) + (run.perks[id] > 1 ? '<i>' + run.perks[id] + '</i>' : '') + '</span>'; });
    if (ids.length > 7) strip += '<span class="pz-perk more">+' + (ids.length - 7) + '</span>';
    if (!ids.length) strip = '<span class="pz-perk empty">' + HR.icon('sparkle') + '</span>';
    box.innerHTML = tilesHtml(run) + statsHtml(run) +
      '<button type="button" class="pz-build"><span class="pz-strip">' + strip + '</span>' +
      '<span class="pz-count">' + ids.length + '</span><span class="pz-go">' + HR.icon('chevronRight') + '</span></button>';
    const b = box.querySelector('.pz-build');
    if (b) b.addEventListener('click', e => { e.stopPropagation(); open(); });
  }
  const origPause = HR.UI.pause;
  if (typeof origPause === 'function') {
    HR.UI.pause = function () { const r = origPause.apply(this, arguments); try { renderPauseRun(); } catch (_) { /* nada */ } return r; };
  }

  const origInit = HR.UI.hudInit;
  HR.UI.hudInit = function (game) {
    const r = origInit.apply(this, arguments);
    // no automático também: só acende a fileira, sem texto
    game.on('autoperk', () => {
      const row = $('[data-bind="hudPerks"]'); if (row) { row.classList.remove('pop'); void row.offsetWidth; row.classList.add('pop'); }
      if (HR.UI.hudPerks) HR.UI.hudPerks(game.run);
    });
    // item novo descoberto: só um selo discreto durante a partida (o álbum guarda o resto)
    game.on('discover', () => { if (inRun()) mini('bag', '+1'); }); guard();
    // toque duplo (ou clique duplo) usa a Égide
    HR.Input.onDoubleTap = () => {
      if (HR.UI.current !== 'hud' || openNow) return;
      if (game.state !== 'playing' && game.state !== 'ready') return;
      if (game.useAegis) game.useAegis();
    };
    return r;
  };

  /* ---------------- conquista durante a partida: selo discreto, cartão no fim ---------------- */
  const pending = [];
  let miniEl = null, miniT = null;
  function mini(icon, label) {
    if (!miniEl || !miniEl.isConnected) {
      miniEl = HR.U.el('div', 'ach-mini', '<span class="am-ic"></span><b></b>');
      (document.getElementById('app') || document.body).appendChild(miniEl);
    }
    miniEl.querySelector('.am-ic').innerHTML = HR.icon(icon || 'trophy');
    miniEl.querySelector('b').textContent = label != null ? label : '+' + (pending.length || 1);
    miniEl.classList.add('show');
    clearTimeout(miniT); miniT = setTimeout(() => { if (miniEl) miniEl.classList.remove('show'); }, 1600);
    if (HR.Audio) HR.Audio.sfx('coin');
  }
  const inRun = () => {
    const g = HR.game;
    return HR.UI.current === 'hud' && g && ['playing', 'ready', 'transition', 'perk', 'paused', 'dying'].indexOf(g.state) >= 0;
  };
  // um cartão pode ter entrado na fila fora da partida e só aparecer depois, já no jogo:
  // aqui ele é retirado na hora e guardado para o fim
  const recent = [];
  function guard() {
    const host = document.getElementById('trophy-host');
    if (!host || host.dataset.v56 || !window.MutationObserver) return;
    host.dataset.v56 = '1';
    new MutationObserver(() => {
      if (!inRun()) return;
      const pops = host.querySelectorAll('.trophy-pop');
      if (!pops.length) return;
      pops.forEach(() => { const a = recent.shift(); if (a) pending.push(a); });
      host.innerHTML = '';
      mini();
    }).observe(host, { childList: true });
  }

  // varre a cada quadro do HUD: pega até o cartão que já estava na tela quando a partida começou
  function sweep() {
    // barra de evento presa: se a partida acabou com o evento ativo, ela reaparecia na partida seguinte
    const bar = document.getElementById('hud-event');
    if (bar && bar.classList.contains('show') && !(HR.game && HR.game.event)) bar.classList.remove('show');
    const h = document.getElementById('trophy-host');
    if (!h || !h.firstElementChild || !inRun()) return;
    const k = h.querySelectorAll('.trophy-pop').length;
    for (let i = 0; i < k; i++) { const a = recent.shift(); if (a) pending.push(a); }
    h.innerHTML = '';
    mini();
  }
  const origHudPowers = HR.UI.hudPowers;
  if (typeof origHudPowers === 'function') {
    HR.UI.hudPowers = function () { const r = origHudPowers.apply(this, arguments); sweep(); return r; };
  }

  const origPopup = HR.UI.trophyPopup;
  if (typeof origPopup === 'function') {
    HR.UI.trophyPopup = function (a) {
      guard();
      if (inRun()) { pending.push(a); mini(); return; }
      recent.push(a); if (recent.length > 8) recent.shift();
      return origPopup.call(this, a);
    };
    HR.UI.achToast = function (a) { this.trophyPopup(a); };
    // ao sair da partida, os cartões guardados aparecem um a um
    const origSetBase = HR.UI.setBase;
    HR.UI.setBase = function (name) {
      const r = origSetBase.apply(this, arguments);
      if (name !== 'hud' && pending.length) {
        const list = pending.slice(); pending.length = 0;
        if (miniEl) miniEl.classList.remove('show');
        setTimeout(() => list.forEach((a, i) => setTimeout(() => origPopup.call(HR.UI, a), i * 320)), 800);
      }
      return r;
    };
  }

  Object.assign(HR.I18N.pt, {
    pk_sheet: 'Ficha da partida', pk_sheet_sub: '{n} talentos',
    pk_tree_guard: 'Proteção', pk_tree_aim: 'Mira', pk_tree_flow: 'Voo', pk_tree_gold: 'Riqueza', pk_tree_asc: 'Ascensão',
    pk_ti_score: 'Pontos', pk_ti_rings: 'Arcos', pk_ti_perfects: 'Perfeitos', pk_ti_combo: 'Combo máximo', pk_ti_coins: 'Moedas', pk_ti_hits: 'Dano levado',
    pk_st_lives: 'Vidas', pk_st_shields: 'Escudos', pk_st_ring: 'Tamanho do arco', pk_st_zone: 'Zona do perfeito', pk_st_speed: 'Velocidade',
    pk_st_coin: 'Moedas', pk_st_cd: 'Recarga', pk_st_dur: 'Duração', pk_st_score: 'Pontos por arco'
  });
  Object.assign(HR.I18N.en, {
    pk_sheet: 'Run sheet', pk_sheet_sub: '{n} talents',
    pk_tree_guard: 'Guard', pk_tree_aim: 'Aim', pk_tree_flow: 'Flight', pk_tree_gold: 'Wealth', pk_tree_asc: 'Ascension',
    pk_ti_score: 'Score', pk_ti_rings: 'Rings', pk_ti_perfects: 'Perfects', pk_ti_combo: 'Best combo', pk_ti_coins: 'Coins', pk_ti_hits: 'Damage taken',
    pk_st_lives: 'Lives', pk_st_shields: 'Shields', pk_st_ring: 'Ring size', pk_st_zone: 'Perfect zone', pk_st_speed: 'Speed',
    pk_st_coin: 'Coins', pk_st_cd: 'Cooldown', pk_st_dur: 'Duration', pk_st_score: 'Score per ring'
  });
  Object.assign(HR.I18N.es, {
    pk_sheet: 'Ficha de la partida', pk_sheet_sub: '{n} talentos',
    pk_tree_guard: 'Protección', pk_tree_aim: 'Puntería', pk_tree_flow: 'Vuelo', pk_tree_gold: 'Riqueza', pk_tree_asc: 'Ascensión',
    pk_ti_score: 'Puntos', pk_ti_rings: 'Aros', pk_ti_perfects: 'Perfectos', pk_ti_combo: 'Combo máximo', pk_ti_coins: 'Monedas', pk_ti_hits: 'Daño recibido',
    pk_st_lives: 'Vidas', pk_st_shields: 'Escudos', pk_st_ring: 'Tamaño del aro', pk_st_zone: 'Zona del perfecto', pk_st_speed: 'Velocidad',
    pk_st_coin: 'Monedas', pk_st_cd: 'Recarga', pk_st_dur: 'Duración', pk_st_score: 'Puntos por aro'
  });
})();
