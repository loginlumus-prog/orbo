/* =====================================================================
   ORBO v5.1: Sala de Troféus (aba Troféus de Conquistas), detalhe do troféu,
   aviso de troféu ao ganhar (em qualquer tela), selo no botão Conquistas do menu.
   Carregado depois de ui.js, ui-shop.js e ui-galaxy.js.
   ===================================================================== */
(function () {
  const $ = (s, r) => HR.U.$(s, r);
  const esc = s => HR.UI.esc(s);
  const TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const CAT_ICON = { galaxy: 'galaxy', bosses: 'crown', singularity: 'light', flight: 'ring', precision: 'target', feats: 'starGlow', power: 'powers', collection: 'ball', shopping: 'shop', wealth: 'coins', dedication: 'calendar', secret: 'eyeOff' };
  const tier = a => HR.Achievements.tier(a);

  // medalha: aro metálico + face com o ícone gravado; bloqueada mostra o progresso no aro
  function medal(a, o) {
    o = o || {};
    const on = !!a.unlocked, t = tier(a);
    return '<span class="medal m-' + t + (on ? ' on' : ' off') + (a.hidden && !on ? ' hid' : '') + (o.cls ? ' ' + o.cls : '') + '" style="--p:' + (on ? 1 : (a.frac || 0)).toFixed(3) + '">' +
      '<span class="md-rim"></span><span class="md-face">' + HR.icon(a.hidden && !on ? 'question' : (a.icon || 'trophy')) + '</span>' + (o.shine ? '<span class="md-shine"></span>' : '') + '</span>';
  }

  /* ---------------- Sala de Troféus ---------------- */
  function renderTrophies(body) {
    if (HR.UI.trophyCheck) HR.UI.trophyCheck();
    const d = HR.Store.data, all = HR.Achievements.list(), got = all.filter(a => a.unlocked), fresh = (d.achNew || []).slice();
    const filter = HR.UI.trFilter || 'all', pct = all.length ? got.length / all.length : 0;
    const counts = {}; TIERS.forEach(t => { counts[t] = got.filter(a => tier(a) === t).length; });
    const gemsWon = got.reduce((s, a) => s + (a.gems || 0), 0);

    const hero = HR.U.el('div', 'tr-hero');
    hero.innerHTML = '<div class="tr-ring" style="--p:' + pct.toFixed(3) + '"><div class="tr-ring-in"><b class="num">' + Math.floor(pct * 100) + '%</b><small>' + esc(HR.t('tr_done')) + '</small></div></div>' +
      '<div class="tr-hero-main"><span class="kicker">' + esc(HR.t('tr_title')) + '</span><b class="tr-count">' + esc(HR.t('tr_progress', { a: got.length, b: all.length })) + '</b>' +
      '<div class="tr-tiers">' + TIERS.map(t => '<span class="tr-tier"' + HR.tip(HR.t('tier_' + t)) + '><span class="medal m-' + t + ' on mini"><span class="md-rim"></span><span class="md-face"></span></span><b class="num">' + counts[t] + '</b></span>').join('') + '</div>' +
      '<span class="tr-gems"><i class="ic-gem"></i> ' + HR.U.fmt(gemsWon) + ' ' + esc(HR.t('tr_gems_total')) + '</span></div>';
    body.appendChild(hero);

    const near = all.filter(a => !a.unlocked && !a.hidden && a.frac > 0 && a.frac < 1).sort((a, b) => b.frac - a.frac).slice(0, 6);
    if (near.length) {
      body.appendChild(HR.U.el('div', 'section-title', HR.icon('target') + ' ' + esc(HR.t('tr_near'))));
      const row = HR.U.el('div', 'tr-near');
      near.forEach(a => {
        const c = HR.U.el('button', 'tr-near-card'); c.type = 'button';
        c.innerHTML = medal(a) + '<span class="tr-near-info"><b>' + esc(a.name) + '</b><span class="tr-bar"><i style="width:' + (a.frac * 100).toFixed(1) + '%"></i></span><small class="num">' + HR.U.fmt(a.progress) + ' / ' + HR.U.fmt(a.target) + '</small></span>';
        c.addEventListener('click', () => openTrophy(a)); row.appendChild(c);
      });
      body.appendChild(row);
    }

    const at = d.achAt || {}, recent = got.filter(a => at[a.id]).sort((a, b) => at[b.id] - at[a.id]).slice(0, 8);
    if (recent.length) {
      body.appendChild(HR.U.el('div', 'section-title', HR.icon('sparkles') + ' ' + esc(HR.t('tr_recent'))));
      const row = HR.U.el('div', 'tr-recent');
      recent.forEach(a => { const b = HR.U.el('button', 'tr-item on'); b.type = 'button'; b.innerHTML = medal(a, { shine: fresh.includes(a.id) }) + '<span class="tr-name">' + esc(a.name) + '</span>'; b.addEventListener('click', () => openTrophy(a)); row.appendChild(b); });
      body.appendChild(row);
    }

    const chips = HR.U.el('div', 'tr-filters');
    [['all', 'tr_all'], ['got', 'tr_got'], ['missing', 'tr_missing']].forEach(([k, key]) => {
      const b = HR.U.el('button', 'chip' + (filter === k ? ' on' : ''), esc(HR.t(key))); b.type = 'button';
      b.addEventListener('click', () => { HR.UI.trFilter = k; HR.Audio.sfx('click'); body.innerHTML = ''; renderTrophies(body); });
      chips.appendChild(b);
    });
    body.appendChild(chips);

    HR.ACH_CATS.forEach(cat => {
      const full = all.filter(a => a.cat === cat); if (!full.length) return;
      const done = full.filter(a => a.unlocked).length;
      const list = filter === 'got' ? full.filter(a => a.unlocked) : filter === 'missing' ? full.filter(a => !a.unlocked) : full;
      if (!list.length) return;
      const sh = HR.U.el('section', 'tr-shelf');
      sh.innerHTML = '<header class="tr-shelf-head">' + HR.plate(CAT_ICON[cat] || 'trophy', '#ffcf4a', 'sm') + '<b>' + esc(HR.t('ach_' + cat)) + '</b><span class="num">' + done + '/' + full.length + '</span><span class="tr-bar"><i style="width:' + (done / full.length * 100).toFixed(1) + '%"></i></span></header>';
      const grid = HR.U.el('div', 'tr-grid');
      list.forEach(a => {
        const isNew = fresh.includes(a.id), b = HR.U.el('button', 'tr-item' + (a.unlocked ? ' on' : '')); b.type = 'button';
        b.innerHTML = medal(a, { shine: isNew }) + (isNew ? '<span class="tr-new">' + esc(HR.t('tr_new')) + '</span>' : '') + '<span class="tr-name">' + esc(a.name) + '</span>';
        b.addEventListener('click', () => openTrophy(a)); grid.appendChild(b);
      });
      sh.appendChild(grid); body.appendChild(sh);
    });

    // o que era novo já foi visto
    if (fresh.length) { d.achNew = []; HR.Store.save(); refreshBadge(); }
  }

  function openTrophy(a) {
    closeTrophy();
    const at = (HR.Store.data.achAt || {})[a.id], t = tier(a), loc = HR.lang === 'en' ? 'en-US' : HR.lang === 'es' ? 'es-ES' : 'pt-BR';
    const host = HR.U.el('div', 'tr-sheet'); host.id = 'tr-sheet';
    const status = a.unlocked
      ? '<span class="tr-date">' + HR.icon('check') + ' ' + esc(at ? HR.t('tr_on', { d: new Date(at).toLocaleDateString(loc) }) : HR.t('tr_got_old')) + '</span>'
      : (a.hidden ? '' : '<div class="tr-sheet-prog"><span class="tr-bar"><i style="width:' + ((a.frac || 0) * 100).toFixed(1) + '%"></i></span><small class="num">' + HR.U.fmt(a.progress) + ' / ' + HR.U.fmt(a.target) + '</small></div>');
    host.innerHTML = '<div class="tr-sheet-card m-' + t + '"><button type="button" class="btn-icon tr-x" aria-label="Fechar">' + HR.icon('close') + '</button>' +
      medal(a, { cls: 'big', shine: a.unlocked }) +
      '<span class="tr-tier-label">' + esc(HR.t('tier_' + t)) + '</span><b class="tr-sheet-name">' + esc(a.name) + '</b>' +
      '<p class="tr-sheet-desc">' + esc(a.hidden && !a.unlocked ? HR.t('tr_hidden_d') : a.desc) + '</p>' + status +
      '<div class="tr-sheet-reward"><span class="kicker">' + esc(HR.t('tr_reward')) + '</span><span class="reward-pill"><i class="ic-gem"></i> ' + a.gems + '</span>' + (a.title ? '<span class="reward-pill">' + HR.icon('award') + ' ' + esc(HR.t(a.title)) + '</span>' : '') + '</div></div>';
    host.addEventListener('click', e => { if (e.target === host || e.target.closest('.tr-x')) { HR.Audio.sfx('click'); closeTrophy(); } });
    const panel = $('#screen-achievements'); if (panel) panel.appendChild(host);
    HR.Audio.sfx('open');
  }
  function closeTrophy() { const s = $('#tr-sheet'); if (s) s.remove(); }

  // a aba Troféus usa a Sala de Troféus; as outras abas continuam como estavam
  const render = HR.UI.renderAchievements;
  HR.UI.renderAchievements = function (arg) {
    if (typeof arg === 'string') HR.UI.achTab = arg;
    closeTrophy();
    render.call(this, arg);
    const tabs = $('#ach-tabs');
    if (tabs && !tabs.dataset.trWired) {
      tabs.dataset.trWired = '1';
      HR.U.$$('.tab', tabs).forEach(b => b.addEventListener('click', () => { closeTrophy(); if (b.getAttribute('data-tab') === 'ach') { const body = $('#ach-body'); if (body) { body.innerHTML = ''; renderTrophies(body); } } }));
    }
    if (HR.UI.achTab === 'ach') { const body = $('#ach-body'); if (body) { body.innerHTML = ''; renderTrophies(body); } }
  };
  const back = HR.UI.back;
  HR.UI.back = function () { if ($('#tr-sheet')) { closeTrophy(); return; } return back.apply(this, arguments); };

  /* ---------------- aviso de troféu ---------------- */
  const queue = []; let showing = false;
  function nextPop() {
    const a = queue.shift(); if (!a) { showing = false; return; }
    showing = true;
    let host = $('#trophy-host'); if (!host) { host = HR.U.el('div', ''); host.id = 'trophy-host'; $('#app').appendChild(host); }
    const L = HR.Achievements.list(a.cat).find(x => x.id === a.id) || a, t = tier(a);
    const el = HR.U.el('button', 'trophy-pop m-' + t); el.type = 'button';
    el.innerHTML = medal(Object.assign({}, L, { unlocked: true, hidden: false }), { shine: true }) +
      '<span class="tp-main"><span class="tp-kicker">' + esc(HR.t('tr_unlocked')) + ' · ' + esc(HR.t('tier_' + t)) + '</span><b>' + esc(HR.t('a_' + a.id)) + '</b>' +
      '<span class="tp-reward"><i class="ic-gem"></i> +' + a.gems + (a.title ? ' · ' + HR.icon('award') + ' ' + esc(HR.t(a.title)) : '') + '</span></span>';
    el.addEventListener('click', e => {
      e.stopPropagation(); el.classList.add('out');
      if (['menu', 'over', 'levelend'].includes(HR.UI.current) && !HR.UI.isModalOpen()) HR.UI.open('achievements', 'ach');
    });
    host.appendChild(el);
    HR.Audio.sfx('reward');
    setTimeout(() => el.classList.add('out'), 3200);
    setTimeout(() => { el.remove(); nextPop(); }, 3550);
  }
  HR.UI.trophyPopup = function (a) { queue.push(a); if (!showing) nextPop(); };
  HR.UI.achToast = function (a) { this.trophyPopup(a); };
  HR.UI.trophyCheck = function () { const got = HR.Achievements.check(); got.forEach(a => this.trophyPopup(a)); if (got.length) refreshBadge(); return got; };

  /* ---------------- menu ---------------- */
  function refreshBadge() { const b = $('[data-badge="trophies"]'); if (b) b.classList.toggle('on', !!(HR.Store.data.achNew && HR.Store.data.achNew.length)); }
  const refreshMenu = HR.UI.refreshMenu;
  HR.UI.refreshMenu = function () { const r = refreshMenu.apply(this, arguments); refreshBadge(); return r; };

  // textos da v5.1 que ui-shop.js e ui-galaxy.js sobrescreveram ao carregar
  if (HR.I18N_V51) ['pt', 'en', 'es'].forEach(l => Object.assign(HR.I18N[l], HR.I18N_V51[l]));
  // troféus já cumpridos (saves antigos, compras antes da v5.1) chegam logo depois de abrir o jogo
  setTimeout(() => { if (HR.Store.data && HR.UI.trophyCheck) HR.UI.trophyCheck(); }, 3500);

  // recordes de uma partida que viram troféus
  const processRunEnd = HR.UI.processRunEnd;
  HR.UI.processRunEnd = function (s) {
    try {
      const x = HR.Store.data.stats5 || (HR.Store.data.stats5 = {});
      if (s && s.mode !== 'practice') {
        x.bestDirRun = Math.max(x.bestDirRun || 0, s.dirChanges || 0);
        x.bestRunCoins = Math.max(x.bestRunCoins || 0, s.coins || 0);
        x.autoPerksTotal = (x.autoPerksTotal || 0) + (s.autoPerks || 0);
      }
    } catch (e) { console.error(e); }
    return processRunEnd.call(this, s);
  };
})();
