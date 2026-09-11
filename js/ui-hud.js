/* =====================================================================
   HUD v2: pontuação, barra de fase, chefe, status (vidas/escudos), perks,
   botões de habilidade com recarga, avisos centrais, vinhetas de efeito,
   seleção de perk (roguelike) e tela de fim de fase (campanha).
   ===================================================================== */
(function () {
  const $ = (s, r) => HR.U.$(s, r), $$ = (s, r) => HR.U.$$(s, r);

  Object.assign(HR.UI, {
    hudRaf: null, bannerTimer: null, perkOffers: [],

    hudInit(game) {
      this.game = game;
      game.on('ready', run => this.hudReady(run));
      game.on('begin', () => this.setReadyHint(false));
      game.on('score', (run, perfect) => this.hudScore(run, perfect));
      game.on('phase', info => { this.banner(HR.t('phase_label', { n: info.number, name: info.name }), '', info.accent); this.hudPhaseLabel(); HR.U.vibrate([20, 40, 20]); });
      game.on('status', run => this.hudStatus(run));
      game.on('ability', info => this.hudAbilityFx(info));
      game.on('perk', info => this.showPerks(info));
      game.on('direction', info => this.banner(HR.t('direction_change'), info.arrow, '#ffffff', true));
      game.on('banner', info => this.banner(info.title, info.sub || '', info.color || '#ffffff'));
      game.on('wave', n => this.banner(HR.t('wave', { n }), '', '#ff5e7e'));
      game.on('boss', info => this.fill('bossFill', info.fill));
      game.on('reflex', () => { const v = $('#fx-vignette'); v.classList.add('reflex'); setTimeout(() => v.classList.remove('reflex'), 600); });
      game.on('anomaly', info => { const v = $('#fx-vignette'); if (info.phase === 'warn') { this.banner(HR.t('anomaly_warn'), HR.t('anomaly_warn_d'), '#ff3d2e'); $('#hud-banner').classList.add('anomaly'); v.classList.add('anomaly'); setTimeout(() => { v.classList.remove('anomaly'); $('#hud-banner').classList.remove('anomaly'); }, 2600); } else { this.banner(HR.t('anomaly_beat'), '+' + HR.CONFIG.ANOMALY.bonusCoins + ' ' + HR.t('coins_earned').toLowerCase(), '#ff8a3d'); } });
      game.on('combo', info => { const v = $('#fx-vignette'); v.classList.add('combo'); setTimeout(() => v.classList.remove('combo'), 260); this.banner(HR.t('combo', { n: info.n }), '', '#ffcf4a'); });
      game.on('autoperk', info => { const p = HR.Perks.def(info.id); if (p) this.toast(HR.icon(p.icon) + ' ' + HR.t('perk_auto_toast', { name: HR.Perks.name(info.id) }), 'good'); this.hudPerks(this.game.run); });
      game.on('discover', info => { const name = info.kind === 'ring' ? HR.t('rt_' + info.id) : HR.t('pk_' + info.id); this.toast(HR.icon('bag') + ' ' + HR.t('discover_new', { name }), 'good'); });

      const on = (id, fn) => { const el = $('#' + id); if (el) el.addEventListener('click', e => { e.stopPropagation(); fn(e); }); };
      on('btn-perk-skip', () => this.choosePerk(null));
      on('btn-perk-reroll', () => this.rerollPerks());
      on('perk-auto', () => { const s = HR.Store.data.settings; s.autoPerk = !s.autoPerk; HR.Store.save(); HR.Audio.sfx('click'); this.refreshAutoPerk(); });
      on('btn-le-next', () => this.levelEndNext());
      on('btn-le-retry', () => this.levelEndRetry());
      on('btn-le-menu', () => this.afterOver(() => { this.goMenu(); this.open('galaxy'); const L = this.lastSummary && HR.Campaign.level(this.lastSummary.levelId); if (L) this.open('region', L.ri); }));
      HR.Input.onAbility = slot => { if (this.current === 'hud') this.game.useAbility(slot); };
    },

    /* ---------- estado do HUD ---------- */
    hudReady(run) {
      this.bind('score', run.score); this.bind('runCoins', run.coins);
      $('[data-bind="combo"]').classList.remove('show');
      this.setReadyHint(true);
      this.hudStatus(run); this.hudPerks(run); this.hudProgress(run); this.hudPhaseLabel();
      this.renderAbilityButtons(run);
      const isBoss = run.level && run.level.boss;
      $('#boss-bar').classList.toggle('show', !!isBoss);
      $('#hud-progress').classList.toggle('boss', !!isBoss);
      if (isBoss) { this.bind('bossName', HR.t('boss_' + run.level.boss)); $('[data-bind="bossIcon"]').innerHTML = HR.icon(HR.BOSSES[run.level.boss].icon); this.fill('bossFill', 1 - run.ringsPassed / run.level.rings); }
      this.startHudLoop();
    },
    hudScore(run, perfect) {
      const sc = $('[data-bind="score"]'); sc.textContent = run.score; sc.classList.remove('pop'); void sc.offsetWidth; sc.classList.add('pop');
      this.bind('runCoins', run.coins);
      const c = $('[data-bind="combo"]');
      if (run.combo >= 2) { c.textContent = HR.t('combo', { n: run.combo }); c.classList.add('show'); c.style.setProperty('--heat', Math.min(1, run.combo / 15)); }
      else c.classList.remove('show');
      this.hudProgress(run);
      void perfect;
    },
    hudProgress(run) {
      const bar = $('#seg-bar');
      if (bar.childElementCount !== 10) { bar.innerHTML = ''; for (let i = 0; i < 10; i++) bar.appendChild(HR.U.el('i')); }
      const frac = run.level ? run.ringsResolved / run.level.rings : (run.ringsPassed % 10) / 10;
      const filled = Math.round(frac * 10);
      $$('i', bar).forEach((seg, i) => seg.classList.toggle('on', i < filled));
    },
    hudPhaseLabel() {
      const run = this.game.run, lbl = $('[data-bind="phase"]');
      if (run.level) { lbl.textContent = HR.t('level_n', { n: run.level.id }) + (run.level.boss ? ' · ' + HR.t('boss') : ''); lbl.style.color = HR.REGIONS[run.level.ri].accent; }
      else { const ph = this.game.phaseAt(run.ringsPassed); lbl.textContent = HR.t('phase_label', { n: ph.number, name: HR.t(ph.phase.key) }); lbl.style.color = ph.phase.accent; }
    },
    hudStatus(run) {
      const host = $('[data-bind="hudStatus"]'); host.innerHTML = '';
      for (let i = 0; i < run.lives; i++) host.appendChild(HR.U.el('span', 'st-life', HR.icon('heart', '', true)));
      for (let i = 0; i < run.shields; i++) host.appendChild(HR.U.el('span', 'st-shield', HR.icon('shield', '', true)));
      if (run.mode === 'practice') host.appendChild(HR.U.el('span', 'st-tag', HR.t('mode_practice')));
      this.hudPerks(run);
    },
    hudPerks(run) {
      const host = $('[data-bind="hudPerks"]'); host.innerHTML = '';
      Object.keys(run.perks).forEach(id => { const p = HR.Perks.def(id); if (!p) return; const el = HR.U.el('span', 'hud-perk rar-' + p.rarity, HR.icon(p.icon) + (run.perks[id] > 1 ? '<b>' + run.perks[id] + '</b>' : '')); el.title = HR.Perks.name(id); host.appendChild(el); });
    },

    /* ---------- avisos ---------- */
    banner(title, sub, color, big) {
      const b = $('#hud-banner');
      this.bind('bannerTitle', title); this.bind('bannerSub', sub || '');
      b.style.setProperty('--c', color || '#ffffff');
      b.classList.toggle('big', !!big);
      b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
      clearTimeout(this.bannerTimer); this.bannerTimer = setTimeout(() => b.classList.remove('show'), big ? 2200 : 1700);
    },

    /* ---------- habilidades ---------- */
    renderAbilityButtons(run) {
      const host = $('#hud-abilities'); host.innerHTML = '';
      const desktop = !HR.U.isTouch();
      run.abilities.forEach((ab, slot) => {
        const btn = HR.U.el('button', 'ab-btn' + (ab ? '' : ' empty'));
        btn.dataset.slot = slot;
        if (ab) {
          const def = HR.Abilities.def(ab.id);
          btn.style.setProperty('--ac', def.color);
          btn.innerHTML = '<span class="ab-ring"></span><span class="ab-ic">' + HR.icon(def.icon) + '</span><span class="ab-cd"></span>' + (desktop ? '<span class="ab-key">' + (slot === 0 ? 'Q' : 'E') + '</span>' : '');
          btn.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); this.game.useAbility(slot); });
        }
        host.appendChild(btn);
      });
      host.classList.toggle('two', run.abilities.length > 1);
    },
    hudAbilityFx(info) {
      const btn = $$('#hud-abilities .ab-btn')[info.slot]; if (!btn) return;
      btn.classList.remove('fire'); void btn.offsetWidth; btn.classList.add('fire');
      if (!HR.Store.data.hints.ability) { HR.Store.data.hints.ability = true; HR.Store.save(); }
    },
    updateStick() {
      const hud = $('#screen-hud'), on = this.game.controlMode() === 'stick';
      hud.classList.toggle('stick-on', on);
      if (!on) return;
      const S = HR.Input.stick, st = this.game.state, live = st === 'playing' || st === 'ready' || st === 'transition';
      const el = $('#hud-stick'), knob = $('#stick-knob'), T = 34, m = Math.min(1, Math.hypot(S.x, S.y));
      el.classList.toggle('held', S.active && live);
      el.classList.toggle('dim', live && this.game.run.autoT > 0 && !this.game.run.anomalyActive);
      const x = S.active ? S.x * T : 0, y = S.active ? S.y * T : 0;
      knob.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      el.style.setProperty('--m', (S.active ? m : 0).toFixed(2));
    },
    startHudLoop() {
      if (this.hudRaf) return;
      const tick = () => {
        this.hudRaf = null;
        if (this.current !== 'hud') return;
        const run = this.game.run;
        $$('#hud-abilities .ab-btn').forEach(btn => {
          const ab = run.abilities[+btn.dataset.slot]; if (!ab) return;
          const total = HR.Abilities.cooldown(ab.id, run);
          const p = total > 0 ? 1 - ab.cd / total : 1;
          btn.style.setProperty('--p', p.toFixed(3));
          btn.classList.toggle('ready', ab.cd <= 0);
          btn.classList.toggle('active', ab.active > 0);
          const cd = $('.ab-cd', btn); if (cd) cd.textContent = ab.cd > 0 ? Math.ceil(ab.cd) : '';
        });
        this.updateStick();
        const v = $('#fx-vignette');
        v.classList.toggle('slowmo', run.slowmoT > 0);
        v.classList.toggle('ghost', run.ghostT > 0);
        v.classList.toggle('freeze', run.freezeT > 0);
        v.classList.toggle('magnet', run.magnetT > 0);
        v.classList.toggle('auto', run.autoT > 0 && !run.anomalyActive);
        v.classList.toggle('star', run.starT > 0);
        this.hudRaf = requestAnimationFrame(tick);
      };
      this.hudRaf = requestAnimationFrame(tick);
    },

    /* ---------- perks ---------- */
    showPerks(info) {
      this.perkOffers = info.offers;
      this.bind('perkSub', HR.t('perk_sub', { n: info.rings }));
      this.renderPerkCards();
      const rr = $('#btn-perk-reroll');
      rr.style.display = (!this.game.run.rerollUsed || HR.Ads.isRewardedReady()) ? '' : 'none';
      this.refreshAutoPerk();
      $('#modal-perks').classList.add('visible');
      HR.Audio.sfx('phase');
      HR.Analytics.log('perk_offer', { rings: info.rings, ids: info.offers.map(p => p.id) });
    },
    renderPerkCards() {
      const host = $('#perk-cards'); host.innerHTML = '';
      const run = this.game.run;
      this.perkOffers.forEach((p, i) => {
        const taken = run.perks[p.id] || 0;
        const card = HR.U.el('button', 'perk-card rar-' + p.rarity);
        card.style.animationDelay = (i * 90) + 'ms';
        card.innerHTML = '<span class="perk-rar">' + HR.t('rarity_' + p.rarity) + '</span><span class="perk-ic">' + HR.icon(p.icon) + '</span><b class="perk-name">' + HR.Perks.name(p.id) + '</b><span class="perk-desc">' + HR.Perks.desc(p.id) + '</span>' +
          '<span class="perk-pips">' + Array.from({ length: p.max }, (_, k) => '<i class="' + (k < taken ? 'on' : '') + (k === taken ? ' next' : '') + '"></i>').join('') + '</span>';
        card.addEventListener('click', () => this.choosePerk(p.id));
        host.appendChild(card);
      });
    },
    choosePerk(id) {
      $('#modal-perks').classList.remove('visible');
      this.game.choosePerk(id);
      if (id) { const p = HR.Perks.def(id); this.toast(HR.icon(p.icon) + ' ' + HR.Perks.name(id), 'good'); }
    },
    async rerollPerks() {
      const run = this.game.run;
      if (run.rerollUsed) { const ok = await HR.Ads.showRewarded('perk_reroll'); if (!ok) return; }
      run.rerollUsed = true;
      this.perkOffers = this.game.rerollPerks();
      HR.Audio.sfx('whoosh'); this.renderPerkCards();
      $('#btn-perk-reroll').style.display = HR.Ads.isRewardedReady() ? '' : 'none';
    },

    refreshAutoPerk() {
      const el = $('#perk-auto'); if (!el) return;
      const run = this.game.run, ok = run.perksOffered >= HR.CONFIG.AUTOPERK.afterOffers;
      el.hidden = !ok;
      $('#perk-auto-toggle').classList.toggle('on', !!HR.Store.data.settings.autoPerk);
    },

    /* ---------- fim de fase (campanha) ---------- */
    onLevelEnd(s) {
      if (this.abandon) { this.abandon = false; this.stopHud(); HR.Audio.setIntensity(0); this.goMenu(); return; } // saiu pela pausa / reiniciou
      const level = HR.Campaign.level(s.levelId);
      let out = null;
      if (s.success) { out = HR.Campaign.complete(level, s); s.levelDone = 1; s.starsGot = out.newStars; s.threeStar = (out.stars === 3 && out.newStars > 0) ? 1 : 0; s.bossDone = level.boss ? 1 : 0; s.flawless = s.hits === 0 ? 1 : 0; }
      const res = this.processRunEnd(s);
      this.lastSummary = s; this.lastLevelResult = out;
      this.stopHud();
      const stars = out ? out.stars : 0;
      this.bind('levelendKicker', out && out.worldCleared ? HR.t('world_cleared') : (HR.t('reg_' + level.region) + ' · ' + (level.boss ? HR.t('boss') : HR.t('level_n', { n: level.id }))));
      this.bind('levelendTitle', s.success ? HR.t('level_complete') : HR.t('level_failed'));
      if (!s.success && s.hits === 0 && s.passNeed) this.bind('levelendKicker', HR.t('level_need', { n: s.passNeed, p: s.ringsPassed, t: s.ringsTotal }));
      this.bind('lePassed', s.ringsPassed + ' / ' + s.ringsTotal); this.bind('leMisses', s.misses);
      const sh = $('[data-bind="levelendStars"]'); sh.innerHTML = '';
      for (let i = 0; i < 3; i++) { const st = HR.U.el('span', 'star' + (i < stars ? ' on' : ''), HR.icon('star', '', true)); st.style.animationDelay = (300 + i * 260) + 'ms'; sh.appendChild(st); }
      this.bind('leCombo', s.perfects + ' / ' + level.rings);
      this.bind('leCoins', '+' + HR.U.fmt(s.coins));
      const rw = $('[data-bind="leRewards"]'); rw.innerHTML = '';
      (out ? out.rewards : []).forEach(r => {
        if (r.coins) rw.appendChild(HR.U.el('span', 'reward-pill', '<i class="ic-coin"></i>+' + r.coins));
        if (r.gems) rw.appendChild(HR.U.el('span', 'reward-pill', '<i class="ic-gem"></i>+' + r.gems));
        if (r.skin) rw.appendChild(HR.U.el('span', 'reward-pill', HR.icon('unlock') + ' ' + HR.t('skin_' + r.skin)));
        if (r.trail) rw.appendChild(HR.U.el('span', 'reward-pill', HR.icon('unlock') + ' ' + HR.t('trail_' + r.trail)));
        if (r.theme) rw.appendChild(HR.U.el('span', 'reward-pill', HR.icon('unlock') + ' ' + HR.t('theme_' + r.theme)));
      });
      if (!rw.childElementCount) rw.textContent = '—';
      const next = HR.Campaign.next(level.id);
      $('#btn-le-next').style.display = (s.success && next) ? '' : 'none';
      this.setBase('levelend');
      if (s.success) { HR.Audio.sfx('win'); HR.U.vibrate([30, 40, 30, 40, 60]); if (stars === 3) setTimeout(() => HR.Audio.sfx('levelup'), 700); }
      else HR.Audio.sfx('error');
      res.ach.forEach((a, i) => this.achToast(a, i));
      if (res.ups.length) { this.pendingUps = res.ups; setTimeout(() => this.nextLevelUp(true), 1200); }
      HR.Audio.setIntensity(0.1);
    },
    levelEndNext() { const next = HR.Campaign.next(this.lastSummary.levelId); if (next) this.afterOver(() => this.startLevel(next.id)); },
    levelEndRetry() { this.afterOver(() => this.startLevel(this.lastSummary.levelId)); },
    stopHud() { if (this.hudRaf) { cancelAnimationFrame(this.hudRaf); this.hudRaf = null; } $('#fx-vignette').className = 'fx-vignette'; }
  });
})();
