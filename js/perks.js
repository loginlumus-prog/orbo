/* =====================================================================
   Habilidades ativas (botões com recarga) e Perks (roguelike por corrida).
   Dados + regras de modificadores da corrida. Textos registrados aqui mesmo.
   ===================================================================== */
window.HR = window.HR || {};

// icon = nome em js/icons.js
// v5: mecânica só com moedas (nada de gemas/dinheiro real em poder)
HR.ABILITIES = [
  { id: 'slowmo',      icon: 'hourglass',  color: '#4cf0ff', cd: 18, dur: 4,   unlock: { lvl: 1,  cur: 'coins', price: 0 } },
  { id: 'magnet',      icon: 'magnet',     color: '#ffcf4a', cd: 20, dur: 8,   unlock: { lvl: 1,  cur: 'coins', price: 500 } },
  { id: 'shieldpulse', icon: 'shieldPlus', color: '#35e29a', cd: 25, dur: 0,   unlock: { lvl: 2,  cur: 'coins', price: 700 } },
  { id: 'autopilot',   icon: 'pilot',      color: '#a29bfe', cd: 28, dur: 3.5, unlock: { lvl: 3,  cur: 'coins', price: 900 } },
  { id: 'ghost',       icon: 'ghost',      color: '#cfe9ff', cd: 24, dur: 3,   unlock: { lvl: 5,  cur: 'coins', price: 3000 } },
  { id: 'freeze',      icon: 'snow',       color: '#9be7ff', cd: 22, dur: 4,   unlock: { lvl: 7,  cur: 'coins', price: 3500 } },
  { id: 'pulse',       icon: 'shockwave',  color: '#ff9f43', cd: 20, dur: 0,   unlock: { lvl: 9,  cur: 'coins', price: 3800 } },
  { id: 'blackhole',   icon: 'blackhole',  color: '#a88bff', cd: 26, dur: 5,   unlock: { lvl: 10, cur: 'coins', price: 4500 } },
  { id: 'lens',        icon: 'lens',       color: '#7cff6b', cd: 26, dur: 5,   unlock: { lvl: 11, cur: 'coins', price: 4200 } },
  { id: 'prism',       icon: 'prism',      color: '#ff7ad9', cd: 24, dur: 5,   unlock: { lvl: 12, cur: 'coins', price: 5500 } },
  { id: 'echo',        icon: 'echo',       color: '#ff5ecf', cd: 30, dur: 6,   unlock: { lvl: 14, cur: 'coins', price: 5000 } },
  { id: 'phoenix',     icon: 'phoenix',    color: '#ff8a3d', cd: 45, dur: 8,   unlock: { lvl: 16, cur: 'coins', price: 7000 } },
  { id: 'goldrush',    icon: 'goldrush',   color: '#ffd24a', cd: 30, dur: 6,   unlock: { lvl: 18, cur: 'coins', price: 8000 } },
  { id: 'micro',       icon: 'micro',      color: '#9dff8a', cd: 22, dur: 5,   unlock: { lvl: 20, cur: 'coins', price: 9000 } },
  { id: 'comet',       icon: 'comet',      color: '#9be7ff', cd: 34, dur: 3,   unlock: { lvl: 23, cur: 'coins', price: 11000 } },
  { id: 'supernova',   icon: 'supernova',  color: '#ffe27a', cd: 38, dur: 0,   unlock: { lvl: 26, cur: 'coins', price: 13000 } },
  { id: 'chrono',      icon: 'chrono',     color: '#c3b8ff', cd: 32, dur: 1.6, unlock: { lvl: 30, cur: 'coins', price: 15000 } }
];
HR.ABILITY_UPGRADE = { maxLevel: 3, costs: [400, 900], cdPerLevel: 0.10, durPerLevel: 0.15, secondSlotLevel: 6 };

HR.RARITY = {
  common:    { w: 60, color: '#9aa6c9' },
  rare:      { w: 28, color: '#4cf0ff' },
  epic:      { w: 10, color: '#a29bfe' },
  legendary: { w: 2,  color: '#ffcf4a' },
  mythic:    { w: 0,  color: '#ff8a3d' }   // ascensão: só no infinito, a partir do arco 100 (CONFIG.ASCENSION)
};

// mods aditivos: ringRadius, scorePerRing, secondChance | multiplicativos: perfectZone, cdMul, durMul, speedMul, coinMul | set: magnet, reflex, streakShield, comboEvery, goldEvery
HR.PERKS = [
  { id: 'shield',       rarity: 'common',    max: 3, icon: 'shieldPlus', apply: run => { run.shields = Math.min(3, run.shields + 1); } },
  { id: 'bigrings',     rarity: 'common',    max: 3, icon: 'ringBig',  mods: { ringRadius: 0.08 } },
  { id: 'eagle',        rarity: 'common',    max: 2, icon: 'target',   mods: { perfectZone: 1.35 } },
  { id: 'fastcd',       rarity: 'common',    max: 3, icon: 'cooldown', mods: { cdMul: 0.8 } },
  { id: 'breath',       rarity: 'common',    max: 2, icon: 'wind',     mods: { durMul: 1.35 } },
  { id: 'calm',         rarity: 'common',    max: 2, icon: 'wave',     mods: { speedMul: 0.93 } },
  { id: 'magnet',       rarity: 'common',    max: 1, icon: 'magnet',   mods: { magnet: true } },
  { id: 'life',         rarity: 'rare',      max: 2, icon: 'heart',    apply: run => { run.lives++; } },
  { id: 'coinsx2',      rarity: 'rare',      max: 1, icon: 'coins',    mods: { coinMul: 2 } },
  { id: 'combo3',       rarity: 'rare',      max: 1, icon: 'flame',    mods: { comboEvery: 3 } },
  { id: 'reflex',       rarity: 'rare',      max: 1, icon: 'eye',      mods: { reflex: true } },
  // v8: 8 PERFEITOS seguidos = 0,01 % para o casual — nunca disparava. Agora conta acertos.
  { id: 'streakshield', rarity: 'rare',      max: 1, icon: 'link',     mods: { streakRun: 5 } },
  { id: 'greedy',       rarity: 'epic',      max: 1, icon: 'bag',      mods: { coinMul: 1.5, ringRadius: -0.10 } },
  // v8: ponto só vale no Infinito; na Galáxia o Arriscado não dava nada — agora dá moeda
  { id: 'risky',        rarity: 'epic',      max: 1, icon: 'dice',     mods: { ringRadius: -0.12, scorePerRing: 1, coinPerRing: 1 } },
  // v8: a cada 10 arcos eram ~10 moedas por fase; a cada 5 (e a moeda já escala por galáxia)
  { id: 'goldring',     rarity: 'epic',      max: 1, icon: 'goldRing', mods: { goldEvery: 5 } },
  { id: 'secondchance', rarity: 'legendary', max: 1, icon: 'undo',     mods: { secondChance: 1 } },
  // v4
  { id: 'scavenger',    rarity: 'common',    max: 2, icon: 'gift',     mods: { scavenger: 1 } },
  { id: 'hull',         rarity: 'common',    max: 2, icon: 'shieldHalf', mods: { hull: 1 } },
  { id: 'flowkeeper',   rarity: 'rare',      max: 1, icon: 'wind',     mods: { flowkeeper: true } },
  { id: 'lucky',        rarity: 'rare',      max: 1, icon: 'clover',   mods: { lucky: true } },
  { id: 'warpcore',     rarity: 'epic',      max: 1, icon: 'warp',     mods: { warpcore: true } },
  { id: 'tempo',        rarity: 'epic',      max: 1, icon: 'clock',    mods: { tempo: true } },
  // v5
  // v8: 8 % de bola = ~1 px de abertura a mais. 15 % já se sente.
  { id: 'microball',    rarity: 'common',    max: 2, icon: 'micro',    mods: { ballScale: 0.85 } },
  { id: 'magnetfield',  rarity: 'common',    max: 2, icon: 'magnet',   mods: { magnetRange: 1.4 } },
  { id: 'stardust',     rarity: 'common',    max: 3, icon: 'sparkles', mods: { coinChance: 0.06 } },
  { id: 'aegischarge',  rarity: 'rare',      max: 1, icon: 'aegis',    mods: { aegisCd: 0.6 } },
  { id: 'coinstorm',    rarity: 'rare',      max: 1, icon: 'bonanza',  mods: { bagMul: 2 } },
  { id: 'bulwark',      rarity: 'rare',      max: 1, icon: 'shield',   mods: { capBonus: 1 }, apply: run => { run.shields++; } },
  { id: 'afterburner',  rarity: 'rare',      max: 1, icon: 'jet',      mods: { noFlowSpeed: true } },
  { id: 'resonance',    rarity: 'epic',      max: 1, icon: 'shockwave', mods: { resonance: 0.5 } },
  { id: 'prismatic',    rarity: 'epic',      max: 1, icon: 'prism',    mods: { prismEvery: 5 } },
  // v8: 30 arcos sem dano na G8+ era zero. 15 arcos, e épico (lendário quase nunca aparecia)
  { id: 'guardianangel', rarity: 'epic',     max: 1, icon: 'light',   mods: { angel: 15 } },
  // ascensão (míticos): levam a build ao automático — ver docs/PLANO_V3.md v3.1
  { id: 'autoflow',     rarity: 'mythic',    max: 3, icon: 'pilot',    mods: { autoflow: 1 } },
  { id: 'regen',        rarity: 'mythic',    max: 3, icon: 'regen',    mods: { regen: 1 } },
  { id: 'intangible',   rarity: 'mythic',    max: 3, icon: 'ghost',    mods: { intangible: 1 } },
  { id: 'overclock',    rarity: 'mythic',    max: 3, icon: 'chip',     mods: { overclock: 1 } },
  { id: 'momentum',     rarity: 'mythic',    max: 3, icon: 'momentum', mods: { momentum: 1 } }
];

HR.Perks = {
  // v8: as três listas ficam abertas para que js/perks-v8.js registre chaves novas
  // sem reescrever recompute() (era um encadeado de === dentro do laço).
  BASE: { ringRadius: 0, perfectZone: 1, coinMul: 1, magnet: false, cdMul: 1, durMul: 1, comboEvery: 5, speedMul: 1, reflex: false, scorePerRing: 1, streakShield: false, goldEvery: 0, secondChance: 0, autoflow: 0, regen: 0, intangible: 0, overclock: 0, momentum: 0, scavenger: 0, hull: 0, flowkeeper: false, lucky: false, warpcore: false, tempo: false,
    ballScale: 1, magnetRange: 1, coinChance: 0, aegisCd: 1, bagMul: 1, capBonus: 0, noFlowSpeed: false, resonance: 0, prismEvery: 0, angel: 0, coinPerRing: 0 },
  ADD: ['ringRadius', 'scorePerRing', 'secondChance', 'autoflow', 'regen', 'intangible', 'overclock', 'momentum', 'scavenger', 'hull', 'coinChance', 'capBonus', 'resonance', 'coinPerRing'],
  MUL: ['perfectZone', 'cdMul', 'durMul', 'speedMul', 'coinMul', 'ballScale', 'magnetRange', 'aegisCd', 'bagMul'],
  baseMods() { return Object.assign({}, this.BASE); },
  def(id) { return HR.PERKS.find(p => p.id === id); },
  applyMods(m, mods, times) {
    for (let n = 0; n < (times || 1); n++) {
      for (const k in mods) {
        const v = mods[k];
        if (this.ADD.indexOf(k) >= 0) m[k] += v;
        else if (this.MUL.indexOf(k) >= 0) m[k] *= v;
        else m[k] = v;
      }
    }
    return m;
  },
  recompute(run) {
    const m = this.baseMods();
    for (const id in run.perks) {
      const p = this.def(id); if (!p || !p.mods) continue;
      this.applyMods(m, p.mods, run.perks[id]);
    }
    // v8: overclock 3 zerava a recarga (×0,1) e a corrida se jogava sozinha
    m.cdMul *= [1, 0.6, 0.4, 0.25][Math.min(3, m.overclock)];
    run.mods = m;
    return m;
  },
  offer(run, n) {
    n = n || 3;
    const A = HR.CONFIG.ASCENSION;
    const mythicOk = run.mode === 'endless' && run.ringsPassed >= A.fromRing;
    // v8: numa fase de 14–35 arcos o lendário quase nunca chegava a aparecer — arco 20
    const pool = HR.PERKS.filter(p => (run.perks[p.id] || 0) < p.max && (p.rarity !== 'legendary' || run.ringsPassed >= 20) && (p.rarity !== 'mythic' || mythicOk));
    const out = [];
    if (mythicOk && Math.random() < A.chance) { const my = pool.filter(p => p.rarity === 'mythic'); if (my.length) { const pick = my[Math.floor(Math.random() * my.length)]; out.push(pick); pool.splice(pool.indexOf(pick), 1); } }
    while (out.length < n && pool.length) {
      let total = 0; pool.forEach(p => { total += HR.RARITY[p.rarity].w; });
      let r = Math.random() * total, pick = pool[0];
      for (const p of pool) { r -= HR.RARITY[p.rarity].w; if (r <= 0) { pick = p; break; } }
      out.push(pick); pool.splice(pool.indexOf(pick), 1);
    }
    return out;
  },
  // escolha automática: prefere subir um perk que já tem; senão o mais raro da oferta
  autoPick(run) {
    const offers = this.offer(run, 3); if (!offers.length) return null;
    const owned = offers.filter(p => run.perks[p.id]);
    if (owned.length) return owned[Math.floor(Math.random() * owned.length)].id;
    const order = ['mythic', 'legendary', 'epic', 'rare', 'common'];
    offers.sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity));
    return offers[0].id;
  },
  take(run, id) {
    const p = this.def(id); if (!p) return;
    run.perks[id] = (run.perks[id] || 0) + 1;
    if (p.apply) p.apply(run);
    this.recompute(run);
    HR.Analytics.log('perk_take', { id, rings: run.ringsPassed });
  },
  name(id) { return HR.t('perk_' + id); },
  desc(id) { return HR.t('perk_' + id + '_d'); }
};

HR.Abilities = {
  def(id) { return HR.ABILITIES.find(a => a.id === id); },
  data() { return HR.Store.data.abilities; },
  owned(id) { return this.data().owned.includes(id); },
  level(id) { return this.data().levels[id] || 1; },
  slots() { return HR.Store.data.level >= HR.ABILITY_UPGRADE.secondSlotLevel ? 2 : 1; },
  equipped() { const e = this.data().equipped.slice(0, this.slots()); while (e.length < this.slots()) e.push(null); return e; },
  equip(slot, id) {
    const d = this.data();
    if (id && !this.owned(id)) return false;
    const other = slot === 0 ? 1 : 0;
    if (id && d.equipped[other] === id) d.equipped[other] = null;
    d.equipped[slot] = id; HR.Store.save();
    HR.Analytics.log('ability_equip', { slot, id });
    return true;
  },
  canUnlock(id) { const a = this.def(id); return HR.Store.data.level >= a.unlock.lvl; },
  buy(id) {
    const a = this.def(id); if (!a || this.owned(id) || !this.canUnlock(id)) return false;
    const ok = a.unlock.price === 0 ? true : (a.unlock.cur === 'gems' ? HR.Economy.spendGems(a.unlock.price, 'ability_' + id) : HR.Economy.spendCoins(a.unlock.price, 'ability_' + id));
    if (!ok) return false;
    const d = this.data(); d.owned.push(id);
    const slot = d.equipped.findIndex((x, i) => !x && i < this.slots());
    if (slot >= 0) d.equipped[slot] = id;
    HR.Store.save(); HR.Audio.sfx('buy'); HR.Analytics.log('ability_buy', { id });
    return true;
  },
  upgradeCost(id) { const lv = this.level(id); return lv >= HR.ABILITY_UPGRADE.maxLevel ? null : HR.ABILITY_UPGRADE.costs[lv - 1]; },
  upgrade(id) {
    const cost = this.upgradeCost(id); if (cost == null || !this.owned(id)) return false;
    if (!HR.Economy.spendCoins(cost, 'ability_up_' + id)) return false;
    this.data().levels[id] = this.level(id) + 1; HR.Store.save(); HR.Audio.sfx('levelup');
    HR.Analytics.log('ability_upgrade', { id, level: this.level(id) });
    return true;
  },
  cooldown(id, run) { const a = this.def(id); return a.cd * (1 - HR.ABILITY_UPGRADE.cdPerLevel * (this.level(id) - 1)) * (run ? run.mods.cdMul : 1); },
  duration(id, run) { const a = this.def(id); return a.dur * (1 + HR.ABILITY_UPGRADE.durPerLevel * (this.level(id) - 1)) * (run ? run.mods.durMul : 1); },
  name(id) { return HR.t('ab_' + id); },
  desc(id) { return HR.t('ab_' + id + '_d'); }
};

/* ---------------- textos ---------------- */
Object.assign(HR.I18N.pt, {
  ab_slowmo: 'Câmera Lenta', ab_slowmo_d: 'O tempo desacelera para 45 % por alguns segundos.',
  ab_magnet: 'Ímã Turbo', ab_magnet_d: 'Atrai todas as moedas e dobra o valor delas enquanto dura.',
  ab_shieldpulse: 'Pulso de Escudo', ab_shieldpulse_d: 'Ganha um escudo na hora (máximo 3).',
  ab_autopilot: 'Piloto Automático', ab_autopilot_d: 'A bola segue sozinha o centro dos arcos.',
  ab_ghost: 'Fantasma', ab_ghost_d: 'Atravessa a borda dos arcos sem morrer.',
  ab_freeze: 'Congelar', ab_freeze_d: 'Os arcos param de oscilar e girar.',
  ab_pulse: 'Pulso', ab_pulse_d: 'Onda de choque: destrói obstáculos e tiros por perto e puxa todos os itens.',
  ab_lens: 'Lente', ab_lens_d: 'Os arcos ficam 40 % maiores por alguns segundos.',
  ab_echo: 'Eco', ab_echo_d: 'Pontos e moedas em dobro enquanto dura.',
  perk_scavenger: 'Catador', perk_scavenger_d: 'Cada item pego dá +5 moedas por nível.',
  perk_hull: 'Casco', perk_hull_d: 'Obstáculos e tiros 20 % menores por nível.',
  perk_flowkeeper: 'Guardião do Fluxo', perk_flowkeeper_d: 'Ao quebrar o ritmo, o fluxo cai pela metade em vez de zerar.',
  perk_lucky: 'Sortudo', perk_lucky_d: 'Gemas aparecem 3 vezes mais entre os itens.',
  perk_warpcore: 'Núcleo de Dobra', perk_warpcore_d: 'Prêmios de evento em dobro e a Dobra dura 50 % mais.',
  perk_tempo: 'Tempo', perk_tempo_d: 'Zona de PERFEITO 20 % maior enquanto o fluxo está alto.',
  ability: 'Habilidade', abilities: 'Habilidades', ability_slot_empty: 'Escolher habilidade', slot_locked_lvl: 'Slot 2 no nível {n}', cooldown: 'Recarga', duration: 'Duração', instant: 'Instantâneo',
  upgrade: 'Melhorar', max_level: 'Nível máximo', ab_level: 'Nível {n}', unlock_at: 'Nível {n}', equipped_slot: 'Equipada', tap_to_use: 'Toque para usar', ready: 'PRONTO',
  perk_shield: 'Escudo', perk_shield_d: '+1 escudo. Absorve um erro.',
  perk_bigrings: 'Anéis Maiores', perk_bigrings_d: 'Arcos 8 % maiores.',
  perk_eagle: 'Olho de Águia', perk_eagle_d: 'Zona de PERFEITO 35 % maior.',
  perk_fastcd: 'Recarga Rápida', perk_fastcd_d: 'Habilidades recarregam 20 % mais rápido.',
  perk_breath: 'Fôlego', perk_breath_d: 'Habilidades duram 35 % mais.',
  perk_calm: 'Calmaria', perk_calm_d: 'Velocidade 7 % menor.',
  perk_magnet: 'Ímã', perk_magnet_d: 'Toda moeda dos arcos é atraída.',
  perk_life: 'Vida Extra', perk_life_d: 'Ao morrer, continua automaticamente.',
  perk_coinsx2: 'Moedas Duplas', perk_coinsx2_d: 'Todas as moedas valem o dobro.',
  perk_combo3: 'Combo Curto', perk_combo3_d: 'Bônus de combo a cada 3 perfeitos em vez de 5.',
  perk_reflex: 'Reflexo', perk_reflex_d: 'Câmera lenta automática ao chegar perto da borda.',
  perk_streakshield: 'Escudo de Sequência', perk_streakshield_d: 'A cada 5 acertos seguidos, +1 escudo.',
  perk_greedy: 'Ganancioso', perk_greedy_d: '+50 % moedas, mas arcos 10 % menores.',
  perk_risky: 'Arriscado', perk_risky_d: 'Arcos 12 % menores, mas cada arco vale 2 pontos e +1 moeda.',
  perk_goldring: 'Anel Dourado', perk_goldring_d: 'A cada 5º arco, +5 moedas.',
  perk_secondchance: 'Segunda Chance', perk_secondchance_d: 'Uma vez por corrida, o erro é desfeito.',
  perk_autoflow: 'Fluxo', perk_autoflow_d: 'Piloto automático em pulsos; no nível 3, permanente.',
  perk_regen: 'Regeneração', perk_regen_d: '+1 escudo a cada 12/8/5 arcos e o limite de escudos sobe.',
  perk_intangible: 'Intangível', perk_intangible_d: 'Fantasma 40 % do tempo → 70 % → permanente.',
  perk_overclock: 'Overclock', perk_overclock_d: 'Habilidades recarregam 40 % / 60 % / 75 % mais rápido.',
  perk_momentum: 'Momento', perk_momentum_d: '+1 ponto por arco por nível.',
  ab_blackhole: 'Buraco Negro', ab_blackhole_d: 'Um mini buraco negro engole os obstáculos por perto e puxa moedas e itens de longe.',
  ab_prism: 'Prisma', ab_prism_d: 'A zona de PERFEITO fica 3 vezes maior por alguns segundos.',
  ab_phoenix: 'Fênix', ab_phoenix_d: 'Se você morrer enquanto dura, renasce na hora e fica invencível por um instante.',
  ab_goldrush: 'Febre do Ouro', ab_goldrush_d: 'Todos os arcos viram anéis dourados: +5 moedas cada.',
  ab_micro: 'Micro', ab_micro_d: 'A bola fica 40 % menor e passa por arcos apertados.',
  ab_comet: 'Cometa', ab_comet_d: 'Dispara invencível em alta velocidade, despedaçando as bordas.',
  ab_supernova: 'Supernova', ab_supernova_d: 'Explosão: os 3 próximos arcos contam como PERFEITOS e os obstáculos somem.',
  ab_chrono: 'Cronos', ab_chrono_d: 'O mundo quase para por um instante; só a bola se move.',
  perk_microball: 'Compacta', perk_microball_d: 'Bola 15 % menor por nível.',
  perk_magnetfield: 'Campo Magnético', perk_magnetfield_d: 'Alcance de atração de itens 40 % maior por nível.',
  perk_stardust: 'Poeira Estelar', perk_stardust_d: '+6 % de chance de moeda em cada arco por nível.',
  perk_aegischarge: 'Égide Rápida', perk_aegischarge_d: 'A Égide recarrega 40 % mais rápido.',
  perk_coinstorm: 'Chuva de Moedas', perk_coinstorm_d: 'Sacos de moedas valem o dobro.',
  perk_bulwark: 'Baluarte', perk_bulwark_d: '+1 escudo agora e +1 no limite de escudos.',
  perk_afterburner: 'Pós-combustão', perk_afterburner_d: 'A sequência não acelera os arcos: o ritmo fica sempre calmo.',
  perk_resonance: 'Ressonância', perk_resonance_d: 'Cada PERFEITO tira 0,5 s da recarga das habilidades.',
  perk_prismatic: 'Prismático', perk_prismatic_d: 'A cada 5 arcos, um conta como PERFEITO se você passar por ele.',
  perk_guardianangel: 'Anjo da Guarda', perk_guardianangel_d: 'A cada 15 arcos sem dano, +1 escudo.',
  perk_title: 'ESCOLHA UM PODER', perk_sub: 'Arco {n} · monte sua build', perk_reroll: 'Trocar opções', perk_skip: 'Pular (+15 moedas)', perk_taken: 'Nível {n}/{max}', build: 'Build',
  perk_auto: 'Escolha automática', perk_auto_d: 'Os próximos perks são escolhidos sozinhos, sem pausar.', perk_auto_on: 'Perk automático', perk_auto_toast: 'Perk automático: {name}',
  rarity_common: 'Comum', rarity_rare: 'Raro', rarity_epic: 'Épico', rarity_legendary: 'Lendário', rarity_mythic: 'Mítico'
});
Object.assign(HR.I18N.en, {
  ab_slowmo: 'Slow Motion', ab_slowmo_d: 'Time slows to 45% for a few seconds.',
  ab_magnet: 'Turbo Magnet', ab_magnet_d: 'Pulls every coin and doubles their value while active.',
  ab_shieldpulse: 'Shield Pulse', ab_shieldpulse_d: 'Gain a shield instantly (max 3).',
  ab_autopilot: 'Autopilot', ab_autopilot_d: 'The ball follows the ring centers by itself.',
  ab_ghost: 'Ghost', ab_ghost_d: 'Pass through ring rims without dying.',
  ab_freeze: 'Freeze', ab_freeze_d: 'Rings stop oscillating and spinning.',
  ab_pulse: 'Pulse', ab_pulse_d: 'Shockwave: destroys nearby obstacles and shots and pulls every item.',
  ab_lens: 'Lens', ab_lens_d: 'Rings are 40% bigger for a few seconds.',
  ab_echo: 'Echo', ab_echo_d: 'Double score and coins while it lasts.',
  perk_scavenger: 'Scavenger', perk_scavenger_d: 'Each item grabbed gives +5 coins per level.',
  perk_hull: 'Hull', perk_hull_d: 'Obstacles and shots 20% smaller per level.',
  perk_flowkeeper: 'Flow Keeper', perk_flowkeeper_d: 'When the rhythm breaks, flow halves instead of resetting.',
  perk_lucky: 'Lucky', perk_lucky_d: 'Gems show up 3 times more among items.',
  perk_warpcore: 'Warp Core', perk_warpcore_d: 'Double event rewards and Warp lasts 50% longer.',
  perk_tempo: 'Tempo', perk_tempo_d: 'PERFECT zone 20% bigger while flow is high.',
  ability: 'Ability', abilities: 'Abilities', ability_slot_empty: 'Choose ability', slot_locked_lvl: 'Slot 2 at level {n}', cooldown: 'Cooldown', duration: 'Duration', instant: 'Instant',
  upgrade: 'Upgrade', max_level: 'Max level', ab_level: 'Level {n}', unlock_at: 'Level {n}', equipped_slot: 'Equipped', tap_to_use: 'Tap to use', ready: 'READY',
  perk_shield: 'Shield', perk_shield_d: '+1 shield. Absorbs one mistake.',
  perk_bigrings: 'Bigger Rings', perk_bigrings_d: 'Rings 8% larger.',
  perk_eagle: 'Eagle Eye', perk_eagle_d: 'PERFECT zone 35% larger.',
  perk_fastcd: 'Quick Recharge', perk_fastcd_d: 'Abilities recharge 20% faster.',
  perk_breath: 'Deep Breath', perk_breath_d: 'Abilities last 35% longer.',
  perk_calm: 'Calm Waters', perk_calm_d: '7% lower speed.',
  perk_magnet: 'Magnet', perk_magnet_d: 'Every ring coin is pulled in.',
  perk_life: 'Extra Life', perk_life_d: 'On death, continue automatically.',
  perk_coinsx2: 'Double Coins', perk_coinsx2_d: 'All coins are worth double.',
  perk_combo3: 'Short Combo', perk_combo3_d: 'Combo bonus every 3 perfects instead of 5.',
  perk_reflex: 'Reflex', perk_reflex_d: 'Automatic slow motion when close to a rim.',
  perk_streakshield: 'Streak Shield', perk_streakshield_d: 'Every 5 rings in a row, +1 shield.',
  perk_greedy: 'Greedy', perk_greedy_d: '+50% coins, but rings 10% smaller.',
  perk_risky: 'Risky', perk_risky_d: 'Rings 12% smaller, but each ring scores 2 and gives +1 coin.',
  perk_goldring: 'Golden Ring', perk_goldring_d: 'Every 5th ring gives +5 coins.',
  perk_secondchance: 'Second Chance', perk_secondchance_d: 'Once per run, a mistake is undone.',
  perk_autoflow: 'Flow', perk_autoflow_d: 'Autopilot in pulses; permanent at level 3.',
  perk_regen: 'Regeneration', perk_regen_d: '+1 shield every 12/8/5 rings and the shield cap rises.',
  perk_intangible: 'Intangible', perk_intangible_d: 'Ghost 40% of the time → 70% → permanent.',
  perk_overclock: 'Overclock', perk_overclock_d: 'Abilities recharge 40% / 60% / 75% faster.',
  perk_momentum: 'Momentum', perk_momentum_d: '+1 point per ring per level.',
  ab_blackhole: 'Black Hole', ab_blackhole_d: 'A mini black hole swallows nearby obstacles and pulls coins and items from far away.',
  ab_prism: 'Prism', ab_prism_d: 'The PERFECT zone gets 3 times bigger for a few seconds.',
  ab_phoenix: 'Phoenix', ab_phoenix_d: 'If you die while it lasts, you are reborn on the spot and briefly invincible.',
  ab_goldrush: 'Gold Rush', ab_goldrush_d: 'Every ring turns into a golden ring: +5 coins each.',
  ab_micro: 'Micro', ab_micro_d: 'The ball shrinks by 40% and slips through tight rings.',
  ab_comet: 'Comet', ab_comet_d: 'Blast forward invincible at high speed, shattering rims.',
  ab_supernova: 'Supernova', ab_supernova_d: 'Explosion: the next 3 rings count as PERFECT and obstacles vanish.',
  ab_chrono: 'Chronos', ab_chrono_d: 'The world almost stops for a moment; only the ball moves.',
  perk_microball: 'Compact', perk_microball_d: 'Ball 15% smaller per level.',
  perk_magnetfield: 'Magnetic Field', perk_magnetfield_d: 'Item pull range 40% bigger per level.',
  perk_stardust: 'Stardust', perk_stardust_d: '+6% coin chance on every ring per level.',
  perk_aegischarge: 'Quick Aegis', perk_aegischarge_d: 'The Aegis recharges 40% faster.',
  perk_coinstorm: 'Coin Shower', perk_coinstorm_d: 'Coin bags are worth double.',
  perk_bulwark: 'Bulwark', perk_bulwark_d: '+1 shield now and +1 shield cap.',
  perk_afterburner: 'Afterburner', perk_afterburner_d: 'Streaks no longer speed up rings: the rhythm stays calm.',
  perk_resonance: 'Resonance', perk_resonance_d: 'Each PERFECT takes 0.5 s off ability cooldowns.',
  perk_prismatic: 'Prismatic', perk_prismatic_d: 'Every 5th ring counts as PERFECT if you pass it.',
  perk_guardianangel: 'Guardian Angel', perk_guardianangel_d: 'Every 15 rings without damage, +1 shield.',
  perk_title: 'PICK A POWER', perk_sub: 'Ring {n} · build your run', perk_reroll: 'Reroll', perk_skip: 'Skip (+15 coins)', perk_taken: 'Level {n}/{max}', build: 'Build',
  perk_auto: 'Auto pick', perk_auto_d: 'Next perks are chosen automatically, without pausing.', perk_auto_on: 'Auto perk', perk_auto_toast: 'Auto perk: {name}',
  rarity_common: 'Common', rarity_rare: 'Rare', rarity_epic: 'Epic', rarity_legendary: 'Legendary', rarity_mythic: 'Mythic'
});
Object.assign(HR.I18N.es, {
  ab_slowmo: 'Cámara Lenta', ab_slowmo_d: 'El tiempo baja al 45 % durante unos segundos.',
  ab_magnet: 'Imán Turbo', ab_magnet_d: 'Atrae todas las monedas y duplica su valor mientras dura.',
  ab_shieldpulse: 'Pulso de Escudo', ab_shieldpulse_d: 'Gana un escudo al instante (máximo 3).',
  ab_autopilot: 'Piloto Automático', ab_autopilot_d: 'La bola sigue sola el centro de los aros.',
  ab_ghost: 'Fantasma', ab_ghost_d: 'Atraviesa el borde de los aros sin morir.',
  ab_freeze: 'Congelar', ab_freeze_d: 'Los aros dejan de oscilar y girar.',
  ab_pulse: 'Pulso', ab_pulse_d: 'Onda de choque: destruye obstáculos y disparos cercanos y atrae todos los objetos.',
  ab_lens: 'Lente', ab_lens_d: 'Los aros son un 40 % más grandes por unos segundos.',
  ab_echo: 'Eco', ab_echo_d: 'Puntos y monedas dobles mientras dura.',
  perk_scavenger: 'Recolector', perk_scavenger_d: 'Cada objeto recogido da +5 monedas por nivel.',
  perk_hull: 'Casco', perk_hull_d: 'Obstáculos y disparos un 20 % más pequeños por nivel.',
  perk_flowkeeper: 'Guardián del Flujo', perk_flowkeeper_d: 'Al romper el ritmo, el flujo baja a la mitad en vez de a cero.',
  perk_lucky: 'Suertudo', perk_lucky_d: 'Las gemas aparecen 3 veces más entre los objetos.',
  perk_warpcore: 'Núcleo de Salto', perk_warpcore_d: 'Premios de evento dobles y el Salto dura un 50 % más.',
  perk_tempo: 'Tempo', perk_tempo_d: 'Zona de PERFECTO un 20 % mayor mientras el flujo está alto.',
  ability: 'Habilidad', abilities: 'Habilidades', ability_slot_empty: 'Elegir habilidad', slot_locked_lvl: 'Ranura 2 en nivel {n}', cooldown: 'Recarga', duration: 'Duración', instant: 'Instantáneo',
  upgrade: 'Mejorar', max_level: 'Nivel máximo', ab_level: 'Nivel {n}', unlock_at: 'Nivel {n}', equipped_slot: 'Equipada', tap_to_use: 'Toca para usar', ready: 'LISTO',
  perk_shield: 'Escudo', perk_shield_d: '+1 escudo. Absorbe un error.',
  perk_bigrings: 'Aros Grandes', perk_bigrings_d: 'Aros un 8 % más grandes.',
  perk_eagle: 'Ojo de Águila', perk_eagle_d: 'Zona de PERFECTO un 35 % mayor.',
  perk_fastcd: 'Recarga Rápida', perk_fastcd_d: 'Las habilidades recargan un 20 % más rápido.',
  perk_breath: 'Aliento', perk_breath_d: 'Las habilidades duran un 35 % más.',
  perk_calm: 'Calma', perk_calm_d: 'Velocidad un 7 % menor.',
  perk_magnet: 'Imán', perk_magnet_d: 'Todas las monedas de los aros se atraen.',
  perk_life: 'Vida Extra', perk_life_d: 'Al morir, continúa automáticamente.',
  perk_coinsx2: 'Monedas Dobles', perk_coinsx2_d: 'Todas las monedas valen el doble.',
  perk_combo3: 'Combo Corto', perk_combo3_d: 'Bono de combo cada 3 perfectos en vez de 5.',
  perk_reflex: 'Reflejo', perk_reflex_d: 'Cámara lenta automática cerca del borde.',
  perk_streakshield: 'Escudo de Racha', perk_streakshield_d: 'Cada 5 aciertos seguidos, +1 escudo.',
  perk_greedy: 'Codicioso', perk_greedy_d: '+50 % monedas, pero aros un 10 % más pequeños.',
  perk_risky: 'Arriesgado', perk_risky_d: 'Aros un 12 % más pequeños, pero cada aro vale 2 puntos y +1 moneda.',
  perk_goldring: 'Aro Dorado', perk_goldring_d: 'Cada 5.º aro da +5 monedas.',
  perk_secondchance: 'Segunda Oportunidad', perk_secondchance_d: 'Una vez por partida, el error se deshace.',
  perk_autoflow: 'Flujo', perk_autoflow_d: 'Piloto automático en pulsos; permanente en nivel 3.',
  perk_regen: 'Regeneración', perk_regen_d: '+1 escudo cada 12/8/5 aros y sube el límite de escudos.',
  perk_intangible: 'Intangible', perk_intangible_d: 'Fantasma el 40 % del tiempo → 70 % → permanente.',
  perk_overclock: 'Overclock', perk_overclock_d: 'Las habilidades recargan un 40 % / 60 % / 75 % más rápido.',
  perk_momentum: 'Impulso', perk_momentum_d: '+1 punto por aro por nivel.',
  ab_blackhole: 'Agujero Negro', ab_blackhole_d: 'Un mini agujero negro se traga los obstáculos cercanos y atrae monedas y objetos desde lejos.',
  ab_prism: 'Prisma', ab_prism_d: 'La zona de PERFECTO se hace 3 veces más grande por unos segundos.',
  ab_phoenix: 'Fénix', ab_phoenix_d: 'Si mueres mientras dura, renaces al instante y eres invencible un momento.',
  ab_goldrush: 'Fiebre del Oro', ab_goldrush_d: 'Todos los aros se vuelven dorados: +5 monedas cada uno.',
  ab_micro: 'Micro', ab_micro_d: 'La bola se hace un 40 % más pequeña y pasa por aros estrechos.',
  ab_comet: 'Cometa', ab_comet_d: 'Sales disparado, invencible y a gran velocidad, rompiendo los bordes.',
  ab_supernova: 'Supernova', ab_supernova_d: 'Explosión: los 3 próximos aros cuentan como PERFECTOS y los obstáculos desaparecen.',
  ab_chrono: 'Cronos', ab_chrono_d: 'El mundo casi se detiene un instante; solo la bola se mueve.',
  perk_microball: 'Compacta', perk_microball_d: 'Bola un 15 % más pequeña por nivel.',
  perk_magnetfield: 'Campo Magnético', perk_magnetfield_d: 'Alcance de atracción de objetos un 40 % mayor por nivel.',
  perk_stardust: 'Polvo Estelar', perk_stardust_d: '+6 % de probabilidad de moneda en cada aro por nivel.',
  perk_aegischarge: 'Égida Rápida', perk_aegischarge_d: 'La Égida recarga un 40 % más rápido.',
  perk_coinstorm: 'Lluvia de Monedas', perk_coinstorm_d: 'Las bolsas de monedas valen el doble.',
  perk_bulwark: 'Baluarte', perk_bulwark_d: '+1 escudo ahora y +1 al límite de escudos.',
  perk_afterburner: 'Postcombustión', perk_afterburner_d: 'Las rachas ya no aceleran los aros: el ritmo queda tranquilo.',
  perk_resonance: 'Resonancia', perk_resonance_d: 'Cada PERFECTO quita 0,5 s a la recarga de las habilidades.',
  perk_prismatic: 'Prismático', perk_prismatic_d: 'Cada 5 aros, uno cuenta como PERFECTO si lo pasas.',
  perk_guardianangel: 'Ángel Guardián', perk_guardianangel_d: 'Cada 15 aros sin daño, +1 escudo.',
  perk_title: 'ELIGE UN PODER', perk_sub: 'Aro {n} · arma tu build', perk_reroll: 'Cambiar opciones', perk_skip: 'Saltar (+15 monedas)', perk_taken: 'Nivel {n}/{max}', build: 'Build',
  perk_auto: 'Elección automática', perk_auto_d: 'Los próximos perks se eligen solos, sin pausar.', perk_auto_on: 'Perk automático', perk_auto_toast: 'Perk automático: {name}',
  rarity_common: 'Común', rarity_rare: 'Raro', rarity_epic: 'Épico', rarity_legendary: 'Legendario', rarity_mythic: 'Mítico'
});
