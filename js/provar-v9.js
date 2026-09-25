/* =====================================================================
   ORBO v9 — provar antes de comprar.

   1) A CENA NO DETALHE. Tocar numa bola, rastro ou tema na loja abria o
      item sozinho, num quadradinho. Agora abre uma cena: o fundo, um arco,
      o rastro e a bola — com o item escolhido no lugar dele e o resto do
      que a pessoa ja usa. E como vai ficar, e nao como o item e.

   2) PROVAR NO MENU. O botao "Provar no menu" fecha a loja e veste o item
      no menu de verdade (a bola da vitrine, o rastro dela, o fundo), sem
      comprar nada. Uma faixa no alto diz o que esta sendo provado, e leva
      de volta para a loja, no mesmo item. Qualquer outra coisa (jogar,
      abrir outro painel) tira a roupa emprestada.

   Tudo por embrulho: ui-shop.js so ganhou o detalhe em volta.
   ===================================================================== */
(function () {
  if (!HR.UI || !HR.UI.openItemDetail) return;
  const U = HR.U, C = HR.CONFIG, TIPOS = { skins: 1, trails: 1, themes: 1 };
  const PREFIX = { skins: 'skin_', trails: 'trail_', themes: 'theme_' };
  const item = (type, id) => HR.Unlocks.catalog(type).find(i => i.id === id);
  const eq = () => HR.Store.data.equipped;
  const temaDe = id => C.THEMES.find(x => x.id === id) || C.THEMES[0];
  const bolaDe = id => C.SKINS.find(x => x.id === id) || C.SKINS[0];

  /* ---------------- 1) a cena no detalhe ---------------- */
  let cena = null;
  function monta(type, it, host) {
    const art = host.querySelector('.shop-detail-art'); if (!art) return;
    const w = Math.min(320, Math.max(220, (host.clientWidth || 300) - 28)), h = Math.round(w * 0.62), dpr = Math.min(2, window.devicePixelRatio || 1);
    const cv = document.createElement('canvas');
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.className = 'provar-cena';
    art.innerHTML = ''; art.classList.add('provar-art'); art.appendChild(cv);
    const tema = type === 'themes' ? it : temaDe(eq().theme);
    const bola = type === 'skins' ? it : bolaDe(eq().skin);
    const rastro = type === 'trails' ? it.id : (eq().trail || 'none');
    const bg = new HR.Render.Background(); bg.resize(w, h); bg.setTheme(tema); bg.setFx(tema.fx || null);
    const legenda = document.createElement('span'); legenda.className = 'provar-legenda';
    legenda.textContent = HR.t('provar_legenda');
    art.appendChild(legenda);
    cena = { cv, ctx: cv.getContext('2d'), w, h, dpr, bg, bola, rastro, grande: type === 'skins', last: performance.now() / 1000, raf: 0 };
    const loop = () => {
      if (!cena || !cena.cv.isConnected || !document.getElementById('modal-item').classList.contains('visible')) { cena = null; return; }
      desenha(cena); cena.raf = requestAnimationFrame(loop);
    };
    cena.raf = requestAnimationFrame(loop);
  }
  function desenha(S) {
    const now = performance.now() / 1000, dt = Math.min(0.05, now - S.last); S.last = now;
    const t = now, ctx = S.ctx, W = S.w, H = S.h;
    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    S.bg.update(dt, 90, { x: -1, y: 0 }, 0.25); S.bg.draw(ctx, t);
    // o rastro nasce como no jogo: um ponto por quadro, o mundo andando para tras
    const bx = W * 0.6, pts = [], vel = W * 1.6;
    let tt = t - 0.6, by = H * 0.52;
    for (let f = 0; f < 36; f++) {
      tt += 1 / 60; by = H * 0.52 + Math.sin(tt * 2.2) * H * 0.12;
      pts.push({ x: bx, y: by, t: tt }); if (pts.length > 22) pts.shift();
      for (const q of pts) q.x -= vel / 60 * 0.55;
    }
    // quando o item e a bola, ela e o assunto: maior
    const last = pts[pts.length - 1], r = H * (S.grande ? 0.15 : 0.1);
    // o arco em volta da bola: ela esta passando por ele
    const ring = { x: bx + H * 0.02, y: H * 0.52, r: H * 0.32, tilt: Math.sin(t * 0.5) * 0.35, accent: '#4cf0ff', color: '#4cf0ff', flash: 0, hit: false, type: 'plain' };
    HR.Render.drawRing(ctx, ring, 'back', {});
    if (S.rastro && S.rastro !== 'none') HR.Render.drawTrail(ctx, S.rastro, pts, S.bola, tt, 0.2);
    HR.Render.drawBall(ctx, last.x, last.y, r, S.bola, t, { vy: Math.cos(tt * 2.2) * H * 0.12 * 2.2 * 4 });
    HR.Render.drawRing(ctx, ring, 'front', {});
  }

  const openOrig = HR.UI.openItemDetail;
  HR.UI.openItemDetail = function (type, id) {
    const r = openOrig.apply(this, arguments);
    if (!TIPOS[type]) return r;
    const it = item(type, id), host = document.getElementById('item-detail');
    if (!it || !host) return r;
    try { monta(type, it, host); } catch (e) { console.warn('provar', e); }
    // o botao de provar, logo acima do preco
    const preco = host.querySelector('.detail-price');
    const b = U.el('button', 'btn btn-ghost provar-btn', '<span class="ic">' + HR.icon('eye') + '</span><span class="btn-label">' + HR.t('provar') + '</span>');
    b.addEventListener('click', e => { e.stopPropagation(); HR.Audio.sfx('click'); prova(type, id); });
    if (preco) host.insertBefore(b, preco); else host.appendChild(b);
    return r;
  };

  /* ---------------- 2) provar no menu ---------------- */
  let prov = null;
  function aplica() {
    const g = HR.game; if (!prov || !g || g.state !== 'idle') return;
    const it = item(prov.type, prov.id); if (!it) return;
    if (prov.type === 'skins') g.showcaseSkin = it;
    else if (prov.type === 'trails') g.trail = it.id;
    else if (prov.type === 'themes') { g.bg.setTheme(it); g.bg.setFx(it.fx || null); }
  }
  function faixa() {
    let f = document.getElementById('provar-faixa');
    if (!prov) { if (f) f.remove(); return; }
    if (!f) { f = document.createElement('div'); f.id = 'provar-faixa'; (document.getElementById('app') || document.body).appendChild(f); }
    const it = item(prov.type, prov.id), tem = HR.Unlocks.owned(prov.type, prov.id);
    f.innerHTML = '<span class="provar-txt"><small>' + esc(HR.t('provando')) + '</small><b>' + esc(HR.t(PREFIX[prov.type] + it.id)) + '</b></span>';
    if (tem) {
      const e = U.el('button', 'btn small-btn provar-eq', '<span class="btn-label">' + esc(HR.t('equip')) + '</span>');
      e.addEventListener('click', ev => { ev.stopPropagation(); const p = prov; tira(); HR.Unlocks.equip(p.type, p.id); HR.game.applyCosmetics(); HR.Audio.sfx('click'); HR.UI.refreshMenu && HR.UI.refreshMenu(); HR.UI.toast(HR.icon('check') + ' ' + HR.t('equipped'), 'good'); });
      f.appendChild(e);
    }
    const v = U.el('button', 'btn btn-ghost small-btn provar-volta', '<span class="btn-label">' + esc(HR.t('provar_volta')) + '</span>');
    v.addEventListener('click', ev => { ev.stopPropagation(); const p = prov; tira(); HR.Audio.sfx('click'); HR.UI.shopTab = p.type; HR.UI.open('shop'); setTimeout(() => HR.UI.openItemDetail(p.type, p.id), 60); });
    f.appendChild(v);
  }
  function prova(type, id) {
    if (HR.UI.closeItemDetail) HR.UI.closeItemDetail();
    HR.UI.goMenu();
    prov = { type, id };
    aplica(); faixa();
    HR.Analytics.log('try_on', { type, id });
  }
  function tira() {
    if (!prov) return;
    prov = null; faixa();
    const g = HR.game; if (g) { g.showcaseSkin = null; g.applyCosmetics(); }
  }
  HR.Provar = { prova, tira, ativo: () => !!prov };

  // o menu redesenha a vitrine de vez em quando (applyCosmetics): a roupa emprestada volta por cima
  if (HR.Game && HR.Game.prototype.applyCosmetics) {
    const ac = HR.Game.prototype.applyCosmetics;
    HR.Game.prototype.applyCosmetics = function () { const r = ac.apply(this, arguments); if (prov && this.state === 'idle') aplica(); return r; };
  }
  // qualquer caminho que sai do menu devolve tudo como estava
  ['open', 'startGame', 'startLevel', 'play'].forEach(k => {
    const o = HR.UI[k]; if (typeof o !== 'function') return;
    HR.UI[k] = function () { if (prov) tira(); return o.apply(this, arguments); };
  });

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
})();

Object.assign(HR.I18N.pt, { provar: 'Provar no menu', provando: 'Provando', provar_volta: 'Voltar à loja', provar_legenda: 'Com o que você já usa' });
Object.assign(HR.I18N.en, { provar: 'Try it on the menu', provando: 'Trying on', provar_volta: 'Back to shop', provar_legenda: 'With what you already use' });
Object.assign(HR.I18N.es, { provar: 'Probar en el menú', provando: 'Probando', provar_volta: 'Volver a la tienda', provar_legenda: 'Con lo que ya usas' });
