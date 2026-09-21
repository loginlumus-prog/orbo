/* =====================================================================
   ORBO v7.1 — A HISTÓRIA (tela). Mostra as cenas de HR.Story.

   A cena agora toma a tela inteira. O cartãozinho de diálogo saiu: no lugar
   dele há um palco — o céu da galáxia atrás, o retrato de quem fala grande no
   meio, e a fala embaixo sobre um véu escuro, como num quadrinho.

   O que faz a cena parecer cinema e não um aviso:
   - o fundo é desenhado uma vez e fica: só o retrato respira;
   - a fala aparece letra por letra, termina e para (nada anima para sempre);
   - toque em qualquer lugar adianta: se ainda está escrevendo, completa a frase;
   - as respostas são cartões largos, não botõezinhos.

   Nunca aparece com a partida rodando: só no menu, no mapa e depois do chefe.
   "Pular" sempre visível. Escolher uma resposta não muda nada no jogo: só o
   texto e o final.
   ===================================================================== */
(function () {
  const $ = (s, r) => HR.U.$(s, r);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sfx = n => { try { HR.Audio.sfx(n); } catch (_) { /* nada */ } };
  const lite = () => !!(HR.Perf && HR.Perf.lite && HR.Perf.lite());
  const parado = () => lite() || !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  let el = null, raf = null, busy = false, queue = [], digT = null;

  function ensure() {
    if (el && el.isConnected) return el;
    el = HR.U.el('div', 'modal story-modal');
    el.id = 'story-dlg';
    el.innerHTML = '<div class="story-card">' +
      '<canvas class="st-ceu"></canvas>' +
      '<i class="st-veu"></i>' +
      '<div class="st-frente">' +
        '<div class="st-topo">' +
          '<span class="kicker st-cap"></span>' +
          '<button type="button" class="story-skip"></button>' +
        '</div>' +
        '<div class="st-meio"></div>' +
        '<div class="st-baixo">' +
          '<div class="st-passos"></div>' +
          '<span class="kicker st-quem"></span>' +
          '<p class="st-fala"></p>' +
          '<div class="st-opts"></div>' +
          '<button type="button" class="btn st-next"><span class="btn-label"></span></button>' +
        '</div>' +
      '</div></div>';
    (document.getElementById('app') || document.body).appendChild(el);
    return el;
  }

  /* ---------------- o palco ---------------- */
  /* O céu não muda durante a cena: desenhamos num canvas de apoio e só
     copiamos. O que anima é o retrato, que é barato. */
  let ceu = null, ceuK = '';

  function fazCeu(W, H, cor) {
    const k = W + 'x' + H + cor + (lite() ? 'L' : '');
    if (ceu && ceuK === k) return ceu;
    ceu = ceu || document.createElement('canvas');
    ceu.width = W; ceu.height = H; ceuK = k;
    const c = ceu.getContext('2d'), u = HR.U;
    if (HR.FragArt) {
      HR.FragArt.fundo(c, W, H, cor, 7, lite() ? 0.35 : 0.9);
    } else {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, u.mix(cor, '#05070f', 0.86)); g.addColorStop(1, '#02030a');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
    // chão: uma claridade baixa que dá pé ao retrato e segura o véu do texto
    const ch = c.createLinearGradient(0, H * 0.58, 0, H);
    ch.addColorStop(0, u.rgba(cor, 0));
    ch.addColorStop(1, u.rgba(cor, 0.12));
    c.fillStyle = ch; c.fillRect(0, H * 0.58, W, H * 0.42);
    // o fio do horizonte, bem baixo e discreto
    c.strokeStyle = u.rgba(cor, 0.22); c.lineWidth = 1;
    c.beginPath(); c.moveTo(0, Math.round(H * 0.62) + 0.5); c.lineTo(W, Math.round(H * 0.62) + 0.5); c.stroke();
    return ceu;
  }

  // retrato: o sigilo de quem fala dentro de um holograma, agora do tamanho da cena
  function palco(cv, who, t) {
    const W = Math.max(120, cv.clientWidth || 360), H = Math.max(160, cv.clientHeight || 640);
    const dpr = Math.min(2, (HR.Perf && HR.Perf.dprCap && HR.Perf.dprCap()) || window.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ceuK = '';
    }
    const ctx = cv.getContext('2d'), u = HR.U;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(fazCeu(Math.round(W * dpr), Math.round(H * dpr), who.c), 0, 0, W, H);

    const cx = W / 2, cy = H * 0.40, R = Math.min(W * 0.30, H * 0.19);
    const sobe = parado() ? 0 : Math.sin(t * 1.1) * R * 0.035;

    if (HR.FragArt) HR.FragArt.discoLuz(ctx, cx, cy, R * 2.7, who.c, 0.9);

    // três aros em profundidade: o holograma. Param no nível Baixo.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = u.rgba(who.c, 0.34 - k * 0.09); ctx.lineWidth = 1.4;
      ctx.setLineDash([5 + k * 3, 8 + k * 2]);
      ctx.lineDashOffset = parado() ? k * 4 : t * (12 + k * 9) * (k % 2 ? -1 : 1);
      ctx.beginPath(); ctx.ellipse(cx, cy, R * (1.05 + k * 0.26), R * (1.05 + k * 0.26) * 0.88, -0.2 + k * 0.18, 0, 6.283); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    // o sigilo, em duas passadas: uma larga e fraca por trás (brilho), uma limpa em cima.
    // a espessura é dada no espaço do ícone (24 un.), então cresce com o tamanho sozinha.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.45;
    HR.Render.glyph(ctx, who.ic, cx, cy + sobe, R * 1.62, who.c, 3.6);
    ctx.restore();
    HR.Render.glyph(ctx, who.ic, cx, cy + sobe, R * 1.55, '#ffffff', 1.5);

    // reflexo no chão: uma mancha só, que dá peso ao retrato
    const gr = ctx.createRadialGradient(cx, H * 0.635, 0, cx, H * 0.635, R * 1.5);
    gr.addColorStop(0, u.rgba(who.c, 0.22)); gr.addColorStop(1, u.rgba(who.c, 0));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(cx, H * 0.635, R * 1.5, R * 0.22, 0, 0, 6.283); ctx.fill();
    ctx.restore();
  }

  /* ---------------- a cena ---------------- */
  function open(id, done) {
    const sc = HR.Story.scene(id);
    if (!sc) { if (done) done(); return; }
    if (busy) { queue.push([id, done]); return; }
    busy = true;

    const box = ensure(), card = $('.story-card', box);
    // cores prontas em rgba: color-mix nao existe no Safari 15 (iPhone 7)
    const u = HR.U, ac = sc.who.c;
    card.style.cssText = '--ac:' + ac + ';--ac-luz:' + u.rgba(ac, 0.16) +
      ';--ac-aro:' + u.rgba(ac, 0.45) + ';--ac-fundo:' + u.rgba(u.mix(ac, '#0a0e1c', 0.86), 0.92) + ';';
    const line = $('.st-fala', box), opts = $('.st-opts', box), next = $('.st-next', box);
    const cv = $('.st-ceu', box), passos = $('.st-passos', box), meio = $('.st-meio', box);
    $('.st-cap', box).textContent = sc.kicker || '';
    $('.st-quem', box).textContent = sc.who.name || '';
    $('.story-skip', box).innerHTML = HR.icon('close') + '<span>' + esc(HR.t('skip')) + '</span>';

    // os passos da cena: as falas mais a pergunta
    const total = sc.lines.length + (sc.ask && sc.opts.length ? 1 : 0);
    passos.innerHTML = total > 1 ? Array.from({ length: total }, () => '<i></i>').join('') : '';
    const marca = n => HR.U.$$('i', passos).forEach((p, k) => p.classList.toggle('on', k <= n));

    let i = 0, over = false, escrevendo = false;

    /* a fala aparece letra por letra, termina e para */
    function fala(txt) {
      const narr = txt.charAt(0) === '~', s = narr ? txt.slice(1) : txt;
      line.classList.toggle('narr', narr);
      if (digT) { clearInterval(digT); digT = null; }
      if (parado()) { line.textContent = s; escrevendo = false; card.classList.add('pronto'); return; }
      line.textContent = ''; escrevendo = true; card.classList.remove('pronto');
      let k = 0;
      const passo = Math.max(1, Math.ceil(s.length / 46));
      digT = setInterval(() => {
        k += passo; line.textContent = s.slice(0, k);
        if (k >= s.length) { clearInterval(digT); digT = null; escrevendo = false; card.classList.add('pronto'); }
      }, 18);
    }
    function completa() {
      if (!escrevendo) return false;
      if (digT) { clearInterval(digT); digT = null; }
      const t = line.getAttribute('data-full'); if (t) line.textContent = t;
      escrevendo = false; card.classList.add('pronto');
      return true;
    }
    const põe = txt => { line.setAttribute('data-full', txt.charAt(0) === '~' ? txt.slice(1) : txt); fala(txt); };

    const showNext = (label, fn) => {
      next.hidden = false; $('.btn-label', next).textContent = label;
      // o botao anda sempre: quem aperta ja decidiu. So o toque no palco vazio
      // e que primeiro completa a frase e so depois adianta.
      next.onclick = e => { e.stopPropagation(); completa(); sfx('click'); fn(); };
      avanca = fn;
    };
    const hide = () => { opts.innerHTML = ''; next.hidden = true; avanca = null; };
    let avanca = null;

    function step() {
      hide();
      if (i < sc.lines.length) { marca(i); põe(sc.lines[i++]); showNext(HR.t('sg_continue'), step); return; }
      if (sc.ask && sc.opts.length) return ask();
      finish(null, true);
    }
    function ask() {
      hide(); marca(total - 1); põe(sc.ask);
      sc.opts.forEach((o, k) => {
        const b = HR.U.el('button', 'st-opt'); b.type = 'button';
        b.innerHTML = '<i>' + (k + 1) + '</i><span>' + esc(o.text) + '</span>';
        b.addEventListener('click', e => { e.stopPropagation(); completa(); sfx('click'); answer(o.ax); });
        opts.appendChild(b);
      });
    }
    function answer(ax) {
      HR.Story.take(id, ax);
      const r = sc.reply(ax);
      hide();
      if (r) { põe(r); showNext(HR.t('sg_continue'), () => finish(ax)); }
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
      if (digT) { clearInterval(digT); digT = null; }
      busy = false;
      setTimeout(() => {
        if (done) { try { done(); } catch (_) { /* nada */ } }
        const nq = queue.shift(); if (nq) open(nq[0], nq[1]);
      }, 160);
    }

    // pular: um toque fecha a cena inteira (sem pontos em nenhum caminho)
    $('.story-skip', box).onclick = e => {
      e.stopPropagation(); sfx('click'); HR.Story.take(id, null);
      if (!over) { over = true; close(); }
    };

    // toque no palco: completa a frase, ou adianta se ela já terminou.
    // Com a pergunta na tela, o palco não adianta nada: a escolha é dela.
    const toque = e => {
      if (e.target.closest('button')) return;
      if (completa()) return;
      if (avanca) { sfx('click'); avanca(); }
    };
    meio.onclick = toque;
    $('.st-baixo', box).onclick = e => { if (e.target.closest('button') || opts.childElementCount) return; toque(e); };

    step();
    box.classList.add('visible');
    sfx('open');
    if (raf) cancelAnimationFrame(raf);
    const loop = now => {
      if (!box.classList.contains('visible')) { raf = null; return; }
      palco(cv, sc.who, now / 1000);
      raf = parado() ? null : requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }
  HR.UI.storyScene = open;

  /* ---------------- onde as cenas entram ---------------- */
  const after = (obj, name, fn) => {
    const orig = obj[name]; if (typeof orig !== 'function') return;
    obj[name] = function () { const r = orig.apply(this, arguments); try { fn.apply(this, arguments); } catch (_) { /* nada */ } return r; };
  };

  // com a cena aberta, voltar nao faz nada: a saida e o Pular, que esta sempre
  // na tela. Assim um toque no voltar nao pula a cena sem querer.
  const back = HR.UI.back;
  HR.UI.back = function () {
    if (busy && el && el.classList.contains('visible')) return;
    return back.apply(this, arguments);
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
    const btn = $('.mode-btn[data-mode="endless"]'); if (!btn || HR.Rifts) return;
    const pct = HR.Story.endlessBonusPct();
    let tag = $('.mode-bonus', btn);
    if (pct <= 0) { if (tag) tag.remove(); return; }
    if (!tag) { tag = HR.U.el('b', 'mode-bonus'); btn.appendChild(tag); }
    tag.textContent = '+' + pct + '%';
    btn.setAttribute('data-tip', HR.t('st_ring_bonus', { n: pct }));
    btn.setAttribute('data-tip-tap', '1');
  });
})();
