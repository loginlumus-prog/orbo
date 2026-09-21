/* =====================================================================
   ORBO v7.1 — limpeza do menu.

   1. Os nomes saem de baixo dos icones da orbita. O desenho ja diz o que e,
      e quem nao souber descobre com um toque longo: o nome vira a dica do
      botao e o rotulo de acessibilidade. Nada se perde, so sai da tela.

   2. A fita de modos perde a caixa. Ficam tres icones soltos, o escolhido
      aceso e com um ponto embaixo, e o NOME do escolhido em cima deles —
      entao o texto aparece quando serve e nao o tempo todo.

   3. As cores das pecas saem daqui em rgba, e nao de color-mix() no CSS:
      color-mix so existe do Safari 16.2 para cima, e o iPhone 7 para no
      iOS 15 — la toda borda e todo brilho feito com ele sumia.

   Sem nenhuma animacao de texto: o nome so troca quando a pessoa toca.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const $ = (s, r) => HR.U.$(s, r), $$ = (s, r) => HR.U.$$(s, r);

  const after = (obj, nome, fn) => {
    const o = obj[nome]; if (typeof o !== 'function') return;
    obj[nome] = function () { const r = o.apply(this, arguments); try { fn.apply(this, arguments); } catch (_) { /* nada */ } return r; };
  };

  /* ---------------- 1. o nome do botao vira dica ---------------- */
  function nomesViramDica() {
    $$('.orbit-btn').forEach(b => {
      const l = $('.ob-label', b); if (!l) return;
      const txt = (l.textContent || '').trim(); if (!txt) return;
      if (b.getAttribute('data-tip') === txt) return;
      b.setAttribute('aria-label', txt);
      b.setAttribute('data-tip', txt);
    });
  }

  /* ---------------- 2. as cores, em rgba ---------------- */
  /* color-mix() so existe no Safari 16.2 para cima, e o iPhone 7 para no iOS 15.
     Toda borda e todo brilho feito com ele simplesmente sumia nesses aparelhos.
     Entao a cor vem pronta daqui, em rgba, que funciona em tudo. */
  HR.UI.corSelo = function (el, c) {
    const u = HR.U;
    el.style.setProperty('--rc', c);
    el.style.setProperty('--rc-f', u.rgba(u.mix(c, '#0a0e1e', 0.6), 0.9));
    el.style.setProperty('--rc-aro', u.rgba(c, 0.45));
    el.style.setProperty('--rc-luz', u.rgba(c, 0.28));
    el.style.setProperty('--rc-forte', u.rgba(c, 0.75));
    el.style.setProperty('--rc-claro', u.mix(c, '#ffffff', 0.4));
  };

  // o --ic mora no <span> do icone; as pecas coloridas do botao estao no botao
  function coresDoModo() {
    HR.U.$$('#mode-seg .mode-btn').forEach(b => {
      const ic = $('.ic', b); if (!ic) return;
      const c = (ic.style.getPropertyValue('--ic') || '').trim(); if (!c) return;
      if (b.style.getPropertyValue('--ic') === c) return;
      b.style.setProperty('--ic', c);
      b.style.setProperty('--ic-luz', HR.U.rgba(c, 0.26));
      b.style.setProperty('--ic-forte', HR.U.rgba(c, 0.6));
    });
  }

  /* ---------------- 3. o nome do modo, em cima dos icones ---------------- */
  function placa() {
    const seg = $('#mode-seg'); if (!seg) return null;
    let el = $('#mode-name');
    if (!el) {
      el = HR.U.el('b', 'mode-name'); el.id = 'mode-name';
      el.setAttribute('data-bind', 'modeName');
      seg.parentNode.insertBefore(el, seg);
    }
    return el;
  }
  function nomeDoModo() {
    if (!placa()) return;
    const m = (HR.Store.data && HR.Store.data.mode) || 'endless';
    HR.UI.bind('modeName', HR.t('mode_' + m));
  }

  after(HR.UI, 'refreshMenu', function () { nomesViramDica(); coresDoModo(); nomeDoModo(); });
  after(HR.UI, 'refreshMode', function () { coresDoModo(); nomeDoModo(); });
  after(HR, 'applyI18n', function () { nomesViramDica(); nomeDoModo(); });
  setTimeout(() => { try { nomesViramDica(); coresDoModo(); nomeDoModo(); } catch (_) { /* nada */ } }, 500);
})();
