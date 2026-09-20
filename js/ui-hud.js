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
      game.on('event', info => this.onEvent(info));
      game.on('flowbreak', () => { const v = $('#fx-vignette'); v.classList.add('flowbreak'); setTimeout(() => v.classList.remove('flowbreak'), 380); });
      game.on('combo', info => { const v = $('#fx-vignette'); v.classList.add('combo'); setTimeout(() => v.classList.remove('combo'), 260); this.banner(HR.t('combo', { n: info.n }), '', '#ffcf4a'); });
      game.on('autoperk', info => { const p = HR.Perks.def(info.id); if (p) this.toast(HR.icon(p.icon) + ' ' + HR.t('perk_auto_toast', { name: HR.Perks.name(info.id) }), 'good'); this.hudPerks(this.game.run); });
      game.on('discover', info => { const name = info.kind === 'ring' ? HR.t('rt_' + info.id) : HR.t('pk_' + info.id); this.toast(HR.icon('bag') + ' ' + HR.t('discover_new', { name }), 'good'); });

      const on = (id, fn) => { const el = $('#' + id); if (el) el.addEventListener('click', e => { e.stopPropagation(); fn(e); }); };
      on('btn-perk-skip', () => this.choosePerk(null));
      on('btn-perk-reroll', () => this.rerollPerks());
      on('perk-auto', () => { const s = HR.Store.data.settings; s.autoPerk = !s.autoPerk; HR.Store.save(); HR.Audio.sfx('click'); this.refreshAutoPerk(); if (s.autoPerk && this.game.state === 'perk') { const id = HR.Perks.autoPick(this.game.run); if (id) { this.choosePerk(id); this.game.begin(); } } });
      on('btn-le-next', () => this.levelEndNext());
      on('btn-le-retry', () => this.levelEndRetry());
      on('btn-le-menu', () => this.afterOver(() => { this.goMenu(); this.open('galaxy'); const id = this.lastSummary && this.lastSummary.levelId; if (id && HR.Singularity && HR.Singularity.isLevel(id)) { this.open('singularity'); return; } const L = id && HR.Campaign.level(id); if (L) { this.open('region', L.ri); if (L.si != null) this.open('system', L.ri + '-' + L.si); } }));
      HR.Input.onAbility = slot => { if (this.current === 'hud') this.game.useAbility(slot); };
      HR.Input.onAegis = () => { if (this.current === 'hud') this.game.useAegis(); };
      HR.Input.onJet = () => { if (this.current === 'hud') this.game.useJet(HR.Consumables.count('jet') > 0 ? 'jet' : 'megajet'); };
      game.on('gear', () => this.renderGear(this.game.run));
      const ctrl = $('#btn-ctrl'); if (ctrl) ctrl.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); this.cycleControl(); });
      HR.Input.onControl = () => { if (this.current === 'hud') this.cycleControl(); };
    },

    /* ---------- estado do HUD ---------- */
    hudReady(run) {
      this.refreshControlBtn();
      this.bind('score', run.score); this.bind('runCoins', run.coins);
      $('[data-bind="combo"]').classList.remove('show');
      this.setReadyHint(true);
      this.hudStatus(run); this.hudPerks(run); this.hudProgress(run); this.hudPhaseLabel();
      this.renderAbilityButtons(run);
      this.renderGear(run);
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
      if (run.level && run.level.sg) { lbl.textContent = HR.t('sg_title_' + run.level.archon) + ' · ' + (run.level.trial ? HR.t('sg_trial') : HR.t('sg_passage_n', { n: run.level.passage + 1 })); lbl.style.color = HR.ARCHONS[run.level.archon].color; }
      else if (run.level) { lbl.textContent = HR.t('level_n', { n: run.level.id }) + (run.level.boss ? ' · ' + HR.Campaign.bossName(run.level) : ''); lbl.style.color = HR.REGIONS[run.level.ri].accent; }
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
      Object.keys(run.perks).forEach(id => { const p = HR.Perks.def(id); if (!p) return; const el = HR.U.el('span', 'hud-perk rar-' + p.rarity, HR.icon(p.icon) + (run.perks[id] > 1 ? '<b>' + run.perks[id] + '</b>' : '')); el.setAttribute('data-tip', HR.Perks.name(id)); el.setAttribute('data-tip-d', HR.Perks.desc(id)); host.appendChild(el); });
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
    // Égide (botão com contador e recarga) e Jatos (só antes do 1º arco)
    renderGear(run) {
      const host = $('#hud-gear'), jets = $('#hud-jets'); if (!host || !jets || !run) return;
      const practice = run.mode === 'practice', desktop = !HR.U.isTouch(), esc = HR.UI.esc;
      const sk = HR.Gear.current('aegis'), n = HR.Consumables.count('aegis');
      host.innerHTML = practice ? '' : '<button type="button" class="gear-btn" id="gear-aegis" style="--ac:' + sk.color + '"' + HR.tip(HR.t('aegis'), HR.t('aegis_d')) + '><span class="gb-ring"></span><span class="gb-ic">' + HR.icon('aegis') + '</span><span class="gb-cd"></span><span class="gb-count">' + n + '</span>' + (desktop ? '<span class="ab-key">F</span>' : '') + '</button>';
      const b = $('#gear-aegis'); if (b) b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); this.game.useAegis(); });
      const L = run.level, allowJet = !practice && !(L && (L.boss || L.sg));
      let jh = '';
      if (allowJet && !run.jetUsed) ['jet', 'megajet'].forEach(k => { const c = HR.Consumables.count(k); if (!c) return; const G = HR.GEAR.consumables[k]; jh += '<button type="button" class="jet-btn" data-jet="' + k + '" style="--ac:' + G.color + '"' + HR.tip(HR.t(k), HR.t(k + '_d')) + '>' + HR.plate(G.icon, G.color, 'sm round') + '<span class="jet-txt"><b>' + esc(HR.t(k)) + (desktop && k === 'jet' ? ' <kbd>J</kbd>' : '') + '</b><small>×' + c + ' · ' + esc(HR.t('rings_n', { n: G.rings })) + '</small></span></button>'; });
      jets.innerHTML = jh;
      $$('.jet-btn', jets).forEach(btn => btn.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); this.game.useJet(btn.dataset.jet); }));
    },
    hudAbilityFx(info) {
      const btn = $$('#hud-abilities .ab-btn')[info.slot]; if (!btn) return;
      btn.classList.remove('fire'); void btn.offsetWidth; btn.classList.add('fire');
      if (!HR.Store.data.hints.ability) { HR.Store.data.hints.ability = true; HR.Store.save(); }
    },
    // chips dos poderes ativos (ícone + barra do tempo restante); ícone pisca no fim
    POWERS: [['jetLeft', 'jet', '#ffb347', 'jet'], ['aegisT', 'aegis', '#4cf0ff', 'aegis'], ['starT', 'star', '#ffe27a', 'pk_star'], ['ghostT', 'ghost', '#e8f0ff', 'ab_ghost'], ['cometT', 'comet', '#9be7ff', 'ab_comet'], ['phoenixT', 'phoenix', '#ff8a3d', 'ab_phoenix'], ['autoT', 'pilot', '#a29bfe', 'ab_autopilot'], ['magnetT', 'magnet', '#ffcf4a', 'ab_magnet'], ['bholeT', 'blackhole', '#a88bff', 'ab_blackhole'], ['slowmoT', 'hourglass', '#9be7ff', 'ab_slowmo'], ['chronoT', 'chrono', '#c3b8ff', 'ab_chrono'], ['freezeT', 'snow', '#dff8ff', 'ab_freeze'], ['lensT', 'lens', '#7cff6b', 'ab_lens'], ['prismT', 'prism', '#ff7ad9', 'ab_prism'], ['microT', 'micro', '#9dff8a', 'ab_micro'], ['goldT', 'goldrush', '#ffd24a', 'ab_goldrush'], ['echoT', 'echo', '#ff5ecf', 'ab_echo']],
    powerMax: {},
    hudPowers(run) {
      const host = $('#hud-powers'); if (!host) return;
      const active = this.POWERS.filter(p => run[p[0]] > 0 && !(p[0] === 'autoT' && (run.anomalyActive || run.autoT < 0.2)));
      const key = active.map(p => p[0]).join(',');
      if (host.dataset.key !== key) {
        host.dataset.key = key; host.innerHTML = '';
        active.forEach(p => { const el = HR.U.el('span', 'hud-power'); el.dataset.k = p[0]; el.style.setProperty('--c', p[2]); el.innerHTML = '<span class="hp-ic">' + HR.icon(p[1]) + '</span><span class="hp-name">' + HR.t(p[3]) + '</span><i class="hp-bar"><span></span></i>'; host.appendChild(el); this.powerMax[p[0]] = run[p[0]]; });
      }
      active.forEach(p => { const el = host.querySelector('[data-k="' + p[0] + '"]'); if (!el) return; const mx = Math.max(this.powerMax[p[0]] || 0, run[p[0]]); this.powerMax[p[0]] = mx; el.querySelector('.hp-bar span').style.width = (run[p[0]] / mx * 100).toFixed(0) + '%'; el.classList.toggle('ending', run[p[0]] < 1.5); });
    },
    onEvent(info) {
      const E = HR.CONFIG.EVENTS[info.id], v = $('#fx-vignette'), host = $('#hud-event');
      const name = HR.t('ev_' + info.id);
      if (info.phase === 'warn') { this.banner(name.toUpperCase(), HR.t('ev_warn'), E.color); v.classList.add('event'); setTimeout(() => v.classList.remove('event'), 1400); }
      else if (info.phase === 'start') {
        this.banner(name.toUpperCase(), HR.t('ev_' + info.id + '_d'), E.color);
        host.style.setProperty('--c', E.color); $('[data-bind="evIcon"]').innerHTML = HR.icon(E.icon); this.bind('evName', name); this.fill('evFill', 1);
        host.classList.add('show'); host.classList.toggle('timed', !!E.dur);
      } else {
        host.classList.remove('show');
        const sub = info.ok ? ((info.coins ? '+' + info.coins + ' ' + HR.t('coins_earned').toLowerCase() : '') + (info.score ? ' +' + info.score : '')).trim() : '';
        this.banner(HR.t(info.ok ? 'ev_done' : info.id === 'guardian' ? 'ev_escaped' : 'ev_fail'), sub, info.ok ? E.color : '#8d97b3');
      }
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
        const gb = $('#gear-aegis');
        if (gb) {
          const G = HR.GEAR.consumables.aegis, n = HR.Consumables.count('aegis'), active = run.aegisT > 0, cd = run.aegisCd > 0;
          gb.classList.toggle('active', active); gb.classList.toggle('ending', active && run.aegisT < 3); gb.classList.toggle('cd', cd);
          gb.classList.toggle('empty', !active && !cd && n <= 0); gb.classList.toggle('ready', !active && !cd && n > 0 && this.game.state === 'playing');
          gb.style.setProperty('--p', active ? (run.aegisT / G.dur).toFixed(3) : cd ? (1 - run.aegisCd / G.cd).toFixed(3) : '1');
          const cdEl = gb.querySelector('.gb-cd'), txt = cd ? String(Math.ceil(run.aegisCd)) : active ? String(Math.ceil(run.aegisT)) : ''; if (cdEl.textContent !== txt) cdEl.textContent = txt;
          const ce = gb.querySelector('.gb-count'); if (ce.textContent !== String(n)) ce.textContent = n;
        }
        const jetsEl = $('#hud-jets'); if (jetsEl) jetsEl.classList.toggle('show', !!jetsEl.childElementCount && !run.jetUsed && run.ringsResolved === 0 && (this.game.state === 'ready' || this.game.state === 'playing'));
        this.updateStick();
        $('#screen-hud').style.setProperty('--flow', run.flowV.toFixed(2));
        this.hudPowers(run);
        const ev = this.game.event; if (ev && ev.dur) this.fill('evFill', 1 - ev.t / ev.dur); else if (ev && ev.id === 'guardian') this.fill('evFill', 1 - ev.passed / 3);
        const v = $('#fx-vignette');
        v.classList.toggle('slowmo', run.slowmoT > 0);
        v.classList.toggle('ghost', run.ghostT > 0);
        v.classList.toggle('freeze', run.freezeT > 0);
        v.classList.toggle('magnet', run.magnetT > 0);
        v.classList.toggle('auto', run.autoT > 0 && !run.anomalyActive && !run.jetLeft);
        v.classList.toggle('jet', run.jetLeft > 0);
        v.classList.toggle('star', run.starT > 0);
        v.classList.toggle('adapt', run.adaptT > 0 && this.game.adaptScale() < 0.85);
        v.classList.toggle('ending', (run.powerEnding || 0) > 0);
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

    // v5.1: troca de controle sem sair da partida (botão no HUD, tecla C e seletor na pausa)
    CONTROLS: [['relative', 'ctrlDrag']],
    setControl(mode, silent) {
      const d = HR.Store.data; d.settings.control = mode;
      if (d.stats5) { d.stats5.controlsUsed = d.stats5.controlsUsed || []; if (!d.stats5.controlsUsed.includes(mode)) d.stats5.controlsUsed.push(mode); }
      HR.Store.save(); HR.Input.reset(); this.updateStick(); this.refreshControlBtn();
      const c = this.CONTROLS.find(x => x[0] === mode);
      if (!silent) { HR.Audio.sfx('click'); this.toast(HR.icon(c[1]) + ' ' + HR.t('control') + ': ' + HR.t('control_' + mode)); }
    },
    cycleControl() { const cur = this.game.controlMode(), i = this.CONTROLS.findIndex(c => c[0] === cur); this.setControl(this.CONTROLS[(i + 1) % this.CONTROLS.length][0]); },
    refreshControlBtn() {
      const b = $('#btn-ctrl'); if (!b) return;
      const m = this.game.controlMode(), c = this.CONTROLS.find(x => x[0] === m) || this.CONTROLS[0];
      b.innerHTML = '<span class="ic">' + HR.icon(c[1]) + '</span>';
      b.setAttribute('data-tip', HR.t('control') + ': ' + HR.t('control_' + m)); b.setAttribute('aria-label', HR.t('control'));
    },
    renderPauseControl() {
      const host = $('#pause-ctrl'); if (!host) return;
      const m = this.game.controlMode(); host.innerHTML = '';
      this.CONTROLS.forEach(([mode, ic]) => {
        const b = HR.U.el('button', 'pc-opt' + (mode === m ? ' active' : ''), HR.icon(ic) + '<span>' + HR.t('control_' + mode) + '</span>'); b.type = 'button';
        b.addEventListener('click', e => { e.stopPropagation(); this.setControl(mode, true); HR.Audio.sfx('click'); this.renderPauseControl(); });
        host.appendChild(b);
      });
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
      const level = HR.Campaign.level(s.levelId) || (HR.Singularity && HR.Singularity.level(s.levelId));
      let out = null;
      if (level && level.sg) { out = HR.Singularity.complete(level, s); if (s.success) { s.levelDone = 1; s.bossDone = level.trial ? 1 : 0; s.flawless = s.hits === 0 ? 1 : 0; } s.sgEcoNew = this.game.run.ecoNew ? 1 : 0; }
      else if (s.success) { out = HR.Campaign.complete(level, s); s.levelDone = 1; s.starsGot = out.newStars; s.threeStar = (out.stars === 3 && out.newStars > 0) ? 1 : 0; s.bossDone = level.boss ? 1 : 0; s.flawless = s.hits === 0 ? 1 : 0; }
      if (level && level.sg) { s.ecoFound = s.sgEcoNew || 0; s.sgPassage = s.success && !level.trial ? 1 : 0; s.sgTrial = s.success && level.trial ? 1 : 0; }
      else if (out) { s.systemDone = out.systemCleared ? 1 : 0; s.galaxyDone = out.regionCleared ? 1 : 0; }
      const res = this.processRunEnd(s);
      this.lastSummary = s; this.lastLevelResult = out;
      this.stopHud();
      const stars = out ? out.stars : 0;
      const sysName = level.sg ? HR.t('sg_title_' + level.archon) : level.si != null ? HR.t('system_n', { name: HR.Campaign.systemName(level.si) }) : HR.t('reg_' + level.region);
      if (level.sg) this.bind('levelendKicker', sysName + ' · ' + (level.trial ? HR.t('sg_trial') : HR.t('sg_passage_n', { n: level.passage + 1 })));
      else this.bind('levelendKicker', out && out.regionCleared ? HR.t('galaxy_cleared') : out && out.systemCleared ? HR.t('system_cleared') : (sysName + ' · ' + (level.boss ? HR.Campaign.bossName(level) : HR.t('level_n', { n: level.id }))));
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
        if (r.aegis) rw.appendChild(HR.U.el('span', 'reward-pill', HR.icon('aegis') + ' +' + r.aegis + ' ' + HR.t('aegis')));
        if (r.word) rw.appendChild(HR.U.el('span', 'reward-pill', HR.icon('word') + ' ' + HR.t('sg_word_' + r.word)));
        if (r.title) rw.appendChild(HR.U.el('span', 'reward-pill', HR.icon('crown') + ' ' + HR.t(r.title)));
      });
      if (!rw.childElementCount) rw.textContent = '—';
      sh.style.display = level.sg ? 'none' : '';
      const next = level.sg ? HR.Singularity.nextLevel(level) : HR.Campaign.next(level.id);
      $('#btn-le-next').style.display = (s.success && next && (level.sg ? HR.Singularity.canPlay(next.id) : HR.Campaign.isUnlocked(next.id))) ? '' : 'none';
      if (level.sg && s.sgEcoNew && HR.UI.showEco) setTimeout(() => HR.UI.showEco(level.archon, level.passage), 900);
      if (level.sg && out && out.passed && HR.UI.showArchonAfter) setTimeout(() => HR.UI.showArchonAfter(level.archon, out), 1200);
      this.setBase('levelend');
      if (s.success) { HR.Audio.sfx('win'); HR.U.vibrate([30, 40, 30, 40, 60]); if (stars === 3) setTimeout(() => HR.Audio.sfx('levelup'), 700); }
      else HR.Audio.sfx('error');
      res.ach.forEach((a, i) => this.achToast(a, i));
      if (res.ups.length) { this.pendingUps = res.ups; setTimeout(() => this.nextLevelUp(true), 1200); }
      HR.Audio.setIntensity(0.1);
    },
    levelEndNext() {
      const id = this.lastSummary.levelId, sg = HR.Singularity && HR.Singularity.isLevel(id);
      const next = sg ? HR.Singularity.nextLevel(HR.Singularity.level(id)) : HR.Campaign.next(id);
      if (next && (sg ? HR.Singularity.canPlay(next.id) : HR.Campaign.isUnlocked(next.id))) this.afterOver(() => this.startLevel(next.id));
    },
    levelEndRetry() { const s = this.lastSummary; if (!s || !s.levelId) { this.goMenu(); return; } this.afterOver(() => this.startLevel(s.levelId)); },
    stopHud() { if (this.hudRaf) { cancelAnimationFrame(this.hudRaf); this.hudRaf = null; } $('#fx-vignette').className = 'fx-vignette'; }
  });
})();
