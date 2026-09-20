/* =====================================================================
   ORBO v5.3: poderes com começo, meio e fim bem sinalizados.
   Acompanha os poderes com tempo (estrela, fantasma, cometa, piloto automático, Égide, fênix, ímã…):
   - começo: onda de luz na bola e aviso grande no HUD;
   - durante: anel de tempo em volta da bola nos que protegem ou guiam;
   - fim: contagem 3-2-1 em cima da bola, aviso "acabou" e câmera lenta curta nos que protegem/guiam.
   Emite 'powerfx' { phase: 'start' | 'ending' | 'end', k, def, T }.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  // ring: anel de tempo na bola · warn: acabar é perigoso (câmera lenta + aviso forte) · ringLast: só mostra o anel nos últimos N s
  const FLAGS = {
    starT: { ring: true, warn: true }, ghostT: { ring: true, warn: true }, cometT: { ring: true, warn: true },
    autoT: { ring: true, warn: true }, aegisT: { ring: true, warn: true, ringLast: 6 }, phoenixT: { ring: true }
  };
  const MIN_START = 0.9;  // pulsos curtos (fluxo, jato e cometa ligando o piloto) não contam como poder
  const ENDING_AT = 2.5;  // a partir daqui o poder está "acabando"
  let DEFS = null;
  // nomes, ícones e cores vêm da lista de chips do HUD (HR.UI.POWERS); o jato conta arcos, não segundos
  HR.powerDefs = function () {
    if (DEFS && DEFS.length) return DEFS;
    const P = (HR.UI && HR.UI.POWERS) || [];
    DEFS = P.filter(p => p[0] !== 'jetLeft').map(p => Object.assign({ k: p[0], icon: p[1], color: p[2], name: p[3] }, FLAGS[p[0]] || {}));
    return DEFS;
  };

  const G = HR.Game.prototype, origUpdateAbilities = G.updateAbilities;
  G.updateAbilities = function (dt) {
    origUpdateAbilities.call(this, dt);
    this.trackPowers();
  };

  G.trackPowers = function () {
    const run = this.run; if (!run || this.demo) return;
    const pw = run.pw || (run.pw = {});
    HR.powerDefs().forEach(d => {
      const v = run[d.k] || 0, s = pw[d.k] || (pw[d.k] = { on: false, max: 0, last: 0, warned: false });
      if (d.k === 'autoT' && (run.anomalyActive || run.jetLeft > 0)) { if (s.on && v <= 0) s.on = false; s.last = v; return; }
      if (!s.on) {
        if (v >= MIN_START) { s.on = true; s.max = v; s.warned = false; this.powerStart(d, v); }
      } else if (v <= 0) {
        s.on = false; this.powerEnd(d);
      } else {
        // renovou (pegou outra estrela, usou de novo): barra volta cheia e o aviso de fim pode tocar outra vez
        if (v > s.last + 0.5) { s.max = v; s.warned = false; this.powerStart(d, v, true); }
        if (!s.warned && v <= ENDING_AT && s.max > ENDING_AT + 0.5) { s.warned = true; this.emit('powerfx', { phase: 'ending', k: d.k, def: d, T: v }); }
      }
      s.last = v;
    });
  };

  G.powerStart = function (d, v, renewed) {
    const b = this.ball;
    this.particles.burst({ x: b.x, y: b.y, n: 1, speed: 0, color: d.color, size: 72, life: 0.7, type: 'wave' });
    this.particles.burst({ x: b.x, y: b.y, n: 18, speed: 380, color: [d.color, '#ffffff'], size: 5, life: 0.6, type: 'spark' });
    this.emit('powerfx', { phase: 'start', k: d.k, def: d, T: v, renewed: !!renewed });
  };

  G.powerEnd = function (d) {
    const b = this.ball;
    this.particles.burst({ x: b.x, y: b.y, n: 1, speed: 0, color: '#ffffff', size: 46, life: 0.5, type: 'wave' });
    this.particles.burst({ x: b.x, y: b.y, n: 14, speed: 220, color: [d.color, '#8d97b3'], size: 4, life: 0.5, type: 'spark' });
    if (d.warn && this.state === 'playing') { this.adapt('powerEnd'); HR.Audio.sfx('whoosh'); HR.U.vibrate([30, 40, 30]); }
    this.emit('powerfx', { phase: 'end', k: d.k, def: d });
  };

  // anel de tempo em volta da bola (o que acaba primeiro fica por dentro) e contagem 3-2-1 em cima dela
  G.drawPowerTimers = function (ctx, t, rot) {
    const run = this.run, b = this.ball;
    if (!run || !run.pw || this.demo || !(b.alpha > 0)) return;
    const list = [];
    HR.powerDefs().forEach(d => {
      if (!d.ring) return;
      const s = run.pw[d.k], v = run[d.k] || 0;
      if (!s || !s.on || v <= 0) return;
      if (d.k === 'autoT' && (run.anomalyActive || run.jetLeft > 0)) return;
      if (d.ringLast && v > d.ringLast) return;
      list.push({ d, v, f: Math.max(0, Math.min(1, v / (s.max || v))) });
    });
    if (!list.length) return;
    list.sort((a, c) => a.v - c.v);
    const U = HR.U, br = this.ballR ? this.ballR() : b.r, glow = !HR.Perf || !HR.Perf.glow || HR.Perf.glow();
    ctx.save();
    ctx.translate(b.x, b.y + Math.sin(t * 3) * 2); ctx.rotate(-(rot || 0)); ctx.lineCap = 'round';
    list.slice(0, 3).forEach((it, i) => {
      const R = br * 2.55 + i * 8, ending = it.v <= ENDING_AT;
      // pisca cada vez mais rápido perto do fim
      const blink = ending ? (Math.sin(t * (12 + (ENDING_AT - it.v) * 10)) > -0.3 ? 1 : 0.3) : 1;
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(3,5,12,0.35)'; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.2832); ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = U.rgba(it.d.color, 0.2); ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.2832); ctx.stroke();
      ctx.lineWidth = ending ? 4 : 3.2;
      ctx.strokeStyle = U.rgba(ending ? '#ffffff' : it.d.color, blink);
      if (glow) { ctx.shadowColor = it.d.color; ctx.shadowBlur = ending ? 14 : 7; }
      ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + it.f * 6.2832); ctx.stroke();
      ctx.shadowBlur = 0;
    });
    const urgent = list.find(it => it.d.warn && it.v <= 3);
    if (urgent) {
      const n = Math.ceil(urgent.v), fr = n - urgent.v;
      const pop = fr < 0.18 ? 1 + (0.18 - fr) / 0.18 * 0.6 : 1, al = fr > 0.8 ? (1 - fr) / 0.2 : 1;
      // bola no alto da tela: número vai para baixo dela, para não bater nos avisos do HUD
      const m = ctx.getTransform ? ctx.getTransform() : null, high = m && ctx.canvas && m.f < ctx.canvas.height * 0.4;
      const y = (high ? 1 : -1) * (br * 2.55 + 30);
      ctx.font = '900 ' + Math.round(28 * pop) + 'px Rubik, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = U.rgba('#05070f', 0.8 * al); ctx.strokeText(String(n), 0, y);
      ctx.fillStyle = U.rgba(urgent.d.color, al); ctx.fillText(String(n), 0, y);
    }
    ctx.restore();
  };
})();
