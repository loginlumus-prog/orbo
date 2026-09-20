/* =====================================================================
   Loja v2: destaque do dia, cartões por raridade com preview animado,
   detalhe do item, habilidades (compra/melhoria/equipar) e gemas.
   Define em HR.UI: renderShop, startPreviews, stopPreviews, openItemDetail, closeItemDetail
   ===================================================================== */
(function () {
  const $ = (s, r) => HR.U.$(s, r);

  const RAR = {
    skins: { classic: 'common', soccer: 'common', neon: 'rare', lava: 'rare', ice: 'rare', gold: 'epic', galaxy: 'epic', ghost: 'epic', eye: 'legendary', rainbow: 'legendary', plasma: 'legendary', eight: 'common', moon: 'common', bee: 'rare', sun: 'rare', toxic: 'rare', saturn: 'epic', pearl: 'epic', void: 'legendary', comet: 'legendary', dragon: 'legendary', pumpkin: 'epic', candycane: 'epic', balloon: 'epic', confetti: 'epic', beach: 'epic' },
    trails: { none: 'common', dots: 'common', stars: 'rare', fire: 'rare', bubbles: 'epic', rainbow: 'legendary', comet: 'rare', petals: 'epic', lightning: 'legendary', snow: 'epic', bats: 'epic' },
    themes: { aurora: 'common', sunset: 'rare', ocean: 'rare', cyber: 'epic', space: 'epic', candy: 'legendary', forest: 'rare', inferno: 'epic', prism: 'legendary', halloween: 'epic', natal: 'epic' }
  };
  const PREFIX = { skins: 'skin_', trails: 'trail_', themes: 'theme_' };
  const FLAVOR = { skins: 'flavor_skin_', trails: 'flavor_trail_', themes: 'flavor_theme_' };

  function rarity(type, id) { const it = HR.Unlocks.catalog(type).find(i => i.id === id); if (it && it.rar) return it.rar; return (RAR[type] && RAR[type][id]) || 'common'; }
  function rewardText(item) { return item.cur === 'reward' ? HR.t('reward_galaxy', { name: HR.t('gal_' + HR.REGIONS[item.galaxy || 0].gal) }) : HR.t('reward_archon', { n: (item.layer || 0) + 1 }); }
  // botões de preço: moedas (grátis) · gemas (pago) · IAP; ou um só botão (equipar, bloqueado, prêmio)
  function priceArea(type, item, st) {
    const special = item.cur === 'reward' || item.cur === 'archon';
    if (st.equipped || st.owned || st.locked || special || item.cur === 'pack' || item.cur === 'iap') {
      const btn = HR.U.el('button', 'btn shop-price' + (st.equipped ? ' is-on' : st.owned ? ' is-owned' : item.cur === 'iap' && !st.locked ? ' is-iap' : ''));
      btn.innerHTML = st.equipped ? HR.UI.svg('check') + HR.t('equipped') : st.owned ? HR.t('equip') : st.locked ? HR.UI.svg('lock') + HR.t('locked_lvl', { n: item.lvl }) : special ? HR.UI.svg('lock') + HR.t('reward_only') : priceHtml(item);
      btn.disabled = st.locked || special || st.equipped;
      btn.addEventListener('click', e => { e.stopPropagation(); buyOrEquip(type, item); });
      return btn;
    }
    const row = HR.U.el('div', 'shop-price-row');
    const bc = HR.U.el('button', 'btn shop-price', '<i class="ic-coin"></i>' + HR.U.compact(item.price));
    bc.setAttribute('data-tip', HR.t('buy_coins') + ': ' + HR.U.fmt(item.price));
    bc.addEventListener('click', e => { e.stopPropagation(); buyOrEquip(type, item, 'coins'); }); row.appendChild(bc);
    if (item.gems > 0) { const bg = HR.U.el('button', 'btn shop-price is-gem', '<i class="ic-gem"></i>' + HR.U.fmt(item.gems)); bg.setAttribute('data-tip', HR.t('buy_gems') + ': ' + HR.U.fmt(item.gems)); bg.addEventListener('click', e => { e.stopPropagation(); buyOrEquip(type, item, 'gems'); }); row.appendChild(bg); }
    if (item.product) { const p = HR.IAP.product(item.product); if (p) { const bi = HR.U.el('button', 'btn shop-price is-iap', HR.IAP.price(p)); bi.addEventListener('click', e => { e.stopPropagation(); buyOrEquip(type, item, 'iap'); }); row.appendChild(bi); } }
    return row;
  }
  function rarColor(r) { return HR.RARITY[r] ? HR.RARITY[r].color : '#9aa6c9'; }
  function equippedSkin() { return HR.CONFIG.SKINS.find(s => s.id === HR.Store.data.equipped.skin) || HR.CONFIG.SKINS[0]; }
  function itemState(type, item) {
    const owned = HR.Unlocks.owned(type, item.id), equipped = HR.Unlocks.equipped(type) === item.id;
    const locked = !owned && HR.Store.data.level < item.lvl;
    const isNew = !owned && !locked && item.lvl === HR.Store.data.level && item.lvl > 1;
    return { owned, equipped, locked, isNew };
  }
  function priceHtml(item) { if (item.cur === 'iap') { const p = HR.IAP.product(item.product); return p ? HR.IAP.price(p) : ''; } return item.price === 0 ? HR.t('free') : '<i class="' + (item.cur === 'gems' ? 'ic-gem' : 'ic-coin') + '"></i>' + HR.U.fmt(item.price); }

  /* ---------------- previews (um único rAF) ---------------- */
  function makeCanvas(size) {
    const cv = document.createElement('canvas'); const dpr = Math.min(HR.Perf ? HR.Perf.dprCap() : 2, window.devicePixelRatio || 1);
    cv.width = size * dpr; cv.height = size * dpr; cv.style.width = size + 'px'; cv.style.height = size + 'px';
    cv._size = size; cv._dpr = dpr; return cv;
  }
  // só anima o que está visível (a loja tem 138 bolas)
  let io = null;
  function addPreview(cv, type, item, opts) {
    const p = Object.assign({ cv, type, item, seed: Math.random() * 10 }, opts || {}); HR.UI.previews.push(p);
    if ('IntersectionObserver' in window) {
      if (!io) io = new IntersectionObserver(es => es.forEach(e => { const pp = HR.UI.previews.find(x => x.cv === e.target); if (pp) pp.vis = e.isIntersecting; }), { rootMargin: '120px' });
      io.observe(cv);
    }
  }
  function drawPreview(p, t) {
    const cv = p.cv, S = cv._size, ctx = cv.getContext('2d');
    ctx.setTransform(cv._dpr, 0, 0, cv._dpr, 0, 0); ctx.clearRect(0, 0, S, S);
    if (p.type === 'themes') {
      if (!p.bg) { p.bg = new HR.Render.Background(); p.bg.resize(S, S); p.bg.setTheme(p.item); p.bg.setFx(p.item.fx || null); p.last = t; }
      const dt = Math.min(0.05, Math.max(0, t - p.last)); p.last = t;
      p.bg.update(dt, 70, { x: -1, y: 0 }, 0.15); p.bg.draw(ctx, t);
      return;
    }
    if (p.type === 'aegis' || p.type === 'jet') {
      const bx = S / 2 + (p.type === 'jet' ? S * 0.16 : 0), by = S / 2 + Math.sin(t * 2 + p.seed) * S * 0.03, br = S * 0.15, sk = equippedSkin();
      if (p.type === 'jet') { HR.Render.drawJet(ctx, bx, by, br, p.item, t, 1); HR.Render.drawBall(ctx, bx, by, br, sk, t, {}); }
      else { HR.Render.drawBall(ctx, bx, by, br, sk, t, {}); HR.Render.drawAegis(ctx, bx, by, br, p.item, t, 30); }
      return;
    }
    const cx = S / 2, cy = S / 2, r = S * (p.big ? 0.2 : 0.22);
    const fy = Math.sin(t * 2 + p.seed) * S * 0.04;
    const skin = p.type === 'skins' ? p.item : equippedSkin();
    const ring = p.big ? { x: cx, y: cy, r: r * 1.9, tilt: Math.sin(t * 0.5 + p.seed) * 0.6, accent: rarColor(rarity(p.type, p.item.id)), flash: 0, hit: false } : null;
    if (ring) HR.Render.drawRing(ctx, ring, 'back', {});
    if (p.type === 'trails' && p.item.id !== 'none') {
      const pts = [];
      for (let i = 0; i < 16; i++) { const k = 16 - i; pts.push({ x: cx - k * S * 0.045, y: cy + Math.sin(t * 2 + p.seed - k * 0.25) * S * 0.04, t: t - k * 0.03 }); }
      HR.Render.drawTrail(ctx, p.item.id, pts, skin, t);
    }
    HR.Render.drawBall(ctx, cx, cy + fy, r, skin, t + p.seed, { vy: Math.cos(t * 2 + p.seed) * 140 });
    if (ring) HR.Render.drawRing(ctx, ring, 'front', {});
  }
  function startPreviews() {
    if (HR.UI.previewRaf || !HR.UI.previews.length) return;
    // no Normal e no Baixo cada bola da loja é desenhada uma vez, quando entra na tela
    const loop = () => {
      const still = !!(HR.Perf && HR.Perf.lite && HR.Perf.lite()), t = still ? 0.7 : performance.now() / 1000;
      HR.UI.previews.forEach(p => {
        if (!p.cv.isConnected || (still && p.drawn)) return;
        if (p.vis !== false || !p.drawn) { drawPreview(p, t); p.drawn = true; }
      });
      HR.UI.previewRaf = requestAnimationFrame(loop);
    };
    HR.UI.previewRaf = requestAnimationFrame(loop);
  }
  function stopPreviews() { if (HR.UI.previewRaf) cancelAnimationFrame(HR.UI.previewRaf); HR.UI.previewRaf = null; HR.UI.previews = []; if (io) { io.disconnect(); io = null; } }

  /* ---------------- ações ---------------- */
  async function buyOrEquip(type, item, cur) {
    const st = itemState(type, item);
    if (st.equipped) return;
    if (st.owned) { HR.Unlocks.equip(type, item.id); HR.Audio.sfx('click'); }
    else {
      if (st.locked) { HR.UI.toast(HR.icon('lock') + ' ' + HR.t('locked_lvl', { n: item.lvl })); return; }
      if (item.cur === 'reward' || item.cur === 'archon') { HR.UI.toast(HR.icon('lock') + ' ' + rewardText(item)); return; }
      if (item.cur === 'iap' || cur === 'iap') { if (await HR.IAP.buy(item.product)) { HR.Unlocks.equip(type, item.id); HR.game.applyCosmetics(); HR.UI.refreshMenu(); HR.UI.closeItemDetail(); HR.UI.renderShop(); } return; }
      if (item.season && !HR.Seasons.isActive(item.season)) { HR.UI.toast(HR.icon('calendar') + ' ' + HR.t('season_only', { name: HR.t('season_' + item.season) })); return; }
      const useGems = cur === 'gems' || item.cur === 'gems';
      if (useGems) { const ok = await HR.UI.confirm(HR.t('confirm_buy_title'), HR.t('confirm_buy_text', { item: HR.t(PREFIX[type] + item.id), price: '<i class="ic-gem"></i> ' + HR.U.fmt(item.cur === 'gems' ? item.price : item.gems) })); if (!ok) return; }
      if (!HR.Unlocks.buy(type, item.id, useGems ? 'gems' : 'coins')) return;
      HR.UI.toast(HR.icon('check') + ' ' + HR.t('purchased'), 'good');
    }
    HR.game.applyCosmetics(); HR.UI.refreshMenu(); HR.UI.closeItemDetail(); HR.UI.renderShop();
  }

  /* ---------------- cartões ---------------- */
  function themeSwatchOld(item, big) { return themeSwatch(item, big); }
  function themeSwatch(item, big) {
    const sw = HR.U.el('div', 'shop-swatch' + (big ? ' big' : ''));
    sw.style.background = 'linear-gradient(180deg,' + item.colors.join(',') + ')';
    sw.innerHTML = '<i></i><i></i><i></i><i></i><i></i><b></b>';
    return sw;
  }
  function previewFor(type, item, size, big) {
    if (type === 'themes' && !HR.Render.Background) return themeSwatch(item, big);
    const cv = makeCanvas(size); addPreview(cv, type, item, { big }); cv.className = 'shop-preview'; return cv;
  }
  // v6.0: fundo por coleção atrás da bola — dá contraste e diz de onde ela é
  function stage(type, item, cv) {
    if (type !== 'skins' && type !== 'trails') return cv;
    const box = HR.U.el('span', 'shop-stage stage-' + (type === 'trails' ? 'trail' : (item.col || 'classic')));
    box.appendChild(cv);
    return box;
  }
  function card(type, item) {
    const st = itemState(type, item), rar = rarity(type, item.id);
    const el = HR.U.el('div', 'shop-card rar-' + rar + (st.equipped ? ' equipped' : '') + (st.locked ? ' locked' : ''));
    el.style.setProperty('--rc', rarColor(rar));
    el.appendChild(stage(type, item, previewFor(type, item, 120, false)));
    const tags = HR.U.el('div', 'shop-tags');
    if (st.locked) tags.appendChild(HR.U.el('span', 'shop-tag lock', HR.icon('lock') + ' ' + HR.t('locked_lvl', { n: item.lvl })));
    else if (item.season && !st.owned) tags.appendChild(HR.U.el('span', 'shop-tag season', HR.t('season_tag')));
    else if (item.cur === 'iap' && !st.owned) tags.appendChild(HR.U.el('span', 'shop-tag best', HR.t('premium_tag')));
    else if (st.isNew) tags.appendChild(HR.U.el('span', 'shop-tag new', HR.t('shop_new')));
    if (st.equipped) tags.appendChild(HR.U.el('span', 'shop-tag on', HR.t('equipped')));
    el.appendChild(tags);
    el.appendChild(HR.U.el('span', 'shop-rar', HR.t('rarity_' + rar)));
    el.appendChild(HR.U.el('b', 'shop-name', HR.t(PREFIX[type] + item.id)));
    if ((item.cur === 'reward' || item.cur === 'archon') && !st.owned) tags.appendChild(HR.U.el('span', 'shop-tag lock', HR.icon(item.cur === 'archon' ? 'sigil' : 'crown')));
    el.appendChild(priceArea(type, item, st));
    el.addEventListener('click', () => { HR.Audio.sfx('click'); HR.UI.openItemDetail(type, item.id); });
    return el;
  }
  function featured(type, list) {
    const d = HR.Store.data;
    const pool = list.filter(i => !HR.Unlocks.owned(type, i.id) && d.level >= i.lvl && !['pack', 'iap', 'reward', 'archon'].includes(i.cur) && i.rar !== 'ultimate');
    const seed = HR.U.dateKey().split('-').reduce((a, b) => a + parseInt(b, 10), 0) + type.length;
    const item = pool.length ? pool[seed % pool.length] : list.find(i => i.id === HR.Unlocks.equipped(type)) || list[0];
    const st = itemState(type, item), rar = rarity(type, item.id);
    const el = HR.U.el('div', 'shop-featured rar-' + rar); el.style.setProperty('--rc', rarColor(rar));
    const left = HR.U.el('div', 'shop-featured-art'); left.appendChild(stage(type, item, previewFor(type, item, 150, true))); el.appendChild(left);
    const info = HR.U.el('div', 'shop-featured-info');
    info.innerHTML = '<span class="shop-kicker">' + HR.t(pool.length ? 'shop_featured' : 'equipped') + '</span><b class="shop-featured-name">' + HR.t(PREFIX[type] + item.id) + '</b><span class="shop-rar">' + HR.t('rarity_' + rar) + '</span><p class="shop-flavor">' + HR.t(FLAVOR[type] + item.id) + '</p>';
    const btn = HR.U.el('button', 'btn shop-price' + (st.equipped ? ' is-on' : st.owned ? ' is-owned' : ''));
    btn.innerHTML = st.equipped ? HR.UI.svg('check') + HR.t('equipped') : st.owned ? HR.t('equip') : priceHtml(item);
    btn.addEventListener('click', e => { e.stopPropagation(); buyOrEquip(type, item); });
    info.appendChild(btn); el.appendChild(info);
    el.addEventListener('click', () => { HR.Audio.sfx('click'); HR.UI.openItemDetail(type, item.id); });
    return el;
  }
  function renderCosmetics(body, type) {
    let list = HR.Unlocks.catalog(type).filter(i => (i.cur !== 'pack' || HR.Unlocks.owned(type, i.id)) && (!i.season || HR.Seasons.isActive(i.season) || HR.Unlocks.owned(type, i.id)));
    const col = type === 'skins' ? (HR.UI.shopCol || 'all') : 'all';
    if (type === 'skins') {
      const chips = HR.U.el('div', 'col-chips');
      [{ id: 'all', icon: 'layers' }].concat(HR.COLLECTIONS || []).forEach(c => {
        const items = c.id === 'all' ? list : list.filter(i => i.col === c.id); if (!items.length) return;
        const own = items.filter(i => HR.Unlocks.owned('skins', i.id)).length;
        const b = HR.U.el('button', 'col-chip col-' + c.id + (col === c.id ? ' on' : ''), (HR.glyph ? HR.glyph(c.icon) : HR.icon(c.icon)) + '<span>' + HR.t('col_' + c.id) + '</span><b>' + own + '/' + items.length + '</b>');
        b.setAttribute('data-tip', HR.t('col_' + c.id)); b.setAttribute('data-tip-d', HR.t('col_progress', { a: own, b: items.length }));
        b.addEventListener('click', e => { e.stopPropagation(); HR.UI.shopCol = c.id; HR.Audio.sfx('click'); renderShop(); });
        chips.appendChild(b);
      });
      body.appendChild(chips);
      if (col !== 'all') list = list.filter(i => i.col === col);
    }
    if (col === 'all') body.appendChild(featured(type, list));
    const seasonal = list.filter(i => i.season && HR.Seasons.isActive(i.season));
    if (seasonal.length) { const S = HR.Seasons.current(); body.appendChild(HR.U.el('div', 'shop-season', '<span class="shop-season-ic">' + HR.icon('calendar') + '</span><span class="shop-season-txt"><b>' + HR.t('season_' + S.id) + '</b><small>' + HR.t('season_shop_note', { d: HR.Seasons.endLabel() }) + '</small></span>')); }
    // v5.2: itens da estação primeiro; o resto em seções por raridade (mais barato → mais caro), exclusivos no fim
    if (seasonal.length) { const sg = HR.U.el('div', 'shop-grid shop-grid-season'); seasonal.forEach(item => sg.appendChild(card(type, item))); body.appendChild(sg); }
    HR.UI.shopSections(body, list.filter(i => !seasonal.includes(i)), { rar: i => rarity(type, i.id), owned: i => HR.Unlocks.owned(type, i.id), special: i => ['iap', 'pack', 'reward', 'archon'].includes(i.cur), price: i => (!i.cur || i.cur === 'coins') ? (i.price || 0) : 0, lvl: i => i.lvl || 1, card: i => card(type, i), rerender: renderShop });
  }

  /* ---------------- detalhe ---------------- */
  function openItemDetail(type, id) {
    const item = HR.Unlocks.catalog(type).find(i => i.id === id); if (!item) return;
    const host = $('#item-detail'), modal = $('#modal-item');
    const st = itemState(type, item), rar = rarity(type, item.id);
    host.className = 'modal-card item-detail shop-detail rar-' + rar; host.style.cssText = '--rc:' + rarColor(rar);
    host.innerHTML = '';
    const art = HR.U.el('div', 'shop-detail-art'); art.appendChild(previewFor(type, item, 200, true)); host.appendChild(art);
    host.appendChild(HR.U.el('span', 'shop-rar', HR.t('rarity_' + rar)));
    host.appendChild(HR.U.el('h3', '', HR.t(PREFIX[type] + item.id)));
    host.appendChild(HR.U.el('p', 'shop-flavor', HR.t(FLAVOR[type] + item.id)));
    const meta = HR.U.el('div', 'shop-detail-meta');
    const colDef = item.col && HR.COLLECTIONS ? HR.COLLECTIONS.find(c => c.id === item.col) : null;
    meta.appendChild(HR.U.el('span', 'shop-chip', colDef ? HR.icon(colDef.icon) + ' ' + HR.t('col_' + colDef.id) : HR.icon(type === 'trails' ? 'trail' : 'palette') + ' ' + HR.t('tab_' + type)));
    if (item.lvl > 1) meta.appendChild(HR.U.el('span', 'shop-chip' + (st.locked ? ' bad' : ''), HR.icon(st.locked ? 'lock' : 'unlock') + ' ' + HR.t('locked_lvl', { n: item.lvl })));
    host.appendChild(meta);
    if (item.cur === 'reward' || item.cur === 'archon') host.appendChild(HR.U.el('p', 'lb-note', HR.icon(item.cur === 'archon' ? 'sigil' : 'crown') + ' ' + rewardText(item)));
    const pa = priceArea(type, item, st); pa.classList.add('detail-price'); host.appendChild(pa);
    const close = HR.U.el('button', 'btn btn-ghost', HR.t('close')); close.addEventListener('click', e => { e.stopPropagation(); closeItemDetail(); }); host.appendChild(close);
    if (!modal.dataset.shopBackdrop) { modal.dataset.shopBackdrop = '1'; modal.addEventListener('click', e => { if (e.target === modal && host.classList.contains('shop-detail')) closeItemDetail(); }); }
    modal.classList.add('visible'); startPreviews();
    HR.Analytics.log('item_detail', { type, id });
  }
  function closeItemDetail() {
    const host = $('#item-detail'), modal = $('#modal-item');
    if (!host.classList.contains('shop-detail')) return;
    modal.classList.remove('visible'); host.classList.remove('shop-detail');
    HR.UI.previews = HR.UI.previews.filter(p => !host.contains(p.cv));
  }

  /* ---------------- habilidades ---------------- */
  function renderAbilities(body) {
    const eq = HR.Abilities.equipped(), slots = HR.Abilities.slots(), d = HR.Store.data;
    body.appendChild(HR.U.el('p', 'shop-intro', HR.t('shop_ab_intro', { n: slots })));
    HR.ABILITIES.forEach(a => {
      const owned = HR.Abilities.owned(a.id), lv = HR.Abilities.level(a.id), locked = !owned && d.level < a.unlock.lvl;
      const slot = eq.indexOf(a.id);
      const el = HR.U.el('div', 'shop-ab' + (slot >= 0 ? ' equipped' : '') + (locked ? ' locked' : '')); el.style.setProperty('--ac', a.color);
      const dur = HR.Abilities.duration(a.id), cd = HR.Abilities.cooldown(a.id);
      el.innerHTML = '<div class="shop-ab-ic">' + HR.icon(a.icon) + '</div><div class="shop-ab-info"><b>' + HR.Abilities.name(a.id) + (slot >= 0 ? ' <span class="shop-tag on">' + HR.t('equipped_slot') + ' ' + (slot + 1) + '</span>' : '') + '</b><span class="shop-ab-desc">' + HR.Abilities.desc(a.id) + '</span>' +
        '<span class="shop-ab-stats"><span>' + HR.icon('refresh') + ' ' + HR.t('cooldown') + ' <b>' + cd.toFixed(0) + 's</b></span><span>' + (a.dur ? HR.icon('hourglass') + ' ' + HR.t('duration') + ' <b>' + dur.toFixed(1) + 's</b>' : HR.icon('bolt') + ' ' + HR.t('instant')) + '</span></span>' +
        '<span class="shop-ab-lv">' + HR.t('ab_level', { n: lv }) + ' <span class="shop-pips">' + [1, 2, 3].map(k => '<i class="' + (k <= lv ? 'on' : '') + '"></i>').join('') + '</span></span></div>';
      const actions = HR.U.el('div', 'shop-ab-actions');
      if (!owned) {
        const buy = HR.U.el('button', 'btn shop-price', locked ? HR.UI.svg('lock') + HR.t('unlock_at', { n: a.unlock.lvl }) : (a.unlock.price === 0 ? HR.t('free') : priceHtml({ price: a.unlock.price, cur: a.unlock.cur })));
        buy.disabled = locked;
        buy.addEventListener('click', async () => {
          if (a.unlock.cur === 'gems') { const ok = await HR.UI.confirm(HR.t('confirm_buy_title'), HR.t('confirm_buy_text', { item: HR.Abilities.name(a.id), price: '<i class="ic-gem"></i> ' + a.unlock.price })); if (!ok) return; }
          if (HR.Abilities.buy(a.id)) { HR.UI.toast(HR.icon('check') + ' ' + HR.t('purchased'), 'good'); HR.UI.rerenderAbilities(); }
        });
        actions.appendChild(buy);
      } else {
        if (slot < 0) {
          if (slots === 1) { const eqb = HR.U.el('button', 'btn shop-price is-owned', HR.t('equip')); eqb.addEventListener('click', () => { HR.Abilities.equip(0, a.id); HR.Audio.sfx('click'); HR.UI.rerenderAbilities(); }); actions.appendChild(eqb); }
          else for (let i = 0; i < 2; i++) { const eqb = HR.U.el('button', 'btn shop-price is-owned small', 'Slot ' + (i + 1)); eqb.addEventListener('click', () => { HR.Abilities.equip(i, a.id); HR.Audio.sfx('click'); HR.UI.rerenderAbilities(); }); actions.appendChild(eqb); }
        }
        const cost = HR.Abilities.upgradeCost(a.id);
        const up = HR.U.el('button', 'btn shop-price' + (cost == null ? ' is-on' : ''), cost == null ? HR.t('max_level') : HR.icon('arrowUp') + ' ' + HR.t('upgrade') + ' <i class="ic-coin"></i>' + HR.U.fmt(cost));
        up.disabled = cost == null;
        up.addEventListener('click', () => { if (HR.Abilities.upgrade(a.id)) { HR.UI.toast(HR.icon('arrowUp') + ' ' + HR.Abilities.name(a.id) + ' ' + HR.t('ab_level', { n: HR.Abilities.level(a.id) }), 'good'); HR.UI.rerenderAbilities(); } });
        actions.appendChild(up);
      }
      el.appendChild(actions); body.appendChild(el);
    });
    body.appendChild(HR.U.el('p', 'iap-note', HR.t('slot_locked_lvl', { n: HR.ABILITY_UPGRADE.secondSlotLevel })));
  }

  /* ---------------- itens: Égide, Jatos e seus visuais (v5) ---------------- */
  function renderGear(body) {
    const C = HR.GEAR.consumables;
    body.appendChild(HR.U.el('div', 'shop-section', HR.icon('bag') + ' ' + HR.t('gear_consumables')));
    body.appendChild(HR.U.el('p', 'shop-intro', HR.t('gear_consumables_d')));
    ['aegis', 'jet', 'megajet'].forEach(id => {
      const G = C[id], n = HR.Consumables.count(id);
      const el = HR.U.el('div', 'gear-card'); el.style.setProperty('--ac', G.color);
      el.innerHTML = HR.plate(G.icon, G.color, 'lg') + '<div class="gear-info"><b>' + HR.t(id) + ' <span class="gear-count">' + HR.t('gear_owned_n', { n }) + '</span></b><span>' + HR.t(id + '_d') + '</span></div>';
      const act = HR.U.el('div', 'gear-actions');
      const one = HR.U.el('button', 'btn shop-price', HR.t('gear_buy_one') + ' <i class="ic-coin"></i>' + HR.U.fmt(G.price));
      one.addEventListener('click', e => { e.stopPropagation(); if (HR.Consumables.buy(id, false)) { HR.UI.toast(HR.icon(G.icon) + ' +1 ' + HR.t(id), 'good'); renderShop(); } });
      const bun = HR.U.el('button', 'btn shop-price is-owned', HR.t('gear_bundle', { n: G.bundle.n }) + ' <i class="ic-coin"></i>' + HR.U.fmt(G.bundle.price));
      bun.addEventListener('click', e => { e.stopPropagation(); if (HR.Consumables.buy(id, true)) { HR.UI.toast(HR.icon(G.icon) + ' +' + G.bundle.n + ' ' + HR.t(id), 'good'); renderShop(); } });
      act.appendChild(one); act.appendChild(bun); el.appendChild(act); body.appendChild(el);
    });
    const skinSection = (kind, titleKey) => {
      body.appendChild(HR.U.el('div', 'shop-section', HR.icon(kind) + ' ' + HR.t(titleKey)));
      const mk = it => {
        const owned = HR.Gear.owned(kind, it.id), eq = HR.Gear.current(kind).id === it.id, rar = it.rar, name = HR.t((kind === 'jet' ? 'jetskin_' : 'aegisskin_') + it.id);
        const card = HR.U.el('div', 'shop-card rar-' + rar + (eq ? ' equipped' : '')); card.style.setProperty('--rc', rarColor(rar));
        const cv = makeCanvas(120); cv.className = 'shop-preview'; addPreview(cv, kind, it, {}); card.appendChild(cv);
        const tags = HR.U.el('div', 'shop-tags'); if (eq) tags.appendChild(HR.U.el('span', 'shop-tag on', HR.t('equipped'))); card.appendChild(tags);
        card.appendChild(HR.U.el('span', 'shop-rar', HR.t('rarity_' + rar)));
        card.appendChild(HR.U.el('b', 'shop-name', name));
        if (owned) {
          const b = HR.U.el('button', 'btn shop-price' + (eq ? ' is-on' : ' is-owned'), eq ? HR.UI.svg('check') + HR.t('equipped') : HR.t('equip')); b.disabled = eq;
          b.addEventListener('click', e => { e.stopPropagation(); HR.Gear.equip(kind, it.id); HR.Audio.sfx('click'); renderShop(); });
          card.appendChild(b);
        } else {
          const row = HR.U.el('div', 'shop-price-row');
          const bc = HR.U.el('button', 'btn shop-price', '<i class="ic-coin"></i>' + HR.U.compact(it.price));
          bc.addEventListener('click', e => { e.stopPropagation(); if (HR.Gear.buy(kind, it.id, 'coins')) { HR.UI.toast(HR.icon('check') + ' ' + name, 'good'); renderShop(); } });
          const bg = HR.U.el('button', 'btn shop-price is-gem', '<i class="ic-gem"></i>' + it.gems);
          bg.addEventListener('click', async e => { e.stopPropagation(); const ok = await HR.UI.confirm(HR.t('confirm_buy_title'), HR.t('confirm_buy_text', { item: name, price: '<i class="ic-gem"></i> ' + it.gems })); if (ok && HR.Gear.buy(kind, it.id, 'gems')) { HR.UI.toast(HR.icon('check') + ' ' + name, 'good'); renderShop(); } });
          row.appendChild(bc); row.appendChild(bg); card.appendChild(row);
        }
        return card;
      };
      HR.UI.shopSections(body, HR.Gear.list(kind), { filter: false, rar: it => it.rar, owned: it => HR.Gear.owned(kind, it.id), special: () => false, price: it => it.price || 0, lvl: () => 1, card: mk, rerender: renderShop });
    };
    skinSection('aegis', 'gear_aegis_skins');
    skinSection('jet', 'gear_jet_skins');
    body.appendChild(HR.U.el('p', 'iap-note', HR.t('gear_cosmetic_note')));
  }

  /* ---------------- gemas ---------------- */
  function renderGems(body) {
    const d = HR.Store.data;
    const pack = (art, name, desc, btnHtml, onClick, cls, tag) => {
      const el = HR.U.el('div', 'shop-pack' + (cls ? ' ' + cls : ''));
      el.innerHTML = '<div class="shop-pack-art">' + art + '</div><div class="shop-pack-info"><b>' + name + '</b>' + (desc ? '<span>' + desc + '</span>' : '') + '</div>';
      if (tag) el.appendChild(HR.U.el('span', 'shop-tag ' + (tag === 'best' ? 'best' : 'new'), HR.t(tag === 'best' ? 'best_value' : 'popular')));
      const btn = HR.U.el('button', 'btn shop-price' + (cls === 'reward' ? ' is-reward' : ''), btnHtml);
      btn.addEventListener('click', e => { e.stopPropagation(); onClick(); });
      el.appendChild(btn); body.appendChild(el);
    };
    const section = t => body.appendChild(HR.U.el('div', 'shop-section', t));
    const left = HR.Ads.freeGemsLeft();
    if (left > 0 && HR.Ads.isRewardedReady()) {
      pack(HR.icon('gift'), HR.t('free_gems'), HR.t('free_gems_left', { n: left }), HR.UI.svg('video') + '+' + HR.CONFIG.ADS.freeGems, async () => {
        const ok = await HR.Ads.showRewarded('free_gems');
        if (ok) { HR.Ads.useFreeGems(); HR.Economy.addGems(HR.CONFIG.ADS.freeGems, 'ad'); HR.Audio.sfx('reward'); HR.UI.toast(HR.t('ad_reward_gems', { n: HR.CONFIG.ADS.freeGems }), 'good'); HR.UI.renderShop(); }
      }, 'reward');
    }
    section('Premium');
    HR.CONFIG.PRODUCTS.forEach(p => {
      if (p.type === 'gems') return;
      if (p.id === 'starter_pack' && d.owned.skins.includes('plasma')) return;
      if (p.skins && p.skins.every(id => d.owned.skins.includes(id))) return;
      if (p.id === 'no_ads' && d.noAds) { pack(HR.icon('x'), HR.UI.productName(p), HR.t('no_ads_active'), HR.UI.svg('check'), () => {}, 'done'); return; }
      if (p.id === 'vip' && d.vip) { pack(HR.icon('crown'), HR.UI.productName(p), HR.t('vip_active'), HR.t('manage_sub'), () => HR.IAP.manage(), 'done'); return; }
      const art = p.skins ? HR.icon('ring') : HR.icon(p.id === 'starter_pack' ? 'gift' : p.id === 'vip' ? 'crown' : 'x');
      pack(art, HR.UI.productName(p), HR.t('prod_' + p.id + '_d'), HR.UI.productPrice(p), async () => { if (await HR.IAP.buy(p.id)) { HR.game.applyCosmetics(); HR.UI.refreshMenu(); HR.UI.renderShop(); } }, p.id === 'starter_pack' ? 'hot' : '', p.tag);
    });
    section(HR.t('tab_gems'));
    HR.CONFIG.PRODUCTS.filter(p => p.type === 'gems').forEach(p => {
      pack('<i class="ic-gem"></i>', HR.UI.productName(p), '', HR.UI.productPrice(p), async () => { if (await HR.IAP.buy(p.id)) HR.UI.renderShop(); }, p.tag === 'best' ? 'hot' : '', p.tag);
    });
    body.appendChild(HR.U.el('p', 'iap-note', HR.t('iap_note') + ' ' + HR.t('sub_note')));
  }

  /* ---------------- render principal ---------------- */
  function renderShop() {
    stopPreviews();
    HR.UI.setTab('shop-tabs', HR.UI.shopTab);
    const body = $('#shop-body'); body.innerHTML = '';
    const tab = HR.UI.shopTab;
    if (tab === 'skins' || tab === 'trails' || tab === 'themes') renderCosmetics(body, tab);
    else if (tab === 'abilities') renderAbilities(body);
    else if (tab === 'gear') renderGear(body);
    else renderGems(body);
    body.scrollTop = 0;
    startPreviews();
  }

  Object.assign(HR.UI, { renderShop, startPreviews, stopPreviews, openItemDetail, closeItemDetail, renderAbilityCards: renderAbilities, shopPreview: previewFor, gearPreview: (kind, it, size) => { const cv = makeCanvas(size); cv.className = 'shop-preview'; addPreview(cv, kind, it, {}); return cv; } });

  /* ---------------- textos ---------------- */
  Object.assign(HR.I18N.pt, {
    shop_featured: 'Destaque de hoje', shop_new: 'NOVO', shop_ab_intro: 'Equipe até {n} habilidade(s) e use com um toque durante a partida. Melhore para recarregar mais rápido e durar mais.',
    flavor_skin_classic: 'A original. Leve, brilhante e sempre pronta.', flavor_skin_neon: 'Luz pura em movimento. Deixa um brilho por onde passa.', flavor_skin_lava: 'Núcleo incandescente com rachaduras que pulsam.',
    flavor_skin_ice: 'Cristal congelado. Frio por fora, calmo por dentro.', flavor_skin_soccer: 'Um clássico dos campos, agora entre os arcos.', flavor_skin_gold: 'Ouro maciço. Para quem coleciona recordes.',
    flavor_skin_galaxy: 'Uma galáxia inteira girando na palma da mão.', flavor_skin_ghost: 'Meio transparente, totalmente misteriosa.', flavor_skin_eye: 'Ela vê tudo. Principalmente o centro do arco.',
    flavor_skin_rainbow: 'Todas as cores de uma vez. Impossível não notar.', flavor_skin_plasma: 'Energia instável em forma de bola. Exclusiva do Pacote Iniciante.',
    flavor_trail_none: 'Sem rastro. Só você e os arcos.', flavor_trail_dots: 'Pontos de luz que somem devagar.', flavor_trail_stars: 'Estrelinhas girando atrás de cada movimento.',
    flavor_trail_fire: 'Chamas que acompanham a velocidade.', flavor_trail_bubbles: 'Bolhas que sobem como num aquário.', flavor_trail_rainbow: 'Uma fita de arco-íris que nunca acaba.',
    flavor_theme_aurora: 'Céu profundo com luzes do norte.', flavor_theme_sunset: 'Ondas quentes de um fim de tarde.', flavor_theme_ocean: 'Águas profundas e bolhas subindo.',
    flavor_theme_cyber: 'Grade neon de uma cidade do futuro.', flavor_theme_space: 'Nebulosas e vazio infinito.', flavor_theme_candy: 'Doce, cor-de-rosa e brilhante.',
    flavor_skin_eight: 'A bola da sinuca. Some no bolso, volta pro arco.', flavor_skin_moon: 'Crateras e poeira. Um lado sempre para você.', flavor_skin_bee: 'Zumbe entre os arcos. Não pica.', flavor_skin_sun: 'Coroa de fogo que nunca apaga.', flavor_skin_toxic: 'Borbulha. Não beba.', flavor_skin_saturn: 'Com anéis próprios para combinar.', flavor_skin_pearl: 'Muda de cor conforme a luz.', flavor_skin_void: 'Um buraco negro de bolso. Não olhe muito.', flavor_skin_comet: 'Núcleo de gelo, cauda de luz. Exclusiva.', flavor_skin_dragon: 'Escamas de fogo e olhos de ouro. Exclusiva.', flavor_skin_pumpkin: 'Halloween. Sorri no escuro.', flavor_skin_candycane: 'Natal. Doce de menta em órbita.', flavor_skin_balloon: 'Festa Junina. Sobe com o vento.', flavor_skin_confetti: 'Carnaval. Chuva de cor a cada arco.', flavor_skin_beach: 'Verão. Sol, mar e listras.',
    flavor_trail_comet: 'Cauda de gelo brilhante.', flavor_trail_petals: 'Pétalas que dançam atrás de você.', flavor_trail_lightning: 'Raios que estalam a cada movimento.', flavor_trail_snow: 'Flocos de neve caindo devagar.', flavor_trail_bats: 'Morcegos que batem asas na noite.',
    flavor_theme_forest: 'Verde profundo com pólen no ar.', flavor_theme_inferno: 'Brasas subindo de um chão de fogo.', flavor_theme_prism: 'Cristais flutuando em luz rosada.', flavor_theme_halloween: 'Névoa roxa e lua de abóbora.', flavor_theme_natal: 'Noite de dezembro, verde e vermelha.'
  });
  Object.assign(HR.I18N.en, {
    shop_featured: "Today's pick", shop_new: 'NEW', shop_ab_intro: 'Equip up to {n} ability(ies) and use them with one tap during the run. Upgrade for faster recharge and longer duration.',
    flavor_skin_classic: 'The original. Light, bright and always ready.', flavor_skin_neon: 'Pure light in motion. Leaves a glow wherever it goes.', flavor_skin_lava: 'Molten core with cracks that pulse.',
    flavor_skin_ice: 'Frozen crystal. Cold outside, calm inside.', flavor_skin_soccer: 'A classic from the pitch, now between rings.', flavor_skin_gold: 'Solid gold. For record collectors.',
    flavor_skin_galaxy: 'A whole galaxy spinning in your palm.', flavor_skin_ghost: 'Half transparent, fully mysterious.', flavor_skin_eye: 'It sees everything. Mostly the ring center.',
    flavor_skin_rainbow: 'Every color at once. Impossible to miss.', flavor_skin_plasma: 'Unstable energy shaped like a ball. Starter Pack exclusive.',
    flavor_trail_none: 'No trail. Just you and the rings.', flavor_trail_dots: 'Dots of light fading slowly.', flavor_trail_stars: 'Little stars spinning behind every move.',
    flavor_trail_fire: 'Flames that follow your speed.', flavor_trail_bubbles: 'Bubbles rising like in an aquarium.', flavor_trail_rainbow: 'A rainbow ribbon that never ends.',
    flavor_theme_aurora: 'Deep sky with northern lights.', flavor_theme_sunset: 'Warm waves of a late afternoon.', flavor_theme_ocean: 'Deep waters and rising bubbles.',
    flavor_theme_cyber: 'Neon grid of a future city.', flavor_theme_space: 'Nebulae and endless void.', flavor_theme_candy: 'Sweet, pink and shiny.',
    flavor_skin_eight: 'The pool ball. Sinks in the pocket, comes back for the ring.', flavor_skin_moon: 'Craters and dust. One side always facing you.', flavor_skin_bee: 'Buzzes between rings. Does not sting.', flavor_skin_sun: 'A crown of fire that never goes out.', flavor_skin_toxic: 'It bubbles. Do not drink.', flavor_skin_saturn: 'Comes with its own rings.', flavor_skin_pearl: 'Shifts color with the light.', flavor_skin_void: 'A pocket black hole. Do not stare.', flavor_skin_comet: 'Ice core, tail of light. Exclusive.', flavor_skin_dragon: 'Fire scales and golden eyes. Exclusive.', flavor_skin_pumpkin: 'Halloween. Smiles in the dark.', flavor_skin_candycane: 'Christmas. Mint candy in orbit.', flavor_skin_balloon: 'June Festival. Rises with the wind.', flavor_skin_confetti: 'Carnival. A rain of color at every ring.', flavor_skin_beach: 'Summer. Sun, sea and stripes.',
    flavor_trail_comet: 'A bright icy tail.', flavor_trail_petals: 'Petals dancing behind you.', flavor_trail_lightning: 'Bolts crackling at every move.', flavor_trail_snow: 'Snowflakes falling slowly.', flavor_trail_bats: 'Bats flapping in the night.',
    flavor_theme_forest: 'Deep green with pollen in the air.', flavor_theme_inferno: 'Embers rising from a floor of fire.', flavor_theme_prism: 'Crystals floating in pink light.', flavor_theme_halloween: 'Purple mist and a pumpkin moon.', flavor_theme_natal: 'A December night, green and red.'
  });
  Object.assign(HR.I18N.es, {
    shop_featured: 'Destacado de hoy', shop_new: 'NUEVO', shop_ab_intro: 'Equipa hasta {n} habilidad(es) y úsalas con un toque durante la partida. Mejora para recargar más rápido y durar más.',
    flavor_skin_classic: 'La original. Ligera, brillante y siempre lista.', flavor_skin_neon: 'Luz pura en movimiento. Deja un brillo por donde pasa.', flavor_skin_lava: 'Núcleo incandescente con grietas que laten.',
    flavor_skin_ice: 'Cristal congelado. Frío por fuera, calmo por dentro.', flavor_skin_soccer: 'Un clásico del campo, ahora entre los aros.', flavor_skin_gold: 'Oro macizo. Para coleccionistas de récords.',
    flavor_skin_galaxy: 'Una galaxia entera girando en tu mano.', flavor_skin_ghost: 'Medio transparente, totalmente misteriosa.', flavor_skin_eye: 'Lo ve todo. Sobre todo el centro del aro.',
    flavor_skin_rainbow: 'Todos los colores a la vez. Imposible no verla.', flavor_skin_plasma: 'Energía inestable con forma de bola. Exclusiva del Pack Inicial.',
    flavor_trail_none: 'Sin estela. Solo tú y los aros.', flavor_trail_dots: 'Puntos de luz que se apagan despacio.', flavor_trail_stars: 'Estrellitas girando tras cada movimiento.',
    flavor_trail_fire: 'Llamas que siguen tu velocidad.', flavor_trail_bubbles: 'Burbujas que suben como en un acuario.', flavor_trail_rainbow: 'Una cinta de arcoíris que nunca termina.',
    flavor_theme_aurora: 'Cielo profundo con auroras.', flavor_theme_sunset: 'Olas cálidas de un atardecer.', flavor_theme_ocean: 'Aguas profundas y burbujas subiendo.',
    flavor_theme_cyber: 'Rejilla neón de una ciudad futura.', flavor_theme_space: 'Nebulosas y vacío infinito.', flavor_theme_candy: 'Dulce, rosa y brillante.',
    flavor_skin_eight: 'La bola de billar. Cae en la tronera y vuelve al aro.', flavor_skin_moon: 'Cráteres y polvo. Un lado siempre hacia ti.', flavor_skin_bee: 'Zumba entre los aros. No pica.', flavor_skin_sun: 'Corona de fuego que nunca se apaga.', flavor_skin_toxic: 'Burbujea. No beber.', flavor_skin_saturn: 'Con anillos propios para combinar.', flavor_skin_pearl: 'Cambia de color con la luz.', flavor_skin_void: 'Un agujero negro de bolsillo. No mires mucho.', flavor_skin_comet: 'Núcleo de hielo, cola de luz. Exclusiva.', flavor_skin_dragon: 'Escamas de fuego y ojos de oro. Exclusiva.', flavor_skin_pumpkin: 'Halloween. Sonríe en la oscuridad.', flavor_skin_candycane: 'Navidad. Caramelo de menta en órbita.', flavor_skin_balloon: 'Fiesta de Junio. Sube con el viento.', flavor_skin_confetti: 'Carnaval. Lluvia de color en cada aro.', flavor_skin_beach: 'Verano. Sol, mar y rayas.',
    flavor_trail_comet: 'Cola de hielo brillante.', flavor_trail_petals: 'Pétalos que bailan detrás de ti.', flavor_trail_lightning: 'Rayos que chasquean a cada movimiento.', flavor_trail_snow: 'Copos de nieve cayendo despacio.', flavor_trail_bats: 'Murciélagos batiendo alas en la noche.',
    flavor_theme_forest: 'Verde profundo con polen en el aire.', flavor_theme_inferno: 'Brasas subiendo de un suelo de fuego.', flavor_theme_prism: 'Cristales flotando en luz rosada.', flavor_theme_halloween: 'Niebla morada y luna de calabaza.', flavor_theme_natal: 'Noche de diciembre, verde y roja.'
  });
})();
