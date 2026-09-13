/* =====================================================================
   Sistemas de meta-jogo: economia, progressão (XP/nível/título), missões
   diárias e semanais, recompensa diária, conquistas, desbloqueios.
   Dados de conquistas/missões: js/content.js
   ===================================================================== */
window.HR = window.HR || {};

/* ---------------- Economia ---------------- */
HR.Economy = {
  addCoins(n, src) {
    if (!n) return;
    const d = HR.Store.data;
    d.coins += n; if (n > 0) d.totalCoins += n;
    HR.Store.save();
    HR.Analytics.log('coins', { n, src, balance: d.coins });
    if (HR.UI) HR.UI.refreshCurrency();
  },
  addGems(n, src) {
    if (!n) return;
    const d = HR.Store.data;
    d.gems += n; HR.Store.save();
    HR.Analytics.log('gems', { n, src, balance: d.gems });
    if (HR.UI) HR.UI.refreshCurrency();
  },
  spendCoins(n, src) {
    const d = HR.Store.data;
    if (d.coins < n) { HR.UI.toast(HR.t('not_enough_coins'), 'bad'); HR.Audio.sfx('error'); return false; }
    d.coins -= n; d.stats.coinsSpent += n; HR.Store.save(); HR.Analytics.log('spend_coins', { n, src }); HR.UI.refreshCurrency(); return true;
  },
  spendGems(n, src) {
    const d = HR.Store.data;
    if (d.gems < n) { HR.UI.toast(HR.t('not_enough_gems'), 'bad'); HR.Audio.sfx('error'); HR.UI.open('shop', 'gems'); return false; }
    d.gems -= n; d.stats.gemsSpent += n; HR.Store.save(); HR.Analytics.log('spend_gems', { n, src }); HR.UI.refreshCurrency(); return true;
  },
  exchange() {
    const E = HR.CONFIG.ECONOMY;
    if (!this.spendGems(E.exchangeGems, 'exchange')) return false;
    this.addCoins(E.exchangeCoins, 'exchange'); HR.Audio.sfx('reward'); return true;
  }
};

/* ---------------- Progressão ---------------- */
HR.Progress = {
  titleKey(level) {
    let key = 'title_1';
    for (const [lv, k] of HR.CONFIG.LEVEL_TITLES) if (level >= lv) key = k;
    return key;
  },
  currentTitle() { const d = HR.Store.data; return d.title && HR.I18N.pt[d.title] ? HR.t(d.title) : HR.t(this.titleKey(d.level)); },
  info() {
    const d = HR.Store.data, need = HR.CONFIG.xpToNext(d.level);
    return { level: d.level, xp: d.xp, need, frac: HR.U.clamp(d.xp / need, 0, 1), title: this.currentTitle() };
  },
  addXp(n) {
    const d = HR.Store.data; const ups = [];
    d.xp += n;
    while (d.xp >= HR.CONFIG.xpToNext(d.level)) {
      d.xp -= HR.CONFIG.xpToNext(d.level);
      d.level++;
      const rewards = HR.CONFIG.levelRewards(d.level);
      if (rewards.coins) HR.Economy.addCoins(rewards.coins, 'levelup');
      if (rewards.gems) HR.Economy.addGems(rewards.gems, 'levelup');
      const unlocks = this.unlocksAt(d.level);
      ups.push({ level: d.level, rewards, unlocks });
      HR.Analytics.log('level_up', { level: d.level });
    }
    HR.Store.save();
    return ups;
  },
  unlocksAt(level) {
    const C = HR.CONFIG, out = [];
    C.SKINS.forEach(s => { if (s.lvl === level && level > 1 && !['pack', 'iap', 'reward', 'archon'].includes(s.cur) && !s.season && s.rar !== 'mythic' && s.rar !== 'ultimate') out.push({ type: 'skin', id: s.id }); });
    C.TRAILS.forEach(s => { if (s.lvl === level) out.push({ type: 'trail', id: s.id }); });
    C.THEMES.forEach(s => { if (s.lvl === level) out.push({ type: 'theme', id: s.id }); });
    return out;
  }
};

/* ---------------- Missões diárias e semanais ---------------- */
HR.Missions = {
  weekKey(d) { // segunda-feira da semana atual
    d = d || new Date(); const m = new Date(d); const day = (m.getDay() + 6) % 7; m.setDate(m.getDate() - day); return HR.U.dateKey(m);
  },
  msToWeekReset() { const n = new Date(); const m = new Date(n); const day = (m.getDay() + 6) % 7; m.setDate(m.getDate() + (7 - day)); m.setHours(0, 0, 0, 0); return m - n; },
  tpl(id) { return HR.MISSIONS.find(t => t.id === id); },
  pickN(pool, n, seed) {
    const out = [], p = pool.slice();
    let s = seed;
    const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    while (out.length < n && p.length) out.push(p.splice(Math.floor(rnd() * p.length), 1)[0]);
    return out;
  },
  // só sorteia o que dá para cumprir agora (habilidade comprada, Singularidade aberta, Égide em estoque…)
  eligible(t, weekly) {
    if (t.season || (t.weeklyOnly && !weekly)) return false;
    if (/^ab_/.test(t.src) && HR.Abilities && !HR.Abilities.owned(t.src.slice(3))) return false;
    try { return !t.req || !!t.req(); } catch (e) { return false; }
  },
  ensureDaily() {
    const d = HR.Store.data, C = HR.CONFIG, today = HR.U.dateKey();
    let changed = false;
    const wantDaily = C.MISSIONS_DAILY + (HR.Seasons && HR.Seasons.current() ? 1 : 0);
    if (d.missions.date !== today || d.missions.list.length !== wantDaily) {
      d.missions.date = today; d.missions.rerolls = 0;
      const seed = today.split('-').reduce((a, b) => a * 31 + parseInt(b, 10), 7) + d.level;
      d.missions.list = this.pickN(HR.MISSIONS.filter(t => this.eligible(t, false)), C.MISSIONS_DAILY, seed).map(t => this.make(t, false));
      if (HR.Seasons && HR.Seasons.current()) { const st = HR.MISSIONS.find(t => t.season); if (st) d.missions.list.push(this.make(st, false)); }
      changed = true;
    }
    const wk = this.weekKey();
    if (d.missions.weekKey !== wk || d.missions.weekly.length !== C.MISSIONS_WEEKLY) {
      d.missions.weekKey = wk;
      const seed = wk.split('-').reduce((a, b) => a * 17 + parseInt(b, 10), 3);
      d.missions.weekly = this.pickN(HR.MISSIONS.filter(t => t.weekly && this.eligible(t, true)), C.MISSIONS_WEEKLY, seed).map(t => this.make(t, true));
      changed = true;
    }
    if (changed) HR.Store.save();
    return changed;
  },
  tierFor() {
    const lv = HR.Store.data.level;
    if (lv < 4) return 0;
    if (lv < 10) return Math.random() < 0.7 ? 1 : 0;
    return Math.random() < 0.6 ? 1 : 2;
  },
  make(tpl, weekly) {
    const C = HR.CONFIG, tier = this.tierFor();
    let [target, coins, gems, xp] = tpl.tiers[tier];
    if (weekly) { if (!tpl.noMul) target = Math.round(target * C.WEEKLY_TARGET_MUL); coins *= C.WEEKLY_REWARD_MUL; gems = Math.max(gems * C.WEEKLY_REWARD_MUL, 10); xp *= C.WEEKLY_REWARD_MUL; }
    return { uid: HR.U.uid(), id: tpl.id, target, coins, gems, xp, progress: 0, claimed: false, weekly: !!weekly, seen: [] };
  },
  decorate(m) {
    const tpl = this.tpl(m.id) || {};
    return Object.assign({}, m, { icon: tpl.icon || 'flag', text: HR.t('m_' + m.id, { n: m.target }), done: m.progress >= m.target });
  },
  list(kind) { const d = HR.Store.data; return (kind === 'weekly' ? d.missions.weekly : d.missions.list).map(m => this.decorate(m)); },
  // s = resumo da partida (HR.Game.summary + campos de resultado adicionados em processRunEnd)
  valueFor(tpl, s, m) {
    if (tpl.src === 'regionRun') { if (s.mode === 'campaign' && s.region && !m.seen.includes(s.region)) { m.seen.push(s.region); return 1; } return 0; }
    const v = s[tpl.src];
    return typeof v === 'number' ? v : (v ? 1 : 0);
  },
  onRunEnd(s) {
    const d = HR.Store.data;
    const apply = m => {
      if (m.claimed) return;
      const tpl = this.tpl(m.id); if (!tpl) return;
      const v = this.valueFor(tpl, s, m);
      if (tpl.kind === 'run') m.progress = Math.max(m.progress, v); else m.progress += v;
      m.progress = Math.min(m.progress, m.target);
    };
    d.missions.list.forEach(apply); d.missions.weekly.forEach(apply);
    HR.Store.save();
  },
  find(uid) { const d = HR.Store.data; return d.missions.list.find(x => x.uid === uid) || d.missions.weekly.find(x => x.uid === uid); },
  claim(uid) {
    const m = this.find(uid);
    if (!m || m.claimed || m.progress < m.target) return null;
    m.claimed = true;
    if (m.coins) HR.Economy.addCoins(m.coins, 'mission');
    if (m.gems) HR.Economy.addGems(m.gems, 'mission');
    if (m.xp && HR.UI) HR.UI.grantXp(m.xp);
    HR.Store.save();
    HR.Analytics.log('mission_claim', { id: m.id, weekly: m.weekly });
    return m;
  },
  reroll(uid) {
    const d = HR.Store.data;
    const i = d.missions.list.findIndex(x => x.uid === uid);
    if (i < 0 || d.missions.rerolls >= HR.CONFIG.MISSION_REROLLS) return false;
    const used = d.missions.list.map(x => x.id);
    const pool = HR.MISSIONS.filter(t => !used.includes(t.id) && this.eligible(t, false));
    if (!pool.length) return false;
    d.missions.list[i] = this.make(HR.U.pick(pool), false);
    d.missions.rerolls++;
    HR.Store.save();
    return true;
  },
  hasClaimable() { const d = HR.Store.data; return d.missions.list.concat(d.missions.weekly).some(m => !m.claimed && m.progress >= m.target); },
  doneCount(kind) { const l = this.list(kind); return { a: l.filter(m => m.done).length, b: l.length }; }
};

/* ---------------- Recompensa diária ---------------- */
HR.Daily = {
  status() {
    const d = HR.Store.data.daily, today = HR.U.dateKey();
    const diff = HR.U.daysBetween(d.lastClaim, today);
    const canClaim = d.lastClaim !== today;
    let streak = d.streak;
    if (canClaim && diff > 1) streak = 0;       // quebrou a sequência
    const claimedCount = canClaim ? (streak % 7) : (((streak - 1) % 7 + 7) % 7 + 1);
    const dayIndex = canClaim ? (streak % 7) : -1;
    return { canClaim, streak, claimedCount, dayIndex, vipToday: HR.Store.data.vip && d.vipClaim !== today };
  },
  claim() {
    const st = this.status();
    if (!st.canClaim) return null;
    const D = HR.Store.data, d = D.daily, today = HR.U.dateKey();
    const reward = HR.CONFIG.DAILY[st.dayIndex];
    d.streak = st.streak + 1; d.lastClaim = today;
    D.stats.dailyClaims++; D.stats.bestStreak = Math.max(D.stats.bestStreak, d.streak);
    if (reward.coins) HR.Economy.addCoins(reward.coins, 'daily');
    if (reward.gems) HR.Economy.addGems(reward.gems, 'daily');
    HR.Store.save();
    HR.Analytics.log('daily_claim', { day: st.dayIndex + 1, streak: d.streak });
    return reward;
  },
  claimVip() {
    const d = HR.Store.data, today = HR.U.dateKey();
    if (!d.vip || d.daily.vipClaim === today) return null;
    const p = HR.CONFIG.PRODUCTS.find(x => x.id === 'vip');
    d.daily.vipClaim = today;
    HR.Economy.addGems(p.gemsDaily, 'vip'); if (p.coinsDaily) HR.Economy.addCoins(p.coinsDaily, 'vip');
    HR.Store.save();
    return { gems: p.gemsDaily, coins: p.coinsDaily };
  }
};

/* ---------------- Conquistas ---------------- */
HR.Achievements = {
  stats() {
    const d = HR.Store.data, s = d.stats;
    let maxed = 0; for (const k in d.abilities.levels) if (d.abilities.levels[k] >= HR.ABILITY_UPGRADE.maxLevel) maxed++;
    return Object.assign({}, s, {
      runs: d.runs, best: d.best, totalCoins: d.totalCoins, totalPerfects: d.totalPerfects, bestPhase: d.bestPhase, level: d.level, bestCombo: d.bestCombo,
      skinsOwned: d.owned.skins.length, trailsOwned: d.owned.trails.length, themesOwned: d.owned.themes.length, revives: d.revives, abilitiesMaxed: maxed,
      levelsCleared: HR.Campaign ? HR.Campaign.levelsCleared() : 0, starsTotal: HR.Campaign ? HR.Campaign.totalStars() : 0, regionsCleared: HR.Campaign ? HR.Campaign.regionsCleared() : 0,
      ringsFound: d.codex ? d.codex.rings.length : 0, itemsFound: d.codex ? d.codex.items.length : 0,
      coreLevel: d.core || 0, regionsVisited: (s.regionsVisited || []).length, contractsDone: s.contractsDone || 0
    }, this.stats5());
  },
  // v5: sistemas, Singularidade, Égide/Jato, velocidade e coleções
  stats5() {
    const d = HR.Store.data, s5 = d.stats5 || {}, C = HR.Campaign, SG = HR.Singularity, out = {};
    out.systemsCleared = C && C.systemsCleared ? C.systemsCleared() : 0;
    out.archonsPassed = SG ? SG.passedCount() : 0;
    out.understood = s5.understood || 0; out.questioned = s5.questioned || 0; out.forced = s5.forced || 0;
    out.ecosFound = SG ? SG.totalEcos() : 0; out.wordsEarned = SG ? SG.wordsEarned().length : 0; out.dialogues = s5.dialogues || 0;
    out.journeyPct = C && C.progressPct ? Math.floor(C.progressPct()) : 0;
    out.aegisUsed = s5.aegisUsed || 0; out.aegisSaves = s5.aegisSaves || 0; out.jetsUsed = s5.jetsUsed || 0; out.megajetsUsed = s5.megajetsUsed || 0;
    out.abilitiesOwned = d.abilities.owned.length; out.speedPct = s5.speedPct || 0;
    let done = 0;
    (HR.COLLECTIONS || []).forEach(c => { const all = HR.CONFIG.SKINS.filter(x => x.col === c.id), own = all.filter(x => d.owned.skins.includes(x.id)).length; out['col_' + c.id] = own; if (all.length && own >= all.length) done++; });
    out.collectionsDone = done;
    const g = d.gear || {}; out.aegisSkins = (g.ownedAegis || ['crystal']).length; out.jetSkins = (g.ownedJet || ['blue']).length;
    out.ownTon618 = d.owned.skins.includes('ton618') ? 1 : 0;
    return out;
  },
  check() {
    const d = HR.Store.data, st = this.stats(), out = [];
    HR.ACHIEVEMENTS.forEach(a => {
      if (d.achievements.includes(a.id)) return;
      if ((st[a.stat] || 0) >= a.target) {
        d.achievements.push(a.id);
        HR.Economy.addGems(a.gems, 'achievement');
        if (a.title && !d.titles.includes(a.title)) { d.titles.push(a.title); d.title = a.title; }
        out.push(a);
        HR.Analytics.log('achievement', { id: a.id });
      }
    });
    if (out.length) HR.Store.save();
    return out;
  },
  progressOf(a, st) {
    st = st || this.stats();
    const v = st[a.stat] || 0;
    return { value: Math.min(v, a.target), target: a.target, frac: HR.U.clamp(v / a.target, 0, 1) };
  },
  descText(a) {
    const n = a.stat === 'timePlayed' ? Math.round(a.target / 60) : a.target;
    return HR.t('a_d_' + a.stat, { n: HR.U.fmt(n) });
  },
  list(cat) {
    const d = HR.Store.data, st = this.stats();
    return HR.ACHIEVEMENTS.filter(a => !cat || a.cat === cat).map(a => {
      const unlocked = d.achievements.includes(a.id), p = this.progressOf(a, st);
      const hidden = a.hidden && !unlocked;
      return { id: a.id, cat: a.cat, gems: a.gems, icon: a.icon, title: a.title, hidden, unlocked, target: a.target, progress: p.value, frac: p.frac,
        name: hidden ? HR.t('ach_hidden') : HR.t('a_' + a.id), desc: hidden ? '???' : this.descText(a) };
    });
  },
  counts() { const d = HR.Store.data; return { a: d.achievements.length, b: HR.ACHIEVEMENTS.length }; }
};

/* ---------------- Núcleo da bola (v4) ---------------- */
HR.Core = {
  level() { return HR.Store.data.core || 0; },
  cost(n) { n = n == null ? this.level() : n; return n >= HR.CONFIG.CORE.maxLevel ? null : HR.CONFIG.CORE.cost(n); },
  mods(n) {
    const C = HR.CONFIG.CORE; n = n == null ? this.level() : n;
    return { level: n, coinMul: 1 + C.coinMul * n, forgive: C.forgive * n, perfect: 1 + C.perfect * n, xp: 1 + C.xp * n, shieldCap: C.shieldAt.filter(k => n >= k).length, startShield: n >= C.startShieldAt ? 1 : 0, life: n >= C.lifeAt ? 1 : 0, pickupMul: n >= C.pickupAt ? 1.5 : 1 };
  },
  milestone(n) { const C = HR.CONFIG.CORE; if (C.shieldAt.includes(n)) return 'core_ms_shield'; if (n === C.startShieldAt) return 'core_ms_start'; if (n === C.lifeAt) return 'core_ms_life'; if (n === C.pickupAt) return 'core_ms_pickup'; return null; },
  nextMilestone(n) { const C = HR.CONFIG.CORE; const all = C.shieldAt.concat([C.startShieldAt, C.lifeAt, C.pickupAt]).sort((a, b) => a - b); return all.find(k => k > n) || null; },
  upgrade() {
    const c = this.cost(); if (c == null) return false;
    if (!HR.Economy.spendCoins(c, 'core')) return false;
    HR.Store.data.core = this.level() + 1; HR.Store.data.stats.coreLevel = HR.Store.data.core; HR.Store.save();
    HR.Audio.sfx('levelup'); HR.Analytics.log('core_up', { level: HR.Store.data.core });
    return true;
  }
};

/* ---------------- Cosméticos / desbloqueios ---------------- */
HR.Unlocks = {
  catalog(type) { return type === 'skins' ? HR.CONFIG.SKINS : type === 'trails' ? HR.CONFIG.TRAILS : HR.CONFIG.THEMES; },
  owned(type, id) { return HR.Store.data.owned[type].includes(id); },
  equipped(type) { const k = type === 'skins' ? 'skin' : type === 'trails' ? 'trail' : 'theme'; return HR.Store.data.equipped[k]; },
  equip(type, id) {
    if (!this.owned(type, id)) return false;
    const k = type === 'skins' ? 'skin' : type === 'trails' ? 'trail' : 'theme';
    HR.Store.data.equipped[k] = id; HR.Store.save();
    HR.Analytics.log('equip', { type, id });
    return true;
  },
  // v5: cosméticos com preço duplo — cur 'gems' paga com gemas (pago), senão moedas (grátis)
  buy(type, id, cur) {
    const item = this.catalog(type).find(i => i.id === id);
    if (!item || this.owned(type, id)) return false;
    if (HR.Store.data.level < item.lvl) return false;
    if (['pack', 'iap', 'reward', 'archon'].includes(item.cur)) return false;
    if (item.season && !(HR.Seasons && HR.Seasons.isActive(item.season))) return false;
    const useGems = (cur === 'gems' && item.gems > 0) || item.cur === 'gems';
    const ok = useGems ? HR.Economy.spendGems(item.cur === 'gems' ? item.price : item.gems, type + '_' + id) : HR.Economy.spendCoins(item.price, type + '_' + id);
    if (!ok) return false;
    HR.Store.data.owned[type].push(id);
    HR.Store.data.stats.itemsBought++; if (item.season) HR.Store.data.stats.seasonItems = (HR.Store.data.stats.seasonItems || 0) + 1;
    this.equip(type, id);
    HR.Audio.sfx('buy');
    HR.Analytics.log('cosmetic_buy', { type, id, cur: item.cur, price: item.price });
    return true;
  }
};
