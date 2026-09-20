/* =====================================================================
   Núcleo do jogo v3.1
   - Frame de direção (u = viagem, v = livre); direções right/top/left/bottom com rotação sem parar.
   - Modos: endless (Singularidade), practice (treino, sem morte), campaign (galáxia).
   - Linguagem de cores: cada arco tem UM tipo (plain, wave, tilt, spin, pulse, ghost, gold, anomaly)
     que define comportamento e cor (CONFIG.RING_TYPES).
   - Regra v3.1: passar por fora do arco = ERROU (sem prêmio, combo zera); só a borda e os
     obstáculos machucam. Na galáxia a fase exige passar por RUN.passNeed dos arcos.
   - Obstáculos no vazio entre arcos; itens fora da linha (moedas, escudo, ímã, lenta, estrela, vida, gema).
   - Infinito: anomalias (arco imune a poderes, exige ação humana), perks míticos de ascensão
     (fluxo, regeneração, intangível, overclock, momento) e escolha automática de perks.
   - Chefes por ondas: pulse, tide, swarm, shrink, blink, spin, storm, eclipse, cyclone, singularity.
   Estados: idle | ready | playing | transition | perk | dying | revive | over | levelend | paused
   ===================================================================== */
window.HR = window.HR || {};

HR.DIRS = ['right', 'top', 'left', 'bottom'];

HR.Game = class {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.H = HR.CONFIG.WORLD_H; this.W = 0; this.scale = 1; this.dpr = 1; this.rect = { top: 0, left: 0 };
    this.state = 'idle'; this.demo = true;
    this.bg = new HR.Render.Background();
    this.particles = new HR.Render.Particles();
    this.rings = []; this.obstacles = []; this.pickups = []; this.time = 0; this.timeScale = 1; this.shake = 0; this.dyingT = 0; this.killer = null;
    this.ball = { x: 200, tx: 200, y: 400, ty: 400, vx: 0, vy: 0, r: HR.CONFIG.BALL.r, trail: [], alpha: 1 };
    this.handlers = {}; this.last = 0; this.raf = null;
    this.skin = HR.CONFIG.SKINS[0]; this.trail = 'none'; this.levelTheme = null; this.fx = null;
    this.showcase = null; this.showcaseSkin = null;
    this.dir = 'right'; this.frame = { angle: 0, ox: 0, oy: 0 }; this.Lu = 0; this.Lv = 0; this.pendingDir = null; this.trans = null;
    this.perkTimer = 0; this.levelEndTimer = 0; this.levelSuccess = false;
    this.resetRun();
    this.applyCosmetics();
    this.resize();
  }

  on(name, fn) { this.handlers[name] = fn; }
  emit(name, a, b) { const f = this.handlers[name]; if (f) f(a, b); }
  setShowcase(x, y, r) { this.showcase = { x, y, r }; }

  applyCosmetics() {
    const e = HR.Store.data.equipped, C = HR.CONFIG;
    this.skin = C.SKINS.find(s => s.id === e.skin) || C.SKINS[0];
    this.trail = e.trail || 'none';
    const th = C.THEMES.find(x => x.id === e.theme) || C.THEMES[0];
    this.bg.setTheme(this.levelTheme || th);
    // v5: o tema equipado com bioma muda o fundo do menu e do Infinito
    if (this.state === 'idle' && !this.levelTheme) this.bg.setFx(th.fx || null);
  }
  themeFxNow() { const th = HR.CONFIG.THEMES.find(x => x.id === HR.Store.data.equipped.theme); return th && th.fx ? th.fx : null; }

  /* ---------------- frame de direção ---------------- */
  dirSpec(dir) {
    const W = this.W, H = this.H;
    switch (dir) {
      case 'top': return { angle: -Math.PI / 2, ox: 0, oy: H, Lu: H, Lv: W };
      case 'left': return { angle: Math.PI, ox: W, oy: H, Lu: W, Lv: H };
      case 'bottom': return { angle: Math.PI / 2, ox: W, oy: 0, Lu: H, Lv: W };
      default: return { angle: 0, ox: 0, oy: 0, Lu: W, Lv: H };
    }
  }
  setDir(dir, keepBall) {
    const s = this.dirSpec(dir);
    this.dir = dir; this.Lu = s.Lu; this.Lv = s.Lv;
    this.frame = { angle: s.angle, ox: s.ox, oy: s.oy };
    if (!keepBall) { this.ball.x = this.ball.tx = Math.min(this.Lu * HR.CONFIG.BALL.xFrac, HR.CONFIG.BALL.xMax); }
  }
  clampU(u) { const B = HR.CONFIG.BALL; return HR.U.clamp(u, this.Lu * B.uMin, this.Lu * B.uMax); }
  toScreen(u, v) {
    const a = this.frame.angle;
    return { x: this.frame.ox + u * Math.cos(a) - v * Math.sin(a), y: this.frame.oy + u * Math.sin(a) + v * Math.cos(a) };
  }
  uAxis() { const a = this.frame.angle; return { x: Math.cos(a), y: Math.sin(a) }; }
  vAxis() { const a = this.frame.angle; return { x: -Math.sin(a), y: Math.cos(a) }; }
  motionDir() { const a = this.frame.angle; return { x: -Math.cos(a), y: -Math.sin(a) }; }

  resize() {
    const cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    if (!cw || !ch) return;
    this.cw = cw; this.ch = ch;
    this.dpr = Math.min(HR.Perf ? HR.Perf.dprCap() : 2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(cw * this.dpr); this.canvas.height = Math.round(ch * this.dpr);
    this.scale = ch / this.H; this.W = cw / this.scale;
    this.ctx.setTransform(this.scale * this.dpr, 0, 0, this.scale * this.dpr, 0, 0);
    this.rect = this.canvas.getBoundingClientRect();
    const b = this.ball, oldLu = this.Lu, oldLv = this.Lv;
    const vFrac = oldLv ? b.y / oldLv : 0.5, tvFrac = oldLv ? b.ty / oldLv : 0.5;
    const uFrac = oldLu ? b.x / oldLu : HR.CONFIG.BALL.xFrac, tuFrac = oldLu ? b.tx / oldLu : HR.CONFIG.BALL.xFrac;
    if (!this.trans) this.setDir(this.dir, true);
    b.y = HR.U.clamp(vFrac * this.Lv, b.r, this.Lv - b.r); b.ty = HR.U.clamp(tvFrac * this.Lv, b.r, this.Lv - b.r);
    b.x = this.clampU(uFrac * this.Lu); b.tx = this.clampU(tuFrac * this.Lu);
    this.bg.resize(this.W, this.H);
  }

  /* ---------------- ciclo da partida ---------------- */
  resetRun() {
    this.rings = []; this.obstacles = []; this.pickups = []; this.particles.clear();
    this.run = {
      mode: 'endless', level: null, score: 0, coins: 0, perfects: 0, combo: 0, maxCombo: 0, ringsSpawned: 0, ringsPassed: 0, ringsResolved: 0, misses: 0, revives: 0,
      shields: 0, lives: 0, hits: 0, coinsMissed: 0, secondUsed: false, invuln: 0, phaseNumber: 1, phaseIdx: 0, startTime: 0, dist: 0,
      perks: {}, mods: HR.Perks.baseMods(), abilities: [], slowmoT: 0, adaptT: 0, adaptDur: 1, adaptMin: 1, adaptNext: null, magnetT: 0, autoT: 0, ghostT: 0, freezeT: 0, reflexT: 0, starT: 0, lensT: 0, echoT: 0,
      bossWave: 0, levelDone: false, perksOffered: 0, rerollUsed: false, autoPerks: 0,
      dirChanges: 0, nearMisses: 0, shieldsAbsorbed: 0, livesUsed: 0, abilitiesUsed: 0, abUse: {}, cleanStreak: 0, cleanRings: 0, noMissStreak: 0, noMissRings: 0,
      goldRings: 0, doubleRings: 0, comboBonuses: 0, coinsTaken: 0, ringsTop: 0, ringsLeft: 0, rarePerks: 0,
      pickups: 0, anomaliesBeaten: 0, anomalyActive: false, starsUsed: 0, obstaclesDestroyed: 0, gemsFound: 0, flowClock: 0, ghostClock: 0,
      flow: 0, flowV: 0, flowMax: 0, flowTime: 0, centerPickups: 0, eventsDone: 0, core: HR.Core.mods(),
      eventsFired: {}, guardians: 0, sentinels: 0, warps: 0, asteroidsDestroyed: 0, eventHits: 0,
      aegisT: 0, aegisCd: 0, aegisUses: 0, aegisSaves: 0, jetLeft: 0, jetTotal: 0, jetKind: null, jetUsed: false, jetsUsed: 0,
      bholeT: 0, prismT: 0, phoenixT: 0, goldT: 0, microT: 0, cometT: 0, chronoT: 0, novaLeft: 0, angelStreak: 0, maxSpeed: 0
    };
    this.ball.y = this.ball.ty = (this.Lv || this.H) / 2; this.ball.vy = 0; this.ball.vx = 0; this.ball.tx = this.ball.x; this.ball.trail = []; this.ball.alpha = 1;
    this.nextX = (this.Lu || this.W || 500) + 240; this.lastY = this.ball.y; this.pendingDouble = false; this.lastRing = null; this.lastPickupRing = -99;
    this.anomalyT = 0; this.anomalyPending = false;
    this.event = null; this.pendingEvent = null; this.lastEvent = null; this.eventNextRing = HR.CONFIG.EVENT.endlessFrom; this.sentinel = null;
    this.timeScale = 1; this.shake = 0; this.killer = null; this.dyingT = 0; this.pendingDir = null; this.trans = null; this.perkTimer = 0; this.levelEndTimer = 0; this.levelSuccess = false;
    this.bg.setTint(HR.CONFIG.PHASES[0].accent);
  }
  startAttract() { this.demo = true; this.state = 'idle'; this.levelTheme = null; this.fx = null; this.applyCosmetics(); this.bg.setFx(this.themeFxNow()); this.bg.season = HR.Seasons ? HR.Seasons.current() : null; this.resetRun(); this.rings = []; }

  prepareRun(opts) {
    opts = opts || {};
    this.demo = false; this.resetRun();
    const run = this.run;
    run.mode = opts.mode || 'endless'; run.level = opts.level || null;
    run.abilities = HR.Abilities.equipped().map(id => id && HR.Abilities.def(id) ? { id, cd: 0, active: 0 } : null);
    run.core = HR.Core.mods(); run.shields = Math.min(this.shieldCap(), run.shields + run.core.startShield); run.lives += run.core.life;
    if (run.level && run.level.sg) { this.levelTheme = { colors: ['#1c1408', '#0b0804', '#000000'], shapes: 'nebula', stars: true, fx: 'horizon' }; this.fx = 'horizon'; }
    else if (run.level) { const R = HR.REGIONS[run.level.ri], SF = HR.systemFx ? HR.systemFx(run.level.ri, run.level.si || 0) : { fx: R.fx, fx2: null }; this.levelTheme = { colors: R.colors, shapes: R.shapes, stars: R.stars, fx: SF.fx || null }; this.fx = SF.fx || null; this.fx2 = SF.fx2 || null; }
    else { this.levelTheme = null; this.themeFx = run.mode === 'endless' ? this.themeFxNow() : null; this.fx = this.themeFx || this.phaseFor(0).phase.fx || null; }
    if (run.level) this.themeFx = null;
    this.applyCosmetics();
    this.bg.setFx(this.fx, run.level && !run.level.sg ? this.fx2 : null); this.bg.season = null;
    this.setDir(this.dirForRing(0));
    this.ball.y = this.ball.ty = this.Lv / 2; this.ball.vx = this.ball.vy = 0; this.lastY = this.ball.y;
    const ph = this.phaseFor(0);
    run.phaseNumber = ph.number; run.phaseIdx = ph.idx; this.bg.setTint(ph.phase.accent);
    if (HR.Music) { HR.Music.play(run.level && !run.level.sg ? HR.REGIONS[run.level.ri].music : 'singularity'); }
    HR.Audio.setIntensity(run.level ? 0.2 : Math.min(1, (ph.number - 1) / 8));
    this.nextX = this.Lu + 200;
    this.fill();
    this.state = 'ready';
    HR.Input.reset();
    this.emit('ready', run);
  }
  begin() {
    if (this.state !== 'ready') return;
    this.state = 'playing';
    if (!this.run.startTime) this.run.startTime = Date.now();
    this.emit('begin', this.run);
    if (this.run.adaptNext) { this.adapt(this.run.adaptNext); this.run.adaptNext = null; }
    const L = this.run.level;
    if (L && L.sg && !this.demo && !this.run.announced) { this.run.announced = true; this.emit('banner', { title: HR.t('sg_title_' + L.archon).toUpperCase(), sub: L.trial ? HR.t('sg_trial') : HR.t('sg_passage_n', { n: L.passage + 1 }), color: HR.ARCHONS[L.archon].color }); }
    if (L && !L.sg && L.li === 0 && L.si != null && !this.demo && !this.run.announced) { this.run.announced = true; this.emit('banner', { title: HR.t('system_n', { name: HR.Campaign.systemName(L.si) }).toUpperCase(), sub: HR.t('speed_up') + ' · ×' + L.speed.toFixed(2), color: HR.REGIONS[L.ri].accent }); }
  }
  pause() { if (['playing', 'ready', 'transition'].includes(this.state)) { this.prePause = this.state; this.state = 'paused'; } }
  resume() { if (this.state === 'paused') { this.state = this.prePause === 'transition' ? 'transition' : 'ready'; HR.Input.reset(); } }

  /* ---------------- dificuldade / direção ---------------- */
  phaseAt(n) {
    const P = HR.CONFIG.PHASES, R = HR.CONFIG.RUN;
    let idx = Math.floor(n / R.ringsPerPhase), loops = 0;
    const number = idx + 1;
    if (idx >= P.length) { const over = idx - P.length, span = P.length - R.loopFrom; idx = R.loopFrom + (over % span); loops = 1 + Math.floor(over / span); }
    return { phase: P[idx], idx, loops, number };
  }
  phaseFor(n) {
    const L = this.run.level;
    if (L) return { phase: L.params, idx: L.tier, loops: 0, number: L.tier + 1 };
    return this.phaseAt(n);
  }
  waveOfIndex(i) { const L = this.run.level; if (!L || !L.boss) return 0; return Math.min(L.waves - 1, Math.floor(i / Math.ceil(L.rings / L.waves))); }
  // base = sem Jato/Cometa/Crono (usado no espaçamento dos arcos)
  speedAt(n, base) {
    const R = HR.CONFIG.RUN, run = this.run;
    if (this.demo) return 230;
    let v;
    if (run.level) {
      // v5: base da fase (cresce pela galáxia) × rampa dentro da fase (sente acelerar a cada arco)
      const L = run.level, w = run.bossWave;
      v = L.v0 ? L.v0 * (1 + (L.ramp || 0) * HR.U.clamp(n / Math.max(1, L.rings), 0, 1)) : (R.baseSpeed + (L.tier * R.ringsPerPhase + n * 0.4) * R.speedPerRing) * L.speed;
      if (L.params.burst) v *= 1 + L.params.burst * Math.max(0, Math.sin(this.time * 0.8));
      if ((L.boss === 'storm' || L.boss === 'tide' || L.boss === 'cyclone') && w >= 1) v *= 1 + 0.35 * Math.max(0, Math.sin(this.time * 0.9));
      if (L.boss === 'singularity' && w >= 4) v *= 1 + 0.3 * Math.max(0, Math.sin(this.time * 1.1));
    } else v = R.baseSpeed + n * R.speedPerRing;
    if (this.event && this.event.id === 'warp') v *= HR.CONFIG.EVENTS.warp.speed;
    if (!base && run.jetLeft > 0) v *= HR.GEAR.consumables[run.jetKind].speed;
    if (!base && run.cometT > 0) v *= 1.5;
    if (!base && run.chronoT > 0) v *= 0.1;
    // sequência (fluxo): pouco no começo, mais no fim do jogo (Galáxia pela fase; infinito pela fase da corrida)
    const S = HR.CONFIG.SPEED, flowMul = run.level ? (run.level.flowMul != null ? run.level.flowMul : R.flowSpeedMul) : S.endlessFlowBase + S.endlessFlowSpan * Math.min(1, ((run.phaseNumber || 1) - 1) / 9);
    const out = v * (run.mods ? run.mods.speedMul : 1) * (1 + (run.flowV || 0) * flowMul * (run.mods && run.mods.noFlowSpeed ? 0 : 1));
    // teto: Jato/Cometa/Dobra podem passar; o resto fica no limite jogável
    const boosted = (!base && (run.jetLeft > 0 || run.cometT > 0)) || (this.event && this.event.id === 'warp');
    return Math.min(out, R.maxSpeed * (boosted ? 1.9 : 1.3));
  }
  tbAt(n, ph) {
    const R = HR.CONFIG.RUN, L = this.run.level;
    if (L && L.tb0) return Math.max(0.6, L.tb0 - n * 0.4 * R.tbPerRing) * ph.phase.tbMul;
    const nn = L ? L.tier * R.ringsPerPhase + n * 0.4 : n;
    return Math.max(R.tbEnd, R.tbStart - nn * R.tbPerRing) * ph.phase.tbMul * Math.pow(R.loopTbMul, ph.loops);
  }
  dirForRing(index) {
    const L = this.run.level;
    if (L) {
      if (L.boss === 'singularity' && this.waveOfIndex(index) >= 3) return HR.DIRS[Math.floor(index / 3) % 4];
      if (L.dirEvery) return L.dirs[Math.floor(index / L.dirEvery) % L.dirs.length];
      const seg = Math.ceil(L.rings / L.dirs.length);
      return L.dirs[Math.min(Math.floor(index / seg), L.dirs.length - 1)];
    }
    const ph = this.phaseAt(index).phase;
    if (ph.dir === 'swap') return HR.DIRS[Math.floor(index / 5) % 4];
    return ph.dir || 'right';
  }
  shieldCap() { return HR.CONFIG.RUN.shieldCap + (this.run.mods ? this.run.mods.regen + (this.run.mods.capBonus || 0) : 0) + (this.run.core ? this.run.core.shieldCap : 0); }

  // fluxo (ritmo): sobe por arco, zera ao quebrar; flowV é a versão suave usada pelo fundo/música/HUD
  addFlow(perfect) { const F = HR.CONFIG.FLOW, run = this.run; run.flow = Math.min(1, run.flow + (perfect ? F.perPerfect : F.perPass)); run.flowMax = Math.max(run.flowMax, run.flow); }
  breakFlow() { const run = this.run; if (run.flow > 0.02) { run.flow = run.mods.flowkeeper ? run.flow * 0.5 : 0; this.emit('flowbreak'); } }
  updateFlow(dt) {
    const F = HR.CONFIG.FLOW, run = this.run;
    if (this.event && this.event.id === 'warp') run.flow = 1;
    const target = this.state === 'playing' || this.state === 'transition' ? run.flow : 0;
    run.flowV = HR.U.damp(run.flowV, target, target > run.flowV ? F.rise : F.fall, dt);
    if (run.flowV > 0.95 && this.state === 'playing') run.flowTime += dt;
  }

  fill() {
    if (this.pendingDir || this.pendingEvent) return;
    if (this.event && this.event.id !== 'warp' && this.event.id !== 'sentinel') return;
    const L = this.run.level;
    let guard = 0;
    while (this.nextX < this.Lu + 700 && guard++ < 60) {
      if (L && this.run.ringsSpawned >= L.rings) return;
      const need = this.dirForRing(this.run.ringsSpawned);
      if (need !== this.dir && !this.demo) { this.pendingDir = need; return; }
      this.spawnRing();
    }
  }

  // tipo do arco (linguagem de cores): um comportamento por arco, sorteado entre os liberados pela fase
  ringTypeFor(P, L, wave, gold) {
    const U = HR.U, boss = L ? L.boss : null;
    const sw = boss === 'singularity' ? ['pulse', 'blink', 'shrink', 'cyclone', 'all'][Math.min(4, wave)] : null;
    if (this.anomalyPending && !L) { this.anomalyPending = false; return 'anomaly'; }
    if (boss === 'blink' || boss === 'eclipse' || sw === 'blink') return 'ghost';
    if (boss === 'pulse' || boss === 'shrink' || sw === 'pulse' || sw === 'shrink' || sw === 'all') return 'pulse';
    if (boss === 'tide' || boss === 'cyclone' || sw === 'cyclone') return 'wave';
    if (boss === 'spin') return 'spin';
    if (gold) return 'gold';
    const cands = [];
    if (P.osc) cands.push(['wave', 1]); if (P.tiltVar) cands.push(['tilt', 1]); if (P.rot) cands.push(['spin', 0.8]); if (P.shrink) cands.push(['pulse', 0.9]);
    if (!cands.length || !U.chance(P.mix == null ? 0.6 : P.mix)) return 'plain';
    let total = 0; cands.forEach(c => { total += c[1]; });
    let r = Math.random() * total;
    for (const c of cands) { r -= c[1]; if (r <= 0) return c[0]; }
    return cands[cands.length - 1][0];
  }

  spawnRing() {
    const U = HR.U, R = HR.CONFIG.RUN, n = this.run.ringsSpawned, run = this.run, L = run.level, T = HR.CONFIG.RING_TYPES;
    const ph = this.phaseFor(n);
    const P = ph.phase;
    const v = this.speedAt(n, true), tb = this.tbAt(n, ph);
    let spacing = v * tb;
    const dbl = this.pendingDouble;
    if (dbl) spacing *= 0.5;
    const wave = L && L.boss ? this.waveOfIndex(n) : 0;
    let r = Math.max(R.ringMinR, R.ringR * P.radius * Math.pow(R.loopRadiusMul, ph.loops)) * (1 + run.mods.ringRadius);
    if (L && L.boss === 'swarm') r *= [0.95, 0.9, 0.85][wave];
    const warp = this.event && this.event.id === 'warp'; if (warp) r *= HR.CONFIG.EVENTS.warp.radius;
    if (run.lensT > 0) r *= 1.4;
    const gold = (run.mods.goldEvery > 0 && (n + 1) % run.mods.goldEvery === 0) || run.goldT > 0;
    const type = this.demo ? 'plain' : this.ringTypeFor(P, L, wave, gold);
    const sync = P.sync || (L && (L.boss === 'tide' || L.boss === 'cyclone'));
    // comportamento pelo tipo
    let osc = 0, oscF = 0, tilt0 = 0, rot = 0, rotF = 0, shrinkK = 0, pulse = false;
    if (type === 'wave') { osc = Math.max(P.osc, 45) * U.rand(0.7, 1.1); oscF = Math.max(P.oscF, 1.2) * U.rand(0.85, 1.15); }
    else if (type === 'tilt') { tilt0 = (U.chance(0.5) ? -1 : 1) * U.rand(0.32, Math.max(0.5, P.tiltVar)); }
    else if (type === 'spin') { rot = Math.max(P.rot, 0.5); rotF = Math.max(P.rotF, 1.3) * U.rand(0.85, 1.15); tilt0 = U.rand(-0.2, 0.2); }
    else if (type === 'pulse') { shrinkK = P.shrink || 0; pulse = !shrinkK; }
    else if (type === 'anomaly') { r *= HR.CONFIG.ANOMALY.radiusMul; osc = 40; oscF = 0.7; }
    if (L && L.boss && (L.boss === 'pulse' || L.boss === 'tide' || L.boss === 'cyclone')) { osc = Math.max(osc, P.osc || 30); oscF = Math.max(oscF, P.oscF || 1.3); }
    const minY = R.marginY + r + osc, maxY = this.Lv - R.marginY - r - osc;
    const yDelta = dbl ? 70 : P.yDelta;
    let y = U.clamp(this.lastY + U.rand(-yDelta, yDelta), minY, maxY);
    if (type === 'anomaly') y = U.clamp(this.ball.y < this.Lv / 2 ? U.rand(this.Lv * 0.62, maxY) : U.rand(minY, this.Lv * 0.38), minY, maxY); // nasce longe da bola: exige ação
    const ring = {
      x: this.nextX, baseY: y, y, r, baseR: r, tilt0, tilt: tilt0,
      osc, oscF, oscP: sync ? 0 : U.rand(0, 6.28), rot, rotF, rotP: U.rand(0, 6.28), shrinkK, pulse,
      type, color: T[type].color, accent: T[type].color, fx: this.fx,
      coin: (gold || type === 'anomaly') ? false : U.chance(P.coin + (run.mods.coinChance || 0)), coinTaken: false, centerItem: false, resolved: false, missed: false, index: n, flash: 0, hit: false, prevAcross: null, aligned: false,
      phaseNumber: ph.number, gold, alpha: (P.fog || P.dark || type === 'ghost') ? 0 : 1, reflexUsed: false, dbl, lensed: run.lensT > 0
    };
    this.rings.push(ring);
    if (run.novaLeft > 0 && type !== 'anomaly' && !this.demo) { ring.nova = true; run.novaLeft--; }
    if (run.mods.prismEvery && (n + 1) % run.mods.prismEvery === 0) ring.prism = true;
    // obstáculos no vazio entre o arco anterior e este (sempre longe do centro dos dois)
    if (!this.demo && !warp && !this.event && P.obs && this.lastRing && !dbl && spacing >= 240 && U.chance(P.obs)) this.spawnObstacles(this.lastRing, ring, P);
    // Singularidade: um Eco por fase da passagem, no centro de um arco
    if (L && L.eco && !run.ecoSpawned && n >= L.ecoAt && !dbl && type !== 'anomaly' && !this.demo) { run.ecoSpawned = true; ring.coin = false; this.spawnPickup(ring, spacing, true, 'eco'); }
    // item: no centro do arco (sem moeda) ou fora da linha
    if (!this.demo && !warp && P.pick && !dbl && !ring.centerItem && n - this.lastPickupRing >= HR.CONFIG.PICKUP.minGap && U.chance(P.pick)) this.spawnPickup(ring, spacing, !ring.coin && type !== 'anomaly' && U.chance(HR.CONFIG.PICKUP.centerChance));
    this.lastRing = ring;
    this.nextX += spacing; this.lastY = y; run.ringsSpawned++;
    let dblChance = P.dbl || 0;
    if (L && L.boss === 'swarm') dblChance = [0.55, 0.75, 0.9][wave];
    this.pendingDouble = !dbl && type !== 'anomaly' && U.chance(dblChance);
  }

  spawnObstacles(prev, ring, P) {
    const U = HR.U, O = HR.CONFIG.OBSTACLE, R = HR.CONFIG.RUN;
    const keep = O.keepAway + Math.max(prev.r, ring.r) + Math.max(prev.osc, ring.osc);
    const top = [R.marginY - 20, Math.min(prev.y, ring.y) - keep], bot = [Math.max(prev.y, ring.y) + keep, this.Lv - R.marginY + 20];
    const zones = [top, bot].filter(z => z[1] - z[0] >= 60);
    if (!zones.length) return;
    const count = zones.length > 1 && (P.obs > 0.3) && U.chance(0.35) ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const z = count === 2 ? zones[i] : U.pick(zones);
      const rr = U.rand(O.r[0], O.r[1]);
      this.obstacles.push({ x: U.rand(prev.x + 80, ring.x - 80), y: U.rand(z[0] + rr, z[1] - rr), r: rr, rot: U.rand(0, 6.28), vr: U.rand(-1.5, 1.5), seed: Math.random() * 100, dead: false });
    }
  }

  spawnPickup(ring, spacing, center, forceId) {
    const U = HR.U, K = HR.CONFIG.PICKUP, list = HR.CONFIG.PICKUPS;
    const wOf = p => p.w * (p.id === 'gem' && this.run.mods.lucky ? 3 : 1);
    let total = 0; list.forEach(p => { total += wOf(p); });
    let r = Math.random() * total, def = list[0];
    for (const p of list) { r -= wOf(p); if (r <= 0) { def = p; break; } }
    if (def.id === 'life' && this.run.lives >= 2) def = list[0];
    if (forceId === 'eco') def = { id: 'eco', color: '#fff3c2' };
    if (center) { ring.centerItem = true; this.pickups.push({ x: ring.x, y: ring.y, baseY: ring.y, r: K.r, id: def.id, color: def.color, seed: U.rand(0, 6.28), taken: false, ring, center: true }); this.lastPickupRing = this.run.ringsSpawned; return; }
    const side = U.chance(0.5) ? -1 : 1;
    const y = U.clamp(ring.y + side * (ring.r + U.rand(K.offset[0], K.offset[1])), 34, this.Lv - 34);
    this.pickups.push({ x: ring.x + spacing * 0.5, y, baseY: y, r: K.r, id: def.id, color: def.color, seed: U.rand(0, 6.28), taken: false });
    this.lastPickupRing = this.run.ringsSpawned;
  }

  /* ---------------- transição de direção ---------------- */
  startTransition(dir) {
    const from = Object.assign({}, this.frame, { Lu: this.Lu, Lv: this.Lv }), to = this.dirSpec(dir);
    let da = to.angle - from.angle;
    while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
    this.trans = { t: 0, dur: 0.9, from, to, da, dir };
    this.state = 'transition'; this.rings = []; this.obstacles = []; this.pickups = []; this.pendingDir = null; this.ball.trail = []; this.lastRing = null;
    this.run.dirChanges++;
    HR.Audio.sfx('whoosh');
    this.emit('direction', { dir, arrow: HR.t('dir_' + dir) });
  }
  updateTransition(dt) {
    const T = this.trans, b = this.ball; T.t += dt;
    const k0 = Math.min(1, T.t / T.dur), k = k0 < 0.5 ? 4 * k0 * k0 * k0 : 1 - Math.pow(-2 * k0 + 2, 3) / 2;
    this.frame.angle = T.from.angle + T.da * k;
    this.frame.ox = HR.U.lerp(T.from.ox, T.to.ox, k); this.frame.oy = HR.U.lerp(T.from.oy, T.to.oy, k);
    const Lv = HR.U.lerp(T.from.Lv, T.to.Lv, k), Lu = HR.U.lerp(T.from.Lu, T.to.Lu, k);
    const rv = Lv / this.Lv, ru = Lu / this.Lu;
    b.y *= rv; b.ty *= rv; b.x *= ru; b.tx *= ru;
    this.Lv = Lv; this.Lu = Lu;
    if (T.t >= T.dur) {
      this.setDir(T.dir, true);
      b.y = HR.U.clamp(b.y, b.r, this.Lv - b.r); b.ty = HR.U.clamp(b.ty, b.r, this.Lv - b.r);
      b.x = this.clampU(b.x); b.tx = this.clampU(b.tx); this.lastY = b.y;
      this.trans = null; this.nextX = this.Lu + 300; this.fill();
      this.state = 'playing';
      this.adapt('turn');
      this.emit('status', this.run);
    }
  }

  /* ---------------- habilidades ---------------- */
  useAbility(slot) {
    const run = this.run, ab = run.abilities[slot];
    if (!ab || ab.cd > 0 || this.state !== 'playing') return false;
    const dur = HR.Abilities.duration(ab.id, run);
    ab.cd = HR.Abilities.cooldown(ab.id, run); ab.active = dur;
    switch (ab.id) {
      case 'slowmo': run.slowmoT = dur; break;
      case 'magnet': run.magnetT = dur; break;
      case 'shieldpulse': run.shields = Math.min(this.shieldCap(), run.shields + 1); ab.active = 0; this.emit('status', run); break;
      case 'autopilot': run.autoT = dur; break;
      case 'ghost': run.ghostT = dur; break;
      case 'freeze': run.freezeT = dur; break;
      case 'lens': run.lensT = dur; this.rings.forEach(r => { if (!r.resolved && !r.lensed) { r.lensed = true; r.r *= 1.4; r.baseR *= 1.4; } }); ab.active = dur; break;
      case 'echo': run.echoT = dur; break;
      case 'blackhole': run.bholeT = dur; break;
      case 'prism': run.prismT = dur; break;
      case 'phoenix': run.phoenixT = dur; break;
      case 'goldrush': run.goldT = dur; this.rings.forEach(r => { if (!r.resolved && r.type !== 'anomaly' && !r.gold) { r.gold = true; r.coin = false; r.flash = 1; } }); break;
      case 'micro': run.microT = dur; break;
      case 'comet': run.cometT = dur; break;
      case 'chrono': run.chronoT = dur; break;
      case 'supernova': {
        ab.active = 0; let k = 3; const b = this.ball;
        this.rings.filter(r => !r.resolved && r.x > b.x && r.type !== 'anomaly').sort((p, q) => p.x - q.x).forEach(r => { if (k > 0) { r.nova = true; r.flash = 1; k--; } });
        run.novaLeft = k;
        this.obstacles.forEach(o => { if (!o.dead) { o.dead = true; run.obstaclesDestroyed++; if (o.rock) run.asteroidsDestroyed++; } });
        this.particles.burst({ x: b.x, y: b.y, n: 1, speed: 0, color: '#ffe27a', size: 70, life: 0.9, type: 'wave' });
        this.particles.burst({ x: b.x, y: b.y, n: 50, speed: 700, color: ['#ffe27a', '#ffffff', '#ff9f43'], size: 7, life: 1, type: 'spark', drag: 0.93 });
        this.shake = 12; break;
      }
      case 'pulse': {
        ab.active = 0; const b = this.ball;
        this.obstacles.forEach(o => { if (!o.dead && Math.hypot(o.x - b.x, o.y - b.y) < 280) { o.dead = true; run.obstaclesDestroyed++; if (o.rock) run.asteroidsDestroyed++; this.particles.burst({ x: o.x, y: o.y, n: 10, speed: 280, color: ['#c9d2ea', '#ff9f43'], size: 5, life: 0.6, type: 'shard' }); } });
        this.pickups.forEach(p => { if (!p.taken && Math.hypot(p.x - b.x, p.y - b.y) < 340) p.pulled = true; });
        this.particles.burst({ x: b.x, y: b.y, n: 1, speed: 0, color: '#ff9f43', size: 30, life: 0.7, type: 'wave' });
        this.shake = 6; break;
      }
    }
    run.abilitiesUsed++; run.abUse[ab.id] = (run.abUse[ab.id] || 0) + 1;
    HR.Store.data.stats.abilitiesUsed++;
    HR.Audio.sfx(ab.id === 'slowmo' ? 'revive' : 'shield');
    HR.U.vibrate(15);
    this.particles.burst({ x: this.ball.x, y: this.ball.y, n: 22, speed: 380, color: [HR.Abilities.def(ab.id).color, '#ffffff'], size: 5, life: 0.7, type: 'spark' });
    this.emit('ability', { slot, id: ab.id, dur, cd: ab.cd });
    HR.Analytics.log('ability_use', { id: ab.id, rings: run.ringsPassed });
    return true;
  }
  /* ---------------- Égide e Jato (v5) ---------------- */
  useAegis() {
    const run = this.run, G = HR.GEAR.consumables.aegis;
    if (this.demo || this.state !== 'playing' || run.aegisT > 0 || run.aegisCd > 0 || run.mode === 'practice') return false;
    if (run.level && run.level.noAegis) { this.emit('banner', { title: HR.t('aegis_blocked'), color: '#ff5e7e' }); return false; }
    if (!HR.Consumables.use('aegis')) { this.emit('banner', { title: HR.t('aegis_none'), color: '#8d97b3' }); HR.Audio.sfx('error'); return false; }
    const sk = HR.Gear.current('aegis');
    run.aegisT = G.dur; run.aegisUses++; HR.Store.data.stats5.aegisUsed++; HR.Store.save();
    this.particles.burst({ x: this.ball.x, y: this.ball.y, n: 1, speed: 0, color: sk.color, size: 40, life: 0.6, type: 'wave' });
    this.particles.burst({ x: this.ball.x, y: this.ball.y, n: 24, speed: 340, color: [sk.color, sk.color2], size: 5, life: 0.7, type: 'spark' });
    HR.Audio.sfx('shield'); HR.U.vibrate([15, 20, 25]);
    this.emit('banner', { title: HR.t('aegis_on'), sub: '30 s', color: sk.color });
    this.emit('gear', { kind: 'aegis' });
    return true;
  }
  useJet(kind) {
    const run = this.run, G = HR.GEAR.consumables[kind], L = run.level;
    if (!G || this.demo || run.jetUsed || run.ringsResolved > 0 || !['ready', 'playing'].includes(this.state) || run.mode === 'practice') return false;
    if (L && (L.boss || L.sg)) { this.emit('banner', { title: HR.t('jet_boss'), color: '#ff5e7e' }); return false; }
    if (!HR.Consumables.use(kind)) return false;
    run.jetUsed = true; run.jetKind = kind; run.jetLeft = L ? Math.min(G.rings, Math.floor(L.rings * 0.5)) : G.rings; run.jetTotal = run.jetLeft; run.jetsUsed++;
    HR.Store.data.stats5[kind === 'megajet' ? 'megajetsUsed' : 'jetsUsed']++; HR.Store.save();
    if (this.state === 'ready') this.begin();
    const sk = HR.Gear.current('jet'), col = sk.color === 'rainbow' ? '#ff5ecf' : sk.color;
    run.invuln = Math.max(run.invuln, 0.6); this.shake = 9;
    this.particles.burst({ x: this.ball.x, y: this.ball.y, n: 1, speed: 0, color: col, size: 50, life: 0.7, type: 'wave' });
    this.particles.burst({ x: this.ball.x, y: this.ball.y, n: 30, speed: 520, color: [col, sk.color2, '#ffffff'], size: 6, life: 0.8, type: 'spark' });
    HR.Audio.sfx('levelup'); HR.U.vibrate([20, 30, 60]);
    this.emit('banner', { title: HR.t(kind === 'megajet' ? 'megajet_go' : 'jet_go'), sub: HR.t('jet_track'), color: col });
    this.emit('gear', { kind: 'jet' });
    return true;
  }
  endJet() {
    const run = this.run; run.jetLeft = 0; run.invuln = Math.max(run.invuln, 1.2); run.autoT = Math.min(run.autoT, 0.05);
    this.particles.burst({ x: this.ball.x, y: this.ball.y, n: 1, speed: 0, color: '#ffffff', size: 36, life: 0.6, type: 'wave' });
    this.emit('banner', { title: HR.t('jet_end'), color: '#ffffff' }); this.emit('gear', { kind: 'jet' });
  }
  updateAbilities(dt) {
    const run = this.run;
    if (run.aegisT > 0) {
      const b0 = run.aegisT; run.aegisT = Math.max(0, run.aegisT - dt);
      [3, 2, 1].forEach(s => { if (b0 > s && run.aegisT <= s) HR.Audio.sfx('tick'); });
      if (run.aegisT <= 0) { run.aegisCd = HR.GEAR.consumables.aegis.cd * (run.mods.aegisCd || 1); this.emit('banner', { title: HR.t('aegis_end'), color: '#8d97b3' }); this.emit('gear', { kind: 'aegis' }); }
    } else if (run.aegisCd > 0) run.aegisCd = Math.max(0, run.aegisCd - dt);
    if (run.jetLeft > 0) {
      run.autoT = Math.max(run.autoT, 0.1); run.invuln = Math.max(run.invuln, 0.25);
      if (Math.random() < dt * 50) { const sk = HR.Gear.current('jet'), col = sk.color === 'rainbow' ? HR.U.hsl((this.time * 300) % 360, 95, 65, 1) : sk.color; this.particles.burst({ x: this.ball.x - this.ball.r * 1.5, y: this.ball.y + HR.U.rand(-6, 6), n: 1, speed: 160, angle: Math.PI, spread: 0.5, color: [col, sk.color2], size: 4, life: 0.35, type: 'spark' }); }
    }
    run.abilities.forEach(ab => { if (!ab) return; if (ab.cd > 0) ab.cd = Math.max(0, ab.cd - dt); if (ab.active > 0) ab.active = Math.max(0, ab.active - dt); });
    let ending = 0;
    if (run.cometT > 0) run.autoT = Math.max(run.autoT, 0.1);
    if (run.bholeT > 0) {
      const b = this.ball;
      this.obstacles.forEach(o => { if (!o.dead && Math.hypot(o.x - b.x, o.y - b.y) < 300) { o.dead = true; run.obstaclesDestroyed++; if (o.rock) run.asteroidsDestroyed++; this.particles.burst({ x: o.x, y: o.y, n: 8, speed: 180, angle: Math.atan2(b.y - o.y, b.x - o.x), spread: 0.4, color: ['#a88bff', '#ffffff'], size: 4, life: 0.5, type: 'spark' }); } });
      this.pickups.forEach(p => { if (!p.taken && Math.hypot(p.x - b.x, p.y - b.y) < 460) p.pulled = true; });
    }
    ['slowmoT', 'magnetT', 'autoT', 'ghostT', 'freezeT', 'reflexT', 'starT', 'lensT', 'echoT', 'bholeT', 'prismT', 'phoenixT', 'goldT', 'microT', 'cometT', 'chronoT'].forEach(k => {
      if (run[k] <= 0) return;
      const before = run[k]; run[k] = Math.max(0, run[k] - dt);
      if (k !== 'reflexT' && before > 0.9) { [3, 2, 1].forEach(s => { if (before > s && run[k] <= s) HR.Audio.sfx('tick'); }); }
      if (k !== 'reflexT' && run[k] > 0 && run[k] < 1.5 && before >= 0.9) ending = Math.max(ending, 1.5 - run[k]);
    });
    run.powerEnding = ending;
    // ascensão: fluxo (piloto em pulsos → permanente) e intangível (fantasma por ciclos → permanente); suspensos na anomalia
    const M = run.mods;
    if (M.autoflow && !run.anomalyActive) { run.flowClock += dt; const on = M.autoflow >= 3 || (run.flowClock % [0, 15, 12][M.autoflow]) < [0, 3, 6][M.autoflow]; if (on) run.autoT = Math.max(run.autoT, 0.08); }
    if (M.intangible) { run.ghostClock += dt; const on = M.intangible >= 3 || (run.ghostClock % 10) < [0, 4, 7][M.intangible]; if (on) run.ghostT = Math.max(run.ghostT, 0.08); }
  }
  effectiveTimeScale() {
    const run = this.run;
    let ts = 1;
    if (this.state === 'dying') ts *= HR.CONFIG.RUN.deathSlowmo;
    if (run.adaptT > 0) ts *= this.adaptScale();
    if (run.slowmoT > 0) ts *= 0.45;
    else if (run.reflexT > 0) ts *= 0.5;
    return ts;
  }
  // câmera lenta de adaptação (v5.1): depois de um susto (Égide quebrada, erro, sequência perdida, poder escolhido, curva)
  // o tempo cai e volta suave à velocidade normal; o mais forte vence se dois vierem juntos
  adapt(kind) {
    const run = this.run, A = HR.CONFIG.ADAPT[kind];
    if (!A || this.demo || !run || HR.Store.data.settings.adaptSlowmo === false) return;
    if (run.adaptT > 0 && this.adaptScale() <= A.min) return;
    run.adaptMin = A.min; run.adaptDur = A.dur; run.adaptT = A.dur;
  }
  adaptScale() {
    const run = this.run; if (!run || !(run.adaptT > 0)) return 1;
    const p = 1 - run.adaptT / run.adaptDur, k = p < 0.3 ? 0 : (p - 0.3) / 0.7, e = k * k * (3 - 2 * k);
    return run.adaptMin + (1 - run.adaptMin) * e;
  }
  protectedNow() { const run = this.run; return this.demo || run.invuln > 0 || run.ghostT > 0 || run.starT > 0 || run.jetLeft > 0 || run.cometT > 0; }
  // raio efetivo da bola (perk Compacta, habilidade Micro)
  ballR() { const m = this.run.mods; return this.ball.r * (m && m.ballScale ? m.ballScale : 1) * (this.run.microT > 0 ? 0.6 : 1); }

  /* ---------------- perks ---------------- */
  maybeOfferPerk() {
    if (this.run.jetLeft > 0) return;
    const run = this.run, every = 10;
    if (run.ringsPassed > 0 && run.ringsPassed % every === 0 && run.perksOffered < Math.floor(run.ringsPassed / every)) {
      if (run.level && run.ringsResolved >= run.level.rings) return;
      run.perksOffered = Math.floor(run.ringsPassed / every);
      // escolha automática (ligada pelo jogador) a partir da 4ª oferta: não pausa
      if (HR.Store.data.settings.autoPerk && run.perksOffered > HR.CONFIG.AUTOPERK.afterOffers) {
        const id = HR.Perks.autoPick(run);
        if (id) { HR.Perks.take(run, id); run.autoPerks++; HR.Store.data.stats.perksTaken++; const p = HR.Perks.def(id); if (p && p.rarity !== 'common') run.rarePerks++; this.emit('autoperk', { id }); this.adapt('autoperk'); this.emit('status', run); }
        return;
      }
      this.perkTimer = 0.7;
    }
  }
  openPerks() {
    const offers = HR.Perks.offer(this.run, 3);
    if (!offers.length) return;
    this.state = 'perk';
    this.emit('perk', { offers, rings: this.run.ringsPassed });
  }
  choosePerk(id) {
    if (this.state !== 'perk') return;
    if (id) {
      HR.Perks.take(this.run, id); HR.Store.data.stats.perksTaken++; HR.Audio.sfx('buy');
      const p = HR.Perks.def(id); if (p && p.rarity !== 'common') this.run.rarePerks++;
      HR.Store.data.stats.bestPerksRun = Math.max(HR.Store.data.stats.bestPerksRun, Object.keys(this.run.perks).length);
    }
    else { this.run.coins += 15; HR.Audio.sfx('coin'); }
    this.state = 'ready'; HR.Input.reset(); this.run.adaptNext = 'perk';
    this.emit('status', this.run);
    this.emit('ready', this.run);
  }
  rerollPerks() { if (this.state !== 'perk') return []; return HR.Perks.offer(this.run, 3); }

  /* ---------------- eventos (v4) ---------------- */
  queueEvent(id) {
    if (this.demo || this.event || this.pendingEvent || !HR.CONFIG.EVENTS[id]) return false;
    this.pendingEvent = id; this.lastEvent = id;
    HR.Audio.sfx('alarm');
    this.emit('event', { phase: 'warn', id });
    return true;
  }
  startEvent(id) {
    const E = HR.CONFIG.EVENTS[id], run = this.run, U = HR.U;
    this.pendingEvent = null;
    this.rings = []; this.obstacles = this.obstacles.filter(o => o.x < this.ball.x - 40);
    this.event = { id, t: 0, dur: E.dur * (id === 'warp' && run.mods.warpcore ? 1.5 : 1), spawnT: 0, k: 0, passed: 0, hits0: run.hits, shields0: run.shieldsAbsorbed };
    if (id === 'sentinel') { this.sentinel = { x: this.Lu * 0.86, y: this.ball.y, fireT: 1.0, leaving: false, leaveT: 0, blink: 0 }; }
    if (id === 'warp') { run.warps++; this.particles.burst({ x: this.ball.x, y: this.ball.y, n: 1, speed: 0, color: '#4cf0ff', size: 40, life: 0.8, type: 'wave' }); }
    this.nextX = this.Lu + 220;
    HR.Audio.sfx(id === 'bonanza' ? 'reward' : 'phase');
    if (HR.Audio.setIntensity) HR.Audio.setIntensity(Math.min(1, (HR.Music && HR.Music.intensity || 0.5) + 0.2));
    this.emit('event', { phase: 'start', id, dur: E.dur });
    HR.Analytics.log('event_start', { id, rings: run.ringsPassed, mode: run.mode });
    void U;
  }
  updateEvent(sdt, dt) {
    const ev = this.event; if (!ev) return;
    const E = HR.CONFIG.EVENTS[ev.id], U = HR.U, run = this.run, b = this.ball;
    ev.t += sdt;
    if (ev.id === 'asteroids') {
      ev.spawnT -= sdt;
      if (ev.spawnT <= 0 && ev.t < ev.dur - 1.2) {
        ev.spawnT = E.every;
        const y = U.rand(40, this.Lv - 40);
        if (U.chance(0.28)) this.pickups.push({ x: this.Lu + 40, y, baseY: y, r: 16, id: 'coins', val: 3, color: '#ffcf4a', seed: U.rand(0, 6.28), taken: false });
        else { const O = HR.CONFIG.OBSTACLE, rr = U.rand(O.rock[0], O.rock[1]); this.obstacles.push({ x: this.Lu + 40, y, r: rr, rot: U.rand(0, 6.28), vr: U.rand(-2, 2), seed: Math.random() * 100, dead: false, rock: true, vx: -U.rand(30, 150), vy: U.rand(-70, 70) }); }
      }
    } else if (ev.id === 'bonanza') {
      ev.spawnT -= sdt;
      if (ev.spawnT <= 0 && ev.t < ev.dur - 0.8) { ev.spawnT = E.every; const y = this.Lv / 2 + Math.sin(ev.t * 2.6) * this.Lv * 0.34; this.pickups.push({ x: this.Lu + 40, y, baseY: y, r: 15, id: 'coins', val: E.val, color: '#ffcf4a', seed: U.rand(0, 6.28), taken: false }); }
    } else if (ev.id === 'sentinel') {
      const S = this.sentinel;
      if (S && !S.leaving) {
        S.fireT -= sdt; S.blink = S.fireT < 0.4 && ev.t < ev.dur - 0.6 ? 1 : 0;
        if (S.fireT <= 0 && ev.t < ev.dur - 0.6) {
          S.fireT = E.fire;
          const vy = U.clamp((b.y - S.y) * 0.5, -110, 110);
          this.obstacles.push({ x: S.x - 26, y: S.y, r: 9, rot: 0, vr: 0, seed: 0, dead: false, shot: true, vx: -E.shot, vy });
          HR.Audio.sfx('miss');
        }
      }
    } else if (ev.id === 'guardian') {
      if (ev.k < 3 && !this.rings.some(r => !r.resolved)) {
        const R = HR.CONFIG.RUN, r = R.ringR * E.sizes[ev.k] * (1 + run.mods.ringRadius);
        const minY = R.marginY + r * 0.6, maxY = this.Lv - R.marginY - r * 0.6;
        const y = U.clamp(this.Lv / 2 + (ev.k % 2 ? -1 : 1) * this.Lv * 0.12, minY, maxY);
        this.rings.push({ x: this.Lu + 260, baseY: y, y, r, baseR: r, tilt0: 0, tilt: 0, osc: 90 - ev.k * 20, oscF: 0.9 + ev.k * 0.2, oscP: U.rand(0, 6.28), rot: 0, rotF: 0, rotP: 0, shrinkK: 0, pulse: false, type: 'guardian', color: E.color, accent: E.color, fx: this.fx, coin: false, coinTaken: false, centerItem: false, resolved: false, missed: false, index: 900 + ev.k, flash: 0, hit: false, prevAcross: null, aligned: false, phaseNumber: run.phaseNumber, gold: false, alpha: 1, reflexUsed: false, dbl: false, event: true, k: ev.k });
        ev.k++;
      }
      if (ev.k >= 3 && this.rings.every(r => r.resolved)) this.endEvent(ev.passed >= 3);
      return;
    }
    if (ev.dur && ev.t >= ev.dur) this.endEvent(ev.id === 'bonanza' || ev.id === 'warp' ? true : run.hits === ev.hits0 && run.shieldsAbsorbed === ev.shields0);
  }
  onEventRing(r) {
    const ev = this.event; if (!ev) return;
    if (!r.missed && !r.hit) ev.passed++;
    this.discoverRing('guardian');
  }
  endEvent(ok) {
    const ev = this.event; if (!ev) return;
    const E = HR.CONFIG.EVENTS[ev.id], run = this.run, P = this.particles;
    let coins = 0;
    if (ok) {
      run.eventsDone++;
      const wm = run.mods.warpcore ? 2 : 1;
      if (E.coins) coins = this.addCoins(E.coins * wm);
      if (E.score) run.score += E.score * wm;
      if (ev.id === 'guardian') run.guardians++;
      if (ev.id === 'sentinel') run.sentinels++;
      P.burst({ x: this.ball.x, y: this.ball.y, n: 36, speed: 480, color: [E.color, '#ffffff'], size: 6, life: 0.9, type: 'spark' });
      P.burst({ x: this.ball.x, y: this.ball.y, n: 1, speed: 0, color: E.color, size: 36, life: 0.8, type: 'wave' });
      HR.Audio.sfx('great'); HR.U.vibrate([20, 30, 40]);
    } else HR.Audio.sfx('error');
    if (this.sentinel) { this.sentinel.leaving = true; this.sentinel.leaveT = 0; setTimeout(() => { if (this.sentinel && this.sentinel.leaving) this.sentinel = null; }, 1500); }
    this.event = null;
    this.rings = this.rings.filter(r => !r.resolved || r.x > this.ball.x);
    this.nextX = Math.max(this.nextX, this.Lu + 240);
    this.emit('event', { phase: 'end', id: ev.id, ok, coins, score: ok ? (E.score || 0) : 0 });
    this.emit('score', run, false);
    HR.Analytics.log('event_end', { id: ev.id, ok });
  }

  /* ---------------- atualização ---------------- */
  update(dt) {
    this.time += dt;
    const s = this.state, R = HR.CONFIG.RUN, run = this.run;
    if (s === 'idle') { this.updateShowcase(dt); this.particles.update(dt); this.bg.update(dt, 10, { x: -1, y: 0 }, 0); return; }
    if (s === 'transition') { this.updateTransition(dt); if (this.state === 'transition') this.updateBall(dt, dt); this.particles.update(dt); this.updateFlow(dt); this.bg.update(dt, 40, this.motionDir(), run.flowV); return; }
    this.timeScale = this.effectiveTimeScale();
    const sdt = dt * this.timeScale;
    if (s === 'playing') this.updateAbilities(dt);
    if (s === 'playing' && run.adaptT > 0) run.adaptT = Math.max(0, run.adaptT - dt);
    if (s === 'playing' || s === 'dying') this.moveRings(sdt);
    if (s === 'playing' || s === 'ready') this.updateBall(sdt, dt);
    if (s === 'playing') { this.checkRings(); this.checkReflex(); this.checkField(dt); this.updateAnomaly(dt); this.updateEvent(sdt, dt); }
    if (s === 'dying') {
      this.dyingT += dt;
      this.ball.alpha = Math.max(0, 1 - this.dyingT * 3);
      if (this.dyingT >= R.deathTime) {
        this.timeScale = 1;
        if (this.canRevive()) { this.state = 'revive'; this.emit('revive', run); }
        else this.finishRun(false);
      }
    }
    if (run.invuln > 0) run.invuln -= sdt;
    for (const r of this.rings) { if (r.flash > 0) r.flash = Math.max(0, r.flash - dt * 3); if (r.shatterT) r.shatterT += dt; }
    // arco que sai da tela sem ter sido resolvido (ex.: passou durante a animação de morte) conta como erro
    if (!this.demo) for (const r of this.rings) if (!r.resolved && r.x <= -r.r * 2 - 60) { r.resolved = true; r.missed = true; this.ringResolved(r); }
    this.rings = this.rings.filter(r => r.x > -r.r * 2 - 60 && !(r.shatterT > 0.55));
    this.obstacles = this.obstacles.filter(o => o.x > -80 && !o.dead);
    this.pickups = this.pickups.filter(p => p.x > -60 && !p.taken);
    if (s === 'playing' && this.pendingDir && !this.rings.length) { this.startTransition(this.pendingDir); return; }
    if (s === 'playing' && this.pendingEvent && !this.pendingDir && this.rings.every(r => r.resolved)) { this.startEvent(this.pendingEvent); return; }
    if (s === 'playing' || s === 'ready') this.fill();
    // rede de segurança: fase sem arcos pendentes que não terminou é encerrada (nenhuma fase fica presa)
    const Lw = run.level;
    if (s === 'playing' && Lw && !run.levelDone && !this.event && !this.pendingEvent && !this.pendingDir && !this.trans && run.ringsSpawned >= Lw.rings && this.rings.every(r => r.resolved)) {
      run.stuckT = (run.stuckT || 0) + dt;
      if (run.stuckT > 1.5) { run.ringsResolved = Math.max(run.ringsResolved, Lw.rings - 1); this.ringResolved(); HR.Analytics.log('level_watchdog', { id: Lw.id }); }
    } else run.stuckT = 0;
    if (this.perkTimer > 0 && s === 'playing') { this.perkTimer -= dt; if (this.perkTimer <= 0) this.openPerks(); }
    if (this.levelEndTimer > 0 && s === 'playing') { this.levelEndTimer -= dt; if (this.levelEndTimer <= 0) this.finishRun(this.levelSuccess); }
    this.particles.update(dt);
    this.updateFlow(dt);
    const moving = s === 'playing' || s === 'dying';
    const F = HR.CONFIG.FLOW;
    this.bg.update(dt, moving ? this.speedAt(run.ringsPassed) * this.timeScale * (F.bgBase + F.bgMul * run.flowV) : 0, this.motionDir(), run.flowV);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 30);
  }

  // anomalias (só no infinito): a cada ~75 s um arco imune a poderes; aviso antes; exige ação humana
  updateAnomaly(dt) {
    const run = this.run, A = HR.CONFIG.ANOMALY;
    run.anomalyActive = this.rings.some(r => r.type === 'anomaly' && !r.resolved);
    if (run.mode !== 'endless' || run.ringsPassed < A.fromRing || this.event || this.pendingEvent) return;
    if (this.anomalyT === 0) this.anomalyT = A.every * 0.5;
    if (run.anomalyActive || this.anomalyPending) return;
    this.anomalyT -= dt;
    if (this.anomalyT <= 0) {
      this.anomalyPending = true;
      this.anomalyT = A.every + HR.U.rand(-A.jitter, A.jitter);
      HR.Audio.sfx('alarm');
      this.emit('anomaly', { phase: 'warn' });
    }
  }

  // mecânicas de região e de chefe aplicadas arco a arco; obstáculos e itens acompanham o mundo
  moveRings(dt) {
    const run = this.run, v = this.speedAt(run.ringsPassed), U = HR.U, b = this.ball;
    run.dist += v * dt;
    this.nextX -= v * dt;
    const frozen = run.freezeT > 0;
    const L = run.level, wave = run.bossWave, P = L ? L.params : null, boss = L ? L.boss : null;
    const t = this.time;
    const sw = boss === 'singularity' ? ['pulse', 'blink', 'shrink', 'cyclone', 'all'][Math.min(4, wave)] : null;
    const doPulse = boss === 'pulse' || sw === 'pulse' || sw === 'all';
    const doBlink = boss === 'blink' || sw === 'blink';
    const bossShrink = boss === 'shrink' || sw === 'shrink' || sw === 'all';
    const doSpin = boss === 'spin';
    const doEclipse = boss === 'eclipse';
    const light = doEclipse ? 0.5 + 0.5 * Math.sin(t * [1.2, 1.6, 2.0][wave]) : 1;
    const darkR = boss === 'singularity' && sw === 'all' ? 380 : (P && P.dark ? P.dark : 0);
    for (const r of this.rings) {
      r.x -= v * dt;
      if (!frozen) {
        if (r.osc) {
          let amp = r.osc, f = r.oscF;
          if (boss === 'tide') { amp = [70, 95, 120][wave]; f = [1.6, 2.0, 2.4][wave]; }
          if (sw === 'cyclone' || sw === 'all') { amp = Math.max(amp, 60); f = Math.max(f, 1.8); }
          r.y = r.baseY + Math.sin(t * f + r.oscP) * amp;
        }
        if (r.rot) r.tilt = r.tilt0 + Math.sin(t * r.rotF + r.rotP) * r.rot;
        if (doSpin) r.tilt = r.tilt0 + Math.sin(t * [1.6, 2.2, 2.8][wave] + r.rotP) * [0.7, 0.85, 1.0][wave];
        if (r.type === 'anomaly') r.tilt = Math.sin(t * 0.9 + r.rotP) * 0.25;
      }
      let rr = r.baseR;
      if (doPulse) { const amp = [0.22, 0.28, 0.32][Math.min(2, wave)], f = [2.0, 2.4, 2.8][Math.min(2, wave)]; rr = r.baseR * (1 + amp * Math.sin(t * f + r.oscP)); }
      else if (r.pulse) rr = r.baseR * (1 + 0.18 * Math.sin(t * 2.2 + r.oscP));
      if ((bossShrink || r.shrinkK) && r.x > b.x) {
        const amp = bossShrink ? [0.25, 0.32, 0.4][Math.min(2, wave)] : r.shrinkK;
        const k = U.clamp(1 - (r.x - b.x) / 700, 0, 1);
        rr *= (1 - amp * k);
      }
      r.r = rr;
      let a = 1;
      if (P && P.fog) a = Math.min(a, U.clamp((P.fog - (r.x - b.x)) / 140, 0, 1));
      if (darkR) a = Math.min(a, U.clamp((darkR + 60 - Math.hypot(r.x - b.x, r.y - b.y)) / 120, 0.06, 1));
      if (doBlink) { const reveal = [380, 310, 250][Math.min(2, wave)]; a = Math.min(a, U.clamp((reveal - (r.x - b.x)) / 110, 0, 1)); }
      if (doEclipse) a = Math.min(a, r.x - b.x < 170 ? 1 : U.clamp(0.08 + light * (0.92 - wave * 0.12), 0.05, 1));
      r.alpha = a;
    }
    for (const o of this.obstacles) { o.x -= (o.shot ? 0 : v) * dt; o.rot += o.vr * dt; if (o.vx) o.x += o.vx * dt; if (o.vy) o.y += o.vy * dt; }
    if (this.sentinel) { const S = this.sentinel; S.x = this.Lu * 0.86; if (S.leaving) { S.x += S.leaveT * 900; S.leaveT += dt; } else S.y = U.damp(S.y, b.y, 1.6, dt); }
    const bonanza = this.event && this.event.id === 'bonanza';
    const magnet = run.magnetT > 0 || run.mods.magnet || bonanza || run.bholeT > 0, MR = HR.CONFIG.PICKUP.magnetRange * (bonanza ? 1.8 : 1) * (run.mods.magnetRange || 1) * (run.bholeT > 0 ? 2.2 : 1);
    if (!run.jetLeft && !run.cometT && !(this.event && this.event.id === 'warp') && !this.demo) run.maxSpeed = Math.max(run.maxSpeed || 0, v);
    for (const p of this.pickups) {
      if (p.center && p.ring) { p.x = p.ring.x; p.baseY = p.ring.y; p.y = p.ring.y; if (p.ring.resolved && p.ring.x < b.x - 40) p.center = false; continue; }
      p.x -= v * dt; p.y = p.baseY + Math.sin(t * 3 + p.seed) * 6;
      if (magnet || p.pulled) { const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy); if ((p.pulled || d < MR) && d > 1) { const k = (p.pulled ? 1400 : 640) * dt / d; p.x += dx * k; p.baseY += dy * k; } }
    }
  }

  controlMode() {
    // v5.7: só o relativo (arrastar). O analógico e o "seguir o dedo" foram removidos.
    return 'relative';
  }

  updateBall(sdt, dt) {
    const B = HR.CONFIG.BALL, b = this.ball, st = HR.Store.data.settings, I = HR.Input, run = this.run;
    const U = this.uAxis(), V = this.vAxis();
    const canControl = this.state === 'playing' || this.state === 'ready' || this.state === 'transition';
    let direct = false;
    if (run.autoT > 0 && this.state === 'playing' && !run.anomalyActive) {
      I.consumeDelta2();
      const next = this.rings.find(r => !r.resolved && r.x > b.x - 5);
      if (next) b.ty = next.y;
    } else if (canControl) {
      const mode = this.controlMode();
      const d = I.consumeDelta2();
      if (mode === 'absolute') {
        if (I.down || (I.hasHover && I.lastPointerType === 'mouse')) {
          const px = (I.absX - this.rect.left) / this.scale - this.frame.ox, py = (I.absY - this.rect.top) / this.scale - this.frame.oy;
          b.tx = px * U.x + py * U.y; b.ty = px * V.x + py * V.y;
        }
      } else if (mode === 'stick') {
        // v5.3: analógico direto: a inclinação vira a velocidade da bola na hora; ao soltar, para na hora
        const S = I.stick, m = Math.hypot(S.x, S.y);
        let wu = 0, wv = 0;
        if (S.active && m > B.stickDead) {
          const vt = Math.pow(Math.min(1, (m - B.stickDead) / (1 - B.stickDead)), B.stickCurve) * B.stickSpeed * (st.sensitivity || 1);
          wu = (S.x * U.x + S.y * U.y) / m * vt; wv = (S.x * V.x + S.y * V.y) / m * vt;
        }
        const skx = (I.keys.right ? 1 : 0) - (I.keys.left ? 1 : 0), sky = (I.keys.down ? 1 : 0) - (I.keys.up ? 1 : 0);
        if (skx || sky) { wu += (skx * U.x + sky * U.y) * B.keySpeed; wv += (skx * V.x + sky * V.y) * B.keySpeed; }
        const resp = 1 - Math.exp(-B.stickResponse * dt);
        b.vx += (wu - b.vx) * resp; b.vy += (wv - b.vy) * resp;
        direct = true;
      } else {
        const g = (st.sensitivity || 1) * 1.4 / this.scale;
        b.tx += (d.dx * U.x + d.dy * U.y) * g;
        b.ty += (d.dx * V.x + d.dy * V.y) * g;
      }
      const ks = B.keySpeed * dt;
      const kx = (I.keys.right ? 1 : 0) - (I.keys.left ? 1 : 0), ky = (I.keys.down ? 1 : 0) - (I.keys.up ? 1 : 0);
      if (kx || ky) { b.tx += (kx * U.x + ky * U.y) * ks; b.ty += (kx * V.x + ky * V.y) * ks; }
    } else I.consumeDelta2();
    b.ty = HR.U.clamp(b.ty, b.r, this.Lv - b.r);
    b.tx = this.clampU(b.tx);
    const K = B.spring, C = B.damping;
    if (!direct) {
      b.vx += ((b.tx - b.x) * K - b.vx * C) * dt;
      b.vy += ((b.ty - b.y) * K - b.vy * C) * dt;
    }
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > B.maxVy) { b.vx *= B.maxVy / sp; b.vy *= B.maxVy / sp; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.y < b.r) { b.y = b.r; b.vy *= direct ? 0 : -0.3; } else if (b.y > this.Lv - b.r) { b.y = this.Lv - b.r; b.vy *= direct ? 0 : -0.3; }
    const cu = this.clampU(b.x); if (cu !== b.x) { b.x = cu; b.vx *= direct ? 0 : -0.3; }
    // no analógico direto o alvo acompanha a bola (piloto automático ou outro controle começam de onde ela está)
    if (direct) { b.tx = b.x; b.ty = b.y; }
    b.trail.push({ x: b.x, y: b.y, t: this.time });
    const heat = Math.min(1, run.combo / 20), maxLen = 22 + Math.round(heat * 16), maxAge = 0.4 + heat * 0.25;
    while (b.trail.length > maxLen || (b.trail.length && this.time - b.trail[0].t > maxAge)) b.trail.shift();
    const v = this.state === 'ready' ? 0 : this.speedAt(run.ringsPassed) * this.timeScale;
    for (const p of b.trail) p.x -= v * dt * 0.55;
    // bolhas na região de água
    if (this.fx === 'water' && this.state === 'playing' && Math.random() < dt * 6) this.particles.burst({ x: b.x - b.r * 0.6, y: b.y + HR.U.rand(-b.r, b.r), n: 1, speed: 20, color: '#cfe9ff', size: 4, life: 1.2, type: 'bubble', vy: -70, drag: 0.98 });
  }

  checkReflex() {
    const run = this.run; if (!run.mods.reflex || run.reflexT > 0 || run.slowmoT > 0) return;
    const b = this.ball, R = HR.CONFIG.RUN;
    const r = this.rings.find(x => !x.resolved && x.x > b.x);
    if (!r || r.reflexUsed || r.x - b.x > 150) return;
    const along = -(b.x - r.x) * Math.sin(r.tilt) + (b.y - r.y) * Math.cos(r.tilt);
    const limit = r.r - b.r * R.forgiveness;
    if (Math.abs(along) > limit * 0.7) { r.reflexUsed = true; run.reflexT = 0.6; this.emit('reflex'); }
  }

  // obstáculos e itens
  checkField(dt) {
    const b = this.ball, run = this.run, P = this.particles, br = this.ballR();
    void dt;
    for (const o of this.obstacles) {
      if (o.dead) continue;
      if (Math.hypot(b.x - o.x, b.y - o.y) >= br + o.r * (1 - 0.2 * run.mods.hull)) continue;
      if (run.starT > 0 || run.jetLeft > 0 || run.cometT > 0) { o.dead = true; run.obstaclesDestroyed++; HR.Store.data.stats.obstaclesDestroyed++; if (o.rock) run.asteroidsDestroyed++; this.addCoins(2, o.x, o.y - 24); HR.Audio.sfx('coin'); P.burst({ x: o.x, y: o.y, n: 14, speed: 300, color: ['#c9d2ea', '#ffffff'], size: 5, life: 0.6, type: 'shard' }); continue; }
      if (run.ghostT > 0 || run.invuln > 0) continue;
      o.dead = true; o.hit = true; o.flash = 1; if (this.event) run.eventHits++;
      P.burst({ x: o.x, y: o.y, n: 12, speed: 260, color: ['#c9d2ea', '#ff5e7e'], size: 5, life: 0.6, type: 'shard' });
      this.damage(o, false);
      if (this.state !== 'playing') return;
    }
    for (const p of this.pickups) {
      if (p.taken || Math.hypot(b.x - p.x, b.y - p.y) >= b.r + p.r + 6) continue;
      this.collect(p);
    }
  }
  collect(p) {
    const run = this.run, K = HR.CONFIG.PICKUP, P = this.particles, d = HR.Store.data;
    p.taken = true; run.pickups++; if (p.center) run.centerPickups++;
    if (run.mods.scavenger) this.addCoins(5 * run.mods.scavenger, p.x, p.y - 44);
    let label = '';
    switch (p.id) {
      case 'coins': { const v = this.addCoins(Math.round((p.val || K.coins) * run.core.pickupMul * (run.mods.bagMul || 1))); label = '+' + v; break; }
      case 'shield': run.shields = Math.min(this.shieldCap(), run.shields + 1); label = HR.t('pk_shield'); this.emit('status', run); break;
      case 'magnet': run.magnetT = Math.max(run.magnetT, K.magnetDur); label = HR.t('pk_magnet'); break;
      case 'slow': run.slowmoT = Math.max(run.slowmoT, K.slowDur); label = HR.t('pk_slow'); break;
      case 'star': run.starT = K.starDur; run.starsUsed++; d.stats.starsUsed++; label = HR.t('pk_star'); break;
      case 'life': run.lives++; label = HR.t('pk_life'); this.emit('status', run); break;
      case 'gem': run.gemsFound++; HR.Economy.addGems(1, 'pickup'); label = HR.t('pk_gem'); break;
      case 'eco': run.ecoFound = true; label = HR.t('sg_eco_found'); if (HR.Singularity && run.level && run.level.sg) run.ecoNew = HR.Singularity.foundEco(run.level.archon, run.level.passage); this.emit('banner', { title: HR.t('sg_eco_title').toUpperCase(), color: '#fff3c2' }); break;
    }
    if (p.id !== 'eco' && !d.codex.items.includes(p.id)) { d.codex.items.push(p.id); this.emit('discover', { kind: 'item', id: p.id }); }
    d.stats.pickups++;
    P.text(p.x, p.y - 30, label, p.color, 22);
    P.burst({ x: p.x, y: p.y, n: 18, speed: 320, color: [p.color, '#ffffff'], size: 5, life: 0.7, type: 'spark' });
    HR.Audio.sfx(p.id === 'star' ? 'levelup' : 'reward'); HR.U.vibrate(15);
    this.emit('pickup', { id: p.id });
  }

  checkRings() {
    const b = this.ball, R = HR.CONFIG.RUN, pz = R.perfectZone * this.run.mods.perfectZone;
    for (const r of this.rings) {
      if (r.resolved) continue;
      const px = b.x - r.x, py = b.y - r.y;
      const ct = Math.cos(r.tilt), sn = Math.sin(r.tilt);
      const across = px * ct + py * sn;
      const along = -px * sn + py * ct;
      if (r.prevAcross !== null && r.prevAcross < 0 && across >= 0) this.resolve(r, along);
      else if (r.x < b.x - r.r - 40) { if (!this.demo) { if (r.type === 'anomaly') this.damage(r, true); else this.miss(r); } else r.resolved = true; }
      r.prevAcross = across;
      r.aligned = Math.abs(along) <= r.r * pz && r.x > b.x;
      if (this.state !== 'playing') return;
    }
  }

  // ao cruzar o plano do arco: dentro = passou · na borda = machucou · fora = errou (sem prêmio)
  resolve(r, along) {
    const run = this.run, b = this.ball, R = HR.CONFIG.RUN;
    const br = this.ballR(), limit = r.r - br * (R.forgiveness + run.core.forgive), rim = r.r + br * 0.9, a = Math.abs(along);
    void b;
    if (r.type === 'anomaly') { if (a <= limit) this.passAnomaly(r); else this.damage(r, true); return; }
    if (r.nova) { this.shatter(r); this.pass(r, 0, limit); return; }
    if (a <= limit) this.pass(r, along, limit);
    else if (this.protectedNow() && a <= rim) { this.shatter(r); this.pass(r, along, limit); }
    else if (a <= rim) this.damage(r, false);
    else this.miss(r);
    if (r.coin && !r.coinTaken) run.coinsMissed++;
  }

  // poder ativo (estrela, fantasma, invulnerável): a borda não machuca — o arco se despedaça
  shatter(r) {
    const run = this.run, P = this.particles, U = HR.U;
    r.shattered = true; r.shatterT = 0.001; r.flash = 1; run.shattered = (run.shattered || 0) + 1;
    for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2, x = r.x + Math.cos(a) * r.r * HR.Render.RX, y = r.y + Math.sin(a) * r.r; P.burst({ x, y, n: 1, speed: 260, angle: a, spread: 0.4, color: [r.color, '#ffffff'], size: 7, life: 0.8, type: 'shard', gravity: 300, drag: 0.94 }); }
    P.burst({ x: this.ball.x, y: this.ball.y, n: 1, speed: 0, color: run.starT > 0 ? '#ffe27a' : '#e8f0ff', size: 28, life: 0.6, type: 'wave' });
    P.text(r.x, r.y - r.r - 26, HR.t('shattered'), run.starT > 0 ? '#ffe27a' : '#e8f0ff', 24);
    HR.Audio.sfx('shield'); HR.U.vibrate([10, 20, 30]);
    void U;
  }
  addCoins(n, x, y) {
    const run = this.run;
    const mul = run.mods.coinMul * run.core.coinMul * (run.magnetT > 0 ? 2 : 1) * (this.event && this.event.id === 'warp' ? 2 : 1) * (run.echoT > 0 ? 2 : 1);
    const val = Math.round(n * mul);
    run.coins += val;
    if (x != null) this.particles.text(x, y, '+' + val, '#ffcf4a', 20);
    return val;
  }

  discoverRing(type) {
    const d = HR.Store.data; if (this.demo || d.codex.rings.includes(type)) return;
    d.codex.rings.push(type); this.emit('discover', { kind: 'ring', id: type });
  }
  ringResolved(r) {
    const run = this.run, L = run.level;
    // cada arco conta uma única vez (passou, errou, bateu ou saiu da tela)
    if (r) { if (r.counted) return; r.counted = true; }
    if (r && r.event) { this.onEventRing(r); return; }
    run.ringsResolved++;
    if (L && L.events && !this.event && !this.pendingEvent) { for (let i = 0; i < L.events.length; i++) { const ev = L.events[i]; if (!run.eventsFired[i] && run.ringsResolved >= ev.at && run.ringsResolved < L.rings - 2) { if (this.queueEvent(ev.id)) run.eventsFired[i] = true; break; } } }
    if (L) {
      if (L.boss) this.emit('boss', { fill: 1 - run.ringsPassed / L.rings });
      if (run.ringsResolved >= L.rings && !run.levelDone) { run.levelDone = true; this.levelSuccess = run.ringsPassed >= HR.Campaign.passNeed(L); this.levelEndTimer = 0.6; HR.Audio.sfx(this.levelSuccess ? 'levelup' : 'error'); }
    }
  }

  miss(r) {
    const run = this.run, P = this.particles;
    r.resolved = true; r.missed = true; r.flash = 0.5;
    if (this.demo) return;
    run.combo = 0; run.misses++; run.cleanStreak = 0; run.noMissStreak = 0; this.breakFlow(); this.adapt('miss');
    HR.Store.data.stats.misses++;
    P.text(r.x, r.y - r.r - 22, HR.t('miss'), '#8d97b3', 20);
    HR.Audio.sfx('miss');
    this.ringResolved(r);
    this.emit('score', run, false);
  }

  pass(r, along, limit) {
    const run = this.run, E = HR.CONFIG.ECONOMY, R = HR.CONFIG.RUN, P = this.particles;
    r.resolved = true; r.flash = 1;
    if (this.demo) { run.ringsPassed++; return; }
    run.score += (run.mods.scorePerRing + run.mods.momentum) * (run.echoT > 0 ? 2 : 1); run.ringsPassed++;
    run.cleanStreak++; run.cleanRings = Math.max(run.cleanRings, run.cleanStreak);
    run.noMissStreak++; run.noMissRings = Math.max(run.noMissRings, run.noMissStreak);
    if (this.dir === 'top') run.ringsTop++; else if (this.dir === 'left') run.ringsLeft++;
    if (r.dbl) run.doubleRings++;
    this.discoverRing(r.type);
    if (limit && Math.abs(along) > limit * R.nearZone) { run.nearMisses++; P.text(this.ball.x, this.ball.y + 40, HR.t('near_miss'), '#ff9f43', 16); }
    const jetting = run.jetLeft > 0;
    if (jetting) { run.jetLeft--; if (run.jetLeft <= 0) this.endJet(); }
    const perfect = !jetting && (r.prism || r.nova || Math.abs(along) <= r.r * R.perfectZone * run.mods.perfectZone * run.core.perfect * (run.mods.tempo && run.flowV >= 0.6 ? 1.2 : 1) * (run.prismT > 0 ? 3 : 1));
    this.addFlow(perfect);
    if (perfect) {
      run.combo++; run.perfects++; run.maxCombo = Math.max(run.maxCombo, run.combo);
      if (run.mods.resonance) run.abilities.forEach(ab => { if (ab && ab.cd > 0) ab.cd = Math.max(0, ab.cd - run.mods.resonance); });
      HR.Audio.sfx('perfect', { combo: run.combo });
      P.text(r.x, r.y - r.r - 26, HR.t('perfect'), '#ffcf4a', 26);
      if (run.combo % run.mods.comboEvery === 0) {
        const v = this.addCoins(E.comboCoins);
        run.comboBonuses++;
        HR.Audio.sfx('great');
        P.text(this.ball.x, this.ball.y - 64, HR.t('great', { n: v }), '#35e29a', 30);
        P.burst({ x: r.x, y: r.y, n: 30, speed: 420, color: ['#ffcf4a', '#ffffff', r.color], size: 6, life: 0.9, type: 'spark' });
      }
      if (HR.CONFIG.COMBO_MILESTONES.includes(run.combo)) { P.burst({ x: this.ball.x, y: this.ball.y, n: 1, speed: 0, color: '#ffcf4a', size: 30, life: 0.7, type: 'wave' }); this.emit('combo', { n: run.combo }); HR.U.vibrate([10, 20, 10]); }
      if (run.mods.streakShield && run.combo % 8 === 0 && run.shields < this.shieldCap()) { run.shields++; P.text(this.ball.x, this.ball.y - 90, HR.t('perk_shield') + ' +1', '#4cf0ff', 22); this.emit('status', run); }
      HR.U.vibrate(12);
    } else { if (run.combo >= 5) this.adapt('streak'); run.combo = 0; HR.Audio.sfx('pass', { combo: 0 }); }
    if (run.mods.angel) { run.angelStreak++; if (run.angelStreak % run.mods.angel === 0 && run.shields < this.shieldCap()) { run.shields++; P.text(this.ball.x, this.ball.y - 90, HR.t('perk_guardianangel') + ' +1', '#fff3c2', 20); this.emit('status', run); } }
    if (r.coin && !r.coinTaken && (run.mods.magnet || run.magnetT > 0 || run.bholeT > 0 || Math.abs(along) <= r.r * R.coinZone)) {
      r.coinTaken = true; run.coinsTaken++; this.addCoins(E.coinPickup, r.x, r.y - 20); HR.Audio.sfx('coin');
      P.burst({ x: r.x, y: r.y, n: 8, speed: 260, color: '#ffcf4a', size: 5, life: 0.5 });
    }
    if (r.gold) { run.goldRings++; this.addCoins(5, r.x, r.y - 20); HR.Audio.sfx('reward'); P.burst({ x: r.x, y: r.y, n: 24, speed: 360, color: ['#ffcf4a', '#fff6c8'], size: 6, life: 0.8, type: 'spark' }); }
    // regeneração (ascensão): +1 escudo a cada 12/8/5 arcos
    const rg = run.mods.regen; if (rg && run.ringsPassed % [0, 12, 8, 5][rg] === 0 && run.shields < this.shieldCap()) { run.shields++; P.text(this.ball.x, this.ball.y - 90, HR.t('perk_regen') + ' +1', '#4cf0ff', 20); this.emit('status', run); }
    P.burst({ x: r.x, y: r.y, n: perfect ? 18 : 8, speed: perfect ? 380 : 220, color: [r.color, '#ffffff'], size: 5, life: 0.6, type: 'spark' });
    if (this.fx === 'water') P.burst({ x: r.x, y: r.y, n: 6, speed: 60, color: '#cfe9ff', size: 5, life: 1.3, type: 'bubble', vy: -80, drag: 0.98 });
    else if (HR.Render.FX_PASS && HR.Render.FX_PASS[this.fx]) P.burst(Object.assign({ x: r.x, y: r.y }, HR.Render.FX_PASS[this.fx]));
    if (run.level && !r.event) {
      const L = run.level;
      if (L.boss) {
        const wave = this.waveOfIndex(run.ringsResolved + 1);
        if (wave !== run.bossWave && run.ringsResolved + 1 < L.rings && L.grace && run.shields < this.shieldCap()) { run.shields++; this.emit('status', run); P.text(this.ball.x, this.ball.y - 96, HR.t('sg_grace'), '#fff3c2', 22); }
        if (wave !== run.bossWave && run.ringsResolved + 1 < L.rings) { run.bossWave = wave; HR.Audio.sfx('phase'); this.emit('wave', wave + 1); P.burst({ x: this.ball.x, y: this.ball.y, n: 40, speed: 600, color: [r.color, '#ffffff'], size: 6, life: 1, type: 'spark', drag: 0.92 }); HR.Audio.setIntensity(0.4 + 0.6 * wave / (L.waves - 1)); }
      } else HR.Audio.setIntensity(0.2 + 0.8 * run.ringsResolved / L.rings);
    } else if (!r.event) {
      const ph = this.phaseAt(run.ringsPassed);
      if (ph.number !== run.phaseNumber) {
        run.phaseNumber = ph.number; run.phaseIdx = ph.idx;
        this.bg.setTint(ph.phase.accent);
        this.fx = this.themeFx || ph.phase.fx || null; this.bg.setFx(this.fx);
        HR.Audio.sfx('phase');
        HR.Audio.setIntensity(Math.min(1, (ph.number - 1) / 8));
        P.burst({ x: this.ball.x, y: this.ball.y, n: 40, speed: 600, color: [ph.phase.accent, '#ffffff'], size: 6, life: 1, type: 'spark', drag: 0.92 });
        this.emit('phase', { number: ph.number, name: HR.t(ph.phase.key), accent: ph.phase.accent });
      }
    }
    this.ringResolved(r);
    if (r.event) { this.emit('score', run, perfect); return; }
    this.emit('score', run, perfect);
    // infinito: eventos a cada 22–30 arcos a partir do 18º (nunca junto com anomalia)
    if (!run.level && !this.demo && !run.jetLeft && run.ringsPassed >= this.eventNextRing && !this.event && !this.pendingEvent && !run.anomalyActive && !this.anomalyPending) {
      const ids = Object.keys(HR.CONFIG.EVENTS).filter(k => k !== this.lastEvent); this.queueEvent(ids[Math.floor(Math.random() * ids.length)]);
      const E = HR.CONFIG.EVENT.every; this.eventNextRing = run.ringsPassed + E[0] + Math.floor(Math.random() * (E[1] - E[0] + 1));
    }
    this.maybeOfferPerk();
  }

  passAnomaly(r) {
    const run = this.run, A = HR.CONFIG.ANOMALY, P = this.particles;
    r.resolved = true; r.flash = 1;
    run.score += run.mods.scorePerRing + run.mods.momentum + A.bonusScore; run.ringsPassed++; run.anomaliesBeaten++; this.addFlow(true);
    HR.Store.data.stats.anomaliesBeaten++;
    this.addCoins(A.bonusCoins, r.x, r.y - 20);
    this.discoverRing('anomaly');
    P.text(this.ball.x, this.ball.y - 70, HR.t('anomaly_beat'), '#ff8a3d', 26);
    P.burst({ x: r.x, y: r.y, n: 40, speed: 520, color: ['#ff3d2e', '#ff8a3d', '#ffffff'], size: 6, life: 1, type: 'spark', drag: 0.93 });
    P.burst({ x: this.ball.x, y: this.ball.y, n: 1, speed: 0, color: '#ff8a3d', size: 40, life: 0.8, type: 'wave' });
    HR.Audio.sfx('great'); HR.U.vibrate([20, 30, 40]);
    this.emit('anomaly', { phase: 'beat' });
    this.ringResolved();
    this.emit('score', run, false);
    this.maybeOfferPerk();
  }

  // dano: borda de arco, obstáculo ou anomalia (bypass = ignora escudo e segunda chance)
  damage(src, bypass) {
    const run = this.run, R = HR.CONFIG.RUN, P = this.particles;
    if (src) { src.resolved = true; src.hit = true; src.flash = 1; }
    // arco normal batido também conta para o fim da fase (antes a fase ficava presa depois de uma batida)
    if (src && !src.event && src.type !== 'anomaly' && this.rings.includes(src)) this.ringResolved(src);
    run.combo = 0; run.hits++; run.cleanStreak = 0; run.noMissStreak = 0; run.angelStreak = 0; this.breakFlow(); this.adapt('hit');
    if (this.event && src) run.eventHits++;
    if (src && src.type === 'anomaly') { P.text(this.ball.x, this.ball.y - 64, HR.t('anomaly_hit'), '#ff3d2e', 24); this.ringResolved(); }
    if (src && src.event) this.ringResolved(src);
    if (run.mode === 'practice') {
      this.shake = 6; HR.Audio.sfx('error'); HR.U.vibrate(20);
      P.text(this.ball.x, this.ball.y - 60, '✕', '#ff5e7e', 34);
      run.invuln = 0.6;
      this.emit('score', run, false);
      return;
    }
    // Égide (v5): o primeiro erro quebra a bolha e a bola segue
    if (!bypass && run.aegisT > 0) {
      const sk = HR.Gear.current('aegis');
      run.aegisT = 0; run.aegisCd = HR.GEAR.consumables.aegis.cd * (run.mods.aegisCd || 1); run.aegisSaves++; HR.Store.data.stats5.aegisSaves++; run.invuln = 0.9;
      P.burst({ x: this.ball.x, y: this.ball.y, n: 40, speed: 560, color: [sk.color, sk.color2, '#ffffff'], size: 8, life: 0.9, type: 'shard', drag: 0.94 });
      P.burst({ x: this.ball.x, y: this.ball.y, n: 1, speed: 0, color: sk.color, size: 48, life: 0.7, type: 'wave' });
      P.text(this.ball.x, this.ball.y - 70, HR.t('aegis_broken'), sk.color, 28);
      this.shake = 10; HR.Audio.sfx('shield'); HR.U.vibrate([30, 20, 50]);
      this.adapt('aegis');
      this.emit('gear', { kind: 'aegis' }); this.emit('status', run);
      return;
    }
    if (!bypass && run.shields > 0) {
      run.shields--; run.shieldsAbsorbed++; HR.Store.data.stats.shieldsAbsorbed++; run.invuln = R.shieldInvuln;
      HR.Audio.sfx('shield'); HR.U.vibrate(30);
      P.burst({ x: src ? src.x : this.ball.x, y: src ? src.y : this.ball.y, n: 24, speed: 500, color: ['#4cf0ff', '#ffffff'], size: 8, life: 0.8, type: 'shard' });
      P.text(this.ball.x, this.ball.y - 64, HR.t('shield_used'), '#4cf0ff', 28);
      this.emit('status', run);
      return;
    }
    if (!bypass && run.mods.secondChance > 0 && !run.secondUsed) {
      run.secondUsed = true; run.invuln = R.shieldInvuln;
      HR.Audio.sfx('revive'); HR.U.vibrate([20, 30, 20]);
      P.burst({ x: this.ball.x, y: this.ball.y, n: 30, speed: 420, color: ['#ffcf4a', '#ffffff'], size: 6, life: 0.9, type: 'spark' });
      P.text(this.ball.x, this.ball.y - 64, HR.t('second_chance_used'), '#ffcf4a', 26);
      this.emit('status', run);
      return;
    }
    if (!bypass && run.phoenixT > 0) {
      run.phoenixT = 0; run.invuln = 1.6;
      HR.Audio.sfx('revive'); HR.U.vibrate([20, 40, 60]);
      P.burst({ x: this.ball.x, y: this.ball.y, n: 44, speed: 520, color: ['#ff8a3d', '#ffe27a', '#ffffff'], size: 7, life: 1, type: 'spark', drag: 0.94 });
      P.burst({ x: this.ball.x, y: this.ball.y, n: 1, speed: 0, color: '#ff8a3d', size: 56, life: 0.8, type: 'wave' });
      P.text(this.ball.x, this.ball.y - 70, HR.t('ab_phoenix').toUpperCase(), '#ff8a3d', 28);
      this.emit('status', run);
      return;
    }
    if (run.lives > 0) {
      run.lives--; run.livesUsed++; this.killer = src;
      HR.Audio.sfx('fail'); HR.U.vibrate([40, 30, 40]);
      P.burst({ x: this.ball.x, y: this.ball.y, n: 24, speed: 420, color: ['#ff5e7e', '#ffffff'], size: 7, life: 0.8, type: 'shard' });
      this.revive(true);
      this.emit('banner', { title: HR.t('life_lost'), color: '#ff5e7e' });
      this.emit('status', run);
      return;
    }
    this.state = 'dying'; this.dyingT = 0; this.shake = 16; this.killer = src;
    HR.Audio.sfx('fail'); HR.U.vibrate([40, 30, 70]);
    P.burst({ x: this.ball.x, y: this.ball.y, n: 36, speed: 520, color: [this.skin.base, this.skin.dark, this.skin.glow], size: 9, life: 1.1, type: 'shard', gravity: 900, drag: 0.96 });
    P.burst({ x: this.ball.x, y: this.ball.y, n: 20, speed: 300, color: '#ff5e7e', size: 6, life: 0.7 });
    this.emit('death', run);
  }

  canRevive() { return !this.demo && this.run.revives < HR.CONFIG.RUN.reviveMax; }

  revive(fromLife) {
    const run = this.run, R = HR.CONFIG.RUN;
    if (!fromLife) { run.revives++; HR.Store.data.revives++; HR.Store.save(); }
    run.invuln = R.reviveInvuln;
    let minX = Infinity;
    for (const r of this.rings) if (!r.resolved) minX = Math.min(minX, r.x);
    const shift = Math.max(0, this.ball.x + 340 - minX);
    for (const r of this.rings) if (!r.resolved) { r.x += shift; r.prevAcross = null; }
    for (const o of this.obstacles) { o.x += shift; if (Math.abs(o.x - this.ball.x) < 160 || o.shot) o.dead = true; }
    for (const p of this.pickups) p.x += shift;
    this.nextX += shift;
    if (this.killer) this.killer.hit = false;
    this.ball.alpha = 1; this.ball.ty = this.ball.y; this.timeScale = 1; this.dyingT = 0;
    this.particles.burst({ x: this.ball.x, y: this.ball.y, n: 30, speed: 400, color: ['#35e29a', '#ffffff'], size: 6, life: 0.8, type: 'spark' });
    if (!fromLife) HR.Audio.sfx('revive');
    this.state = 'ready'; HR.Input.reset();
    this.emit('revived', run);
  }
  declineRevive() { if (this.state === 'revive') this.finishRun(false); }

  summary(success) {
    const run = this.run, E = HR.CONFIG.ECONOMY, R = HR.CONFIG.RUN;
    const bonus = Math.floor(run.score / E.endBonusDiv);
    let coins = run.coins + bonus;
    if (run.mode === 'practice') coins = Math.floor(coins / 2);
    if (run.mode === 'endless' && HR.Campaign.singularityMastered()) coins = Math.round(coins * R.masteredCoinMul);
    // v6.1: o ouro do Infinito vem da fenda em que você entrou (uma por galáxia)
    if (run.mode === 'endless' && HR.Rifts) coins = Math.round(coins * HR.Rifts.mul(HR.Rifts.current()));
    else if (run.mode === 'endless' && HR.Story) coins = Math.round(coins * HR.Story.endlessBonus());
    let xp = run.mode === 'practice' ? 0 : run.score * E.xp.perRing + run.perfects * E.xp.perPerfect + (run.level ? 0 : (run.phaseNumber - 1) * E.xp.perPhase);
    if (run.level && success) xp += E.xp.perLevel;
    xp = Math.min(HR.CONFIG.PROGRESSION.xpRunCap, Math.round(xp * run.core.xp));
    const duration = run.startTime ? Math.round((Date.now() - run.startTime) / 1000) : 0;
    const s = {
      mode: run.mode, levelId: run.level ? run.level.id : null, region: run.level ? run.level.region : null, success: !!success,
      score: run.score, coins, rawCoins: run.coins, bonus, perfects: run.perfects, maxCombo: run.maxCombo, phase: run.phaseNumber, xp,
      duration, revives: run.revives, hits: run.hits, misses: run.misses, coinsMissed: run.coinsMissed,
      perks: Object.assign({}, run.perks), ringsPassed: run.ringsPassed, ringsTotal: run.level ? run.level.rings : run.ringsResolved, passNeed: run.level ? HR.Campaign.passNeed(run.level) : 0,
      perksCount: Object.keys(run.perks).length, rarePerks: run.rarePerks,
      dirChanges: run.dirChanges, nearMisses: run.nearMisses, distKm: Math.round(run.dist / 3000 * 10) / 10, shieldsAbsorbed: run.shieldsAbsorbed, livesUsed: run.livesUsed,
      abilitiesUsed: run.abilitiesUsed, cleanRings: run.cleanRings, noMissRings: run.noMissRings, goldRings: run.goldRings, doubleRings: run.doubleRings, comboBonuses: run.comboBonuses, coinsTaken: run.coinsTaken,
      ringsTop: run.ringsTop, ringsLeft: run.ringsLeft, noAbilityScore: run.abilitiesUsed ? 0 : run.score, endlessScore: run.mode === 'endless' ? run.score : 0,
      endlessRun: run.mode === 'endless' ? 1 : 0, campaignRun: run.mode === 'campaign' ? 1 : 0, practiceRun: run.mode === 'practice' ? 1 : 0, one: 1,
      pickups: run.pickups, anomaliesBeaten: run.anomaliesBeaten, starsUsed: run.starsUsed, shattered: run.shattered || 0, obstaclesDestroyed: run.obstaclesDestroyed, gemsFound: run.gemsFound, autoPerks: run.autoPerks,
      levelDone: 0, starsGot: 0, threeStar: 0, bossDone: 0, flawless: 0, bossFlawlessRun: (run.level && run.level.boss && success && run.hits === 0) ? 1 : 0,
      flowMax: Math.round(run.flowMax * 100), flowTime: Math.round(run.flowTime), centerPickups: run.centerPickups, eventsDone: run.eventsDone,
      guardians: run.guardians, sentinels: run.sentinels, warps: run.warps, asteroidsDestroyed: run.asteroidsDestroyed,
      aegisUsed: run.aegisUses, aegisSaves: run.aegisSaves, jetsUsed: run.jetsUsed, maxSpeed: Math.round(run.maxSpeed || 0), speedPct: Math.round((run.maxSpeed || 0) / HR.CONFIG.SPEED.base * 100)
    };
    HR.ABILITIES.forEach(a => { s['ab_' + a.id] = run.abUse[a.id] || 0; });
    return s;
  }
  finishRun(success) {
    this.state = this.run.level ? 'levelend' : 'over'; this.timeScale = 1;
    const s = this.summary(success);
    this.emit(this.run.level ? 'levelend' : 'over', s);
  }

  /* ---------------- vitrine do menu (estado idle) ---------------- */
  showcaseAccent() { const P = HR.CONFIG.PHASES; return P[Math.floor(this.time / 6) % P.length].accent; }
  updateShowcase(dt) {
    const s = this.showcase; if (!s) return;
    this.bg.setTint(this.showcaseAccent());
    if (Math.random() < dt * 2.5) {
      const a = Math.random() * Math.PI * 2, d = s.r * HR.U.rand(1.6, 3.2);
      this.particles.burst({ x: s.x + Math.cos(a) * d, y: s.y + Math.sin(a) * d * 0.7, n: 1, speed: 25, color: [this.showcaseAccent(), '#ffffff'], size: 3, life: 1.6, drag: 0.98 });
    }
    this.ghosts = this.ghosts || [];
    for (const g of this.ghosts) g.x -= 30 * dt;
    this.ghosts = this.ghosts.filter(g => g.x > -200);
    if (!this.ghosts.length || this.ghosts[this.ghosts.length - 1].x < this.W - 260) {
      this.ghosts.push({ x: this.W + 160, y: HR.U.rand(this.H * 0.15, this.H * 0.85), r: HR.U.rand(60, 110), tilt: HR.U.rand(-0.5, 0.5), accent: this.showcaseAccent(), color: this.showcaseAccent(), flash: 0, hit: false, type: 'plain' });
    }
  }
  renderShowcase(ctx, t) {
    const s = this.showcase; if (!s) return;
    for (const g of (this.ghosts || [])) { HR.Render.drawRing(ctx, g, 'back', { alpha: 0.16, t }); HR.Render.drawRing(ctx, g, 'front', { alpha: 0.16, t }); }
    const skin = this.showcaseSkin || this.skin;
    const accent = this.showcaseAccent();
    const fy = Math.sin(t * 1.5) * s.r * 0.22;
    const ring = { x: s.x, y: s.y, r: s.r * 1.9, tilt: Math.sin(t * 0.45) * 0.6, accent, color: accent, flash: 0, hit: false, type: 'plain' };
    HR.Render.drawRing(ctx, ring, 'back', { t });
    if (this.trail !== 'none') {
      const pts = [];
      for (let i = 0; i < 16; i++) { const k = 16 - i; pts.push({ x: s.x - k * s.r * 0.2, y: s.y + Math.sin(t * 1.5 - k * 0.24) * s.r * 0.22, t: t - k * 0.03 }); }
      HR.Render.drawTrail(ctx, this.trail, pts, skin, t, 0);
    }
    HR.Render.drawBall(ctx, s.x, s.y + fy, s.r, skin, t, { vy: Math.cos(t * 1.5) * s.r * 10 });
    HR.Render.drawRing(ctx, ring, 'front', { t });
  }

  /* ---------------- desenho ---------------- */
  render() {
    const ctx = this.ctx, W = this.W, H = this.H, t = this.time, b = this.ball, R = HR.CONFIG.RUN, run = this.run;
    this.bg.draw(ctx, t);
    if (this.state === 'idle') { this.renderShowcase(ctx, t); this.particles.draw(ctx); return; }
    ctx.save();
    if (this.shake > 0) ctx.translate(HR.U.rand(-1, 1) * this.shake, HR.U.rand(-1, 1) * this.shake);
    ctx.translate(this.frame.ox, this.frame.oy); ctx.rotate(this.frame.angle);
    const rot = this.frame.angle;
    const sqAxis = Math.abs(Math.sin(rot)) > 0.5 ? 'x' : 'y';
    for (const r of this.rings) HR.Render.drawRing(ctx, r, 'back', { alpha: r.alpha, t });
    for (const r of this.rings) {
      if (r.alpha < 0.05) continue;
      if (r.coin && !r.coinTaken) HR.Render.drawCoin(ctx, r.x, r.y, 12, t, r.index);
      if (!r.centerItem) HR.Render.drawRingCenter(ctx, r, r.aligned && this.state === 'playing', t);
      if ((r.nova || r.prism) && !r.resolved) { ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.tilt || 0); ctx.strokeStyle = r.nova ? 'rgba(255,226,122,' + (0.5 + 0.3 * Math.sin(t * 8)).toFixed(2) + ')' : 'rgba(255,122,217,0.55)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, 0, r.r * HR.Render.RX + 8, r.r + 8, 0, 0, 6.283); ctx.stroke(); ctx.restore(); }
    }
    for (const o of this.obstacles) HR.Render.drawObstacle(ctx, o, t);
    for (const p of this.pickups) HR.Render.drawPickup(ctx, p, t);
    if (this.sentinel) HR.Render.drawSentinel(ctx, this.sentinel, t, this.ball);
    if (b.alpha > 0) {
      const heat = Math.min(1, run.combo / 20);
      HR.Render.drawTrail(ctx, this.trail, b.trail, this.skin, t, heat);
      const blink = run.invuln > 0 && this.state === 'playing' && Math.floor(t * 12) % 2 === 0;
      const ghost = run.ghostT > 0;
      const spd = Math.hypot(b.vx, b.vy), axisLocal = Math.abs(b.vx) > Math.abs(b.vy) ? 'x' : 'y';
      const sqAxisNow = axisLocal === 'y' ? sqAxis : (sqAxis === 'x' ? 'y' : 'x');
      const orbs = [];
      if (run.shields > 0) orbs.push({ n: run.shields, color: '#4cf0ff', rad: 1.6, speed: 2.2, size: 4.5 });
      if (run.starT > 0) orbs.push({ n: 3, color: '#ffe27a', rad: 2.0, speed: 4.2, size: 5, T: run.starT });
      if (run.magnetT > 0) orbs.push({ n: 4, color: '#ffcf4a', rad: 1.75, speed: -3, size: 3.5, T: run.magnetT });
      if (run.ghostT > 0) orbs.push({ n: 2, color: '#e8f0ff', rad: 1.45, speed: 1.6, size: 4, T: run.ghostT, wisp: true });
      if (run.slowmoT > 0) orbs.push({ n: 2, color: '#9be7ff', rad: 1.9, speed: 1.1, size: 4, T: run.slowmoT });
      if (run.freezeT > 0) orbs.push({ n: 3, color: '#dff8ff', rad: 1.65, speed: 1.8, size: 3.5, T: run.freezeT });
      if (run.jetLeft > 0 && HR.Render.drawJet) HR.Render.drawJet(ctx, b.x, b.y + Math.sin(t * 3) * 2, b.r, HR.Gear.current('jet'), t, run.jetKind === 'megajet' ? 1.35 : 1);
      if (run.autoT > 0 && !run.anomalyActive && !run.jetLeft) orbs.push({ n: 2, color: '#a29bfe', rad: 1.85, speed: 2.6, size: 3.5, T: run.autoT });
      if (run.lensT > 0) orbs.push({ n: 3, color: '#7cff6b', rad: 2.1, speed: 1.4, size: 3.5, T: run.lensT });
      if (run.echoT > 0) orbs.push({ n: 3, color: '#ff5ecf', rad: 1.5, speed: -2.2, size: 4, T: run.echoT });
      if (run.bholeT > 0) orbs.push({ n: 5, color: '#a88bff', rad: 2.4, speed: -4, size: 3, T: run.bholeT });
      if (run.prismT > 0) orbs.push({ n: 3, color: '#ff7ad9', rad: 1.7, speed: 2.8, size: 4, T: run.prismT });
      if (run.phoenixT > 0) orbs.push({ n: 2, color: '#ff8a3d', rad: 2.0, speed: 3.4, size: 5, T: run.phoenixT });
      if (run.goldT > 0) orbs.push({ n: 4, color: '#ffd24a', rad: 1.8, speed: -2.6, size: 3.5, T: run.goldT });
      if (run.microT > 0) orbs.push({ n: 2, color: '#9dff8a', rad: 1.2, speed: 4, size: 3, T: run.microT });
      if (run.chronoT > 0) orbs.push({ n: 4, color: '#c3b8ff', rad: 2.2, speed: 0.6, size: 3.5, T: run.chronoT });
      if (run.cometT > 0 && !run.jetLeft && HR.Render.drawJet) HR.Render.drawJet(ctx, b.x, b.y, b.r, { color: '#9be7ff', color2: '#ffffff' }, t, 0.9);
      if (orbs.length) HR.Render.drawOrbs(ctx, b.x, b.y + Math.sin(t * 3) * 2, b.r, orbs, t);
      ctx.save(); ctx.translate(b.x, b.y + Math.sin(t * 3) * 2); ctx.rotate(-rot);
      HR.Render.drawBall(ctx, 0, 0, this.ballR(), this.skin, t, { vy: spd, sqAxis: sqAxisNow, alpha: b.alpha * (blink ? 0.45 : 1) * (ghost ? 0.5 : 1), shield: run.shields > 0, shields: run.shields, heat: run.combo >= 5 ? heat : 0, star: run.starT > 0 ? run.starT : 0, ending: run.powerEnding || 0 });
      ctx.restore();
      if (this.drawPowerTimers) this.drawPowerTimers(ctx, t, rot);
      if (run.aegisT > 0 && HR.Render.drawAegis) HR.Render.drawAegis(ctx, b.x, b.y + Math.sin(t * 3) * 2, b.r, HR.Gear.current('aegis'), t, run.aegisT);
      if (run.autoT > 0 && !run.anomalyActive && !run.jetLeft) { ctx.strokeStyle = 'rgba(162,155,254,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 1.8, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    }
    for (const r of this.rings) HR.Render.drawRing(ctx, r, 'front', { alpha: r.alpha, t });
    this.particles.draw(ctx, p => p.type !== 'text');
    const L = run.level, darkR = L ? (L.boss === 'singularity' && run.bossWave >= 4 ? 380 : L.params.dark) : 0;
    if (darkR && this.state !== 'idle') {
      const g = ctx.createRadialGradient(b.x, b.y, darkR * 0.55, b.x, b.y, darkR * 1.5);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.9)');
      ctx.fillStyle = g; ctx.fillRect(-2000, -2000, 4000, 4000);
    }
    ctx.restore();
    this.particles.drawText(ctx, (x, y) => this.toScreen(x, y));
    if (this.state === 'dying') { ctx.fillStyle = 'rgba(255,60,90,' + (0.35 * (1 - this.dyingT / R.deathTime)).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
  }

  frame_(ts) {
    const dt = Math.min(0.05, Math.max(0, (ts - (this.last || ts)) / 1000));
    this.last = ts;
    if (HR.Perf) HR.Perf.sample(dt, this);
    if (this.canvas.clientWidth !== this.cw || this.canvas.clientHeight !== this.ch) { this.resize(); if (HR.UI && HR.UI.layoutShowcase) HR.UI.layoutShowcase(); }
    try { this.update(dt); this.render(); }
    catch (e) { console.error('[game loop]', e); }
  }
  start() {
    const loop = ts => { this.lastRaf = ts; this.frame_(ts); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
    this.watchdog = setInterval(() => {
      const now = performance.now();
      if ((!document.hidden || HR.NO_AUTOPAUSE) && now - (this.lastRaf || 0) > 150) this.frame_(now);
    }, 33);
  }
};
