/* =====================================================================
   Galáxia v5: 10 galáxias → 10 sistemas → 10 fases (a 10ª é o chefe do sistema;
   o chefe do sistema 10 é o chefe da galáxia). 1.000 fases geradas por função
   determinística a partir das curvas de cada galáxia (HR.REGIONS[i]).
   Id da fase: "g-s-f" (1-based). API: HR.Campaign (ver docs/PLANO_V5.md §2)
   ===================================================================== */
window.HR = window.HR || {};

HR.CAMPAIGN = { systems: 10, stages: 10 };
HR.SYSTEM_KEYS = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa'];
HR.MECHS = ['basic', 'osc', 'swarm', 'shrink', 'fog', 'spin', 'storm', 'dark', 'vortex', 'hyper'];
HR.MECH_ICON = { basic: 'ring', osc: 'wave', swarm: 'hive', shrink: 'shrink', fog: 'nebula', spin: 'spin', storm: 'storm', dark: 'eclipse', vortex: 'cyclone', hyper: 'speed' };

// contratos por galáxia (8 de 10 modelos): stat = campo de campaign.rstats[ri] (ou calculado) · alvo = base + per × galáxia
HR.CONTRACTS = [
  { id: 'perfects',     stat: 'perfects',     base: 200,  per: 80,  coins: 500, gems: 12, icon: 'target' },
  { id: 'clears',       stat: 'clears',       base: 40,   per: 6,   coins: 600, gems: 12, icon: 'flag' },
  { id: 'coins',        stat: 'coins',        base: 1500, per: 600, coins: 700, gems: 10, icon: 'coins' },
  { id: 'pickups',      stat: 'pickups',      base: 45,   per: 15,  coins: 500, gems: 12, icon: 'gift' },
  { id: 'flawless',     stat: 'flawless',     base: 6,    per: 2,   coins: 700, gems: 18, icon: 'sparkle' },
  { id: 'events',       stat: 'events',       base: 8,    per: 4,   coins: 600, gems: 14, icon: 'zap' },
  { id: 'nomiss',       stat: 'noMiss',       base: 20,   per: 4,   coins: 600, gems: 14, icon: 'link' },
  { id: 'bossflawless', stat: 'bossFlawless', base: 2,    per: 0,   coins: 900, gems: 25, icon: 'crown' },
  { id: 'systems',      stat: '@systems',     base: 5,    per: 0,   coins: 800, gems: 20, icon: 'system' },
  { id: 'threestars',   stat: '@threeStars',  base: 25,   per: 5,   coins: 800, gems: 20, icon: 'star' }
];

(function () {
  const NS = HR.CAMPAIGN.systems, NL = HR.CAMPAIGN.stages;
  const lerp = (a, b, t) => a + (b - a) * t;
  const r2 = v => Math.round(v * 100) / 100;
  const idOf = (ri, si, li) => (ri + 1) + '-' + (si + 1) + '-' + (li + 1);
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  // mecânica aplicada aos parâmetros: L = intensidade local 0..9 · k = 1 (principal) ou 0,5 (secundária)
  function applyMech(P, mech, L, k) {
    const mx = (key, v) => { P[key] = Math.max(P[key] || 0, v); };
    switch (mech) {
      case 'basic':  if (k === 1) P.tiltVar = Math.max(P.tiltVar, L >= 5 ? 0.15 : 0); break;
      case 'osc':    mx('osc', (40 + L * 8) * k); mx('oscF', 1.2 + L * 0.08); break;
      case 'swarm':  mx('dbl', (0.2 + L * 0.05) * k); mx('tiltVar', 0.25 * k); break;
      case 'shrink': mx('shrink', (0.12 + L * 0.02) * k); if (k === 1) P.radius *= 0.96; break;
      case 'fog':    { const f = k === 1 ? 560 - L * 30 : 720 - L * 15; P.fog = P.fog ? Math.min(P.fog, f) : f; break; }
      case 'spin':   mx('rot', (0.35 + L * 0.04) * k); mx('rotF', 1.2 + L * 0.1); mx('tiltVar', 0.3 * k); break;
      case 'storm':  mx('burst', (0.15 + L * 0.02) * k); mx('osc', 40 * k); mx('oscF', 1.4); mx('tiltVar', 0.4 * k); break;
      case 'dark':   { const dk = k === 1 ? 420 - L * 18 : 540 - L * 10; P.dark = P.dark ? Math.min(P.dark, dk) : dk; P.yDelta += 80 * k; break; }
      case 'vortex': mx('osc', 60 * k); mx('oscF', 1.8); mx('rot', 0.5 * k); mx('rotF', 1.6); mx('tiltVar', 0.55 * k); break;
      case 'hyper':
        if (k === 1) { P.radius *= 0.92; mx('osc', 50); mx('oscF', 1.6); mx('rot', 0.4); mx('rotF', 1.4); mx('tiltVar', 0.6); P.fog = P.fog ? Math.min(P.fog, 700) : 700; P.tbMul *= 0.94; }
        else { P.radius *= 0.96; P.tbMul *= 0.97; }
        break;
    }
  }
  // mecânica secundária do sistema: vem das galáxias anteriores (variedade); os 2 primeiros sistemas são puros
  function secondaryMech(R, ri, si) {
    if (si < 2 || (ri === 0 && si < 4)) return null;
    const pool = ri >= 3 ? HR.MECHS.slice(1, ri) : ['osc', 'swarm', 'shrink'].filter(m => m !== R.mech);
    return pool[(si * 7 + ri * 3) % pool.length];
  }
  function dirsFor(R, ri, si, li, isBoss) {
    if (ri === 0 && si === 0) return li <= 5 ? ['right'] : li <= 7 ? ['top'] : ['right', 'top'];
    if (isBoss) return (ri + si) % 2 ? ['right', 'top', 'left', 'bottom'] : ['left', 'bottom', 'right', 'top'];
    let pool;
    if (ri === 0) pool = si < 3 ? ['right', 'top'] : si < 6 ? ['right', 'top', 'bottom'] : ['right', 'top', 'left', 'bottom'];
    else if (ri === 1 && si < 3) pool = ['right', 'top', 'bottom'];
    else pool = ['right', 'top', 'left', 'bottom'];
    const swaps = R.mech === 'storm' || R.mech === 'vortex' || R.mech === 'hyper';
    const count = swaps ? Math.min(4, 2 + Math.floor(li / 3)) : Math.min(pool.length, 1 + Math.floor((li + si * 0.5) / 3));
    const start = (ri * 3 + si * 5 + li * 2) % pool.length, step = (ri + si) % 2 ? 1 : 3;
    const out = [];
    for (let i = 0; i < count; i++) { const d = pool[(start + i * step) % pool.length]; if (!out.includes(d)) out.push(d); }
    return out;
  }

  function gen(R, ri, si, li) {
    const S = HR.CONFIG.SPEED, isBoss = li === NL - 1, galaxyBoss = isBoss && si === NS - 1;
    const gi = ri * NS * NL + si * NL + li, g = gi / (NS * NS * NL - 1), lp = (si * NL + li) / (NS * NL - 1), L = lp * 9;
    const tier = Math.min(9, Math.floor(g * 9.99));
    const rings = isBoss ? (galaxyBoss ? (ri === 9 ? 60 : 36 + ri * 3) : 26 + ri * 2 + si) : Math.round(lerp(14 + ri * 2, 24 + ri * 2, li / 8)) + Math.floor(si / 2);
    let v0 = S.base + S.span * Math.pow(g, S.pow);
    if (isBoss) v0 *= galaxyBoss ? S.galaxyBossMul : S.bossMul;
    const P = {
      accent: R.accent, radius: 1 - g * 0.36, tiltVar: 0, osc: 0, oscF: 0, rot: 0, rotF: 0,
      yDelta: 180 + g * 280, tbMul: 1 - g * 0.22, coin: 0.45 + g * 0.10, dbl: 0,
      fog: 0, dark: 0, shrink: 0, sync: false, burst: 0,
      mix: 0.35 + g * 0.55, obs: gi >= 12 ? 0.15 + g * 0.45 : 0, pick: gi === 0 ? 0 : HR.CONFIG.PICKUP.chance
    };
    // mecânicas antigas "vazam" de leve com o progresso global
    if (g >= 0.2) { P.osc = 22; P.oscF = 1.2; }
    if (g >= 0.3) P.tiltVar = 0.18;
    if (g >= 0.4) P.dbl = 0.08;
    if (g >= 0.7) { P.rot = 0.22; P.rotF = 1.2; }
    applyMech(P, R.mech, L, 1);
    const sec = secondaryMech(R, ri, si);
    if (sec) applyMech(P, sec, L, 0.5);
    let dirEvery = 0;
    const dirMech = R.mech === 'storm' || R.mech === 'vortex' || R.mech === 'hyper' ? R.mech : (sec === 'storm' || sec === 'vortex' ? sec : null);
    if (dirMech === 'storm') dirEvery = isBoss ? 4 : 8 - Math.floor(L / 3);
    if (dirMech === 'vortex') dirEvery = isBoss ? 3 : 6 - Math.floor(L / 4);
    if (dirMech === 'hyper') dirEvery = isBoss ? 0 : 5 - Math.floor(L / 5);
    if (isBoss) { P.osc = Math.max(P.osc, 30); P.oscF = Math.max(P.oscF, 1.3); }
    // modificadores: a partir da fase 26 global
    const MUT = ['narrow', 'dense', 'wind', 'pairs', 'bursts'];
    const mods = [];
    if (!isBoss && gi >= 25 && (li % 3 === 2 || g > 0.45)) mods.push(MUT[(ri * 7 + si * 5 + li * 3) % 5]);
    if (!isBoss && g > 0.6 && li >= 6) { const m2 = MUT[(ri * 7 + si * 5 + li * 3 + 2) % 5]; if (!mods.includes(m2)) mods.push(m2); }
    mods.forEach(m => {
      if (m === 'narrow') P.radius *= 0.9; else if (m === 'dense') P.tbMul *= 0.9; else if (m === 'wind') P.tiltVar = Math.max(P.tiltVar, 0.25) + 0.1;
      else if (m === 'pairs') P.dbl += 0.15; else if (m === 'bursts') P.burst = Math.max(P.burst, 0.2);
    });
    // eventos: fases 3/6/9 a partir da 21ª; duas por fase no fim do jogo; chefes: um entre as ondas (galáxia: a lista toda)
    const EV = ['asteroids', 'warp', 'sentinel', 'bonanza', 'guardian'];
    const events = [];
    if (!isBoss && gi >= 20 && (li === 2 || li === 5 || li === 8)) events.push({ at: Math.round(rings * 0.45), id: EV[(ri * 2 + si * 3 + li) % 5] });
    if (!isBoss && g > 0.3 && li >= 6) events.push({ at: Math.round(rings * 0.78), id: EV[(ri * 2 + si + li + 3) % 5] });
    const BOSS_EV = { pulse: ['asteroids'], tide: ['warp'], swarm: ['asteroids'], shrink: ['guardian'], blink: ['sentinel'], spin: ['warp'], storm: ['asteroids'], eclipse: ['sentinel'], cyclone: ['guardian'], singularity: ['sentinel', 'asteroids', 'warp', 'guardian'] };
    const waves = isBoss ? (galaxyBoss ? HR.BOSSES[R.boss].waves : 3) : 0;
    if (isBoss && gi >= 19) {
      const list = galaxyBoss ? BOSS_EV[R.boss] : [BOSS_EV[R.boss][si % BOSS_EV[R.boss].length]], per = Math.ceil(rings / waves);
      list.forEach((id, k) => { const w = waves === 5 ? k + 1 : 1; events.push({ at: per * w, id, wave: true }); });
    }
    return {
      id: idOf(ri, si, li), region: R.id, ri, si, li, gi, g: Math.round(g * 1000) / 1000, rings, tier, params: P, dirs: dirsFor(R, ri, si, li, isBoss), dirEvery, mods, events, sec,
      v0: Math.round(v0), ramp: r2(S.rampBase + S.rampSpan * g), flowMul: r2(S.flowBase + S.flowSpan * g), tb0: r2(Math.max(S.tbMin, S.tbStart - S.tbSpan * g)), speed: r2(v0 / 265),
      boss: isBoss ? R.boss : null, galaxyBoss, waves
    };
  }

  let cache = null, byId = null;
  function all() {
    if (cache) return cache;
    cache = []; byId = {};
    HR.REGIONS.forEach((R, ri) => { for (let si = 0; si < NS; si++) for (let li = 0; li < NL; li++) { const l = gen(R, ri, si, li); cache.push(l); byId[l.id] = l; } });
    return cache;
  }

  HR.Campaign = {
    all, gen, idOf, ROMAN,
    level(id) { all(); return byId[id] || null; },
    at(ri, si, li) { return this.level(idOf(ri, si, li)); },
    region(levelId) { const l = this.level(levelId); return l ? HR.REGIONS[l.ri] : null; },
    world(levelId) { return this.region(levelId); },
    regionIndex(levelId) { const l = this.level(levelId); return l ? l.ri : -1; },
    worldIndex(levelId) { return this.regionIndex(levelId); },
    levelIndex(levelId) { const l = this.level(levelId); return l ? l.li : -1; },
    levelsOf(ri) { all(); return cache.slice(ri * NS * NL, (ri + 1) * NS * NL); },
    systemLevels(ri, si) { all(); const a = ri * NS * NL + si * NL; return cache.slice(a, a + NL); },
    systemName(si) { return HR.t('sys_' + HR.SYSTEM_KEYS[si]); },
    bossName(level) { if (!level || !level.boss) return ''; return HR.t('boss_' + level.boss) + (level.galaxyBoss ? '' : ' ' + ROMAN[level.si]); },
    stars(id) { return (HR.Store.data.campaign.stars[id] || 0); },
    totalStars() { let n = 0; const s = HR.Store.data.campaign.stars; for (const k in s) n += s[k]; return n; },
    systemStars(ri, si) { let n = 0; for (let li = 0; li < NL; li++) n += this.stars(idOf(ri, si, li)); return n; },
    regionStars(ri) { let n = 0; for (let si = 0; si < NS; si++) n += this.systemStars(ri, si); return n; },
    threeStarsIn(ri) { let n = 0; for (let si = 0; si < NS; si++) for (let li = 0; li < NL; li++) if (this.stars(idOf(ri, si, li)) === 3) n++; return n; },
    systemBossBeaten(ri, si) { return this.stars(idOf(ri, si, NL - 1)) > 0; },
    bossBeaten(ri) { return this.systemBossBeaten(ri, NS - 1); },
    systemsClearedIn(ri) { let n = 0; for (let si = 0; si < NS; si++) if (this.systemBossBeaten(ri, si)) n++; return n; },
    systemsCleared() { let n = 0; HR.REGIONS.forEach((R, ri) => { n += this.systemsClearedIn(ri); }); return n; },
    regionCleared(ri) { return this.bossBeaten(ri); },
    levelsCleared() { let n = 0; const s = HR.Store.data.campaign.stars; for (const k in s) if (s[k] > 0) n++; return n; },
    levelsClearedIn(ri) { let n = 0; const pre = (ri + 1) + '-', s = HR.Store.data.campaign.stars; for (const k in s) if (s[k] > 0 && k.indexOf(pre) === 0 && k.split('-').length === 3) n++; return n; },
    regionsCleared() { let n = 0; HR.REGIONS.forEach((R, i) => { if (this.bossBeaten(i)) n++; }); return n; },
    prev(id) { const l = this.level(id); return l && l.gi > 0 ? all()[l.gi - 1] : null; },
    next(id) { const l = this.level(id); return l && l.gi < cache.length - 1 ? cache[l.gi + 1] : null; },

    // Portal da galáxia (ri 1..9) e da Singularidade (ri 10): 5 portas
    isRegionUnlocked(ri) { return ri === 0 || this.gate(ri).ok; },
    gate(ri) {
      const P = HR.CONFIG.PROGRESSION, d = HR.Store.data;
      if (ri <= 0) return { ok: true, items: [], open: 0 };
      const prev = ri - 1, stars = this.regionStars(prev), core = HR.Core.level(), cd = this.contractsDone(prev), boss = this.bossBeaten(prev);
      const items = [
        { id: 'boss', ok: boss, a: boss ? 1 : 0, b: 1 },
        { id: 'stars', ok: stars >= P.regionStars[ri], a: stars, b: P.regionStars[ri] },
        { id: 'rank', ok: d.level >= P.regionRank[ri], a: d.level, b: P.regionRank[ri] },
        { id: 'core', ok: core >= P.regionCore[ri], a: core, b: P.regionCore[ri] },
        { id: 'contracts', ok: cd >= P.contractsNeed, a: cd, b: P.contractsNeed }
      ];
      return { ok: items.every(i => i.ok), items, open: items.filter(i => i.ok).length };
    },
    singularityGate() { return this.gate(HR.REGIONS.length); },
    singularityOpen() { return this.singularityGate().ok; },
    // selo do sistema: chefe do sistema anterior + estrelas nele
    systemGate(ri, si) {
      if (si <= 0) return { ok: this.isRegionUnlocked(ri), boss: true, stars: 0, need: 0 };
      const need = HR.CONFIG.PROGRESSION.systemStars[ri], stars = this.systemStars(ri, si - 1), boss = this.systemBossBeaten(ri, si - 1);
      return { ok: this.isRegionUnlocked(ri) && boss && stars >= need, boss, stars, need };
    },
    systemUnlocked(ri, si) { return this.systemGate(ri, si).ok; },
    systemState(ri, si) { return !this.systemUnlocked(ri, si) ? 'locked' : this.systemBossBeaten(ri, si) ? 'done' : 'open'; },
    isUnlocked(id) {
      const l = this.level(id); if (!l) return false;
      if (!this.systemUnlocked(l.ri, l.si)) return false;
      return l.li === 0 || this.stars(idOf(l.ri, l.si, l.li - 1)) > 0;
    },
    regionState(ri) { return !this.isRegionUnlocked(ri) ? 'locked' : this.regionCleared(ri) ? 'done' : 'open'; },
    currentRegion() { for (let i = HR.REGIONS.length - 1; i >= 0; i--) if (this.isRegionUnlocked(i) && !this.regionCleared(i)) return i; return this.regionsCleared() >= HR.REGIONS.length ? HR.REGIONS.length - 1 : 0; },
    currentSystem(ri) { for (let si = NS - 1; si >= 0; si--) if (this.systemUnlocked(ri, si) && !this.systemBossBeaten(ri, si)) return si; for (let si = NS - 1; si >= 0; si--) if (this.systemUnlocked(ri, si)) return si; return 0; },
    currentLevel() {
      let lastOpen = null;
      for (let ri = 0; ri < HR.REGIONS.length; ri++) {
        if (!this.isRegionUnlocked(ri)) break;
        for (let si = 0; si < NS; si++) {
          if (!this.systemUnlocked(ri, si)) break;
          for (let li = 0; li < NL; li++) { const l = this.at(ri, si, li); if (this.stars(l.id) === 0) return l; lastOpen = l; }
        }
      }
      return lastOpen || all()[0];
    },
    nextPortal() { for (let i = 1; i < HR.REGIONS.length; i++) if (!this.isRegionUnlocked(i)) return this.isRegionUnlocked(i - 1) ? i : null; return null; },
    singularityMastered() { return this.bossBeaten(HR.REGIONS.length - 1); },
    passNeed(level) { return Math.ceil(level.rings * (level.passNeed || HR.CONFIG.RUN.passNeed)); },
    // % da jornada (ranking): 60 % fases, 15 % estrelas, 25 % Arcontes
    progressPct() {
      const total = NS * NL * HR.REGIONS.length, arch = HR.Singularity ? HR.Singularity.passedCount() : 0, archN = HR.ARCHONS ? HR.ARCHONS.length : 11;
      return Math.min(100, this.levelsCleared() / total * 60 + this.totalStars() / (total * 3) * 15 + arch / archN * 25);
    },

    // contratos: 8 por galáxia; prêmio automático no fim da partida
    contractsOf(ri) {
      const out = [], T = HR.CONTRACTS;
      for (let k = 0; k < 8; k++) { const t = T[(ri * 3 + k) % T.length]; out.push({ id: t.id + '_' + ri, tpl: t.id, stat: t.stat, target: t.base + t.per * ri, coins: t.coins + ri * 80, gems: t.gems, xp: 400, icon: t.icon, ri }); }
      return out;
    },
    rstat(ri) { const c = HR.Store.data.campaign; c.rstats = c.rstats || {}; return c.rstats[ri] || (c.rstats[ri] = { perfects: 0, clears: 0, coins: 0, pickups: 0, flawless: 0, events: 0, noMiss: 0, bossFlawless: 0 }); },
    contractProgress(c) {
      let v;
      if (c.stat === '@systems') v = this.systemsClearedIn(c.ri);
      else if (c.stat === '@threeStars') v = this.threeStarsIn(c.ri);
      else v = this.rstat(c.ri)[c.stat] || 0;
      return Math.min(c.target, v);
    },
    contractDone(c) { const cc = HR.Store.data.campaign.contracts || {}; return !!cc[c.id]; },
    contractsDone(ri) { return this.contractsOf(ri).filter(c => this.contractDone(c)).length; },
    contractText(c) { return HR.t('c_' + c.tpl, { n: HR.U.fmt(c.target) }); },
    onRunEnd(s) {
      if (s.mode !== 'campaign' || !s.levelId) return [];
      const L = this.level(s.levelId); if (!L) return [];
      const st = this.rstat(L.ri), d = HR.Store.data;
      st.perfects += s.perfects; st.coins += s.rawCoins; st.pickups += s.pickups; st.events += s.eventsDone || 0; st.noMiss = Math.max(st.noMiss, s.noMissRings);
      if (s.success) { st.clears++; if (s.hits === 0) { st.flawless++; if (L.boss) st.bossFlawless++; } }
      if (!d.stats.regionsVisited.includes(L.ri)) d.stats.regionsVisited.push(L.ri);
      const done = [];
      d.campaign.contracts = d.campaign.contracts || {};
      this.contractsOf(L.ri).forEach(c => {
        if (this.contractDone(c) || this.contractProgress(c) < c.target) return;
        d.campaign.contracts[c.id] = Date.now(); d.stats.contractsDone = (d.stats.contractsDone || 0) + 1;
        HR.Economy.addCoins(c.coins, 'contract'); HR.Economy.addGems(c.gems, 'contract');
        HR.Analytics.log('contract_done', { id: c.id }); done.push(c);
      });
      HR.Store.save();
      return done;
    },

    computeStars(summary, level) {
      let s = 1;
      if (summary.perfects >= Math.ceil(level.rings * 0.4)) s++;
      if (summary.hits === 0 && !summary.misses && summary.coinsMissed === 0) s++;
      return s;
    },
    firstClearReward(level) {
      let coins = 40 + level.ri * 30 + level.si * 6 + level.li * 4;
      if (level.galaxyBoss) coins *= 6; else if (level.boss) coins = Math.round(coins * 2.5);
      const gems = level.galaxyBoss ? 30 + level.ri * 4 : level.boss ? 5 : (level.li === 4 ? 1 : 0);
      return { coins, gems, aegis: level.boss && !level.galaxyBoss ? 1 : 0 };
    },
    // save migrado da v4: entrega o que os chefes já vencidos dariam hoje (bola da galáxia, prêmios da galáxia, Égide dos chefes de sistema)
    backfill() {
      const d = HR.Store.data; if (!d.pendingBackfillV5) return;
      delete d.pendingBackfillV5;
      let aegis = 0;
      all().forEach(lv => {
        if (!lv.boss || !this.stars(lv.id)) return;
        if (!lv.galaxyBoss) { aegis++; return; }
        const R = HR.REGIONS[lv.ri], rw = R.reward || {};
        [['skins', rw.skin], ['trails', rw.trail], ['themes', rw.theme], ['skins', R.galSkin]].forEach(([type, id]) => { if (id && d.owned[type] && !d.owned[type].includes(id)) d.owned[type].push(id); });
      });
      if (aegis && HR.Consumables) HR.Consumables.add('aegis', aegis, 'migrate_v5');
      HR.Store.save();
    },
    // aplica resultado; retorna { stars, newStars, rewards, systemCleared, regionCleared, worldCleared }
    complete(level, summary) {
      const d = HR.Store.data, before = this.stars(level.id);
      const stars = this.computeStars(summary, level);
      const rewards = [];
      d.campaign.stars[level.id] = Math.max(before, stars);
      d.campaign.best[level.id] = Math.max(d.campaign.best[level.id] || 0, summary.perfects);
      if (before === 0) {
        const r = this.firstClearReward(level);
        rewards.push({ coins: r.coins }); HR.Economy.addCoins(r.coins, 'campaign');
        if (r.gems) { rewards.push({ gems: r.gems }); HR.Economy.addGems(r.gems, 'campaign'); }
        if (r.aegis && HR.Consumables) { HR.Consumables.add('aegis', r.aegis, 'system_boss'); rewards.push({ aegis: r.aegis }); }
      } else { const c = Math.round(this.firstClearReward(level).coins / 3); rewards.push({ coins: c }); HR.Economy.addCoins(c, 'campaign_repeat'); }
      if (stars === 3 && before < 3) { rewards.push({ gems: 1 }); HR.Economy.addGems(1, 'campaign_3stars'); }
      if (summary.hits === 0) d.stats.flawlessLevels = (d.stats.flawlessLevels || 0) + 1;
      let systemCleared = false, regionCleared = false;
      if (level.boss && before === 0) { systemCleared = true; d.stats.bossesBeaten = (d.stats.bossesBeaten || 0) + 1; }
      if (level.galaxyBoss && before === 0) {
        const R = HR.REGIONS[level.ri], rw = R.reward; regionCleared = true;
        const give = (type, id) => { if (!d.owned[type].includes(id)) { d.owned[type].push(id); rewards.push({ [type.slice(0, -1)]: id }); } else { rewards.push({ gems: 50 }); HR.Economy.addGems(50, 'region_dup'); } };
        if (rw.skin) give('skins', rw.skin);
        if (rw.trail) give('trails', rw.trail);
        if (rw.theme) give('themes', rw.theme);
        if (R.galSkin) give('skins', R.galSkin);
        if (level.ri === HR.REGIONS.length - 1) { rewards.push({ gems: 200 }); HR.Economy.addGems(200, 'singularity'); }
      }
      d.stats.campaignClears++;
      d.stats.levelsCleared = this.levelsCleared();
      d.stats.regionsCleared = this.regionsCleared();
      d.stats.systemsCleared = this.systemsCleared();
      d.stats.starsTotal = this.totalStars();
      HR.Store.save();
      HR.Analytics.log('level_complete', { id: level.id, stars, first: before === 0 });
      return { stars, newStars: Math.max(0, stars - before), rewards, systemCleared, regionCleared, worldCleared: regionCleared };
    },
    // informação de velocidade para as fichas (px/s → "×" relativo à primeira fase)
    speedInfo(level) { const base = HR.CONFIG.SPEED.base; return { from: level.v0 / base, to: level.v0 * (1 + level.ramp) / base, flow: level.flowMul, pct: Math.min(1, (level.v0 * (1 + level.ramp) - base) / (HR.CONFIG.SPEED.span * 1.35)) }; }
  };
})();

/* ---------------- textos ---------------- */
Object.assign(HR.I18N.pt, {
  sys_alpha: 'Alfa', sys_beta: 'Beta', sys_gamma: 'Gama', sys_delta: 'Delta', sys_epsilon: 'Épsilon', sys_zeta: 'Zeta', sys_eta: 'Eta', sys_theta: 'Teta', sys_iota: 'Iota', sys_kappa: 'Capa',
  system: 'Sistema', systems: 'Sistemas', system_n: 'Sistema {name}', system_boss: 'Chefe do sistema', galaxy_boss: 'Chefe da galáxia', system_cleared: 'SISTEMA CONCLUÍDO!', galaxy_cleared: 'GALÁXIA CONCLUÍDA!',
  system_locked: 'Vença o chefe do Sistema {name} e junte {n} estrelas nele.', system_seal: 'Selo do sistema', system_seal_d: '{a}/{b} estrelas neste sistema abrem o próximo.', system_open_next: 'Próximo sistema aberto',
  systems_d: 'Cada sistema tem 10 fases; a última é o chefe. Vença o chefe e junte estrelas para abrir o próximo.', system_mech2: 'Mecânica extra', system_reward_aegis: '+1 Égide no primeiro chefe vencido',
  speed: 'Velocidade', speed_d: 'Os arcos começam em ×{a} e chegam a ×{b} até o fim da fase. Acertos seguidos somam até +{f} %.', speed_up: 'VELOCIDADE +', speed_label: '×{a} → ×{b}',
  galaxy_progress: '{a}/{b} fases · {c}/{d} sistemas', stages_n: '{n} fases', stars_of: '{a}/{b} estrelas',
  c_systems: 'Conclua {n} sistemas nesta galáxia', c_threestars: 'Faça 3 estrelas em {n} fases desta galáxia',
  c_perfects: 'Faça {n} PERFEITOS nesta galáxia', c_clears: 'Conclua {n} fases nesta galáxia', c_coins: 'Junte {n} moedas nesta galáxia', c_pickups: 'Pegue {n} itens nesta galáxia', c_flawless: 'Conclua {n} fases sem dano nesta galáxia', c_events: 'Vença {n} eventos nesta galáxia', c_nomiss: 'Passe {n} arcos seguidos sem errar', c_bossflawless: 'Vença {n} chefes sem dano nesta galáxia',
  mode_campaign_d: '10 galáxias, 100 sistemas, 1.000 fases.'
});
Object.assign(HR.I18N.en, {
  sys_alpha: 'Alpha', sys_beta: 'Beta', sys_gamma: 'Gamma', sys_delta: 'Delta', sys_epsilon: 'Epsilon', sys_zeta: 'Zeta', sys_eta: 'Eta', sys_theta: 'Theta', sys_iota: 'Iota', sys_kappa: 'Kappa',
  system: 'System', systems: 'Systems', system_n: '{name} System', system_boss: 'System boss', galaxy_boss: 'Galaxy boss', system_cleared: 'SYSTEM CLEARED!', galaxy_cleared: 'GALAXY CLEARED!',
  system_locked: 'Beat the {name} System boss and earn {n} stars there.', system_seal: 'System seal', system_seal_d: '{a}/{b} stars in this system open the next one.', system_open_next: 'Next system open',
  systems_d: 'Each system has 10 levels; the last is the boss. Beat it and earn stars to open the next.', system_mech2: 'Extra mechanic', system_reward_aegis: '+1 Aegis for the first boss win',
  speed: 'Speed', speed_d: 'Rings start at ×{a} and reach ×{b} by the end of the level. Hit streaks add up to +{f}%.', speed_up: 'SPEED UP', speed_label: '×{a} → ×{b}',
  galaxy_progress: '{a}/{b} levels · {c}/{d} systems', stages_n: '{n} levels', stars_of: '{a}/{b} stars',
  c_systems: 'Clear {n} systems in this galaxy', c_threestars: 'Get 3 stars on {n} levels in this galaxy',
  c_perfects: 'Make {n} PERFECTS in this galaxy', c_clears: 'Clear {n} levels in this galaxy', c_coins: 'Collect {n} coins in this galaxy', c_pickups: 'Grab {n} items in this galaxy', c_flawless: 'Clear {n} levels without damage in this galaxy', c_events: 'Win {n} events in this galaxy', c_nomiss: 'Pass {n} rings in a row without missing', c_bossflawless: 'Beat {n} bosses without damage in this galaxy',
  mode_campaign_d: '10 galaxies, 100 systems, 1,000 levels.'
});
Object.assign(HR.I18N.es, {
  sys_alpha: 'Alfa', sys_beta: 'Beta', sys_gamma: 'Gamma', sys_delta: 'Delta', sys_epsilon: 'Épsilon', sys_zeta: 'Zeta', sys_eta: 'Eta', sys_theta: 'Theta', sys_iota: 'Iota', sys_kappa: 'Kappa',
  system: 'Sistema', systems: 'Sistemas', system_n: 'Sistema {name}', system_boss: 'Jefe del sistema', galaxy_boss: 'Jefe de la galaxia', system_cleared: '¡SISTEMA COMPLETADO!', galaxy_cleared: '¡GALAXIA COMPLETADA!',
  system_locked: 'Vence al jefe del Sistema {name} y consigue {n} estrellas en él.', system_seal: 'Sello del sistema', system_seal_d: '{a}/{b} estrellas en este sistema abren el siguiente.', system_open_next: 'Siguiente sistema abierto',
  systems_d: 'Cada sistema tiene 10 niveles; el último es el jefe. Véncelo y consigue estrellas para abrir el siguiente.', system_mech2: 'Mecánica extra', system_reward_aegis: '+1 Égida al vencer al jefe por primera vez',
  speed: 'Velocidad', speed_d: 'Los aros empiezan en ×{a} y llegan a ×{b} al final del nivel. Los aciertos seguidos suman hasta +{f} %.', speed_up: 'VELOCIDAD +', speed_label: '×{a} → ×{b}',
  galaxy_progress: '{a}/{b} niveles · {c}/{d} sistemas', stages_n: '{n} niveles', stars_of: '{a}/{b} estrellas',
  c_systems: 'Completa {n} sistemas en esta galaxia', c_threestars: 'Consigue 3 estrellas en {n} niveles de esta galaxia',
  c_perfects: 'Haz {n} PERFECTOS en esta galaxia', c_clears: 'Completa {n} niveles en esta galaxia', c_coins: 'Junta {n} monedas en esta galaxia', c_pickups: 'Recoge {n} objetos en esta galaxia', c_flawless: 'Completa {n} niveles sin daño en esta galaxia', c_events: 'Gana {n} eventos en esta galaxia', c_nomiss: 'Pasa {n} aros seguidos sin fallar', c_bossflawless: 'Vence a {n} jefes sin daño en esta galaxia',
  mode_campaign_d: '10 galaxias, 100 sistemas, 1.000 niveles.'
});
