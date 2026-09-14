/* ===== Boot + loading ===== */
(function () {
  const C = HR.CONFIG;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  function layout() {
    const app = HR.U.$('#app');
    const vw = window.innerWidth, vh = window.innerHeight;
    let w = vw;
    if (vw / vh > C.MAX_ASPECT) w = Math.round(vh * C.MAX_ASPECT);
    app.style.width = w + 'px'; app.style.height = vh + 'px';
  }

  async function boot() {
    HR.Store.load();
    if (HR.Perf) HR.Perf.init();
    if (HR.Campaign && HR.Campaign.backfill) HR.Campaign.backfill();
    const s = HR.Store.data.settings;
    HR.setLang(s.lang || HR.detectLang());
    layout();

    const canvas = HR.U.$('#game');
    const game = new HR.Game(canvas);
    HR.game = game;
    HR.Input.attach(HR.U.$('#app'));
    HR.Ads.init(); HR.IAP.init();
    HR.Missions.ensureDaily();
    HR.UI.init(game);
    game.startAttract(); game.start();
    HR.UI.bind('version', HR.t('version', { v: C.VERSION }));
    HR.UI.bind('tagline', (C.TAGLINE && C.TAGLINE[HR.lang]) || C.TAGLINE.pt);
    HR.UI.layoutShowcase();

    const relayout = () => { layout(); game.resize(); HR.UI.layoutShowcase(); setTimeout(() => HR.UI.layoutShowcase(), 160); if (HR.UI.stack.includes('galaxy') && HR.UI.renderGalaxy) HR.UI.renderGalaxy(); };
    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', () => setTimeout(relayout, 250));
    let lastVw = window.innerWidth, lastVh = window.innerHeight;
    setInterval(() => {
      if (window.innerWidth !== lastVw || window.innerHeight !== lastVh) { lastVw = window.innerWidth; lastVh = window.innerHeight; relayout(); }
    }, 250);

    const unlock = () => { HR.Audio.unlock(); if (HR.Music && HR.UI.current === 'menu') HR.Music.play('menu'); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
    window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (!HR.NO_AUTOPAUSE && ['playing', 'ready', 'transition'].includes(game.state)) HR.UI.pause(); HR.Audio.suspend(); }
      else HR.Audio.resume();
    });

    // loading com progresso real (save → fontes → galáxia → áudio) e dicas rotativas
    HR.UI.rotateTip();
    const tipTimer = setInterval(() => HR.UI.rotateTip(), 4000);
    HR.UI.setLoading(0.15, HR.t('load_save'));
    await wait(200);
    HR.UI.setLoading(0.4, HR.t('load_fonts'));
    await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), wait(1500)]);
    HR.UI.layoutShowcase();
    HR.UI.setLoading(0.65, HR.t('load_galaxy'));
    HR.Campaign.all();
    await wait(200);
    HR.UI.setLoading(0.85, HR.t('load_audio'));
    await wait(250);
    HR.UI.setLoading(1, HR.t('load_ready'));
    await wait(450);
    clearInterval(tipTimer);

    HR.UI.goMenu();
    HR.Analytics.log('app_open', { runs: HR.Store.data.runs, level: HR.Store.data.level, lang: HR.lang, mode: HR.Store.data.mode });

    if (HR.Daily.status().vipToday) { const r = HR.Daily.claimVip(); if (r) HR.UI.toast(HR.icon('crown') + ' ' + HR.t('daily_bonus_vip') + ' +' + r.gems + ' <i class="ic-gem"></i>', 'good'); }
    if (HR.Daily.status().canClaim && HR.Store.data.runs > 0) setTimeout(() => HR.UI.toast(HR.icon('gift') + ' ' + HR.t('daily_reward'), 'good'), 600);

    const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname);
    if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !isLocal) navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
