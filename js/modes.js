/* =====================================================================
   Galáxia: 10 regiões × 10 fases (a 10ª é o chefe) + Singularidade (infinito).
   As 100 fases são GERADAS por função determinística a partir das curvas de
   cada região (HR.REGIONS[i]) — ajuste as curvas, não 100 entradas.
   API: HR.Campaign (level, all, region, stars, isUnlocked, complete…)
   ===================================================================== */
window.HR = window.HR || {};

HR.MODES = ['endless', 'campaign', 'practice'];
HR.DIRS = ['right', 'top', 'left', 'bottom'];

// mech = mecânica principal (parâmetros gerados em gen()) · boss = chave em HR.BOSSES
// colors/shapes = fundo da região (substitui o tema equipado durante a fase)
HR.REGIONS = [
  { id: 'berco',      n: 1,  accent: '#4cf0ff', colors: ['#16305a', '#0d1a3a', '#070b1a'], shapes: 'orbs',    stars: true,  mech: 'basic',  boss: 'pulse',       music: 'r1',  reward: { skin: 'ice' } },
  { id: 'mare',       n: 2,  accent: '#5aa9ff', colors: ['#0b3c5d', '#07253d', '#03111f'], shapes: 'waves',   stars: true,  mech: 'osc',    boss: 'tide',        music: 'r2',  reward: { theme: 'ocean' }, fx: 'water' },
  { id: 'jardim',     n: 3,  accent: '#7cff6b', colors: ['#0f3d2e', '#0a2620', '#04120e'], shapes: 'bubbles', stars: false, mech: 'swarm',  boss: 'swarm',       music: 'r3',  reward: { trail: 'stars' } },
  { id: 'forja',      n: 4,  accent: '#ff9f43', colors: ['#4a1d0c', '#2b1008', '#120604'], shapes: 'orbs',    stars: true,  mech: 'shrink', boss: 'shrink',      music: 'r4',  reward: { skin: 'lava' }, fx: 'ember' },
  { id: 'nevoa',      n: 5,  accent: '#a29bfe', colors: ['#2a2450', '#181538', '#0a0818'], shapes: 'nebula',  stars: true,  mech: 'fog',    boss: 'blink',       music: 'r5',  reward: { skin: 'ghost' } },
  { id: 'cristal',    n: 6,  accent: '#ff7ad9', colors: ['#4a1a48', '#2c1030', '#140818'], shapes: 'orbs',    stars: true,  mech: 'spin',   boss: 'spin',        music: 'r6',  reward: { theme: 'candy' } },
  { id: 'tempestade', n: 7,  accent: '#ffd93d', colors: ['#3a3208', '#221d06', '#0f0d03'], shapes: 'grid',    stars: false, mech: 'storm',  boss: 'storm',       music: 'r7',  reward: { trail: 'fire' } },
  { id: 'abismo',     n: 8,  accent: '#5b6cff', colors: ['#0a0f2a', '#05081a', '#000000'], shapes: 'nebula',  stars: true,  mech: 'dark',   boss: 'eclipse',     music: 'r8',  reward: { theme: 'space' } },
  { id: 'vortice',    n: 9,  accent: '#ff5ecf', colors: ['#3d0d3a', '#240822', '#0f0410'], shapes: 'waves',   stars: true,  mech: 'vortex', boss: 'cyclone',     music: 'r9',  reward: { skin: 'galaxy' } },
  { id: 'horizonte',  n: 10, accent: '#ffcf4a', colors: ['#3a2c10', '#1f1808', '#0a0803'], shapes: 'orbs',    stars: true,  mech: 'hyper',  boss: 'singularity', music: 'r10', reward: { skin: 'eye' } }
];

// waves = ondas do chefe (a mecânica aperta a cada onda) · icon = js/icons.js
HR.BOSSES = {
  pulse:       { icon: 'pulse',   waves: 3 }, // arcos expandem e contraem
  tide:        { icon: 'wave',    waves: 3 }, // ondas sincronizadas + rajadas
  swarm:       { icon: 'layers',  waves: 3 }, // enxame: arcos em pares e trios
  shrink:      { icon: 'target',  waves: 3 }, // arcos encolhem ao se aproximar
  blink:       { icon: 'eye',     waves: 3 }, // invisíveis até chegar perto
  spin:        { icon: 'refresh', waves: 3 }, // giram sem parar
  storm:       { icon: 'tornado', waves: 3 }, // direção a cada 4 arcos + rajadas
  eclipse:     { icon: 'moon',    waves: 3 }, // a luz pulsa; arcos somem em ciclos
  cyclone:     { icon: 'wind',    waves: 3 }, // direção a cada 3 arcos + oscilação
  singularity: { icon: 'orbit',   waves: 5 }  // uma onda por chefe anterior + tudo junto
};

(function () {
  const lerp = (a, b, t) => a + (b - a) * t;
  const r2 = v => Math.round(v * 100) / 100;

  // direções da fase: pool da região, quantidade cresce com a fase, ordem determinística
  function dirsFor(R, ri, li, isBoss) {
    if (R.mech === 'basic') {
      if (li <= 5) return ['right'];
      if (li <= 7) return ['top'];
      return ['right', 'top'];
    }
    const pool = ri === 1 ? ['right', 'top', 'bottom'] : ['right', 'top', 'left', 'bottom'];
    const fixed = ri === 1 ? [['right'], ['top'], ['bottom'], ['right', 'bottom'], ['top', 'bottom'], ['bottom'], ['right', 'top', 'bottom'], ['top', 'right'], ['bottom', 'top']] : null;
    if (fixed && li < 9) return fixed[li];
    if (isBoss) return ri % 2 ? ['right', 'top', 'left', 'bottom'] : ['left', 'bottom', 'right', 'top'];
    const swaps = R.mech === 'storm' || R.mech === 'vortex' || R.mech === 'hyper';
    const count = swaps ? Math.min(4, 2 + Math.floor(li / 3)) : Math.min(pool.length, 1 + Math.floor(li / 3));
    const start = (ri * 3 + li * 2) % pool.length;
    const out = [];
    for (let i = 0; i < count; i++) out.push(pool[(start + i * (ri % 2 ? 1 : 3)) % pool.length]);
    return out;
  }

  function gen(R, ri, li) {
    const isBoss = li === 9;
    const g = (ri * 10 + li) / 99;                // progresso global 0..1
    const tier = Math.min(9, Math.floor(g * 9.99)); // 0..9 → curva de velocidade/tempo entre arcos
    let rings = isBoss ? (ri === 9 ? 60 : 32 + ri * 2) : Math.round(lerp(14 + ri * 2, 24 + ri * 2, li / 8));
    let speed = 0.90 + g * 0.52 + (isBoss ? 0.03 : 0);
    const P = {
      accent: R.accent, radius: 1 - g * 0.30, tiltVar: 0, osc: 0, oscF: 0, rot: 0, rotF: 0,
      yDelta: 180 + g * 240, tbMul: 1 - g * 0.18, coin: 0.45 + g * 0.10, dbl: 0,
      fog: 0, dark: 0, shrink: 0, sync: false, burst: 0,
      mix: 0.35 + g * 0.5, obs: ri >= HR.CONFIG.OBSTACLE.fromRegion ? 0.15 + g * 0.35 : 0, pick: (ri === 0 && li === 0) ? 0 : HR.CONFIG.PICKUP.chance
    };
    // mecânicas antigas "vazam" de leve para as regiões seguintes (variedade)
    if (ri >= 2) { P.osc = 22; P.oscF = 1.2; }
    if (ri >= 3) P.tiltVar = 0.18;
    if (ri >= 4) P.dbl = 0.08;
    if (ri >= 7) { P.rot = 0.22; P.rotF = 1.2; }
    switch (R.mech) {
      case 'basic':  P.tiltVar = li >= 5 ? 0.15 : 0; break;
      case 'osc':    P.osc = 40 + li * 8; P.oscF = 1.2 + li * 0.08; break;
      case 'swarm':  P.dbl = 0.2 + li * 0.05; P.tiltVar = 0.25; break;
      case 'shrink': P.shrink = 0.12 + li * 0.02; P.radius *= 0.96; break;
      case 'fog':    P.fog = 560 - li * 30; break;
      case 'spin':   P.rot = 0.35 + li * 0.04; P.rotF = 1.2 + li * 0.1; P.tiltVar = 0.3; break;
      case 'storm':  P.burst = 0.15 + li * 0.02; P.osc = 40; P.oscF = 1.4; P.tiltVar = 0.4; break;
      case 'dark':   P.dark = 420 - li * 18; P.yDelta += 80; break;
      case 'vortex': P.osc = 60; P.oscF = 1.8; P.rot = 0.5; P.rotF = 1.6; P.tiltVar = 0.55; break;
      case 'hyper':  P.radius *= 0.92; P.osc = 50; P.oscF = 1.6; P.rot = 0.4; P.rotF = 1.4; P.tiltVar = 0.6; P.fog = 700; P.tbMul *= 0.94; break;
    }
    let dirEvery = 0;
    if (R.mech === 'storm') dirEvery = isBoss ? 4 : 8 - Math.floor(li / 3);
    if (R.mech === 'vortex') dirEvery = isBoss ? 3 : 6 - Math.floor(li / 4);
    if (R.mech === 'hyper') dirEvery = isBoss ? 0 : 5 - Math.floor(li / 5);
    if (isBoss) { P.osc = Math.max(P.osc, 30); P.oscF = Math.max(P.oscF, 1.3); }
    const dirs = dirsFor(R, ri, li, isBoss);
    return {
      id: (ri + 1) + '-' + (li + 1), region: R.id, ri, li, rings, speed: r2(speed), tier, params: P, dirs, dirEvery,
      boss: isBoss ? R.boss : null, waves: isBoss ? HR.BOSSES[R.boss].waves : 0
    };
  }

  let cache = null;
  function all() {
    if (cache) return cache;
    cache = [];
    HR.REGIONS.forEach((R, ri) => { for (let li = 0; li < 10; li++) cache.push(gen(R, ri, li)); });
    return cache;
  }

  HR.Campaign = {
    all, gen,
    level(id) { return all().find(l => l.id === id) || null; },
    region(levelId) { const l = this.level(levelId); return l ? HR.REGIONS[l.ri] : null; },
    world(levelId) { return this.region(levelId); },
    regionIndex(levelId) { const l = this.level(levelId); return l ? l.ri : -1; },
    worldIndex(levelId) { return this.regionIndex(levelId); },
    levelIndex(levelId) { const l = this.level(levelId); return l ? l.li : -1; },
    levelsOf(ri) { return all().filter(l => l.ri === ri); },
    stars(id) { return (HR.Store.data.campaign.stars[id] || 0); },
    totalStars() { let n = 0; const s = HR.Store.data.campaign.stars; for (const k in s) n += s[k]; return n; },
    regionStars(ri) { let n = 0; this.levelsOf(ri).forEach(l => { n += this.stars(l.id); }); return n; },
    regionCleared(ri) { return this.levelsOf(ri).every(l => this.stars(l.id) > 0); },
    bossBeaten(ri) { return this.stars((ri + 1) + '-10') > 0; },
    levelsCleared() { let n = 0; const s = HR.Store.data.campaign.stars; for (const k in s) if (s[k] > 0) n++; return n; },
    regionsCleared() { let n = 0; HR.REGIONS.forEach((R, i) => { if (this.bossBeaten(i)) n++; }); return n; },
    prev(id) { const a = all(); const i = a.findIndex(l => l.id === id); return i > 0 ? a[i - 1] : null; },
    next(id) { const a = all(); const i = a.findIndex(l => l.id === id); return i >= 0 && i < a.length - 1 ? a[i + 1] : null; },
    // região abre ao vencer o chefe anterior OU com 60 % das estrelas da região anterior (18/30)
    isRegionUnlocked(ri) { return ri === 0 || this.bossBeaten(ri - 1) || this.regionStars(ri - 1) >= 18; },
    isUnlocked(id) {
      const l = this.level(id); if (!l) return false;
      if (!this.isRegionUnlocked(l.ri)) return false;
      if (l.li === 0) return true;
      return this.stars(l.ri + 1 + '-' + l.li) > 0;
    },
    regionState(ri) { return !this.isRegionUnlocked(ri) ? 'locked' : this.regionCleared(ri) ? 'done' : 'open'; },
    currentRegion() { for (let i = HR.REGIONS.length - 1; i >= 0; i--) if (this.isRegionUnlocked(i) && !this.regionCleared(i)) return i; return this.regionsCleared() >= 10 ? 9 : 0; },
    currentLevel() { const a = all(); return a.find(l => this.stars(l.id) === 0 && this.isUnlocked(l.id)) || a[a.length - 1]; },
    singularityMastered() { return this.bossBeaten(9); },
    passNeed(level) { return Math.ceil(level.rings * HR.CONFIG.RUN.passNeed); },
    computeStars(summary, level) {
      let s = 1;
      if (summary.perfects >= Math.ceil(level.rings * 0.4)) s++;
      if (summary.hits === 0 && !summary.misses && summary.coinsMissed === 0) s++;
      return s;
    },
    firstClearReward(level) { return { coins: 60 + level.ri * 40 + level.li * 12, gems: level.boss ? 20 + level.ri * 3 : 3 }; },
    // aplica resultado; retorna { stars, newStars, rewards:[{coins|gems|skin|trail|theme}], regionCleared, worldCleared }
    complete(level, summary) {
      const d = HR.Store.data, before = this.stars(level.id);
      const stars = this.computeStars(summary, level);
      const rewards = [];
      d.campaign.stars[level.id] = Math.max(before, stars);
      d.campaign.best[level.id] = Math.max(d.campaign.best[level.id] || 0, summary.perfects);
      if (before === 0) { const r = this.firstClearReward(level); rewards.push({ coins: r.coins }); rewards.push({ gems: r.gems }); HR.Economy.addCoins(r.coins, 'campaign'); HR.Economy.addGems(r.gems, 'campaign'); }
      else { const c = Math.round(this.firstClearReward(level).coins / 3); rewards.push({ coins: c }); HR.Economy.addCoins(c, 'campaign_repeat'); }
      if (stars === 3 && before < 3) { rewards.push({ gems: 5 }); HR.Economy.addGems(5, 'campaign_3stars'); }
      if (summary.hits === 0) d.stats.flawlessLevels = (d.stats.flawlessLevels || 0) + 1;
      let regionCleared = false;
      if (level.boss && before === 0) {
        const R = HR.REGIONS[level.ri], rw = R.reward; regionCleared = true;
        d.stats.bossesBeaten = (d.stats.bossesBeaten || 0) + 1;
        const give = (type, id) => { if (!d.owned[type].includes(id)) { d.owned[type].push(id); rewards.push({ [type.slice(0, -1)]: id }); } else { rewards.push({ gems: 50 }); HR.Economy.addGems(50, 'region_dup'); } };
        if (rw.skin) give('skins', rw.skin);
        if (rw.trail) give('trails', rw.trail);
        if (rw.theme) give('themes', rw.theme);
        if (level.ri === 9) { rewards.push({ gems: 200 }); HR.Economy.addGems(200, 'singularity'); }
      }
      d.stats.campaignClears++;
      d.stats.levelsCleared = this.levelsCleared();
      d.stats.regionsCleared = this.regionsCleared();
      d.stats.starsTotal = this.totalStars();
      HR.Store.save();
      HR.Analytics.log('level_complete', { id: level.id, stars, first: before === 0 });
      return { stars, newStars: Math.max(0, stars - before), rewards, regionCleared, worldCleared: regionCleared };
    }
  };
})();

/* ---------------- textos ---------------- */
Object.assign(HR.I18N.pt, {
  mode_endless: 'Infinito', mode_campaign: 'Galáxia', mode_practice: 'Treino',
  mode_endless_d: 'Sem fim. Farme pontos e moedas, suba no ranking.', mode_campaign_d: '10 regiões, 100 fases, 10 chefes.', mode_practice_d: 'Sem morte. Aprenda direções e habilidades.',
  region: 'Região', region_n: 'Região {n}', galaxy: 'Galáxia', singularity: 'Singularidade', singularity_d: 'O centro da galáxia. Vá até onde aguentar.', singularity_mastered: 'Singularidade dominada: +25 % moedas',
  reg_berco: 'Berço', reg_mare: 'Maré', reg_jardim: 'Jardim', reg_forja: 'Forja', reg_nevoa: 'Névoa', reg_cristal: 'Cristal', reg_tempestade: 'Tempestade', reg_abismo: 'Abismo', reg_vortice: 'Vórtice', reg_horizonte: 'Horizonte',
  reg_berco_t: 'Onde tudo começa', reg_mare_t: 'Os arcos sobem e descem', reg_jardim_t: 'Arcos em pares e trios', reg_forja_t: 'Menores e mais rápidos', reg_nevoa_t: 'Você só vê de perto',
  reg_cristal_t: 'Tudo gira', reg_tempestade_t: 'A direção não para', reg_abismo_t: 'A luz vai só até a bola', reg_vortice_t: 'Tudo ao mesmo tempo', reg_horizonte_t: 'A borda do buraco negro',
  reg_berco_d: 'Aprenda a flutuar. Na fase 7 os arcos passam a vir de cima.', reg_mare_d: 'Os arcos oscilam para cima e para baixo. Espere o momento certo.',
  reg_jardim_d: 'Arcos duplos e triplos aparecem colados. Mantenha a linha.', reg_forja_d: 'Os arcos encolhem enquanto se aproximam. Mire no centro cedo.',
  reg_nevoa_d: 'Uma névoa esconde os arcos até chegarem perto. Confie no ritmo.', reg_cristal_d: 'Os arcos giram e inclinam. Passe pelo eixo aberto.',
  reg_tempestade_d: 'A direção troca a cada poucos arcos e a velocidade vem em rajadas.', reg_abismo_d: 'Só se enxerga ao redor da bola. Os arcos saltam alto e baixo.',
  reg_vortice_d: 'Oscilação, rotação e trocas de direção — tudo junto.', reg_horizonte_d: 'Hipervelocidade e arcos mínimos. A última prova antes da Singularidade.',
  boss_pulse: 'Guardião Pulsante', boss_tide: 'Leviatã', boss_swarm: 'Colmeia', boss_shrink: 'Fornalha', boss_blink: 'Espectro', boss_spin: 'Prisma', boss_storm: 'Tempestade', boss_eclipse: 'Eclipse', boss_cyclone: 'Ciclone', boss_singularity: 'Singularidade',
  boss_pulse_d: 'Os arcos expandem e contraem. Entre no ritmo.', boss_tide_d: 'Todos os arcos sobem e descem juntos, com rajadas de velocidade.', boss_swarm_d: 'Um enxame: arcos em pares e trios, cada vez mais juntos.',
  boss_shrink_d: 'Os arcos encolhem quanto mais perto chegam. Decida cedo.', boss_blink_d: 'Os arcos só aparecem quando estão perto.', boss_spin_d: 'Os arcos giram sem parar. Passe pelo eixo aberto.',
  boss_storm_d: 'A direção muda a cada 4 arcos e a velocidade vem em rajadas.', boss_eclipse_d: 'A luz pulsa: os arcos somem e voltam em ciclos.', boss_cyclone_d: 'A direção muda a cada 3 arcos enquanto tudo oscila.',
  boss_singularity_d: 'Cinco ondas: pulso, invisibilidade, encolhimento, ciclone — e no fim, tudo junto no escuro.',
  level: 'Fase', level_n: 'Fase {n}', boss: 'CHEFE', wave: 'ONDA {n}', locked: 'Bloqueado', stars: 'Estrelas', rings_n: '{n} arcos',
  level_complete: 'FASE CONCLUÍDA', level_failed: 'FASE FALHOU', world_cleared: 'REGIÃO CONCLUÍDA!', next_level: 'PRÓXIMA FASE', retry: 'Repetir', levels: 'Fases',
  star_finish: 'Passar por 60 % dos arcos', star_perfects: '40 % de perfeitos', star_flawless: 'Sem dano, sem erros e todas as moedas', level_need: 'Passe por pelo menos {n} arcos ({p} de {t})', rewards: 'Recompensas', new_item: 'Novo item',
  direction_change: 'DIREÇÃO', dir_right: '←', dir_top: '↓', dir_left: '→', dir_bottom: '↑', practice_note: 'Treino: sem morte, metade das moedas, sem ranking.',
  life_lost: 'VIDA −1', second_chance_used: 'SEGUNDA CHANCE!', select_mode: 'Modo', play_mode: 'JOGAR', continue_campaign: 'Continuar: Fase {n}', world_progress: '{a}/{b} estrelas',
  region_locked_hint: 'Vença o chefe de {name} ou junte 18 estrelas lá', region_reward: 'Prêmio do chefe', region_music: 'Tema musical', region_mech: 'Mecânica', region_boss: 'Chefe da região',
  galaxy_sub: '{a}/{b} fases · {c} estrelas', tap_region: 'Toque numa região', enter_region: 'ENTRAR', play_endless: 'JOGAR INFINITO'
});
Object.assign(HR.I18N.en, {
  mode_endless: 'Endless', mode_campaign: 'Galaxy', mode_practice: 'Practice',
  mode_endless_d: 'No end. Farm score and coins, climb the ranking.', mode_campaign_d: '10 regions, 100 levels, 10 bosses.', mode_practice_d: 'No death. Learn directions and abilities.',
  region: 'Region', region_n: 'Region {n}', galaxy: 'Galaxy', singularity: 'Singularity', singularity_d: 'The galactic core. Go as far as you can.', singularity_mastered: 'Singularity mastered: +25% coins',
  reg_berco: 'Cradle', reg_mare: 'Tide', reg_jardim: 'Garden', reg_forja: 'Forge', reg_nevoa: 'Mist', reg_cristal: 'Crystal', reg_tempestade: 'Storm', reg_abismo: 'Abyss', reg_vortice: 'Vortex', reg_horizonte: 'Horizon',
  reg_berco_t: 'Where it all begins', reg_mare_t: 'Rings rise and fall', reg_jardim_t: 'Rings in pairs and triples', reg_forja_t: 'Smaller and faster', reg_nevoa_t: 'You only see up close',
  reg_cristal_t: 'Everything spins', reg_tempestade_t: 'Direction never rests', reg_abismo_t: 'Light reaches only the ball', reg_vortice_t: 'All at once', reg_horizonte_t: 'The edge of the black hole',
  reg_berco_d: 'Learn to float. From level 7 the rings come from the top.', reg_mare_d: 'Rings swing up and down. Wait for the right moment.',
  reg_jardim_d: 'Double and triple rings appear back to back. Hold your line.', reg_forja_d: 'Rings shrink as they approach. Aim at the center early.',
  reg_nevoa_d: 'A mist hides the rings until they are close. Trust the rhythm.', reg_cristal_d: 'Rings spin and tilt. Pass through the open axis.',
  reg_tempestade_d: 'Direction changes every few rings and speed comes in bursts.', reg_abismo_d: 'You only see around the ball. Rings jump high and low.',
  reg_vortice_d: 'Oscillation, rotation and direction changes — all together.', reg_horizonte_d: 'Hyper speed and minimal rings. The last trial before the Singularity.',
  boss_pulse: 'Pulsing Guardian', boss_tide: 'Leviathan', boss_swarm: 'Hive', boss_shrink: 'Furnace', boss_blink: 'Specter', boss_spin: 'Prism', boss_storm: 'Storm', boss_eclipse: 'Eclipse', boss_cyclone: 'Cyclone', boss_singularity: 'Singularity',
  boss_pulse_d: 'Rings expand and contract. Find the rhythm.', boss_tide_d: 'Every ring rises and falls together, with speed bursts.', boss_swarm_d: 'A hive: rings in pairs and triples, closer every wave.',
  boss_shrink_d: 'Rings shrink the closer they get. Decide early.', boss_blink_d: 'Rings only appear when close.', boss_spin_d: 'Rings spin without rest. Pass through the open axis.',
  boss_storm_d: 'Direction changes every 4 rings and speed comes in bursts.', boss_eclipse_d: 'The light pulses: rings vanish and return in cycles.', boss_cyclone_d: 'Direction changes every 3 rings while everything swings.',
  boss_singularity_d: 'Five waves: pulse, invisibility, shrinking, cyclone — and finally everything at once in the dark.',
  level: 'Level', level_n: 'Level {n}', boss: 'BOSS', wave: 'WAVE {n}', locked: 'Locked', stars: 'Stars', rings_n: '{n} rings',
  level_complete: 'LEVEL COMPLETE', level_failed: 'LEVEL FAILED', world_cleared: 'REGION CLEARED!', next_level: 'NEXT LEVEL', retry: 'Retry', levels: 'Levels',
  star_finish: 'Pass 60% of the rings', star_perfects: '40% perfects', star_flawless: 'No damage, no misses and all coins', level_need: 'Pass at least {n} rings ({p} of {t})', rewards: 'Rewards', new_item: 'New item',
  direction_change: 'DIRECTION', dir_right: '←', dir_top: '↓', dir_left: '→', dir_bottom: '↑', practice_note: 'Practice: no death, half coins, no ranking.',
  life_lost: 'LIFE −1', second_chance_used: 'SECOND CHANCE!', select_mode: 'Mode', play_mode: 'PLAY', continue_campaign: 'Continue: Level {n}', world_progress: '{a}/{b} stars',
  region_locked_hint: 'Beat the {name} boss or collect 18 stars there', region_reward: 'Boss reward', region_music: 'Music theme', region_mech: 'Mechanic', region_boss: 'Region boss',
  galaxy_sub: '{a}/{b} levels · {c} stars', tap_region: 'Tap a region', enter_region: 'ENTER', play_endless: 'PLAY ENDLESS'
});
Object.assign(HR.I18N.es, {
  mode_endless: 'Infinito', mode_campaign: 'Galaxia', mode_practice: 'Práctica',
  mode_endless_d: 'Sin fin. Farmea puntos y monedas, sube en el ranking.', mode_campaign_d: '10 regiones, 100 niveles, 10 jefes.', mode_practice_d: 'Sin muerte. Aprende direcciones y habilidades.',
  region: 'Región', region_n: 'Región {n}', galaxy: 'Galaxia', singularity: 'Singularidad', singularity_d: 'El centro de la galaxia. Llega hasta donde aguantes.', singularity_mastered: 'Singularidad dominada: +25 % monedas',
  reg_berco: 'Cuna', reg_mare: 'Marea', reg_jardim: 'Jardín', reg_forja: 'Forja', reg_nevoa: 'Niebla', reg_cristal: 'Cristal', reg_tempestade: 'Tormenta', reg_abismo: 'Abismo', reg_vortice: 'Vórtice', reg_horizonte: 'Horizonte',
  reg_berco_t: 'Donde todo empieza', reg_mare_t: 'Los aros suben y bajan', reg_jardim_t: 'Aros en pares y tríos', reg_forja_t: 'Más pequeños y rápidos', reg_nevoa_t: 'Solo ves de cerca',
  reg_cristal_t: 'Todo gira', reg_tempestade_t: 'La dirección no para', reg_abismo_t: 'La luz llega solo a la bola', reg_vortice_t: 'Todo a la vez', reg_horizonte_t: 'El borde del agujero negro',
  reg_berco_d: 'Aprende a flotar. Desde el nivel 7 los aros vienen de arriba.', reg_mare_d: 'Los aros oscilan arriba y abajo. Espera el momento justo.',
  reg_jardim_d: 'Aros dobles y triples aparecen pegados. Mantén la línea.', reg_forja_d: 'Los aros encogen al acercarse. Apunta al centro pronto.',
  reg_nevoa_d: 'Una niebla esconde los aros hasta que están cerca. Confía en el ritmo.', reg_cristal_d: 'Los aros giran e inclinan. Pasa por el eje abierto.',
  reg_tempestade_d: 'La dirección cambia cada pocos aros y la velocidad viene en ráfagas.', reg_abismo_d: 'Solo se ve alrededor de la bola. Los aros saltan alto y bajo.',
  reg_vortice_d: 'Oscilación, rotación y cambios de dirección, todo junto.', reg_horizonte_d: 'Hipervelocidad y aros mínimos. La última prueba antes de la Singularidad.',
  boss_pulse: 'Guardián Pulsante', boss_tide: 'Leviatán', boss_swarm: 'Colmena', boss_shrink: 'Horno', boss_blink: 'Espectro', boss_spin: 'Prisma', boss_storm: 'Tormenta', boss_eclipse: 'Eclipse', boss_cyclone: 'Ciclón', boss_singularity: 'Singularidad',
  boss_pulse_d: 'Los aros se expanden y contraen. Sigue el ritmo.', boss_tide_d: 'Todos los aros suben y bajan juntos, con ráfagas de velocidad.', boss_swarm_d: 'Una colmena: aros en pares y tríos, cada vez más juntos.',
  boss_shrink_d: 'Los aros encogen cuanto más cerca están. Decide pronto.', boss_blink_d: 'Los aros solo aparecen cuando están cerca.', boss_spin_d: 'Los aros giran sin parar. Pasa por el eje abierto.',
  boss_storm_d: 'La dirección cambia cada 4 aros y la velocidad viene en ráfagas.', boss_eclipse_d: 'La luz late: los aros desaparecen y vuelven en ciclos.', boss_cyclone_d: 'La dirección cambia cada 3 aros mientras todo oscila.',
  boss_singularity_d: 'Cinco olas: pulso, invisibilidad, encogimiento, ciclón, y al final todo junto a oscuras.',
  level: 'Nivel', level_n: 'Nivel {n}', boss: 'JEFE', wave: 'OLA {n}', locked: 'Bloqueado', stars: 'Estrellas', rings_n: '{n} aros',
  level_complete: 'NIVEL COMPLETADO', level_failed: 'NIVEL FALLIDO', world_cleared: '¡REGIÓN COMPLETADA!', next_level: 'SIGUIENTE NIVEL', retry: 'Repetir', levels: 'Niveles',
  star_finish: 'Pasar el 60 % de los aros', star_perfects: '40 % de perfectos', star_flawless: 'Sin daño, sin fallos y todas las monedas', level_need: 'Pasa al menos {n} aros ({p} de {t})', rewards: 'Recompensas', new_item: 'Nuevo objeto',
  direction_change: 'DIRECCIÓN', dir_right: '←', dir_top: '↓', dir_left: '→', dir_bottom: '↑', practice_note: 'Práctica: sin muerte, mitad de monedas, sin ranking.',
  life_lost: 'VIDA −1', second_chance_used: '¡SEGUNDA OPORTUNIDAD!', select_mode: 'Modo', play_mode: 'JUGAR', continue_campaign: 'Continuar: Nivel {n}', world_progress: '{a}/{b} estrellas',
  region_locked_hint: 'Vence al jefe de {name} o reúne 18 estrellas allí', region_reward: 'Premio del jefe', region_music: 'Tema musical', region_mech: 'Mecánica', region_boss: 'Jefe de la región',
  galaxy_sub: '{a}/{b} niveles · {c} estrellas', tap_region: 'Toca una región', enter_region: 'ENTRAR', play_endless: 'JUGAR INFINITO'
});
