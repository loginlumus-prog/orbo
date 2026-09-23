/* ===== Persistência (localStorage, com versão, migração do Halo Rush v1 → ORBO v3) ===== */
window.HR = window.HR || {};

HR.Store = {
  data: null,

  defaults() {
    return {
      v: 5, created: Date.now(), lastOpen: Date.now(),
      coins: 0, gems: 0, xp: 0, level: 1, core: 0,
      best: 0, runs: 0, totalRings: 0, totalCoins: 0, totalPerfects: 0, bestCombo: 0, bestPhase: 0, revives: 0, powerupsUsed: 0,
      noAds: false, vip: false, vipSince: null,
      owned: { skins: ['classic'], trails: ['none'], themes: ['aurora'] },
      equipped: { skin: 'classic', trail: 'none', theme: 'aurora' },
      settings: { sound: true, music: true, vibration: true, control: 'auto', sensitivity: 1, lang: null, musicVol: 0.8, sfxVol: 1, autoPerk: false, adaptSlowmo: true, quality: 'auto' },
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
      campaign: { stars: {}, best: {}, last: null, lastRegion: 0, contracts: {}, rstats: {} },
      stats: {
        endlessRuns: 0, campaignClears: 0, practiceRuns: 0, perksTaken: 0, abilitiesUsed: 0,
        levelsCleared: 0, starsTotal: 0, bossesBeaten: 0, regionsCleared: 0, flawlessLevels: 0,
        dirChanges: 0, nearMisses: 0, timePlayed: 0, distance: 0, itemsBought: 0, coinsSpent: 0, gemsSpent: 0,
        dailyClaims: 0, bestStreak: 0, shieldsAbsorbed: 0, bestPerksRun: 0, abilitiesMaxed: 0, doubleRings: 0, goldRings: 0, comboBonuses: 0,
        pickups: 0, anomaliesBeaten: 0, misses: 0, starsUsed: 0, obstaclesDestroyed: 0,
        flowMax: 0, flowTime: 0, centerPickups: 0, eventsDone: 0, guardians: 0, sentinels: 0, warps: 0, asteroidsDestroyed: 0, contractsDone: 0, coreLevel: 0, regionsVisited: [], seasonItems: 0, shattered: 0
      },
      codex: { rings: [], items: [] },
      hints: { ability: false, direction: false, perk: false, galaxy: false, system: false, aegis: false, jet: false, singularity: false },
      // v5
      consumables: { aegis: 2, jet: 1, megajet: 0 },
      gear: { aegis: 'crystal', jet: 'blue', ownedAegis: ['crystal'], ownedJet: ['blue'] },
      singularity: { layers: {}, words: [], ecos: [], firstClear: null },
      online: { id: null, name: null, lastSubmit: 0 },
      xpBonus: { date: null, used: 0 },
      album: { claimed: [] },
      stats5: { systemsCleared: 0, aegisUsed: 0, aegisSaves: 0, jetsUsed: 0, megajetsUsed: 0, ecosFound: 0, archonsPassed: 0, dialogues: 0, understood: 0, questioned: 0, forced: 0, collectionsDone: 0, maxSpeed: 0, systemBosses: 0 }
    };
  },
  // v5: as 100 fases antigas (r-f) viram os sistemas da galáxia 1 (1-r-f); contratos recomeçam na escala nova
  migrate(d) {
    if ((d.v || 0) >= 5) return d;
    const c = d.campaign || (d.campaign = {});
    const conv = obj => { const out = {}; for (const k in (obj || {})) { const p = k.split('-'); out[p.length === 2 ? '1-' + k : k] = obj[k]; } return out; };
    c.stars = conv(c.stars); c.best = conv(c.best);
    if (c.last && String(c.last).split('-').length === 2) c.last = '1-' + c.last;
    const sum = { perfects: 0, clears: 0, coins: 0, pickups: 0, flawless: 0, events: 0, noMiss: 0, bossFlawless: 0 };
    for (const k in (c.rstats || {})) { const r = c.rstats[k]; for (const f in sum) sum[f] = f === 'noMiss' ? Math.max(sum[f], r[f] || 0) : sum[f] + (r[f] || 0); }
    c.rstats = { 0: sum }; c.contracts = {}; c.lastRegion = 0;
    d.v = 5; d.migratedV5 = Date.now(); d.pendingBackfillV5 = true;
    return d;
  },

  // Completa o save com os defaults: campo de versao nova nunca fica indefinido.
  // Usado por load() e por import() (um backup antigo nao tem stats5/rifts/frags).
  withDefaults(d) {
    const def = this.defaults();
    if (!d || typeof d !== 'object' || Array.isArray(d)) d = def;
    const merge = (base, src) => {
      for (const k in base) {
        if (src[k] === undefined) src[k] = base[k];
        else if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && typeof src[k] === 'object' && src[k]) merge(base[k], src[k]);
      }
      return src;
    };
    return merge(def, d);
  },

  load() {
    const K = HR.CONFIG.SAVE_KEY, LK = HR.CONFIG.LEGACY_SAVE_KEY;
    let d = null, legacy = false;
    try { d = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { d = null; }
    if (!d) { try { d = JSON.parse(localStorage.getItem(LK) || 'null'); legacy = !!d; } catch (e) { d = null; } }
    d = this.withDefaults(d);
    if (legacy) { d.v = 3; d.migratedFrom = 'halorush'; }
    if (d.v < 4) d.v = 4;
    this.migrate(d);
    d.lastOpen = Date.now();
    this.data = d;
    this.save();
    return d;
  },

  save() {
    this.pending = false;
    try { localStorage.setItem(HR.CONFIG.SAVE_KEY, JSON.stringify(this.data)); } catch (e) { /* armazenamento cheio ou bloqueado */ }
  },
  // Para o meio da partida (gema apanhada, Egide, Jato): o JSON.stringify +
  // setItem sincronos custam 1-3 ms no A10 e caiam no quadro do toque. Aqui
  // o save vai para um momento ocioso; se o app fechar antes, flush() salva.
  saveSoon() {
    if (this.pending) return;
    this.pending = true;
    const go = () => { if (this.pending) this.save(); };
    if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 120);
  },
  flush() { if (this.pending) this.save(); },

  reset() {
    const keepSettings = this.data ? this.data.settings : null;
    this.data = this.defaults();
    if (keepSettings) this.data.settings = keepSettings;
    this.save();
  },

  export() { return JSON.stringify(this.data); },
  // "Colar codigo de backup": o JSON vinha de uma versao mais velha e era gravado
  // cru, deixando stats5/rifts/frags/story indefinidos (o primeiro
  // data.stats5.aegisUsed++ lancava). Aqui ele passa pelo mesmo caminho da carga:
  // valida, completa com os defaults e migra antes de gravar.
  import(json) {
    let d = null;
    try { d = JSON.parse(json); } catch (e) { return false; }
    if (!d || typeof d !== 'object' || Array.isArray(d)) return false;
    const velho = !d.v;                 // backup sem versao = Halo Rush v1
    d = this.withDefaults(d);
    if (velho) { d.v = 3; d.migratedFrom = 'halorush'; }
    if (d.v < 4) d.v = 4;
    this.migrate(d);
    d.lastOpen = Date.now();
    this.data = d;
    this.save();
    return true;
  }
};
// um save adiado nunca se perde: ao esconder ou fechar a pagina ele e gravado
document.addEventListener('visibilitychange', () => { if (document.hidden) HR.Store.flush(); });
window.addEventListener('pagehide', () => HR.Store.flush());
