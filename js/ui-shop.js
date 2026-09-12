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

  function rarity(type, id) { return (RAR[type] && RAR[type][id]) || 'common'; }
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
    const cv = document.createElement('canvas'); const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = size * dpr; cv.height = size * dpr; cv.style.width = size + 'px'; cv.style.height = size + 'px';
    cv._size = size; cv._dpr = dpr; return cv;
  }
  function addPreview(cv, type, item, opts) { HR.UI.previews.push(Object.assign({ cv, type, item, seed: Math.random() * 10 }, opts || {})); }
  function drawPreview(p, t) {
    const cv = p.cv, S = cv._size, ctx = cv.getContext('2d');
    ctx.setTransform(cv._dpr, 0, 0, cv._dpr, 0, 0); ctx.clearRect(0, 0, S, S);
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
    HR.Render.drawBall(ctx, cx, cy + fy, r, skin, t + p.seed, { vy: Math.cos(t * 2 + p.seed) * 600 });
    if (ring) HR.Render.drawRing(ctx, ring, 'front', {});
  }
  function startPreviews() {
    if (HR.UI.previewRaf || !HR.UI.previews.length) return;
    const loop = () => { const t = performance.now() / 1000; HR.UI.previews.forEach(p => { if (p.cv.isConnected) drawPreview(p, t); }); HR.UI.previewRaf = requestAnimationFrame(loop); };
    HR.UI.previewRaf = requestAnimationFrame(loop);
  }
  function stopPreviews() { if (HR.UI.previewRaf) cancelAnimationFrame(HR.UI.previewRaf); HR.UI.previewRaf = null; HR.UI.previews = []; }

  /* ---------------- ações ---------------- */
  async function buyOrEquip(type, item) {
    const st = itemState(type, item);
    if (st.equipped) return;
    if (st.owned) { HR.Unlocks.equip(type, item.id); HR.Audio.sfx('click'); }
    else {
      if (st.locked) { HR.UI.toast(HR.icon('lock') + ' ' + HR.t('locked_lvl', { n: item.lvl })); return; }
      if (item.cur === 'iap') { if (await HR.IAP.buy(item.product)) { HR.Unlocks.equip(type, item.id); HR.game.applyCosmetics(); HR.UI.refreshMenu(); HR.UI.closeItemDetail(); HR.UI.renderShop(); } return; }
      if (item.season && !HR.Seasons.isActive(item.season)) { HR.UI.toast(HR.icon('calendar') + ' ' + HR.t('season_only', { name: HR.t('season_' + item.season) })); return; }
      if (item.cur === 'gems') { const ok = await HR.UI.confirm(HR.t('confirm_buy_title'), HR.t('confirm_buy_text', { item: HR.t(PREFIX[type] + item.id), price: '<i class="ic-gem"></i> ' + item.price })); if (!ok) return; }
      if (!HR.Unlocks.buy(type, item.id)) return;
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
    if (type === 'themes') return themeSwatch(item, big);
    const cv = makeCanvas(size); addPreview(cv, type, item, { big }); cv.className = 'shop-preview'; return cv;
  }
  function card(type, item) {
    const st = itemState(type, item), rar = rarity(type, item.id);
    const el = HR.U.el('div', 'shop-card rar-' + rar + (st.equipped ? ' equipped' : '') + (st.locked ? ' locked' : ''));
    el.style.setProperty('--rc', rarColor(rar));
    el.appendChild(previewFor(type, item, 120, false));
    const tags = HR.U.el('div', 'shop-tags');
    if (st.locked) tags.appendChild(HR.U.el('span', 'shop-tag lock', HR.icon('lock') + ' ' + HR.t('locked_lvl', { n: item.lvl })));
    else if (item.season && !st.owned) tags.appendChild(HR.U.el('span', 'shop-tag season', HR.t('season_tag')));
    else if (item.cur === 'iap' && !st.owned) tags.appendChild(HR.U.el('span', 'shop-tag best', HR.t('premium_tag')));
    else if (st.isNew) tags.appendChild(HR.U.el('span', 'shop-tag new', HR.t('shop_new')));
    if (st.equipped) tags.appendChild(HR.U.el('span', 'shop-tag on', HR.t('equipped')));
    el.appendChild(tags);
    el.appendChild(HR.U.el('span', 'shop-rar', HR.t('rarity_' + rar)));
    el.appendChild(HR.U.el('b', 'shop-name', HR.t(PREFIX[type] + item.id)));
    const btn = HR.U.el('button', 'btn shop-price' + (st.equipped ? ' is-on' : st.owned ? ' is-owned' : ''));
    btn.innerHTML = st.equipped ? HR.UI.svg('check') + HR.t('equipped') : st.owned ? HR.t('equip') : st.locked ? HR.UI.svg('lock') : priceHtml(item);
    btn.disabled = st.locked;
    btn.addEventListener('click', e => { e.stopPropagation(); buyOrEquip(type, item); });
    el.appendChild(btn);
    el.addEventListener('click', () => { HR.Audio.sfx('click'); HR.UI.openItemDetail(type, item.id); });
    return el;
  }
  function featured(type, list) {
    const d = HR.Store.data;
    const pool = list.filter(i => !HR.Unlocks.owned(type, i.id) && d.level >= i.lvl && i.cur !== 'pack' && i.cur !== 'iap');
    const seed = HR.U.dateKey().split('-').reduce((a, b) => a + parseInt(b, 10), 0) + type.length;
    const item = pool.length ? pool[seed % pool.length] : list.find(i => i.id === HR.Unlocks.equipped(type)) || list[0];
    const st = itemState(type, item), rar = rarity(type, item.id);
    const el = HR.U.el('div', 'shop-featured rar-' + rar); el.style.setProperty('--rc', rarColor(rar));
    const left = HR.U.el('div', 'shop-featured-art'); left.appendChild(previewFor(type, item, 150, true)); el.appendChild(left);
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
    const list = HR.Unlocks.catalog(type).filter(i => (i.cur !== 'pack' || HR.Unlocks.owned(type, i.id)) && (!i.season || HR.Seasons.isActive(i.season) || HR.Unlocks.owned(type, i.id)));
    body.appendChild(featured(type, list));
    const seasonal = list.filter(i => i.season && HR.Seasons.isActive(i.season));
    if (seasonal.length) { const S = HR.Seasons.current(); body.appendChild(HR.U.el('div', 'shop-season', '<span class="shop-season-ic">' + HR.icon('calendar') + '</span><span class="shop-season-txt"><b>' + HR.t('season_' + S.id) + '</b><small>' + HR.t('season_shop_note', { d: HR.Seasons.endLabel() }) + '</small></span>')); }
    const grid = HR.U.el('div', 'shop-grid');
    list.forEach(item => grid.appendChild(card(type, item)));
    body.appendChild(grid);
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
    meta.appendChild(HR.U.el('span', 'shop-chip', HR.icon(type === 'skins' ? 'ring' : type === 'trails' ? 'sparkle' : 'layers') + ' ' + HR.t('tab_' + (type === 'skins' ? 'balls' : type))));
    if (item.lvl > 1) meta.appendChild(HR.U.el('span', 'shop-chip' + (st.locked ? ' bad' : ''), HR.icon(st.locked ? 'lock' : 'unlock') + ' ' + HR.t('locked_lvl', { n: item.lvl })));
    host.appendChild(meta);
    const btn = HR.U.el('button', 'btn' + (st.equipped ? ' btn-ghost' : ''));
    btn.innerHTML = st.equipped ? HR.UI.svg('check') + HR.t('equipped') : st.owned ? HR.t('equip') : st.locked ? HR.UI.svg('lock') + HR.t('locked_lvl', { n: item.lvl }) : HR.t('buy') + ' · ' + priceHtml(item);
    btn.disabled = st.locked || st.equipped;
    btn.addEventListener('click', e => { e.stopPropagation(); buyOrEquip(type, item); });
    host.appendChild(btn);
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
    const E = HR.CONFIG.ECONOMY;
    section(HR.t('exchange_title'));
    pack(HR.icon('refresh'), HR.t('exchange', { g: E.exchangeGems, c: E.exchangeCoins }), '', '<i class="ic-gem"></i>' + E.exchangeGems, () => { if (HR.Economy.exchange()) HR.UI.renderShop(); });
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
    else renderGems(body);
    body.scrollTop = 0;
    startPreviews();
  }

  Object.assign(HR.UI, { renderShop, startPreviews, stopPreviews, openItemDetail, closeItemDetail, renderAbilityCards: renderAbilities, shopPreview: previewFor });

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
