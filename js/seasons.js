/* =====================================================================
   Temporadas (v4): janelas por data (mês-dia) em CONFIG.SEASONS. Cada uma tem cor,
   enfeite no menu (neve, morcegos, confete, balões, bolhas), itens exclusivos
   (cur normal + season: 'id' nos catálogos) e uma missão diária extra.
   HR.SEASON_FORCE = 'natal' força uma temporada para teste.
   ===================================================================== */
window.HR = window.HR || {};

HR.Seasons = {
  key(d) { d = d || new Date(); return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
  inWindow(S, k) { return S.from <= S.to ? (k >= S.from && k <= S.to) : (k >= S.from || k <= S.to); },
  current() {
    const list = HR.CONFIG.SEASONS || [];
    if (HR.SEASON_FORCE) return list.find(s => s.id === HR.SEASON_FORCE) || null;
    const k = this.key();
    return list.find(s => this.inWindow(s, k)) || null;
  },
  isActive(id) { const c = this.current(); return !!c && c.id === id; },
  endLabel() {
    const c = this.current(); if (!c) return '';
    const [m, d] = c.to.split('-');
    return HR.lang === 'en' ? m + '/' + d : d + '/' + m;
  },
  // enfeites do menu/fundo: partículas leves por tipo (nunca no meio da partida)
  sprinkle(ctx, W, H, t, kind) {
    if (!this._sp || this._sp.kind !== kind || this._sp.W !== W) { this._sp = { kind, W, list: [] }; for (let i = 0; i < 26; i++) this._sp.list.push({ x: Math.random(), y: Math.random(), s: 0.6 + Math.random(), p: Math.random() * 6.28, v: 0.5 + Math.random() }); }
    const L = this._sp.list, U = HR.U;
    ctx.save();
    L.forEach((o, i) => {
      const wrap = (v, size) => ((v % size) + size) % size;
      if (kind === 'snow') {
        const x = wrap(o.x * W + Math.sin(t * 0.8 + o.p) * 18, W), y = wrap(o.y * H + t * 22 * o.v, H);
        ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + o.s * 0.3).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(x, y, 1.2 + o.s * 1.6, 0, 6.283); ctx.fill();
      } else if (kind === 'bats') {
        if (i % 3) return;
        const x = wrap(o.x * W - t * 30 * o.v, W), y = o.y * H * 0.5 + Math.sin(t * 1.5 + o.p) * 14, s = 5 + o.s * 4, fl = Math.sin(t * 14 + o.p) * 0.5;
        ctx.fillStyle = 'rgba(30,18,50,0.85)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - s, y - s * (0.8 + fl), x - s * 1.8, y); ctx.quadraticCurveTo(x - s, y + s * 0.3, x, y + s * 0.2); ctx.quadraticCurveTo(x + s, y + s * 0.3, x + s * 1.8, y); ctx.quadraticCurveTo(x + s, y - s * (0.8 + fl), x, y); ctx.fill();
      } else if (kind === 'confetti') {
        const cols = ['#ff5e7e', '#ffcf4a', '#35e29a', '#4cf0ff', '#8f6bff'];
        const x = wrap(o.x * W + Math.sin(t * 1.2 + o.p) * 24, W), y = wrap(o.y * H + t * 34 * o.v, H);
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * 3 + o.p); ctx.fillStyle = U.rgba(cols[i % 5], 0.8); ctx.fillRect(-4, -2.5, 8, 5); ctx.restore();
      } else if (kind === 'balloons') {
        if (i % 2) return;
        const x = wrap(o.x * W + Math.sin(t * 0.6 + o.p) * 12, W), y = wrap(o.y * H - t * 16 * o.v, H), s = 7 + o.s * 5;
        ctx.fillStyle = U.rgba(['#ffcf4a', '#ff5e7e', '#4cf0ff', '#35e29a'][i % 4], 0.8); ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.8, y); ctx.lineTo(x, y + s * 1.2); ctx.lineTo(x - s * 0.8, y); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y + s * 1.2); ctx.lineTo(x, y + s * 2.2); ctx.stroke();
      } else if (kind === 'bubbles') {
        const x = wrap(o.x * W + Math.sin(t * 0.7 + o.p) * 10, W), y = wrap(o.y * H - t * 14 * o.v, H);
        ctx.strokeStyle = 'rgba(180,240,255,0.4)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, 3 + o.s * 4, 0, 6.283); ctx.stroke();
      }
    });
    ctx.restore();
  }
};
