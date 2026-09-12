/* =====================================================================
   Galáxia: mapa em canvas (espiral com 10 regiões + Singularidade no centro),
   ficha da região (mecânica, chefe, prêmio, música, 10 fases em caminho),
   ficha da fase, ficha da Singularidade, tela de Habilidades (loadout) e
   tela de Conquistas (categorias).
   Define em HR.UI: renderGalaxy, renderRegion, openLevelDetail, closeLevelDetail,
   openSingularityDetail, renderAbilities, renderAchievements, rerenderAbilities
   ===================================================================== */
(function () {
  window.HR = window.HR || {};
  HR.UI = HR.UI || {};
  const $ = (s, r) => HR.U.$(s, r), $$ = (s, r) => HR.U.$$(s, r);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sfx = n => { if (HR.Audio && HR.Audio.sfx) HR.Audio.sfx(n); };
  const accentVars = hex => '--wa:' + hex + ';--wa-28:' + HR.U.rgba(hex, 0.28) + ';--wa-14:' + HR.U.rgba(hex, 0.14) + ';--wa-glow:' + HR.U.rgba(hex, 0.45) + ';--rb1:' + HR.U.mix(hex, '#ffffff', 0.55) + ';--rb2:' + hex + ';';
  const starsHtml = (n, cls) => { let h = '<span class="lv-stars' + (cls ? ' ' + cls : '') + '" aria-hidden="true">'; for (let i = 0; i < 3; i++) h += '<span class="lv-star' + (i < n ? ' on' : '') + '">' + HR.icon('star', '', true) + '</span>'; return h + '</span>'; };
  const regionName = R => HR.t('reg_' + R.id);
  const cosmeticName = rw => { if (!rw) return ''; const key = rw.skin ? 'skin_' + rw.skin : rw.trail ? 'trail_' + rw.trail : rw.theme ? 'theme_' + rw.theme : null; return key ? HR.t(key) : ''; };

  /* =================== MAPA DA GALÁXIA (v4) =================== */
  // Tela inteira. Fundo profundo cacheado (estrelas, nebulosas na cor de cada galáxia, poeira quente em volta do
  // centro), TON 618 no meio, 10 galáxias (mini espirais desenhadas no canvas) ligadas por um caminho de segmentos
  // que dá a volta e entra até o centro. Posições em fração da tela; rótulos em DOM por cima.
  const NODE_POS = [[0.18, 0.79], [0.50, 0.76], [0.82, 0.70], [0.87, 0.55], [0.84, 0.40], [0.69, 0.26], [0.43, 0.19], [0.16, 0.25], [0.15, 0.43], [0.22, 0.61]];
  const LABEL_TOP = [false, false, false, false, false, true, true, false, false, false];
  const galName = R => HR.t('gal_' + R.gal);
  let gxStatic = null, gxTw = null, gxRaf = null;
  function geometry(W, H) {
    return { cx: W / 2, cy: H * 0.47, W, H, pts: NODE_POS.map(p => ({ x: Math.round(p[0] * W), y: Math.round(p[1] * H) })) };
  }
  function ctrl(a, b, i) { const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, s = (i % 2 ? 1 : -1) * Math.min(34, L * 0.2); return { x: mx - dy / L * s, y: my + dx / L * s }; }
  function buildStatic(W, H, geo) {
    const cv = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const U = HR.U, cx = geo.cx, cy = geo.cy;
    let seed = 777; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(W, H) * 0.9);
    g.addColorStop(0, '#1a2258'); g.addColorStop(0.35, '#0d1335'); g.addColorStop(1, '#03050d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // poeira quente em volta do centro (elíptica) e dois filamentos espirais bem discretos
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.72);
    const dg = ctx.createRadialGradient(0, 0, 30, 0, 0, 330); dg.addColorStop(0, 'rgba(255,220,170,0.18)'); dg.addColorStop(0.45, 'rgba(255,150,120,0.07)'); dg.addColorStop(1, 'rgba(120,90,200,0)');
    ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(0, 0, 330, 0, 6.283); ctx.fill(); ctx.restore();
    ctx.lineCap = 'round';
    for (let m = 0; m < 2; m++) {
      ctx.strokeStyle = 'rgba(180,200,255,0.05)'; ctx.lineWidth = 42; ctx.beginPath();
      for (let k = 0; k <= 40; k++) { const f = k / 40, rr = 70 + f * Math.max(W, H) * 0.75, an = m * Math.PI + f * 2.4 + 0.6; const x = cx + Math.cos(an) * rr, y = cy + Math.sin(an) * rr * 0.72; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
    // nebulosa na cor de cada galáxia (em volta do nó)
    geo.pts.forEach((p, i) => {
      const col = HR.REGIONS[i].accent;
      const ng = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 96); ng.addColorStop(0, U.rgba(col, 0.13)); ng.addColorStop(0.5, U.rgba(col, 0.05)); ng.addColorStop(1, U.rgba(col, 0));
      ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(p.x, p.y, 96, 0, 6.283); ctx.fill();
      for (let k = 0; k < 26; k++) { const a = rnd() * 6.283, d = 20 + rnd() * 70; ctx.globalAlpha = 0.25 + rnd() * 0.5; ctx.fillStyle = rnd() < 0.5 ? '#ffffff' : col; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d * 0.8, 0.5 + rnd() * 1.2, 0, 6.283); ctx.fill(); }
      ctx.globalAlpha = 1;
    });
    // estrelas de campo; algumas com brilho em cruz
    for (let i = 0; i < 460; i++) {
      const x = rnd() * W, y = rnd() * H, s = 0.4 + rnd() * 1.3, big = rnd() < 0.05;
      ctx.globalAlpha = 0.15 + rnd() * 0.6; ctx.fillStyle = rnd() < 0.22 ? '#cfe3ff' : rnd() < 0.1 ? '#ffe2b0' : '#ffffff';
      ctx.beginPath(); ctx.arc(x, y, big ? s + 0.8 : s, 0, 6.283); ctx.fill();
      if (big) { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    const vg = ctx.createRadialGradient(cx, cy, H * 0.3, cx, cy, H * 0.85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    return { W, H, cv };
  }
  // mini galáxia: elipse inclinada com dois braços de pontos girando; a cor é a da região
  function drawMiniGalaxy(ctx, x, y, s, color, t, i, st) {
    const U = HR.U, locked = st === 'locked';
    const col = locked ? '#7d879f' : color, tilt = 0.5 + (i % 3) * 0.13, spin = t * (0.3 + (i % 4) * 0.08) * (i % 2 ? 1 : -1);
    ctx.save(); ctx.translate(x, y); ctx.rotate(i * 0.7);
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, s * 2.3); g.addColorStop(0, U.rgba(col, locked ? 0.2 : 0.45)); g.addColorStop(0.5, U.rgba(col, locked ? 0.06 : 0.13)); g.addColorStop(1, U.rgba(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, s * 2.3, s * 2.3 * tilt, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = U.rgba(col, locked ? 0.08 : 0.16); ctx.beginPath(); ctx.ellipse(0, 0, s * 1.2, s * 1.2 * tilt, 0, 0, 6.283); ctx.fill();
    for (let arm = 0; arm < 2; arm++) for (let k = 0; k < 18; k++) {
      const f = k / 18, r = s * (0.2 + f * 1.1), a = spin + arm * Math.PI + f * 3.6;
      ctx.fillStyle = k % 3 === 0 ? '#ffffff' : col; ctx.globalAlpha = (locked ? 0.35 : 0.95) * (1 - f * 0.65);
      ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r * tilt, 1 + (1 - f) * 1.3, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = locked ? 0.6 : 1;
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.55); cg.addColorStop(0, '#ffffff'); cg.addColorStop(0.35, U.mix(col, '#ffffff', 0.5)); cg.addColorStop(1, U.rgba(col, 0));
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, s * 0.55, 0, 6.283); ctx.fill();
    ctx.restore();
    if (st === 'current') { const k = (t % 1.8) / 1.8; ctx.strokeStyle = U.rgba(color, 0.7 * (1 - k)); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, s * 1.6 + k * 16, 0, 6.283); ctx.stroke(); }
  }
  function drawGalaxy(cv, geo, W, H, t) {
    const ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), U = HR.U, C = HR.Campaign;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!gxStatic || gxStatic.W !== W || gxStatic.H !== H) gxStatic = buildStatic(W, H, geo);
    ctx.drawImage(gxStatic.cv, 0, 0, W, H);
    if (!gxTw || gxTw.W !== W || gxTw.H !== H) { gxTw = { W, H, list: [] }; for (let i = 0; i < 70; i++) gxTw.list.push({ x: Math.random() * W, y: Math.random() * H, s: U.rand(0.6, 1.6), p: U.rand(0, 6.28), v: U.rand(0.6, 1.6) }); }
    ctx.fillStyle = '#fff';
    gxTw.list.forEach(st => { ctx.globalAlpha = 0.3 + 0.55 * (0.5 + 0.5 * Math.sin(t * st.v + st.p)); ctx.beginPath(); ctx.arc(st.x, st.y, st.s, 0, 6.283); ctx.fill(); });
    ctx.globalAlpha = 1;
    // caminho: nó → nó → centro. Estado por segmento: done (sólido, brilho) · next (tracejado animado) · locked (fraco)
    const pts = geo.pts.concat([{ x: geo.cx, y: geo.cy }]);
    ctx.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      const a = pts[i], b = pts[i + 1], c = ctrl(a, b, i);
      const R = HR.REGIONS[Math.min(9, i)];
      const done = i < 9 ? C.isRegionUnlocked(i + 1) : C.singularityMastered();
      const next = !done && C.isRegionUnlocked(i);
      const col = done ? R.accent : next ? R.accent : '#7d879f';
      if (done) { ctx.strokeStyle = U.rgba(col, 0.28); ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(c.x, c.y, b.x, b.y); ctx.stroke(); }
      ctx.strokeStyle = U.rgba(col, done ? 0.9 : next ? 0.7 : 0.22); ctx.lineWidth = done ? 4 : 3;
      ctx.setLineDash(done ? [] : [6, 10]); ctx.lineDashOffset = next ? -t * 40 : 0;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(c.x, c.y, b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
      if (next) { for (let k = 0; k < 3; k++) { const f = ((t * 0.25 + k / 3) % 1), x = (1 - f) * (1 - f) * a.x + 2 * (1 - f) * f * c.x + f * f * b.x, y = (1 - f) * (1 - f) * a.y + 2 * (1 - f) * f * c.y + f * f * b.y; ctx.fillStyle = U.rgba('#ffffff', 0.9 * Math.sin(f * Math.PI)); ctx.beginPath(); ctx.arc(x, y, 3, 0, 6.283); ctx.fill(); } }
    }
    const cur = C.currentRegion();
    geo.pts.forEach((p, i) => { const st = C.regionState(i); drawMiniGalaxy(ctx, p.x, p.y, 17, HR.REGIONS[i].accent, t, i, st === 'locked' ? 'locked' : (i === cur ? 'current' : st)); });
    drawBlackHole(ctx, geo, W, H, t, dpr, gxStatic.cv);
  }
  // TON 618: lente gravitacional (a própria imagem redesenhada em coroas com zoom e giro), disco de acreção em dois
  // planos com Doppler (lado que vem até nós mais claro), anel de fótons, sombra com borda azulada, partículas caindo.
  function drawBlackHole(ctx, geo, W, H, t, dpr, img) {
    const U = HR.U, cx = geo.cx, cy = geo.cy;
    const lens = [[30, 48, 1.28, 0.06], [48, 68, 1.15, -0.04], [68, 92, 1.07, 0.02]];
    lens.forEach(([r0, r1, z, rot], i) => {
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r1, 0, 6.283); ctx.arc(cx, cy, r0, 0, 6.283, true); ctx.clip();
      ctx.translate(cx, cy); ctx.rotate(t * rot + i * 0.4); ctx.scale(z, z); ctx.translate(-cx, -cy);
      ctx.drawImage(img, 0, 0, W * dpr, H * dpr, 0, 0, W, H);
      ctx.restore();
    });
    const glow = ctx.createRadialGradient(cx, cy, 20, cx, cy, 110);
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.3);
    glow.addColorStop(0, 'rgba(255,225,170,' + (0.34 + pulse * 0.1).toFixed(3) + ')'); glow.addColorStop(0.5, 'rgba(255,150,90,0.11)'); glow.addColorStop(1, 'rgba(255,150,90,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, 110, 0, 6.283); ctx.fill();
    if (!gxTw.fall) { gxTw.fall = []; for (let i = 0; i < 26; i++) gxTw.fall.push({ a: U.rand(0, 6.28), p: U.rand(0, 1), v: U.rand(0.5, 1.2) }); }
    gxTw.fall.forEach(f => {
      const k = (t * 0.09 * f.v + f.p) % 1, rr = 118 - k * 90, an = f.a + k * 3.2 + t * 0.3;
      const x = cx + Math.cos(an) * rr, y = cy + Math.sin(an) * rr * 0.9, fade = Math.min(1, (rr - 28) / 12);
      ctx.strokeStyle = 'rgba(255,235,200,' + (0.15 + k * 0.55 * fade).toFixed(3) + ')'; ctx.lineWidth = 1 + k;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx + Math.cos(an - 0.12) * (rr + 4), cy + Math.sin(an - 0.12) * (rr + 4) * 0.9); ctx.stroke();
    });
    const tilt = -0.32, RX = 66, RY = 20;
    const disc = (front) => {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
      const g = ctx.createLinearGradient(-RX, 0, RX, 0);
      g.addColorStop(0, 'rgba(255,252,235,0.95)'); g.addColorStop(0.35, 'rgba(255,190,110,0.9)'); g.addColorStop(0.7, 'rgba(255,110,70,0.7)'); g.addColorStop(1, 'rgba(160,40,40,0.45)');
      const a0 = front ? 0 : Math.PI, a1 = front ? Math.PI : Math.PI * 2;
      ctx.strokeStyle = 'rgba(255,170,100,0.22)'; ctx.lineWidth = 22; ctx.beginPath(); ctx.ellipse(0, 0, RX, RY, 0, a0, a1); ctx.stroke();
      ctx.strokeStyle = g; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(0, 0, RX, RY, 0, a0, a1); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, RX * 0.9, RY * 0.9, 0, a0, a1); ctx.stroke();
      for (let i = 0; i < 5; i++) { const an = t * 1.4 + i * 1.257; const sn = Math.sin(an); if (front ? sn < 0 : sn >= 0) continue; ctx.fillStyle = 'rgba(255,250,230,' + (0.5 + 0.4 * Math.max(0, -Math.cos(an))).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(Math.cos(an) * RX * 0.93, sn * RY * 0.93, 2.6, 0, 6.283); ctx.fill(); }
      ctx.restore();
    };
    disc(false);
    ctx.fillStyle = '#02030a'; ctx.beginPath(); ctx.arc(cx, cy, 27, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(130,170,255,0.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, 27.5, 0, 6.283); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,246,225,0.35)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, 30, 0, 6.283); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,250,235,0.95)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(cx, cy, 30, 0, 6.283); ctx.stroke();
    disc(true);
  }
  function renderGalaxy() {
    const body = $('#galaxy-body'), cv = $('#galaxy-canvas'), host = $('#galaxy-nodes'); if (!body || !cv) return;
    const C = HR.Campaign, d = HR.Store.data;
    const r = body.getBoundingClientRect(); if (!r.width || !r.height) { setTimeout(renderGalaxy, 60); return; }
    const W = Math.round(r.width), H = Math.round(r.height), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const geo = geometry(W, H);
    if (gxRaf) cancelAnimationFrame(gxRaf);
    const loop = () => { if (!HR.UI.stack.includes('galaxy')) { gxRaf = null; return; } drawGalaxy(cv, geo, W, H, performance.now() / 1000); gxRaf = requestAnimationFrame(loop); };
    loop();
    HR.UI.bind('starsTotal', C.totalStars());
    const cur = C.currentRegion();
    let h = '';
    HR.REGIONS.forEach((R, i) => {
      const st = C.regionState(i), p = geo.pts[i], stars = C.regionStars(i);
      const isCur = i === cur && st !== 'locked';
      const gate = st === 'locked' && C.isRegionUnlocked(i - 1) ? C.gate(i) : null;
      h += '<button type="button" class="gx-node is-' + st + (isCur ? ' is-current' : '') + (LABEL_TOP[i] ? ' lbl-top' : '') + '" data-region="' + i + '" style="left:' + p.x + 'px;top:' + p.y + 'px;' + accentVars(R.accent) + '" aria-label="' + esc(galName(R)) + '">';
      h += '<span class="gx-badge">' + (st === 'locked' ? HR.icon('lock') : st === 'done' ? HR.icon('check') : '<b>' + (i + 1) + '</b>') + '</span>';
      h += '<span class="gx-name"><b>' + esc(galName(R)) + '</b><small>' + esc(regionName(R)) + (st !== 'locked' ? ' · <em>' + stars + '/30</em>' : gate ? ' · <em class="gx-portal">' + esc(HR.t('portal')) + ' ' + gate.open + '/5</em>' : '') + '</small></span>';
      h += '</button>';
    });
    const mastered = C.singularityMastered();
    h += '<button type="button" class="gx-core' + (mastered ? ' is-mastered' : '') + '" id="gx-core" style="left:' + geo.cx.toFixed(0) + 'px;top:' + geo.cy.toFixed(0) + 'px" aria-label="' + esc(HR.t('bh_name')) + '"><span class="gx-core-hit"></span><span class="gx-name"><b>' + esc(HR.t('bh_name')) + '</b><small>' + esc(HR.t('bh_sub')) + (mastered ? ' ' + HR.icon('crown') : '') + '</small></span></button>';
    host.innerHTML = h;
    const foot = $('#galaxy-foot');
    const level = C.currentLevel(), done = C.levelsCleared();
    const complete = done >= 100;
    const nextRi = C.nextPortal(), gate = nextRi != null ? C.gate(nextRi) : null;
    const portalTxt = gate ? ' · ' + esc(HR.t('portal')) + ' ' + gate.open + '/5' : '';
    const regionDone = C.regionCleared(level.ri) && gate != null;
    foot.innerHTML = '<div class="gx-foot-card" style="' + accentVars(HR.REGIONS[level.ri].accent) + '">' +
      '<div class="gx-foot-main"><span class="kicker gx-kicker">' + done + '/100 ' + esc(HR.t('levels')) + ' · ' + C.totalStars() + ' ' + HR.icon('star', '', true) + portalTxt + '</span><b>' + esc(complete ? HR.t('camp_complete') : regionDone ? HR.t('portal') + ': ' + galName(HR.REGIONS[nextRi]) + ' ' + gate.open + '/5' : HR.t('continue_campaign', { n: level.id }) + ' · ' + galName(HR.REGIONS[level.ri])) + '</b></div>' +
      '<button type="button" class="btn btn-play small-btn" id="gx-continue"><span class="ic">' + HR.icon('play') + '</span><span class="btn-label">' + esc(HR.t(complete ? 'levels' : 'play_mode')) + '</span></button></div>';
    if (!body.dataset.bound) {
      body.dataset.bound = '1';
      host.addEventListener('click', e => {
        const core = e.target.closest('#gx-core'); if (core) { e.stopPropagation(); sfx('click'); openSingularityDetail(); return; }
        const btn = e.target.closest('[data-region]'); if (!btn) return; e.stopPropagation();
        const ri = +btn.getAttribute('data-region');
        if (!C.isRegionUnlocked(ri) && !C.isRegionUnlocked(ri - 1)) { sfx('error'); HR.UI.toast(HR.icon('lock') + ' ' + HR.t('region_locked_hint', { name: galName(HR.REGIONS[ri - 1]) }), 'bad'); btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake'); return; }
        sfx('click'); HR.UI.open('region', ri);
      });
    }
    $('#gx-continue').addEventListener('click', e => { e.stopPropagation(); sfx('click'); HR.UI.open('region', regionDone ? nextRi : level.ri); });
    d.hints.galaxy = true; HR.Store.save();
  }

  /* =================== PORTAL / CONTRATOS / NÚCLEO (v4) =================== */
  const GATE_ICON = { boss: 'crown', stars: 'star', rank: 'award', core: 'orbit', contracts: 'flag' };
  function gateHtml(ri) {
    const C = HR.Campaign; if (ri <= 0) return '';
    const gt = C.gate(ri), Rp = HR.REGIONS[ri - 1];
    let h = '<div class="reg-card portal' + (gt.ok ? ' open' : '') + '"><span class="reg-card-ic">' + HR.icon(gt.ok ? 'unlock' : 'lock') + '</span><div class="reg-card-main"><span class="kicker">' + esc(HR.t('portal')) + ' · ' + gt.open + '/5</span><b>' + esc(HR.t(gt.ok ? 'portal_open' : 'portal_locked')) + '</b><p>' + esc(HR.t('portal_d', { name: regionName(Rp) })) + '</p><div class="gate-list">';
    gt.items.forEach(it => { h += '<span class="gate' + (it.ok ? ' ok' : '') + '"><span class="gate-ic">' + HR.icon(it.ok ? 'check' : GATE_ICON[it.id]) + '</span><span class="gate-txt">' + esc(HR.t('gate_' + it.id, { n: it.b, name: regionName(Rp) })) + '</span><b>' + (it.id === 'boss' ? '' : Math.min(it.a, it.b) + '/' + it.b) + '</b></span>'; });
    return h + '</div></div></div>';
  }
  function contractsHtml(ri) {
    const C = HR.Campaign, list = C.contractsOf(ri), done = C.contractsDone(ri);
    let h = '<div class="section-title">' + esc(HR.t('contracts')) + ' <span class="muted">' + done + '/5</span></div><p class="lb-note contracts-note">' + esc(HR.t('contracts_d', { n: HR.CONFIG.PROGRESSION.contractsNeed })) + '</p>';
    list.forEach(c => {
      const ok = C.contractDone(c), p = ok ? c.target : C.contractProgress(c);
      h += '<div class="contract' + (ok ? ' done' : '') + '"><span class="m-ic">' + HR.icon(ok ? 'check' : c.icon) + '</span><div class="m-info"><div class="m-title">' + esc(C.contractText(c)) + '</div><div class="bar' + (ok ? ' green' : '') + '"><span class="bar-fill" style="width:' + (p / c.target * 100).toFixed(0) + '%"></span></div><div class="m-meta"><span class="num">' + HR.U.fmt(p) + ' / ' + HR.U.fmt(c.target) + '</span><span class="m-reward"><i class="ic-coin"></i>' + c.coins + ' <i class="ic-gem"></i>' + c.gems + ' <b class="xp">+' + c.xp + ' XP</b></span></div></div></div>';
    });
    return h;
  }
  function coreHtml() {
    const n = HR.Core.level(), C = HR.CONFIG.CORE, m = HR.Core.mods(), cost = HR.Core.cost(), nm = HR.Core.nextMilestone(n);
    const pct = v => Math.round(v * 100);
    let h = '<div class="core-card"><div class="core-head"><span class="core-orb"><i></i></span><div class="core-main"><span class="kicker">' + esc(HR.t('core')) + '</span><b>' + esc(HR.t('core_level', { n })) + ' <small>/ ' + C.maxLevel + '</small></b><p>' + esc(HR.t('core_d')) + '</p></div></div>';
    h += '<div class="core-bonus"><span>' + HR.icon('coin') + ' ' + esc(HR.t('core_b_coins', { n: pct(C.coinMul * n) })) + '</span><span>' + HR.icon('ring') + ' ' + esc(HR.t('core_b_forgive', { n: pct(C.forgive * n) })) + '</span><span>' + HR.icon('target') + ' ' + esc(HR.t('core_b_perfect', { n: (C.perfect * n * 100).toFixed(1).replace('.0', '') })) + '</span><span>' + HR.icon('award') + ' ' + esc(HR.t('core_b_xp', { n: pct(C.xp * n) })) + '</span>';
    if (m.shieldCap) h += '<span>' + HR.icon('shield') + ' +' + m.shieldCap + ' ' + esc(HR.t('core_ms_shield').replace('+1 ', '')) + '</span>';
    if (m.startShield) h += '<span>' + HR.icon('shield') + ' ' + esc(HR.t('core_ms_start')) + '</span>';
    if (m.life) h += '<span>' + HR.icon('heart') + ' ' + esc(HR.t('core_ms_life')) + '</span>';
    if (m.pickupMul > 1) h += '<span>' + HR.icon('gift') + ' ' + esc(HR.t('core_ms_pickup')) + '</span>';
    h += '</div>';
    if (nm) h += '<p class="core-next">' + HR.icon('sparkle') + ' ' + esc(HR.t('core_next_ms', { n: nm })) + ': ' + esc(HR.t(HR.Core.milestone(nm))) + '</p>';
    h += '<button type="button" class="btn ' + (cost == null ? 'btn-ghost' : 'btn-play') + '" id="core-up"' + (cost == null ? ' disabled' : '') + '><span class="ic">' + HR.icon(cost == null ? 'check' : 'arrowUp') + '</span><span class="btn-label">' + (cost == null ? esc(HR.t('core_max')) : esc(HR.t('upgrade')) + ' · <i class="ic-coin"></i>' + HR.U.fmt(cost)) + '</span></button></div>';
    return h;
  }
  function bindCore(body) {
    const b = $('#core-up', body); if (!b) return;
    b.addEventListener('click', e => { e.stopPropagation(); if (HR.Core.upgrade()) { const n = HR.Core.level(); HR.UI.toast(HR.icon('orbit') + ' ' + HR.t('core_up_toast', { n }) + (HR.Core.milestone(n) ? ' · ' + HR.t(HR.Core.milestone(n)) : ''), 'good'); const ach = HR.Achievements.check(); ach.forEach((a, i) => HR.UI.achToast(a, i)); HR.UI.rerenderAbilities(); } });
  }

  /* =================== FICHA DA REGIÃO =================== */
  let curRegion = 0, previewOn = false;
  function levelNodes(R, ri, bodyW) {
    const C = HR.Campaign, levels = C.levelsOf(ri), current = C.currentLevel();
    // caminho em "serpentina": 3 por linha (esq→dir, dir→esq…), chefe sozinho na última linha; ligações curvas
    const cols = [18, 50, 82], pitch = 88, top = 44;
    const pts = levels.map((l, i) => {
      if (i === 9) return { x: 50, y: top + 3 * pitch + 16 };
      const row = Math.floor(i / 3), col = i % 3;
      return { x: row % 2 ? cols[2 - col] : cols[col], y: top + row * pitch };
    });
    const height = pts[9].y + 78, W = bodyW || 340;
    let h = '<div class="lv-path" style="height:' + height + 'px"><svg class="lv-links" aria-hidden="true">';
    for (let i = 0; i < 9; i++) {
      const a = { x: pts[i].x / 100 * W, y: pts[i].y }, b = { x: pts[i + 1].x / 100 * W, y: pts[i + 1].y }, c = ctrl(a, b, i);
      const sA = C.stars(levels[i].id), sB = C.stars(levels[i + 1].id);
      const state = sB > 0 ? 'done' : sA > 0 ? 'next' : '';
      const dd = 'd="M' + a.x.toFixed(1) + ' ' + a.y + ' Q' + c.x.toFixed(1) + ' ' + c.y.toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + b.y + '"';
      if (state === 'done') h += '<path class="lv-link-glow" ' + dd + '/>';
      h += '<path class="lv-link' + (state ? ' ' + state : '') + '" ' + dd + '/>';
    }
    h += '</svg>';
    levels.forEach((l, i) => {
      const p = pts[i], isBoss = !!l.boss, stars = C.stars(l.id), unlocked = C.isUnlocked(l.id), isCur = current && current.id === l.id;
      const cls = ['lv-node', isBoss ? 'lv-node--boss' : '', stars > 0 ? 'is-done' : '', isCur ? 'is-current' : '', unlocked ? '' : 'is-locked'].filter(Boolean).join(' ');
      h += '<button type="button" class="' + cls + '" data-level="' + esc(l.id) + '" style="left:' + p.x + '%;top:' + p.y + 'px" aria-label="' + esc(HR.t('level_n', { n: l.id })) + '">';
      h += '<span class="lv-circle-wrap">' + (isCur ? '<span class="lv-halo"></span>' : '') + '<span class="lv-circle">' + (isBoss ? '<span class="lv-boss-ic">' + HR.icon(HR.BOSSES[l.boss].icon) + '</span>' : '<b>' + (i + 1) + '</b>') + '</span>' + (stars > 0 && !isBoss ? '<span class="lv-orbit"></span>' : '') + (!unlocked ? '<span class="lv-lock">' + HR.icon('lock') + '</span>' : '') + (isBoss ? '<span class="lv-boss-tag">' + esc(HR.t('boss')) + '</span>' : '') + ((l.mods && l.mods.length) || (l.events && l.events.length) ? '<span class="lv-dot-ev"></span>' : '') + '</span>';
      h += starsHtml(stars);
      if (isBoss) h += '<span class="lv-boss-name">' + esc(HR.t('boss_' + l.boss)) + '</span>';
      h += '</button>';
    });
    return h + '</div>';
  }
  // cabeçalho animado da galáxia: fundo do bioma (o mesmo motor do jogo) + a galáxia + um arco e a bola
  let heroRaf = null;
  function startRegionHero(R, ri) {
    const cv = $('#reg-hero-cv'); if (!cv) return;
    const host = cv.parentElement, rect = host.getBoundingClientRect();
    const W = Math.round(rect.width) || 340, H = Math.round(rect.height) || 150, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const ctx = cv.getContext('2d');
    const bg = new HR.Render.Background(); bg.resize(W, H); bg.setTheme({ colors: R.colors, shapes: R.shapes, stars: R.stars, fx: R.fx }); bg.setFx(R.fx || null); bg.setTint(R.accent);
    const skin = HR.CONFIG.SKINS.find(s => s.id === HR.Store.data.equipped.skin) || HR.CONFIG.SKINS[0];
    const t0 = performance.now(); let last = t0;
    const draw = now => {
      const t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bg.update(dt, 110, { x: -1, y: 0 }, 0.35); bg.draw(ctx, t);
      const gx = W * 0.76, gy = H * 0.5;
      drawMiniGalaxy(ctx, gx + 26, gy - 30, 22, R.accent, t, ri, 'open');
      const ring = { x: gx, y: gy + 6, r: H * 0.33, tilt: Math.sin(t * 0.45) * 0.55, accent: R.accent, color: R.accent, flash: 0, hit: false, type: 'plain', fx: R.fx, index: ri };
      HR.Render.drawRing(ctx, ring, 'back', { t });
      HR.Render.drawBall(ctx, gx - 6, gy + 6 + Math.sin(t * 1.5) * 9, 15, skin, t, { vy: Math.cos(t * 1.5) * 400 });
      HR.Render.drawRing(ctx, ring, 'front', { t });
      const sh = ctx.createLinearGradient(0, 0, W * 0.7, 0); sh.addColorStop(0, 'rgba(4,6,14,0.55)'); sh.addColorStop(1, 'rgba(4,6,14,0)');
      ctx.fillStyle = sh; ctx.fillRect(0, 0, W * 0.7, H);
    };
    if (heroRaf) cancelAnimationFrame(heroRaf);
    const loop = now => { if (!HR.UI.stack.includes('region')) { heroRaf = null; return; } draw(now); heroRaf = requestAnimationFrame(loop); };
    loop(performance.now());
  }
  function renderRegion(ri) {
    const C = HR.Campaign;
    if (ri == null || isNaN(ri)) ri = curRegion; curRegion = ri;
    const R = HR.REGIONS[ri], body = $('#region-body'); if (!R || !body) return;
    HR.Store.data.campaign.lastRegion = ri;
    HR.UI.bind('regionTitle', galName(R)); const rb = $('#screen-region .ribbon span'); if (rb) rb.style.fontSize = galName(R).length > 12 ? '17px' : '';
    $$('#screen-region .ribbon').forEach(el => { el.style.cssText = accentVars(R.accent); });
    HR.UI.bind('regionStars', C.regionStars(ri) + '/30');
    const boss = C.level((ri + 1) + '-10'), info = HR.BOSSES[R.boss];
    const stars = C.regionStars(ri), cleared = C.bossBeaten(ri), unlocked = C.isRegionUnlocked(ri);
    const musicName = HR.t('region_music') + ': ' + HR.t('music_' + R.music);
    let h = '<div class="reg-wrap" style="' + accentVars(R.accent) + '">';
    h += '<div class="reg-hero reg-hero--live" style="background:linear-gradient(160deg,' + R.colors[0] + ',' + R.colors[1] + ' 60%,' + R.colors[2] + ')"><canvas id="reg-hero-cv"></canvas>';
    h += '<div class="reg-hero-text"><span class="kicker">' + esc(HR.t('galaxy_n', { n: ri + 1 })) + ' · ' + esc(HR.t('gal_' + R.gal + '_c')) + '</span><h3>' + esc(galName(R)) + '</h3><p><b>' + esc(regionName(R)) + '</b> · ' + esc(HR.t('reg_' + R.id + '_t')) + '</p></div>';
    h += '<span class="reg-hero-stars">' + HR.icon('star', '', true) + ' <b>' + stars + '</b>/30</span></div>';
    h += '<p class="reg-gal-fact">' + HR.icon('galaxy') + ' <span>' + esc(HR.t('gal_' + R.gal + '_d')) + '</span></p>';
    if (!unlocked) h += gateHtml(ri);
    h += '<div class="reg-card"><span class="reg-card-ic">' + HR.icon('compass') + '</span><div class="reg-card-main"><span class="kicker">' + esc(HR.t('region_mech')) + '</span><p>' + esc(HR.t('reg_' + R.id + '_d')) + '</p></div></div>';
    h += '<div class="reg-card boss' + (cleared ? ' done' : '') + '"><span class="reg-card-ic">' + HR.icon(info.icon) + '</span><div class="reg-card-main"><span class="kicker">' + esc(HR.t('region_boss')) + (cleared ? ' · ' + esc(HR.t('ach_unlocked')) : '') + '</span><b>' + esc(HR.t('boss_' + R.boss)) + '</b><p>' + esc(HR.t('boss_' + R.boss + '_d')) + '</p><span class="reg-chip">' + HR.icon('wave') + ' ' + esc(HR.t('camp_waves_n', { n: info.waves })) + ' · ' + esc(HR.t('rings_n', { n: boss.rings })) + '</span></div></div>';
    h += '<div class="reg-row"><span class="reg-chip gift">' + HR.icon('gift') + ' <span>' + esc(HR.t('region_reward')) + ': <b>' + esc(cosmeticName(R.reward)) + '</b></span></span>';
    h += '<button type="button" class="reg-chip music" id="reg-music">' + HR.icon('music') + ' <span>' + esc(musicName) + '</span></button></div>';
    if (unlocked) h += contractsHtml(ri);
    h += '<div class="section-title">' + esc(HR.t('levels')) + '</div>';
    h += levelNodes(R, ri, body.clientWidth - 4);
    const next = C.levelsOf(ri).find(l => C.stars(l.id) === 0 && C.isUnlocked(l.id));
    if (next && unlocked) h += '<button type="button" class="btn btn-play" id="reg-continue"><span class="ic">' + HR.icon('play') + '</span><span class="btn-label">' + esc(HR.t('continue_campaign', { n: next.id })) + '</span></button>';
    else if (cleared) h += '<p class="lb-note">' + esc(HR.t('world_progress', { a: stars, b: 30 })) + '</p>';
    h += '</div>';
    body.innerHTML = h;
    body.scrollTop = 0;
    startRegionHero(R, ri);
    if (!body.dataset.bound) {
      body.dataset.bound = '1';
      body.addEventListener('click', e => {
        const btn = e.target.closest('[data-level]'); if (!btn) return; e.stopPropagation();
        const id = btn.getAttribute('data-level');
        if (!C.isUnlocked(id)) { sfx('error'); HR.UI.toast(HR.icon('lock') + ' ' + HR.t('locked'), 'bad'); const w = btn.querySelector('.lv-circle-wrap'); if (w) { w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake'); } return; }
        sfx('click'); openLevelDetail(id);
      });
    }
    const cont = $('#reg-continue'); if (cont && next) cont.addEventListener('click', e => { e.stopPropagation(); sfx('click'); openLevelDetail(next.id); });
    $('#reg-music').addEventListener('click', e => { e.stopPropagation(); sfx('click'); if (HR.Music) { HR.Audio.unlock(); HR.Music.play(R.music); HR.Music.setIntensity(0.6); } });
    if (HR.Music && HR.Store.data.settings.music && HR.Audio.unlocked) { HR.Music.play(R.music); HR.Music.setIntensity(0.45); }
    void previewOn;
  }

  /* =================== FICHA DA FASE =================== */
  function openLevelDetail(id) {
    const C = HR.Campaign, level = C.level(id); if (!level) return;
    const modal = $('#modal-item'), host = $('#item-detail'); if (!modal || !host) return;
    const R = HR.REGIONS[level.ri], stars = C.stars(id), isBoss = !!level.boss, info = isBoss ? HR.BOSSES[level.boss] : null;
    const best = (HR.Store.data.campaign.best && HR.Store.data.campaign.best[id]) || 0;
    let h = '<div class="lv-detail-head">';
    h += '<span class="kicker">' + esc(galName(R)) + ' · ' + esc(regionName(R)) + '</span>';
    if (isBoss) h += '<span class="lv-detail-boss"><span class="lv-boss-ic">' + HR.icon(info.icon) + '</span><span class="lv-boss-tag">' + esc(HR.t('boss')) + '</span></span><h3 class="lv-detail-title">' + esc(HR.t('boss_' + level.boss)) + '</h3><span class="lv-detail-sub">' + esc(HR.t('level_n', { n: level.id })) + '</span>';
    else h += '<span class="lv-detail-num"><b>' + (level.li + 1) + '</b></span><h3 class="lv-detail-title">' + esc(HR.t('level_n', { n: level.id })) + '</h3>';
    h += starsHtml(stars, 'lv-stars--big');
    h += '<span class="lv-detail-sub">' + esc(HR.t('world_progress', { a: stars, b: 3 })) + (best > 0 ? ' · ' + esc(HR.t('camp_best_perfects', { n: best })) : '') + '</span></div>';
    h += '<div class="lv-chips"><span class="reg-chip">' + HR.icon('ring') + ' ' + esc(HR.t('rings_n', { n: level.rings })) + '</span>';
    if (info) h += '<span class="reg-chip">' + HR.icon('wave') + ' ' + esc(HR.t('camp_waves_n', { n: info.waves })) + '</span>';
    h += '<span class="reg-chip">' + HR.icon('bolt') + ' ×' + level.speed.toFixed(2) + '</span></div>';
    h += '<div class="lv-dirs"><span class="section-title">' + esc(HR.t('camp_dirs')) + (level.dirEvery ? ' · ' + esc(HR.t('dir_every', { n: level.dirEvery })) : '') + '</span><div class="lv-dir-row">';
    level.dirs.forEach((dir, i) => { if (i) h += '<span class="lv-dir-sep">›</span>'; h += '<span class="lv-dir"><b>' + esc(HR.t('dir_' + dir)) + '</b><small>' + esc(HR.t('camp_dir_' + dir)) + '</small></span>'; });
    h += '</div></div>';
    if (isBoss) h += '<p class="lv-boss-desc">' + esc(HR.t('boss_' + level.boss + '_d')) + '</p>';
    if ((level.mods && level.mods.length) || (level.events && level.events.length)) {
      h += '<div class="lv-mods">';
      (level.mods || []).forEach(m => { h += '<span class="reg-chip mut">' + HR.icon('sliders') + ' <span><b>' + esc(HR.t('mut_' + m)) + '</b> · ' + esc(HR.t('mut_' + m + '_d')) + '</span></span>'; });
      (level.events || []).forEach(ev => { const E = HR.CONFIG.EVENTS && HR.CONFIG.EVENTS[ev.id]; h += '<span class="reg-chip ev" style="--ev:' + (E ? E.color : '#fff') + '">' + HR.icon(E ? E.icon : 'zap') + ' <span><b>' + esc(HR.t('ev_' + ev.id)) + '</b> · ' + esc(HR.t(ev.wave ? 'ev_between_waves' : 'ev_at_ring', { n: ev.at })) + '</span></span>'; });
      h += '</div>';
    }
    h += '<div class="lv-criteria"><span class="section-title">' + esc(HR.t('camp_criteria')) + '</span>';
    ['star_finish', 'star_perfects', 'star_flawless'].forEach((k, i) => { const on = i < stars; h += '<div class="lv-crit' + (on ? ' on' : '') + '"><span class="lv-star' + (on ? ' on' : '') + '">' + HR.icon('star', '', true) + '</span><span>' + esc(HR.t(k)) + '</span>' + (on ? '<span class="lv-crit-check">' + HR.icon('check') + '</span>' : '') + '</div>'; });
    h += '</div>';
    const fr = C.firstClearReward(level), first = stars === 0;
    let rv = '<i class="ic-coin"></i>' + HR.U.fmt(first ? fr.coins : Math.round(fr.coins / 3));
    if (first) rv += ' <i class="ic-gem"></i>' + fr.gems;
    if (first && isBoss) rv += ' <span class="lv-reward-item">' + HR.icon('gift') + ' ' + esc(cosmeticName(R.reward)) + '</span>';
    h += '<div class="lv-reward"><span class="lv-reward-label">' + esc(HR.t(first ? 'camp_first_clear' : 'camp_replay_reward')) + '</span><span class="lv-reward-vals">' + rv + '</span></div>';
    h += '<button type="button" class="btn btn-play" id="lv-btn-play"><span class="ic">' + HR.icon('play') + '</span><span class="btn-label">' + esc(HR.t('play_mode')) + '</span></button>';
    h += '<button type="button" class="btn btn-ghost" id="lv-btn-close"><span class="btn-label">' + esc(HR.t('close')) + '</span></button>';
    host.innerHTML = h;
    host.className = 'modal-card item-detail lv-detail';
    host.style.cssText = accentVars(R.accent);
    $('#lv-btn-play', host).addEventListener('click', e => { e.stopPropagation(); sfx('click'); closeLevelDetail(); HR.UI.startLevel(id); });
    $('#lv-btn-close', host).addEventListener('click', e => { e.stopPropagation(); sfx('click'); closeLevelDetail(); });
    bindBackdrop(modal, host);
    modal.classList.add('visible'); host.scrollTop = 0;
    HR.Analytics.log('level_detail', { id });
  }
  function openSingularityDetail() {
    const modal = $('#modal-item'), host = $('#item-detail'), d = HR.Store.data, mastered = HR.Campaign.singularityMastered();
    let h = '<div class="lv-detail-head"><span class="sg-core">' + HR.icon('orbit') + '</span><span class="kicker">' + esc(HR.t('bh_sub')) + '</span><h3 class="lv-detail-title">' + esc(HR.t('bh_name')) + '</h3><span class="lv-detail-sub">' + esc(HR.t('singularity_d')) + '</span></div><p class="reg-gal-fact">' + HR.icon('galaxy') + ' <span>' + esc(HR.t('bh_d')) + '</span></p>';
    h += '<div class="lv-chips"><span class="reg-chip">' + HR.icon('trophy') + ' ' + esc(HR.t('best')) + ' <b>' + HR.U.fmt(d.best) + '</b></span><span class="reg-chip">' + HR.icon('layers') + ' ' + esc(HR.t('phase_reached')) + ' <b>' + d.bestPhase + '</b></span></div>';
    h += mastered ? '<p class="lv-boss-desc gold">' + HR.icon('crown') + ' ' + esc(HR.t('singularity_mastered')) + '</p>' : '<p class="lb-note">' + esc(HR.t('singularity_hint')) + '</p>';
    h += '<button type="button" class="btn btn-play" id="sg-play"><span class="ic">' + HR.icon('play') + '</span><span class="btn-label">' + esc(HR.t('play_endless')) + '</span></button>';
    h += '<button type="button" class="btn btn-ghost" id="sg-close"><span class="btn-label">' + esc(HR.t('close')) + '</span></button>';
    host.innerHTML = h; host.className = 'modal-card item-detail lv-detail sg-detail'; host.style.cssText = accentVars('#ffcf4a');
    $('#sg-play', host).addEventListener('click', e => { e.stopPropagation(); sfx('click'); closeLevelDetail(); HR.Store.data.mode = 'endless'; HR.Store.save(); HR.UI.startGame('endless'); });
    $('#sg-close', host).addEventListener('click', e => { e.stopPropagation(); sfx('click'); closeLevelDetail(); });
    bindBackdrop(modal, host); modal.classList.add('visible');
  }
  function closeLevelDetail() {
    const modal = $('#modal-item'), host = $('#item-detail'); if (!host.classList.contains('lv-detail')) return;
    modal.classList.remove('visible'); host.classList.remove('lv-detail'); host.classList.remove('sg-detail'); host.style.cssText = '';
    setTimeout(() => { if (!modal.classList.contains('visible') && !host.classList.contains('lv-detail')) host.innerHTML = ''; }, 300);
  }
  function bindBackdrop(modal, host) {
    if (modal.dataset.lvBackdrop) return; modal.dataset.lvBackdrop = '1';
    modal.addEventListener('click', e => { if (e.target === modal && host.classList.contains('lv-detail')) { sfx('click'); closeLevelDetail(); } });
  }

  /* =================== HABILIDADES (loadout + lista) =================== */
  function renderAbilities() {
    const body = $('#abilities-body'); if (!body) return; body.innerHTML = '';
    const eq = HR.Abilities.equipped(), slots = HR.Abilities.slots();
    const coreWrap = HR.U.el('div', '', coreHtml()); body.appendChild(coreWrap); bindCore(coreWrap);
    body.appendChild(HR.U.el('div', 'section-title', HR.t('loadout')));
    const lo = HR.U.el('div', 'lo-row');
    for (let i = 0; i < 2; i++) {
      const id = eq[i], def = id ? HR.Abilities.def(id) : null, locked = i >= slots;
      const el = HR.U.el('button', 'lo-slot' + (def ? ' filled' : '') + (locked ? ' locked' : ''));
      if (def) el.style.setProperty('--ac', def.color);
      el.innerHTML = '<span class="lo-ic">' + HR.icon(locked ? 'lock' : def ? def.icon : 'plus') + '</span><span class="lo-main"><span class="kicker">' + HR.t('slot_n', { n: i + 1 }) + '</span><b>' + (locked ? HR.t('slot_locked_lvl', { n: HR.ABILITY_UPGRADE.secondSlotLevel }) : def ? HR.Abilities.name(id) : HR.t('ability_slot_empty')) + '</b>' + (def ? '<small>' + HR.t('cooldown') + ' ' + HR.Abilities.cooldown(id).toFixed(0) + 's' + (def.dur ? ' · ' + HR.t('duration') + ' ' + HR.Abilities.duration(id).toFixed(1) + 's' : '') + ' · ' + HR.t('ab_level', { n: HR.Abilities.level(id) }) + '</small>' : '<small>' + (locked ? '' : HR.t('tap_to_change')) + '</small>') + '</span>';
      if (!locked) el.addEventListener('click', e => { e.stopPropagation(); sfx('click'); HR.UI.openAbilityPicker(i); });
      lo.appendChild(el);
    }
    body.appendChild(lo);
    body.appendChild(HR.U.el('p', 'lb-note', HR.t('loadout_d')));
    body.appendChild(HR.U.el('div', 'section-title', HR.t('abilities')));
    if (HR.UI.renderAbilityCards) HR.UI.renderAbilityCards(body);
  }
  function rerenderAbilities() { const top = HR.UI.stack[HR.UI.stack.length - 1]; if (top === 'abilities') renderAbilities(); else if (HR.UI.renderShop) HR.UI.renderShop(); HR.UI.refreshMenu(); }

  /* =================== ÁLBUM (coleção) =================== */
  const CAT_ICONS = { flight: 'ring', precision: 'target', wealth: 'coin', galaxy: 'galaxy', power: 'zap', collection: 'bag', dedication: 'calendar', secret: 'eye' };
  const ALB_TABS = ['ach', 'rings', 'items', 'bosses', 'skins', 'trails', 'themes', 'titles'];
  const ALB_ICONS = { ach: 'trophy', rings: 'ring', items: 'gift', bosses: 'crown', skins: 'ring', trails: 'sparkle', themes: 'layers', titles: 'award' };
  function albumCounts() {
    const d = HR.Store.data, C = HR.Campaign, c = HR.Achievements.counts();
    const bosses = HR.REGIONS.filter((R, i) => C.bossBeaten(i)).length;
    const titles = HR.CONFIG.LEVEL_TITLES.filter(([lv]) => d.level >= lv).length + d.titles.length;
    const a = c.a + d.codex.rings.length + d.codex.items.length + bosses + d.owned.skins.length + d.owned.trails.length + d.owned.themes.length + titles;
    const b = c.b + Object.keys(HR.CONFIG.RING_TYPES).length + HR.CONFIG.PICKUPS.length + 10 + HR.CONFIG.SKINS.length + HR.CONFIG.TRAILS.length + HR.CONFIG.THEMES.length + HR.CONFIG.LEVEL_TITLES.length + HR.TITLES.length;
    return { a, b };
  }
  function albCard(o) {
    const el = HR.U.el('div', 'alb-card ' + (o.on ? 'on' : 'off')); el.style.setProperty('--rc', o.color || '#4cf0ff');
    const ic = HR.U.el('span', 'alb-ic'); if (o.node) ic.appendChild(o.node); else ic.innerHTML = o.html || '';
    el.appendChild(ic);
    el.appendChild(HR.U.el('b', 'alb-name', esc(o.on ? o.name : (o.nameHidden || '???'))));
    el.appendChild(HR.U.el('span', 'alb-desc', esc(o.on ? o.desc : (o.descHidden || HR.t('alb_unknown')))));
    el.appendChild(HR.U.el('span', 'alb-tag', esc(o.tag || HR.t(o.on ? 'alb_found' : 'alb_unknown_tag'))));
    return el;
  }
  function renderAchievements() {
    const tabs = $('#ach-tabs'), body = $('#ach-body'); if (!tabs || !body) return;
    if (!ALB_TABS.includes(HR.UI.achTab)) HR.UI.achTab = 'ach';
    if (!tabs.childElementCount) {
      ALB_TABS.forEach(tb => { const b = HR.U.el('button', 'tab' + (tb === HR.UI.achTab ? ' active' : ''), HR.icon(ALB_ICONS[tb]) + '<span>' + esc(HR.t('alb_' + tb)) + '</span>'); b.setAttribute('data-tab', tb); tabs.appendChild(b); });
      HR.UI.wireTabs('ach-tabs', t => { HR.UI.achTab = t; renderAchievements(); });
    }
    HR.UI.setTab('ach-tabs', HR.UI.achTab);
    const cnt = albumCounts(); HR.UI.bind('achCount', cnt.a + '/' + cnt.b);
    HR.UI.stopPreviews();
    body.innerHTML = '';
    const d = HR.Store.data, tab = HR.UI.achTab, T = HR.CONFIG;
    if (tab === 'ach') {
      const c = HR.Achievements.counts();
      body.appendChild(HR.U.el('div', 'alb-summary', '<span class="kicker">' + esc(HR.t('achievements')) + '</span><b class="num">' + c.a + '/' + c.b + '</b>'));
      HR.ACH_CATS.forEach(cat => {
        const list = HR.Achievements.list(cat), done = list.filter(a => a.unlocked).length;
        body.appendChild(HR.U.el('div', 'section-title', HR.icon(CAT_ICONS[cat]) + ' ' + esc(HR.t('ach_' + cat)) + ' <span class="muted">' + done + '/' + list.length + '</span>'));
        list.forEach(a => {
          const el = HR.U.el('div', 'ach' + (a.unlocked ? ' on' : '') + (a.hidden ? ' hidden' : ''));
          el.style.setProperty('--p', a.frac.toFixed(3));
          el.innerHTML = '<span class="ach-ic"><span class="ach-ring"></span><span class="ach-ic-in">' + HR.icon(a.hidden ? 'eye' : a.unlocked ? 'trophy' : a.icon) + '</span></span>' +
            '<div class="ach-main"><b>' + esc(a.name) + '</b><span>' + esc(a.desc) + '</span>' + (!a.unlocked && !a.hidden ? '<small class="num">' + HR.U.fmt(a.progress) + ' / ' + HR.U.fmt(a.target) + '</small>' : a.unlocked && a.title ? '<small class="ach-title">' + HR.icon('award') + ' ' + esc(HR.t(a.title)) + '</small>' : '') + '</div>' +
            '<span class="ach-reward">' + (a.unlocked ? HR.icon('check') : '<i class="ic-gem"></i>' + a.gems) + '</span>';
          body.appendChild(el);
        });
      });
      return;
    }
    const grid = HR.U.el('div', 'alb-grid');
    let got = 0, total = 0;
    const add = o => { total++; if (o.on) got++; grid.appendChild(albCard(o)); };
    if (tab === 'rings') Object.keys(T.RING_TYPES).forEach(k => { const on = d.codex.rings.includes(k); const ring = HR.U.el('span', 'alb-ring'); add({ on, color: T.RING_TYPES[k].color, node: ring, name: HR.t('rt_' + k), desc: HR.t('rt_' + k + '_d'), descHidden: HR.t('rt_' + k + '_hint') }); });
    else if (tab === 'items') T.PICKUPS.forEach(p => { const on = d.codex.items.includes(p.id); add({ on, color: p.color, html: HR.icon(p.icon), name: HR.t('pk_' + p.id), desc: HR.t('pk_' + p.id + '_d') }); });
    else if (tab === 'bosses') HR.REGIONS.forEach((R, i) => { const on = HR.Campaign.bossBeaten(i); add({ on, color: R.accent, html: HR.icon(HR.BOSSES[R.boss].icon), name: HR.t('boss_' + R.boss), desc: galName(R) + ' · ' + HR.t('boss_' + R.boss + '_d'), descHidden: galName(R), tag: on ? HR.t('alb_beaten') : HR.t('alb_unknown_tag') }); });
    else if (tab === 'skins' || tab === 'trails' || tab === 'themes') {
      const pre = { skins: 'skin_', trails: 'trail_', themes: 'theme_' }[tab], fl = { skins: 'flavor_skin_', trails: 'flavor_trail_', themes: 'flavor_theme_' }[tab];
      HR.Unlocks.catalog(tab).forEach(item => {
        const on = HR.Unlocks.owned(tab, item.id), eq = HR.Unlocks.equipped(tab) === item.id;
        const node = HR.UI.shopPreview ? HR.UI.shopPreview(tab, item, 60, false) : null;
        if (node && node.classList && node.classList.contains('shop-swatch')) { node.style.width = '56px'; node.style.height = '56px'; node.style.borderRadius = '50%'; }
        add({ on, color: on ? (eq ? '#35e29a' : '#4cf0ff') : '#9aa6c9', node, name: HR.t(pre + item.id), nameHidden: HR.t(pre + item.id), desc: HR.t(fl + item.id), descHidden: item.cur === 'pack' ? HR.t('prod_starter_pack') : (item.price === 0 ? HR.t('free') : (item.cur === 'gems' ? item.price + ' ' + HR.t('tab_gems').toLowerCase() : item.price + ' ' + HR.t('coins_earned').toLowerCase()) + ' · ' + HR.t('locked_lvl', { n: item.lvl })), tag: eq ? HR.t('equipped') : (on ? HR.t('owned') : HR.t('alb_unknown_tag')) });
      });
    }
    else if (tab === 'titles') {
      T.LEVEL_TITLES.forEach(([lv, key]) => { const on = d.level >= lv; add({ on, color: '#ffcf4a', html: HR.icon('award'), name: HR.t(key), nameHidden: HR.t(key), desc: HR.t('alb_title_level', { n: lv }), descHidden: HR.t('alb_title_level', { n: lv }), tag: d.title == null && on && HR.Progress.titleKey(d.level) === key ? HR.t('equipped') : undefined }); });
      HR.TITLES.forEach(key => { const on = d.titles.includes(key); const ach = HR.ACHIEVEMENTS.find(a => a.title === key); add({ on, color: '#ff8a3d', html: HR.icon('crown'), name: HR.t(key), nameHidden: HR.t(key), desc: ach ? HR.t('alb_title_ach', { name: HR.t('a_' + ach.id) }) : '', descHidden: ach ? HR.t('alb_title_ach', { name: HR.t('a_' + ach.id) }) : '', tag: d.title === key ? HR.t('equipped') : undefined }); });
    }
    body.appendChild(HR.U.el('div', 'alb-summary', '<span class="kicker">' + esc(HR.t('alb_' + tab)) + '</span><b class="num">' + got + '/' + total + '</b>'));
    body.appendChild(grid);
    HR.UI.startPreviews();
  }

  Object.assign(HR.UI, { renderGalaxy, renderRegion, openLevelDetail, closeLevelDetail, openSingularityDetail, renderAbilities, renderAchievements, rerenderAbilities });

  /* ---------------- textos ---------------- */
  Object.assign(HR.I18N.pt, {
    album: 'Álbum', alb_ach: 'Conquistas', alb_rings: 'Arcos', alb_items: 'Itens', alb_bosses: 'Chefes', alb_skins: 'Bolas', alb_trails: 'Rastros', alb_themes: 'Temas', alb_titles: 'Títulos',
    alb_found: 'Descoberto', alb_unknown: 'Ainda não descoberto', alb_unknown_tag: 'Falta', alb_beaten: 'Vencido', alb_title_level: 'Nível {n}', alb_title_ach: 'Conquista: {name}',
    rt_plain: 'Arco Azul', rt_plain_d: 'Vem reto. O básico.', rt_plain_hint: 'Passe por um arco azul.',
    rt_wave: 'Arco Verde', rt_wave_d: 'Sobe e desce em onda. Espere o momento.', rt_wave_hint: 'Passe por um arco verde.',
    rt_tilt: 'Arco Amarelo', rt_tilt_d: 'Vem inclinado, na diagonal. Entre pelo eixo do traço.', rt_tilt_hint: 'Passe por um arco amarelo.',
    rt_spin: 'Arco Vermelho', rt_spin_d: 'Gira sem parar. Passe quando estiver aberto.', rt_spin_hint: 'Passe por um arco vermelho.',
    rt_pulse: 'Arco Roxo', rt_pulse_d: 'Pulsa ou encolhe conforme se aproxima.', rt_pulse_hint: 'Passe por um arco roxo.',
    rt_ghost: 'Arco Branco', rt_ghost_d: 'Só aparece quando está perto.', rt_ghost_hint: 'Passe por um arco que aparece tarde.',
    rt_gold: 'Anel Dourado', rt_gold_d: 'Bônus de moedas. Vem com o perk Anel Dourado.', rt_gold_hint: 'Passe por um anel dourado.',
    rt_anomaly: 'Anomalia', rt_anomaly_d: 'Imune a piloto, fantasma, estrela e escudo. Exige a sua mão. Passar dá bônus.', rt_anomaly_hint: 'Vença uma anomalia na Singularidade.',
    pk_coins: 'Saco de moedas', pk_coins_d: '+10 moedas na hora.', pk_shield: 'Escudo', pk_shield_d: '+1 escudo (absorve um erro).', pk_magnet: 'Ímã', pk_magnet_d: 'Atrai moedas e itens por 8 s.',
    pk_slow: 'Câmera lenta', pk_slow_d: 'Tempo a 45 % por 4 s.', pk_star: 'Estrela', pk_star_d: 'Invencível por 6 s: atravessa bordas e destrói obstáculos.', pk_life: 'Vida extra', pk_life_d: 'Continua automaticamente ao morrer.', pk_gem: 'Gema', pk_gem_d: '+1 gema (raro).',
    miss: 'ERROU', misses: 'Erros', items_taken: 'Itens', rings_passed: 'Arcos', anomaly_warn: 'ANOMALIA', anomaly_warn_d: 'Passe por ela você mesmo', anomaly_beat: 'ANOMALIA VENCIDA', anomaly_hit: 'ANOMALIA!', discover_new: 'Novo no Álbum: {name}',
    camp_complete: 'Galáxia concluída!', camp_dirs: 'Direções', camp_dir_right: 'Direita', camp_dir_top: 'Cima', camp_dir_left: 'Esquerda', camp_dir_bottom: 'Baixo',
    camp_waves_n: '{n} ondas', camp_criteria: 'Como ganhar estrelas', camp_best_perfects: 'Melhor: {n} perfeitos', camp_first_clear: 'Prêmio da 1ª vitória', camp_replay_reward: 'Prêmio por repetir',
    dir_every: 'troca a cada {n} arcos', singularity_hint: 'Vença o chefe da região 10 para dominar a Singularidade.', loadout: 'Equipadas', loadout_d: 'Toque num slot para trocar. Use na partida com os botões dos cantos (Q/E no teclado).',
    slot_n: 'Slot {n}', tap_to_change: 'Toque para escolher', ach_all: 'Todas',
    portal: 'Portal', portal_open: 'Portal aberto', portal_locked: 'Portal fechado', portal_d: 'Para entrar, complete em {name}:',
    gate_boss: 'Vencer o chefe de {name}', gate_stars: '{n} estrelas em {name}', gate_rank: 'Patente {n} (nível do jogador)', gate_core: 'Núcleo nível {n}', gate_contracts: '{n} contratos de {name}',
    contracts: 'Contratos', contracts_d: 'Objetivos desta região. O prêmio chega sozinho no fim da partida; {n} deles abrem o Portal seguinte.', contract_done: 'Contrato concluído: {name}',
    c_perfects: 'Faça {n} perfeitos nesta região', c_clears: 'Conclua {n} fases desta região', c_coins: 'Colete {n} moedas nesta região', c_pickups: 'Pegue {n} itens nesta região', c_flawless: 'Conclua {n} fases sem dano aqui', c_events: 'Vença {n} eventos nesta região', c_nomiss: 'Passe {n} arcos seguidos sem errar aqui', c_bossflawless: 'Vença o chefe desta região sem dano',
    core: 'Núcleo', core_d: 'A força da sua bola. Cada nível melhora tudo um pouco e abre regiões.', core_level: 'Núcleo {n}', core_max: 'Núcleo no máximo', core_b_coins: '+{n} % moedas', core_b_forgive: '+{n} % perdão na borda', core_b_perfect: '+{n} % zona de perfeito', core_b_xp: '+{n} % XP',
    core_ms_shield: '+1 escudo máximo', core_ms_start: 'Começa com 1 escudo', core_ms_life: '1 vida extra por partida', core_ms_pickup: 'Sacos de moedas +50 %', core_next_ms: 'Marco no nível {n}', core_up_toast: 'Núcleo nível {n}!',
    mods: 'Modificadores', mut_narrow: 'Estreito', mut_narrow_d: 'arcos 10 % menores', mut_dense: 'Denso', mut_dense_d: 'arcos mais juntos', mut_wind: 'Vento', mut_wind_d: 'mais arcos inclinados', mut_pairs: 'Pares', mut_pairs_d: 'mais arcos duplos', mut_bursts: 'Rajadas', mut_bursts_d: 'velocidade em surtos',
    shattered: 'DESPEDAÇOU',
    ev_at_ring: 'no arco {n}', ev_between_waves: 'entre ondas', ev_warn: 'À FRENTE', ev_done: 'EVENTO VENCIDO', ev_fail: 'EVENTO PERDIDO', ev_escaped: 'O GUARDIÃO ESCAPOU',
    ev_asteroids: 'Asteroides', ev_asteroids_d: 'Desvie das rochas e pegue as moedas', ev_warp: 'Dobra', ev_warp_d: 'Velocidade máxima, arcos grandes, moedas ×2', ev_sentinel: 'Sentinela', ev_sentinel_d: 'Desvie dos tiros e continue passando', ev_bonanza: 'Bonança', ev_bonanza_d: 'Chuva de moedas: pegue tudo', ev_guardian: 'Guardião', ev_guardian_d: 'Passe pelos 3 arcos gigantes',
    rt_guardian: 'Arco Guardião', rt_guardian_d: 'Gigante, oscila e encolhe a cada passagem. Aparece no evento Guardião.', rt_guardian_hint: 'Enfrente um Guardião.',
    music_r1: 'Berço de Luz', music_r2: 'Maré Alta', music_r3: 'Jardim de Vidro', music_r4: 'Ferro Quente', music_r5: 'Névoa Baixa', music_r6: 'Prisma', music_r7: 'Rajada', music_r8: 'Fundo do Abismo', music_r9: 'Espiral', music_r10: 'Horizonte de Eventos', music_menu: 'Tema ORBO', music_singularity: 'Singularidade'
  });
  Object.assign(HR.I18N.en, {
    album: 'Album', alb_ach: 'Achievements', alb_rings: 'Rings', alb_items: 'Items', alb_bosses: 'Bosses', alb_skins: 'Balls', alb_trails: 'Trails', alb_themes: 'Themes', alb_titles: 'Titles',
    alb_found: 'Discovered', alb_unknown: 'Not discovered yet', alb_unknown_tag: 'Missing', alb_beaten: 'Beaten', alb_title_level: 'Level {n}', alb_title_ach: 'Achievement: {name}',
    rt_plain: 'Blue Ring', rt_plain_d: 'Comes straight. The basics.', rt_plain_hint: 'Pass a blue ring.',
    rt_wave: 'Green Ring', rt_wave_d: 'Rises and falls in a wave. Wait for the moment.', rt_wave_hint: 'Pass a green ring.',
    rt_tilt: 'Yellow Ring', rt_tilt_d: 'Comes tilted, diagonal. Enter along the tick.', rt_tilt_hint: 'Pass a yellow ring.',
    rt_spin: 'Red Ring', rt_spin_d: 'Spins without rest. Pass when it is open.', rt_spin_hint: 'Pass a red ring.',
    rt_pulse: 'Purple Ring', rt_pulse_d: 'Pulses or shrinks as it approaches.', rt_pulse_hint: 'Pass a purple ring.',
    rt_ghost: 'White Ring', rt_ghost_d: 'Only appears when close.', rt_ghost_hint: 'Pass a ring that appears late.',
    rt_gold: 'Golden Ring', rt_gold_d: 'Coin bonus. Comes with the Golden Ring perk.', rt_gold_hint: 'Pass a golden ring.',
    rt_anomaly: 'Anomaly', rt_anomaly_d: 'Immune to autopilot, ghost, star and shield. Needs your hand. Passing gives a bonus.', rt_anomaly_hint: 'Beat an anomaly in the Singularity.',
    pk_coins: 'Coin bag', pk_coins_d: '+10 coins instantly.', pk_shield: 'Shield', pk_shield_d: '+1 shield (absorbs one mistake).', pk_magnet: 'Magnet', pk_magnet_d: 'Pulls coins and items for 8 s.',
    pk_slow: 'Slow motion', pk_slow_d: 'Time at 45% for 4 s.', pk_star: 'Star', pk_star_d: 'Invincible for 6 s: passes rims and destroys obstacles.', pk_life: 'Extra life', pk_life_d: 'Continues automatically on death.', pk_gem: 'Gem', pk_gem_d: '+1 gem (rare).',
    miss: 'MISS', misses: 'Misses', items_taken: 'Items', rings_passed: 'Rings', anomaly_warn: 'ANOMALY', anomaly_warn_d: 'Pass it yourself', anomaly_beat: 'ANOMALY BEATEN', anomaly_hit: 'ANOMALY!', discover_new: 'New in the Album: {name}',
    camp_complete: 'Galaxy complete!', camp_dirs: 'Directions', camp_dir_right: 'Right', camp_dir_top: 'Top', camp_dir_left: 'Left', camp_dir_bottom: 'Bottom',
    camp_waves_n: '{n} waves', camp_criteria: 'How to earn stars', camp_best_perfects: 'Best: {n} perfects', camp_first_clear: '1st clear reward', camp_replay_reward: 'Replay reward',
    dir_every: 'changes every {n} rings', singularity_hint: 'Beat the region 10 boss to master the Singularity.', loadout: 'Equipped', loadout_d: 'Tap a slot to change. Use in the run with the corner buttons (Q/E on keyboard).',
    slot_n: 'Slot {n}', tap_to_change: 'Tap to choose', ach_all: 'All',
    portal: 'Portal', portal_open: 'Portal open', portal_locked: 'Portal closed', portal_d: 'To enter, complete in {name}:',
    gate_boss: 'Beat the {name} boss', gate_stars: '{n} stars in {name}', gate_rank: 'Rank {n} (player level)', gate_core: 'Core level {n}', gate_contracts: '{n} contracts of {name}',
    contracts: 'Contracts', contracts_d: 'Goals for this region. Rewards arrive by themselves at the end of a run; {n} of them open the next Portal.', contract_done: 'Contract done: {name}',
    c_perfects: 'Score {n} perfects in this region', c_clears: 'Clear {n} levels of this region', c_coins: 'Collect {n} coins in this region', c_pickups: 'Grab {n} items in this region', c_flawless: 'Clear {n} levels here without damage', c_events: 'Beat {n} events in this region', c_nomiss: 'Pass {n} rings in a row here without missing', c_bossflawless: 'Beat this region\'s boss without damage',
    core: 'Core', core_d: 'The strength of your ball. Each level improves everything a little and opens regions.', core_level: 'Core {n}', core_max: 'Core maxed', core_b_coins: '+{n}% coins', core_b_forgive: '+{n}% rim forgiveness', core_b_perfect: '+{n}% perfect zone', core_b_xp: '+{n}% XP',
    core_ms_shield: '+1 max shield', core_ms_start: 'Start with 1 shield', core_ms_life: '1 extra life per run', core_ms_pickup: 'Coin bags +50%', core_next_ms: 'Milestone at level {n}', core_up_toast: 'Core level {n}!',
    mods: 'Modifiers', mut_narrow: 'Narrow', mut_narrow_d: 'rings 10% smaller', mut_dense: 'Dense', mut_dense_d: 'rings closer together', mut_wind: 'Wind', mut_wind_d: 'more tilted rings', mut_pairs: 'Pairs', mut_pairs_d: 'more double rings', mut_bursts: 'Bursts', mut_bursts_d: 'speed in bursts',
    shattered: 'SHATTERED',
    ev_at_ring: 'at ring {n}', ev_between_waves: 'between waves', ev_warn: 'AHEAD', ev_done: 'EVENT CLEARED', ev_fail: 'EVENT LOST', ev_escaped: 'THE GUARDIAN ESCAPED',
    ev_asteroids: 'Asteroids', ev_asteroids_d: 'Dodge the rocks and grab the coins', ev_warp: 'Warp', ev_warp_d: 'Max speed, big rings, coins ×2', ev_sentinel: 'Sentinel', ev_sentinel_d: 'Dodge the shots and keep passing', ev_bonanza: 'Bonanza', ev_bonanza_d: 'Coin rain: grab everything', ev_guardian: 'Guardian', ev_guardian_d: 'Pass the 3 giant rings',
    rt_guardian: 'Guardian Ring', rt_guardian_d: 'Giant, swings and shrinks each pass. Appears in the Guardian event.', rt_guardian_hint: 'Face a Guardian.',
    music_r1: 'Cradle of Light', music_r2: 'High Tide', music_r3: 'Glass Garden', music_r4: 'Hot Iron', music_r5: 'Low Mist', music_r6: 'Prism', music_r7: 'Gust', music_r8: 'Bottom of the Abyss', music_r9: 'Spiral', music_r10: 'Event Horizon', music_menu: 'ORBO Theme', music_singularity: 'Singularity'
  });
  Object.assign(HR.I18N.es, {
    album: 'Álbum', alb_ach: 'Logros', alb_rings: 'Aros', alb_items: 'Objetos', alb_bosses: 'Jefes', alb_skins: 'Bolas', alb_trails: 'Estelas', alb_themes: 'Temas', alb_titles: 'Títulos',
    alb_found: 'Descubierto', alb_unknown: 'Aún no descubierto', alb_unknown_tag: 'Falta', alb_beaten: 'Vencido', alb_title_level: 'Nivel {n}', alb_title_ach: 'Logro: {name}',
    rt_plain: 'Aro Azul', rt_plain_d: 'Viene recto. Lo básico.', rt_plain_hint: 'Pasa un aro azul.',
    rt_wave: 'Aro Verde', rt_wave_d: 'Sube y baja en onda. Espera el momento.', rt_wave_hint: 'Pasa un aro verde.',
    rt_tilt: 'Aro Amarillo', rt_tilt_d: 'Viene inclinado, en diagonal. Entra por el eje del trazo.', rt_tilt_hint: 'Pasa un aro amarillo.',
    rt_spin: 'Aro Rojo', rt_spin_d: 'Gira sin parar. Pasa cuando esté abierto.', rt_spin_hint: 'Pasa un aro rojo.',
    rt_pulse: 'Aro Morado', rt_pulse_d: 'Late o encoge al acercarse.', rt_pulse_hint: 'Pasa un aro morado.',
    rt_ghost: 'Aro Blanco', rt_ghost_d: 'Solo aparece cuando está cerca.', rt_ghost_hint: 'Pasa un aro que aparece tarde.',
    rt_gold: 'Aro Dorado', rt_gold_d: 'Bono de monedas. Viene con el perk Aro Dorado.', rt_gold_hint: 'Pasa un aro dorado.',
    rt_anomaly: 'Anomalía', rt_anomaly_d: 'Inmune a piloto, fantasma, estrella y escudo. Necesita tu mano. Pasarla da bono.', rt_anomaly_hint: 'Vence una anomalía en la Singularidad.',
    pk_coins: 'Bolsa de monedas', pk_coins_d: '+10 monedas al instante.', pk_shield: 'Escudo', pk_shield_d: '+1 escudo (absorbe un error).', pk_magnet: 'Imán', pk_magnet_d: 'Atrae monedas y objetos por 8 s.',
    pk_slow: 'Cámara lenta', pk_slow_d: 'Tiempo al 45 % por 4 s.', pk_star: 'Estrella', pk_star_d: 'Invencible 6 s: atraviesa bordes y destruye obstáculos.', pk_life: 'Vida extra', pk_life_d: 'Continúa automáticamente al morir.', pk_gem: 'Gema', pk_gem_d: '+1 gema (raro).',
    miss: 'FALLO', misses: 'Fallos', items_taken: 'Objetos', rings_passed: 'Aros', anomaly_warn: 'ANOMALÍA', anomaly_warn_d: 'Pásala tú mismo', anomaly_beat: 'ANOMALÍA VENCIDA', anomaly_hit: '¡ANOMALÍA!', discover_new: 'Nuevo en el Álbum: {name}',
    camp_complete: '¡Galaxia completada!', camp_dirs: 'Direcciones', camp_dir_right: 'Derecha', camp_dir_top: 'Arriba', camp_dir_left: 'Izquierda', camp_dir_bottom: 'Abajo',
    camp_waves_n: '{n} oleadas', camp_criteria: 'Cómo ganar estrellas', camp_best_perfects: 'Mejor: {n} perfectos', camp_first_clear: 'Premio de la 1ª victoria', camp_replay_reward: 'Premio por repetir',
    dir_every: 'cambia cada {n} aros', singularity_hint: 'Vence al jefe de la región 10 para dominar la Singularidad.', loadout: 'Equipadas', loadout_d: 'Toca una ranura para cambiar. Úsalas en la partida con los botones de las esquinas (Q/E en teclado).',
    slot_n: 'Ranura {n}', tap_to_change: 'Toca para elegir', ach_all: 'Todos',
    portal: 'Portal', portal_open: 'Portal abierto', portal_locked: 'Portal cerrado', portal_d: 'Para entrar, completa en {name}:',
    gate_boss: 'Vencer al jefe de {name}', gate_stars: '{n} estrellas en {name}', gate_rank: 'Rango {n} (nivel del jugador)', gate_core: 'Núcleo nivel {n}', gate_contracts: '{n} contratos de {name}',
    contracts: 'Contratos', contracts_d: 'Objetivos de esta región. El premio llega solo al final de la partida; {n} de ellos abren el siguiente Portal.', contract_done: 'Contrato completado: {name}',
    c_perfects: 'Haz {n} perfectos en esta región', c_clears: 'Completa {n} niveles de esta región', c_coins: 'Recoge {n} monedas en esta región', c_pickups: 'Recoge {n} objetos en esta región', c_flawless: 'Completa {n} niveles aquí sin daño', c_events: 'Vence {n} eventos en esta región', c_nomiss: 'Pasa {n} aros seguidos aquí sin fallar', c_bossflawless: 'Vence al jefe de esta región sin daño',
    core: 'Núcleo', core_d: 'La fuerza de tu bola. Cada nivel mejora todo un poco y abre regiones.', core_level: 'Núcleo {n}', core_max: 'Núcleo al máximo', core_b_coins: '+{n} % monedas', core_b_forgive: '+{n} % perdón en el borde', core_b_perfect: '+{n} % zona de perfecto', core_b_xp: '+{n} % XP',
    core_ms_shield: '+1 escudo máximo', core_ms_start: 'Empieza con 1 escudo', core_ms_life: '1 vida extra por partida', core_ms_pickup: 'Bolsas de monedas +50 %', core_next_ms: 'Hito en el nivel {n}', core_up_toast: '¡Núcleo nivel {n}!',
    mods: 'Modificadores', mut_narrow: 'Estrecho', mut_narrow_d: 'aros un 10 % más pequeños', mut_dense: 'Denso', mut_dense_d: 'aros más juntos', mut_wind: 'Viento', mut_wind_d: 'más aros inclinados', mut_pairs: 'Pares', mut_pairs_d: 'más aros dobles', mut_bursts: 'Ráfagas', mut_bursts_d: 'velocidad a ráfagas',
    shattered: '¡DESTROZADO!',
    ev_at_ring: 'en el aro {n}', ev_between_waves: 'entre oleadas', ev_warn: 'ADELANTE', ev_done: 'EVENTO SUPERADO', ev_fail: 'EVENTO PERDIDO', ev_escaped: 'EL GUARDIÁN ESCAPÓ',
    ev_asteroids: 'Asteroides', ev_asteroids_d: 'Esquiva las rocas y recoge las monedas', ev_warp: 'Salto', ev_warp_d: 'Velocidad máxima, aros grandes, monedas ×2', ev_sentinel: 'Centinela', ev_sentinel_d: 'Esquiva los disparos y sigue pasando', ev_bonanza: 'Bonanza', ev_bonanza_d: 'Lluvia de monedas: recoge todo', ev_guardian: 'Guardián', ev_guardian_d: 'Pasa los 3 aros gigantes',
    rt_guardian: 'Aro Guardián', rt_guardian_d: 'Gigante, oscila y encoge en cada pase. Aparece en el evento Guardián.', rt_guardian_hint: 'Enfréntate a un Guardián.',
    music_r1: 'Cuna de Luz', music_r2: 'Marea Alta', music_r3: 'Jardín de Cristal', music_r4: 'Hierro Caliente', music_r5: 'Niebla Baja', music_r6: 'Prisma', music_r7: 'Ráfaga', music_r8: 'Fondo del Abismo', music_r9: 'Espiral', music_r10: 'Horizonte de Sucesos', music_menu: 'Tema ORBO', music_singularity: 'Singularidad'
  });
})();
