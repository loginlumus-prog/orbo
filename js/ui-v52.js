/* =====================================================================
   ORBO v5.2: menu vivo e loja organizada.
   Menu: botões da órbita coloridos com glifos vetoriais animados, anel com lua, cometas
   percorrendo a órbita e poeira de estrelas. Recordes viram ícones com dica; a descrição
   do modo sai da tela e vai para a dica dos botões de modo (toque longo / hover).
   Loja: abas com ícone, filtro Todos / À venda / Meus e seções por raridade
   (mais barato primeiro), exclusivos no fim. Define em HR.UI: shopSections
   ===================================================================== */
(function () {
  window.HR = window.HR || {};
  HR.UI = HR.UI || {};
  const $ = (s, r) => HR.U.$(s, r), $$ = (s, r) => HR.U.$$(s, r);
  const n2 = v => +v.toFixed(2);
  const starD = (cx, cy, R, r, k) => { let d = ''; for (let i = 0; i < k * 2; i++) { const a = (-90 + i * 180 / k) * Math.PI / 180, rr = i % 2 ? r : R; d += (i ? 'L' : 'M') + n2(cx + Math.cos(a) * rr) + ' ' + n2(cy + Math.sin(a) * rr); } return d + 'Z'; };
  const sparkD = (x, y, s) => { const q = s * 0.22; return 'M' + x + ' ' + n2(y - s) + 'Q' + n2(x + q) + ' ' + n2(y - q) + ' ' + n2(x + s) + ' ' + y + 'Q' + n2(x + q) + ' ' + n2(y + q) + ' ' + x + ' ' + n2(y + s) + 'Q' + n2(x - q) + ' ' + n2(y + q) + ' ' + n2(x - s) + ' ' + y + 'Q' + n2(x - q) + ' ' + n2(y - q) + ' ' + x + ' ' + n2(y - s) + 'Z'; };
  const svg = inner => '<svg class="og" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';

  /* ---------------- glifos animados da órbita (grade 24, mesmo traço dos ORBO Glyphs) ---------------- */
  // .b corpo tingido · .w branco sólido · .gd traço dourado · og-* partes animadas (CSS)
  const GLYPH = {
    shop: '<g class="og-bob"><path class="b" d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/><path class="w og-twinkle" d="' + starD(12, 14.4, 3, 1.3, 5) + '"/></g><path class="w og-spark" d="' + sparkD(20, 4.2, 1.9) + '"/><path class="w og-spark s2" d="' + sparkD(3.9, 5.2, 1.3) + '"/>',
    missions: '<path d="M6 21.5V3.5"/><path class="b og-wave" d="M6 4.5c2.5-1.3 4.6-1.3 6.8 0s4.3 1.3 6.2 0v7.5c-1.9 1.3-4 1.3-6.2 0s-4.3-1.3-6.8 0"/><path d="M3.5 21.5h5"/><path class="w og-spark" d="' + sparkD(19.4, 17.4, 1.7) + '"/><path class="w og-spark s2" d="' + sparkD(14.8, 20.2, 1.1) + '"/>',
    daily: '<path class="b" d="M4.5 11h15v8.5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5Z"/><path class="gd" d="M12 11V21"/><g class="og-lid"><path class="b" d="M3.5 7.5h17V11h-17Z"/><path class="gd" d="M12 7.5C10.5 4 7 3.3 6.6 5.4 6.3 7.2 9.4 7.5 12 7.5Zm0 0c1.5-3.5 5-4.2 5.4-2.1.3 1.8-2.8 2.1-5.4 2.1Z"/></g><path class="w og-spark" d="' + sparkD(20.2, 3.4, 1.6) + '"/><path class="w og-spark s2" d="' + sparkD(3.6, 3.6, 1.1) + '"/>',
    collection: '<circle class="b og-pop" cx="7.4" cy="7.6" r="3.4"/><circle class="b og-pop p2" cx="16.6" cy="7.6" r="3.4"/><circle class="b og-pop p3" cx="7.4" cy="16.6" r="3.4"/><g class="og-spin"><circle cx="16.6" cy="16.6" r="3.4" stroke-dasharray="2.6 2.74"/></g><path d="M16.6 15v3.2M15 16.6h3.2"/><circle class="w" cx="6.4" cy="6.6" r=".8"/>',
    leaderboard: '<path class="b og-rise p2" d="M3.5 21v-6h5.5v6"/><path class="b og-rise" d="M9 21V11h6v10"/><path class="b og-rise p3" d="M15 21v-4.5h5.5V21"/><path d="M2.5 21h19"/><path class="w og-float" d="' + starD(12, 5.6, 3.1, 1.35, 5) + '"/>',
    galaxy: '<circle class="b og-pulse" cx="12" cy="12" r="5.4" stroke="none"/><g class="og-rot"><path d="M12 9.6c3.2-.4 6.2 1.6 6.6 4.6.5 3.6-2.4 6.6-6.2 6.8-4.9.3-8.9-3.4-9.4-8"/><path d="M12 14.4c-3.2.4-6.2-1.6-6.6-4.6-.5-3.6 2.4-6.6 6.2-6.8 4.9-.3 8.9 3.4 9.4 8"/></g><circle class="w" cx="12" cy="12" r="2.2"/><circle class="w og-tw" cx="20.4" cy="4.6" r="1"/><circle class="w og-tw t2" cx="3.8" cy="19.4" r=".9"/>',
    abilities: '<path class="b og-zap" d="M13.2 2.8 6.5 13h4.8l-1 8.2 7.2-10.4h-4.9Z"/><path class="og-arc" d="M4.2 8.2A9 9 0 0 1 8 4.3"/><path class="og-arc a2" d="M19.8 15.8A9 9 0 0 1 16 19.7"/><path class="w og-spark" d="' + sparkD(19.6, 5, 1.4) + '"/>',
    trophies: '<defs><clipPath id="ogCupClip"><path d="M7 3.5h10v5.5a5 5 0 0 1-10 0Z"/></clipPath></defs><path class="b" d="M7 3.5h10v5.5a5 5 0 0 1-10 0Z"/><path d="M7 5H4.5v1.2A3.2 3.2 0 0 0 7.4 9.4M17 5h2.5v1.2a3.2 3.2 0 0 1-2.9 3.2"/><path d="M12 14v3.5M8.5 20.5h7M9.6 20.5l.7-3h3.4l.7 3"/><g clip-path="url(#ogCupClip)"><path class="og-shine" d="M9 16 15 1" stroke="#fff" stroke-width="2.6"/></g><path class="w og-twinkle" d="' + starD(12, 8.3, 2.5, 1.05, 5) + '"/>'
  };
  const COLOR = { shop: '#ff5fc8', missions: '#ff9a3d', daily: '#ff5d6c', leaderboard: '#35d6ff', galaxy: '#6f8bff', abilities: '#3ee89a', trophies: '#ffc53d', collection: '#a78bfa' };
  const SPIN = { shop: 11, missions: 9, daily: 13, leaderboard: 10, galaxy: 15, abilities: 8, trophies: 12, collection: 14 };
  const RING = '<svg class="ob-ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="t" cx="50" cy="50" r="47"/><circle class="a" cx="50" cy="50" r="47" stroke-dasharray="46 249"/><circle class="m" cx="50" cy="3" r="3.4"/></svg>';
  const COMET = '<svg class="orbit-comet" aria-hidden="true"><ellipse class="oc-tail" data-ph="0"/><ellipse class="oc-head" data-ph="0"/><ellipse class="oc-tail dim" data-ph="0.5"/><ellipse class="oc-head dim" data-ph="0.5"/></svg>';

  function orbitVars(b, c) {
    const U = HR.U, set = (k, v) => b.style.setProperty(k, v);
    set('--oc', c); set('--ol', U.mix(c, '#ffffff', 0.5));
    set('--oc-top', U.mix(c, '#141a44', 0.42)); set('--oc-bot', U.mix(c, '#070a1c', 0.8));
    set('--oc-glow', U.rgba(c, 0.55)); set('--oc-halo', U.rgba(c, 0.3));
    set('--oc-rim', U.rgba(c, 0.8)); set('--oc-rim2', U.rgba(c, 0.32)); set('--oc-sh', U.mix(c, '#000000', 0.8));
  }
  function dust(scene) {
    const box = HR.U.el('div', 'menu-dust'); let seed = 91, h = '';
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const cols = Object.keys(COLOR).map(k => COLOR[k]).concat(['#ffffff', '#ffffff', '#ffffff']);
    for (let i = 0; i < 18; i++) h += '<i style="left:' + (4 + rnd() * 92).toFixed(1) + '%;top:' + (4 + rnd() * 92).toFixed(1) + '%;--s:' + (1.6 + rnd() * 2.2).toFixed(1) + 'px;--c:' + cols[Math.floor(rnd() * cols.length)] + ';--d:' + (3 + rnd() * 4).toFixed(1) + 's;--dl:-' + (rnd() * 7).toFixed(1) + 's"></i>';
    box.innerHTML = h; scene.insertBefore(box, scene.firstChild);
  }
  // cometas: elipse no tamanho real da órbita (1 unidade = 1 px), traço curto que percorre o perímetro
  let cometKey = '';
  function layoutComet(scene) {
    const cs = scene && $('.orbit-comet', scene); if (!cs) return;
    const Rx = parseFloat(scene.style.getPropertyValue('--Rx')), Ry = parseFloat(scene.style.getPropertyValue('--Ry'));
    if (!(Rx > 0 && Ry > 0)) return;
    const key = Rx + 'x' + Ry; if (key === cometKey) return; cometKey = key;
    const a = Rx - 1, b = Ry - 1, per = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
    cs.setAttribute('viewBox', '0 0 ' + Rx * 2 + ' ' + Ry * 2);
    $$('ellipse', cs).forEach(e => {
      const head = e.classList.contains('oc-head'), L = head ? 12 : 64, off = -(parseFloat(e.getAttribute('data-ph')) * per + (head ? 52 : 0));
      e.setAttribute('cx', Rx); e.setAttribute('cy', Ry); e.setAttribute('rx', a); e.setAttribute('ry', b);
      e.setAttribute('stroke-dasharray', L + ' ' + (per - L).toFixed(1));
      e.style.setProperty('--o0', off.toFixed(1) + 'px'); e.style.setProperty('--o1', (off - per).toFixed(1) + 'px');
    });
  }
  const TIPKEY = { best: 'best', rank: 'ranking', starsTotal: 'stars' };
  const chip = (bind, icon) => '<span class="st-chip st-' + bind + '" data-tip-tap="1"><span class="ic">' + HR.icon(icon, '', icon === 'star') + '</span><b data-bind="' + bind + '">0</b></span>';

  function decorate() {
    const scene = $('#scene'); if (!scene) return;
    document.documentElement.classList.toggle('fx-low', !!(HR.Perf && HR.Perf.level === 0));
    if (scene.dataset.v52) return;
    scene.dataset.v52 = '1';
    $$('.orbit-btn', scene).forEach((b, i) => {
      const open = b.getAttribute('data-open'), key = open === 'achievements' ? (b.getAttribute('data-tab') === 'skins' ? 'collection' : 'trophies') : open;
      if (!GLYPH[key]) return;
      orbitVars(b, COLOR[key]); b.classList.add('ob-' + key); if (i % 2) b.classList.add('rev');
      b.style.setProperty('--os', SPIN[key] + 's');
      const circle = $('.ob-circle', b), ic = circle && $('.ic', circle); if (!ic) return;
      ic.removeAttribute('data-icon'); ic.innerHTML = svg(GLYPH[key]);
      circle.insertAdjacentHTML('afterbegin', RING);
    });
    dust(scene);
    const line = $('#orbit-line'); if (line) line.innerHTML = COMET;
    const st = $('.stats-line'); if (st) st.innerHTML = chip('best', 'crown') + chip('rank', 'rank') + chip('starsTotal', 'star');
  }
  function tips() {
    $$('.st-chip').forEach(c => { const k = c.className.match(/st-(best|rank|starsTotal)\b/); if (k) c.setAttribute('data-tip', HR.t(TIPKEY[k[1]])); });
    $$('#mode-seg .mode-btn').forEach(b => { const m = b.getAttribute('data-mode'); b.setAttribute('data-tip', HR.t('mode_' + m)); b.setAttribute('data-tip-d', HR.t('mode_' + m + '_d')); });
  }
  const origRefresh = HR.UI.refreshMenu;
  HR.UI.refreshMenu = function () { decorate(); const r = origRefresh.apply(this, arguments); tips(); return r; };
  const origLayout = HR.UI.layoutOrbit;
  HR.UI.layoutOrbit = function (scene) { const r = origLayout.apply(this, arguments); layoutComet(scene); return r; };

  /* ---------------- loja: abas com ícone ---------------- */
  const TAB = { skins: ['ball', '#4cf0ff'], trails: ['trail', '#ff9a3d'], themes: ['palette', '#a78bfa'], gear: ['aegis', '#3ee89a'], abilities: ['powers', '#ffd23f'], gems: ['gem', '#c38bff'] };
  function decorateShopTabs() {
    const tabs = $('#shop-tabs'); if (!tabs || tabs.dataset.v52) return;
    tabs.dataset.v52 = '1'; tabs.classList.add('tabs-ic');
    $$('.tab', tabs).forEach(t => {
      const T = TAB[t.getAttribute('data-tab')]; if (!T) return;
      const key = t.getAttribute('data-i18n');
      t.style.setProperty('--tc', T[1]);
      t.innerHTML = HR.icon(T[0]) + '<span' + (key ? ' data-i18n="' + key + '"' : '') + '>' + t.textContent + '</span>';
      t.removeAttribute('data-i18n');
    });
  }
  const origShop = HR.UI.renderShop;
  HR.UI.renderShop = function () { decorateShopTabs(); return origShop.apply(this, arguments); };

  /* ---------------- loja: seções por raridade ---------------- */
  const ORDER = ['common', 'rare', 'epic', 'legendary', 'mythic', 'ultimate'];
  const TIER_IC = { common: 'ring', rare: 'gem', epic: 'prism', legendary: 'starGlow', mythic: 'flame', ultimate: 'blackhole', exclusive: 'crown' };
  function tierHead(r, own, total, price) {
    const col = r === 'exclusive' ? '#ffcf4a' : (HR.RARITY[r] ? HR.RARITY[r].color : '#9aa6c9'), done = total > 0 && own === total;
    const el = HR.U.el('div', 'sh-tier' + (done ? ' done' : ''));
    el.style.setProperty('--rc', col); el.style.setProperty('--rc-bg', HR.U.rgba(col, 0.16)); el.style.setProperty('--rc-line', HR.U.rgba(col, 0.42));
    el.innerHTML = '<span class="sh-gem">' + HR.icon(TIER_IC[r] || 'ring') + '</span>' +
      '<span class="sh-main"><b>' + HR.t(r === 'exclusive' ? 'sf_exclusive' : 'rarity_' + r) + '</b><i class="sh-bar"><span style="width:' + (total ? own / total * 100 : 0).toFixed(0) + '%"></span></i></span>' +
      (price ? '<span class="sh-price">' + price + '</span>' : '') +
      '<span class="sh-count">' + (done ? HR.icon('check') : '') + own + '/' + total + '</span>';
    return el;
  }
  function priceLabel(items, o) {
    const ps = items.map(o.price).filter(p => p > 0); if (!ps.length) return '';
    const lo = Math.min.apply(null, ps), hi = Math.max.apply(null, ps);
    return '<i class="ic-coin"></i>' + HR.U.compact(lo) + (hi > lo ? ' – ' + HR.U.compact(hi) : '');
  }
  // o: { rar, owned, special, price, lvl, card, rerender, filter (padrão true) }
  function shopSections(body, items, o) {
    const useFilter = o.filter !== false, filt = useFilter ? (HR.UI.shopFilter || 'all') : 'all';
    if (useFilter) {
      const bar = HR.U.el('div', 'shop-filter');
      [['all', 'layers', items.length], ['sale', 'bag', items.filter(i => !o.owned(i) && !o.special(i)).length], ['mine', 'check', items.filter(o.owned).length]].forEach(f => {
        const b = HR.U.el('button', 'sf-btn' + (filt === f[0] ? ' on' : ''), HR.icon(f[1]) + '<span>' + HR.t('sf_' + f[0]) + '</span><b>' + f[2] + '</b>');
        b.type = 'button';
        b.addEventListener('click', e => { e.stopPropagation(); if (filt === f[0]) return; HR.UI.shopFilter = f[0]; HR.Audio.sfx('click'); if (o.rerender) o.rerender(); });
        bar.appendChild(b);
      });
      body.appendChild(bar);
    }
    const pass = i => filt === 'all' || (filt === 'mine' ? o.owned(i) : !o.owned(i) && !o.special(i));
    const byPrice = (a, b) => o.price(a) - o.price(b) || o.lvl(a) - o.lvl(b);
    let any = false;
    const section = (key, all, sorter) => {
      const vis = all.filter(pass).sort(sorter); if (!vis.length) return;
      any = true;
      body.appendChild(tierHead(key, all.filter(o.owned).length, all.length, key === 'exclusive' ? '' : priceLabel(all, o)));
      const grid = HR.U.el('div', 'shop-grid'); vis.forEach(i => grid.appendChild(o.card(i))); body.appendChild(grid);
    };
    ORDER.forEach(r => section(r, items.filter(i => !o.special(i) && o.rar(i) === r), byPrice));
    const odd = items.filter(i => !o.special(i) && ORDER.indexOf(o.rar(i)) < 0);
    if (odd.length) section('common', odd, byPrice);
    section('exclusive', items.filter(o.special), (a, b) => ORDER.indexOf(o.rar(a)) - ORDER.indexOf(o.rar(b)));
    if (!any && useFilter) body.appendChild(HR.U.el('p', 'shop-empty', HR.icon(filt === 'mine' ? 'bag' : 'check') + '<span>' + HR.t(filt === 'mine' ? 'sf_empty_mine' : 'sf_empty_sale') + '</span>'));
  }
  HR.UI.shopSections = shopSections;

  Object.assign(HR.I18N.pt, { sf_all: 'Todos', sf_sale: 'À venda', sf_mine: 'Meus', sf_exclusive: 'Exclusivos', sf_empty_mine: 'Você ainda não tem nada desta aba.', sf_empty_sale: 'Tudo desta aba já é seu.' });
  Object.assign(HR.I18N.en, { sf_all: 'All', sf_sale: 'For sale', sf_mine: 'Owned', sf_exclusive: 'Exclusive', sf_empty_mine: "You don't own anything from this tab yet.", sf_empty_sale: 'You already own everything here.' });
  Object.assign(HR.I18N.es, { sf_all: 'Todos', sf_sale: 'En venta', sf_mine: 'Míos', sf_exclusive: 'Exclusivos', sf_empty_mine: 'Aún no tienes nada de esta pestaña.', sf_empty_sale: 'Todo lo de esta pestaña ya es tuyo.' });
})();
