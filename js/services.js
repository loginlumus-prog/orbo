/* =====================================================================
   Serviços: Analytics, Anúncios, Compras (IAP), Ranking, Compartilhar.
   Cada serviço tem um PROVEDOR trocável:
     - Mock*  → roda no navegador (simula anúncio/compra) — usado agora
     - AdMob / RevenueCat → usados no app nativo (Capacitor). Ver docs/PUBLICACAO.md
   ===================================================================== */
window.HR = window.HR || {};

/* ---------------- Analytics ---------------- */
HR.Analytics = {
  queue: [], adapter: null, DEBUG: false,
  log(ev, params) {
    const e = { ev, p: params || {}, t: Date.now() };
    this.queue.push(e); if (this.queue.length > 300) this.queue.shift();
    try { if (this.adapter) this.adapter(ev, params || {}); } catch (_) { /* adapter falhou */ }
    if (this.DEBUG) console.log('[analytics]', ev, params || {});
  },
  // Exemplo de adaptador Firebase (Capacitor): HR.Analytics.adapter = (ev, p) => FirebaseAnalytics.logEvent({ name: ev, params: p });
};

/* ---------------- Anúncios ---------------- */
HR.MockAdProvider = class {
  init() { this.ready = true; }
  isRewardedReady() { return true; }
  isInterstitialReady() { return true; }
  showInterstitial() { return HR.UI.showAdModal({ rewarded: false, duration: 3 }); }
  showRewarded() { return HR.UI.showAdModal({ rewarded: true, duration: HR.CONFIG.ADS.mockDuration }); }
  showBanner() { HR.UI.setBanner(false); } // sem placeholder na versão web; o banner real só existe no app nativo
  hideBanner() { HR.UI.setBanner(false); }
};

// Provedor AdMob via @capacitor-community/admob. IDs abaixo são os de TESTE do Google.
HR.AdMobProvider = class {
  constructor() {
    this.plugin = window.AdMob || (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob);
    this.ids = {
      banner: 'ca-app-pub-3940256099942544/6300978111',
      interstitial: 'ca-app-pub-3940256099942544/1033173712',
      rewarded: 'ca-app-pub-3940256099942544/5224354917'
    };
    this.interstitialReady = false; this.rewardedReady = false;
  }
  async init() {
    if (!this.plugin) return;
    try {
      await this.plugin.initialize({ initializeForTesting: true });
      this.plugin.addListener('interstitialAdLoaded', () => { this.interstitialReady = true; });
      this.plugin.addListener('rewardVideoAdLoaded', () => { this.rewardedReady = true; });
      this.preloadInterstitial(); this.preloadRewarded();
    } catch (e) { console.warn('AdMob init', e); }
  }
  async preloadInterstitial() { try { await this.plugin.prepareInterstitial({ adId: this.ids.interstitial }); this.interstitialReady = true; } catch (_) { this.interstitialReady = false; } }
  async preloadRewarded() { try { await this.plugin.prepareRewardVideoAd({ adId: this.ids.rewarded }); this.rewardedReady = true; } catch (_) { this.rewardedReady = false; } }
  isRewardedReady() { return this.rewardedReady; }
  isInterstitialReady() { return this.interstitialReady; }
  async showInterstitial() {
    if (!this.interstitialReady) return false;
    try { await this.plugin.showInterstitial(); } catch (_) { return false; }
    this.interstitialReady = false; this.preloadInterstitial(); return true;
  }
  async showRewarded() {
    if (!this.rewardedReady) return false;
    let rewarded = false;
    const h = await this.plugin.addListener('rewardVideoAdReward', () => { rewarded = true; });
    try { await this.plugin.showRewardVideoAd(); } catch (_) { /* fechado */ }
    await new Promise(r => setTimeout(r, 300));
    h.remove(); this.rewardedReady = false; this.preloadRewarded();
    return rewarded;
  }
  showBanner() { try { this.plugin.showBanner({ adId: this.ids.banner, adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER', margin: 0 }); } catch (_) { /* sem banner */ } }
  hideBanner() { try { this.plugin.hideBanner(); } catch (_) { /* sem banner */ } }
};

HR.Ads = {
  provider: null,
  init() {
    const native = HR.U.isCapacitor() && (window.AdMob || (window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob));
    this.provider = native ? new HR.AdMobProvider() : new HR.MockAdProvider();
    this.provider.init();
  },
  get noAds() { return !!(HR.Store.data.noAds || HR.Store.data.vip); },

  shouldShowInterstitial() {
    const d = HR.Store.data, A = HR.CONFIG.ADS;
    if (this.noAds) return false;
    if (d.runs <= A.skipFirstRuns) return false;
    if (d.ads.runsSince < A.interstitialEvery) return false;
    if ((Date.now() - d.ads.lastInterstitial) / 1000 < A.interstitialMinGap) return false;
    return this.provider.isInterstitialReady();
  },
  async maybeInterstitial(reason) {
    if (!this.shouldShowInterstitial()) return false;
    HR.Analytics.log('ad_interstitial', { reason });
    const ok = await this.provider.showInterstitial();
    HR.Store.data.ads.lastInterstitial = Date.now();
    HR.Store.data.ads.runsSince = 0;
    HR.Store.save();
    return ok;
  },
  isRewardedReady() { return this.provider.isRewardedReady(); },
  async showRewarded(placement) {
    if (!this.provider.isRewardedReady()) { HR.UI.toast(HR.t('ad_not_ready'), 'bad'); return false; }
    HR.Analytics.log('ad_rewarded_start', { placement });
    const ok = await this.provider.showRewarded();
    HR.Analytics.log(ok ? 'ad_rewarded_done' : 'ad_rewarded_skip', { placement });
    return ok;
  },
  banner(show) {
    if (!HR.CONFIG.ADS.bannerInMenu || this.noAds) { this.provider.hideBanner(); return; }
    show ? this.provider.showBanner() : this.provider.hideBanner();
  },
  freeGemsLeft() {
    const d = HR.Store.data.ads, today = HR.U.dateKey();
    if (d.freeGemsDate !== today) return HR.CONFIG.ADS.freeGemsPerDay;
    return Math.max(0, HR.CONFIG.ADS.freeGemsPerDay - d.freeGemsCount);
  },
  useFreeGems() {
    const d = HR.Store.data.ads, today = HR.U.dateKey();
    if (d.freeGemsDate !== today) { d.freeGemsDate = today; d.freeGemsCount = 0; }
    d.freeGemsCount++; HR.Store.save();
  }
};

/* ---------------- Compras no app (IAP) ---------------- */
HR.MockIAPProvider = class {
  async init() { return true; }
  async buy(product) {
    const name = HR.UI.productName(product);
    const ok = await HR.UI.confirm(HR.t('confirm_buy_title'), HR.t('confirm_buy_text', { item: name, price: HR.UI.productPrice(product) }));
    return { ok };
  }
  async restore() { return { ok: true, restored: [] }; }
  price(product) { return product.price[HR.lang] || product.price.en; }
  manage() { HR.UI.toast(HR.t('manage_sub')); }
};

// RevenueCat (purchases-capacitor) — a forma mais simples de vender em iOS + Android com validação de recibo.
HR.RevenueCatProvider = class {
  constructor() { this.plugin = window.Purchases || (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Purchases); this.offerings = null; }
  async init() {
    if (!this.plugin) return false;
    try {
      await this.plugin.configure({ apiKey: 'SUA_CHAVE_PUBLICA_REVENUECAT' });
      const o = await this.plugin.getOfferings(); this.offerings = o.current;
      await this.syncEntitlements();
      return true;
    } catch (e) { console.warn('RevenueCat init', e); return false; }
  }
  findPackage(id) { return this.offerings && this.offerings.availablePackages.find(p => p.product.identifier === id); }
  price(product) { const p = this.findPackage(product.id); return p ? p.product.priceString : (product.price[HR.lang] || product.price.en); }
  async buy(product) {
    const pkg = this.findPackage(product.id);
    if (!pkg) return { ok: false, error: 'not_found' };
    try { await this.plugin.purchasePackage({ aPackage: pkg }); await this.syncEntitlements(); return { ok: true }; }
    catch (e) { return { ok: false, error: e && e.message }; }
  }
  async restore() { try { await this.plugin.restorePurchases(); const r = await this.syncEntitlements(); return { ok: true, restored: r }; } catch (e) { return { ok: false }; } }
  async syncEntitlements() {
    const info = await this.plugin.getCustomerInfo();
    const ents = info.customerInfo.entitlements.active;
    const restored = [];
    if (ents.no_ads) { HR.Store.data.noAds = true; restored.push('no_ads'); }
    if (ents.vip) { HR.Store.data.vip = true; restored.push('vip'); } else { HR.Store.data.vip = false; }
    HR.Store.save(); return restored;
  }
  manage() { try { this.plugin.showManageSubscriptions ? this.plugin.showManageSubscriptions() : null; } catch (_) { /* n/a */ } }
};

HR.IAP = {
  provider: null,
  init() {
    const native = HR.U.isCapacitor() && (window.Purchases || (window.Capacitor.Plugins && window.Capacitor.Plugins.Purchases));
    this.provider = native ? new HR.RevenueCatProvider() : new HR.MockIAPProvider();
    this.provider.init();
  },
  product(id) { return HR.CONFIG.PRODUCTS.find(p => p.id === id); },
  price(product) { return this.provider.price(product); },
  async buy(id) {
    const product = this.product(id); if (!product) return false;
    HR.Analytics.log('iap_start', { id });
    const res = await this.provider.buy(product);
    if (!res.ok) { HR.Analytics.log('iap_cancel', { id }); HR.UI.toast(HR.t('purchase_failed'), 'bad'); return false; }
    this.grant(product);
    HR.Analytics.log('iap_success', { id });
    HR.Audio.sfx('buy'); HR.UI.toast(HR.t('purchased'), 'good');
    return true;
  },
  grant(product) {
    const d = HR.Store.data;
    if (product.gems) HR.Economy.addGems(product.gems, 'iap');
    if (product.noAds) d.noAds = true;
    if (product.type === 'noads') d.noAds = true;
    if (product.type === 'sub') { d.vip = true; d.vipSince = Date.now(); }
    if (product.skin && !d.owned.skins.includes(product.skin)) d.owned.skins.push(product.skin);
    (product.skins || []).forEach(id => { if (!d.owned.skins.includes(id)) d.owned.skins.push(id); });
    HR.Store.save();
    if (HR.Ads.noAds) HR.Ads.banner(false);
  },
  async restore() {
    const r = await this.provider.restore();
    if (!r.ok) { HR.UI.toast(HR.t('purchase_failed'), 'bad'); return; }
    HR.UI.toast(r.restored && r.restored.length ? HR.t('restored') : HR.t('nothing_restore'), 'good');
    HR.UI.refreshAll();
  },
  manage() { this.provider.manage(); }
};

/* ---------------- Ranking ---------------- */
HR.Leaderboard = {
  submit(score, meta) {
    if (score <= 0) return;
    const d = HR.Store.data;
    d.scores.push({ score, date: HR.U.dateKey(), phase: meta && meta.phase || 1 });
    d.scores.sort((a, b) => b.score - a.score);
    d.scores = d.scores.slice(0, 10);
    HR.Store.save();
    // Para ranking global real: enviar aqui para o backend (ver docs/PUBLICACAO.md)
  },
  local() { return HR.Store.data.scores; },
  global() {
    // Ranking demonstrativo determinístico por semana — substituir por backend.
    const week = Math.floor(Date.now() / (7 * 86400000));
    let seed = week * 7919;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const rows = [];
    for (let i = 0; i < 40; i++) {
      const name = HR.CONFIG.BOT_NAMES[Math.floor(rnd() * HR.CONFIG.BOT_NAMES.length)] + (rnd() < 0.5 ? String(Math.floor(rnd() * 99)) : '');
      const flag = HR.CONFIG.BOT_FLAGS[Math.floor(rnd() * HR.CONFIG.BOT_FLAGS.length)];
      const score = Math.floor(6 + Math.pow(rnd(), 2.2) * 190);
      rows.push({ name, flag, score, bot: true });
    }
    const me = { name: HR.Store.data.name || HR.t('you'), flag: '⭐', score: HR.Store.data.best, me: true, vip: HR.Store.data.vip };
    rows.push(me);
    rows.sort((a, b) => b.score - a.score);
    return { rows, myRank: rows.indexOf(me) + 1 };
  }
};

/* ---------------- Compartilhar ---------------- */
HR.Share = {
  async share(score) {
    const text = HR.t('share_text', { n: score, url: HR.CONFIG.SHARE_URL });
    HR.Analytics.log('share', { score });
    try {
      if (navigator.share) { await navigator.share({ text, title: HR.CONFIG.NAME }); return; }
    } catch (_) { /* usuário cancelou */ return; }
    try { await navigator.clipboard.writeText(text); HR.UI.toast(HR.t('copied'), 'good'); } catch (_) { /* sem clipboard */ }
  }
};
