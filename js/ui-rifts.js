/* =====================================================================
   ORBO v6.1 — a tela das Fendas.
   Um painel com os dez buracos negros: os abertos mostram ouro e recorde,
   os fechados mostram em qual galáxia abrem. No menu, um selo diz em qual
   fenda você está e leva para cá.
   ===================================================================== */
(function () {
  const $ = (s, r) => HR.U.$(s, r), $$ = (s, r) => HR.U.$$(s, r);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const R = () => HR.Rifts;

  if (HR.UI.PANELS && HR.UI.PANELS.indexOf('rifts') < 0) HR.UI.PANELS.push('rifts');

  /* ---------------- a tela ---------------- */
  function ensure() {
    let el = document.getElementById('screen-rifts');
    if (el) return el;
    el = HR.U.el('section', 'screen panel');
    el.id = 'screen-rifts';
    el.innerHTML = '<header class="panel-head">' +
      '<button class="btn-icon" data-back aria-label="' + esc(HR.t('back') || 'Voltar') + '"><span class="ic" data-icon="back"></span></button>' +
      '<h2 class="ribbon"><span>' + esc(HR.t('rifts')) + '</span></h2><span></span></header>' +
      '<div class="panel-body" id="rifts-body"></div>';
    (document.getElementById('app') || document.body).appendChild(el);
    $('[data-back]', el).addEventListener('click', () => { HR.Audio.sfx('click'); HR.UI.back(); });
    if (HR.UI.glyphUpgrade) HR.UI.glyphUpgrade(el);
    return el;
  }

  // o buraco negro de cada fenda, desenhado com a cor da galáxia
  function skinFor(n) {
    const c = R().color(n);
    return { id: 'rift' + n, shape: 'blackhole', bh: 'sgra', base: '#000000', dark: '#000000', glow: c, disk: [HR.U.mix(c, '#ffffff', 0.55), c, HR.U.mix(c, '#3a0a2a', 0.5)] };
  }
  const canvases = [];
  function stopLoop() { canvases.length = 0; if (raf) cancelAnimationFrame(raf); raf = null; }
  let raf = null;
  function loop(now) {
    if (!canvases.length) { raf = null; return; }
    const t = now / 1000;
    canvases.forEach(c => {
      const ctx = c.cv.getContext('2d'), w = c.cv.width / c.dpr, h = c.cv.height / c.dpr;
      ctx.setTransform(c.dpr, 0, 0, c.dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = c.locked ? 0.35 : 1;
      HR.Render.drawBall(ctx, w / 2, h / 2, w * 0.3, c.skin, t, {});
      ctx.globalAlpha = 1;
    });
    if (!(HR.Perf && HR.Perf.lite && HR.Perf.lite())) raf = requestAnimationFrame(loop);
    else raf = null;
  }

  function card(n) {
    const open = R().unlocked(n), cur = R().current() === n, best = R().best(n);
    const el = HR.U.el('button', 'rift-card' + (open ? '' : ' locked') + (cur ? ' on' : ''));
    el.type = 'button';
    el.style.setProperty('--rc', R().color(n));
    const cv = HR.U.el('canvas', 'rift-art');
    const dpr = Math.min(2, (HR.Perf && HR.Perf.dprCap && HR.Perf.dprCap()) || window.devicePixelRatio || 1);
    cv.width = 108 * dpr; cv.height = 108 * dpr; cv.style.width = '108px'; cv.style.height = '108px';
    el.appendChild(cv);
    canvases.push({ cv, dpr, skin: skinFor(n), locked: !open });
    const info = HR.U.el('div', 'rift-info');
    info.innerHTML = '<b class="rift-name">' + esc(R().name(n)) + '</b>' +
      (open
        ? '<span class="rift-gold">' + HR.icon('coin', '', true) + ' ×' + R().mul(n).toFixed(2).replace('.00', '') + '</span>' +
          '<span class="rift-best">' + HR.icon('star', '', true) + ' ' + (best ? HR.U.fmt(best) : esc(HR.t('rift_none'))) + '</span>'
        : '<span class="rift-lock">' + HR.icon('lock') + ' ' + esc(HR.t('rift_locked', { n: n })) + '</span>');
    el.appendChild(info);
    if (cur) el.appendChild(HR.U.el('span', 'rift-tag', esc(HR.t('rift_current'))));
    el.addEventListener('click', () => {
      if (!open) { HR.Audio.sfx('error'); HR.UI.toast(HR.icon('lock') + ' ' + HR.t('rift_locked', { n: n }), 'bad'); return; }
      HR.Audio.sfx('click'); R().setCurrent(n); render();
      if (HR.UI.refreshMenu) HR.UI.refreshMenu();
    });
    return el;
  }

  function render() {
    const el = ensure(), body = $('#rifts-body', el); if (!body) return;
    stopLoop();
    body.innerHTML = '';
    const head = HR.U.el('div', 'rift-head');
    head.innerHTML = '<p class="rift-sub">' + esc(HR.t('rifts_d')) + '</p>' +
      '<p class="rift-sub dim">' + esc(HR.t('rift_same')) + '</p>' +
      '<span class="rift-count">' + esc(HR.t('rift_count', { a: R().openCount(), b: R().N })) + '</span>';
    body.appendChild(head);
    const grid = HR.U.el('div', 'rift-grid');
    for (let n = 1; n <= R().N; n++) grid.appendChild(card(n));
    body.appendChild(grid);
    const play = HR.U.el('button', 'btn btn-play rift-go', '<span class="ic" data-icon="play"></span><span class="btn-label">' + esc(HR.t('rift_play')) + '</span>');
    play.addEventListener('click', e => { e.stopPropagation(); HR.Audio.sfx('click'); HR.UI.back(); HR.UI.startGame('endless'); });
    body.appendChild(play);
    if (HR.UI.glyphUpgrade) HR.UI.glyphUpgrade(body);
    if (!raf) raf = requestAnimationFrame(loop);
  }
  HR.UI.renderRifts = render;

  const after = (obj, name, fn) => {
    const orig = obj[name]; if (typeof orig !== 'function') return;
    obj[name] = function () { const r = orig.apply(this, arguments); try { fn.apply(this, arguments); } catch (_) { /* nada */ } return r; };
  };
  ensure();   // a tela precisa existir antes de alguem mandar abrir
  after(HR.UI, 'open', function (panel) { if (panel === 'rifts') { render(); HR.UI.showScreen('rifts'); } });
  after(HR.UI, 'back', function () { if (!HR.UI.stack.includes('rifts')) stopLoop(); });

  /* ---------------- selo no menu ---------------- */
  function selo() {
    const dock = $('.bottom-dock'), seg = $('#mode-seg'); if (!dock || !seg) return;
    let chip = $('#rift-chip');
    const endless = HR.Store.data.mode === 'endless' || ($('.mode-btn[data-mode="endless"]') || {}).classList && $('.mode-btn[data-mode="endless"]').classList.contains('active');
    if (!endless) { if (chip) chip.hidden = true; return; }
    if (!chip) {
      chip = HR.U.el('button', 'rift-chip'); chip.id = 'rift-chip'; chip.type = 'button';
      chip.addEventListener('click', e => { e.stopPropagation(); HR.Audio.sfx('click'); HR.UI.open('rifts'); });
      seg.parentNode.insertBefore(chip, seg.nextSibling);
    }
    chip.hidden = false;
    const n = R().current();
    chip.style.setProperty('--rc', R().color(n));
    chip.innerHTML = '<span class="rc-dot"></span><b>' + esc(R().name(n)) + '</b>' +
      '<span class="rc-gold">' + HR.icon('coin', '', true) + '×' + R().mul(n).toFixed(2).replace('.00', '') + '</span>' +
      '<span class="rc-n">' + R().openCount() + '/' + R().N + '</span>' +
      '<span class="rc-go">' + HR.icon('chevronRight') + '</span>';
  }
  after(HR.UI, 'refreshMenu', selo);
  after(HR.UI, 'refreshMode', selo);   // é este que roda ao tocar em "Infinito"
  HR.UI.riftChip = selo;

  /* ---------------- recorde por fenda ---------------- */
  after(HR.UI, 'onOver', function (s) { if (s && s.mode === 'endless') R().record(s.score || 0); });
  after(HR.UI, 'processRunEnd', function (s) { if (s && s.mode === 'endless' && !HR.UI.onOver) R().record(s.score || 0); });

  /* ---------------- meus recordes: uma linha por fenda ---------------- */
  after(HR.UI, 'renderLeaderboard', function (tab) {
    if (HR.UI.lbTab !== 'local') return;
    const body = $('#lb-body'); if (!body || $('.rift-records', body)) return;
    const box = HR.U.el('div', 'rift-records');
    let h = '<div class="section-title">' + esc(HR.t('rifts')) + '</div>';
    for (let n = 1; n <= R().N; n++) {
      const open = R().unlocked(n);
      h += '<div class="rift-row' + (open ? '' : ' locked') + '" style="--rc:' + R().color(n) + '">' +
        '<span class="rr-dot"></span><b>' + esc(R().name(n)) + '</b>' +
        '<span class="rr-v">' + (open ? (R().best(n) ? HR.U.fmt(R().best(n)) : '—') : HR.icon('lock')) + '</span></div>';
    }
    box.innerHTML = h;
    body.appendChild(box);
  });
})();
