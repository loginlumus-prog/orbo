/* =====================================================================
   ORBO — a camada de plataforma.

   O mesmo jogo sai para quatro lugares, e cada um tem regra diferente:

     web         o site no GitHub Pages. Sem loja de verdade: nao ha como
                 cobrar ali, entao os pacotes pagos somem.
     crazygames  anuncio SO pelo SDK deles (e regra do portal: nenhum outro
                 anuncio, nenhuma compra fora, nenhum link para fora).
     itch        sem anuncio nenhum. Quem quiser apoiar, apoia na pagina.
     newgrounds  sem anuncio dentro do jogo. O Newgrounds poe os dele em
                 volta da pagina e divide com o autor.

   A plataforma vem de window.HR_PLATFORM, que o tools/build.js escreve no
   index.html de cada versao. No codigo-fonte ela nao existe: e 'web'.

   Tudo por embrulho. services.js, ui.js e ui-shop.js nao sao tocados.
   ===================================================================== */
(function () {
  const P = String(window.HR_PLATFORM || 'web');
  const nativo = !!(HR.U && HR.U.isCapacitor && HR.U.isCapacitor());
  const portal = P === 'crazygames' || P === 'itch' || P === 'newgrounds';
  // o app nativo continua com RevenueCat; em qualquer navegador nao ha como cobrar
  const semLoja = !nativo;
  const LINKS = window.HR_LINKS || {};
  const U = HR.U;

  HR.Platform = {
    id: P, portal, semLoja,
    sdk: null,
    ready: Promise.resolve(),
    // link de apoio (itch/newgrounds): vem do tools/plataformas.json
    apoio: LINKS.apoio || ''
  };

  /* ---------------- CrazyGames: o SDK ---------------- */
  if (P === 'crazygames') {
    const SDK = () => window.CrazyGames && window.CrazyGames.SDK;
    HR.Platform.ready = (async () => {
      const s = SDK();
      if (!s) return;
      try {
        await s.init();
        if (s.environment === 'disabled') return;
        HR.Platform.sdk = s;
        try { s.game.loadingStart(); } catch (_) { /* nada */ }
      } catch (_) { /* sem SDK: o jogo roda igual, so sem anuncio */ }
    })();

    // o save: o modulo de dados deles sincroniza entre aparelhos para quem
    // tem conta. Sem o modulo ligado na submissao, cai no localStorage.
    const dados = () => { const s = HR.Platform.sdk; return s && s.data ? s.data : null; };
    const K = HR.CONFIG.SAVE_KEY;
    const loadOrig = HR.Store.load.bind(HR.Store);
    HR.Store.load = function () {
      const d = dados();
      if (d) {
        try {
          const v = d.getItem(K);
          if (v) { try { localStorage.setItem(K, v); } catch (_) { /* nada */ } }
          else { const loc = localStorage.getItem(K); if (loc) d.setItem(K, loc); }
        } catch (_) { /* modulo desligado: segue com o local */ }
      }
      return loadOrig.apply(this, arguments);
    };
    const saveOrig = HR.Store.save.bind(HR.Store);
    HR.Store.save = function () {
      const r = saveOrig.apply(this, arguments);
      const d = dados();
      if (d && this.data) { try { d.setItem(K, JSON.stringify(this.data)); } catch (_) { /* limite ou desligado */ } }
      return r;
    };

    // o anuncio: som mudo enquanto passa, e nenhum outro jeito de mostrar
    let mudo = false;
    const cala = () => { mudo = true; try { HR.Audio.suspend(); } catch (_) { /* nada */ } };
    const volta = () => { mudo = false; try { HR.Audio.resume(); } catch (_) { /* nada */ } };
    // o jogo retoma o audio sozinho quando a aba volta; durante o anuncio, nao
    const resumeOrig = HR.Audio.resume.bind(HR.Audio);
    HR.Audio.resume = function () { if (mudo) return; return resumeOrig.apply(this, arguments); };

    HR.CrazyAdProvider = class {
      init() { this.basico = false; }
      pronto() { return !!HR.Platform.sdk && !this.basico; }
      isRewardedReady() { return this.pronto(); }
      isInterstitialReady() { return this.pronto(); }
      pede(tipo) {
        return new Promise(res => {
          const s = HR.Platform.sdk;
          if (!s) { res(false); return; }
          let fim = false;
          const acaba = ok => { if (fim) return; fim = true; volta(); res(ok); };
          try {
            s.ad.requestAd(tipo, {
              adStarted: () => cala(),
              adFinished: () => acaba(true),
              adError: e => {
                // no Lancamento Basico o portal nao serve anuncio: os botoes
                // de "assistir" somem de vez, em vez de falhar toda vez
                if (e === 'adsDisabledBasicLaunch' || (e && e.code === 'adsDisabledBasicLaunch')) this.basico = true;
                acaba(false);
              }
            });
          } catch (_) { acaba(false); }
        });
      }
      showInterstitial() { return this.pede('midgame'); }
      showRewarded() { return this.pede('rewarded'); }
      showBanner() { HR.UI.setBanner(false); }
      hideBanner() { HR.UI.setBanner(false); }
    };

    // "jogando" e "parado", do jeito que o portal quer saber
    let jogando = false;
    setInterval(() => {
      const s = HR.Platform.sdk, g = HR.game;
      if (!s || !g) return;
      const agora = !g.demo && ['playing', 'ready', 'transition', 'perk'].indexOf(g.state) >= 0 && !document.hidden;
      if (agora === jogando) return;
      jogando = agora;
      try { agora ? s.game.gameplayStart() : s.game.gameplayStop(); } catch (_) { /* nada */ }
    }, 400);

    // a carga termina quando o menu aparece pela primeira vez
    const goMenu = HR.UI.goMenu;
    let carregou = false;
    HR.UI.goMenu = function () {
      const r = goMenu.apply(this, arguments);
      if (!carregou) { carregou = true; const s = HR.Platform.sdk; if (s) { try { s.game.loadingStop(); } catch (_) { /* nada */ } } }
      return r;
    };
  }

  /* ---------------- sem anuncio (itch, newgrounds) ---------------- */
  HR.NoAdProvider = class {
    init() {}
    isRewardedReady() { return false; }
    isInterstitialReady() { return false; }
    showInterstitial() { return Promise.resolve(false); }
    showRewarded() { return Promise.resolve(false); }
    showBanner() { HR.UI.setBanner(false); }
    hideBanner() { HR.UI.setBanner(false); }
  };

  if (portal) {
    const initOrig = HR.Ads.init.bind(HR.Ads);
    HR.Ads.init = function () {
      if (P === 'crazygames') this.provider = new HR.CrazyAdProvider();
      else if (P === 'itch' || P === 'newgrounds') this.provider = new HR.NoAdProvider();
      else return initOrig();
      this.provider.init();
    };
  }

  /* ---------------- sem loja de verdade ---------------- */
  if (semLoja) {
    // as bolas que so saiam por dinheiro passam a sair por moeda ou gema,
    // senao "Todas as bolas" ficaria impossivel
    const preco = HR.SKIN_PRICE || {};
    (HR.CONFIG.SKINS || []).forEach(s => {
      if (s.cur !== 'iap' && s.cur !== 'pack') return;
      if (!s.rar || s.rar === 'common') s.rar = 'epic';
      const Pr = preco[s.rar] || preco.epic;
      s.cur = 'coins'; s.price = Pr[0]; s.gems = Pr[1];
      delete s.product;
    });
    HR.CONFIG.PRODUCTS = [];
    HR.IAP.product = () => null;

    // a aba de gemas: sem pacote pago, ela explica de onde a gema vem
    const renderShop = HR.UI.renderShop;
    HR.UI.renderShop = function () {
      const r = renderShop.apply(this, arguments);
      if (HR.UI.shopTab !== 'gems') return r;
      const body = document.getElementById('shop-body');
      if (!body) return r;
      U.$$('.shop-section, .iap-note', body).forEach(n => n.remove());
      const box = U.el('div', 'plat-gemas');
      box.innerHTML = '<h4>' + HR.icon('gem') + '<span>' + esc(HR.t('plat_gem_t')) + '</span></h4>' +
        '<ul>' + ['plat_gem_1', 'plat_gem_2', 'plat_gem_3', 'plat_gem_4'].map(k => '<li>' + esc(HR.t(k)) + '</li>').join('') + '</ul>';
      body.appendChild(box);
      apoioCard(body);
      return r;
    };

    // Ajustes: sem "restaurar compras", sem link para fora
    const renderSettings = HR.UI.renderSettings;
    HR.UI.renderSettings = function () {
      const r = renderSettings.apply(this, arguments);
      const body = document.getElementById('settings-body') || document.querySelector('#screen-settings .settings-body');
      if (!body) return r;
      const fora = [HR.t('restore'), HR.t('manage_sub'), HR.t('terms')];
      if (portal) fora.push(HR.t('privacy'));
      U.$$('.setting-link', body).forEach(b => { if (fora.indexOf(b.textContent) >= 0) b.remove(); });
      if (!portal) {
        // no site, o link de privacidade leva para a politica que existe de verdade
        U.$$('.setting-link', body).forEach(b => {
          if (b.textContent !== HR.t('privacy')) return;
          const n = b.cloneNode(true);
          n.addEventListener('click', () => { HR.Audio.sfx('click'); window.open(HR.CONFIG.PRIVACY_URL, '_blank'); });
          b.parentNode.replaceChild(n, b);
        });
      }
      const nota = body.querySelector('.lb-note');
      if (nota && (nota.textContent === HR.t('vip_active') || nota.textContent === HR.t('no_ads_active'))) nota.remove();
      if (portal) { const v = body.querySelector('.version'); if (v) apoioCard(body, v); }
      return r;
    };
  }

  /* ---------------- portal: nada aponta para fora ---------------- */
  if (portal) {
    // o ranking de demonstracao (nomes inventados) nao vai para um portal:
    // la aparece so o que e seu
    if (HR.Online) {
      HR.Online.demo = function () { return { rows: [], online: false, first: null }; };
    }
    // compartilhar mandaria um link para fora do portal
    HR.Share.share = function () { return Promise.resolve(); };
    const esconde = () => { const b = document.getElementById('btn-share'); if (b) b.style.display = 'none'; };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', esconde); else esconde();
  }

  /* ---------------- o cartao de apoio ---------------- */
  function apoioCard(host, antes) {
    if (P !== 'itch' && P !== 'newgrounds') return;
    const c = U.el('div', 'plat-apoio');
    c.innerHTML = '<b>' + HR.icon('heart') + '<span>' + esc(HR.t('plat_apoio_t')) + '</span></b><p>' + esc(HR.t(P === 'itch' ? 'plat_apoio_itch' : 'plat_apoio_ng')) + '</p>';
    if (HR.Platform.apoio) {
      const b = U.el('button', 'btn small-btn', '<span class="btn-label">' + esc(HR.t('plat_apoio_btn')) + '</span>');
      b.addEventListener('click', () => { HR.Audio.sfx('click'); window.open(HR.Platform.apoio, '_blank'); });
      c.appendChild(b);
    }
    if (antes && antes.parentNode === host) host.insertBefore(c, antes); else host.appendChild(c);
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
})();

Object.assign(HR.I18N.pt, {
  plat_gem_t: 'De onde vêm as gemas',
  plat_gem_1: 'Conquistas e cada nível que você sobe.',
  plat_gem_2: 'Missões e o presente de todo dia.',
  plat_gem_3: 'Contratos, estrelas das fases e Arcontes.',
  plat_gem_4: 'A Chuva de gemas, um evento raro no meio das fases.',
  plat_apoio_t: 'Gostou do ORBO?',
  plat_apoio_itch: 'O jogo é inteiro de graça e sem anúncio. Se quiser apoiar, dá para contribuir na página do jogo, logo abaixo.',
  plat_apoio_ng: 'O jogo é inteiro de graça e sem anúncio dentro. Uma nota e um comentário na página já ajudam muito.',
  plat_apoio_btn: 'Apoiar o ORBO'
});
Object.assign(HR.I18N.en, {
  plat_gem_t: 'Where gems come from',
  plat_gem_1: 'Achievements and every level you gain.',
  plat_gem_2: 'Missions and the daily gift.',
  plat_gem_3: 'Contracts, level stars and Archons.',
  plat_gem_4: 'The Gem Shower, a rare event in the middle of levels.',
  plat_apoio_t: 'Enjoying ORBO?',
  plat_apoio_itch: 'The whole game is free and ad-free. If you want to support it, you can chip in on the game page, right below.',
  plat_apoio_ng: 'The whole game is free, with no ads inside. A rating and a comment on the page already help a lot.',
  plat_apoio_btn: 'Support ORBO'
});
Object.assign(HR.I18N.es, {
  plat_gem_t: 'De dónde salen las gemas',
  plat_gem_1: 'Logros y cada nivel que subes.',
  plat_gem_2: 'Misiones y el regalo de cada día.',
  plat_gem_3: 'Contratos, estrellas de los niveles y Arcontes.',
  plat_gem_4: 'La Lluvia de gemas, un evento raro en medio de los niveles.',
  plat_apoio_t: '¿Te gusta ORBO?',
  plat_apoio_itch: 'El juego es entero gratis y sin anuncios. Si quieres apoyarlo, puedes aportar en la página del juego, justo abajo.',
  plat_apoio_ng: 'El juego es entero gratis, sin anuncios dentro. Una nota y un comentario en la página ya ayudan mucho.',
  plat_apoio_btn: 'Apoyar ORBO'
});
