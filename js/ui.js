/* =====================================================================
   Interface v4: navegação, menu órbita, fluxo de partida (Singularidade /
   Treino / Galáxia), pausa, continuar, resultado, missões (diárias e
   semanais), diário, ranking, ajustes, modais e toasts.
   Loja: js/ui-shop.js · HUD/perks/fim de fase: js/ui-hud.js
   Galáxia/região/fase/habilidades/conquistas: js/ui-galaxy.js
   ===================================================================== */
window.HR = window.HR || {};
const $ = (s, r) => HR.U.$(s, r), $$ = (s, r) => HR.U.$$(s, r);

HR.UI = {
  svg(name) { const map = { back: 'arrowLeft' }; return HR.icon(map[name] || name); },

  game: null, current: 'splash', stack: [], shopTab: 'skins', missionsTab: 'daily', lbTab: 'journey', achTab: 'all',
  previews: [], previewRaf: null, adResolve: null, adTimer: null, reviveTimer: null, lastSummary: null, pendingUps: [], abandon: false, missionTimerInt: null,
  PANELS: ['shop', 'galaxy', 'region', 'system', 'singularity', 'abilities', 'missions', 'achievements', 'daily', 'leaderboard', 'settings'],

  /* ---------------- inicialização ---------------- */
  init(game) {
    this.game = game;
    if (HR.Brand) HR.Brand.mount();
    $$('[data-icon]').forEach(el => { el.innerHTML = this.svg(el.getAttribute('data-icon')); });
    $$('[data-open]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); HR.Audio.sfx('click'); this.open(el.getAttribute('data-open'), el.getAttribute('data-tab')); }));
    $$('[data-back]').forEach(el => el.addEventListener('click', () => { HR.Audio.sfx('click'); this.back(); }));
    this.wireTabs('shop-tabs', t => { this.shopTab = t; this.renderShop(); });
    this.wireTabs('missions-tabs', t => { this.missionsTab = t; this.renderMissions(); });
    this.wireTabs('lb-tabs', t => { this.lbTab = t; this.renderLeaderboard(); });

    const on = (id, fn) => { const el = $('#' + id); if (el) el.addEventListener('click', e => { e.stopPropagation(); fn(e); }); };
    on('btn-play', () => this.play());
    on('btn-pause', () => this.pause());
    on('btn-resume', () => this.resume());
    on('btn-restart', () => { this.hideScreen('pause'); this.restartRun(); });
    on('btn-quit', () => this.quitToMenu());
    on('btn-pause-sound', () => { this.toggleSetting('sound'); this.refreshPauseButtons(); });
    on('btn-pause-music', () => { this.toggleSetting('music'); this.refreshPauseButtons(); });
    on('btn-pause-auto', () => { const s = HR.Store.data.settings; s.autoPerk = !s.autoPerk; HR.Store.save(); HR.Audio.sfx('click'); this.refreshPauseButtons(); });
    on('btn-revive-ad', () => this.reviveWithAd());
    on('btn-revive-gem', () => this.reviveWithGems());
    on('btn-revive-no', () => this.declineRevive());
    on('btn-double-coins', () => this.doubleCoins());
    on('btn-again', () => this.afterOver(() => this.restartRun()));
    on('btn-over-menu', () => this.afterOver(() => this.goMenu()));
    on('btn-share', () => HR.Share.share(this.lastSummary ? this.lastSummary.score : HR.Store.data.best));
    on('btn-levelup-ok', () => this.nextLevelUp(false));
    on('btn-ad-skip', () => this.finishAd(false));
    on('btn-ad-close', () => this.finishAd(true));
    on('btn-confirm-no', () => this.resolveConfirm(false));
    on('btn-confirm-yes', () => this.resolveConfirm(true));
    on('skin-prev', () => this.cycleSkin(-1));
    on('skin-next', () => this.cycleSkin(1));
    on('showcase-tap', () => this.play());
    on('btn-abilities-close', () => this.closeAbilityPicker());
    $$('#mode-seg .mode-btn').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); HR.Audio.sfx('click'); this.setMode(b.getAttribute('data-mode')); }));
    $('#screen-tutorial').addEventListener('pointerdown', () => this.finishTutorial());

    game.on('revive', run => this.showRevive(run));
    game.on('revived', run => { this.hideScreen('revive'); this.hudReady(run); });
    game.on('over', s => this.onGameOver(s));
    game.on('levelend', s => this.onLevelEnd(s));
    if (this.hudInit) this.hudInit(game);

    // toque/Espaço: começa a corrida; no teclado também continua da pausa, joga de novo e segue para a próxima fase
    HR.Input.onTap = e => {
      if (this.isModalOpen()) return;
      const kb = !!(e && e.type === 'keydown');
      if (this.current === 'hud') {
        if (this.game.state === 'ready') this.game.begin();
        else if (kb && this.game.state === 'paused') this.resume();
        else if (kb && this.game.state === 'playing') this.pause();   // v5.6: Espaço pausa
        return;
      }
      if (!kb || Date.now() - (this.baseAt || 0) < 700) return;
      const vis = el => el && el.offsetParent !== null && el.style.display !== 'none';
      if (this.current === 'over') { const b = $('#btn-again'); if (vis(b)) b.click(); }
      else if (this.current === 'levelend') { const n = $('#btn-le-next'), r = $('#btn-le-retry'); if (vis(n)) n.click(); else if (vis(r)) r.click(); }
      else if (this.current === 'menu' && !this.stack.length) { const p = $('#btn-play'); if (vis(p)) p.click(); }
    };
    HR.Input.onEscape = () => { if (this.current === 'hud' && ['playing', 'ready', 'transition'].includes(this.game.state)) this.pause(); };

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => this.layoutShowcase());
      ['scene', 'splash-showcase', 'app'].forEach(id => { const el = $('#' + id); if (el) ro.observe(el); });
    }
    this.refreshAll();
  },

  wireTabs(id, cb) {
    const host = $('#' + id); if (!host) return;
    $$('.tab', host).forEach(b => b.addEventListener('click', () => { HR.Audio.sfx('click'); $$('.tab', host).forEach(x => x.classList.toggle('active', x === b)); cb(b.getAttribute('data-tab')); }));
  },
  setTab(id, tab) { const host = $('#' + id); if (host) $$('.tab', host).forEach(x => x.classList.toggle('active', x.getAttribute('data-tab') === tab)); },
  bind(name, value) { $$('[data-bind="' + name + '"]').forEach(el => { el.textContent = value; }); },
  bindHtml(name, html) { $$('[data-bind="' + name + '"]').forEach(el => { el.innerHTML = html; }); },
  fill(name, frac) { $$('[data-bind="' + name + '"]').forEach(el => { el.style.width = (HR.U.clamp(frac, 0, 1) * 100).toFixed(1) + '%'; }); },
  isModalOpen() { return !!$('.modal.visible') || $('#screen-tutorial').classList.contains('visible'); },
  esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); },

  /* ---------------- telas ---------------- */
  showScreen(id) { const el = $('#screen-' + id); if (el) el.classList.add('visible'); },
  hideScreen(id) { const el = $('#screen-' + id); if (el) el.classList.remove('visible'); },
  setBase(id) {
    ['splash', 'menu', 'hud', 'over', 'levelend', 'pause', 'revive', 'tutorial'].forEach(s => this.hideScreen(s));
    this.closePanels(); this.showScreen(id); this.current = id; this.baseAt = Date.now();
    if (id !== 'hud' && this.stopHud) this.stopHud();
  },
  closePanels() { this.PANELS.forEach(s => this.hideScreen(s)); this.stack = []; this.stopPreviews(); },
  // a pilha de painéis pode sair de sincronia com o que está na tela; sem isso o
  // botão do painel some em silêncio e só volta ao trocar de tela
  syncStack() {
    const vis = id => { const el = $('#screen-' + id); return !!el && el.classList.contains('visible'); };
    if (this.stack.some(p => !vis(p))) this.stack = this.stack.filter(vis);
    if (!['menu', 'over', 'levelend'].includes(this.current)) {
      const base = ['menu', 'levelend', 'over'].find(vis);
      if (base && !vis('hud')) this.current = base;
    }
  },
  // open(panel, arg): arg = aba (loja/missões) ou índice da região
  open(panel, arg) {
    this.syncStack();
    if (!['menu', 'over', 'levelend'].includes(this.current)) return;
    if (this.stack.includes(panel) && panel !== 'region' && panel !== 'system') return;
    if (panel === 'shop' && arg) { this.shopTab = arg; this.setTab('shop-tabs', arg); }
    if (panel === 'missions' && arg) { this.missionsTab = arg; this.setTab('missions-tabs', arg); }
    if (!this.stack.includes(panel)) this.stack.push(panel);
    this.showScreen(panel);
    HR.Audio.sfx('open');
    const fn = { shop: 'renderShop', missions: 'renderMissions', daily: 'renderDaily', leaderboard: 'renderLeaderboard', settings: 'renderSettings', galaxy: 'renderGalaxy', region: 'renderRegion', system: 'renderSystem', singularity: 'renderSingularity', abilities: 'renderAbilities', achievements: 'renderAchievements' }[panel];
    if (fn && this[fn]) this[fn](arg);
    HR.Analytics.log('open_' + panel, panel === 'region' ? { ri: arg } : undefined);
  },
  back() {
    this.syncStack();
    const p = this.stack.pop(); if (p) this.hideScreen(p);
    this.stopPreviews();
    if (p === 'missions') { clearInterval(this.missionTimerInt); this.missionTimerInt = null; }
    if (p === 'region' && HR.Music && this.current === 'menu') HR.Music.play('menu');
    if (this.stack.length) { const top = this.stack[this.stack.length - 1]; if (top === 'galaxy' && this.renderGalaxy) this.renderGalaxy(); if (top === 'region' && this.renderRegion) this.renderRegion(); if (top === 'system' && this.renderSystem) this.renderSystem(); }
    if (this.current === 'menu') this.refreshMenu();
  },
  startPreviews() {}, stopPreviews() { if (this.previewRaf) cancelAnimationFrame(this.previewRaf); this.previewRaf = null; this.previews = []; },
  renderShop() { const b = $('#shop-body'); if (b) b.innerHTML = '<p class="lb-note">…</p>'; },

  toast(msg, kind) {
    const host = $('#toast-host');
    const el = HR.U.el('div', 'toast' + (kind ? ' ' + kind : ''), msg);
    while (host.childElementCount >= 3) host.firstElementChild.remove();
    host.appendChild(el);
    setTimeout(() => el.remove(), 2900);
  },
  confirm(title, html) {
    return new Promise(res => { this.confirmRes = res; this.bind('confirmTitle', title); this.bindHtml('confirmText', html); $('#modal-confirm').classList.add('visible'); });
  },
  resolveConfirm(v) { $('#modal-confirm').classList.remove('visible'); const r = this.confirmRes; this.confirmRes = null; if (r) r(v); },
  hideModals() { $$('.modal').forEach(m => m.classList.remove('visible')); },
  priceHtml(cur, n) { return '<i class="' + (cur === 'gems' ? 'ic-gem' : 'ic-coin') + '"></i> ' + HR.U.fmt(n); },

  /* ---------------- anúncio simulado ---------------- */
  showAdModal(o) {
    return new Promise(res => {
      this.adResolve = res;
      const m = $('#modal-ad'); m.classList.add('visible');
      const skip = $('#btn-ad-skip'), close = $('#btn-ad-close');
      skip.classList.remove('show'); close.classList.remove('show');
      let left = o.duration;
      this.bind('adCount', left);
      $('[data-i18n="reward_in"]').textContent = o.rewarded ? HR.t('reward_in') : HR.t('close');
      HR.Analytics.log('ad_mock_show', { rewarded: o.rewarded });
      clearInterval(this.adTimer);
      this.adTimer = setInterval(() => {
        left--; this.bind('adCount', Math.max(0, left));
        if (o.rewarded && left === o.duration - 1) skip.classList.add('show');
        if (left <= 0) { clearInterval(this.adTimer); close.classList.add('show'); skip.classList.remove('show'); }
      }, 1000);
    });
  },
  finishAd(ok) { clearInterval(this.adTimer); $('#modal-ad').classList.remove('visible'); const r = this.adResolve; this.adResolve = null; if (r) r(ok); },
  setBanner(on) { const b = $('#banner-slot'); b.classList.toggle('on', !!on); b.textContent = on ? 'banner 320×50 (AdMob)' : ''; },

  /* ---------------- loading ---------------- */
  setLoading(frac, text) { this.fill('loadFill', frac); if (text) this.bind('loadText', text); },
  TIPS: ['tip_1', 'tip_2', 'tip_3', 'tip_4', 'tip_5', 'tip_6', 'tip_7', 'tip_8', 'tip_9', 'tip_10', 'tip_11', 'tip_12'],
  lastTip: -1,
  rotateTip() { let i; do { i = Math.floor(Math.random() * this.TIPS.length); } while (i === this.lastTip); this.lastTip = i; this.bind('loadTip', HR.t(this.TIPS[i])); },

  /* ---------------- menu ---------------- */
  refreshCurrency() { this.bind('coins', HR.U.fmt(HR.Store.data.coins)); this.bind('gems', HR.U.fmt(HR.Store.data.gems)); },
  refreshMenu() {
    this.refreshCurrency();
    const p = HR.Progress.info(), d = HR.Store.data;
    this.bind('level', p.level); this.bind('levelTitle', p.title);
    $$('[data-bind="xpRing"]').forEach(c => { c.style.strokeDashoffset = (125.7 * (1 - p.frac)).toFixed(1); });
    const lr = $('.level-ring'); if (lr) lr.title = p.title + ' · ' + HR.U.fmt(p.xp) + ' / ' + HR.U.fmt(p.need) + ' XP';
    this.bind('best', HR.U.fmt(d.best));
    this.bind('rank', d.best > 0 ? '#' + HR.Leaderboard.global().myRank : '#–');
    this.bind('starsTotal', HR.Campaign.totalStars());
    const daily = HR.Daily.status().canClaim;
    $('[data-badge="missions"]').classList.toggle('on', HR.Missions.hasClaimable());
    $('[data-badge="daily"]').classList.toggle('on', daily);
    $('[data-badge="galaxy"]').classList.toggle('on', !d.hints.galaxy);
    $('#orbit-daily').classList.toggle('glow', daily);
    const S = HR.Seasons.current(), sc = $('#season-chip'); if (sc) { sc.hidden = !S; if (S) { sc.style.setProperty('--sc', S.accent); this.bind('seasonChip', HR.t('season_until', { name: HR.t('season_' + S.id), d: HR.Seasons.endLabel() })); } }
    this.game.bg.season = S;
    this.refreshMode();
    this.renderSlots();
    this.updateShowcaseCaption();
    this.layoutShowcase();
  },
  refreshAll() { this.refreshMenu(); },
  setMode(mode) { if (!HR.MODES.includes(mode)) mode = 'endless'; HR.Store.data.mode = mode; HR.Store.save(); this.refreshMode(); HR.Analytics.log('mode_select', { mode }); },
  refreshMode() {
    const mode = HR.Store.data.mode || 'endless';
    $$('#mode-seg .mode-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-mode') === mode));
    this.bind('modeDesc', HR.t('mode_' + mode + '_d'));
    const cur = HR.Campaign.currentLevel();
    this.bind('playLabel', mode === 'campaign' ? HR.t('level_n', { n: cur.id }).toUpperCase() : mode === 'practice' ? HR.t('mode_practice').toUpperCase() : HR.t('play'));
  },
  renderSlots() {
    const host = $('#ability-slots'); host.innerHTML = '';
    const eq = HR.Abilities.equipped(), slots = HR.Abilities.slots();
    for (let i = 0; i < 2; i++) {
      const id = eq[i], def = id ? HR.Abilities.def(id) : null;
      const locked = i >= slots;
      const el = HR.U.el('button', 'slot' + (def ? ' filled' : '') + (locked ? ' locked' : ''));
      if (locked) { el.innerHTML = '<span class="ic" data-icon="lock">' + HR.icon('lock') + '</span>'; el.title = HR.t('slot_locked_lvl', { n: HR.ABILITY_UPGRADE.secondSlotLevel }); el.addEventListener('click', e => { e.stopPropagation(); this.toast(HR.icon('lock') + ' ' + HR.t('slot_locked_lvl', { n: HR.ABILITY_UPGRADE.secondSlotLevel })); }); }
      else if (def) { el.style.setProperty('--ac', def.color); el.innerHTML = '<span class="ic">' + HR.icon(def.icon) + '</span><span class="slot-lv">' + HR.Abilities.level(id) + '</span>'; el.title = HR.Abilities.name(id); el.addEventListener('click', e => { e.stopPropagation(); HR.Audio.sfx('click'); this.openAbilityPicker(i); }); }
      else { el.innerHTML = '<span class="ic" data-icon="plus">' + HR.icon('plus') + '</span>'; el.title = HR.t('ability_slot_empty'); el.addEventListener('click', e => { e.stopPropagation(); HR.Audio.sfx('click'); this.openAbilityPicker(i); }); }
      host.appendChild(el);
    }
  },
  openAbilityPicker(slot) {
    const host = $('#ability-picker'); host.innerHTML = '';
    const eq = HR.Abilities.equipped();
    const owned = HR.ABILITIES.filter(a => HR.Abilities.owned(a.id));
    owned.forEach(a => {
      const row = HR.U.el('button', 'ab-row' + (eq[slot] === a.id ? ' on' : ''));
      row.innerHTML = '<span class="ab-row-ic" style="color:' + a.color + '">' + HR.icon(a.icon) + '</span><span class="ab-row-info"><span class="ab-row-name">' + HR.Abilities.name(a.id) + '</span><span class="ab-row-meta">' + HR.t('cooldown') + ' ' + HR.Abilities.cooldown(a.id).toFixed(0) + 's' + (a.dur ? ' · ' + HR.t('duration') + ' ' + HR.Abilities.duration(a.id).toFixed(1) + 's' : '') + ' · ' + HR.t('ab_level', { n: HR.Abilities.level(a.id) }) + '</span></span>' + (eq[slot] === a.id ? '<span class="ab-row-state">' + HR.t('equipped_slot') + '</span>' : '');
      row.addEventListener('click', () => { HR.Audio.sfx('click'); HR.Abilities.equip(slot, a.id); this.closeAbilityPicker(); this.renderSlots(); if (this.stack.includes('abilities') && this.renderAbilities) this.renderAbilities(); });
      host.appendChild(row);
    });
    if (eq[slot]) { const none = HR.U.el('button', 'ab-row', '<span class="ab-row-ic">' + HR.icon('x') + '</span><span class="ab-row-info"><span class="ab-row-name">' + HR.t('cancel') + '</span></span>'); none.addEventListener('click', () => { HR.Abilities.equip(slot, null); this.closeAbilityPicker(); this.renderSlots(); if (this.stack.includes('abilities') && this.renderAbilities) this.renderAbilities(); }); host.appendChild(none); }
    if (!this.stack.includes('abilities')) {
      const shop = HR.U.el('button', 'btn btn-gem', '<span class="ic" data-icon="zap">' + HR.icon('zap') + '</span><span class="btn-label">' + HR.t('abilities') + '</span>');
      shop.addEventListener('click', () => { this.closeAbilityPicker(); this.open('abilities'); });
      host.appendChild(shop);
    }
    $('#modal-abilities').classList.add('visible');
  },
  closeAbilityPicker() { $('#modal-abilities').classList.remove('visible'); },

  /* ---------------- vitrine (bola do menu) e órbita ---------------- */
  layoutShowcase() {
    if (!this.game || !this.game.scale) return;
    const cr = this.game.canvas.getBoundingClientRect();
    if (this.current === 'splash') {
      const el = $('#splash-showcase'); const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
      const rad = Math.min(r.height * 0.21, 64);
      this.game.setShowcase((r.left + r.width / 2 - cr.left) / this.game.scale, (r.top + r.height / 2 - cr.top) / this.game.scale, rad / this.game.scale);
      return;
    }
    const scene = $('#scene'); if (!scene) return;
    const sr = scene.getBoundingClientRect(); if (!sr.width || !sr.height) return;
    const R = HR.U.clamp(Math.min(sr.width / 2 - 44, sr.height / 2 - 26), 84, 150);
    const rad = HR.U.clamp(R * 0.37, 30, 56);
    scene.style.setProperty('--R', R.toFixed(0) + 'px');
    scene.style.setProperty('--ball-d', (rad * 2).toFixed(0) + 'px');
    this.layoutOrbit(scene, sr);
    this.game.setShowcase((sr.left + sr.width / 2 - cr.left) / this.game.scale, (sr.top + sr.height / 2 - cr.top) / this.game.scale, rad / this.game.scale);
  },
  // v5.1: 4 botões de cada lado, distribuídos de cima a baixo num arco (elipse); tamanho se adapta à altura
  layoutOrbit(scene, sr) {
    const btns = HR.U.$$('.orbit-btn', scene); if (!btns.length) return;
    const left = [], right = [], sin = o => Math.sin(o.a * Math.PI / 180);
    btns.forEach(b => { const a = parseFloat(b.style.getPropertyValue('--a')) || 0, n = ((a % 360) + 360) % 360; (n > 90 && n < 270 ? left : right).push({ b, a: n }); });
    left.sort((p, q) => sin(p) - sin(q)); right.sort((p, q) => sin(p) - sin(q));
    const rows = Math.max(left.length, right.length), step = Math.min(96, (sr.height - 14) / rows);
    const size = step >= 84 ? 62 : step >= 70 ? 54 : 46;
    const Ry = step * rows / 2 + step * 0.25, Rx = Math.min(sr.width / 2 - size / 2 - 12, 190);
    scene.classList.add('orbit2'); scene.classList.toggle('orbit-compact', step < 70);
    scene.style.setProperty('--Rx', Rx.toFixed(0) + 'px'); scene.style.setProperty('--Ry', Ry.toFixed(0) + 'px'); scene.style.setProperty('--ob', size + 'px');
    const place = (list, sign) => list.forEach((o, i) => {
      const y = (i - (list.length - 1) / 2) * step, k = Math.sqrt(Math.max(0, 1 - (y / Ry) * (y / Ry)));
      o.b.style.setProperty('--x', (sign * Rx * k).toFixed(1) + 'px'); o.b.style.setProperty('--y', (y - 8).toFixed(1) + 'px');
    });
    place(left, -1); place(right, 1);
  },
  showcaseList() { return HR.CONFIG.SKINS.filter(s => (!['pack', 'iap', 'reward', 'archon'].includes(s.cur) && !s.season) || HR.Unlocks.owned('skins', s.id)); },
  cycleSkin(dir) {
    HR.Audio.sfx('click');
    const list = this.showcaseList();
    const curId = this.game.showcaseSkin ? this.game.showcaseSkin.id : HR.Store.data.equipped.skin;
    let i = list.findIndex(s => s.id === curId); if (i < 0) i = 0;
    const skin = list[(i + dir + list.length) % list.length];
    if (HR.Unlocks.owned('skins', skin.id)) { HR.Unlocks.equip('skins', skin.id); this.game.applyCosmetics(); this.game.showcaseSkin = null; }
    else this.game.showcaseSkin = skin;
    this.updateShowcaseCaption();
  },
  updateShowcaseCaption() {
    const d = HR.Store.data;
    const skin = this.game.showcaseSkin || HR.CONFIG.SKINS.find(s => s.id === d.equipped.skin) || HR.CONFIG.SKINS[0];
    const owned = HR.Unlocks.owned('skins', skin.id);
    this.bind('skinName', HR.t('skin_' + skin.id));
    const sub = $('[data-bind="skinSub"]');
    if (owned) sub.innerHTML = '<span style="color:var(--green)">' + HR.icon('check') + '</span>' + HR.t('equipped');
    else if (d.level < skin.lvl) sub.innerHTML = HR.icon('lock') + ' ' + HR.t('locked_lvl', { n: skin.lvl });
    else sub.innerHTML = '<i class="' + (skin.cur === 'gems' ? 'ic-gem' : 'ic-coin') + '"></i>' + HR.U.fmt(skin.price) + ' · ' + HR.t('tap_shop');
  },

  /* ---------------- fluxo do jogo ---------------- */
  play() {
    const mode = HR.Store.data.mode || 'endless';
    if (mode === 'campaign') { this.open('galaxy'); return; }
    this.startGame(mode);
  },
  startGame(mode) {
    HR.Audio.unlock();
    this.closePanels(); this.hideModals();
    HR.Ads.banner(false);
    this.game.prepareRun({ mode });
    this.setBase('hud');
    if (!HR.Store.data.tutorialDone) { this.showScreen('tutorial'); this.setReadyHint(false); }
    else if (mode === 'practice') this.toast(HR.t('practice_note'));
    HR.Analytics.log('run_start', { mode, level: HR.Store.data.level });
  },
  startLevel(id) {
    const sg = !!(HR.Singularity && HR.Singularity.isLevel(id));
    const level = sg ? HR.Singularity.level(id) : HR.Campaign.level(id); if (!level) return;
    if (sg ? !HR.Singularity.canPlay(id) : !HR.Campaign.isUnlocked(id)) { this.toast(HR.icon('lock') + ' ' + HR.t('locked'), 'bad'); return; }
    HR.Audio.unlock();
    if (!sg) { HR.Store.data.campaign.last = id; HR.Store.data.campaign.lastRegion = level.ri; HR.Store.data.mode = 'campaign'; HR.Store.data.hints.galaxy = true; }
    HR.Store.save();
    this.closePanels(); this.hideModals();
    HR.Ads.banner(false);
    this.game.prepareRun({ mode: 'campaign', level });
    this.setBase('hud');
    if (!HR.Store.data.tutorialDone) { this.showScreen('tutorial'); this.setReadyHint(false); }
    HR.Analytics.log('run_start', { mode: 'campaign', levelId: id });
  },
  restartRun() {
    const s = this.lastSummary, run = this.game.run;
    if (['playing', 'ready', 'transition', 'paused', 'perk'].includes(this.game.state)) { this.abandon = true; this.game.finishRun(false); }
    const mode = (s && s.mode) || run.mode || 'endless';
    if (mode === 'campaign') this.startLevel((s && s.levelId) || (run.level && run.level.id) || HR.Campaign.currentLevel().id);
    else this.startGame(mode);
  },
  finishTutorial() { HR.Store.data.tutorialDone = true; HR.Store.save(); this.hideScreen('tutorial'); this.setReadyHint(true); HR.Analytics.log('tutorial_done'); },
  setReadyHint(on) { $('[data-bind="ready"]').classList.toggle('show', !!on); },

  pause() {
    if (!['playing', 'ready', 'transition'].includes(this.game.state)) return;
    this.game.pause(); HR.Audio.sfx('click');
    this.bind('pauseScore', this.game.run.score);
    this.renderBuild($('[data-bind="pauseBuild"]'), this.game.run.perks);
    this.refreshPauseButtons();
    this.showScreen('pause');
    HR.Analytics.log('pause');
  },
  renderBuild(host, perks) {
    if (!host) return; host.innerHTML = '';
    Object.keys(perks || {}).forEach(id => { const p = HR.Perks.def(id); if (!p) return; const el = HR.U.el('span', 'hud-perk rar-' + p.rarity, HR.icon(p.icon) + (perks[id] > 1 ? '<b>' + perks[id] + '</b>' : '')); el.title = HR.Perks.name(id); host.appendChild(el); });
  },
  refreshPauseButtons() {
    const s = HR.Store.data.settings;
    $('#btn-pause-sound').style.opacity = s.sound ? 1 : 0.4;
    $('#btn-pause-music').style.opacity = s.music ? 1 : 0.4;
    const auto = $('#pause-auto-state'); if (auto) auto.classList.toggle('on', !!s.autoPerk);
    const ab = $('#btn-pause-auto'); if (ab) ab.style.display = this.game.run.mode === 'practice' ? 'none' : '';
    if (this.renderPauseControl) this.renderPauseControl();
  },
  resume() { this.hideScreen('pause'); this.game.resume(); if (this.game.state === 'ready') this.hudReady(this.game.run); },
  quitToMenu() { this.hideScreen('pause'); this.abandon = true; this.game.finishRun(false); },
  goMenu() {
    this.hideModals();
    this.setBase('menu'); this.game.showcaseSkin = null; this.game.startAttract(); this.refreshMenu();
    this.layoutShowcase(); setTimeout(() => this.layoutShowcase(), 120);
    HR.Ads.banner(true); HR.Audio.setIntensity(0);
    if (HR.Music) HR.Music.play('menu');
  },

  /* ---------------- continuar ---------------- */
  showRevive(run) {
    const R = HR.CONFIG.RUN;
    const cost = R.reviveGems[Math.min(run.revives, R.reviveGems.length - 1)];
    this.bind('reviveGemCost', HR.U.fmt(R.reviveCoins[Math.min(run.revives, R.reviveCoins.length - 1)]));
    $('#btn-revive-ad').style.display = HR.Ads.isRewardedReady() ? '' : 'none';
    this.showScreen('revive');
    const total = R.reviveSeconds; let left = total, shown = total;
    this.bind('reviveCount', shown);
    const fillEl = $('#screen-revive .fill'); fillEl.style.strokeDashoffset = 0;
    clearInterval(this.reviveTimer);
    this.reviveTimer = setInterval(() => {
      left -= 0.1;
      fillEl.style.strokeDashoffset = (276 * (1 - Math.max(0, left) / total)).toFixed(1);
      const c = Math.ceil(left);
      if (c !== shown && c >= 0) { shown = c; this.bind('reviveCount', shown); HR.Audio.sfx('tick'); }
      if (left <= 0) this.declineRevive();
    }, 100);
    HR.Analytics.log('revive_offer', { score: run.score, revives: run.revives });
  },
  clearRevive() { clearInterval(this.reviveTimer); this.reviveTimer = null; this.hideScreen('revive'); },
  async reviveWithAd() {
    clearInterval(this.reviveTimer);
    const ok = await HR.Ads.showRewarded('revive');
    if (ok) { this.clearRevive(); this.game.revive(); HR.Analytics.log('revive_ad'); }
    else if (this.game.state === 'revive') this.showRevive(this.game.run);
  },
  // v5: continuar é mecânica → só moedas (ou anúncio)
  reviveWithGems() {
    const R = HR.CONFIG.RUN, run = this.game.run;
    const cost = R.reviveCoins[Math.min(run.revives, R.reviveCoins.length - 1)];
    if (HR.Store.data.coins < cost) { this.toast(HR.t('not_enough_coins'), 'bad'); HR.Audio.sfx('error'); return; }
    HR.Economy.spendCoins(cost, 'revive');
    this.clearRevive(); this.game.revive(); HR.Analytics.log('revive_coins', { cost });
  },
  declineRevive() { this.clearRevive(); this.game.declineRevive(); },

  /* ---------------- fim de partida ---------------- */
  // atualiza estatísticas, economia, XP, missões e conquistas; usado por Singularidade, Treino e Galáxia
  processRunEnd(s) {
    const d = HR.Store.data, st = d.stats;
    d.runs++; d.ads.runsSince++; d.totalRings += s.score; d.totalPerfects += s.perfects;
    if (s.mode === 'endless') st.endlessRuns++; else if (s.mode === 'practice') st.practiceRuns++;
    st.timePlayed += s.duration; st.distance += s.distKm; st.dirChanges += s.dirChanges; st.nearMisses += s.nearMisses;
    st.goldRings += s.goldRings; st.doubleRings += s.doubleRings; st.comboBonuses += s.comboBonuses;
    let isRecord = false;
    if (s.mode === 'endless') { isRecord = s.score > d.best && s.score > 0; if (isRecord) d.best = s.score; HR.Leaderboard.submit(s.score, { phase: s.phase }); d.bestPhase = Math.max(d.bestPhase, s.phase); }
    d.bestCombo = Math.max(d.bestCombo, s.maxCombo);
    HR.Store.save();
    HR.Economy.addCoins(s.coins, 'run_' + s.mode);
    // v5: as primeiras partidas do dia dão XP em dobro (aproxima quem joga pouco de quem joga muito)
    const P5 = HR.CONFIG.PROGRESSION, xb = d.xpBonus || (d.xpBonus = { date: null, used: 0 }), today = HR.U.dateKey();
    if (xb.date !== today) { xb.date = today; xb.used = 0; }
    if (s.xp > 0 && s.mode !== 'practice' && xb.used < P5.dailyBonusRuns) { xb.used++; s.xpBonus = Math.round(s.xp * (P5.dailyBonusMul - 1)); s.xp += s.xpBonus; }
    const ups = s.xp > 0 ? HR.Progress.addXp(s.xp) : [];
    if (s.mode !== 'practice') HR.Missions.onRunEnd(s);
    if (d.stats5) d.stats5.speedPct = Math.max(d.stats5.speedPct || 0, s.speedPct || 0);
    st.flowMax = Math.max(st.flowMax || 0, s.flowMax || 0); st.flowTime = (st.flowTime || 0) + (s.flowTime || 0); st.centerPickups = (st.centerPickups || 0) + (s.centerPickups || 0); st.eventsDone = (st.eventsDone || 0) + (s.eventsDone || 0); st.guardians = (st.guardians || 0) + (s.guardians || 0); st.shattered = (st.shattered || 0) + (s.shattered || 0); st.sentinels = (st.sentinels || 0) + (s.sentinels || 0); st.warps = (st.warps || 0) + (s.warps || 0); st.asteroidsDestroyed = (st.asteroidsDestroyed || 0) + (s.asteroidsDestroyed || 0);
    const contracts = HR.Campaign.onRunEnd(s);
    contracts.forEach((c, i) => { setTimeout(() => this.toast(HR.icon('flag') + ' ' + HR.t('contract_done', { name: HR.Campaign.contractText(c) }) + ' +' + c.coins + ' <i class="ic-coin"></i> +' + c.gems + ' <i class="ic-gem"></i> +' + c.xp + ' XP', 'good'), 900 + i * 800); ups.push.apply(ups, HR.Progress.addXp(c.xp)); });
    const ach = HR.Achievements.check();
    if (HR.Online) HR.Online.submit();
    HR.Analytics.log('run_end', { mode: s.mode, levelId: s.levelId, success: s.success, score: s.score, coins: s.coins, perfects: s.perfects, phase: s.phase, duration: s.duration, revives: s.revives, perks: Object.keys(s.perks).length, record: isRecord });
    s.isRecord = isRecord; s.doubled = false;
    return { ups, ach, isRecord };
  },
  achToast(a, i) {
    setTimeout(() => this.toast(HR.icon('trophy') + ' ' + HR.t('achievement_unlocked', { name: HR.t('a_' + a.id) }) + ' +' + a.gems + ' <i class="ic-gem"></i>' + (a.title ? ' · ' + HR.t('ach_title_get', { t: HR.t(a.title) }) : ''), 'good'), 600 + i * 700);
  },
  grantXp(n) { const ups = HR.Progress.addXp(n); if (ups.length) { this.pendingUps = ups; setTimeout(() => this.nextLevelUp(true), 300); } this.refreshMenu(); },
  onGameOver(s) {
    const res = this.processRunEnd(s);
    this.lastSummary = s;
    HR.Audio.setIntensity(0.1);
    if (this.abandon) { this.abandon = false; this.goMenu(); res.ach.forEach((a, i) => this.achToast(a, i)); return; }
    const d = HR.Store.data, before = HR.Progress.info();
    this.bind('overBest', HR.U.fmt(d.best));
    $('[data-bind="recordTag"]').classList.toggle('show', res.isRecord);
    this.bind('overCoins', '+' + HR.U.fmt(s.coins) + (s.mode === 'practice' ? ' (½)' : ''));
    this.bind('overPerfects', s.perfects); this.bind('overCombo', s.maxCombo); this.bind('overPhase', s.phase); this.bind('overMisses', s.misses); this.bind('overPickups', s.pickups);
    this.bind('overXp', '+' + s.xp + ' XP' + (s.xpBonus ? ' · ×2' : ''));
    this.renderBuild($('[data-bind="overBuild"]'), s.perks);
    const xpFrac = res.ups.length ? 1 : HR.Progress.info().frac;
    this.bind('overLevel', before.level); this.fill('overXpFill', Math.max(0, before.frac - (s.xp / before.need)));
    const dbl = $('#btn-double-coins');
    dbl.style.display = (s.mode !== 'practice' && s.coins >= HR.CONFIG.ADS.doubleCoinsMin && HR.Ads.isRewardedReady()) ? '' : 'none';
    dbl.disabled = false;
    this.setBase('over');
    const el = $('[data-bind="overScore"]'); const t0 = performance.now(), dur = Math.min(900, 200 + s.score * 25);
    const tick = now => { const k = Math.min(1, (now - t0) / dur); el.textContent = Math.round(HR.U.easeOutCubic(k) * s.score); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    setTimeout(() => { const after = HR.Progress.info(); this.bind('overLevel', after.level); this.fill('overXpFill', xpFrac); }, 400);
    if (res.isRecord) { HR.Audio.sfx('record'); HR.U.vibrate([30, 40, 30, 40, 60]); }
    res.ach.forEach((a, i) => this.achToast(a, i));
    if (res.ups.length) { this.pendingUps = res.ups; setTimeout(() => this.nextLevelUp(true), 1100); }
  },
  async afterOver(next) { await HR.Ads.maybeInterstitial('game_over'); next(); },
  async doubleCoins() {
    const s = this.lastSummary; if (!s || s.doubled) return;
    const btn = $('#btn-double-coins'); btn.disabled = true;
    const ok = await HR.Ads.showRewarded('double_coins');
    if (ok) { s.doubled = true; HR.Economy.addCoins(s.coins, 'double'); this.bind('overCoins', '+' + HR.U.fmt(s.coins * 2) + ' (x2)'); btn.style.display = 'none'; HR.Audio.sfx('reward'); this.toast(HR.t('coins_added', { n: s.coins }), 'good'); }
    else btn.disabled = false;
  },
  nextLevelUp(first) {
    const modal = $('#modal-levelup');
    if (!first) { modal.classList.remove('visible'); HR.Audio.sfx('click'); }
    const up = this.pendingUps.shift();
    if (!up) { this.refreshMenu(); return; }
    this.bind('levelupNum', up.level); this.bind('levelupTitle', HR.t(HR.Progress.titleKey(up.level)));
    const host = $('[data-bind="levelupRewards"]'); host.innerHTML = '';
    if (up.rewards.coins) host.appendChild(HR.U.el('span', 'reward-pill', '<i class="ic-coin"></i> +' + up.rewards.coins));
    if (up.rewards.gems) host.appendChild(HR.U.el('span', 'reward-pill', '<i class="ic-gem"></i> +' + up.rewards.gems));
    up.unlocks.forEach(u => host.appendChild(HR.U.el('span', 'reward-pill', HR.icon('unlock') + ' ' + HR.t((u.type === 'skin' ? 'skin_' : u.type === 'trail' ? 'trail_' : 'theme_') + u.id))));
    if (up.level === HR.ABILITY_UPGRADE.secondSlotLevel) host.appendChild(HR.U.el('span', 'reward-pill', HR.icon('unlock') + ' ' + HR.t('ability') + ' 2'));
    HR.Audio.sfx('levelup'); HR.U.vibrate([20, 30, 20, 30, 80]);
    setTimeout(() => modal.classList.add('visible'), first ? 0 : 150);
  },

  productName(p) { return p.type === 'gems' ? HR.t('prod_gems', { n: HR.U.fmt(p.gems) }) : HR.t('prod_' + p.id); },
  productPrice(p) { return HR.IAP.price(p); },

  /* ---------------- missões (diárias e semanais) ---------------- */
  renderMissions() {
    this.setTab('missions-tabs', this.missionsTab);
    const body = $('#missions-body'); body.innerHTML = '';
    HR.Missions.ensureDaily();
    const weekly = this.missionsTab === 'weekly';
    const upd = () => this.bind('missionTimer', weekly ? HR.t('resets_in', { t: HR.U.fmtCountdown(HR.Missions.msToWeekReset()) }) : HR.t('resets_in', { t: HR.U.fmtCountdown(HR.U.msToMidnight()) }));
    upd(); clearInterval(this.missionTimerInt); this.missionTimerInt = setInterval(upd, 30000);
    const dc = HR.Missions.doneCount(weekly ? 'weekly' : 'daily');
    body.appendChild(HR.U.el('div', 'm-summary', '<span class="kicker">' + HR.t(weekly ? 'tab_weekly' : 'tab_daily_missions') + '</span><b class="num">' + HR.t('m_done_n', { a: dc.a, b: dc.b }) + '</b>' + (weekly ? '<span class="muted small">' + HR.t('weekly_note') + '</span>' : '')));
    const d = HR.Store.data;
    HR.Missions.list(weekly ? 'weekly' : 'daily').forEach(m => {
      const card = HR.U.el('div', 'mission' + (m.done ? ' done' : '') + (m.claimed ? ' claimed' : '') + (m.weekly ? ' weekly' : ''));
      card.innerHTML = '<div class="m-ic">' + HR.icon(m.icon) + '</div><div class="m-info"><div class="m-title">' + m.text + '</div><div class="bar' + (m.done ? ' green' : '') + '"><span class="bar-fill" style="width:' + (m.progress / m.target * 100).toFixed(0) + '%"></span></div><div class="m-meta"><span class="num">' + HR.U.fmt(m.progress) + ' / ' + HR.U.fmt(m.target) + '</span><span class="m-reward">' + (m.coins ? '<i class="ic-coin"></i>' + m.coins : '') + (m.gems ? ' <i class="ic-gem"></i>' + m.gems : '') + (m.xp ? ' <b class="xp">+' + m.xp + ' XP</b>' : '') + '</span></div></div>';
      if (m.claimed) card.appendChild(HR.U.el('span', 'm-check', HR.icon('check')));
      else if (m.done) { const b = HR.U.el('button', 'btn btn-reward small-btn', '<span class="btn-label">' + HR.t('claim') + '</span>'); b.addEventListener('click', () => this.claimMission(m.uid)); card.appendChild(b); }
      else if (!m.weekly && d.missions.rerolls < HR.CONFIG.MISSION_REROLLS && HR.Ads.isRewardedReady()) { const b = HR.U.el('button', 'btn-icon m-reroll', this.svg('refresh')); b.title = HR.t('reroll'); b.addEventListener('click', () => this.rerollMission(m.uid)); card.appendChild(b); }
      body.appendChild(card);
    });
    if (!weekly) body.appendChild(HR.U.el('p', 'lb-note', HR.t('reroll_left', { n: Math.max(0, HR.CONFIG.MISSION_REROLLS - d.missions.rerolls) })));
  },
  claimMission(uid) {
    const m = HR.Missions.claim(uid); if (!m) return;
    HR.Audio.sfx('reward'); this.toast(HR.icon('check') + ' ' + HR.t('mission_complete') + ' +' + m.coins + ' <i class="ic-coin"></i>' + (m.gems ? ' +' + m.gems + ' <i class="ic-gem"></i>' : ''), 'good');
    const ach = HR.Achievements.check(); ach.forEach((a, i) => this.achToast(a, i));
    this.renderMissions(); this.refreshMenu();
  },
  async rerollMission(uid) { const ok = await HR.Ads.showRewarded('reroll'); if (ok) { HR.Missions.reroll(uid); HR.Audio.sfx('whoosh'); this.renderMissions(); } },

  /* ---------------- diário ---------------- */
  renderDaily() {
    const body = $('#daily-body'); body.innerHTML = '';
    const st = HR.Daily.status();
    body.appendChild(HR.U.el('p', 'daily-info', HR.t('streak', { n: st.streak }) + '<br>' + (st.canClaim ? HR.t('daily_ready') : HR.t('come_back'))));
    const grid = HR.U.el('div', 'daily-grid'); body.appendChild(grid);
    HR.CONFIG.DAILY.forEach((r, i) => {
      const el = HR.U.el('div', 'day' + (i < st.claimedCount ? ' claimed' : '') + (i === st.dayIndex ? ' today' : '') + (i === 6 ? ' big' : ''));
      const val = (r.coins ? '<span class="d-val"><i class="ic-coin"></i>' + r.coins + '</span>' : '') + (r.gems ? '<span class="d-val"><i class="ic-gem"></i>' + r.gems + '</span>' : '');
      el.innerHTML = '<span class="d-num">' + HR.t('day') + ' ' + (i + 1) + '</span>' + val;
      grid.appendChild(el);
    });
    const btn = HR.U.el('button', 'btn btn-reward', '<span class="ic" data-icon="gift">' + HR.icon('gift') + '</span><span class="btn-label">' + (st.canClaim ? HR.t('claim') : HR.t('claimed')) + '</span>');
    btn.disabled = !st.canClaim;
    btn.addEventListener('click', () => {
      const r = HR.Daily.claim(); if (!r) return;
      HR.Audio.sfx('reward'); HR.U.vibrate([20, 30, 40]);
      this.toast((r.coins ? HR.t('coins_added', { n: r.coins }) : '') + (r.gems ? ' ' + HR.t('gems_added', { n: r.gems }) : ''), 'good');
      const ach = HR.Achievements.check(); ach.forEach((a, i) => this.achToast(a, i));
      this.renderDaily(); this.refreshMenu();
    });
    body.appendChild(btn);
    if (HR.Store.data.vip) {
      const p = HR.CONFIG.PRODUCTS.find(x => x.id === 'vip');
      const vb = HR.U.el('button', 'btn btn-gem', '<span class="ic" data-icon="crown">' + HR.icon('crown') + '</span><span class="btn-label">' + HR.t('daily_bonus_vip') + ' · ' + p.gemsDaily + ' <i class="ic-gem"></i> ' + p.coinsDaily + ' <i class="ic-coin"></i></span>');
      vb.style.marginTop = '10px'; vb.disabled = !st.vipToday;
      vb.addEventListener('click', () => { const r = HR.Daily.claimVip(); if (r) { HR.Audio.sfx('reward'); this.renderDaily(); this.refreshMenu(); } });
      body.appendChild(vb);
    }
  },

  /* ---------------- ranking ---------------- */
  // v5: Jornada % (quanto do jogo zerou) · Infinito (recorde) · Meus recordes — online via HR.Online
  renderLeaderboard() {
    if (!['journey', 'endless', 'local'].includes(this.lbTab)) this.lbTab = 'journey';
    this.setTab('lb-tabs', this.lbTab);
    const body = $('#lb-body'); body.innerHTML = '';
    const tab = this.lbTab, O = HR.Online;
    const nr = HR.U.el('form', 'lb-name-row');
    nr.innerHTML = HR.plate('user', '#4cf0ff', 'sm') + '<label class="lb-name-main"><small>' + this.esc(HR.t('lb_name')) + '</small><input type="text" maxlength="18" value="' + this.esc(O.name()) + '"></label><button type="submit" class="btn btn-play small-btn">' + this.esc(HR.t('lb_save')) + '</button>';
    nr.addEventListener('submit', e => { e.preventDefault(); if (O.setName($('input', nr).value)) { this.toast(HR.icon('check') + ' ' + HR.t('lb_saved'), 'good'); O.cache = {}; this.renderLeaderboard(); } else this.toast(HR.t('lb_name_bad'), 'bad'); });
    body.appendChild(nr);
    if (tab !== 'local') {
      const d = HR.Store.data, journey = tab === 'journey';
      body.appendChild(HR.U.el('div', 'lb-me', HR.plate(journey ? 'percent' : 'infinity', journey ? '#ffcf4a' : '#4cf0ff') + '<div class="lb-me-main"><span class="kicker">' + this.esc(HR.t(journey ? 'lb_you_pct' : 'lb_you_best')) + '</span><b>' + (journey ? O.pct().toFixed(2) + '%' : HR.U.fmt(d.best)) + '</b>' + (journey ? '<small>' + this.esc(HR.t('lb_layers', { n: HR.Singularity ? HR.Singularity.passedCount() : 0 })) + '</small>' : '') + '</div><span class="lb-me-rank">#…</span>'));
      if (journey) body.appendChild(HR.U.el('p', 'lb-note', HR.t('lb_journey_d')));
      const list = HR.U.el('div', 'lb-list', '<p class="lb-note">' + HR.t('lb_loading') + '</p>'); body.appendChild(list);
      O.top(journey ? 'journey' : 'endless').then(v => {
        if (this.lbTab !== tab || !list.isConnected) return;
        list.innerHTML = '';
        if (journey) list.appendChild(HR.U.el('div', 'lb-first', HR.plate('chest', '#ffcf4a', 'sm') + '<span>' + this.esc(v.first ? HR.t('lb_first', { name: v.first.name }) : HR.t('lb_first_none')) + '</span>'));
        v.rows.slice(0, 50).forEach((r, i) => {
          const row = HR.U.el('div', 'lb-row' + (r.me ? ' me' : ''));
          const pos = i < 3 ? '<span class="lb-pos top">' + HR.icon(i === 0 ? 'crown' : 'medal') + '</span>' : '<span class="lb-pos">' + (i + 1) + '</span>';
          const val = journey ? '<span class="lb-score">' + (+r.pct).toFixed(2) + '%' + (r.layers ? ' <small>' + HR.icon('light') + r.layers + '</small>' : '') + '</span>' : '<span class="lb-score">' + HR.U.fmt(r.best) + '</span>';
          row.innerHTML = pos + '<span class="lb-flag">' + this.esc(r.flag || '') + '</span><span class="lb-name">' + this.esc(r.name) + '</span>' + val;
          list.appendChild(row);
        });
        const rk = body.querySelector('.lb-me-rank'); if (rk) rk.textContent = '#' + v.myRank;
        list.appendChild(HR.U.el('p', 'lb-note', HR.t(v.online ? 'lb_online' : 'lb_offline')));
      });
    } else {
      const list = HR.Leaderboard.local();
      if (!list.length) body.appendChild(HR.U.el('p', 'lb-note', HR.t('local_empty')));
      list.forEach((r, i) => {
        const row = HR.U.el('div', 'lb-row');
        row.innerHTML = '<span class="lb-pos' + (i < 3 ? ' top' : '') + '">' + (i + 1) + '</span><span class="lb-name">' + r.date + ' · ' + HR.t('phase_reached') + ' ' + (r.phase || 1) + '</span><span class="lb-score">' + HR.U.fmt(r.score) + '</span>';
        body.appendChild(row);
      });
    }
  },

  /* ---------------- ajustes ---------------- */
  toggleSetting(key) {
    const s = HR.Store.data.settings; s[key] = !s[key]; HR.Store.save(); HR.Audio.applySettings(); HR.Audio.sfx('click');
    HR.Analytics.log('setting', { key, value: s[key] });
  },
  renderSettings() {
    const body = $('#settings-body'); body.innerHTML = '';
    const s = HR.Store.data.settings, d = HR.Store.data;
    const row = (icon, label, sub, control) => { const r = HR.U.el('div', 'setting'); const gc = HR.glyphColor && HR.glyphColor(icon); r.innerHTML = '<div class="s-main"><span class="s-ic"' + (gc ? ' style="--ic:' + gc + '"' : '') + '>' + (HR.glyph ? HR.glyph(icon) : HR.icon(icon)) + '</span><div class="s-label">' + label + (sub ? '<small>' + sub + '</small>' : '') + '</div></div>'; const c = HR.U.el('div', 's-ctl'); c.appendChild(control); r.appendChild(c); body.appendChild(r); return r; };
    const toggle = key => { const t = HR.U.el('button', 'toggle' + (s[key] ? ' on' : '')); t.setAttribute('aria-label', key); t.addEventListener('click', () => { this.toggleSetting(key); t.classList.toggle('on', s[key]); }); return t; };
    const slider = (key, min, max, step, cb) => { const r = HR.U.el('input'); r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = s[key]; r.addEventListener('input', () => { s[key] = parseFloat(r.value); HR.Store.save(); if (cb) cb(); }); return r; };
    const seg = (opts, cur, cb) => { const g = HR.U.el('div', 'seg'); opts.forEach(o => { const b = HR.U.el('button', o.v === cur ? 'active' : '', o.l); b.addEventListener('click', () => { HR.Audio.sfx('click'); cb(o.v); $$('button', g).forEach(x => x.classList.toggle('active', x === b)); }); g.appendChild(b); }); return g; };
    body.appendChild(HR.U.el('div', 'section-title', HR.t('audio')));
    row('sound', HR.t('sound'), '', toggle('sound'));
    row('sliders', HR.t('sfx_vol'), '', slider('sfxVol', 0, 1, 0.05, () => { HR.Audio.applySettings(); HR.Audio.sfx('click'); }));
    row('music', HR.t('music'), '', toggle('music'));
    row('sliders', HR.t('music_vol'), '', slider('musicVol', 0, 1, 0.05, () => HR.Audio.applySettings()));
    if (navigator.vibrate) row('pulse', HR.t('vibration'), '', toggle('vibration'));
    body.appendChild(HR.U.el('div', 'section-title', HR.t('control')));
    row('target', HR.t('sensitivity'), '', slider('sensitivity', 0.5, 2, 0.1));
    row('sparkle', HR.t('perk_auto'), HR.t('perk_auto_d'), toggle('autoPerk'));
    row('hourglass', HR.t('adapt_slowmo'), HR.t('adapt_slowmo_d'), toggle('adaptSlowmo'));
    const qRow = row('sliders', HR.t('quality'), HR.t('quality_d'), seg([{ v: 'auto', l: HR.t('quality_auto') }, { v: 'ultra', l: HR.t('quality_l3') }, { v: 'high', l: HR.t('quality_l2') }, { v: 'normal', l: HR.t('quality_l1') }, { v: 'low', l: HR.t('quality_l0') }], s.quality || 'auto', v => { if (HR.Perf) { HR.Perf.setMode(v, this.game); if (this.renderQualityNote) this.renderQualityNote(); } }));
    qRow.classList.add('setting-stack', 'setting-quality');
    if (this.renderQualityNote) this.renderQualityNote();
    body.appendChild(HR.U.el('div', 'section-title', HR.t('profile')));
    row('user', HR.t('language'), '', seg([{ v: 'pt', l: 'PT' }, { v: 'en', l: 'EN' }, { v: 'es', l: 'ES' }], HR.lang, v => { s.lang = v; HR.Store.save(); HR.setLang(v); this.renderSettings(); this.refreshMenu(); }));
    if (HR.Online) {
      const nameForm = HR.U.el('form', 'name-edit');
      nameForm.innerHTML = '<input type="text" maxlength="18" value="' + this.esc(HR.Online.name()) + '"><button type="submit" class="btn small-btn">' + this.esc(HR.t('lb_save')) + '</button>';
      nameForm.addEventListener('submit', e => { e.preventDefault(); if (HR.Online.setName($('input', nameForm).value)) this.toast(HR.icon('check') + ' ' + HR.t('lb_saved'), 'good'); else this.toast(HR.t('lb_name_bad'), 'bad'); });
      row('user', HR.t('lb_name'), '', nameForm).classList.add('setting-stack');
    }
    if (d.titles && d.titles.length) {
      const opts = [{ v: null, l: HR.t(HR.Progress.titleKey(d.level)) }].concat(d.titles.map(t => ({ v: t, l: HR.t(t) })));
      const wrap = HR.U.el('div', 'title-pick');
      opts.forEach(o => { const b = HR.U.el('button', 'chip' + (o.v === d.title ? ' on' : ''), this.esc(o.l)); b.addEventListener('click', () => { d.title = o.v; HR.Store.save(); HR.Audio.sfx('click'); this.renderSettings(); this.refreshMenu(); }); wrap.appendChild(b); });
      row('award', HR.t('title'), HR.t('title_d'), wrap);
    }
    const link = (label, fn, cls) => { const b = HR.U.el('button', 'setting setting-link' + (cls ? ' ' + cls : ''), label); b.addEventListener('click', () => { HR.Audio.sfx('click'); fn(); }); body.appendChild(b); };
    body.appendChild(HR.U.el('div', 'section-title', HR.t('account')));
    if (d.noAds || d.vip) body.appendChild(HR.U.el('p', 'lb-note', (d.vip ? HR.t('vip_active') : HR.t('no_ads_active'))));
    link(HR.t('restore'), () => HR.IAP.restore());
    if (d.vip) link(HR.t('manage_sub'), () => HR.IAP.manage());
    link(HR.t('privacy'), () => window.open(HR.CONFIG.SHARE_URL + '/privacidade', '_blank'));
    link(HR.t('terms'), () => window.open(HR.CONFIG.SHARE_URL + '/termos', '_blank'));
    link(HR.t('reset_data'), async () => {
      if (await this.confirm(HR.t('reset_confirm_title'), this.esc(HR.t('reset_confirm_text')))) { HR.Store.reset(); HR.Missions.ensureDaily(); this.game.applyCosmetics(); this.refreshMenu(); this.renderSettings(); HR.Analytics.log('reset'); }
    }, 'danger');
    body.appendChild(HR.U.el('p', 'version', HR.CONFIG.NAME + ' · ' + HR.t('version', { v: HR.CONFIG.VERSION }) + ' · ' + HR.t('credits')));
  }
};

Object.assign(HR.I18N.pt, {
  tip_1: 'Passe pelo centro do arco para fazer PERFEITO e subir o combo.', tip_2: 'Toque nos botões dos cantos para usar habilidades. Elas recarregam sozinhas.',
  tip_3: 'A cada 10 arcos você escolhe um perk. Monte sua build.', tip_4: 'Os arcos podem vir de cima, de baixo ou dos lados. Fique atento ao aviso de direção.',
  tip_5: 'No modo Treino não existe morte. Use para aprender.', tip_6: 'Escudos absorvem um erro. Vidas extras continuam a corrida na hora.',
  tip_7: 'A bola pode ir para frente e para trás. Recue para ganhar tempo.', tip_8: 'Cada galáxia tem 10 sistemas, e cada sistema termina num chefe. Estrelas abrem o próximo.',
  tip_9: 'Para abrir a próxima galáxia, o Portal pede chefe, estrelas, patente, Núcleo e contratos.', tip_10: 'Missões semanais renovam na segunda-feira e pagam quatro vezes mais.',
  tip_11: 'Raspar a borda de um arco conta como "por um fio" — há uma conquista secreta.', tip_12: 'A Égide absorve um erro por 30 s. O Jato só pode ser usado antes do primeiro arco.',
  load_fonts: 'Carregando fontes', load_audio: 'Preparando áudio', load_save: 'Lendo progresso', load_ready: 'Pronto', load_galaxy: 'Desenhando a galáxia',
  abilities_short: 'Poderes', near_miss: 'POR UM FIO', audio: 'Áudio', sfx_vol: 'Volume dos sons', music_vol: 'Volume da música', profile: 'Perfil', account: 'Conta',
  title: 'Título', title_d: 'Aparece no menu, abaixo do nome do jogo', weekly_note: 'Alvos maiores, prêmios ×4. Renovam na segunda.', reroll_left: '{n} trocas de missão restantes hoje (anúncio)'
});
Object.assign(HR.I18N.en, {
  tip_1: 'Pass through the ring center for a PERFECT and a bigger combo.', tip_2: 'Tap the corner buttons to use abilities. They recharge on their own.',
  tip_3: 'Every 10 rings you pick a perk. Build your run.', tip_4: 'Rings can come from the top, bottom or sides. Watch the direction warning.',
  tip_5: 'Practice mode has no death. Use it to learn.', tip_6: 'Shields absorb one mistake. Extra lives continue the run instantly.',
  tip_7: 'The ball can move forward and back. Fall back to buy time.', tip_8: 'Each galaxy has 10 systems, and every system ends with a boss. Stars open the next one.',
  tip_9: 'To open the next galaxy, the Portal asks for boss, stars, rank, Core and contracts.', tip_10: 'Weekly missions reset on Monday and pay four times more.',
  tip_11: 'Grazing a ring rim counts as "by a hair" — there is a secret achievement.', tip_12: 'The Aegis absorbs one mistake for 30 s. The Jet can only be used before the first ring.',
  load_fonts: 'Loading fonts', load_audio: 'Preparing audio', load_save: 'Reading progress', load_ready: 'Ready', load_galaxy: 'Drawing the galaxy',
  abilities_short: 'Powers', near_miss: 'BY A HAIR', audio: 'Audio', sfx_vol: 'Sound volume', music_vol: 'Music volume', profile: 'Profile', account: 'Account',
  title: 'Title', title_d: 'Shown in the menu, under the game name', weekly_note: 'Bigger targets, ×4 rewards. Reset on Monday.', reroll_left: '{n} mission swaps left today (ad)'
});
Object.assign(HR.I18N.es, {
  tip_1: 'Pasa por el centro del aro para un PERFECTO y más combo.', tip_2: 'Toca los botones de las esquinas para usar habilidades. Se recargan solas.',
  tip_3: 'Cada 10 aros eliges un perk. Arma tu build.', tip_4: 'Los aros pueden venir de arriba, abajo o los lados. Atento al aviso de dirección.',
  tip_5: 'En Práctica no hay muerte. Úsala para aprender.', tip_6: 'Los escudos absorben un error. Las vidas extra continúan la partida al instante.',
  tip_7: 'La bola puede ir adelante y atrás. Retrocede para ganar tiempo.', tip_8: 'Cada galaxia tiene 10 sistemas y cada sistema termina con un jefe. Las estrellas abren el siguiente.',
  tip_9: 'Para abrir la siguiente galaxia, el Portal pide jefe, estrellas, rango, Núcleo y contratos.', tip_10: 'Las misiones semanales se renuevan el lunes y pagan cuatro veces más.',
  tip_11: 'Rozar el borde de un aro cuenta como "por un pelo": hay un logro secreto.', tip_12: 'La Égida absorbe un error durante 30 s. El Propulsor solo se usa antes del primer aro.',
  load_fonts: 'Cargando fuentes', load_audio: 'Preparando audio', load_save: 'Leyendo progreso', load_ready: 'Listo', load_galaxy: 'Dibujando la galaxia',
  abilities_short: 'Poderes', near_miss: 'POR UN PELO', audio: 'Audio', sfx_vol: 'Volumen de sonidos', music_vol: 'Volumen de música', profile: 'Perfil', account: 'Cuenta',
  title: 'Título', title_d: 'Aparece en el menú, bajo el nombre del juego', weekly_note: 'Objetivos mayores, premios ×4. Se renuevan el lunes.', reroll_left: '{n} cambios de misión restantes hoy (anuncio)'
});
