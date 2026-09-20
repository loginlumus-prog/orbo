/* =====================================================================
   ORBO v7 — peças de interface da versão.

   1. Botão do arco: no menu, liga e desliga o arco que gira em volta da bola,
      para dar para ver a skin sozinha. Fica ao lado do nome da skin, guarda a
      escolha e não toca em mais nada do jogo.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const $ = (s, r) => HR.U.$(s, r);

  /* ---------------- o arco da vitrine ---------------- */
  const semArco = () => !!(HR.Store.data.settings && HR.Store.data.settings.hideShowcaseRing);

  // quem pula o arco e o proprio renderShowcase (js/game.js), para os arcos
  // fantasma do fundo continuarem aparecendo

  function botao() {
    const cap = $('.skin-caption'); if (!cap || $('#btn-ring')) return;
    const b = HR.U.el('button', 'hero-arrow ring-toggle');
    b.type = 'button'; b.id = 'btn-ring';
    b.innerHTML = '<span class="ic" data-icon="ring"></span>';
    b.setAttribute('aria-label', HR.t('ring_toggle'));
    b.setAttribute('data-tip', HR.t('ring_toggle'));
    b.setAttribute('data-tip-d', HR.t('ring_toggle_d'));
    cap.appendChild(b);
    atualiza();
    b.addEventListener('click', e => {
      e.stopPropagation();
      const s = HR.Store.data.settings;
      s.hideShowcaseRing = !s.hideShowcaseRing;
      HR.Store.save();
      HR.Audio.sfx('click');
      atualiza();
    });
    if (HR.UI.glyphUpgrade) HR.UI.glyphUpgrade(cap);
  }

  function atualiza() {
    const b = $('#btn-ring'); if (!b) return;
    b.classList.toggle('off', semArco());
    b.setAttribute('data-tip-d', HR.t(semArco() ? 'ring_off_d' : 'ring_toggle_d'));
  }

  const after = (obj, nome, fn) => {
    const o = obj[nome]; if (typeof o !== 'function') return;
    obj[nome] = function () { const r = o.apply(this, arguments); try { fn.apply(this, arguments); } catch (_) { /* nada */ } return r; };
  };
  after(HR.UI, 'init', botao);
  after(HR.UI, 'refreshMenu', atualiza);
  setTimeout(botao, 900);
})();

Object.assign(HR.I18N.pt, {
  ring_toggle: 'Arco da vitrine',
  ring_toggle_d: 'Desligue para ver só a skin.',
  ring_off_d: 'Ligue para ver a bola dentro do arco.'
});
Object.assign(HR.I18N.en, {
  ring_toggle: 'Showcase ring',
  ring_toggle_d: 'Turn it off to see the skin alone.',
  ring_off_d: 'Turn it on to see the ball inside the ring.'
});
Object.assign(HR.I18N.es, {
  ring_toggle: 'Aro del escaparate',
  ring_toggle_d: 'Apágalo para ver solo la skin.',
  ring_off_d: 'Enciéndelo para ver la bola dentro del aro.'
});
