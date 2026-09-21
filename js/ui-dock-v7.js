/* =====================================================================
   ORBO v7.2 — o selo do rodape serve aos tres modos.

   Antes so o Infinito tinha selo: ao trocar de modo a peca sumia e o rodape
   inteiro descia. Agora o lugar e sempre o mesmo e so o conteudo muda:

     Infinito  a fenda (js/ui-rifts.js, que ja fazia isso)
     Galaxia   a galaxia onde a pessoa esta, a fase atual e quantos sistemas
               daquela galaxia ja cairam
     Treino    uma dica do jogo por vez; tocar troca a dica

   Sao a mesma peca com tres recheios: mesma altura, mesma forma, so a cor e o
   conteudo mudam. O texto nao anima — quem anima e a luz atras dele.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const $ = (s, r) => HR.U.$(s, r);
  const esc = s => HR.UI.esc(s);

  const after = (obj, nome, fn) => {
    const o = obj[nome]; if (typeof o !== 'function') return;
    obj[nome] = function () { const r = o.apply(this, arguments); try { fn.apply(this, arguments); } catch (_) { /* nada */ } return r; };
  };

  /* ---------------- as dicas ---------------- */
  const DICAS = 14;
  let dica = Math.floor(Math.random() * DICAS);

  /* ---------------- a peca ---------------- */
  function peca() {
    const seg = $('#mode-seg'); if (!seg) return null;
    let el = $('#dock-chip');
    if (!el) {
      el = HR.U.el('button', 'rift-chip dock-chip'); el.id = 'dock-chip'; el.type = 'button';
      el.addEventListener('click', e => { e.stopPropagation(); acao(); });
      const rc = $('#rift-chip');
      seg.parentNode.insertBefore(el, rc ? rc.nextSibling : seg.nextSibling);
    }
    return el;
  }

  function acao() {
    const m = (HR.Store.data && HR.Store.data.mode) || 'endless';
    if (m === 'campaign') { HR.Audio.sfx('click'); HR.UI.open('galaxy'); return; }
    if (m === 'practice') { HR.Audio.sfx('click'); dica = (dica + 1) % DICAS; pinta(); }
  }

  // a rosca: o numero dentro, e o resto o arco conta
  function rosca(feitos, total, cls) {
    const raio = 15.5, volta = 2 * Math.PI * raio;
    const arco = (volta * Math.max(0, Math.min(1, feitos / total))).toFixed(2);
    return '<span class="rc-prog' + (String(feitos).length > 1 ? ' dois' : '') + (cls ? ' ' + cls : '') + '">' +
      '<svg class="rc-rosca" viewBox="0 0 36 36" aria-hidden="true">' +
        '<circle class="t" cx="18" cy="18" r="' + raio + '"/>' +
        '<circle class="a" cx="18" cy="18" r="' + raio + '" stroke-dasharray="' + arco + ' ' + volta.toFixed(2) + '"/>' +
      '</svg><b>' + feitos + '</b></span>';
  }

  const orbe = () => '<span class="rc-orbe"><i class="rc-anel"></i><i class="rc-nucleo"></i><i class="rc-sat"></i></span>';

  function pinta() {
    const el = peca(); if (!el) return;
    const m = (HR.Store.data && HR.Store.data.mode) || 'endless';
    if (m === 'endless') { el.hidden = true; return; }
    el.hidden = false;
    el.classList.toggle('dc-gal', m === 'campaign');
    el.classList.toggle('dc-dica', m === 'practice');

    if (m === 'campaign') {
      const C = HR.Campaign, lv = C.currentLevel();
      const ri = lv && lv.ri != null ? lv.ri : (C.currentRegion ? C.currentRegion() : 0);
      const R = HR.REGIONS[ri] || HR.REGIONS[0];
      let feitos = 0;
      for (let si = 0; si < 10; si++) if (C.systemBossBeaten && C.systemBossBeaten(ri, si)) feitos++;
      el.style.setProperty('--rc', R.accent);
      el.innerHTML = '<i class="rc-aura"></i>' + orbe() +
        '<span class="rc-meio">' +
          '<b class="rc-nome">' + esc(HR.t('gal_' + R.gal)) + '</b>' +
          '<span class="rc-ouro">' + HR.icon('flag') + '<em>' + esc(HR.t('level_n', { n: lv.id })) + '</em></span>' +
        '</span>' +
        rosca(feitos, 10) +
        '<span class="rc-go">' + HR.icon('chevronRight') + '</span>';
      el.setAttribute('aria-label', HR.t('gal_' + R.gal) + ' · ' + HR.t('level_n', { n: lv.id }));
      el.setAttribute('data-tip', HR.t('gal_' + R.gal));
      el.setAttribute('data-tip-d', HR.t('dock_gal_d'));
      return;
    }

    // treino: uma dica por vez. Sem ficha e sem rotulo — a lampada e o botao
    // de trocar ja dizem o que e, e a dica ganha as duas linhas inteiras.
    el.style.setProperty('--rc', '#7cff6b');
    el.innerHTML = '<i class="rc-aura"></i>' + orbe() +
      '<span class="rc-meio rc-meio-dica">' +
        '<b class="rc-nome rc-dica-txt">' + esc(HR.t('dica_' + dica)) + '</b>' +
      '</span>' +
      '<span class="rc-prog rc-troca">' + HR.icon('refresh') + '</span>';
    el.setAttribute('aria-label', HR.t('dock_dica') + ': ' + HR.t('dica_' + dica));
    el.setAttribute('data-tip', HR.t('dock_dica'));
    el.setAttribute('data-tip-d', HR.t('dock_dica_d'));
  }

  // a dica NAO troca sozinha: texto que muda sem ninguem pedir e ruido.
  // Ela e sorteada uma vez ao abrir o jogo e so anda quando a pessoa toca.
  after(HR.UI, 'refreshMode', pinta);
  after(HR.UI, 'refreshMenu', pinta);
  setTimeout(() => { try { pinta(); } catch (_) { /* nada */ } }, 600);
})();

Object.assign(HR.I18N.pt, {
  dock_dica: 'DICA', dock_dica_d: 'Toque para ver outra.',
  dock_gal_d: 'Abrir o mapa da galáxia.',
  dica_0: 'Passe pelo meio do arco: perfeito vale mais e enche o jato.',
  dica_1: 'O jato some os arcos e abre três faixas. A do meio é a mais segura.',
  dica_2: 'Use o jato de novo antes de acabar: empilha até cinco e dura muito mais.',
  dica_3: 'No corredor, W e S trocam de faixa. A e D, quando a fase corre de lado.',
  dica_4: 'A faixa que brilha é onde vêm os power-ups. Siga o rastro dourado.',
  dica_5: 'A Égide salva uma batida. Dá para sentir quando ela gasta.',
  dica_6: 'Fendas mais fundas rendem mais ouro. A dificuldade é a mesma.',
  dica_7: 'Três estrelas na fase pedem perfeitos, não só chegar ao fim.',
  dica_8: 'Responder às perguntas da história muda o final. Pular também.',
  dica_9: 'Os fragmentos voltam jogando. Alguns só por segredo.',
  dica_10: 'No Treino não se morre: é o lugar de aprender as direções.',
  dica_11: 'O diário dá moeda todo dia. Voltar seguido rende mais.',
  dica_12: 'Se travar, baixe a qualidade nos ajustes. O jogo continua inteiro.',
  dica_13: 'Toque e segure em quase tudo: o jogo explica o que é.'
});
Object.assign(HR.I18N.en, {
  dock_dica: 'TIP', dock_dica_d: 'Tap to see another.',
  dock_gal_d: 'Open the galaxy map.',
  dica_0: 'Go through the middle of the ring: a perfect is worth more and fills the jet.',
  dica_1: 'The jet clears the rings and opens three lanes. The middle one is safest.',
  dica_2: 'Use the jet again before it ends: it stacks up to five and lasts far longer.',
  dica_3: 'In the corridor, W and S change lanes. A and D when the level runs sideways.',
  dica_4: 'The glowing lane is where the power-ups come from. Follow the golden trail.',
  dica_5: 'The Aegis saves one hit. You can feel it when it is spent.',
  dica_6: 'Deeper rifts pay more gold. The difficulty is the same.',
  dica_7: 'Three stars ask for perfects, not just for reaching the end.',
  dica_8: 'Answering the story questions changes the ending. So does skipping.',
  dica_9: 'Fragments come back by playing. A few only by secret.',
  dica_10: 'Nobody dies in Practice: it is the place to learn the directions.',
  dica_11: 'The daily gives coins every day. Coming back often pays more.',
  dica_12: 'If it stutters, lower the quality in settings. The game stays whole.',
  dica_13: 'Press and hold almost anything: the game explains what it is.'
});
Object.assign(HR.I18N.es, {
  dock_dica: 'CONSEJO', dock_dica_d: 'Toca para ver otro.',
  dock_gal_d: 'Abrir el mapa de la galaxia.',
  dica_0: 'Pasa por el medio del aro: el perfecto vale más y llena el jet.',
  dica_1: 'El jet quita los aros y abre tres carriles. El del medio es el más seguro.',
  dica_2: 'Usa el jet otra vez antes de que acabe: se apila hasta cinco y dura mucho más.',
  dica_3: 'En el corredor, W y S cambian de carril. A y D cuando la fase corre de lado.',
  dica_4: 'El carril que brilla es de donde vienen los power-ups. Sigue el rastro dorado.',
  dica_5: 'La Égida salva un golpe. Se nota cuando se gasta.',
  dica_6: 'Las grietas más hondas dan más oro. La dificultad es la misma.',
  dica_7: 'Tres estrellas piden perfectos, no solo llegar al final.',
  dica_8: 'Responder las preguntas de la historia cambia el final. Saltarlas también.',
  dica_9: 'Los fragmentos vuelven jugando. Algunos solo por secreto.',
  dica_10: 'En Práctica no se muere: es el lugar para aprender las direcciones.',
  dica_11: 'El diario da monedas cada día. Volver seguido rinde más.',
  dica_12: 'Si se traba, baja la calidad en ajustes. El juego sigue entero.',
  dica_13: 'Mantén pulsado casi todo: el juego explica qué es.'
});
