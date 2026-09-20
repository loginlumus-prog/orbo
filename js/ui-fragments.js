/* =====================================================================
   ORBO v7.1 — O mural dos fragmentos.

   Uma aba dentro de Conquistas, que e onde a colecao ja mora.
   - grade de 33 lugares: o que falta e uma silhueta sem titulo;
   - os 7 secretos nao tem nem silhueta, so um vinco;
   - tocar num fragmento abre o card em TELA CHEIA, com a arte ocupando tudo e
     o texto pousado embaixo; da para passar de um para o outro ali mesmo;
   - em cima, quanto dela ja voltou.

   Quando um fragmento e liberado, ele entra na colecao na hora: a grade se
   redesenha se estiver aberta, a aba ganha um ponto e o botao Colecao do menu
   tambem.

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
  /* As cenas medem tudo pela altura (r = H * 0.11, R = H * 0.34...). Num quadro
     de tela cheia, que e bem mais alto que largo, os arranjos estourariam a
     largura. Entao o palco tem proporcao presa, fica um pouco acima do meio, e
     o ceu continua para fora dele — o quadro fica cheio e a composicao, inteira. */
  function desenha(ctx, W, H, f, t, comMoldura) {
    const cena = HR.FragScenes[f.cena]; if (!cena) return;
    const u = HR.U, cor = f.p.cor || '#4cf0ff';
    const Hp = Math.min(H, Math.round(W * 1.22));
    const dy = Math.round((H - Hp) * 0.34);

    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    ctx.fillStyle = '#02030a'; ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(0, dy);
    ctx.beginPath(); ctx.rect(0, 0, W, Hp); ctx.clip();
    cena(ctx, W, Hp, f.p, t);
    ctx.restore();

    if (Hp < H) {
      // as faixas de fora nao sao pintadas: sao a PROPRIA beirada da cena
      // esticada. Assim nao existe emenda para o olho achar.
      const px = ctx.canvas.width / W, py = ctx.canvas.height / H;
      const fim = dy + Hp;
      if (dy > 0) ctx.drawImage(ctx.canvas, 0, Math.round(dy * py), Math.round(W * px), 1, 0, 0, W, dy);
      if (fim < H) ctx.drawImage(ctx.canvas, 0, Math.round((fim - 1) * py), Math.round(W * px), 1, 0, fim - 1, W, H - fim + 1);
      // poeira: as faixas esticadas ficam lisas demais sem ela
      const A = HR.FragArt;
      for (let i = 0; i < 54; i++) {
        const a = A.rnd(i * 5.3 + 1), b = A.rnd(i * 9.1 + 2), c = A.rnd(i * 3.7 + 3);
        const y = b < 0.5 ? a * dy : H - a * (H - fim);
        ctx.fillStyle = u.rgba(c > 0.85 ? cor : '#ffffff', 0.07 + c * 0.2);
        ctx.beginPath(); ctx.arc(b * W, y, 0.4 + c * 1.1, 0, Math.PI * 2); ctx.fill();
      }
      // vinheta por cima de tudo: fecha o quadro inteiro numa coisa so
      const v = ctx.createRadialGradient(W * 0.5, dy + Hp * 0.45, H * 0.30, W * 0.5, dy + Hp * 0.45, H * 0.85);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    }
    if (comMoldura) HR.FragArt.moldura(ctx, W, H, cor, Math.max(10, Math.round(W * 0.04)));
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
    desenha(ctx, w, h, f, 3.2, true);
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
  let pintando = false;
  function renderMural(body) {
    // abrir o mural E um gatilho. Contar ANTES da grade, senao o fragmento que
    // acabou de ser ganho apareceria trancado ate sair e voltar. A trava e para
    // o gatilho nao mandar repintar no meio deste mesmo desenho.
    pintando = true;
    try { HR.Frag.check('mural', 1); } finally { pintando = false; }

    const n = HR.Frag.count(), T = HR.Frag.TOTAL;
    const topo = HR.U.el('div', 'fr-topo-mural');
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
  }

  // redesenhar o mural se ele estiver na tela agora
  function repinta() {
    if (pintando) return false;
    if (HR.UI.achTab !== 'frags' || HR.UI.stack.indexOf('achievements') < 0) return false;
    const body = $('#ach-body'); if (!body) return false;
    body.innerHTML = ''; renderMural(body);
    return true;
  }

  /* ---------------- o card em tela cheia ---------------- */
  let raf = null, folha = null, atual = null;

  function fechar() {
    if (raf) cancelAnimationFrame(raf); raf = null;
    atual = null;
    if (folha) { folha.classList.remove('show'); const f = folha; folha = null; setTimeout(() => f.remove(), 240); }
  }
  HR.UI.fragClose = fechar;

  // a volta inteira, na ordem do mural, só com o que ela já lembra
  const tidos = () => HR.FRAGMENTS.filter(f => HR.Frag.has(f.id));

  function abrir(id) {
    const f = HR.Frag.def(id); if (!f) return;
    if (folha) { mostra(id); return; }

    folha = HR.U.el('div', 'fr-folha');
    folha.innerHTML =
      '<div class="fr-card">' +
        '<canvas class="fr-grande"></canvas>' +
        '<i class="fr-veu"></i>' +
        '<div class="fr-frente">' +
          '<div class="fr-topo">' +
            '<span class="kicker fr-ato"></span>' +
            '<button type="button" class="fr-x" aria-label="' + esc(HR.t('back')) + '">' + HR.icon('x') + '</button>' +
          '</div>' +
          '<div class="fr-meio"></div>' +
          '<div class="fr-txt">' +
            '<b class="fr-tit"></b>' +
            '<p class="fr-p1"></p>' +
            '<p class="fr-p2"></p>' +
            '<small class="fr-onde"></small>' +
          '</div>' +
          '<div class="fr-navs">' +
            '<button type="button" class="fr-nav fr-ant" aria-label="' + esc(HR.t('frag_ant')) + '">' + HR.icon('chevronLeft') + '</button>' +
            '<span class="fr-conta num"></span>' +
            '<button type="button" class="fr-nav fr-prox" aria-label="' + esc(HR.t('frag_prox')) + '">' + HR.icon('chevronRight') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    ($('#app') || document.body).appendChild(folha);
    requestAnimationFrame(() => folha && folha.classList.add('show'));

    $('.fr-x', folha).addEventListener('click', e => { e.stopPropagation(); HR.Audio.sfx('click'); fechar(); });
    folha.addEventListener('click', e => { if (e.target === folha) fechar(); });
    $('.fr-ant', folha).addEventListener('click', e => { e.stopPropagation(); anda(-1); });
    $('.fr-prox', folha).addEventListener('click', e => { e.stopPropagation(); anda(1); });

    // arrastar de lado passa de um para o outro, como virar uma pagina
    let px = 0, py = 0, pt = 0;
    const card = $('.fr-card', folha);
    card.addEventListener('pointerdown', e => { px = e.clientX; py = e.clientY; pt = Date.now(); });
    card.addEventListener('pointerup', e => {
      if (!pt || Date.now() - pt > 900) { pt = 0; return; }
      const dx = e.clientX - px, dy = e.clientY - py; pt = 0;
      if (Math.abs(dx) > 55 && Math.abs(dy) < 50) anda(dx < 0 ? 1 : -1);
    });

    const cv = $('.fr-grande', folha);
    let m = medir();
    // clientWidth e o tamanho de layout: nao conta o transform da animacao de
    // entrada, entao o canvas nao nasce 3% maior do que deveria
    function medir() {
      const dpr = Math.min(HR.Perf ? HR.Perf.dprCap() : 2, window.devicePixelRatio || 1);
      const w = Math.max(80, cv.clientWidth || 320), h = Math.max(56, cv.clientHeight || 480);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      return { w, h, dpr };
    }
    const ctx = cv.getContext('2d');
    const quadro = agora => {
      if (!folha || !cv.isConnected || !atual) { raf = null; return; }
      if (Math.abs(cv.clientWidth - m.w) > 1 || Math.abs(cv.clientHeight - m.h) > 1) m = medir();
      ctx.setTransform(m.dpr, 0, 0, m.dpr, 0, 0);
      desenha(ctx, m.w, m.h, atual, agora / 1000, false);
      raf = lite() ? null : requestAnimationFrame(quadro);
    };

    mostra(id);
    raf = requestAnimationFrame(quadro);

    function anda(passo) {
      const lista = tidos(), k = lista.findIndex(x => x.id === atual.id);
      const alvo = lista[(k + passo + lista.length) % lista.length];
      if (!alvo || alvo.id === atual.id) return;
      HR.Audio.sfx('click');
      mostra(alvo.id);
      if (!raf && !lite()) raf = requestAnimationFrame(quadro);
      if (lite()) { m = medir(); ctx.setTransform(m.dpr, 0, 0, m.dpr, 0, 0); desenha(ctx, m.w, m.h, atual, 3.2, false); }
    }
  }

  // troca o conteudo do card sem refazer a folha
  function mostra(id) {
    const f = HR.Frag.def(id); if (!f || !folha) return;
    atual = f;
    HR.Frag.verNovo(id);
    const lista = tidos(), k = lista.findIndex(x => x.id === id);
    const card = $('.fr-card', folha);
    card.style.setProperty('--fc', f.p.cor || '#4cf0ff');
    card.classList.remove('troca'); void card.offsetWidth; card.classList.add('troca');
    $('.fr-ato', folha).textContent = HR.t('frag_ato' + (f.ato || 1));
    $('.fr-tit', folha).textContent = HR.t('fr_' + id);
    $('.fr-p1', folha).textContent = HR.t('fr_' + id + '_1');
    $('.fr-p2', folha).textContent = HR.t('fr_' + id + '_2');
    $('.fr-onde', folha).textContent = HR.t('frag_onde') + ': ' + HR.t('fr_' + id + '_o');
    $('.fr-conta', folha).textContent = (k + 1) + ' / ' + lista.length;
    $('.fr-navs', folha).classList.toggle('so-um', lista.length < 2);
  }
  HR.UI.fragOpen = abrir;

  /* ---------------- aviso de fragmento novo ---------------- */
  HR.UI.fragPopup = function (id) {
    const f = HR.Frag.def(id); if (!f) return;
    let host = $('#trophy-host');
    if (!host) { host = HR.U.el('div', ''); host.id = 'trophy-host'; ($('#app') || document.body).appendChild(host); }
    const el = HR.U.el('button', 'fr-pop'); el.type = 'button';
    el.style.setProperty('--fc', f.p.cor || '#4cf0ff');
    el.appendChild(miniatura(f, 74));
    el.insertAdjacentHTML('beforeend',
      '<span class="fr-pop-main"><span class="fr-pop-k">' + esc(HR.t('frag_novo')) + ' ' + HR.Frag.count() + '/' + HR.Frag.TOTAL + '</span>' +
      '<b>' + esc(HR.t('fr_' + id)) + '</b><small>' + esc(HR.t('frag_ver')) + '</small></span>');
    el.addEventListener('click', e => {
      e.stopPropagation(); el.classList.add('out');
      // levar para a colecao: fechar o card deixa a pessoa no mural, nao no menu
      if (['menu', 'over', 'levelend'].includes(HR.UI.current)) {
        try { HR.UI.open('achievements', 'frags'); } catch (_) { /* nada */ }
        setTimeout(() => abrir(id), 60);
      }
    });
    host.appendChild(el);
    HR.Audio.sfx('reward');
    setTimeout(() => el.classList.add('out'), 4200);
    setTimeout(() => el.remove(), 4550);
  };

  /* ---------------- os selos de "tem coisa nova" ---------------- */
  function selos() {
    const tem = (HR.Frag.novos() || []).length > 0;
    const aba = $('#ach-tabs .tab[data-tab="frags"]');
    if (aba) aba.classList.toggle('tem-novo', tem);
    const bt = $('#orbit-collection .ob-circle');
    if (bt) {
      let b = $('[data-badge="frags"]', bt);
      if (!b) { b = HR.U.el('span', 'badge'); b.setAttribute('data-badge', 'frags'); bt.appendChild(b); }
      b.classList.toggle('on', tem);
    }
  }

  /* ---------------- ligar no jogo ---------------- */
  const after = (obj, nome, fn) => {
    const o = obj[nome]; if (typeof o !== 'function') return;
    obj[nome] = function () { const r = o.apply(this, arguments); try { fn.apply(this, arguments); } catch (_) { /* nada */ } return r; };
  };

  // a aba nova desenha o mural
  after(HR.UI, 'renderAchievements', function () {
    if (HR.UI.achTab === 'frags') {
      const body = $('#ach-body');
      if (body) { body.innerHTML = ''; renderMural(body); }
    }
    selos();
  });

  // liberar um fragmento entra na colecao na hora
  const unlock = HR.Frag.unlock.bind(HR.Frag);
  HR.Frag.unlock = function (id) {
    const ok = unlock(id);
    if (ok) { try { repinta(); selos(); } catch (_) { /* nada */ } }
    return ok;
  };

  // voltar com o card aberto fecha so o card: quem estava no mural continua nele
  const back = HR.UI.back;
  HR.UI.back = function () {
    if (folha) { HR.Audio.sfx('click'); fechar(); return; }
    return back.apply(this, arguments);
  };
  after(HR.UI, 'setBase', fechar);
  after(HR.UI, 'refreshMenu', selos);

  // os gatilhos
  after(HR.UI, 'onLevelEnd', function () { HR.Frag.sync(); });
  after(HR.UI, 'onGameOver', function () { HR.Frag.sync(); });
  if (HR.game && HR.game.on) HR.game.on('levelend', () => HR.Frag.sync());

  HR.UI.fragSync = () => HR.Frag.sync();
  setTimeout(() => { try { HR.Frag.sync(); selos(); } catch (_) { /* nada */ } }, 1200);
})();

Object.assign(HR.I18N.pt, {
  frag_ato1: 'ATO I · ACORDAR', frag_ato2: 'ATO II · LEMBRAR',
  frag_ato3: 'ATO III · ESCOLHER', frag_ato4: 'DEPOIS DO FIM',
  frag_ant: 'Anterior', frag_prox: 'Próximo', frag_ver: 'Toque para ver'
});
Object.assign(HR.I18N.en, {
  frag_ato1: 'ACT I · WAKING', frag_ato2: 'ACT II · REMEMBERING',
  frag_ato3: 'ACT III · CHOOSING', frag_ato4: 'AFTER THE END',
  frag_ant: 'Previous', frag_prox: 'Next', frag_ver: 'Tap to see'
});
Object.assign(HR.I18N.es, {
  frag_ato1: 'ACTO I · DESPERTAR', frag_ato2: 'ACTO II · RECORDAR',
  frag_ato3: 'ACTO III · ELEGIR', frag_ato4: 'DESPUÉS DEL FIN',
  frag_ant: 'Anterior', frag_prox: 'Siguiente', frag_ver: 'Toca para ver'
});
