/* =====================================================================
   ORBO v7 — a skin de Faísca.

   É a bola que ela é: claro e escuro numa mistura só, divididos por uma onda
   livre, cada metade carregando uma marca da outra. Lembra o yin-yang, não é
   a cópia dele.

   Não se compra. Ganha-se **respondendo** a primeira pergunta da história.
   Quem pula todas as perguntas joga o jogo inteiro sem ela — é a diferença
   entre atravessar e prestar atenção.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const TAU = Math.PI * 2;

  /* ---------------- o desenho ---------------- */
  // chamado por drawBall ja recortado no circulo, centrado em (0,0).
  // O desenho e o mesmo HR.FragArt.helice dos cards: Faisca tem que ser a
  // mesma pessoa no mural e na mao de quem joga.
  HR.Render.PATTERNS = HR.Render.PATTERNS || {};
  HR.Render.PATTERNS.faisca = function (ctx, r, sk, t, rot) {
    const U = HR.U, A = HR.FragArt;
    if (!A || !A.helice) return;
    const claro = sk.base || '#f2f6ff', escuro = sk.dark || '#141024';
    const c = A.coresFaisca(0, {
      claro: claro,
      claro2: U.mix(claro, '#8fb0dd', 0.45),
      escuro: escuro,
      escuro2: U.mix(escuro, '#4a34a8', 0.5),
      brilho: sk.glow || '#9fe8ff',
      claroForte: '#ffffff',
      escuroForte: U.mix(escuro, '#000000', 0.45)
    });
    // a helice e pintada NA bola: ela vira com a bola, nao escorre por dentro
    ctx.save();
    ctx.rotate((rot || 0) * 0.3 + Math.sin(t * 0.25) * 0.04);
    A.helice(ctx, r, c, t, 0);
    ctx.restore();
  };

  /* ---------------- a skin ---------------- */
  if (!HR.CONFIG.SKINS.some(s => s.id === 'faisca')) {
    HR.CONFIG.SKINS.push({
      id: 'faisca', col: 'classic', rar: 'legendary', lvl: 0,
      cur: 'reward', price: 0, gems: 0,
      base: '#f2f6ff', dark: '#141024', glow: '#9fe8ff',
      pattern: 'faisca'
    });
  }

  /* ---------------- como se ganha ---------------- */
  // responder qualquer pergunta da história a destrava. Pular, não.
  function ganhar() {
    const d = HR.Store.data;
    if (!d.owned || !d.owned.skins || d.owned.skins.indexOf('faisca') >= 0) return false;
    d.owned.skins.push('faisca');
    HR.Store.save();
    if (HR.Analytics) HR.Analytics.log('skin_reward', { id: 'faisca' });
    if (HR.UI && HR.UI.toast) HR.UI.toast(HR.icon('ball') + ' ' + HR.t('faisca_ganhou'), 'good');
    if (HR.UI && HR.UI.refreshMenu) setTimeout(() => HR.UI.refreshMenu(), 60);
    return true;
  }
  HR.ganharFaisca = ganhar;

  if (HR.Story && HR.Story.take) {
    const orig = HR.Story.take.bind(HR.Story);
    HR.Story.take = function (id, ax) {
      const r = orig(id, ax);
      // ax só vem preenchido quando a pessoa escolheu uma resposta
      if (ax) { try { ganhar(); } catch (_) { /* nunca atrapalha a cena */ } }
      return r;
    };
  }
})();

Object.assign(HR.I18N.pt, {
  skin_faisca: 'Faísca',
  flavor_skin_faisca: 'Duas fitas enroscadas, e a cor trocando de lado a cada cruzamento.',
  faisca_ganhou: 'Faísca desbloqueada — por ter respondido'
});
Object.assign(HR.I18N.en, {
  skin_faisca: 'Spark',
  flavor_skin_faisca: 'Two strands wound together, the colour swapping sides at every crossing.',
  faisca_ganhou: 'Spark unlocked — for answering'
});
Object.assign(HR.I18N.es, {
  skin_faisca: 'Chispa',
  flavor_skin_faisca: 'Dos cintas enroscadas, y el color cambiando de lado en cada cruce.',
  faisca_ganhou: 'Chispa desbloqueada — por haber respondido'
});
