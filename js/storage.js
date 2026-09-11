/* ===== Persistência (localStorage, com versão, migração do Halo Rush v1 → ORBO v3) ===== */
window.HR = window.HR || {};

HR.Store = {
  data: null,

  defaults() {
    return {
      v: 3, created: Date.now(), lastOpen: Date.now(),
      coins: 0, gems: 0, xp: 0, level: 1,
      best: 0, runs: 0, totalRings: 0, totalCoins: 0, totalPerfects: 0, bestCombo: 0, bestPhase: 0, revives: 0, powerupsUsed: 0,
      noAds: false, vip: false, vipSince: null,
      owned: { skins: ['classic'], trails: ['none'], themes: ['aurora'] },
      equipped: { skin: 'classic', trail: 'none', theme: 'aurora' },
      settings: { sound: true, music: true, vibration: true, control: 'auto', sensitivity: 1, lang: null, musicVol: 0.8, sfxVol: 1, autoPerk: false },
      missions: { date: null, list: [], rerolls: 0, weekKey: null, weekly: [] },
      daily: { lastClaim: null, streak: 0, vipClaim: null },
      ads: { lastInterstitial: 0, runsSince: 0, freeGemsDate: null, freeGemsCount: 0 },
      achievements: [],
      scores: [],
      tutorialDone: false,
      name: null,
      title: null,          // título escolhido/ganho por conquista (chave i18n) — null = título do nível
      titles: [],
      seenShopHint: false,
      mode: 'endless',
      abilities: { owned: ['slowmo'], equipped: ['slowmo', null], levels: {} },
      campaign: { stars: {}, best: {}, last: null, lastRegion: 0 },
      stats: {
        endlessRuns: 0, campaignClears: 0, practiceRuns: 0, perksTaken: 0, abilitiesUsed: 0,
        levelsCleared: 0, starsTotal: 0, bossesBeaten: 0, regionsCleared: 0, flawlessLevels: 0,
        dirChanges: 0, nearMisses: 0, timePlayed: 0, distance: 0, itemsBought: 0, coinsSpent: 0, gemsSpent: 0,
        dailyClaims: 0, bestStreak: 0, shieldsAbsorbed: 0, bestPerksRun: 0, abilitiesMaxed: 0, doubleRings: 0, goldRings: 0, comboBonuses: 0,
        pickups: 0, anomaliesBeaten: 0, misses: 0, starsUsed: 0, obstaclesDestroyed: 0
      },
      codex: { rings: [], items: [] },
      hints: { ability: false, direction: false, perk: false, galaxy: false }
    };
  },

  load() {
    const K = HR.CONFIG.SAVE_KEY, LK = HR.CONFIG.LEGACY_SAVE_KEY;
    let d = null, legacy = false;
    try { d = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { d = null; }
    if (!d) { try { d = JSON.parse(localStorage.getItem(LK) || 'null'); legacy = !!d; } catch (e) { d = null; } }
    const def = this.defaults();
    if (!d || typeof d !== 'object') d = def;
    const merge = (base, src) => {
      for (const k in base) {
        if (src[k] === undefined) src[k] = base[k];
        else if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && typeof src[k] === 'object' && src[k]) merge(base[k], src[k]);
      }
      return src;
    };
    d = merge(def, d);
    if (legacy) { d.v = 3; d.migratedFrom = 'halorush'; }
    if (d.v < 3) d.v = 3;
    d.lastOpen = Date.now();
    this.data = d;
    this.save();
    return d;
  },

  save() {
    try { localStorage.setItem(HR.CONFIG.SAVE_KEY, JSON.stringify(this.data)); } catch (e) { /* armazenamento cheio ou bloqueado */ }
  },

  reset() {
    const keepSettings = this.data ? this.data.settings : null;
    this.data = this.defaults();
    if (keepSettings) this.data.settings = keepSettings;
    this.save();
  },

  export() { return JSON.stringify(this.data); },
  import(json) { try { const d = JSON.parse(json); if (d && d.v) { this.data = d; this.save(); return true; } } catch (e) { /* inválido */ } return false; }
};
