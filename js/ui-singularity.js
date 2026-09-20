/* =====================================================================
   Tela da Singularidade (v5): TON 618 com as 11 camadas, prêmio misterioso,
   Palavras, ficha da camada (passagem, Ecos, conversa, Prova), diálogo com o
   Arconte (escolhas + mensagem escrita + composição final) e cartões de Eco.
   Define em HR.UI: renderSingularity, openLayer, openDialogue, showEco, showArchonAfter
   ===================================================================== */
(function () {
  const $ = (s, r) => HR.U.$(s, r), $$ = (s, r) => HR.U.$$(s, r);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sfx = n => { if (HR.Audio && HR.Audio.sfx) HR.Audio.sfx(n); };
  const S = () => HR.Singularity;
  const N = () => HR.ARCHONS.length;

  /* ---------------- cabeçalho: buraco negro + 11 camadas ---------------- */
  let heroRaf = null;
  function startHero() {
    const cv = $('#sg-hero-cv'); if (!cv) return;
    const rect = cv.parentElement.getBoundingClientRect(), W = Math.round(rect.width) || 340, H = Math.round(rect.height) || 180, dpr = Math.min(HR.Perf ? HR.Perf.dprCap() : 2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const ctx = cv.getContext('2d'), stars = []; for (let i = 0; i < 90; i++) stars.push([Math.random() * W, Math.random() * H, Math.random() * 1.3 + 0.3, Math.random() * 6.28]);
    const bh = { base: '#000', dark: '#000', glow: '#ffcf4a', bh: 'ton618', disk: ['#fffbe6', '#ffcf4a', '#ff5e3d'] };
    const cur = S().current(), open = S().isOpen();
    const draw = now => {
      const t = now / 1000; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = ctx.createRadialGradient(W * 0.72, H * 0.5, 10, W * 0.72, H * 0.5, W * 0.8); g.addColorStop(0, '#2a1d08'); g.addColorStop(0.5, '#0c0816'); g.addColorStop(1, '#02030a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      stars.forEach(s => { ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.5 * Math.abs(Math.sin(t + s[3]))).toFixed(2) + ')'; ctx.fillRect(s[0], s[1], s[2], s[2]); });
      const cx = W * 0.74, cy = H * 0.52;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.62);
      for (let i = N() - 1; i >= 0; i--) {
        const rr = 34 + i * 9, A = HR.ARCHONS[i], passed = S().layer(i).passed, isCur = open && i === cur;
        ctx.strokeStyle = HR.U.rgba(passed ? A.color : isCur ? A.color : '#7d879f', passed ? 0.75 : isCur ? 0.45 + 0.35 * Math.sin(t * 3) : 0.14);
        ctx.lineWidth = passed ? 2.2 : 1.4; ctx.setLineDash(passed ? [] : [3, 5]); ctx.lineDashOffset = -t * (6 + i);
        ctx.beginPath(); ctx.arc(0, 0, rr, 0, 6.283); ctx.stroke();
        if (passed || isCur) { const a = t * (0.5 - i * 0.03) + i; ctx.fillStyle = A.color; ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, 2.4, 0, 6.283); ctx.fill(); }
      }
      ctx.setLineDash([]); ctx.restore();
      ctx.save(); ctx.translate(cx, cy); HR.Render.SHAPES.blackhole(ctx, 22, bh, t); ctx.restore();
      const sh = ctx.createLinearGradient(0, 0, W * 0.6, 0); sh.addColorStop(0, 'rgba(4,6,14,0.72)'); sh.addColorStop(1, 'rgba(4,6,14,0)'); ctx.fillStyle = sh; ctx.fillRect(0, 0, W * 0.6, H);
    };
    if (heroRaf) cancelAnimationFrame(heroRaf);
    if (HR.Perf && HR.Perf.lite && HR.Perf.lite()) { draw(performance.now()); heroRaf = null; return; }
    const loop = now => { if (!HR.UI.stack.includes('singularity') || !cv.isConnected) { heroRaf = null; return; } draw(now); heroRaf = requestAnimationFrame(loop); };
    loop(performance.now());
  }

  function layerState(i) {
    const s = S(), l = s.layer(i);
    if (!s.unlocked(i)) return 'locked';
    if (l.passed) return 'passed';
    if (!s.passageDone(i)) return 'passage';
    if (!l.path || s.reconcileReady(i) && false) return 'talk';
    return 'trial';
  }
  function statusText(i) {
    const s = S(), l = s.layer(i), st = layerState(i);
    if (st === 'locked') return HR.t(s.isOpen() ? 'sg_locked' : 'singularity_hint');
    if (st === 'passage') return HR.t('sg_passage_n', { n: Math.min(5, s.clearedCount(i) + 1) });
    if (st === 'talk') return HR.t('sg_need_talk');
    if (st === 'trial') { const P = HR.SG.paths[l.path]; return HR.t('sg_path_level', { w: P.waves, p: Math.round(P.pass * 100) }); }
    return HR.t('sg_passed') + (s.wordsEarned().includes(HR.ARCHONS[i].word) ? ' · ' + HR.t('sg_word_' + HR.ARCHONS[i].word) : '');
  }

  /* ---------------- tela ---------------- */
  function renderSingularity() {
    const body = $('#singularity-body'); if (!body) return;
    const s = S(), open = s.isOpen(), passed = s.passedCount();
    HR.UI.bind('archonsPassed', passed + '/' + N());
    let h = '<div class="reg-wrap sg-wrap" style="' + HR.UI.accentVars('#ffcf4a') + '">';
    h += '<div class="reg-hero reg-hero--live sg-hero"><canvas id="sg-hero-cv"></canvas><div class="reg-hero-text"><span class="kicker">' + esc(HR.t('bh_name')) + ' · ' + esc(HR.t('bh_sub')) + '</span><h3>' + esc(HR.t('singularity')) + '</h3><p>' + esc(HR.t('singularity_screen_d')) + '</p></div>';
    h += '<span class="reg-hero-stars"' + HR.tip(HR.t('singularity'), HR.t('sg_layers_n', { n: passed })) + '>' + HR.icon('light') + ' <b>' + passed + '</b>/' + N() + '</span></div>';
    h += '<div class="sg-prize"' + HR.tip(HR.t('sg_prize'), HR.t('sg_prize_d')) + '>' + HR.plate('chest', '#ffcf4a', 'lg') + '<div class="sg-prize-main"><span class="kicker">' + esc(HR.t('sg_prize')) + '</span><p>' + esc(HR.t('sg_prize_d')) + '</p></div>' + (HR.Store.data.singularity.firstClear ? '<span class="sg-prize-ok">' + HR.icon('check') + '</span>' : '<span class="sg-prize-q">' + HR.icon('question') + '</span>') + '</div>';
    if (!open) h += HR.UI.gateHtml(HR.REGIONS.length);
    const words = s.wordsEarned();
    h += '<div class="section-title">' + HR.icon('word') + ' ' + esc(HR.t('sg_words')) + ' <span class="muted">' + words.length + '/' + N() + '</span></div><div class="sg-words">';
    HR.ARCHONS.forEach(A => { const on = words.includes(A.word); h += '<span class="sg-word' + (on ? ' on' : '') + '" style="--ac:' + A.color + '"' + (on ? HR.tip(HR.t('sg_word_' + A.word)) : HR.tip('???')) + '>' + (on ? esc(HR.t('sg_word_' + A.word)) : '···') + '</span>'; });
    h += '</div>';
    h += '<div class="section-title">' + HR.icon('layers') + ' ' + esc(HR.t('sg_layer_n', { n: '1–11' })) + '</div><div class="sg-layers">';
    HR.ARCHONS.forEach((A, i) => {
      const st = layerState(i), l = s.layer(i), unlocked = st !== 'locked';
      h += '<button type="button" class="sg-layer is-' + st + '" data-layer="' + i + '" style="--ac:' + A.color + '"' + HR.tip(unlocked ? HR.t('sg_title_' + i) : HR.t('sg_layer_n', { n: i + 1 }), statusText(i)) + '>';
      h += '<span class="sg-layer-n">' + (i + 1) + '</span>' + HR.plate(unlocked ? A.sigil : 'lock', unlocked ? A.color : '#7d879f', st === 'passed' ? '' : 'dim');
      h += '<span class="sg-layer-main"><span class="kicker">' + esc(HR.t('sg_layer_n', { n: i + 1 })) + (unlocked ? ' · ' + esc(HR.t('sg_name_' + i)) : '') + '</span><b>' + esc(unlocked ? HR.t('sg_title_' + i) : '???') + '</b><small>' + esc(statusText(i)) + '</small>';
      h += '<i class="sg-dots">' + l.cleared.map(c => '<em class="' + (c ? 'on' : '') + '"></em>').join('') + '<em class="trial' + (l.passed ? ' on' : l.path ? ' half' : '') + '"></em></i></span>';
      h += '<span class="sg-layer-side"' + HR.tip(HR.t('sg_ecos'), s.ecosCount(i) + '/5') + '>' + HR.icon('eco') + '<b>' + s.ecosCount(i) + '/5</b></span></button>';
    });
    h += '</div>';
    h += '<button type="button" class="btn btn-ghost" id="sg-endless"><span class="ic" data-icon="infinity">' + HR.icon('infinity') + '</span><span class="btn-label">' + esc(HR.t('sg_endless')) + '</span></button>';
    h += '</div>';
    body.innerHTML = h; body.scrollTop = 0;
    startHero();
    if (!body.dataset.bound) {
      body.dataset.bound = '1';
      body.addEventListener('click', e => {
        const b = e.target.closest('[data-layer]'); if (!b) return; e.stopPropagation();
        const i = +b.getAttribute('data-layer');
        if (!S().unlocked(i)) { sfx('error'); HR.UI.toast(HR.icon('lock') + ' ' + HR.t(S().isOpen() ? 'sg_locked' : 'singularity_hint'), 'bad'); return; }
        sfx('click'); openLayer(i);
      });
    }
    $('#sg-endless').addEventListener('click', e => { e.stopPropagation(); sfx('click'); HR.Store.data.mode = 'endless'; HR.Store.save(); HR.UI.startGame('endless'); });
    if (HR.Music && HR.Store.data.settings.music && HR.Audio.unlocked) { HR.Music.play('singularity'); HR.Music.setIntensity(0.4); }
    HR.Store.data.hints.singularity = true;
  }

  /* ---------------- ficha da camada ---------------- */
  function openLayer(i) {
    const s = S(), A = HR.ARCHONS[i], l = s.layer(i), modal = $('#modal-item'), host = $('#item-detail');
    let h = '<div class="lv-detail-head"><span class="sg-sigil">' + HR.plate(A.sigil, A.color, 'lg round') + '</span><span class="kicker">' + esc(HR.t('sg_layer_n', { n: i + 1 })) + ' · ' + esc(HR.t('sg_name_' + i)) + '</span><h3 class="lv-detail-title">' + esc(HR.t('sg_title_' + i)) + '</h3><span class="lv-detail-sub">' + esc(statusText(i)) + '</span></div>';
    // passagem
    h += '<div class="lv-dirs"><span class="section-title">' + esc(HR.t('sg_passage')) + ' · ' + s.clearedCount(i) + '/5</span><div class="sg-pass">';
    for (let p = 0; p < 5; p++) { const id = 'S-' + (i + 1) + '-' + (p + 1), can = s.canPlay(id), done = l.cleared[p], eco = l.ecos[p]; h += '<button type="button" class="sg-pass-node' + (done ? ' done' : '') + (can ? '' : ' locked') + '" data-play="' + id + '"' + HR.tip(HR.t('sg_passage_n', { n: p + 1 }), (eco ? HR.t('sg_eco_title') : HR.t('sg_eco_missing'))) + '><b>' + (p + 1) + '</b><span class="sg-pass-eco' + (eco ? ' on' : '') + '">' + HR.icon('eco') + '</span></button>'; }
    h += '</div></div>';
    // ecos
    h += '<div class="sg-ecos"><span class="section-title">' + HR.icon('eco') + ' ' + esc(HR.t('sg_ecos')) + ' · ' + s.ecosCount(i) + '/5</span>';
    for (let p = 0; p < 5; p++) h += '<p class="sg-eco' + (l.ecos[p] ? ' on' : '') + '">' + (l.ecos[p] ? esc(HR.t('sg_eco_' + i + '_' + p)) : esc(HR.t('sg_eco_missing'))) + '</p>';
    h += '</div>';
    // conversa e Prova
    if (l.passed) h += '<p class="lv-boss-desc gold">' + HR.icon('light') + ' ' + esc(HR.t('sg_after_' + i + '_' + l.path)) + '</p>';
    else if (!s.passageDone(i)) h += '<p class="lb-note">' + esc(HR.t('sg_need_passage')) + '</p>';
    else {
      if (s.canTalk(i)) h += '<button type="button" class="btn btn-gem" id="sg-talk"><span class="ic" data-icon="dialogue">' + HR.icon('dialogue') + '</span><span class="btn-label">' + esc(HR.t(l.path ? 'sg_talk_again' : 'sg_talk')) + '</span></button>';
      if (l.path) {
        const P = HR.SG.paths[l.path], tr = s.trialReady(i), lv = s.level('S-' + (i + 1) + '-T');
        h += '<div class="lv-chips"><span class="reg-chip"' + HR.tip(HR.t('camp_waves_n', { n: P.waves })) + '>' + HR.icon('layers') + ' ' + P.waves + '</span><span class="reg-chip"' + HR.tip(HR.t('rings_n', { n: lv.rings })) + '>' + HR.icon('ring') + ' ' + lv.rings + '</span>' + HR.UI.speedChip(lv) + '<span class="reg-chip"' + HR.tip(HR.t('star_finish')) + '>' + HR.icon('target') + ' ' + Math.round(P.pass * 100) + '%</span>' + (P.grace ? '<span class="reg-chip"' + HR.tip(HR.t('sg_grace')) + '>' + HR.icon('shieldPlus') + '</span>' : '') + (P.noAegis ? '<span class="reg-chip"' + HR.tip(HR.t('aegis_blocked')) + '>' + HR.icon('aegis') + ' ✕</span>' : '') + '</div>';
        if (!tr.ok && tr.items.length) { h += '<div class="gate-list"><p class="lb-note">' + esc(HR.t('sg_trial_req')) + '</p>'; tr.items.forEach(it => { h += '<span class="gate' + (it.ok ? ' ok' : '') + '"><span class="gate-ic">' + HR.icon(it.ok ? 'check' : it.id === 'core' ? 'core' : 'rank') + '</span><span class="gate-txt">' + esc(HR.t('gate_' + it.id, { n: it.b })) + '</span><b>' + it.a + '/' + it.b + '</b></span>'; }); h += '</div>'; }
        h += '<button type="button" class="btn btn-play" id="sg-trial"' + (tr.ok ? '' : ' disabled') + '><span class="ic" data-icon="play">' + HR.icon('play') + '</span><span class="btn-label">' + esc(HR.t('sg_go_trial')) + '</span></button>';
        if (!s.canTalk(i)) { const left = s.reconcileLeft(i); h += '<p class="lb-note">' + esc(HR.t('sg_reconcile', { d: left.days, f: left.fails })) + '</p>'; }
        else h += '<p class="lb-note">' + esc(HR.t('sg_reconcile_ready')) + '</p>';
      }
    }
    h += '<button type="button" class="btn btn-ghost" id="sg-close"><span class="btn-label">' + esc(HR.t('close')) + '</span></button>';
    host.innerHTML = h; host.className = 'modal-card item-detail lv-detail sg-detail'; host.style.cssText = HR.UI.accentVars(A.color);
    $$('[data-play]', host).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const id = b.getAttribute('data-play'); if (!S().canPlay(id)) { sfx('error'); HR.UI.toast(HR.icon('lock') + ' ' + HR.t('locked'), 'bad'); return; } sfx('click'); HR.UI.closeLevelDetail(); HR.UI.startLevel(id); }));
    const talk = $('#sg-talk', host); if (talk) talk.addEventListener('click', e => { e.stopPropagation(); sfx('click'); HR.UI.closeLevelDetail(); openDialogue(i); });
    const trial = $('#sg-trial', host); if (trial) trial.addEventListener('click', e => { e.stopPropagation(); sfx('click'); HR.UI.closeLevelDetail(); HR.UI.startLevel('S-' + (i + 1) + '-T'); });
    $('#sg-close', host).addEventListener('click', e => { e.stopPropagation(); sfx('click'); HR.UI.closeLevelDetail(); });
    HR.UI.bindBackdrop(modal, host); modal.classList.add('visible'); host.scrollTop = 0;
  }

  /* ---------------- diálogo com o Arconte ---------------- */
  let dlg = null, dlgRaf = null;
  function ensureDialog() {
    if (dlg) return dlg;
    dlg = HR.U.el('div', 'modal sg-dialog');
    dlg.id = 'sg-dialog';
    dlg.innerHTML = '<div class="sg-dlg-card"><canvas class="sg-dlg-cv"></canvas><span class="kicker sg-dlg-kicker"></span><p class="sg-dlg-line"></p><div class="sg-dlg-opts"></div><form class="sg-dlg-msg" hidden><input type="text" maxlength="90" autocomplete="off"><button type="submit" class="btn btn-play sg-dlg-send"><span class="ic" data-icon="send">' + HR.icon('send') + '</span></button></form><div class="sg-dlg-compose" hidden></div><button type="button" class="btn sg-dlg-next"><span class="btn-label"></span></button><button type="button" class="sg-dlg-x" aria-label="close">' + HR.icon('close') + '</button></div>';
    ($('#app') || document.body).appendChild(dlg);
    return dlg;
  }
  function holo(cv, A, t) {
    const r = cv.getBoundingClientRect(), W = Math.round(r.width) || 120, H = Math.round(r.height) || 120, dpr = Math.min(HR.Perf ? HR.Perf.dprCap() : 2, window.devicePixelRatio || 1);
    if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, U = HR.U;
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, W * 0.5); g.addColorStop(0, U.rgba(A.color, 0.35)); g.addColorStop(1, U.rgba(A.color, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let k = 0; k < 3; k++) { ctx.strokeStyle = U.rgba(A.color, 0.4 - k * 0.1); ctx.lineWidth = 1.5; ctx.setLineDash([4 + k * 2, 6]); ctx.lineDashOffset = t * (10 + k * 8) * (k % 2 ? -1 : 1); ctx.beginPath(); ctx.ellipse(cx, cy, W * (0.28 + k * 0.08), W * (0.28 + k * 0.08) * 0.9, 0, 0, 6.283); ctx.stroke(); }
    ctx.setLineDash([]);
    for (let i = 0; i < 16; i++) { const a = t * 0.6 + i * 0.4, rr = W * (0.2 + ((i * 37) % 10) / 30); ctx.fillStyle = U.rgba(A.color, 0.5 + 0.4 * Math.sin(t * 2 + i)); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.9, 1.2, 0, 6.283); ctx.fill(); }
    ctx.globalAlpha = 0.85 + 0.15 * Math.sin(t * 5); HR.Render.glyph(ctx, A.sigil, cx, cy + Math.sin(t * 1.5) * 2, W * 0.42, '#ffffff', 1.4); ctx.globalAlpha = 1;
    ctx.fillStyle = U.rgba(A.color, 0.07); for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  }
  function openDialogue(i) {
    const s = S(), A = HR.ARCHONS[i], D = s.dialogue(i), el = ensureDialog(), card = $('.sg-dlg-card', el);
    card.style.cssText = HR.UI.accentVars(A.color) + '--ac:' + A.color;
    const line = $('.sg-dlg-line', el), opts = $('.sg-dlg-opts', el), form = $('.sg-dlg-msg', el), input = $('input', form), comp = $('.sg-dlg-compose', el), next = $('.sg-dlg-next', el), cv = $('.sg-dlg-cv', el);
    $('.sg-dlg-kicker', el).textContent = HR.t('sg_layer_n', { n: i + 1 }) + ' · ' + D.name;
    input.placeholder = HR.t('sg_message_ph'); $('.sg-dlg-send', el).setAttribute('data-tip', HR.t('sg_send'));
    const picks = []; let step = 0, message = '', compose = [];
    const setLine = txt => { line.classList.remove('in'); void line.offsetWidth; line.textContent = txt; line.classList.add('in'); };
    const hideAll = () => { opts.innerHTML = ''; form.hidden = true; comp.hidden = true; next.hidden = true; };
    const showNext = (label, fn) => { next.hidden = false; $('.btn-label', next).textContent = label; next.onclick = e => { e.stopPropagation(); sfx('click'); fn(); }; };
    const final = i === N() - 1;
    function exchange(k) {
      hideAll(); const ex = D.ex[k]; setLine(ex.q);
      const shuffled = ex.opts.slice().sort(() => Math.random() - 0.5);
      shuffled.forEach(o => { const b = HR.U.el('button', 'sg-opt', esc(o.text)); b.type = 'button'; b.addEventListener('click', e => { e.stopPropagation(); sfx('click'); picks.push(o.v); if (k + 1 < D.ex.length) exchange(k + 1); else askMessage(); }); opts.appendChild(b); });
    }
    function askMessage() {
      hideAll(); setLine(D.prompt); form.hidden = false; input.value = ''; setTimeout(() => { try { input.focus(); } catch (_) {} }, 60);
      form.onsubmit = e => { e.preventDefault(); e.stopPropagation(); message = input.value.slice(0, 90); sfx('click'); if (final) askCompose(); else finish(); };
    }
    function askCompose() {
      hideAll(); setLine(HR.t('sg_compose')); comp.hidden = false; comp.innerHTML = '';
      const words = s.wordsEarned();
      if (!words.length) comp.appendChild(HR.U.el('p', 'lb-note', esc(HR.t('sg_compose_none'))));
      words.forEach(w => { const b = HR.U.el('button', 'sg-tile', esc(HR.t('sg_word_' + w))); b.type = 'button'; b.addEventListener('click', e => { e.stopPropagation(); const at = compose.indexOf(w); if (at >= 0) compose.splice(at, 1); else if (compose.length < 3) compose.push(w); b.classList.toggle('on', compose.includes(w)); sfx('click'); }); comp.appendChild(b); });
      showNext(HR.t('sg_send'), finish);
    }
    function finish() {
      hideAll();
      const res = s.evaluate(i, picks, message, compose);
      s.setPath(i, res.path);
      setLine(D.reply(res.path));
      showNext(HR.t('sg_continue'), () => { close(); if (HR.UI.stack.includes('singularity')) { renderSingularity(); openLayer(i); } });
    }
    function close() { el.classList.remove('visible'); if (dlgRaf) cancelAnimationFrame(dlgRaf); dlgRaf = null; }
    $('.sg-dlg-x', el).onclick = e => { e.stopPropagation(); sfx('click'); close(); };
    hideAll(); setLine(D.intro); showNext(HR.t('sg_continue'), () => exchange(0));
    el.classList.add('visible');
    if (dlgRaf) cancelAnimationFrame(dlgRaf);
    if (HR.Perf && HR.Perf.lite && HR.Perf.lite()) { holo(cv, A, 0.8); dlgRaf = null; return; }
    const loop = now => { if (!el.classList.contains('visible')) { dlgRaf = null; return; } holo(cv, A, now / 1000); dlgRaf = requestAnimationFrame(loop); };
    dlgRaf = requestAnimationFrame(loop);
    if (HR.Music && HR.Audio.unlocked) HR.Music.setIntensity(0.15);
    void step;
  }

  /* ---------------- cartões: Eco encontrado e depois da Prova ---------------- */
  function card(html, color) {
    const modal = $('#modal-item'), host = $('#item-detail');
    host.innerHTML = html + '<button type="button" class="btn" id="sg-card-ok"><span class="btn-label">' + esc(HR.t('sg_continue')) + '</span></button>';
    host.className = 'modal-card item-detail lv-detail sg-detail sg-card'; host.style.cssText = HR.UI.accentVars(color);
    $('#sg-card-ok', host).addEventListener('click', e => { e.stopPropagation(); sfx('click'); HR.UI.closeLevelDetail(); });
    HR.UI.bindBackdrop(modal, host); modal.classList.add('visible');
  }
  function showEco(i, p) {
    const A = HR.ARCHONS[i];
    card('<div class="lv-detail-head"><span class="sg-sigil">' + HR.plate('eco', A.color, 'lg round') + '</span><span class="kicker">' + esc(HR.t('sg_eco_title')) + ' · ' + esc(HR.t('sg_title_' + i)) + ' · ' + (p + 1) + '/5</span></div><p class="sg-eco-big">' + esc(HR.t('sg_eco_' + i + '_' + p)) + '</p>', A.color);
    sfx('reward');
  }
  function showArchonAfter(i, out) {
    const A = HR.ARCHONS[i], l = S().layer(i);
    let h = '<div class="lv-detail-head"><span class="sg-sigil">' + HR.plate(A.sigil, A.color, 'lg round') + '</span><span class="kicker">' + esc(HR.t('sg_layer_n', { n: i + 1 })) + ' · ' + esc(HR.t('sg_passed')) + '</span><h3 class="lv-detail-title">' + esc(HR.t('sg_name_' + i)) + '</h3></div>';
    h += '<p class="sg-eco-big">' + esc(HR.t('sg_after_' + i + '_' + l.path)) + '</p>';
    if (out && out.final) h += '<p class="lv-boss-desc gold">' + HR.icon('light') + ' ' + esc(HR.t('sg_epilogue_' + l.path)) + '</p>';
    const pills = (out && out.rewards || []).map(r => r.word ? '<span class="reward-pill">' + HR.icon('word') + ' ' + esc(HR.t('sg_word_' + r.word)) + '</span>' : r.skin ? '<span class="reward-pill">' + HR.icon('ball') + ' ' + esc(HR.t('skin_' + r.skin)) + '</span>' : r.title ? '<span class="reward-pill">' + HR.icon('crown') + ' ' + esc(HR.t(r.title)) + '</span>' : r.gems ? '<span class="reward-pill"><i class="ic-gem"></i> +' + r.gems + '</span>' : '').join('');
    if (pills) h += '<div class="reward-list">' + pills + '</div>';
    card(h, A.color);
    sfx('win');
  }

  Object.assign(HR.UI, { renderSingularity, openLayer, openDialogue, showEco, showArchonAfter });
})();
