/* =====================================================================
   ORBO v9 — Colecao e Conquistas viram duas telas.

   Os dois botoes do menu abriam o mesmo "Album", com todas as abas
   juntas: trofeus do lado de bolas, titulos do lado de chefes. Quem
   tocava em Conquistas caia numa fita de dez abas e tinha de achar as
   suas. Agora cada botao abre so o que e dele:

     Conquistas   Trofeus, Titulos
     Colecao      Fragmentos, Eventos, Bolas, Rastros, Temas, Itens,
                  Chefes, Arcos, Pickups

   E a mesma tela por baixo (as abas continuam morando onde moravam);
   aqui so se escolhe quais aparecem, o titulo e a conta do alto.
   ===================================================================== */
(function () {
  if (!HR.UI || !HR.UI.renderAchievements) return;
  const CONQ = ['ach', 'titles'];
  const ehConq = t => CONQ.indexOf(t) >= 0;
  HR.UI.albModo = 'conq';

  // o modo sai de quem abriu: o botao de Conquistas e o anel de nivel pedem
  // trofeus; o de Colecao (e o aviso de fragmento novo) pedem uma aba de colecao
  const origOpen = HR.UI.open;
  HR.UI.open = function (panel, arg) {
    if (panel !== 'achievements') return origOpen.apply(this, arguments);
    // se a tela nao abrir (ja aberta, ou fora do menu), nada muda
    const antes = { modo: HR.UI.albModo, tab: HR.UI.achTab }, tinha = (this.stack || []).indexOf(panel) >= 0;
    if (!arg) arg = 'ach';
    HR.UI.albModo = ehConq(arg) ? 'conq' : 'col';
    HR.UI.achTab = arg;
    const r = origOpen.call(this, panel, arg);
    if (tinha || (this.stack || []).indexOf(panel) < 0) { HR.UI.albModo = antes.modo; HR.UI.achTab = antes.tab; }
    return r;
  };

  const origRender = HR.UI.renderAchievements;
  HR.UI.renderAchievements = function () {
    // uma aba do outro lado nao abre aqui: volta para a primeira do modo
    const modo = HR.UI.albModo;
    if (modo === 'conq' && !ehConq(HR.UI.achTab)) HR.UI.achTab = 'ach';
    if (modo === 'col' && ehConq(HR.UI.achTab)) HR.UI.achTab = 'frags';
    const r = origRender.apply(this, arguments);
    try { ajusta(modo); } catch (e) { console.warn('album', e); }
    return r;
  };

  function ajusta(modo) {
    const tela = document.getElementById('screen-achievements'); if (!tela) return;
    tela.classList.toggle('alb-conq', modo === 'conq');
    tela.classList.toggle('alb-col', modo === 'col');
    tela.querySelectorAll('#ach-tabs [data-tab]').forEach(b => {
      b.style.display = (ehConq(b.getAttribute('data-tab')) === (modo === 'conq')) ? '' : 'none';
    });
    const tit = tela.querySelector('.panel-head .ribbon span');
    if (tit) { tit.removeAttribute('data-i18n'); tit.textContent = HR.t(modo === 'conq' ? 'alb_conq' : 'alb_col'); }
    // a conta do alto: so o que e desta tela
    const d = HR.Store.data, a = HR.Achievements.counts();
    const titA = HR.CONFIG.LEVEL_TITLES.filter(([lv]) => d.level >= lv).length + (d.titles || []).length;
    const titB = HR.CONFIG.LEVEL_TITLES.length + (HR.TITLES || []).length;
    const nota = tela.querySelector('[data-bind="achCount"]');
    if (!nota) return;
    if (modo === 'conq') nota.textContent = (a.a + titA) + '/' + (a.b + titB);
    else {
      // o total do album menos trofeus e titulos
      const m = /(\d+)\s*\/\s*(\d+)/.exec(nota.textContent || '');
      if (m) nota.textContent = Math.max(0, +m[1] - a.a - titA) + '/' + Math.max(0, +m[2] - a.b - titB);
    }
  }
})();

Object.assign(HR.I18N.pt, { alb_conq: 'Conquistas', alb_col: 'Coleção' });
Object.assign(HR.I18N.en, { alb_conq: 'Achievements', alb_col: 'Collection' });
Object.assign(HR.I18N.es, { alb_conq: 'Logros', alb_col: 'Colección' });
