/* =====================================================================
   ORBO v5.4: Galáxia navegável em dois níveis, com a mesma linguagem visual.
   - Tela da galáxia: os 10 sistemas viram estrelas em órbita; o sistema do chefe fica no centro.
   - Tela do sistema: as 10 fases viram mundos em órbita; a última (o chefe) fica no centro.
   Câmera: tocar num sistema aproxima até ele e a tela seguinte abre continuando a aproximação;
   voltar sai de dentro do sistema visitado e se afasta até o mapa inteiro. Canvas e rótulos
   usam a mesma escala e o mesmo ponto de foco, então tudo se move junto.
   Botão de voltar dentro do próprio mapa. Os botões dos corpos continuam em DOM, então
   toque, dicas e bloqueio seguem pelo mesmo código de sempre.
   Envolve HR.UI.renderRegion e HR.UI.renderSystem: troca só o bloco da lista (.lv-path).
   ===================================================================== */
(function () {
  const $ = (s, r) => HR.U.$(s, r);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const POOL = { world: ['planets', 'nebulae'], sun: ['stars'], core: ['blackholes'] };
  const TAU = Math.PI * 2;
  let view = null, raf = null, ro = null, backFrom = null;

  const reduceMotion = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const perfLow = () => !!(HR.Perf && HR.Perf.level === 0);
  const perfLite = () => !!(HR.Perf && HR.Perf.lite && HR.Perf.lite());
  const ease = k => 1 - Math.pow(1 - k, 3);

  function skinFrom(cols, seedStr, i) {
    const pool = HR.CONFIG.SKINS.filter(s => cols.indexOf(s.col) >= 0);
    if (!pool.length) return HR.CONFIG.SKINS[0];
    let h = 7;
    for (let k = 0; k < seedStr.length; k++) h = (h * 31 + seedStr.charCodeAt(k)) % 100000;
    return pool[(h + i * 17) % pool.length];
  }
  const equippedSkin = () => HR.CONFIG.SKINS.find(s => s.id === HR.Store.data.equipped.skin) || HR.CONFIG.SKINS[0];

  /* ---------------- órbita: 9 em volta, o último no centro ---------------- */
  function layout(W) {
    const H = Math.round(Math.min(Math.max(W * 1.04, 330), 480));
    const cx = W / 2, cy = H / 2 - 4;
    const r = W < 330 ? 23 : 26, cr = r * 1.62, Rr = Math.min(W, H) * 0.355;
    const pts = [];
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + i * (TAU / 9);
      pts.push({ x: cx + Math.cos(a) * Rr, y: cy + Math.sin(a) * Rr * 0.9, r, a });
    }
    pts.push({ x: cx, y: cy, r: cr, a: 0, center: true });
    return { pts, cx, cy, Rr, H, W };
  }

  /* ---------------- fundo e corpos (desenhados uma vez) ---------------- */
  function buildSky(W, H, R) {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'), U = HR.U;
    let seed = 991; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const g = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * 0.78);
    g.addColorStop(0, U.mix(R.accent, '#070b1c', 0.74));
    g.addColorStop(0.55, '#070b1c');
    g.addColorStop(1, '#04060f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) {
      const x = rnd() * W, y = rnd() * H, rr = 70 + rnd() * 130;
      const col = [R.accent, R.colors[0] || R.accent, R.colors[1] || R.accent][i % 3];
      const ng = ctx.createRadialGradient(x, y, 0, x, y, rr);
      ng.addColorStop(0, U.rgba(col, 0.15)); ng.addColorStop(1, U.rgba(col, 0));
      ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill();
    }
    const n = perfLow() ? 60 : 130;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = 'rgba(255,255,255,' + (0.16 + rnd() * 0.6).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, rnd() * 1.2 + 0.35, 0, TAU); ctx.fill();
    }
    return cv;
  }
  // canvas com folga (o brilho não é cortado) e escurecido dentro de um círculo, sem quadrado
  function buildArt(skin, r, locked, seed, dpr) {
    const pad = r * 1.9, size = Math.ceil(pad * 2 * dpr);
    const cv = document.createElement('canvas');
    cv.width = size; cv.height = size;
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    HR.Render.drawBall(ctx, pad, pad, r * 0.94, skin, seed, {});
    if (locked) {
      ctx.save();
      ctx.beginPath(); ctx.arc(pad, pad, r * 1.45, 0, TAU); ctx.clip();
      ctx.fillStyle = 'rgba(8,12,26,0.6)'; ctx.fillRect(0, 0, pad * 2, pad * 2);
      ctx.restore();
    }
    return { cv, pad };
  }

  /* ---------------- câmera ---------------- */
  // cam: { s0, s1, x0, y0, x1, y1, t0, dur, fade: 'in' | 'out' }
  function camera(v, cam) { v.cam = cam; if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
  function camState(v, t) {
    const cam = v.cam;
    if (!cam) return { s: 1, x: v.cx, y: v.cy, op: 1, done: true };
    const k = Math.min(1, (t - cam.t0) / cam.dur), e = ease(k);
    return {
      s: cam.s0 + (cam.s1 - cam.s0) * e,
      x: cam.x0 + (cam.x1 - cam.x0) * e,
      y: cam.y0 + (cam.y1 - cam.y0) * e,
      op: cam.fade === 'out' ? Math.max(0, 1 - k * 1.7) : Math.min(1, 0.15 + k * 1.9),
      done: k >= 1
    };
  }

  /* ---------------- desenho ---------------- */
  function draw(t) {
    const v = view; if (!v) return;
    const ctx = v.ctx, U = HR.U, acc = v.R.accent, glow = !perfLow(), W = v.W, H = v.H, still = v.still;
    const cam = camState(v, t);
    if (v.cam && cam.done && v.cam.fade !== 'out') v.cam = null;
    // rótulos acompanham a mesma escala e o mesmo foco do canvas
    if (v.nodes) {
      v.nodes.style.transformOrigin = cam.x.toFixed(1) + 'px ' + cam.y.toFixed(1) + 'px';
      v.nodes.style.transform = 'scale(' + cam.s.toFixed(3) + ')';
      v.nodes.style.opacity = cam.op.toFixed(2);
    }
    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (v.sky) ctx.drawImage(v.sky, 0, 0, W, H);
    ctx.save();
    ctx.translate(cam.x, cam.y); ctx.scale(cam.s, cam.s); ctx.translate(-cam.x, -cam.y);

    const pts = v.pts, items = v.items;
    // anel principal e faixa de progresso
    ctx.save(); ctx.translate(v.cx, v.cy);
    ctx.strokeStyle = 'rgba(255,255,255,0.13)'; ctx.lineWidth = 1.6; ctx.setLineDash([5, 8]);
    ctx.beginPath(); ctx.ellipse(0, 0, v.Rr, v.Rr * 0.9, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    let doneUpTo = -1;
    for (let i = 0; i < 9; i++) { if (items[i].done) doneUpTo = i; else break; }
    if (doneUpTo >= 0) {
      ctx.strokeStyle = U.rgba(acc, 0.8); ctx.lineWidth = 3;
      if (glow) { ctx.shadowColor = acc; ctx.shadowBlur = 12; }
      ctx.beginPath(); ctx.ellipse(0, 0, v.Rr, v.Rr * 0.9, 0, pts[0].a, pts[Math.min(doneUpTo + 1, 8)].a); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
    // raios até o centro
    const openCore = items[8].done || items[9].unlocked;
    for (let i = 0; i < 9; i++) {
      const p = pts[i], lit = openCore && items[i].done;
      ctx.strokeStyle = lit ? U.rgba(acc, 0.35) : 'rgba(255,255,255,0.08)';
      ctx.lineWidth = lit ? 1.8 : 1;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(v.cx, v.cy); ctx.stroke();
    }
    // pulso de luz correndo pelo trecho vencido
    if (doneUpTo >= 0 && !still) {
      const a = pts[0].a + ((t * 0.5) % 1) * (pts[Math.min(doneUpTo + 1, 8)].a - pts[0].a);
      const px = v.cx + Math.cos(a) * v.Rr, py = v.cy + Math.sin(a) * v.Rr * 0.9;
      const pg = ctx.createRadialGradient(px, py, 0, px, py, 14);
      pg.addColorStop(0, U.rgba('#ffffff', 0.85)); pg.addColorStop(0.45, U.rgba(acc, 0.45)); pg.addColorStop(1, U.rgba(acc, 0));
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, 14, 0, TAU); ctx.fill();
    }

    items.forEach((it, i) => {
      const p = pts[i], r = p.r, center = i === 9;
      if (center) {
        const k = still ? 0.5 : 0.5 + Math.sin(t * 1.5) * 0.5;
        const col = it.done ? '#ffcf4a' : it.unlocked ? '#ff5e7e' : '#5a6488';
        const ag = ctx.createRadialGradient(p.x, p.y, r * 0.7, p.x, p.y, r * 2.6);
        ag.addColorStop(0, U.rgba(col, 0.26 + k * 0.16)); ag.addColorStop(1, U.rgba(col, 0));
        ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.6, 0, TAU); ctx.fill();
      }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(-0.4 + (still ? 0 : Math.sin(t * 0.35 + i) * 0.05));
      ctx.strokeStyle = it.unlocked ? U.rgba(acc, it.done ? 0.45 : 0.24) : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = center ? 2.2 : 1.4;
      ctx.beginPath(); ctx.ellipse(0, 0, r * 1.5, r * 0.56, 0, 0, TAU); ctx.stroke();
      ctx.restore();

      const art = v.art[i];
      if (art) {
        ctx.save(); ctx.translate(p.x, p.y);
        ctx.rotate(still ? 0 : t * (0.16 + (i % 3) * 0.06) * (i % 2 ? 1 : -1));
        ctx.drawImage(art.cv, -art.pad, -art.pad, art.pad * 2, art.pad * 2);
        ctx.restore();
      }
      if (it.unlocked && !perfLow()) {
        const moons = center ? 3 : (i % 2 ? 1 : 2);
        for (let m = 0; m < moons; m++) {
          const a = (still ? 0 : t * (0.5 + m * 0.22) * (m % 2 ? -1 : 1)) + i * 1.3 + m * 2.4;
          ctx.fillStyle = U.rgba(it.done ? acc : '#cfe0ff', 0.9);
          ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * r * 1.5, p.y + Math.sin(a) * r * 0.56, center ? 3.2 : 2.3, 0, TAU); ctx.fill();
        }
      }
      if (it.done) {
        ctx.strokeStyle = U.rgba(acc, 0.85); ctx.lineWidth = 2.2;
        if (glow) { ctx.shadowColor = acc; ctx.shadowBlur = 12; }
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.05, 0, TAU); ctx.stroke(); ctx.shadowBlur = 0;
      }
      if (it.current) {
        const k = still ? 0.5 : (Math.sin(t * 2.2) * 0.5 + 0.5);
        ctx.strokeStyle = U.rgba('#ffffff', 0.22 + k * 0.3); ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * (1.2 + k * 0.14), 0, TAU); ctx.stroke();
        const a = still ? -0.8 : t * 1.1;
        HR.Render.drawBall(ctx, p.x + Math.cos(a) * r * 1.6, p.y + Math.sin(a) * r * 0.6, r * 0.3, v.ballSkin, t, {});
      }
    });
    ctx.restore();
  }

  function loop() {
    raf = null;
    const v = view;
    if (!v || !v.wrap.isConnected || (HR.UI.stack && HR.UI.stack.indexOf(v.screen) < 0)) { view = null; return; }
    if (!document.hidden) draw(performance.now() / 1000);
    if (!v.still || v.cam) raf = requestAnimationFrame(loop);
  }

  /* ---------------- DOM por cima ---------------- */
  function nodeHtml(it, p, i) {
    const cls = ['sv-node', i === 9 ? 'is-center' : '', it.boss ? 'is-boss' : '', it.done ? 'is-done' : '',
      it.current ? 'is-current' : '', it.unlocked ? '' : 'is-locked'].filter(Boolean).join(' ');
    let h = '<button type="button" class="' + cls + '" ' + it.attr + ' style="left:' + p.x.toFixed(1) + 'px;top:' + p.y.toFixed(1) + 'px;--r:' + p.r.toFixed(0) + 'px"' +
      HR.tip(it.tipT, it.tipD) + ' aria-label="' + esc(it.aria || it.tipT) + '">';
    h += '<span class="lv-circle-wrap sv-hit"></span>';
    h += it.icon ? '<span class="sv-ic">' + it.icon + '</span>' : '<b class="sv-num">' + esc(it.label) + '</b>';
    const lab = [];
    if (it.stars != null) {
      let s = '<span class="sv-stars">';
      for (let k = 0; k < 3; k++) s += '<span class="sv-star' + (k < it.stars ? ' on' : '') + '">' + HR.icon('star', '', true) + '</span>';
      lab.push(s + '</span>');
    }
    if (it.name) lab.push('<span class="sv-name' + (it.boss ? ' is-boss' : '') + '">' + esc(it.name) + '</span>');
    if (it.sub) lab.push('<span class="sv-sub">' + HR.icon('star', '', true) + ' ' + esc(it.sub) + '</span>');
    if (lab.length) h += '<span class="sv-labels">' + lab.join('') + '</span>';
    if (!it.unlocked) h += '<span class="sv-lock">' + HR.icon('lock') + '</span>';
    else if (it.dot) h += '<span class="lv-dot-ev"></span>';
    return h + '</button>';
  }

  function build(screen, wrap, items, R, cam) {
    const W = Math.max(240, wrap.clientWidth || 340), L = layout(W);
    const dpr = Math.min(HR.Perf ? HR.Perf.dprCap() : 2, window.devicePixelRatio || 1);
    wrap.style.height = L.H + 'px';
    const cv = wrap.querySelector('.sv-cv'), nodes = wrap.querySelector('.sv-nodes');
    cv.width = W * dpr; cv.height = L.H * dpr; cv.style.width = W + 'px'; cv.style.height = L.H + 'px';
    nodes.innerHTML = items.map((it, i) => nodeHtml(it, L.pts[i], i)).join('');
    const still = reduceMotion() || perfLite();   // v6.3: no Normal e no Baixo o mapa é um quadro parado
    view = {
      screen, wrap, cv, nodes, ctx: cv.getContext('2d'), W, H: L.H, dpr, cx: L.cx, cy: L.cy, Rr: L.Rr,
      pts: L.pts, items, R, still, ballSkin: equippedSkin(),
      art: items.map((it, i) => buildArt(it.skin, L.pts[i].r, !it.unlocked, i * 1.7, dpr)),
      sky: buildSky(W, L.H, R), cam: null
    };
    if (!still && cam) {
      const from = cam.from || {};
      const fx = from.x != null ? from.x : L.cx, fy = from.y != null ? from.y : L.cy;
      view.cam = { s0: from.s != null ? from.s : 1, s1: 1, x0: fx, y0: fy, x1: L.cx, y1: L.cy, t0: performance.now() / 1000, dur: cam.dur || 0.66, fade: 'in' };
    }
    draw(performance.now() / 1000);
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    return L;
  }

  function mount(body, screen, items, R, cam, backLabel, onNode) {
    const path = body.querySelector('.lv-path'); if (!path) return;
    const wrap = HR.U.el('div', 'sv-wrap');
    wrap.innerHTML = '<canvas class="sv-cv" aria-hidden="true"></canvas><div class="sv-nodes"></div>' +
      '<button type="button" class="sv-back">' + HR.icon('chevronLeft') + '<span>' + esc(backLabel) + '</span></button>';
    path.parentNode.replaceChild(wrap, path);
    const L = build(screen, wrap, items, R, cam);
    wrap.querySelector('.sv-back').addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      if (HR.Audio) HR.Audio.sfx('click');
      HR.UI.back();
    });
    if (onNode) wrap.addEventListener('click', onNode, true);
    // o mapa entra no campo de visão. Rola só o painel: no iPhone o scrollIntoView
    // levantava a página inteira e o toque passava a cair no lugar errado.
    requestAnimationFrame(() => {
      if (!wrap.isConnected) return;
      let sc = wrap.parentNode;
      while (sc && sc !== document.body && sc.scrollHeight <= sc.clientHeight + 2) sc = sc.parentNode;
      if (!sc || sc === document.body || sc === document.documentElement) return;
      const top = sc.scrollTop + wrap.getBoundingClientRect().top - sc.getBoundingClientRect().top
        - Math.max(0, (sc.clientHeight - wrap.offsetHeight) / 2);
      const smooth = !reduceMotion() && !perfLite();
      try { sc.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' }); }
      catch (_) { sc.scrollTop = Math.max(0, top); }
    });
    if (ro) { ro.disconnect(); ro = null; }
    if ('ResizeObserver' in window) {
      let w0 = wrap.clientWidth;
      ro = new ResizeObserver(() => { if (wrap.isConnected && Math.abs(wrap.clientWidth - w0) > 8) { w0 = wrap.clientWidth; build(screen, wrap, items, R, null); } });
      ro.observe(wrap);
    }
    return L;
  }

  /* ---------------- galáxia: os 10 sistemas ---------------- */
  const origRenderRegion = HR.UI.renderRegion;
  HR.UI.renderRegion = function () {
    const r = origRenderRegion.apply(this, arguments);
    const body = $('#region-body'); if (!body || !HR.Render || !HR.Render.drawBall) return r;
    const first = body.querySelector('[data-system]'); if (!first) return r;
    const ri = +first.getAttribute('data-system').split('-')[0];
    const C = HR.Campaign, R = HR.REGIONS[ri], cur = C.currentSystem(ri), need = HR.CONFIG.PROGRESSION.systemStars[ri];
    const galOpen = C.isRegionUnlocked(ri);
    const GREEK = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ'];
    const items = HR.SYSTEM_KEYS.map((key, si) => {
      const st = C.systemState(ri, si), stars = C.systemStars(ri, si), unlocked = st !== 'locked', boss = si === 9;
      const name = HR.t('system_n', { name: C.systemName(si) });
      return {
        attr: 'data-system="' + ri + '-' + si + '"', label: boss ? '' : GREEK[si], icon: boss ? HR.icon(HR.BOSSES[R.boss].icon) : null,
        name: C.systemName(si), sub: stars + '/30', stars: null,
        done: st === 'done', unlocked, current: galOpen && si === cur && st === 'open', boss,
        skin: skinFrom(boss ? POOL.core : POOL.sun, R.id + '-' + si, si),
        tipT: name, tipD: !galOpen ? HR.t('locked') : !unlocked ? HR.t('system_locked', { name: C.systemName(si - 1), n: need }) : HR.t('stars_of', { a: stars, b: 30 }), aria: name
      };
    });
    // voltando de um sistema: a câmera sai de dentro dele e se afasta até o mapa inteiro
    const L0 = layout(Math.max(240, body.clientWidth - 4 || 340));
    const from = (backFrom && backFrom.ri === ri) ? { s: 2.5, x: L0.pts[backFrom.si].x, y: L0.pts[backFrom.si].y } : { s: 1.16, x: L0.cx, y: L0.cy };
    const dur = (backFrom && backFrom.ri === ri) ? 0.7 : 0.45;
    backFrom = null;
    mount(body, 'region', items, R, { from, dur }, HR.t('galaxy'), e => {
      const btn = e.target.closest && e.target.closest('[data-system]'); if (!btn || !view) return;
      const si = +btn.getAttribute('data-system').split('-')[1];
      if (!C.systemUnlocked(ri, si)) return;             // bloqueado: deixa o aviso de sempre acontecer
      e.preventDefault(); e.stopPropagation();
      if (HR.Audio) HR.Audio.sfx('click');
      if (view.still) { HR.UI.open('system', ri + '-' + si); return; }
      const p = view.pts[si];
      camera(view, { s0: 1, s1: 3.1, x0: p.x, y0: p.y, x1: p.x, y1: p.y, t0: performance.now() / 1000, dur: 0.38, fade: 'out' });
      setTimeout(() => HR.UI.open('system', ri + '-' + si), 300);
    });
    return r;
  };

  /* ---------------- sistema: as 10 fases, chefe no centro ---------------- */
  const origRenderSystem = HR.UI.renderSystem;
  HR.UI.renderSystem = function () {
    const r = origRenderSystem.apply(this, arguments);
    const body = $('#system-body'); if (!body || !HR.Render || !HR.Render.drawBall) return r;
    const first = body.querySelector('[data-level]'); if (!first) return r;
    const ids = first.getAttribute('data-level').split('-'), ri = +ids[0] - 1, si = +ids[1] - 1;
    const C = HR.Campaign, R = HR.REGIONS[ri], levels = C.systemLevels(ri, si), cur = C.currentLevel();
    backFrom = { ri, si };
    const items = levels.map((L, i) => {
      const stars = C.stars(L.id), boss = !!L.boss;
      const tipD = (boss ? C.bossName(L) + ' · ' : '') + HR.t('rings_n', { n: L.rings }) + ' · ×' + L.speed.toFixed(2) +
        (L.events.length ? ' · ' + L.events.map(ev => HR.t('ev_' + ev.id)).join(', ') : '') +
        (L.mods.length ? ' · ' + L.mods.map(m => HR.t('mut_' + m)).join(', ') : '');
      return {
        attr: 'data-level="' + esc(L.id) + '"', label: String(i + 1), icon: boss ? HR.icon(HR.BOSSES[L.boss].icon) : null,
        name: boss ? C.bossName(L) : '', stars, done: stars > 0, unlocked: C.isUnlocked(L.id),
        current: !!(cur && cur.id === L.id), boss, dot: !!(L.mods.length || L.events.length),
        skin: skinFrom(boss ? POOL.core : POOL.world, L.id, i),
        tipT: HR.t('level_n', { n: L.id }), tipD, aria: HR.t('level_n', { n: L.id })
      };
    });
    mount(body, 'system', items, R, { from: { s: 0.34 }, dur: 0.72 }, HR.t('systems'));
    return r;
  };
})();
