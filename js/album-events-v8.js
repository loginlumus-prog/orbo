/* =====================================================================
   ORBO v8 — a aba "Eventos" do album.

   Os eventos eram a unica coisa do jogo que a pessoa vivia e nunca podia
   rever. Nao havia lista, nao havia nome, e nao havia como saber que
   existiam outros. Agora ha: os que ja aconteceram aparecem com o nome e
   a regra; os que faltam aparecem trancados, dizendo so em que galaxia
   comecam. E isso responde a pergunta que todo mundo faz na primeira
   hora: "isso aqui vai continuar assim?".

   Tudo por embrulho: js/ui-galaxy.js nao e tocado.
   ===================================================================== */
(function () {
  const U = HR.U, C = HR.CONFIG;
  if (!HR.UI || !C.EVENT_POOL) return;

  /* ---------------- o que ja foi visto ---------------- */
  function vistos() {
    const d = HR.Store.data;
    d.codex = d.codex || { rings: [], items: [] };
    if (!d.codex.events) d.codex.events = [];
    return d.codex.events;
  }
  function descobre(id) {
    const v = vistos();
    if (!id || v.indexOf(id) >= 0) return;
    v.push(id); HR.Store.save();
  }
  HR.EventCodex = { vistos, descobre };

  // marca no comeco do evento, nao no fim: quem morreu no meio tambem viu
  if (HR.Game && HR.Game.prototype && HR.Game.prototype.startEvent) {
    const orig = HR.Game.prototype.startEvent;
    HR.Game.prototype.startEvent = function (id) {
      const r = orig.apply(this, arguments);
      try { if (!this.demo) descobre(id); } catch (_) { /* nada */ }
      return r;
    };
  }

  /* ---------------- em que galaxia cada um estreia ---------------- */
  const galDe = id => {
    const gi = (C.EVENT_ESTREIA || {})[id];
    return gi === undefined ? 1 : Math.floor(gi / 100) + 1;
  };
  const ehRaro = id => !!(C.EVENT_RARO && C.EVENT_RARO.id === id);

  /* ---------------- a aba ---------------- */
  // o render base so aceita as abas que ele conhece e devolve a escolha para
  // "Conquistas" quando ve um nome estranho. Entao guardamos a escolha, deixamos
  // ele desenhar, e no fim repomos a aba e trocamos o corpo.
  const orig = HR.UI.renderAchievements;
  HR.UI.renderAchievements = function () {
    const quero = HR.UI.achTab;
    const r = orig.apply(this, arguments);
    if (quero === 'events') HR.UI.achTab = 'events';
    try { poeAba(); } catch (_) { /* nada */ }
    return r;
  };

  function poeAba() {
    const tabs = document.getElementById('ach-tabs'), body = document.getElementById('ach-body');
    if (!tabs || !body) return;

    // o botao da aba, uma vez so, logo depois de "Chefes"
    if (!tabs.querySelector('[data-tab="events"]')) {
      // logo depois de "Fragmentos": a fita rola, e uma aba que nasce no fim
      // dela nasce fora da tela — ninguem descobre o que nao ve
      const modelo = tabs.querySelector('[data-tab="frags"]') || tabs.querySelector('[data-tab="bosses"]') || tabs.lastElementChild;
      if (modelo) {
        const b = modelo.cloneNode(true);
        b.setAttribute('data-tab', 'events');
        b.innerHTML = HR.icon('zap') + '<span>' + HR.t('alb_events') + '</span>';
        b.classList.remove('active');
        modelo.parentNode.insertBefore(b, modelo.nextSibling);
        b.addEventListener('click', () => {
          HR.UI.achTab = 'events';
          if (HR.Audio && HR.Audio.sfx) HR.Audio.sfx('click');
          (HR.UI.renderAchievements || orig).call(HR.UI);
        });
      }
    }
    // qual esta aceso
    U.$$('[data-tab]', tabs).forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === HR.UI.achTab));
    if (HR.UI.achTab !== 'events') return;
    const meu = tabs.querySelector('[data-tab="events"]');
    if (meu && meu.scrollIntoView) { try { meu.scrollIntoView({ inline: 'center', block: 'nearest' }); } catch (_) { /* nada */ } }

    // a grade
    body.innerHTML = '';
    // o raro vive fora do baralho (CONFIG.EVENT_RARO), mas no album ele conta
    // como qualquer outro: some na lista, no fim, que e onde chama mais atencao
    const v = vistos();
    const RR = C.EVENT_RARO;
    const lista = C.EVENT_POOL.concat(RR && RR.id ? [RR.id] : []).filter((id, i, a) => C.EVENTS[id] && a.indexOf(id) === i);
    const achados = lista.filter(id => v.indexOf(id) >= 0).length;

    const topo = U.el('div', 'alb-top');
    topo.innerHTML = '<b>' + achados + '<small>/' + lista.length + '</small></b><span>' + esc(HR.t('alb_events_d')) + '</span>';
    body.appendChild(topo);

    const grid = U.el('div', 'alb-grid');
    lista.forEach(id => {
      const E = C.EVENTS[id], on = v.indexOf(id) >= 0;
      const card = U.el('div', 'alb-card ' + (on ? 'on' : 'off'));
      card.style.setProperty('--rc', on ? (E.color || '#4cf0ff') : '#9aa6c9');
      const ic = U.el('span', 'alb-ic'); ic.innerHTML = HR.icon(E.icon || 'zap');
      card.appendChild(ic);
      card.appendChild(U.el('b', 'alb-name', esc(on ? HR.t('ev_' + id) : '???')));
      card.appendChild(U.el('span', 'alb-desc', esc(on ? HR.t('ev_' + id + '_d')
        : ehRaro(id) ? HR.t('alb_ev_raro') : HR.t('alb_ev_oculto', { n: galDe(id) }))));
      card.appendChild(U.el('span', 'alb-tag', esc(on ? HR.t('alb_found')
        : ehRaro(id) ? HR.t('alb_ev_raro_tag') : HR.t('alb_ev_vem'))));
      if (ehRaro(id)) card.classList.add('alb-raro');
      grid.appendChild(card);
    });
    body.appendChild(grid);

    // o recado do fim: ainda vem mais
    const nota = U.el('div', 'alb-nota');
    nota.innerHTML = HR.icon('sparkle') + '<span>' + esc(HR.t('alb_ev_futuro')) + '</span>';
    body.appendChild(nota);
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
})();

Object.assign(HR.I18N.pt, {
  alb_ev_raro: 'Raro. Pode aparecer em qualquer galáxia.',
  alb_ev_raro_tag: 'Raro',
  alb_events: 'Eventos',
  alb_events_d: 'O que pode acontecer no meio de uma fase.',
  alb_ev_oculto: 'Aparece a partir da galáxia {n}.',
  alb_ev_vem: 'Ainda vem',
  alb_ev_futuro: 'Novos eventos entram a cada atualização.'
});
Object.assign(HR.I18N.en, {
  alb_ev_raro: 'Rare. It can show up in any galaxy.',
  alb_ev_raro_tag: 'Rare',
  alb_events: 'Events',
  alb_events_d: 'What can happen in the middle of a level.',
  alb_ev_oculto: 'Shows up from galaxy {n} on.',
  alb_ev_vem: 'Still coming',
  alb_ev_futuro: 'New events arrive with every update.'
});
Object.assign(HR.I18N.es, {
  alb_ev_raro: 'Raro. Puede aparecer en cualquier galaxia.',
  alb_ev_raro_tag: 'Raro',
  alb_events: 'Eventos',
  alb_events_d: 'Lo que puede pasar en medio de un nivel.',
  alb_ev_oculto: 'Aparece a partir de la galaxia {n}.',
  alb_ev_vem: 'Aún por venir',
  alb_ev_futuro: 'Cada actualización trae eventos nuevos.'
});
