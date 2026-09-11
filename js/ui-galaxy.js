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

  /* =================== MAPA DA GALÁXIA =================== */
  let gxStars = null, gxImg = null;
  function spiralPt(geo, k) { // k contínuo 0..10 (10 = centro)
    const th = -Math.PI * 0.55 + k * 0.86;
    const kk = k >= 9 ? 0.5 * (1 - (k - 9)) : 1 - 0.5 * (k / 9);
    return { x: geo.cx + Math.cos(th) * geo.ax * kk, y: geo.cy + Math.sin(th) * geo.ay * kk };
  }
  function geometry(W, H) {
    const cx = W / 2, cy = H * 0.5;
    const ax = Math.max(120, W / 2 - 40), ay = Math.max(140, H / 2 - 56);
    const geo = { cx, cy, ax, ay, pts: [] };
    for (let i = 0; i < 10; i++) { const p = spiralPt(geo, i); geo.pts.push({ x: p.x, y: p.y }); }
    return geo;
  }
  // desenhada uma vez por tamanho: fundo, estrelas de campo, dois braços espirais (o das regiões e o simétrico),
  // nuvens de gás coloridas, faixas de poeira e bojo central
  function buildGalaxyImage(W, H, geo) {
    const cv = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const U = HR.U;
    const g = ctx.createRadialGradient(geo.cx, geo.cy, 10, geo.cx, geo.cy, Math.max(W, H) * 0.8);
    g.addColorStop(0, '#1b2458'); g.addColorStop(0.45, '#0c1233'); g.addColorStop(1, '#04060f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    let seed = 1234567; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const gauss = () => (rnd() + rnd() + rnd() - 1.5) * 1.15;
    for (let i = 0; i < 260; i++) { ctx.globalAlpha = 0.15 + rnd() * 0.5; ctx.fillStyle = rnd() < 0.2 ? '#cfe3ff' : '#ffffff'; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 0.4 + rnd() * 1.1, 0, 6.283); ctx.fill(); }
    ctx.globalAlpha = 1;
    const arm = (k, mirror) => { const p = spiralPt(geo, Math.max(0, k)); return mirror ? { x: 2 * geo.cx - p.x, y: 2 * geo.cy - p.y } : p; };
    ctx.globalCompositeOperation = 'lighter';
    for (let m = 0; m < 2; m++) for (let k = 0; k <= 10; k += 0.25) {
      const p = arm(k, m === 1), kk = k / 10, rad = 74 - kk * 34, ri = Math.min(9, Math.floor(k));
      const col = m === 0 ? HR.REGIONS[ri].accent : (k > 7 ? '#ffb070' : '#5a7cff');
      const cg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
      cg.addColorStop(0, U.rgba(col, m === 0 ? 0.11 : 0.06)); cg.addColorStop(1, U.rgba(col, 0));
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let m = 0; m < 2; m++) {
      for (let k = -1.2; k <= 10; k += 0.02) {
        const kk = Math.max(0, k) / 10, p = arm(k, m === 1), tail = k < 0 ? 1 - k * 0.8 : 1;
        const sig = (36 - kk * 18) * tail;
        for (let i = 0; i < 6; i++) {
          const x = p.x + gauss() * sig, y = p.y + gauss() * sig * 0.85;
          const warm = kk > 0.7 ? rnd() < 0.5 : rnd() < 0.12;
          ctx.fillStyle = warm ? '#ffe2b0' : (rnd() < 0.3 ? '#bcd8ff' : '#ffffff');
          ctx.globalAlpha = (0.2 + rnd() * 0.6) * (k < 0 ? 0.5 : 1);
          ctx.beginPath(); ctx.arc(x, y, 0.35 + rnd() * (kk > 0.75 ? 1.6 : 1.1), 0, 6.283); ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'multiply'; ctx.lineCap = 'round';
    for (let m = 0; m < 2; m++) {
      ctx.strokeStyle = 'rgba(8,10,28,0.6)'; ctx.lineWidth = 9; ctx.beginPath();
      for (let k = 0.3; k <= 9.4; k += 0.05) {
        const p = arm(k, m === 1), q = arm(k + 0.02, m === 1);
        const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy) || 1, off = 15 - (k / 10) * 7;
        const x = p.x - dy / L * off, y = p.y + dx / L * off;
        k === 0.3 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    const bg = ctx.createRadialGradient(geo.cx, geo.cy, 6, geo.cx, geo.cy, 150);
    bg.addColorStop(0, 'rgba(255,238,200,0.55)'); bg.addColorStop(0.25, 'rgba(255,210,150,0.22)'); bg.addColorStop(0.6, 'rgba(255,120,200,0.08)'); bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(geo.cx, geo.cy, 150, 0, 6.283); ctx.fill();
    return { W, H, cv };
  }
  function drawGalaxy(cv, geo, W, H, t) {
    const ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), U = HR.U, C = HR.Campaign;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!gxImg || gxImg.W !== W || gxImg.H !== H) gxImg = buildGalaxyImage(W, H, geo);
    ctx.drawImage(gxImg.cv, 0, 0, W, H);
    if (!gxStars || gxStars.W !== W || gxStars.H !== H) { gxStars = { W, H, list: [] }; for (let i = 0; i < 70; i++) gxStars.list.push({ x: Math.random() * W, y: Math.random() * H, s: U.rand(0.6, 1.7), p: U.rand(0, 6.28), v: U.rand(0.6, 1.6) }); }
    ctx.fillStyle = '#fff';
    gxStars.list.forEach(st => { ctx.globalAlpha = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * st.v + st.p)); ctx.beginPath(); ctx.arc(st.x, st.y, st.s, 0, 6.283); ctx.fill(); });
    ctx.globalAlpha = 1;
    // trilha das regiões (estado muda com o progresso) + nebulosa de cada nó
    ctx.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      const R = HR.REGIONS[i], st = C.regionState(i), p = geo.pts[i];
      const alpha = st === 'locked' ? 0.12 : st === 'done' ? 0.6 : 0.42;
      ctx.strokeStyle = U.rgba(R.accent, alpha); ctx.lineWidth = st === 'locked' ? 5 : 8; ctx.setLineDash(st === 'locked' ? [4, 12] : []);
      ctx.beginPath();
      for (let k = i; k <= i + 1.001; k += 0.05) { const q = spiralPt(geo, Math.min(10, k)); k === i ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y); }
      ctx.stroke(); ctx.setLineDash([]);
      const ng = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 58);
      ng.addColorStop(0, U.rgba(R.accent, st === 'locked' ? 0.14 : 0.4)); ng.addColorStop(1, U.rgba(R.accent, 0));
      ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(p.x, p.y, 58, 0, 6.283); ctx.fill();
    }
    // Singularidade: buraco negro com disco de acreção girando
    const cx = geo.cx, cy = geo.cy;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.25);
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = U.rgba(['#ffcf4a', '#ff5ecf', '#4cf0ff'][i], 0.6 - i * 0.12); ctx.lineWidth = 4 - i;
      ctx.beginPath(); ctx.ellipse(0, 0, 36 + i * 9, 13 + i * 4, i * 0.6, 0, 6.283); ctx.stroke();
    }
    ctx.restore();
    const hg = ctx.createRadialGradient(cx, cy, 18, cx, cy, 60);
    hg.addColorStop(0, 'rgba(255,230,180,0.5)'); hg.addColorStop(1, 'rgba(255,230,180,0)');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(cx, cy, 60, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#02030a'; ctx.beginPath(); ctx.arc(cx, cy, 26, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,200,0.95)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, 27, 0, 6.283); ctx.stroke();
  }
  let gxRaf = null;
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
      h += '<button type="button" class="gx-node is-' + st + (isCur ? ' is-current' : '') + '" data-region="' + i + '" style="left:' + p.x.toFixed(0) + 'px;top:' + p.y.toFixed(0) + 'px;' + accentVars(R.accent) + '" aria-label="' + esc(regionName(R)) + '">';
      h += '<span class="gx-disc">' + (st === 'locked' ? HR.icon('lock') : st === 'done' ? HR.icon('check') : '<b>' + (i + 1) + '</b>') + '</span>';
      h += '<span class="gx-name">' + esc(regionName(R)) + (st !== 'locked' ? '<small>' + stars + '/30</small>' : '') + '</span>';
      h += '</button>';
    });
    const mastered = C.singularityMastered();
    h += '<button type="button" class="gx-core' + (mastered ? ' is-mastered' : '') + '" id="gx-core" style="left:' + geo.cx.toFixed(0) + 'px;top:' + geo.cy.toFixed(0) + 'px" aria-label="' + esc(HR.t('singularity')) + '"><span class="gx-core-hit"></span><span class="gx-name">' + esc(HR.t('singularity')) + (mastered ? '<small>' + HR.icon('crown') + '</small>' : '') + '</span></button>';
    host.innerHTML = h;
    // rodapé: continuar
    const foot = $('#galaxy-foot');
    const level = C.currentLevel(), done = C.levelsCleared();
    const complete = done >= 100;
    foot.innerHTML = '<div class="gx-foot-card" style="' + accentVars(HR.REGIONS[level.ri].accent) + '">' +
      '<div class="gx-foot-main"><span class="kicker gx-kicker">' + done + '/100 ' + esc(HR.t('levels')) + ' · ' + C.totalStars() + ' ' + HR.icon('star', '', true) + '</span><b>' + esc(complete ? HR.t('camp_complete') : HR.t('continue_campaign', { n: level.id }) + ' · ' + regionName(HR.REGIONS[level.ri])) + '</b></div>' +
      '<button type="button" class="btn btn-play small-btn" id="gx-continue"><span class="ic">' + HR.icon('play') + '</span><span class="btn-label">' + esc(HR.t(complete ? 'levels' : 'play_mode')) + '</span></button></div>';
    if (!body.dataset.bound) {
      body.dataset.bound = '1';
      host.addEventListener('click', e => {
        const core = e.target.closest('#gx-core'); if (core) { e.stopPropagation(); sfx('click'); openSingularityDetail(); return; }
        const btn = e.target.closest('[data-region]'); if (!btn) return; e.stopPropagation();
        const ri = +btn.getAttribute('data-region');
        if (!C.isRegionUnlocked(ri)) { sfx('error'); HR.UI.toast(HR.icon('lock') + ' ' + HR.t('region_locked_hint', { name: regionName(HR.REGIONS[ri - 1]) }), 'bad'); btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake'); return; }
        sfx('click'); HR.UI.open('region', ri);
      });
    }
    $('#gx-continue').addEventListener('click', e => { e.stopPropagation(); sfx('click'); HR.UI.open('region', level.ri); });
    d.hints.galaxy = true; HR.Store.save();
  }

  /* =================== FICHA DA REGIÃO =================== */
  let curRegion = 0, previewOn = false;
  function levelNodes(R, ri) {
    const C = HR.Campaign, levels = C.levelsOf(ri), current = C.currentLevel();
    // caminho em "serpentina": 3 por linha (esq→dir, dir→esq…), chefe sozinho na última linha
    const cols = [18, 50, 82], pitch = 92, top = 46;
    const pts = levels.map((l, i) => {
      if (i === 9) return { x: 50, y: top + 3 * pitch + 14 };
      const row = Math.floor(i / 3), col = i % 3;
      return { x: row % 2 ? cols[2 - col] : cols[col], y: top + row * pitch };
    });
    const height = pts[9].y + 76;
    let h = '<div class="lv-path" style="height:' + height + 'px"><svg class="lv-links" aria-hidden="true">';
    for (let i = 0; i < 9; i++) {
      const a = pts[i], b = pts[i + 1], sA = C.stars(levels[i].id), sB = C.stars(levels[i + 1].id);
      const state = sB > 0 ? 'done' : sA > 0 ? 'next' : '';
      const at = 'x1="' + a.x + '%" y1="' + a.y + '" x2="' + b.x + '%" y2="' + b.y + '"';
      if (state === 'done') h += '<line class="lv-link-glow" ' + at + '/>';
      h += '<line class="lv-link' + (state ? ' ' + state : '') + '" ' + at + '/>';
    }
    h += '</svg>';
    levels.forEach((l, i) => {
      const p = pts[i], isBoss = !!l.boss, stars = C.stars(l.id), unlocked = C.isUnlocked(l.id), isCur = current && current.id === l.id;
      const cls = ['lv-node', isBoss ? 'lv-node--boss' : '', stars > 0 ? 'is-done' : '', isCur ? 'is-current' : '', unlocked ? '' : 'is-locked'].filter(Boolean).join(' ');
      h += '<button type="button" class="' + cls + '" data-level="' + esc(l.id) + '" style="left:' + p.x + '%;top:' + p.y + 'px" aria-label="' + esc(HR.t('level_n', { n: l.id })) + '">';
      h += '<span class="lv-circle-wrap">' + (isCur ? '<span class="lv-halo"></span>' : '') + '<span class="lv-circle">' + (isBoss ? '<span class="lv-boss-ic">' + HR.icon(HR.BOSSES[l.boss].icon) + '</span>' : '<b>' + (i + 1) + '</b>') + '</span>' + (!unlocked ? '<span class="lv-lock">' + HR.icon('lock') + '</span>' : '') + (isBoss ? '<span class="lv-boss-tag">' + esc(HR.t('boss')) + '</span>' : '') + '</span>';
      h += starsHtml(stars);
      if (isBoss) h += '<span class="lv-boss-name">' + esc(HR.t('boss_' + l.boss)) + '</span>';
      h += '</button>';
    });
    return h + '</div>';
  }
  function renderRegion(ri) {
    const C = HR.Campaign;
    if (ri == null || isNaN(ri)) ri = curRegion; curRegion = ri;
    const R = HR.REGIONS[ri], body = $('#region-body'); if (!R || !body) return;
    HR.Store.data.campaign.lastRegion = ri;
    HR.UI.bind('regionTitle', (ri + 1) + ' · ' + regionName(R));
    $$('#screen-region .ribbon').forEach(el => { el.style.cssText = accentVars(R.accent); });
    HR.UI.bind('regionStars', C.regionStars(ri) + '/30');
    const boss = C.level((ri + 1) + '-10'), info = HR.BOSSES[R.boss];
    const stars = C.regionStars(ri), cleared = C.bossBeaten(ri);
    const musicName = HR.t('region_music') + ': ' + HR.t('music_' + R.music);
    let h = '<div class="reg-wrap" style="' + accentVars(R.accent) + '">';
    h += '<div class="reg-hero" style="background:linear-gradient(160deg,' + R.colors[0] + ',' + R.colors[1] + ' 60%,' + R.colors[2] + ')"><i></i><i></i><i></i><i></i><i></i><span class="reg-hero-ring"></span><span class="reg-hero-ball"></span>';
    h += '<div class="reg-hero-text"><span class="kicker">' + esc(HR.t('region_n', { n: ri + 1 })) + '</span><h3>' + esc(regionName(R)) + '</h3><p>' + esc(HR.t('reg_' + R.id + '_t')) + '</p></div>';
    h += '<span class="reg-hero-stars">' + HR.icon('star', '', true) + ' <b>' + stars + '</b>/30</span></div>';
    h += '<div class="reg-card"><span class="reg-card-ic">' + HR.icon('compass') + '</span><div class="reg-card-main"><span class="kicker">' + esc(HR.t('region_mech')) + '</span><p>' + esc(HR.t('reg_' + R.id + '_d')) + '</p></div></div>';
    h += '<div class="reg-card boss' + (cleared ? ' done' : '') + '"><span class="reg-card-ic">' + HR.icon(info.icon) + '</span><div class="reg-card-main"><span class="kicker">' + esc(HR.t('region_boss')) + (cleared ? ' · ' + esc(HR.t('ach_unlocked')) : '') + '</span><b>' + esc(HR.t('boss_' + R.boss)) + '</b><p>' + esc(HR.t('boss_' + R.boss + '_d')) + '</p><span class="reg-chip">' + HR.icon('wave') + ' ' + esc(HR.t('camp_waves_n', { n: info.waves })) + ' · ' + esc(HR.t('rings_n', { n: boss.rings })) + '</span></div></div>';
    h += '<div class="reg-row"><span class="reg-chip gift">' + HR.icon('gift') + ' <span>' + esc(HR.t('region_reward')) + ': <b>' + esc(cosmeticName(R.reward)) + '</b></span></span>';
    h += '<button type="button" class="reg-chip music" id="reg-music">' + HR.icon('music') + ' <span>' + esc(musicName) + '</span></button></div>';
    h += '<div class="section-title">' + esc(HR.t('levels')) + '</div>';
    h += levelNodes(R, ri);
    const next = C.levelsOf(ri).find(l => C.stars(l.id) === 0 && C.isUnlocked(l.id));
    if (next) h += '<button type="button" class="btn btn-play" id="reg-continue"><span class="ic">' + HR.icon('play') + '</span><span class="btn-label">' + esc(HR.t('continue_campaign', { n: next.id })) + '</span></button>';
    else if (cleared) h += '<p class="lb-note">' + esc(HR.t('world_progress', { a: stars, b: 30 })) + '</p>';
    h += '</div>';
    body.innerHTML = h;
    body.scrollTop = 0;
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
    h += '<span class="kicker">' + esc(HR.t('region_n', { n: level.ri + 1 })) + ' · ' + esc(regionName(R)) + '</span>';
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
    let h = '<div class="lv-detail-head"><span class="sg-core">' + HR.icon('orbit') + '</span><h3 class="lv-detail-title">' + esc(HR.t('singularity')) + '</h3><span class="lv-detail-sub">' + esc(HR.t('singularity_d')) + '</span></div>';
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
    else if (tab === 'bosses') HR.REGIONS.forEach((R, i) => { const on = HR.Campaign.bossBeaten(i); add({ on, color: R.accent, html: HR.icon(HR.BOSSES[R.boss].icon), name: HR.t('boss_' + R.boss), desc: HR.t('reg_' + R.id) + ' · ' + HR.t('boss_' + R.boss + '_d'), descHidden: HR.t('reg_' + R.id), tag: on ? HR.t('alb_beaten') : HR.t('alb_unknown_tag') }); });
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
    music_r1: 'Cuna de Luz', music_r2: 'Marea Alta', music_r3: 'Jardín de Cristal', music_r4: 'Hierro Caliente', music_r5: 'Niebla Baja', music_r6: 'Prisma', music_r7: 'Ráfaga', music_r8: 'Fondo del Abismo', music_r9: 'Espiral', music_r10: 'Horizonte de Sucesos', music_menu: 'Tema ORBO', music_singularity: 'Singularidad'
  });
})();
