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
  // chamado por drawBall já recortado no círculo, centrado em (0,0)
  HR.Render.PATTERNS = HR.Render.PATTERNS || {};
  HR.Render.PATTERNS.faisca = function (ctx, r, sk, t, rot) {
    const U = HR.U;
    const escuro = sk.dark || '#141024';
    const escuro2 = U.mix(escuro, '#3a2c70', 0.45);

    ctx.save();
    ctx.rotate((rot || 0) * 0.35 + Math.sin(t * 0.25) * 0.05);

    // a divisa: onda livre do topo ao fundo, com curvatura diferente dos dois lados
    const onda = Math.sin(t * 0.55) * 0.07;
    const c1x = r * (0.88 + onda), c1y = -r * 0.58;
    const c2x = -r * (0.74 - onda), c2y = r * 0.24;
    const divisa = () => {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, r * 0.06, r);
    };

    // metade escura
    const ge = ctx.createLinearGradient(-r * 0.4, -r, r, r);
    ge.addColorStop(0, escuro2); ge.addColorStop(1, escuro);
    ctx.fillStyle = ge;
    divisa();
    ctx.arc(0, 0, r * 1.02, Math.PI / 2, -Math.PI / 2, true);
    ctx.closePath(); ctx.fill();

    // o fio de luz da mistura
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = U.rgba(sk.glow || '#9fe8ff', 0.22); ctx.lineWidth = r * 0.15; divisa(); ctx.stroke();
    ctx.strokeStyle = U.rgba('#ffffff', 0.6); ctx.lineWidth = r * 0.03; divisa(); ctx.stroke();
    ctx.restore();

    // as duas marcas: borrões com halo, na barriga de cada metade
    const mancha = (mx, my, cor, aro, tam) => {
      const g = ctx.createRadialGradient(mx - r * 0.04, my - r * 0.05, 0, mx, my, r * tam);
      g.addColorStop(0, U.rgba(cor, 1));
      g.addColorStop(0.62, U.rgba(cor, 0.88));
      g.addColorStop(0.85, U.rgba(cor, 0.45));
      g.addColorStop(1, U.rgba(cor, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, r * tam, 0, TAU); ctx.fill();
      ctx.strokeStyle = U.rgba('#ffffff', aro); ctx.lineWidth = r * 0.016;
      ctx.beginPath(); ctx.arc(mx, my, r * tam * 0.62, 0, TAU); ctx.stroke();
    };
    mancha(r * 0.34, -r * 0.30, '#f4f8ff', 0.45, 0.185);
    mancha(-r * 0.31, r * 0.33, escuro, 0.16, 0.215);

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
  flavor_skin_faisca: 'Claro e escuro na mesma bola, e cada metade guardando um pedaço da outra.',
  faisca_ganhou: 'Faísca desbloqueada — por ter respondido'
});
Object.assign(HR.I18N.en, {
  skin_faisca: 'Spark',
  flavor_skin_faisca: 'Light and dark in one ball, each half keeping a piece of the other.',
  faisca_ganhou: 'Spark unlocked — for answering'
});
Object.assign(HR.I18N.es, {
  skin_faisca: 'Chispa',
  flavor_skin_faisca: 'Claro y oscuro en la misma bola, y cada mitad guardando un trozo de la otra.',
  faisca_ganhou: 'Chispa desbloqueada — por haber respondido'
});
