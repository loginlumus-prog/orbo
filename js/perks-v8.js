/* =====================================================================
   ORBO v8 — 15 perks novos e 6 BUILDS.

   Os 37 perks antigos quase nao tocavam no que de fato derruba o casual:
   oscilacao, giro, nevoa, borda e densidade. Os 15 daqui mexem exatamente
   nisso, e quase todos sao comuns ou raros — aparecem de verdade.

   As BUILDS sao o outro lado: tres perks que ja se atraem, juntos, viram
   um bonus com nome. Acontece com frequencia para quem monta e quase nunca
   por acaso.

   Tudo por EMBRULHO (padrao de js/costura-v8.js): perks.js so abriu as
   listas BASE/ADD/MUL; game.js, ui.js, ui-hud.js e ui-perks-v56.js nao sao
   tocados. Carregar DEPOIS de js/perks.js e js/ui-perks-v56.js.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const P = HR.Perks; if (!P || !HR.PERKS) return;

  /* ---------------- chaves novas de mods ---------------- */
  Object.assign(P.BASE, {
    visMul: 1, oscMul: 1, tiltMul: 1, tbMul: 1, warmup: 0, softRim: 0, guide: false,
    rewardMul: 1, xpMul: 1, starForgive: 0, overdrive: false, chronoEvery: 0, sentry: 0,
    perfectCoins: 0, wayfinder: false, streakRun: 0,
    // das builds
    wallRegen: 0, endBonusMul: 1, ghostOnPerfect: 0, passNeedDelta: 0
  });
  ['starForgive', 'perfectCoins'].forEach(k => { if (P.ADD.indexOf(k) < 0) P.ADD.push(k); });
  ['visMul', 'oscMul', 'tiltMul', 'tbMul', 'rewardMul', 'xpMul', 'endBonusMul'].forEach(k => { if (P.MUL.indexOf(k) < 0) P.MUL.push(k); });

  /* ---------------- os 15 perks ---------------- */
  const NOVOS = [
    { id: 'lantern',      rarity: 'rare',      max: 1, icon: 'eye',       mods: { visMul: 1.4 } },
    { id: 'anchor',       rarity: 'common',    max: 2, icon: 'link',      mods: { oscMul: 0.7 } },
    { id: 'gyro',         rarity: 'common',    max: 1, icon: 'rotate',    mods: { tiltMul: 0.65 } },
    { id: 'warmup',       rarity: 'common',    max: 1, icon: 'hourglass', mods: { warmup: 0.8 } },
    { id: 'patience',     rarity: 'rare',      max: 1, icon: 'waiting',   mods: { tbMul: 1.12 } },
    { id: 'softrim',      rarity: 'rare',      max: 1, icon: 'ringBig',   mods: { softRim: 0.5 } },
    { id: 'guide',        rarity: 'common',    max: 1, icon: 'route',     mods: { guide: true } },
    { id: 'treasure',     rarity: 'rare',      max: 1, icon: 'chest',     mods: { rewardMul: 1.3 } },
    { id: 'grace_star',   rarity: 'epic',      max: 1, icon: 'starGlow',  mods: { starForgive: 1 } },
    { id: 'overdrive',    rarity: 'epic',      max: 1, icon: 'speed',     mods: { overdrive: true } },
    { id: 'timelord',     rarity: 'legendary', max: 1, icon: 'chrono',    mods: { chronoEvery: 25 } },
    { id: 'sentry',       rarity: 'rare',      max: 1, icon: 'sentinel',  mods: { sentry: 6 } },
    { id: 'tithe',        rarity: 'common',    max: 2, icon: 'coin',      mods: { perfectCoins: 2 } },
    { id: 'cartographer', rarity: 'common',    max: 1, icon: 'map',       mods: { xpMul: 1.25 } },
    { id: 'wayfinder',    rarity: 'rare',      max: 1, icon: 'compass',   mods: { wayfinder: true } }
  ];
  NOVOS.forEach(p => { if (!HR.PERKS.some(x => x.id === p.id)) HR.PERKS.push(p); });

  // a ficha da partida agrupa os perks em cinco arvores; os novos entram nas suas
  const ARVORE = {
    guard: ['softrim', 'sentry', 'grace_star'],
    aim: ['anchor', 'gyro', 'lantern', 'guide'],
    flow: ['warmup', 'patience', 'wayfinder', 'timelord'],
    gold: ['tithe', 'treasure', 'cartographer', 'overdrive']
  };
  if (HR.PERK_TREES) HR.PERK_TREES.forEach(t => { (ARVORE[t.id] || []).forEach(id => { if (t.ids.indexOf(id) < 0) t.ids.push(id); }); });

  /* ---------------- as 6 builds ---------------- */
  HR.BUILDS = [
    { id: 'muralha',    perks: ['shield', 'bulwark', 'hull'],            icon: 'shield',    color: '#4cf0ff', mods: { capBonus: 2, wallRegen: 12 } },
    { id: 'ourives',    perks: ['coinsx2', 'stardust', 'tithe'],         icon: 'coins',     color: '#ffcf4a', mods: { endBonusMul: 2 } },
    { id: 'fantasma',   perks: ['reflex', 'softrim', 'microball'],       icon: 'ghost',     color: '#cfe9ff', mods: { ghostOnPerfect: 1 } },
    { id: 'relojoeiro', perks: ['fastcd', 'breath', 'resonance'],        icon: 'cooldown',  color: '#a29bfe', mods: { cdMul: 0.5 }, apply(run) { (run.abilities || []).forEach(ab => { if (ab) ab.cd = 0; }); } },
    { id: 'astronomo',  perks: ['lantern', 'anchor', 'gyro'],            icon: 'compass',   color: '#35e29a', mods: { ringRadius: 0.12 } },
    { id: 'peregrino',  perks: ['calm', 'patience', 'warmup'],           icon: 'wind',      color: '#9dff8a', mods: { passNeedDelta: -0.10 } }
  ];
  const buildDef = id => HR.BUILDS.find(b => b.id === id);

  // recompute() parte de baseMods a cada perk tomado: os bonus da build
  // precisam ser somados de novo depois do laco, senao somem no perk seguinte
  const origRecompute = P.recompute;
  P.recompute = function (run) {
    const m = origRecompute.call(this, run);
    const b = run.builds;
    if (b) for (const id in b) { if (!b[id]) continue; const d = buildDef(id); if (d && d.mods) this.applyMods(m, d.mods, 1); }
    return m;
  };

  function checaBuilds(run) {
    run.builds = run.builds || {};
    HR.BUILDS.forEach(b => {
      if (run.builds[b.id]) return;
      if (!b.perks.every(id => (run.perks || {})[id])) return;
      run.builds[b.id] = true;
      if (b.apply) b.apply(run);
      P.recompute(run);
      registra(b.id);
      aviso(b);
    });
  }

  // um aviso por build e por partida — sem texto correndo na tela
  function aviso(b) {
    const g = HR.game || (HR.UI && HR.UI.game);
    try {
      if (HR.UI && HR.UI.banner) HR.UI.banner(HR.t('build') + ': ' + HR.t('build_' + b.id).toUpperCase(), HR.t('build_d_' + b.id), b.color);
      else if (g && g.emit) g.emit('banner', { title: HR.t('build_' + b.id).toUpperCase(), sub: HR.t('build_d_' + b.id), color: b.color });
      if (HR.Audio && HR.Audio.sfx) HR.Audio.sfx('levelup');
    } catch (_) { /* nada */ }
  }

  function registra(id) {
    try {
      const d = HR.Store.data; d.stats5 = d.stats5 || {}; d.stats5.builds = d.stats5.builds || {};
      d.stats5.builds[id] = (d.stats5.builds[id] || 0) + 1;
      HR.Store.save();
      if (HR.UI && HR.UI.trophyCheck) setTimeout(() => HR.UI.trophyCheck(), 500);
    } catch (_) { /* nada */ }
  }

  const origTake = P.take;
  P.take = function (run, id) {
    const r = origTake.apply(this, arguments);
    try { checaBuilds(run); } catch (_) { /* nada */ }
    return r;
  };

  // a escolha automatica passa a preferir o perk que fecha uma build
  const origAuto = P.autoPick;
  P.autoPick = function (run) {
    const offers = this.offer(run, 3);
    if (offers.length) {
      for (const b of HR.BUILDS) {
        if (run.builds && run.builds[b.id]) continue;
        const faltam = b.perks.filter(id => !(run.perks || {})[id]);
        if (faltam.length === 1) { const o = offers.find(p => p.id === faltam[0]); if (o) return o.id; }
      }
    }
    return origAuto.apply(this, arguments);
  };

  /* =====================================================================
     Ligacoes no jogo: cada mod novo lido no ponto certo, sempre por embrulho
     ===================================================================== */
  const G = HR.Game && HR.Game.prototype;
  if (!G) return;

  const M = g => (g.run && g.run.mods) || null;

  // arcos: oscilacao e inclinacao menores (anchor / gyro)
  const origSpawnRing = G.spawnRing;
  G.spawnRing = function () {
    const r = origSpawnRing.apply(this, arguments);
    const m = M(this), ring = this.rings[this.rings.length - 1];
    if (!m || !ring) return r;
    if (m.oscMul !== 1) ring.osc *= m.oscMul;
    if (m.tiltMul !== 1) { ring.tilt0 *= m.tiltMul; ring.tilt = ring.tilt0; ring.rot *= m.tiltMul; }
    return r;
  };

  // warmup: os 10 primeiros arcos da fase vem mais devagar
  const origSpeedAt = G.speedAt;
  G.speedAt = function (n, base) {
    const v = origSpeedAt.apply(this, arguments);
    const m = M(this);
    return m && m.warmup && this.run.ringsPassed < 10 ? v * m.warmup : v;
  };

  // patience: intervalo maior entre os arcos
  const origTbAt = G.tbAt;
  G.tbAt = function (n, ph) {
    const v = origTbAt.apply(this, arguments);
    const m = M(this);
    return m && m.tbMul !== 1 ? v * m.tbMul : v;
  };

  // lantern: a nevoa e o escuro alcancam mais longe (os params da fase sao
  // compartilhados pelo cache de HR.Campaign — entram e saem na mesma chamada)
  const origMoveRings = G.moveRings;
  G.moveRings = function (dt) {
    const m = M(this), L = this.run && this.run.level;
    if (!m || m.visMul === 1 || !L || !L.params) return origMoveRings.apply(this, arguments);
    const p = L.params, f0 = p.fog, d0 = p.dark;
    if (f0) p.fog = f0 * m.visMul;
    if (d0) p.dark = d0 * m.visMul;
    try { return origMoveRings.apply(this, arguments); }
    finally { p.fog = f0; p.dark = d0; }
  };

  // softrim: metade das batidas na borda despedaca o arco em vez de machucar
  const origResolve = G.resolve;
  G.resolve = function (r, along) {
    const run = this.run, m = M(this);
    if (m && m.softRim && r.type !== 'anomaly' && !r.nova && !this.protectedNow()) {
      const R = HR.CONFIG.RUN, br = this.ballR();
      const limit = r.r - br * (R.forgiveness + run.core.forgive), rim = r.r + br * 0.9, a = Math.abs(along);
      if (a > limit && a <= rim && Math.random() < m.softRim) {
        const g0 = run.ghostT; run.ghostT = 0.001;
        try { return origResolve.apply(this, arguments); } finally { run.ghostT = g0; }
      }
    }
    return origResolve.apply(this, arguments);
  };

  // sentry: a cada N segundos some o obstaculo mais proximo
  const origCheckField = G.checkField;
  G.checkField = function (dt) {
    const run = this.run, m = M(this);
    if (m && m.sentry && this.state === 'playing') {
      run.sentryT = (run.sentryT || 0) + dt;
      if (run.sentryT >= m.sentry) {
        run.sentryT = 0;
        let alvo = null, melhor = 1e9;
        for (const o of this.obstacles) { if (o.dead) continue; const d = Math.hypot(this.ball.x - o.x, this.ball.y - o.y); if (d < melhor) { melhor = d; alvo = o; } }
        if (alvo) {
          alvo.dead = true; run.obstaclesDestroyed++;
          this.particles.burst({ x: alvo.x, y: alvo.y, n: 12, speed: 280, color: ['#9be7ff', '#ffffff'], size: 5, life: 0.6, type: 'shard' });
          HR.Audio.sfx('shield');
        }
      }
    }
    return origCheckField.apply(this, arguments);
  };

  // wayfinder: cada troca de direcao devolve folego
  const origTransition = G.updateTransition;
  G.updateTransition = function (dt) {
    const tinha = !!this.trans;
    const r = origTransition.apply(this, arguments);
    const m = M(this), run = this.run;
    if (m && m.wayfinder && tinha && !this.trans) {
      run.slowmoT = Math.max(run.slowmoT, 1.5);
      if (run.shields <= 0) { run.shields = 1; this.emit('status', run); }
    }
    return r;
  };

  // por arco passado: tithe, overdrive, risky (moeda), escudo de sequencia,
  // Cronos do timelord, Fantasma da build e o escudo da Muralha
  const origPass = G.pass;
  G.pass = function (r, along, limit) {
    const run = this.run, antes = run.perfects;
    const out = origPass.apply(this, arguments);
    const m = M(this); if (!m) return out;
    const perfeito = run.perfects > antes;
    if (m.coinPerRing) this.addCoins(m.coinPerRing);
    if (perfeito && m.perfectCoins) this.addCoins(m.perfectCoins, r.x, r.y - 30);
    if (perfeito && m.ghostOnPerfect) run.ghostT = Math.max(run.ghostT, 1);
    if (m.overdrive && run.flowV >= 0.8) { run.score += 1; this.addCoins(1); }
    if (m.chronoEvery && run.ringsPassed > 0 && run.ringsPassed % m.chronoEvery === 0) run.chronoT = Math.max(run.chronoT, 1.5);
    if (m.streakRun) {
      run.hitStreak = (run.hitStreak || 0) + 1;
      if (run.hitStreak % m.streakRun === 0 && run.shields < this.shieldCap()) { run.shields++; this.particles.text(this.ball.x, this.ball.y - 90, HR.t('perk_shield') + ' +1', '#4cf0ff', 22); this.emit('status', run); }
    }
    if (m.wallRegen && run.ringsPassed > 0 && run.ringsPassed % m.wallRegen === 0 && run.shields < this.shieldCap()) { run.shields++; this.emit('status', run); }
    return out;
  };
  // errar ou levar dano quebra a sequencia de acertos
  const origMiss = G.miss;
  G.miss = function () { if (this.run) this.run.hitStreak = 0; return origMiss.apply(this, arguments); };
  const origDamage = G.damage;
  G.damage = function () { if (this.run) this.run.hitStreak = 0; return origDamage.apply(this, arguments); };

  // guide: um fio fraco da bola ao centro do proximo arco
  const origRender = G.render;
  G.render = function () {
    const r = origRender.apply(this, arguments);
    const m = M(this);
    if (!m || !m.guide || (this.state !== 'playing' && this.state !== 'ready')) return r;
    let alvo = null;
    for (const ring of this.rings) if (!ring.resolved && (!alvo || ring.x < alvo.x) && ring.x >= this.ball.x - 20) alvo = ring;
    if (!alvo) return r;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.frame.ox, this.frame.oy); ctx.rotate(this.frame.angle);
    ctx.strokeStyle = HR.U.rgba('#cfe9ff', 0.22); ctx.lineWidth = 1.6; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(this.ball.x, this.ball.y); ctx.lineTo(alvo.x, alvo.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    return r;
  };

  // fim da partida: XP, premio da fase, bonus final e o perdao da 3a estrela
  const origSummary = G.summary;
  G.summary = function (success) {
    const s = origSummary.apply(this, arguments);
    const m = M(this); if (!m) return s;
    if (m.xpMul !== 1) s.xp = Math.min(HR.CONFIG.PROGRESSION.xpRunCap, Math.round(s.xp * m.xpMul));
    if (m.endBonusMul !== 1 && s.bonus) { const extra = Math.round(s.bonus * (m.endBonusMul - 1)); s.bonus += extra; s.coins += extra; }
    s.rewardMul = m.rewardMul || 1;
    s.starForgive = m.starForgive || 0;
    return s;
  };

  // grace_star: um dano perdoado na conta da 3a estrela
  if (HR.Campaign) {
    const origStars = HR.Campaign.computeStars;
    HR.Campaign.computeStars = function (summary, level) {
      const f = summary.starForgive || 0;
      if (!f) return origStars.call(this, summary, level);
      return origStars.call(this, Object.assign({}, summary, { hits: Math.max(0, summary.hits - f) }), level);
    };
    // treasure: premio de conclusao da fase +30 %
    const origFirst = HR.Campaign.firstClearReward;
    HR.Campaign.firstClearReward = function (level) {
      const r = origFirst.call(this, level);
      const g = HR.game || (HR.UI && HR.UI.game), m = g && g.run && g.run.mods;
      const run = g && g.run;
      if (m && m.rewardMul && m.rewardMul !== 1 && run && run.level && level && run.level.id === level.id) r.coins = Math.round(r.coins * m.rewardMul);
      return r;
    };
    // peregrino: passar 50 % dos arcos ja vence a fase
    const origNeed = HR.Campaign.passNeed;
    HR.Campaign.passNeed = function (level, help) {
      const n = origNeed.call(this, level, help);
      const g = HR.game || (HR.UI && HR.UI.game), run = g && g.run, m = run && run.mods;
      if (m && m.passNeedDelta && run.level && level && run.level.id === level.id) return Math.max(1, n + Math.ceil(level.rings * m.passNeedDelta));
      return n;
    };
  }

  /* ---------------- a secao "Builds" na ficha da partida ---------------- */
  if (HR.UI && HR.UI.openPerkSheet) {
    const origSheet = HR.UI.openPerkSheet;
    HR.UI.openPerkSheet = function () {
      const r = origSheet.apply(this, arguments);
      try {
        const body = HR.U.$('#perk-sheet .perk-body'); if (!body) return r;
        if (HR.U.$('.perk-builds', body)) return r;
        const run = HR.game && HR.game.run; if (!run) return r;
        const box = HR.U.el('div', 'perk-builds');
        let h = '<div class="perk-tree-head"><span class="pt-ic">' + HR.icon('layers') + '</span><b>' + HR.t('builds') + '</b><i>' +
          Object.keys(run.builds || {}).length + '/' + HR.BUILDS.length + '</i></div><div class="perk-row">';
        HR.BUILDS.forEach(b => {
          const feita = !!(run.builds && run.builds[b.id]);
          const tem = b.perks.filter(id => (run.perks || {})[id]).length;
          h += '<button type="button" class="perk-node' + (feita ? ' on' : '') + '" style="--tc:' + b.color + '"' +
            ' data-tip="' + HR.t('build_' + b.id) + '" data-tip-d="' + HR.t('build_d_' + b.id) + '" data-tip-tap="1">' +
            '<span class="pn-ic">' + HR.icon(b.icon) + '</span><span class="pn-pips">' +
            b.perks.map((id, i) => '<i' + (i < tem ? ' class="on"' : '') + '></i>').join('') + '</span></button>';
        });
        box.innerHTML = h + '</div>';
        box.style.cssText = 'margin-top:.8em';
        body.appendChild(box);
      } catch (_) { /* nada */ }
      return r;
    };
  }

  /* ---------------- uma conquista por build ---------------- */
  if (HR.ACHIEVEMENTS) {
    HR.BUILDS.forEach(b => {
      const id = 'bld_' + b.id;
      if (!HR.ACHIEVEMENTS.some(a => a.id === id)) HR.ACHIEVEMENTS.push({ id, cat: 'power', stat: id, target: 1, gems: 40, icon: b.icon });
    });
  }
  if (HR.Achievements && typeof HR.Achievements.stats5 === 'function') {
    const orig = HR.Achievements.stats5;
    HR.Achievements.stats5 = function () {
      const out = orig.apply(this, arguments);
      const b = ((HR.Store.data.stats5 || {}).builds) || {};
      HR.BUILDS.forEach(x => { out['bld_' + x.id] = b[x.id] || 0; });
      return out;
    };
  }
})();

/* ---------------- textos ---------------- */
Object.assign(HR.I18N.pt, {
  perk_lantern: 'Lanterna', perk_lantern_d: 'Névoa e escuro alcançam 40 % mais longe.',
  perk_anchor: 'Âncora', perk_anchor_d: 'Os arcos oscilam 30 % menos por nível.',
  perk_gyro: 'Giroscópio', perk_gyro_d: 'Inclinação e giro dos arcos 35 % menores.',
  perk_warmup: 'Aquecimento', perk_warmup_d: 'Os 10 primeiros arcos da fase vêm 20 % mais devagar.',
  perk_patience: 'Paciência', perk_patience_d: 'Intervalo entre os arcos 12 % maior.',
  perk_softrim: 'Borda Macia', perk_softrim_d: 'Metade das batidas na borda despedaça o arco em vez de machucar.',
  perk_guide: 'Guia', perk_guide_d: 'Uma linha fraca liga a bola ao centro do próximo arco.',
  perk_treasure: 'Tesouro', perk_treasure_d: 'Prêmio de conclusão da fase 30 % maior.',
  perk_grace_star: 'Graça', perk_grace_star_d: 'Um dano é perdoado na conta da 3ª estrela.',
  perk_overdrive: 'Sobremarcha', perk_overdrive_d: 'Com o fluxo acima de 80 %, cada arco dá +1 ponto e +1 moeda.',
  perk_timelord: 'Senhor do Tempo', perk_timelord_d: 'A cada 25 arcos, o mundo para por 1,5 s.',
  perk_sentry: 'Sentinela', perk_sentry_d: 'A cada 6 s, o obstáculo mais próximo é destruído.',
  perk_tithe: 'Dízimo', perk_tithe_d: 'Cada PERFEITO dá +2 moedas por nível.',
  perk_cartographer: 'Cartógrafo', perk_cartographer_d: '+25 % de XP nesta partida.',
  perk_wayfinder: 'Rumo', perk_wayfinder_d: 'Cada troca de direção dá 1,5 s de câmera lenta e 1 escudo se você estiver sem nenhum.',
  builds: 'Builds',
  build_muralha: 'Muralha', build_d_muralha: 'Limite de escudos +2 e +1 escudo a cada 12 arcos.',
  build_ourives: 'Ourives', build_d_ourives: 'Bônus de fim de partida em dobro.',
  build_fantasma: 'Fantasma', build_d_fantasma: '1 s de Fantasma depois de cada PERFEITO.',
  build_relojoeiro: 'Relojoeiro', build_d_relojoeiro: 'Recargas pela metade e a habilidade começa pronta.',
  build_astronomo: 'Astrônomo', build_d_astronomo: 'Arcos 12 % maiores.',
  build_peregrino: 'Peregrino', build_d_peregrino: 'Passar 50 % dos arcos já vence a fase.',
  a_bld_muralha: 'Muralha', a_d_bld_muralha: 'Monte a build Muralha em uma partida',
  a_bld_ourives: 'Ourives', a_d_bld_ourives: 'Monte a build Ourives em uma partida',
  a_bld_fantasma: 'Fantasma', a_d_bld_fantasma: 'Monte a build Fantasma em uma partida',
  a_bld_relojoeiro: 'Relojoeiro', a_d_bld_relojoeiro: 'Monte a build Relojoeiro em uma partida',
  a_bld_astronomo: 'Astrônomo', a_d_bld_astronomo: 'Monte a build Astrônomo em uma partida',
  a_bld_peregrino: 'Peregrino', a_d_bld_peregrino: 'Monte a build Peregrino em uma partida'
});
Object.assign(HR.I18N.en, {
  perk_lantern: 'Lantern', perk_lantern_d: 'Fog and darkness reach 40% farther.',
  perk_anchor: 'Anchor', perk_anchor_d: 'Rings sway 30% less per level.',
  perk_gyro: 'Gyroscope', perk_gyro_d: 'Ring tilt and spin 35% smaller.',
  perk_warmup: 'Warm-up', perk_warmup_d: 'The first 10 rings of the level come 20% slower.',
  perk_patience: 'Patience', perk_patience_d: '12% more time between rings.',
  perk_softrim: 'Soft Rim', perk_softrim_d: 'Half the rim hits shatter the ring instead of hurting.',
  perk_guide: 'Guide', perk_guide_d: 'A faint line links the ball to the next ring center.',
  perk_treasure: 'Treasure', perk_treasure_d: 'Level completion reward 30% bigger.',
  perk_grace_star: 'Grace', perk_grace_star_d: 'One hit is forgiven when counting the 3rd star.',
  perk_overdrive: 'Overdrive', perk_overdrive_d: 'Above 80% flow, each ring gives +1 point and +1 coin.',
  perk_timelord: 'Time Lord', perk_timelord_d: 'Every 25 rings, the world stops for 1.5 s.',
  perk_sentry: 'Sentry', perk_sentry_d: 'Every 6 s, the nearest obstacle is destroyed.',
  perk_tithe: 'Tithe', perk_tithe_d: 'Each PERFECT gives +2 coins per level.',
  perk_cartographer: 'Cartographer', perk_cartographer_d: '+25% XP in this run.',
  perk_wayfinder: 'Wayfinder', perk_wayfinder_d: 'Each direction change gives 1.5 s of slow motion and 1 shield if you have none.',
  builds: 'Builds',
  build_muralha: 'Rampart', build_d_muralha: 'Shield cap +2 and +1 shield every 12 rings.',
  build_ourives: 'Goldsmith', build_d_ourives: 'Double end-of-run bonus.',
  build_fantasma: 'Phantom', build_d_fantasma: '1 s of Ghost after every PERFECT.',
  build_relojoeiro: 'Watchmaker', build_d_relojoeiro: 'Half cooldowns and the ability starts ready.',
  build_astronomo: 'Astronomer', build_d_astronomo: 'Rings 12% bigger.',
  build_peregrino: 'Pilgrim', build_d_peregrino: 'Passing 50% of the rings already clears the level.',
  a_bld_muralha: 'Rampart', a_d_bld_muralha: 'Complete the Rampart build in a run',
  a_bld_ourives: 'Goldsmith', a_d_bld_ourives: 'Complete the Goldsmith build in a run',
  a_bld_fantasma: 'Phantom', a_d_bld_fantasma: 'Complete the Phantom build in a run',
  a_bld_relojoeiro: 'Watchmaker', a_d_bld_relojoeiro: 'Complete the Watchmaker build in a run',
  a_bld_astronomo: 'Astronomer', a_d_bld_astronomo: 'Complete the Astronomer build in a run',
  a_bld_peregrino: 'Pilgrim', a_d_bld_peregrino: 'Complete the Pilgrim build in a run'
});
Object.assign(HR.I18N.es, {
  perk_lantern: 'Linterna', perk_lantern_d: 'La niebla y la oscuridad llegan un 40 % más lejos.',
  perk_anchor: 'Ancla', perk_anchor_d: 'Los aros oscilan un 30 % menos por nivel.',
  perk_gyro: 'Giroscopio', perk_gyro_d: 'Inclinación y giro de los aros un 35 % menores.',
  perk_warmup: 'Calentamiento', perk_warmup_d: 'Los 10 primeros aros del nivel vienen un 20 % más lentos.',
  perk_patience: 'Paciencia', perk_patience_d: 'Un 12 % más de tiempo entre aros.',
  perk_softrim: 'Borde Blando', perk_softrim_d: 'La mitad de los golpes en el borde rompen el aro en vez de herir.',
  perk_guide: 'Guía', perk_guide_d: 'Una línea tenue une la bola al centro del próximo aro.',
  perk_treasure: 'Tesoro', perk_treasure_d: 'Premio por completar el nivel un 30 % mayor.',
  perk_grace_star: 'Gracia', perk_grace_star_d: 'Un daño se perdona al contar la 3.ª estrella.',
  perk_overdrive: 'Sobremarcha', perk_overdrive_d: 'Con el flujo por encima del 80 %, cada aro da +1 punto y +1 moneda.',
  perk_timelord: 'Señor del Tiempo', perk_timelord_d: 'Cada 25 aros, el mundo se detiene 1,5 s.',
  perk_sentry: 'Centinela', perk_sentry_d: 'Cada 6 s se destruye el obstáculo más cercano.',
  perk_tithe: 'Diezmo', perk_tithe_d: 'Cada PERFECTO da +2 monedas por nivel.',
  perk_cartographer: 'Cartógrafo', perk_cartographer_d: '+25 % de XP en esta partida.',
  perk_wayfinder: 'Rumbo', perk_wayfinder_d: 'Cada cambio de dirección da 1,5 s de cámara lenta y 1 escudo si no tienes ninguno.',
  builds: 'Builds',
  build_muralha: 'Muralla', build_d_muralha: 'Límite de escudos +2 y +1 escudo cada 12 aros.',
  build_ourives: 'Orfebre', build_d_ourives: 'Bono de fin de partida doble.',
  build_fantasma: 'Fantasma', build_d_fantasma: '1 s de Fantasma después de cada PERFECTO.',
  build_relojoeiro: 'Relojero', build_d_relojoeiro: 'Recargas a la mitad y la habilidad empieza lista.',
  build_astronomo: 'Astrónomo', build_d_astronomo: 'Aros un 12 % más grandes.',
  build_peregrino: 'Peregrino', build_d_peregrino: 'Pasar el 50 % de los aros ya completa el nivel.',
  a_bld_muralha: 'Muralla', a_d_bld_muralha: 'Arma la build Muralla en una partida',
  a_bld_ourives: 'Orfebre', a_d_bld_ourives: 'Arma la build Orfebre en una partida',
  a_bld_fantasma: 'Fantasma', a_d_bld_fantasma: 'Arma la build Fantasma en una partida',
  a_bld_relojoeiro: 'Relojero', a_d_bld_relojoeiro: 'Arma la build Relojero en una partida',
  a_bld_astronomo: 'Astrónomo', a_d_bld_astronomo: 'Arma la build Astrónomo en una partida',
  a_bld_peregrino: 'Peregrino', a_d_bld_peregrino: 'Arma la build Peregrino en una partida'
});
