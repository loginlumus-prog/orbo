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
    // CrazyGames: o SDK tem de estar pronto antes do save (o save pode vir de la)
    if (HR.Platform && HR.Platform.ready) { try { await HR.Platform.ready; } catch (_) { /* segue sem */ } }
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

    // iPhone adicionado à tela de início: a barra de status fica POR CIMA do jogo e
    // aparelho sem entalhe devolve safe-area 0. Garante um respiro no topo.
    const standalone = navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
    if (standalone && /iPad|iPhone|iPod/.test(navigator.userAgent || '')) document.documentElement.classList.add('ios-app');

    // a página nunca rola: rolando, tudo "sobe" e o toque cai no lugar errado
    const unscroll = () => {
      const de = document.documentElement;
      if (window.scrollY || de.scrollTop || document.body.scrollTop) {
        try { window.scrollTo(0, 0); } catch (_) { /* nada */ }
        de.scrollTop = 0; document.body.scrollTop = 0;
      }
    };
    window.addEventListener('scroll', unscroll, { passive: true });
    document.addEventListener('focusin', () => setTimeout(unscroll, 0));

    // zoom: o Safari do iPhone ignora user-scalable=no desde o iOS 10. As
    // travas que ele respeita sao estas: o gesto de pinca e o duplo toque.
    const semZoom = e => { if (e.cancelable) e.preventDefault(); };
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => document.addEventListener(ev, semZoom, { passive: false }));
    document.addEventListener('dblclick', semZoom, { passive: false });
    document.addEventListener('touchmove', e => { if (e.touches && e.touches.length > 1) semZoom(e); }, { passive: false });

    // e se algum zoom escapar mesmo assim, o jogo volta sozinho para 1x:
    // mudar o maximum-scale obriga o iOS a reenquadrar a escala.
    const vv = window.visualViewport;
    const ampliado = () => !!(vv && vv.scale > 1.01);
    const vpMeta = document.querySelector('meta[name="viewport"]');
    const vpBase = vpMeta ? vpMeta.getAttribute('content') : '';
    let desfazendo = false;
    const desfazZoom = () => {
      if (!vpMeta || desfazendo || !ampliado()) return;
      desfazendo = true;
      vpMeta.setAttribute('content', vpBase.replace('maximum-scale=1', 'maximum-scale=1.01'));
      setTimeout(() => { vpMeta.setAttribute('content', vpBase); desfazendo = false; }, 60);
    };
    if (vv) { vv.addEventListener('resize', desfazZoom); vv.addEventListener('scroll', desfazZoom); }

    const relayout = () => { layout(); game.resize(); HR.UI.layoutShowcase(); setTimeout(() => HR.UI.layoutShowcase(), 160); if (HR.UI.stack.includes('galaxy') && HR.UI.renderGalaxy) HR.UI.renderGalaxy(); };
    window.addEventListener('resize', () => { if (!ampliado()) relayout(); });
    window.addEventListener('orientationchange', () => setTimeout(relayout, 250));
    let lastVw = window.innerWidth, lastVh = window.innerHeight;
    setInterval(() => {
      unscroll();
      // com zoom, innerWidth/innerHeight encolhem. Refazer o layout nesse estado
      // montava o jogo inteiro para uma tela de mentira — era o "bugou tudo".
      if (ampliado()) { desfazZoom(); return; }
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
    const noPortal = HR.Platform && HR.Platform.portal;   // portal serve de outro dominio, num iframe: cache proprio so atrapalha
    if (!noPortal && 'serviceWorker' in navigator && location.protocol.startsWith('http') && !isLocal) navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
