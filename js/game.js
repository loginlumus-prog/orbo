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
    this.bg.setTheme(this.levelTheme || C.THEMES.find(t => t.id === e.theme) || C.THEMES[0]);
  }

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
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
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
      perks: {}, mods: HR.Perks.baseMods(), abilities: [], slowmoT: 0, magnetT: 0, autoT: 0, ghostT: 0, freezeT: 0, reflexT: 0, starT: 0,
      bossWave: 0, levelDone: false, perksOffered: 0, rerollUsed: false, autoPerks: 0,
      dirChanges: 0, nearMisses: 0, shieldsAbsorbed: 0, livesUsed: 0, abilitiesUsed: 0, abUse: {}, cleanStreak: 0, cleanRings: 0, noMissStreak: 0, noMissRings: 0,
      goldRings: 0, doubleRings: 0, comboBonuses: 0, coinsTaken: 0, ringsTop: 0, ringsLeft: 0, rarePerks: 0,
      pickups: 0, anomaliesBeaten: 0, anomalyActive: false, starsUsed: 0, obstaclesDestroyed: 0, gemsFound: 0, flowClock: 0, ghostClock: 0
    };
    this.ball.y = this.ball.ty = (this.Lv || this.H) / 2; this.ball.vy = 0; this.ball.vx = 0; this.ball.tx = this.ball.x; this.ball.trail = []; this.ball.alpha = 1;
    this.nextX = (this.Lu || this.W || 500) + 240; this.lastY = this.ball.y; this.pendingDouble = false; this.lastRing = null; this.lastPickupRing = -99;
    this.anomalyT = 0; this.anomalyPending = false;
    this.timeScale = 1; this.shake = 0; this.killer = null; this.dyingT = 0; this.pendingDir = null; this.trans = null; this.perkTimer = 0; this.levelEndTimer = 0; this.levelSuccess = false;
    this.bg.setTint(HR.CONFIG.PHASES[0].accent);
  }
  startAttract() { this.demo = true; this.state = 'idle'; this.levelTheme = null; this.fx = null; this.applyCosmetics(); this.resetRun(); this.rings = []; }

  prepareRun(opts) {
    opts = opts || {};
    this.demo = false; this.resetRun();
    const run = this.run;
    run.mode = opts.mode || 'endless'; run.level = opts.level || null;
    run.abilities = HR.Abilities.equipped().map(id => id ? { id, cd: 0, active: 0 } : null);
    if (run.level) { const R = HR.REGIONS[run.level.ri]; this.levelTheme = { colors: R.colors, shapes: R.shapes, stars: R.stars, fx: R.fx || null }; this.fx = R.fx || null; }
    else { this.levelTheme = null; this.fx = null; }
    this.applyCosmetics();
    this.setDir(this.dirForRing(0));
    this.ball.y = this.ball.ty = this.Lv / 2; this.ball.vx = this.ball.vy = 0; this.lastY = this.ball.y;
    const ph = this.phaseFor(0);
    run.phaseNumber = ph.number; run.phaseIdx = ph.idx; this.bg.setTint(ph.phase.accent);
    if (HR.Music) { HR.Music.play(run.level ? HR.REGIONS[run.level.ri].music : 'singularity'); }
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
  speedAt(n) {
    const R = HR.CONFIG.RUN, run = this.run;
    if (this.demo) return 230;
    let v;
    if (run.level) {
      const L = run.level, w = run.bossWave;
      v = (R.baseSpeed + (L.tier * R.ringsPerPhase + n * 0.4) * R.speedPerRing) * L.speed;
      if (L.params.burst) v *= 1 + L.params.burst * Math.max(0, Math.sin(this.time * 0.8));
      if ((L.boss === 'storm' || L.boss === 'tide' || L.boss === 'cyclone') && w >= 1) v *= 1 + 0.35 * Math.max(0, Math.sin(this.time * 0.9));
      if (L.boss === 'singularity' && w >= 4) v *= 1 + 0.3 * Math.max(0, Math.sin(this.time * 1.1));
    } else v = R.baseSpeed + n * R.speedPerRing;
    return Math.min(v, R.maxSpeed) * (run.mods ? run.mods.speedMul : 1);
  }
  tbAt(n, ph) {
    const R = HR.CONFIG.RUN, L = this.run.level;
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
  shieldCap() { return HR.CONFIG.RUN.shieldCap + (this.run.mods ? this.run.mods.regen : 0); }

  fill() {
    if (this.pendingDir) return;
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
    const sw = boss === 'singularity' ? ['pulse', 'blink', 'shrink', 'cyclone', 'all'][wave] : null;
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
    const v = this.speedAt(n), tb = this.tbAt(n, ph);
    let spacing = v * tb;
    const dbl = this.pendingDouble;
    if (dbl) spacing *= 0.5;
    const wave = L && L.boss ? this.waveOfIndex(n) : 0;
    let r = Math.max(R.ringMinR, R.ringR * P.radius * Math.pow(R.loopRadiusMul, ph.loops)) * (1 + run.mods.ringRadius);
    if (L && L.boss === 'swarm') r *= [0.95, 0.9, 0.85][wave];
    const gold = run.mods.goldEvery > 0 && (n + 1) % run.mods.goldEvery === 0;
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
      coin: (gold || type === 'anomaly') ? false : U.chance(P.coin), coinTaken: false, resolved: false, missed: false, index: n, flash: 0, hit: false, prevAcross: null, aligned: false,
      phaseNumber: ph.number, gold, alpha: (P.fog || P.dark || type === 'ghost') ? 0 : 1, reflexUsed: false, dbl
    };
    this.rings.push(ring);
    // obstáculos no vazio entre o arco anterior e este (sempre longe do centro dos dois)
    if (!this.demo && P.obs && this.lastRing && !dbl && spacing >= 240 && U.chance(P.obs)) this.spawnObstacles(this.lastRing, ring, P);
    // item fora da linha dos arcos
    if (!this.demo && P.pick && !dbl && n - this.lastPickupRing >= HR.CONFIG.PICKUP.minGap && U.chance(P.pick)) this.spawnPickup(ring, spacing);
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

  spawnPickup(ring, spacing) {
    const U = HR.U, K = HR.CONFIG.PICKUP, list = HR.CONFIG.PICKUPS;
    let total = 0; list.forEach(p => { total += p.w; });
    let r = Math.random() * total, def = list[0];
    for (const p of list) { r -= p.w; if (r <= 0) { def = p; break; } }
    if (def.id === 'life' && this.run.lives >= 2) def = list[0];
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
  updateAbilities(dt) {
    const run = this.run;
    run.abilities.forEach(ab => { if (!ab) return; if (ab.cd > 0) ab.cd = Math.max(0, ab.cd - dt); if (ab.active > 0) ab.active = Math.max(0, ab.active - dt); });
    ['slowmoT', 'magnetT', 'autoT', 'ghostT', 'freezeT', 'reflexT', 'starT'].forEach(k => { if (run[k] > 0) run[k] = Math.max(0, run[k] - dt); });
    // ascensão: fluxo (piloto em pulsos → permanente) e intangível (fantasma por ciclos → permanente); suspensos na anomalia
    const M = run.mods;
    if (M.autoflow && !run.anomalyActive) { run.flowClock += dt; const on = M.autoflow >= 3 || (run.flowClock % [0, 15, 12][M.autoflow]) < [0, 3, 6][M.autoflow]; if (on) run.autoT = Math.max(run.autoT, 0.08); }
    if (M.intangible) { run.ghostClock += dt; const on = M.intangible >= 3 || (run.ghostClock % 10) < [0, 4, 7][M.intangible]; if (on) run.ghostT = Math.max(run.ghostT, 0.08); }
  }
  effectiveTimeScale() {
    const run = this.run;
    let ts = 1;
    if (this.state === 'dying') ts *= HR.CONFIG.RUN.deathSlowmo;
    if (run.slowmoT > 0) ts *= 0.45;
    else if (run.reflexT > 0) ts *= 0.5;
    return ts;
  }
  protectedNow() { const run = this.run; return this.demo || run.invuln > 0 || run.ghostT > 0 || run.starT > 0; }

  /* ---------------- perks ---------------- */
  maybeOfferPerk() {
    const run = this.run, every = 10;
    if (run.ringsPassed > 0 && run.ringsPassed % every === 0 && run.perksOffered < Math.floor(run.ringsPassed / every)) {
      if (run.level && run.ringsResolved >= run.level.rings) return;
      run.perksOffered = Math.floor(run.ringsPassed / every);
      // escolha automática (ligada pelo jogador) a partir da 4ª oferta: não pausa
      if (HR.Store.data.settings.autoPerk && run.perksOffered > HR.CONFIG.AUTOPERK.afterOffers) {
        const id = HR.Perks.autoPick(run);
        if (id) { HR.Perks.take(run, id); run.autoPerks++; HR.Store.data.stats.perksTaken++; const p = HR.Perks.def(id); if (p && p.rarity !== 'common') run.rarePerks++; this.emit('autoperk', { id }); this.emit('status', run); }
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
    this.state = 'ready'; HR.Input.reset();
    this.emit('status', this.run);
    this.emit('ready', this.run);
  }
  rerollPerks() { if (this.state !== 'perk') return []; return HR.Perks.offer(this.run, 3); }

  /* ---------------- atualização ---------------- */
  update(dt) {
    this.time += dt;
    const s = this.state, R = HR.CONFIG.RUN, run = this.run;
    if (s === 'idle') { this.updateShowcase(dt); this.particles.update(dt); this.bg.update(dt, 10, { x: -1, y: 0 }); return; }
    if (s === 'transition') { this.updateTransition(dt); if (this.state === 'transition') this.updateBall(dt, dt); this.particles.update(dt); this.bg.update(dt, 40, this.motionDir()); return; }
    this.timeScale = this.effectiveTimeScale();
    const sdt = dt * this.timeScale;
    if (s === 'playing') this.updateAbilities(dt);
    if (s === 'playing' || s === 'dying') this.moveRings(sdt);
    if (s === 'playing' || s === 'ready') this.updateBall(sdt, dt);
    if (s === 'playing') { this.checkRings(); this.checkReflex(); this.checkField(dt); this.updateAnomaly(dt); }
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
    for (const r of this.rings) if (r.flash > 0) r.flash = Math.max(0, r.flash - dt * 3);
    this.rings = this.rings.filter(r => r.x > -r.r * 2 - 60);
    this.obstacles = this.obstacles.filter(o => o.x > -80 && !o.dead);
    this.pickups = this.pickups.filter(p => p.x > -60 && !p.taken);
    if (s === 'playing' && this.pendingDir && !this.rings.length) { this.startTransition(this.pendingDir); return; }
    if (s === 'playing' || s === 'ready') this.fill();
    if (this.perkTimer > 0 && s === 'playing') { this.perkTimer -= dt; if (this.perkTimer <= 0) this.openPerks(); }
    if (this.levelEndTimer > 0 && s === 'playing') { this.levelEndTimer -= dt; if (this.levelEndTimer <= 0) this.finishRun(this.levelSuccess); }
    this.particles.update(dt);
    const moving = s === 'playing' || s === 'dying';
    this.bg.update(dt, moving ? this.speedAt(run.ringsPassed) * this.timeScale : 0, this.motionDir());
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 30);
  }

  // anomalias (só no infinito): a cada ~75 s um arco imune a poderes; aviso antes; exige ação humana
  updateAnomaly(dt) {
    const run = this.run, A = HR.CONFIG.ANOMALY;
    run.anomalyActive = this.rings.some(r => r.type === 'anomaly' && !r.resolved);
    if (run.mode !== 'endless' || run.ringsPassed < A.fromRing) return;
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
    const sw = boss === 'singularity' ? ['pulse', 'blink', 'shrink', 'cyclone', 'all'][wave] : null;
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
    for (const o of this.obstacles) { o.x -= v * dt; o.rot += o.vr * dt; }
    const magnet = run.magnetT > 0 || run.mods.magnet, MR = HR.CONFIG.PICKUP.magnetRange;
    for (const p of this.pickups) {
      p.x -= v * dt; p.y = p.baseY + Math.sin(t * 3 + p.seed) * 6;
      if (magnet) { const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy); if (d < MR && d > 1) { const k = 640 * dt / d; p.x += dx * k; p.baseY += dy * k; } }
    }
  }

  controlMode() {
    const c = HR.Store.data.settings.control;
    if (c === 'relative' || c === 'absolute' || c === 'stick') return c;
    return (HR.Input.lastPointerType === 'mouse' && HR.Input.hasHover) ? 'absolute' : 'stick';
  }

  updateBall(sdt, dt) {
    const B = HR.CONFIG.BALL, b = this.ball, st = HR.Store.data.settings, I = HR.Input, run = this.run;
    const U = this.uAxis(), V = this.vAxis();
    const canControl = this.state === 'playing' || this.state === 'ready' || this.state === 'transition';
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
        const S = I.stick, m = Math.hypot(S.x, S.y);
        let vt = 0;
        if (S.active && m > B.stickDead) {
          vt = Math.pow(Math.min(1, (m - B.stickDead) / (1 - B.stickDead)), B.stickCurve) * B.stickSpeed * (st.sensitivity || 1);
          const k = vt * dt / m;
          b.tx += (S.x * U.x + S.y * U.y) * k; b.ty += (S.x * V.x + S.y * V.y) * k;
        }
        if (I.keys.up || I.keys.down || I.keys.left || I.keys.right) vt = Math.max(vt, B.keySpeed);
        // o alvo nunca foge da bola mais que o necessário: ao soltar, a bola para sem deslizar
        const lead = B.stickLead + vt * B.damping / B.spring, lx = b.tx - b.x, ly = b.ty - b.y, ld = Math.hypot(lx, ly);
        if (ld > lead) { b.tx = b.x + lx * lead / ld; b.ty = b.y + ly * lead / ld; }
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
    b.vx += ((b.tx - b.x) * K - b.vx * C) * dt;
    b.vy += ((b.ty - b.y) * K - b.vy * C) * dt;
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > B.maxVy) { b.vx *= B.maxVy / sp; b.vy *= B.maxVy / sp; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.y < b.r) { b.y = b.r; b.vy *= -0.3; } else if (b.y > this.Lv - b.r) { b.y = this.Lv - b.r; b.vy *= -0.3; }
    const cu = this.clampU(b.x); if (cu !== b.x) { b.x = cu; b.vx *= -0.3; }
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
    const b = this.ball, run = this.run, P = this.particles;
    void dt;
    for (const o of this.obstacles) {
      if (o.dead) continue;
      if (Math.hypot(b.x - o.x, b.y - o.y) >= b.r + o.r) continue;
      if (run.starT > 0) { o.dead = true; run.obstaclesDestroyed++; HR.Store.data.stats.obstaclesDestroyed++; this.addCoins(2, o.x, o.y - 24); HR.Audio.sfx('coin'); P.burst({ x: o.x, y: o.y, n: 14, speed: 300, color: ['#c9d2ea', '#ffffff'], size: 5, life: 0.6, type: 'shard' }); continue; }
      if (run.ghostT > 0 || run.invuln > 0) continue;
      o.dead = true; o.hit = true; o.flash = 1;
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
    p.taken = true; run.pickups++;
    let label = '';
    switch (p.id) {
      case 'coins': { const v = this.addCoins(K.coins); label = '+' + v; break; }
      case 'shield': run.shields = Math.min(this.shieldCap(), run.shields + 1); label = HR.t('pk_shield'); this.emit('status', run); break;
      case 'magnet': run.magnetT = Math.max(run.magnetT, K.magnetDur); label = HR.t('pk_magnet'); break;
      case 'slow': run.slowmoT = Math.max(run.slowmoT, K.slowDur); label = HR.t('pk_slow'); break;
      case 'star': run.starT = K.starDur; run.starsUsed++; d.stats.starsUsed++; label = HR.t('pk_star'); break;
      case 'life': run.lives++; label = HR.t('pk_life'); this.emit('status', run); break;
      case 'gem': run.gemsFound++; HR.Economy.addGems(1, 'pickup'); label = HR.t('pk_gem'); break;
    }
    if (!d.codex.items.includes(p.id)) { d.codex.items.push(p.id); this.emit('discover', { kind: 'item', id: p.id }); }
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
    const limit = r.r - b.r * R.forgiveness, rim = r.r + b.r * 0.9, a = Math.abs(along);
    if (r.type === 'anomaly') { if (a <= limit) this.passAnomaly(r); else this.damage(r, true); return; }
    if (a <= limit || (this.protectedNow() && a <= rim)) this.pass(r, along, limit);
    else if (a <= rim) this.damage(r, false);
    else this.miss(r);
    if (r.coin && !r.coinTaken) run.coinsMissed++;
  }

  addCoins(n, x, y) {
    const run = this.run;
    const mul = run.mods.coinMul * (run.magnetT > 0 ? 2 : 1);
    const val = Math.round(n * mul);
    run.coins += val;
    if (x != null) this.particles.text(x, y, '+' + val, '#ffcf4a', 20);
    return val;
  }

  discoverRing(type) {
    const d = HR.Store.data; if (this.demo || d.codex.rings.includes(type)) return;
    d.codex.rings.push(type); this.emit('discover', { kind: 'ring', id: type });
  }
  ringResolved() {
    const run = this.run, L = run.level;
    run.ringsResolved++;
    if (L) {
      if (L.boss) this.emit('boss', { fill: 1 - run.ringsPassed / L.rings });
      if (run.ringsResolved >= L.rings && !run.levelDone) { run.levelDone = true; this.levelSuccess = run.ringsPassed >= HR.Campaign.passNeed(L); this.levelEndTimer = 0.6; HR.Audio.sfx(this.levelSuccess ? 'levelup' : 'error'); }
    }
  }

  miss(r) {
    const run = this.run, P = this.particles;
    r.resolved = true; r.missed = true; r.flash = 0.5;
    if (this.demo) return;
    run.combo = 0; run.misses++; run.cleanStreak = 0; run.noMissStreak = 0;
    HR.Store.data.stats.misses++;
    P.text(r.x, r.y - r.r - 22, HR.t('miss'), '#8d97b3', 20);
    HR.Audio.sfx('miss');
    this.ringResolved();
    this.emit('score', run, false);
  }

  pass(r, along, limit) {
    const run = this.run, E = HR.CONFIG.ECONOMY, R = HR.CONFIG.RUN, P = this.particles;
    r.resolved = true; r.flash = 1;
    if (this.demo) { run.ringsPassed++; return; }
    run.score += run.mods.scorePerRing + run.mods.momentum; run.ringsPassed++;
    run.cleanStreak++; run.cleanRings = Math.max(run.cleanRings, run.cleanStreak);
    run.noMissStreak++; run.noMissRings = Math.max(run.noMissRings, run.noMissStreak);
    if (this.dir === 'top') run.ringsTop++; else if (this.dir === 'left') run.ringsLeft++;
    if (r.dbl) run.doubleRings++;
    this.discoverRing(r.type);
    if (limit && Math.abs(along) > limit * R.nearZone) { run.nearMisses++; P.text(this.ball.x, this.ball.y + 40, HR.t('near_miss'), '#ff9f43', 16); }
    const perfect = Math.abs(along) <= r.r * R.perfectZone * run.mods.perfectZone;
    if (perfect) {
      run.combo++; run.perfects++; run.maxCombo = Math.max(run.maxCombo, run.combo);
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
    } else { run.combo = 0; HR.Audio.sfx('pass', { combo: 0 }); }
    if (r.coin && !r.coinTaken && (run.mods.magnet || run.magnetT > 0 || Math.abs(along) <= r.r * R.coinZone)) {
      r.coinTaken = true; run.coinsTaken++; this.addCoins(E.coinPickup, r.x, r.y - 20); HR.Audio.sfx('coin');
      P.burst({ x: r.x, y: r.y, n: 8, speed: 260, color: '#ffcf4a', size: 5, life: 0.5 });
    }
    if (r.gold) { run.goldRings++; this.addCoins(5, r.x, r.y - 20); HR.Audio.sfx('reward'); P.burst({ x: r.x, y: r.y, n: 24, speed: 360, color: ['#ffcf4a', '#fff6c8'], size: 6, life: 0.8, type: 'spark' }); }
    // regeneração (ascensão): +1 escudo a cada 12/8/5 arcos
    const rg = run.mods.regen; if (rg && run.ringsPassed % [0, 12, 8, 5][rg] === 0 && run.shields < this.shieldCap()) { run.shields++; P.text(this.ball.x, this.ball.y - 90, HR.t('perk_regen') + ' +1', '#4cf0ff', 20); this.emit('status', run); }
    P.burst({ x: r.x, y: r.y, n: perfect ? 18 : 8, speed: perfect ? 380 : 220, color: [r.color, '#ffffff'], size: 5, life: 0.6, type: 'spark' });
    if (this.fx === 'water') P.burst({ x: r.x, y: r.y, n: 6, speed: 60, color: '#cfe9ff', size: 5, life: 1.3, type: 'bubble', vy: -80, drag: 0.98 });
    if (run.level) {
      const L = run.level;
      if (L.boss) {
        const wave = this.waveOfIndex(run.ringsResolved + 1);
        if (wave !== run.bossWave && run.ringsResolved + 1 < L.rings) { run.bossWave = wave; HR.Audio.sfx('phase'); this.emit('wave', wave + 1); P.burst({ x: this.ball.x, y: this.ball.y, n: 40, speed: 600, color: [r.color, '#ffffff'], size: 6, life: 1, type: 'spark', drag: 0.92 }); HR.Audio.setIntensity(0.4 + 0.6 * wave / (L.waves - 1)); }
      } else HR.Audio.setIntensity(0.2 + 0.8 * run.ringsResolved / L.rings);
    } else {
      const ph = this.phaseAt(run.ringsPassed);
      if (ph.number !== run.phaseNumber) {
        run.phaseNumber = ph.number; run.phaseIdx = ph.idx;
        this.bg.setTint(ph.phase.accent);
        HR.Audio.sfx('phase');
        HR.Audio.setIntensity(Math.min(1, (ph.number - 1) / 8));
        P.burst({ x: this.ball.x, y: this.ball.y, n: 40, speed: 600, color: [ph.phase.accent, '#ffffff'], size: 6, life: 1, type: 'spark', drag: 0.92 });
        this.emit('phase', { number: ph.number, name: HR.t(ph.phase.key), accent: ph.phase.accent });
      }
    }
    this.ringResolved();
    this.emit('score', run, perfect);
    this.maybeOfferPerk();
  }

  passAnomaly(r) {
    const run = this.run, A = HR.CONFIG.ANOMALY, P = this.particles;
    r.resolved = true; r.flash = 1;
    run.score += run.mods.scorePerRing + run.mods.momentum + A.bonusScore; run.ringsPassed++; run.anomaliesBeaten++;
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
    run.combo = 0; run.hits++; run.cleanStreak = 0; run.noMissStreak = 0;
    if (src && src.type === 'anomaly') { P.text(this.ball.x, this.ball.y - 64, HR.t('anomaly_hit'), '#ff3d2e', 24); this.ringResolved(); }
    if (run.mode === 'practice') {
      this.shake = 6; HR.Audio.sfx('error'); HR.U.vibrate(20);
      P.text(this.ball.x, this.ball.y - 60, '✕', '#ff5e7e', 34);
      run.invuln = 0.6;
      this.emit('score', run, false);
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
    for (const o of this.obstacles) { o.x += shift; if (Math.abs(o.x - this.ball.x) < 160) o.dead = true; }
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
    let xp = run.mode === 'practice' ? 0 : run.score * E.xp.perRing + run.perfects * E.xp.perPerfect + (run.level ? 0 : (run.phaseNumber - 1) * E.xp.perPhase);
    if (run.level && success) xp += E.xp.perLevel;
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
      pickups: run.pickups, anomaliesBeaten: run.anomaliesBeaten, starsUsed: run.starsUsed, obstaclesDestroyed: run.obstaclesDestroyed, gemsFound: run.gemsFound, autoPerks: run.autoPerks,
      levelDone: 0, starsGot: 0, threeStar: 0, bossDone: 0, flawless: 0
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
      HR.Render.drawRingCenter(ctx, r, r.aligned && this.state === 'playing', t);
    }
    for (const o of this.obstacles) HR.Render.drawObstacle(ctx, o, t);
    for (const p of this.pickups) HR.Render.drawPickup(ctx, p, t);
    if (b.alpha > 0) {
      const heat = Math.min(1, run.combo / 20);
      HR.Render.drawTrail(ctx, this.trail, b.trail, this.skin, t, heat);
      const blink = run.invuln > 0 && this.state === 'playing' && Math.floor(t * 12) % 2 === 0;
      const ghost = run.ghostT > 0;
      const spd = Math.hypot(b.vx, b.vy), axisLocal = Math.abs(b.vx) > Math.abs(b.vy) ? 'x' : 'y';
      const sqAxisNow = axisLocal === 'y' ? sqAxis : (sqAxis === 'x' ? 'y' : 'x');
      ctx.save(); ctx.translate(b.x, b.y + Math.sin(t * 3) * 2); ctx.rotate(-rot);
      HR.Render.drawBall(ctx, 0, 0, b.r, this.skin, t, { vy: spd, sqAxis: sqAxisNow, alpha: b.alpha * (blink ? 0.45 : 1) * (ghost ? 0.5 : 1), shield: run.shields > 0, shields: run.shields, heat: run.combo >= 5 ? heat : 0, star: run.starT > 0 ? run.starT : 0 });
      ctx.restore();
      if (run.autoT > 0 && !run.anomalyActive) { ctx.strokeStyle = 'rgba(162,155,254,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 1.8, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
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
