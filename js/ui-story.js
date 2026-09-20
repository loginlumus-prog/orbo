/* =====================================================================
   ORBO v5.9 — A HISTÓRIA (tela). Mostra as cenas de HR.Story.
   - Nunca aparece com a partida rodando: só no menu, no mapa e depois do chefe.
   - "Pular" sempre visível; segurar pula a cena inteira.
   - Escolher uma resposta não muda nada no jogo: só o texto e o final.
   ===================================================================== */
(function () {
  const $ = (s, r) => HR.U.$(s, r);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sfx = n => { try { HR.Audio.sfx(n); } catch (_) { /* nada */ } };

  let el = null, raf = null, busy = false, queue = [];

  function ensure() {
    if (el && el.isConnected) return el;
    el = HR.U.el('div', 'modal story-modal');
    el.id = 'story-dlg';
    el.innerHTML = '<div class="sg-dlg-card story-card">' +
      '<canvas class="sg-dlg-cv story-cv"></canvas>' +
      '<span class="kicker sg-dlg-kicker story-who"></span>' +
      '<p class="sg-dlg-line story-line"></p>' +
      '<div class="sg-dlg-opts story-opts"></div>' +
      '<button type="button" class="btn sg-dlg-next story-next"><span class="btn-label"></span></button>' +
      '<button type="button" class="story-skip"></button></div>';
    (document.getElementById('app') || document.body).appendChild(el);
    return el;
  }

  // retrato: o sigilo do personagem dentro de um holograma (mesmo desenho dos Arcontes)
  function holo(cv, who, t) {
    const r = cv.getBoundingClientRect(), W = Math.round(r.width) || 120, H = Math.round(r.height) || 120;
    const dpr = Math.min(2, (HR.Perf && HR.Perf.dprCap && HR.Perf.dprCap()) || window.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, U = HR.U;
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, W * 0.5);
    g.addColorStop(0, U.rgba(who.c, 0.32)); g.addColorStop(1, U.rgba(who.c, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = U.rgba(who.c, 0.38 - k * 0.1); ctx.lineWidth = 1.5;
      ctx.setLineDash([4 + k * 2, 6]); ctx.lineDashOffset = t * (10 + k * 8) * (k % 2 ? -1 : 1);
      ctx.beginPath(); ctx.ellipse(cx, cy, W * (0.28 + k * 0.08), W * (0.28 + k * 0.08) * 0.9, 0, 0, 6.283); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.9 + 0.1 * Math.sin(t * 4);
    HR.Render.glyph(ctx, who.ic, cx, cy + Math.sin(t * 1.5) * 2, W * 0.4, '#ffffff', 1.5);
    ctx.globalAlpha = 1;
  }

  /* ---------------- a cena ---------------- */
  function open(id, done) {
    const sc = HR.Story.scene(id);
    if (!sc) { if (done) done(); return; }
    if (busy) { queue.push([id, done]); return; }
    busy = true;

    const box = ensure(), card = $('.story-card', box);
    card.style.cssText = (HR.UI.accentVars ? HR.UI.accentVars(sc.who.c) : '') + '--ac:' + sc.who.c;
    const line = $('.story-line', box), opts = $('.story-opts', box), next = $('.story-next', box), cv = $('.story-cv', box);
    $('.story-who', box).textContent = sc.kicker || sc.who.name;
    $('.story-skip', box).innerHTML = HR.icon('close') + '<span>' + esc(HR.t('skip')) + '</span>';

    let i = 0, over = false;
    const setLine = txt => {
      const narr = txt.charAt(0) === '~';
      line.classList.remove('in'); void line.offsetWidth;
      line.classList.toggle('narr', narr);
      line.textContent = narr ? txt.slice(1) : txt;
      line.classList.add('in');
    };
    const showNext = (label, fn) => { next.hidden = false; $('.btn-label', next).textContent = label; next.onclick = e => { e.stopPropagation(); sfx('click'); fn(); }; };
    const hide = () => { opts.innerHTML = ''; next.hidden = true; };

    function step() {
      hide();
      if (i < sc.lines.length) { setLine(sc.lines[i++]); showNext(HR.t('sg_continue'), step); return; }
      if (sc.ask && sc.opts.length) return ask();
      finish(null, true);
    }
    function ask() {
      hide(); setLine(sc.ask);
      sc.opts.forEach(o => {
        const b = HR.U.el('button', 'sg-opt story-opt', esc(o.text)); b.type = 'button';
        b.addEventListener('click', e => { e.stopPropagation(); sfx('click'); answer(o.ax); });
        opts.appendChild(b);
      });
    }
    function answer(ax) {
      HR.Story.take(id, ax);
      const r = sc.reply(ax);
      hide();
      if (r) { setLine(r); showNext(HR.t('sg_continue'), () => finish(ax)); }
      else finish(ax);
    }
    function finish(ax, mark) {
      if (over) return; over = true;
      if (mark || !ax) HR.Story.see(id);
      close();
    }
    function close() {
      box.classList.remove('visible');
      if (raf) cancelAnimationFrame(raf); raf = null;
      busy = false;
      setTimeout(() => {
        if (done) { try { done(); } catch (_) { /* nada */ } }
        const nq = queue.shift(); if (nq) open(nq[0], nq[1]);
      }, 120);
    }

    // pular: um toque fecha a cena inteira (sem pontos em nenhum caminho)
    const skip = $('.story-skip', box);
    skip.onclick = e => { e.stopPropagation(); sfx('click'); HR.Story.take(id, null); if (!over) { over = true; close(); } };
    box.onclick = e => { if (e.target === box) return; };

    step();
    box.classList.add('visible');
    sfx('open');
    if (raf) cancelAnimationFrame(raf);
    const loop = now => { if (!box.classList.contains('visible')) { raf = null; return; } holo(cv, sc.who, now / 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  }
  HR.UI.storyScene = open;

  /* ---------------- onde as cenas entram ---------------- */
  const after = (obj, name, fn) => {
    const orig = obj[name]; if (typeof orig !== 'function') return;
    obj[name] = function () { const r = orig.apply(this, arguments); try { fn.apply(this, arguments); } catch (_) { /* nada */ } return r; };
  };

  // abertura: na primeira vez que o menu aparece
  let opened = false;
  after(HR.UI, 'setBase', function (name) {
    if (opened || name !== 'menu') return;
    opened = true;
    const id = HR.Story.mode() !== 'off' && !HR.Story.seen('open') && HR.Story.exists('open') ? 'open' : null;
    if (id) setTimeout(() => { if (HR.UI.current === 'menu') open(id); }, 700);
  });

  // entrada da galáxia: ao abrir o mapa dela pela primeira vez
  after(HR.UI, 'renderRegion', function () {
    const ri = HR.Store.data.campaign.lastRegion || 0;
    if (!HR.Campaign.isRegionUnlocked(ri)) return;
    const id = HR.Story.entrance(ri);
    if (id) setTimeout(() => { if (HR.UI.stack.indexOf('region') >= 0) open(id); }, 420);
  });

  // visita do elenco: antes da 1ª fase de um sistema
  const origStart = HR.UI.startLevel;
  HR.UI.startLevel = function (id) {
    const lv = HR.Campaign.level ? HR.Campaign.level(id) : null;
    if (lv && lv.li === 0 && !busy) {
      const sid = HR.Story.visit(lv.ri, lv.si);
      if (sid) { open(sid, () => origStart.call(HR.UI, id)); return; }
    }
    return origStart.apply(this, arguments);
  };

  // conversa do guardião: depois de vencer o chefe do sistema · carta: depois do chefe da galáxia
  after(HR.UI, 'onLevelEnd', function (s) {
    const lv = s && s.levelId ? HR.Campaign.level(s.levelId) : null;
    if (!lv || !s.success || !lv.boss) return;
    const letter = () => { const c = lv.si === 9 ? HR.Story.letterFor(lv.ri) : null; if (c) { HR.Story.letter(lv.ri + 1); open(c); } };
    const sid = HR.Story.bossTalk(lv.ri, lv.si);
    if (sid) setTimeout(() => open(sid, letter), 900);
    else setTimeout(letter, 900);
  });

  /* ---------------- ajuste: História completa / curta / desligada ---------------- */
  after(HR.UI, 'renderSettings', function () {
    const body = $('#settings-body'); if (!body || $('.setting-story', body)) return;
    const cur = HR.Story.mode();
    const wrap = HR.U.el('div', 'seg');
    [['full', 'st_set_full'], ['short', 'st_set_short'], ['off', 'st_set_off']].forEach(([v, k]) => {
      const b = HR.U.el('button', v === cur ? 'active' : '', esc(HR.t(k))); b.type = 'button';
      b.addEventListener('click', e => {
        e.stopPropagation(); sfx('click'); HR.Story.setMode(v);
        HR.U.$$('button', wrap).forEach(x => x.classList.toggle('active', x === b));
      });
      wrap.appendChild(b);
    });
    const row = HR.U.el('div', 'setting setting-story setting-stack');
    const gc = HR.glyphColor ? HR.glyphColor('word') : '';
    row.innerHTML = '<div class="s-main"><span class="s-ic"' + (gc ? ' style="--ic:' + gc + '"' : '') + '>' +
      (HR.glyph ? HR.glyph('word') : HR.icon('word')) + '</span><div class="s-label">' + esc(HR.t('st_set')) +
      '<small>' + esc(HR.t('st_set_d')) + '</small></div></div>';
    const ctl = HR.U.el('div', 's-ctl'); ctl.appendChild(wrap); row.appendChild(ctl);
    const title = HR.U.el('div', 'section-title', HR.t('st_set'));
    const profile = HR.U.$$('.section-title', body).filter(t => t.textContent === HR.t('profile'))[0];
    if (profile) { body.insertBefore(title, profile); body.insertBefore(row, profile); }
    else { body.appendChild(title); body.appendChild(row); }
  });

  /* ---------------- o anel de Vela: selo de moeda extra no Infinito ---------------- */
  after(HR.UI, 'refreshMenu', function () {
    const btn = $('.mode-btn[data-mode="endless"]'); if (!btn) return;
    const pct = HR.Story.endlessBonusPct();
    let tag = $('.mode-bonus', btn);
    if (pct <= 0) { if (tag) tag.remove(); return; }
    if (!tag) { tag = HR.U.el('b', 'mode-bonus'); btn.appendChild(tag); }
    tag.textContent = '+' + pct + '%';
    btn.setAttribute('data-tip', HR.t('st_ring_bonus', { n: pct }));
    btn.setAttribute('data-tip-tap', '1');
  });
})();
