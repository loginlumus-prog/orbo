/* =====================================================================
   ORBO v5.5: menos texto na tela, mais símbolo.
   - Resumo de fim de fase: rótulos viram ícones (o número já diz o resto).
   - Ficha da fase: "como ganhar estrelas" vira três selos curtos com ícone.
   - Explicações longas (notas de ajuda, descrição de mecânica e de chefe) saem da tela e
     passam para um "i" ao lado do título: um toque mostra o texto completo.
   Nada de informação perdida: tudo continua acessível, só não ocupa a tela o tempo todo.
   ===================================================================== */
(function () {
  const $ = (s, r) => HR.U.$(s, r), $$ = (s, r) => HR.U.$$(s, r);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const infoBtn = (title, desc) =>
    '<button type="button" class="lean-i" data-tip="' + esc(title) + '" data-tip-d="' + esc(desc) + '" data-tip-tap="1" aria-label="' + esc(title) + '">' + HR.icon('info') + '</button>';

  // um parágrafo de ajuda vira um "i" ao lado do título mais próximo
  function tuck(p, title) {
    if (!p || p.dataset.lean) return;
    p.dataset.lean = '1';
    const txt = (p.textContent || '').trim(); if (!txt) { p.remove(); return; }
    let host = null;
    for (let el = p.previousElementSibling; el && !host; el = el.previousElementSibling) if (el.classList.contains('section-title')) host = el;
    if (!host) host = p.parentNode.querySelector('.kicker, b, .section-title');
    p.remove();
    if (host && !host.querySelector('.lean-i')) host.insertAdjacentHTML('beforeend', ' ' + infoBtn(title || (host.textContent || '').trim(), txt));
  }

  function lean(root) {
    if (!root) return;
    // notas de ajuda
    $$('.lb-note', root).forEach(p => tuck(p, HR.t('help')));
    $$('.contracts-note', root).forEach(p => tuck(p, HR.t('contracts')));
    // descrição do chefe na ficha da fase: fica o nome, o texto vai para o "i"
    $$('.lv-boss-desc:not([data-lean])', root).forEach(p => {
      if (p.classList.contains('gold')) return;            // a linha de "dominada" é curta e comemorativa
      const title = root.querySelector('.lv-detail-title'), txt = (p.textContent || '').trim();
      p.dataset.lean = '1'; p.remove();
      if (title && txt && !title.querySelector('.lean-i')) title.insertAdjacentHTML('beforeend', ' ' + infoBtn((title.textContent || '').trim(), txt));
    });
    // mecânica e chefe: fica o nome, o texto vai para o "i"
    $$('.reg-card .reg-card-main', root).forEach(main => {
      const p = main.querySelector('p:not([data-lean])'); if (!p) return;
      const name = main.querySelector('b'), kicker = main.querySelector('.kicker');
      const title = (name || kicker || {}).textContent || '';
      const txt = (p.textContent || '').trim();
      p.dataset.lean = '1'; p.remove();
      const host = name || kicker;
      if (host && txt && !host.querySelector('.lean-i')) host.insertAdjacentHTML('beforeend', ' ' + infoBtn(title.trim(), txt));
    });
  }

  /* ---------------- fim de fase: rótulos viram ícones ---------------- */
  const ROW_IC = { rings_passed: 'ring', perfects: 'target', misses: 'close', coins_earned: 'coin', rewards: 'gift' };
  function leanLevelEnd() {
    const host = $('#screen-levelend'); if (!host || host.dataset.lean) return;
    host.dataset.lean = '1';
    $$('.stat-row', host).forEach(row => {
      const first = row.firstElementChild; if (!first) return;
      const key = first.getAttribute('data-i18n') || (first.querySelector('[data-i18n]') || {}).getAttribute && first.querySelector('[data-i18n]').getAttribute('data-i18n');
      const ic = ROW_IC[key]; if (!ic) return;
      const label = HR.t(key);
      first.removeAttribute('data-i18n');
      const gc = HR.glyphColor && HR.glyphColor(ic), draw = HR.glyph || HR.icon;
      first.innerHTML = '<span class="lean-ic"' + (gc ? ' style="--ic:' + gc + '"' : '') + '>' + draw(ic, '', ic === 'coin') + '</span>';
      first.setAttribute('data-tip', label); first.setAttribute('data-tip-tap', '1');
      row.classList.add('lean-row');
    });
  }

  /* ---------------- ficha da fase: estrelas em selos curtos ---------------- */
  const CRIT = [
    { k: 'star_finish', s: 'star_s_finish', ic: 'ring' },
    { k: 'star_perfects', s: 'star_s_perfects', ic: 'target' },
    { k: 'star_flawless', s: 'star_s_flawless', ic: 'shield' }
  ];
  function leanLevelDetail() {
    const box = $('#item-detail .lv-criteria'); if (!box || box.dataset.lean) return;
    box.dataset.lean = '1';
    const on = $$('.lv-crit.on', box).length;
    let h = '<div class="lean-crit">';
    CRIT.forEach((c, i) => {
      h += '<span class="lean-crit-item' + (i < on ? ' on' : '') + '" data-tip="' + esc(HR.t('camp_criteria')) + '" data-tip-d="' + esc(HR.t(c.k)) + '" data-tip-tap="1">' +
        '<span class="lean-crit-star">' + HR.icon('star', '', true) + '</span>' +
        '<span class="lean-crit-ic" style="--ic:' + (HR.glyphColor ? HR.glyphColor(c.ic) : '') + '">' + (HR.glyph ? HR.glyph(c.ic) : HR.icon(c.ic)) + '</span>' +
        '<b>' + esc(HR.t(c.s)) + '</b></span>';
    });
    box.innerHTML = h + '</div>';
  }

  /* ---------------- ganchos ---------------- */
  const wrap = (obj, name, after) => {
    const orig = obj[name]; if (typeof orig !== 'function') return;
    obj[name] = function () { const r = orig.apply(this, arguments); try { after.call(this); } catch (_) { /* nada */ } return r; };
  };
  wrap(HR.UI, 'renderRegion', function () { lean($('#region-body')); });
  wrap(HR.UI, 'renderSystem', function () { lean($('#system-body')); });
  wrap(HR.UI, 'renderAbilities', function () { lean($('#abilities-body')); });
  wrap(HR.UI, 'openLevelDetail', function () { leanLevelDetail(); lean($('#item-detail')); });
  wrap(HR.UI, 'openSingularityDetail', function () { lean($('#item-detail')); });
  wrap(HR.UI, 'hudInit', function () { leanLevelEnd(); });

  Object.assign(HR.I18N.pt, { star_s_finish: '60 % dos arcos', star_s_perfects: '40 % perfeitos', star_s_flawless: 'Sem dano', help: 'Como funciona' });
  Object.assign(HR.I18N.en, { star_s_finish: '60% of rings', star_s_perfects: '40% perfects', star_s_flawless: 'No damage', help: 'How it works' });
  Object.assign(HR.I18N.es, { star_s_finish: '60 % de los aros', star_s_perfects: '40 % perfectos', star_s_flawless: 'Sin daño', help: 'Cómo funciona' });
})();
