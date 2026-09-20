/* =====================================================================
   ORBO v5.4: a lista de fases do sistema vira uma rota entre mundos.
   Canvas com céu do sistema (nebulosa na cor da galáxia + estrelas), trilha de voo ligando
   as 10 fases, cada uma um planeta (arte das bolas das coleções planetas/estrelas/nebulosas),
   luas girando, halo na fase atual com a sua bola orbitando e o chefe como mundo maior com anel.
   Os botões continuam em DOM por cima (número, estrelas, cadeado), então o toque e as dicas
   seguem iguais. Envolve HR.UI.renderSystem: troca só o bloco da lista (.lv-path).
   ===================================================================== */
(function () {
  const $ = (s, r) => HR.U.$(s, r), $$ = (s, r) => HR.U.$$(s, r);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // só coleções que parecem mundo: as bolas de "estrelas" são claras demais e viram borrão
  const ORB_COLS = ['planets', 'nebulae', 'blackholes'];
  let view = null, raf = null, ro = null;

  const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const perfLow = () => !!(HR.Perf && HR.Perf.level === 0);

  // um planeta fixo por fase: mesma fase, mesmo mundo, sempre
  function skinFor(id, i) {
    const pool = HR.CONFIG.SKINS.filter(s => ORB_COLS.indexOf(s.col) >= 0);
    if (!pool.length) return HR.CONFIG.SKINS[0];
    let h = 7;
    for (let k = 0; k < id.length; k++) h = (h * 31 + id.charCodeAt(k)) % 100000;
    return pool[(h + i * 13) % pool.length];
  }
  function equippedSkin() {
    return HR.CONFIG.SKINS.find(s => s.id === HR.Store.data.equipped.skin) || HR.CONFIG.SKINS[0];
  }

  /* ---------------- posições: mesma serpentina de antes, com espaço para planetas ---------------- */
  function layout(W) {
    const cols = [0.2, 0.5, 0.8], pitch = W < 330 ? 96 : 108, top = 64, r = W < 330 ? 25 : 28, br = W < 330 ? 38 : 42;
    const pts = [];
    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3), col = i % 3;
      pts.push({ x: (row % 2 ? cols[2 - col] : cols[col]) * W, y: top + row * pitch, r });
    }
    pts.push({ x: W / 2, y: top + 2 * pitch + 108, r: br });
    return { pts, H: top + 2 * pitch + 108 + 116 };
  }
  const ctrlOf = (a, b, i) => {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y;
    const L = Math.hypot(dx, dy) || 1, s = (i % 2 ? 1 : -1) * Math.min(30, L * 0.18);
    return { x: mx - dy / L * s, y: my + dx / L * s };
  };
  const quad = (a, c, b, u) => {
    const k = 1 - u;
    return { x: k * k * a.x + 2 * k * u * c.x + u * u * b.x, y: k * k * a.y + 2 * k * u * c.y + u * u * b.y };
  };

  /* ---------------- céu do sistema (desenhado uma vez) ---------------- */
  function buildSky(W, H, R) {
    const cv = document.createElement('canvas'), dpr = 1;
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d'), U = HR.U;
    let seed = 1337; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
    g.addColorStop(0, U.mix(R.colors[0] || R.accent, '#05070f', 0.72));
    g.addColorStop(0.55, '#070b1c');
    g.addColorStop(1, U.mix(R.colors[2] || R.accent, '#05070f', 0.8));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // nebulosas na cor da galáxia
    for (let i = 0; i < 4; i++) {
      const x = rnd() * W, y = rnd() * H, rr = (60 + rnd() * 120);
      const col = [R.accent, R.colors[0] || R.accent, R.colors[1] || R.accent][i % 3];
      const ng = ctx.createRadialGradient(x, y, 0, x, y, rr);
      ng.addColorStop(0, U.rgba(col, 0.16)); ng.addColorStop(1, U.rgba(col, 0));
      ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.283); ctx.fill();
    }
    const n = perfLow() ? 70 : 150;
    for (let i = 0; i < n; i++) {
      const x = rnd() * W, y = rnd() * H, s = rnd() * 1.3 + 0.35;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.18 + rnd() * 0.6).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(x, y, s, 0, 6.283); ctx.fill();
    }
    return cv;
  }

  // cada planeta é desenhado uma vez e depois só gira (barato para o celular)
  function buildPlanet(level, i, st, dpr) {
    const r = st.r, cv = document.createElement('canvas'), size = Math.ceil(r * 2.2 * dpr);
    cv.width = size; cv.height = size;
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const c = r * 1.1;
    HR.Render.drawBall(ctx, c, c, r * 0.92, skinFor(level.id, i), (i * 1.7) % 6, {});
    if (!st.unlocked) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(8,12,26,0.62)'; ctx.fillRect(0, 0, r * 2.2, r * 2.2);
      ctx.globalCompositeOperation = 'source-over';
    }
    return cv;
  }

  /* ---------------- desenho por quadro ---------------- */
  function draw(t) {
    const v = view; if (!v) return;
    const ctx = v.ctx, W = v.W, H = v.H, U = HR.U, acc = v.R.accent, glow = !perfLow();
    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (v.sky) ctx.drawImage(v.sky, 0, 0, W, H);

    // trilha de voo: o trecho já vencido brilha, o resto fica pontilhado
    const pts = v.pts, doneUpTo = v.doneUpTo;
    for (let i = 0; i < 9; i++) {
      const a = pts[i], b = pts[i + 1], c = ctrlOf(a, b, i), lit = i < doneUpTo;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
      ctx.setLineDash(lit ? [] : [5, 9]);
      ctx.lineWidth = lit ? 3 : 2;
      ctx.strokeStyle = lit ? U.rgba(acc, 0.75) : 'rgba(255,255,255,0.16)';
      if (glow && lit) { ctx.shadowColor = acc; ctx.shadowBlur = 10; }
      ctx.stroke(); ctx.shadowBlur = 0; ctx.setLineDash([]);
    }
    // pulso de luz percorrendo o trecho vencido
    if (doneUpTo > 0 && !v.still) {
      const k = (t * 0.22) % doneUpTo, seg = Math.floor(k), u = k - seg;
      const a = pts[seg], b = pts[seg + 1], p = quad(a, ctrlOf(a, b, seg), b, u);
      const pg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 16);
      pg.addColorStop(0, U.rgba('#ffffff', 0.9)); pg.addColorStop(0.4, U.rgba(acc, 0.5)); pg.addColorStop(1, U.rgba(acc, 0));
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(p.x, p.y, 16, 0, 6.283); ctx.fill();
    }

    v.levels.forEach((L, i) => {
      const p = pts[i], st = v.states[i], r = p.r, spin = v.still ? 0 : t * (0.18 + (i % 3) * 0.07) * (i % 2 ? 1 : -1);

      // chefe: aura pulsando e anel inclinado
      if (st.boss) {
        const pulse = v.still ? 0.5 : 0.5 + Math.sin(t * 1.6) * 0.5;
        const ag = ctx.createRadialGradient(p.x, p.y, r * 0.8, p.x, p.y, r * 2.2);
        ag.addColorStop(0, U.rgba(st.done ? '#ffcf4a' : '#ff5e7e', 0.3 + pulse * 0.16));
        ag.addColorStop(1, U.rgba(st.done ? '#ffcf4a' : '#ff5e7e', 0));
        ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.2, 0, 6.283); ctx.fill();
      }
      // órbita do mundo
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(-0.42 + (v.still ? 0 : Math.sin(t * 0.4 + i) * 0.05));
      ctx.strokeStyle = st.unlocked ? U.rgba(acc, st.done ? 0.5 : 0.28) : 'rgba(255,255,255,0.12)';
      ctx.lineWidth = st.boss ? 2.4 : 1.6;
      ctx.beginPath(); ctx.ellipse(0, 0, r * 1.5, r * 0.58, 0, 0, 6.283); ctx.stroke();
      ctx.restore();

      // o mundo
      const art = v.art[i];
      if (art) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(spin);
        ctx.drawImage(art, -r * 1.1, -r * 1.1, r * 2.2, r * 2.2);
        ctx.restore();
      }
      // luas
      if (st.unlocked && !perfLow()) {
        const moons = st.boss ? 3 : (i % 2 ? 1 : 2);
        for (let m = 0; m < moons; m++) {
          const a = (v.still ? 0 : t * (0.6 + m * 0.25) * (m % 2 ? -1 : 1)) + i * 1.3 + m * 2.4;
          const mx = p.x + Math.cos(a) * r * 1.5, my = p.y + Math.sin(a) * r * 0.58;
          ctx.fillStyle = U.rgba(st.done ? acc : '#cfe0ff', 0.9);
          ctx.beginPath(); ctx.arc(mx, my, st.boss ? 3.2 : 2.4, 0, 6.283); ctx.fill();
        }
      }
      // fase vencida: aro de luz na cor da galáxia
      if (st.done) {
        ctx.strokeStyle = U.rgba(acc, 0.85); ctx.lineWidth = 2.2;
        if (glow) { ctx.shadowColor = acc; ctx.shadowBlur = 12; }
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.06, 0, 6.283); ctx.stroke(); ctx.shadowBlur = 0;
      }
      // fase atual: halo que respira e a sua bola em órbita
      if (st.current) {
        const k = v.still ? 0.5 : (Math.sin(t * 2.2) * 0.5 + 0.5);
        ctx.strokeStyle = U.rgba('#ffffff', 0.22 + k * 0.28); ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * (1.2 + k * 0.16), 0, 6.283); ctx.stroke();
        const a = v.still ? -0.8 : t * 1.1;
        const bx = p.x + Math.cos(a) * r * 1.62, by = p.y + Math.sin(a) * r * 0.62;
        HR.Render.drawBall(ctx, bx, by, r * 0.3, v.ballSkin, t, {});
      }
    });
  }

  function loop() {
    raf = null;
    if (!view || !view.wrap.isConnected || (HR.UI.stack && HR.UI.stack.indexOf('system') < 0)) { view = null; return; }
    if (!document.hidden) draw(performance.now() / 1000);
    if (!view.still) raf = requestAnimationFrame(loop);
  }

  /* ---------------- montagem ---------------- */
  function nodeHtml(L, i, st, p) {
    const C = HR.Campaign;
    const cls = ['sv-node', st.boss ? 'is-boss' : '', st.done ? 'is-done' : '', st.current ? 'is-current' : '', st.unlocked ? '' : 'is-locked'].filter(Boolean).join(' ');
    const tipD = (st.boss ? C.bossName(L) + ' · ' : '') + HR.t('rings_n', { n: L.rings }) + ' · ×' + L.speed.toFixed(2) +
      (L.events.length ? ' · ' + L.events.map(ev => HR.t('ev_' + ev.id)).join(', ') : '') + (L.mods.length ? ' · ' + L.mods.map(m => HR.t('mut_' + m)).join(', ') : '');
    let h = '<button type="button" class="' + cls + '" data-level="' + esc(L.id) + '" style="left:' + p.x.toFixed(1) + 'px;top:' + p.y.toFixed(1) + 'px;--r:' + p.r + 'px"' +
      HR.tip(HR.t('level_n', { n: L.id }), tipD) + ' aria-label="' + esc(HR.t('level_n', { n: L.id })) + '">';
    h += '<span class="lv-circle-wrap sv-hit"></span>';
    h += st.boss ? '<span class="sv-ic">' + HR.icon(HR.BOSSES[L.boss].icon) + '</span>' : '<b class="sv-num">' + (i + 1) + '</b>';
    let s = '<span class="sv-stars">';
    for (let k = 0; k < 3; k++) s += '<span class="sv-star' + (k < st.stars ? ' on' : '') + '">' + HR.icon('star', '', true) + '</span>';
    h += s + '</span>';
    if (st.boss) h += '<span class="sv-name">' + esc(HR.Campaign.bossName(L)) + '</span>';
    if (!st.unlocked) h += '<span class="sv-lock">' + HR.icon('lock') + '</span>';
    else if (L.mods.length || L.events.length) h += '<span class="lv-dot-ev"></span>';
    return h + '</button>';
  }

  function build(wrap, ri, si) {
    const C = HR.Campaign, R = HR.REGIONS[ri], levels = C.systemLevels(ri, si), cur = C.currentLevel();
    const W = Math.max(240, wrap.clientWidth || 340), L = layout(W);
    const dpr = Math.min(HR.Perf ? HR.Perf.dprCap() : 2, window.devicePixelRatio || 1);
    const states = levels.map((l, i) => ({
      stars: C.stars(l.id), done: C.stars(l.id) > 0, unlocked: C.isUnlocked(l.id),
      current: !!(cur && cur.id === l.id), boss: !!l.boss, r: L.pts[i].r
    }));
    let doneUpTo = 0;
    for (let i = 0; i < 10; i++) if (states[i].done) doneUpTo = i;
    wrap.style.height = L.H + 'px';
    const cv = wrap.querySelector('.sv-cv'), nodes = wrap.querySelector('.sv-nodes');
    cv.width = W * dpr; cv.height = L.H * dpr; cv.style.width = W + 'px'; cv.style.height = L.H + 'px';
    nodes.innerHTML = levels.map((l, i) => nodeHtml(l, i, states[i], L.pts[i])).join('');
    view = {
      wrap, cv, ctx: cv.getContext('2d'), W, H: L.H, dpr, pts: L.pts, levels, states, R, doneUpTo,
      sky: buildSky(W, L.H, R), art: levels.map((l, i) => buildPlanet(l, i, states[i], dpr)),
      ballSkin: equippedSkin(), still: reduceMotion()
    };
    draw(performance.now() / 1000);
    if (raf) cancelAnimationFrame(raf);
    if (!view.still) raf = requestAnimationFrame(loop);
  }

  const origRenderSystem = HR.UI.renderSystem;
  HR.UI.renderSystem = function (arg) {
    const r = origRenderSystem.apply(this, arguments);
    const body = $('#system-body'); if (!body || !HR.Render || !HR.Render.drawBall) return r;
    const path = body.querySelector('.lv-path'); if (!path) return r;
    const m = (body.querySelector('[data-level]') || {}).getAttribute ? body.querySelector('[data-level]').getAttribute('data-level') : null;
    const ids = (m || '1-1-1').split('-'), ri = +ids[0] - 1, si = +ids[1] - 1;
    const wrap = HR.U.el('div', 'sv-wrap');
    wrap.innerHTML = '<canvas class="sv-cv" aria-hidden="true"></canvas><div class="sv-nodes"></div>';
    path.parentNode.replaceChild(wrap, path);
    build(wrap, ri, si);
    if (ro) { ro.disconnect(); ro = null; }
    if ('ResizeObserver' in window) {
      let w0 = wrap.clientWidth;
      ro = new ResizeObserver(() => { if (wrap.isConnected && Math.abs(wrap.clientWidth - w0) > 8) { w0 = wrap.clientWidth; build(wrap, ri, si); } });
      ro.observe(wrap);
    }
    return r;
  };
})();
