/* =====================================================================
   ORBO v7 — O mural dos fragmentos.

   Uma aba nova dentro de Conquistas, que e onde a colecao ja mora.
   - grade de 33 lugares: o que falta e uma silhueta sem titulo;
   - os 7 secretos nao tem nem silhueta, so um vinco;
   - tocar num fragmento abre o card em tela cheia, animado, com o texto;
   - em cima, quanto dela ja voltou.

   Desempenho: as miniaturas desenham UM quadro e param. So o card aberto
   anima, e no nivel Baixo nem ele anima.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const $ = (s, r) => HR.U.$(s, r), $$ = (s, r) => HR.U.$$(s, r);
  const esc = s => HR.UI.esc(s);
  const lite = () => !!(HR.Perf && HR.Perf.lite && HR.Perf.lite());

  const SEGREDO = f => f.t.k === 'segredo' || f.t.k === 'final';

  /* ---------------- desenhar um card ---------------- */
  function desenha(ctx, W, H, f, t) {
    const cena = HR.FragScenes[f.cena];
    if (!cena) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    cena(ctx, W, H, f.p, t);
    HR.FragArt.moldura(ctx, W, H, f.p.cor || '#4cf0ff', Math.max(10, Math.round(W * 0.04)));
    ctx.restore();
  }

  // miniatura: um quadro so, no tamanho da celula
  function miniatura(f, L) {
    const dpr = Math.min(HR.Perf ? HR.Perf.dprCap() : 2, window.devicePixelRatio || 1);
    const w = L, h = Math.round(L * 0.7);
    const cv = HR.U.el('canvas', 'fr-cv');
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    desenha(ctx, w, h, f, 3.2);
    return cv;
  }

  // o que ainda nao voltou: silhueta, ou so um vinco se for segredo
  function vazio(f, L) {
    const w = L, h = Math.round(L * 0.7);
    const cv = HR.U.el('canvas', 'fr-cv');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const ctx = cv.getContext('2d'), u = HR.U;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0.045)'); g.addColorStop(1, 'rgba(255,255,255,0.015)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    if (SEGREDO(f)) {
      // vinco: nem a forma se conhece
      ctx.strokeStyle = u.rgba('#ffffff', 0.10); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(w * 0.28, h * 0.72); ctx.lineTo(w * 0.72, h * 0.28); ctx.stroke();
    } else {
      // silhueta: a forma do que falta, sem cor e sem nome
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
      ctx.globalAlpha = 0.16;
      const cinza = Object.assign({}, f.p, { cor: '#8b93ad', lavada: 1 });
      const cena = HR.FragScenes[f.cena];
      if (cena) { try { cena(ctx, w, h, cinza, 1.4); } catch (_) { /* nada */ } }
      ctx.restore();
      ctx.fillStyle = 'rgba(4,6,14,0.55)'; ctx.fillRect(0, 0, w, h);
    }
    HR.FragArt.moldura(ctx, w, h, '#6c78a0', Math.max(10, Math.round(w * 0.04)));
    return cv;
  }

  /* ---------------- o mural ---------------- */
  function renderMural(body) {
    const n = HR.Frag.count(), T = HR.Frag.TOTAL;
    const topo = HR.U.el('div', 'fr-topo');
    topo.innerHTML =
      '<span class="kicker">' + esc(HR.t('frag_sub')) + '</span>' +
      '<b class="num">' + n + '<small>/' + T + '</small></b>' +
      '<i class="fr-barra"><span style="width:' + (n / T * 100).toFixed(1) + '%"></span></i>' +
      '<p class="fr-dica">' + esc(n >= T ? HR.t('frag_completo') : HR.t('frag_dica')) + '</p>';
    body.appendChild(topo);

    const grade = HR.U.el('div', 'fr-grade');
    const L = Math.max(96, Math.min(190, Math.round(((body.clientWidth || 340) - 26) / 2)));
    HR.FRAGMENTS.forEach(f => {
      const tem = HR.Frag.has(f.id);
      const cel = HR.U.el('button', 'fr-cel' + (tem ? ' on' : '') + (SEGREDO(f) && !tem ? ' seg' : ''));
      cel.type = 'button';
      cel.style.setProperty('--fc', f.p.cor || '#4cf0ff');
      cel.appendChild(tem ? miniatura(f, L) : vazio(f, L));
      const leg = HR.U.el('span', 'fr-leg');
      leg.innerHTML = tem
        ? '<b>' + esc(HR.t('fr_' + f.id)) + '</b>'
        : '<b class="fr-off">' + esc(SEGREDO(f) ? HR.t('frag_segredo') : HR.t('frag_bloq')) + '</b>';
      cel.appendChild(leg);
      if ((HR.Frag.novos() || []).indexOf(f.id) >= 0) cel.appendChild(HR.U.el('span', 'fr-novo', esc(HR.t('frag_novo'))));
      if (tem) cel.addEventListener('click', () => { HR.Audio.sfx('open'); abrir(f.id); });
      else cel.addEventListener('click', () => HR.Audio.sfx('error'));
      grade.appendChild(cel);
    });
    body.appendChild(grade);
    HR.Frag.check('mural', 1);
  }

  /* ---------------- o card em tela cheia ---------------- */
  let raf = null, folha = null;
  function fechar() {
    if (raf) cancelAnimationFrame(raf); raf = null;
    if (folha) { folha.classList.remove('show'); const f = folha; folha = null; setTimeout(() => f.remove(), 220); }
  }
  HR.UI.fragClose = fechar;

  function abrir(id) {
    const f = HR.Frag.def(id); if (!f) return;
    HR.Frag.verNovo(id);
    fechar();
    folha = HR.U.el('div', 'fr-folha');
    folha.innerHTML =
      '<div class="fr-card" style="--fc:' + (f.p.cor || '#4cf0ff') + '">' +
        '<canvas class="fr-grande"></canvas>' +
        '<div class="fr-txt">' +
          '<b class="fr-tit">' + esc(HR.t('fr_' + id)) + '</b>' +
          '<p>' + esc(HR.t('fr_' + id + '_1')) + '</p>' +
          '<p>' + esc(HR.t('fr_' + id + '_2')) + '</p>' +
          '<small class="fr-onde">' + esc(HR.t('frag_onde')) + ': ' + esc(HR.t('fr_' + id + '_o')) + '</small>' +
        '</div>' +
        '<button type="button" class="fr-x" aria-label="' + esc(HR.t('back')) + '">' + HR.icon('x') + '</button>' +
      '</div>';
    ($('#app') || document.body).appendChild(folha);
    requestAnimationFrame(() => folha && folha.classList.add('show'));
    $('.fr-x', folha).addEventListener('click', e => { e.stopPropagation(); HR.Audio.sfx('click'); fechar(); });
    folha.addEventListener('click', e => { if (e.target === folha) fechar(); });

    const cv = $('.fr-grande', folha);
    const medir = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(HR.Perf ? HR.Perf.dprCap() : 2, window.devicePixelRatio || 1);
      const w = Math.max(80, Math.round(r.width)), h = Math.max(56, Math.round(r.height));
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      return { w, h, dpr };
    };
    let m = medir();
    const ctx = cv.getContext('2d');
    const quadro = agora => {
      if (!folha || !cv.isConnected) { raf = null; return; }
      const r = cv.getBoundingClientRect();
      if (Math.abs(r.width - m.w) > 2 || Math.abs(r.height - m.h) > 2) m = medir();
      ctx.setTransform(m.dpr, 0, 0, m.dpr, 0, 0);
      desenha(ctx, m.w, m.h, f, agora / 1000);
      raf = lite() ? null : requestAnimationFrame(quadro);
    };
    raf = requestAnimationFrame(quadro);
  }
  HR.UI.fragOpen = abrir;

  /* ---------------- aviso de fragmento novo ---------------- */
  HR.UI.fragPopup = function (id) {
    const f = HR.Frag.def(id); if (!f) return;
    let host = $('#trophy-host');
    if (!host) { host = HR.U.el('div', ''); host.id = 'trophy-host'; ($('#app') || document.body).appendChild(host); }
    const el = HR.U.el('button', 'fr-pop'); el.type = 'button';
    el.style.setProperty('--fc', f.p.cor || '#4cf0ff');
    const mini = miniatura(f, 74);
    el.appendChild(mini);
    el.insertAdjacentHTML('beforeend',
      '<span class="fr-pop-main"><span class="fr-pop-k">' + esc(HR.t('frag_novo')) + ' ' + HR.Frag.count() + '/' + HR.Frag.TOTAL + '</span>' +
      '<b>' + esc(HR.t('fr_' + id)) + '</b></span>');
    el.addEventListener('click', e => {
      e.stopPropagation(); el.classList.add('out');
      if (['menu', 'over', 'levelend'].includes(HR.UI.current)) abrir(id);
    });
    host.appendChild(el);
    HR.Audio.sfx('reward');
    setTimeout(() => el.classList.add('out'), 3600);
    setTimeout(() => el.remove(), 3950);
  };

  /* ---------------- ligar no jogo ---------------- */
  const after = (obj, nome, fn) => {
    const o = obj[nome]; if (typeof o !== 'function') return;
    obj[nome] = function () { const r = o.apply(this, arguments); try { fn.apply(this, arguments); } catch (_) { /* nada */ } return r; };
  };

  // a aba nova desenha o mural
  after(HR.UI, 'renderAchievements', function () {
    if (HR.UI.achTab !== 'frags') return;
    const body = $('#ach-body'); if (!body) return;
    body.innerHTML = '';
    renderMural(body);
  });

  // fechar o card antes de sair da tela
  after(HR.UI, 'back', fechar);
  after(HR.UI, 'setBase', fechar);

  // os gatilhos
  after(HR.UI, 'onLevelEnd', function () { HR.Frag.sync(); });
  after(HR.UI, 'onGameOver', function () { HR.Frag.sync(); });
  if (HR.game && HR.game.on) HR.game.on('levelend', () => HR.Frag.sync());

  HR.UI.fragSync = () => HR.Frag.sync();
  setTimeout(() => { try { HR.Frag.sync(); } catch (_) { /* nada */ } }, 1200);
})();
