/* =====================================================================
   Habilidades ativas (botões com recarga) e Perks (roguelike por corrida).
   Dados + regras de modificadores da corrida. Textos registrados aqui mesmo.
   ===================================================================== */
window.HR = window.HR || {};

// icon = nome em js/icons.js
HR.ABILITIES = [
  { id: 'slowmo',      icon: 'hourglass', color: '#4cf0ff', cd: 18, dur: 4,   unlock: { lvl: 1, cur: 'coins', price: 0 } },
  { id: 'magnet',      icon: 'magnet',    color: '#ffcf4a', cd: 20, dur: 8,   unlock: { lvl: 1, cur: 'coins', price: 500 } },
  { id: 'shieldpulse', icon: 'shield',    color: '#35e29a', cd: 25, dur: 0,   unlock: { lvl: 2, cur: 'coins', price: 700 } },
  { id: 'autopilot',   icon: 'bot',       color: '#a29bfe', cd: 28, dur: 3.5, unlock: { lvl: 3, cur: 'coins', price: 900 } },
  { id: 'ghost',       icon: 'ghost',     color: '#cfe9ff', cd: 24, dur: 3,   unlock: { lvl: 5, cur: 'gems',  price: 60 } },
  { id: 'freeze',      icon: 'snow',      color: '#9be7ff', cd: 22, dur: 4,   unlock: { lvl: 7, cur: 'gems',  price: 80 } }
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
  { id: 'shield',       rarity: 'common',    max: 3, icon: 'shield',  apply: run => { run.shields = Math.min(3, run.shields + 1); } },
  { id: 'bigrings',     rarity: 'common',    max: 3, icon: 'ring',    mods: { ringRadius: 0.08 } },
  { id: 'eagle',        rarity: 'common',    max: 2, icon: 'target',  mods: { perfectZone: 1.35 } },
  { id: 'fastcd',       rarity: 'common',    max: 3, icon: 'bolt',    mods: { cdMul: 0.8 } },
  { id: 'breath',       rarity: 'common',    max: 2, icon: 'wind',    mods: { durMul: 1.35 } },
  { id: 'calm',         rarity: 'common',    max: 2, icon: 'wave',    mods: { speedMul: 0.93 } },
  { id: 'magnet',       rarity: 'common',    max: 1, icon: 'magnet',  mods: { magnet: true } },
  { id: 'life',         rarity: 'rare',      max: 2, icon: 'heart',   apply: run => { run.lives++; } },
  { id: 'coinsx2',      rarity: 'rare',      max: 1, icon: 'coins',   mods: { coinMul: 2 } },
  { id: 'combo3',       rarity: 'rare',      max: 1, icon: 'flame',   mods: { comboEvery: 3 } },
  { id: 'reflex',       rarity: 'rare',      max: 1, icon: 'eye',     mods: { reflex: true } },
  { id: 'streakshield', rarity: 'rare',      max: 1, icon: 'link',    mods: { streakShield: true } },
  { id: 'greedy',       rarity: 'epic',      max: 1, icon: 'bag',     mods: { coinMul: 1.5, ringRadius: -0.10 } },
  { id: 'risky',        rarity: 'epic',      max: 1, icon: 'dice',    mods: { ringRadius: -0.12, scorePerRing: 1 } },
  { id: 'goldring',     rarity: 'epic',      max: 1, icon: 'sparkle', mods: { goldEvery: 10 } },
  { id: 'secondchance', rarity: 'legendary', max: 1, icon: 'undo',    mods: { secondChance: 1 } },
  // ascensão (míticos): levam a build ao automático — ver docs/PLANO_V3.md v3.1
  { id: 'autoflow',     rarity: 'mythic',    max: 3, icon: 'bot',     mods: { autoflow: 1 } },
  { id: 'regen',        rarity: 'mythic',    max: 3, icon: 'shield',  mods: { regen: 1 } },
  { id: 'intangible',   rarity: 'mythic',    max: 3, icon: 'ghost',   mods: { intangible: 1 } },
  { id: 'overclock',    rarity: 'mythic',    max: 3, icon: 'zap',     mods: { overclock: 1 } },
  { id: 'momentum',     rarity: 'mythic',    max: 3, icon: 'flame',   mods: { momentum: 1 } }
];

HR.Perks = {
  baseMods() {
    return { ringRadius: 0, perfectZone: 1, coinMul: 1, magnet: false, cdMul: 1, durMul: 1, comboEvery: 5, speedMul: 1, reflex: false, scorePerRing: 1, streakShield: false, goldEvery: 0, secondChance: 0, autoflow: 0, regen: 0, intangible: 0, overclock: 0, momentum: 0 };
  },
  def(id) { return HR.PERKS.find(p => p.id === id); },
  recompute(run) {
    const m = this.baseMods();
    for (const id in run.perks) {
      const p = this.def(id); if (!p || !p.mods) continue;
      for (let n = 0; n < run.perks[id]; n++) {
        for (const k in p.mods) {
          const v = p.mods[k];
          if (k === 'ringRadius' || k === 'scorePerRing' || k === 'secondChance' || k === 'autoflow' || k === 'regen' || k === 'intangible' || k === 'overclock' || k === 'momentum') m[k] += v;
          else if (k === 'perfectZone' || k === 'cdMul' || k === 'durMul' || k === 'speedMul' || k === 'coinMul') m[k] *= v;
          else m[k] = v;
        }
      }
    }
    m.cdMul *= [1, 0.6, 0.35, 0.1][Math.min(3, m.overclock)];
    run.mods = m;
    return m;
  },
  offer(run, n) {
    n = n || 3;
    const A = HR.CONFIG.ASCENSION;
    const mythicOk = run.mode === 'endless' && run.ringsPassed >= A.fromRing;
    const pool = HR.PERKS.filter(p => (run.perks[p.id] || 0) < p.max && (p.rarity !== 'legendary' || run.ringsPassed >= 30) && (p.rarity !== 'mythic' || mythicOk));
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
  perk_streakshield: 'Escudo de Sequência', perk_streakshield_d: 'A cada 8 perfeitos seguidos, +1 escudo.',
  perk_greedy: 'Ganancioso', perk_greedy_d: '+50 % moedas, mas arcos 10 % menores.',
  perk_risky: 'Arriscado', perk_risky_d: 'Arcos 12 % menores, mas cada arco vale 2 pontos.',
  perk_goldring: 'Anel Dourado', perk_goldring_d: 'A cada 10º arco, +5 moedas.',
  perk_secondchance: 'Segunda Chance', perk_secondchance_d: 'Uma vez por corrida, o erro é desfeito.',
  perk_autoflow: 'Fluxo', perk_autoflow_d: 'Piloto automático em pulsos; no nível 3, permanente.',
  perk_regen: 'Regeneração', perk_regen_d: '+1 escudo a cada 12/8/5 arcos e o limite de escudos sobe.',
  perk_intangible: 'Intangível', perk_intangible_d: 'Fantasma 40 % do tempo → 70 % → permanente.',
  perk_overclock: 'Overclock', perk_overclock_d: 'Habilidades recarregam 40 % / 65 % / 90 % mais rápido.',
  perk_momentum: 'Momento', perk_momentum_d: '+1 ponto por arco por nível.',
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
  perk_streakshield: 'Streak Shield', perk_streakshield_d: 'Every 8 perfects in a row, +1 shield.',
  perk_greedy: 'Greedy', perk_greedy_d: '+50% coins, but rings 10% smaller.',
  perk_risky: 'Risky', perk_risky_d: 'Rings 12% smaller, but each ring scores 2.',
  perk_goldring: 'Golden Ring', perk_goldring_d: 'Every 10th ring gives +5 coins.',
  perk_secondchance: 'Second Chance', perk_secondchance_d: 'Once per run, a mistake is undone.',
  perk_autoflow: 'Flow', perk_autoflow_d: 'Autopilot in pulses; permanent at level 3.',
  perk_regen: 'Regeneration', perk_regen_d: '+1 shield every 12/8/5 rings and the shield cap rises.',
  perk_intangible: 'Intangible', perk_intangible_d: 'Ghost 40% of the time → 70% → permanent.',
  perk_overclock: 'Overclock', perk_overclock_d: 'Abilities recharge 40% / 65% / 90% faster.',
  perk_momentum: 'Momentum', perk_momentum_d: '+1 point per ring per level.',
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
  perk_streakshield: 'Escudo de Racha', perk_streakshield_d: 'Cada 8 perfectos seguidos, +1 escudo.',
  perk_greedy: 'Codicioso', perk_greedy_d: '+50 % monedas, pero aros un 10 % más pequeños.',
  perk_risky: 'Arriesgado', perk_risky_d: 'Aros un 12 % más pequeños, pero cada aro vale 2 puntos.',
  perk_goldring: 'Aro Dorado', perk_goldring_d: 'Cada 10º aro da +5 monedas.',
  perk_secondchance: 'Segunda Oportunidad', perk_secondchance_d: 'Una vez por partida, el error se deshace.',
  perk_autoflow: 'Flujo', perk_autoflow_d: 'Piloto automático en pulsos; permanente en nivel 3.',
  perk_regen: 'Regeneración', perk_regen_d: '+1 escudo cada 12/8/5 aros y sube el límite de escudos.',
  perk_intangible: 'Intangible', perk_intangible_d: 'Fantasma el 40 % del tiempo → 70 % → permanente.',
  perk_overclock: 'Overclock', perk_overclock_d: 'Las habilidades recargan un 40 % / 65 % / 90 % más rápido.',
  perk_momentum: 'Impulso', perk_momentum_d: '+1 punto por aro por nivel.',
  perk_title: 'ELIGE UN PODER', perk_sub: 'Aro {n} · arma tu build', perk_reroll: 'Cambiar opciones', perk_skip: 'Saltar (+15 monedas)', perk_taken: 'Nivel {n}/{max}', build: 'Build',
  perk_auto: 'Elección automática', perk_auto_d: 'Los próximos perks se eligen solos, sin pausar.', perk_auto_on: 'Perk automático', perk_auto_toast: 'Perk automático: {name}',
  rarity_common: 'Común', rarity_rare: 'Raro', rarity_epic: 'Épico', rarity_legendary: 'Legendario', rarity_mythic: 'Mítico'
});
