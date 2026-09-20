/* =====================================================================
   ORBO v6.2: a parte visível dos quatro níveis de gráfico.
   - nota embaixo do seletor dizendo o que cada nível faz;
   - barra que aparece quando o jogo trava no modo manual, oferecendo baixar;
   - o vigia é chamado a cada quadro pelo laço do jogo (HR.Perf.sample).
   ===================================================================== */
(function () {
  const $ = (s, r) => HR.U.$(s, r);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------- nota nos ajustes ---------------- */
  HR.UI.renderQualityNote = function () {
    const row = $('.setting-quality'); if (!row) return;
    let note = $('.quality-note', row);
    if (!note) { note = HR.U.el('p', 'quality-note'); row.appendChild(note); }
    const lv = HR.Perf.level, auto = HR.Perf.mode === 'auto';
    note.innerHTML = '<b>' + esc(HR.t('quality_l' + lv)) + '</b> · ' + esc(HR.t('quality_s' + lv)) +
      (auto ? '<br>' + esc(HR.t('quality_now', { n: HR.t('quality_l' + lv) })) : '');
  };

  /* ---------------- barra de sugestão ---------------- */
  let bar = null, hideT = null;
  HR.UI.perfSuggest = function (toLevel) {
    const lv = Math.max(0, Math.min(3, toLevel));
    if (!bar || !bar.isConnected) {
      bar = HR.U.el('div', 'perf-ask');
      bar.innerHTML = HR.icon('sliders') + '<p></p><button type="button" class="yes"></button><button type="button" class="no"></button>';
      (document.getElementById('app') || document.body).appendChild(bar);
    }
    $('p', bar).textContent = HR.t('quality_ask', { n: HR.t('quality_l' + lv) });
    const yes = $('.yes', bar), no = $('.no', bar);
    yes.textContent = HR.t('quality_ask_yes'); no.textContent = HR.t('quality_ask_no');
    yes.onclick = e => {
      e.stopPropagation();
      HR.Audio.sfx('click');
      HR.Perf.setMode(lv === 3 ? 'ultra' : lv === 2 ? 'high' : lv === 1 ? 'normal' : 'low', HR.game);
      if (HR.UI.renderQualityNote) HR.UI.renderQualityNote();
      HR.UI.toast(HR.icon('check') + ' ' + HR.t('quality_dropped', { n: HR.t('quality_l' + lv) }), 'good');
      close();
    };
    no.onclick = e => { e.stopPropagation(); HR.Audio.sfx('click'); close(); };
    bar.classList.add('show');
    clearTimeout(hideT); hideT = setTimeout(close, 12000);
  };
  function close() { if (bar) bar.classList.remove('show'); clearTimeout(hideT); }

  // some quando a partida acaba (o aviso é sobre a partida, não sobre o menu)
  const after = (obj, name, fn) => {
    const orig = obj[name]; if (typeof orig !== 'function') return;
    obj[name] = function () { const r = orig.apply(this, arguments); try { fn.apply(this, arguments); } catch (_) { /* nada */ } return r; };
  };
  after(HR.UI, 'setBase', function (n) { if (n !== 'hud') close(); });
})();
