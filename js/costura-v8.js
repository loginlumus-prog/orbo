/* =====================================================================
   ORBO v8 — A Costura.

   O terceiro segredo do jogo, e o que faltava: sem ele o final Muitas
   Maos nao tem como acontecer (ver docs/FINAIS.md).

   Uma fase por galaxia, escondida, sem perigo nenhum: os aneis ficam
   enormes e lentos, e o que importa e um fio que atravessa a tela em
   curva. Seguir o fio sem sair dele por 20 segundos abre o fragmento
   "A costura", a bandeira e um bolo de moedas.

   Nada aqui interrompe quem nao quer: quem passa reto joga a fase como
   qualquer outra e ganha as estrelas do mesmo jeito. O fio nao pede
   nada, nao avisa e nao cobra. Ele so esta la.

   Tudo por embrulho, no padrao de js/story-nest.js: nenhum arquivo do
   jogo e alterado.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const DUR = 20;            // segundos no fio para fechar a costura
  const TOL = 0.085;         // tolerancia, em fracao da largura util
  const SISTEMA = 7, FASE = 7;   // a fase escondida, igual em toda galaxia

  const idDe = ri => (ri + 1) + '-' + SISTEMA + '-' + FASE;
  const ehCostura = id => {
    if (!id) return false;
    const p = String(id).split('-');
    return p.length === 3 && +p[1] === SISTEMA && +p[2] === FASE;
  };

  /* ---------------- a conquista ---------------- */
  if (HR.ACHIEVEMENTS && !HR.ACHIEVEMENTS.some(a => a.id === 'costura')) {
    HR.ACHIEVEMENTS.push({ id: 'costura', cat: 'secret', hidden: true, stat: 'costura', target: 1, gems: 90, icon: 'link' });
  }
  if (HR.Achievements && typeof HR.Achievements.stats5 === 'function') {
    const orig = HR.Achievements.stats5;
    HR.Achievements.stats5 = function () {
      const out = orig.apply(this, arguments);
      const f = (HR.Store.data.story && HR.Store.data.story.flags) || {};
      out.costura = f.costura ? 1 : 0;
      return out;
    };
  }

  /* ---------------- a fase: larga, lenta, sem perigo ---------------- */
  function molda(id) {
    const lv = HR.Campaign && HR.Campaign.level ? HR.Campaign.level(id) : null;
    if (!lv || lv.costura) return lv;
    lv.costura = true;
    lv.rings = 14;
    lv.v0 = 430; lv.speed = Math.round(lv.v0 / 265 * 100) / 100; lv.ramp = 0.04; lv.tb0 = 1.25;
    lv.events = []; lv.mods = []; lv.dirs = ['right']; lv.dirEvery = 99; lv.waves = 0; lv.boss = null;
    lv.params = Object.assign({}, lv.params, {
      radius: (lv.params && lv.params.radius || 100) * 1.75, tbMul: (lv.params && lv.params.tbMul || 1) * 1.4,
      osc: 0, oscF: 0, rot: 0, rotF: 0, dbl: 0, burst: 0, shrink: 0, tiltVar: 0, fog: 0, dark: 0
    });
    return lv;
  }

  /* ---------------- o fio ----------------
     Uma curva que atravessa a tela no eixo da viagem. Duas ondas somadas,
     para nao virar um seno bobo, e devagar o bastante para ser seguida. */
  function fioEm(g, u) {
    const Lv = g.Lv || g.H, t = g.time;
    const a = Lv * 0.30, b = Lv * 0.11;
    return Lv / 2
      + Math.sin(u * 0.0062 + t * 0.55) * a
      + Math.sin(u * 0.0145 - t * 0.31) * b;
  }

  function estado(g) { return g._cost || (g._cost = { on: 0, melhor: 0, feito: false, brilho: 0 }); }

  /* ---------------- acompanhar ---------------- */
  const G = HR.Game && HR.Game.prototype;
  if (!G) return;

  const origUpdate = G.update;
  G.update = function (dt) {
    origUpdate.call(this, dt);
    const run = this.run;
    if (!run || !run.level || !run.level.costura || this.state !== 'playing' || this.demo) return;
    const s = estado(this), b = this.ball;
    const alvo = fioEm(this, b.x), tol = (this.Lv || this.H) * TOL;
    const perto = Math.abs(b.y - alvo) <= tol;
    if (perto) {
      s.on += dt;
      if (s.on > s.melhor) s.melhor = s.on;
      s.brilho = Math.min(1, s.brilho + dt * 2.2);
      if (s.on >= DUR && !s.feito) { s.feito = true; fecha(this); }
    } else {
      s.on = 0;
      s.brilho = Math.max(0, s.brilho - dt * 1.6);
    }
  };

  function fecha(g) {
    if (HR.Story && HR.Story.flag) HR.Story.flag('costura', true);
    if (HR.Frag && HR.Frag.check) HR.Frag.check('segredo', 'costura');
    const moedas = 400 + 120 * (g.run.level.ri || 0);
    if (HR.Economy && HR.Economy.addCoins) HR.Economy.addCoins(moedas, 'costura');
    if (HR.Audio && HR.Audio.sfx) HR.Audio.sfx('reward');
    if (HR.UI && HR.UI.toast) HR.UI.toast(HR.icon('link') + ' ' + HR.t('costura_feita', { n: moedas }), 'good');
    setTimeout(() => { if (HR.UI.trophyCheck) HR.UI.trophyCheck(); }, 400);
  }

  /* ---------------- desenhar o fio ---------------- */
  const origRender = G.render;
  G.render = function () {
    origRender.call(this);
    const run = this.run;
    if (!run || !run.level || !run.level.costura) return;
    if (this.state !== 'playing' && this.state !== 'ready') return;
    const ctx = this.ctx, Lu = this.Lu || this.W, s = estado(this), u = HR.U;
    const lite = HR.Perf && HR.Perf.level <= 1;
    const passo = lite ? 46 : 22;

    ctx.save();
    ctx.translate(this.frame.ox, this.frame.oy);
    ctx.rotate(this.frame.angle);

    // o fio: uma linha so, mais acesa enquanto a bola esta nela
    const aceso = 0.28 + s.brilho * 0.5;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let x = -40; x <= Lu + 80; x += passo) {
      const y = fioEm(this, x);
      x === -40 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    if (!lite) { ctx.strokeStyle = u.rgba('#7cff6b', aceso * 0.22); ctx.lineWidth = 9; ctx.stroke(); }
    ctx.strokeStyle = u.rgba('#9dff8a', aceso); ctx.lineWidth = 2.2; ctx.stroke();

    // o no que corre no fio, na altura da bola: e ele que diz se voce esta nela
    const nx = this.ball.x, ny = fioEm(this, nx);
    ctx.fillStyle = u.rgba('#d8ffcf', 0.35 + s.brilho * 0.5);
    ctx.beginPath(); ctx.arc(nx, ny, 3.4 + s.brilho * 2.2, 0, Math.PI * 2); ctx.fill();

    // quanto falta: um traco curto que enche no proprio fio, atras da bola
    if (s.on > 0.4 && !s.feito) {
      const k = Math.min(1, s.on / DUR), larg = (this.Lv || this.H) * 0.20;
      ctx.beginPath();
      for (let x = nx - larg * k; x <= nx; x += 8) { const y = fioEm(this, x); x === nx - larg * k ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.strokeStyle = u.rgba('#ffffff', 0.5); ctx.lineWidth = 3.4; ctx.stroke();
    }
    ctx.restore();
  };

  /* ---------------- moldar antes de entrar ---------------- */
  const origStart = HR.UI.startLevel;
  HR.UI.startLevel = function (id) {
    if (ehCostura(id)) molda(id);
    const r = origStart.apply(this, arguments);
    if (ehCostura(id)) {
      try {
        const g = HR.game || (HR.UI && HR.UI.game);
        if (g) { g._cost = null; if (g.run) { g.run.shields = Math.max(g.run.shields || 0, 5); g.run.lives = Math.max(g.run.lives || 1, 3); } }
      } catch (_) { /* nada */ }
    }
    return r;
  };

  // molda as dez de uma vez, para a ficha da fase ja mostrar o que e
  if (HR.Campaign && HR.REGIONS) HR.REGIONS.forEach((_, ri) => molda(idDe(ri)));

  HR.Costura = { DUR, idDe, ehCostura, fioEm };
})();

Object.assign(HR.I18N.pt, {
  a_costura: 'A costura', a_d_costura: 'Siga o fio sem sair dele.',
  costura_feita: 'A costura fechou · +{n}'
});
Object.assign(HR.I18N.en, {
  a_costura: 'The seam', a_d_costura: 'Follow the thread without leaving it.',
  costura_feita: 'The seam closed · +{n}'
});
Object.assign(HR.I18N.es, {
  a_costura: 'La costura', a_d_costura: 'Sigue el hilo sin salir de él.',
  costura_feita: 'La costura se cerró · +{n}'
});
